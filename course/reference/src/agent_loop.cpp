#include "course_agent/agent_loop.hpp"

#include <set>
#include <sstream>

namespace course_agent {

namespace {

void add_usage(Usage& total, const Usage& value) {
    total.prompt_tokens += value.prompt_tokens;
    total.completion_tokens += value.completion_tokens;
    total.reasoning_tokens += value.reasoning_tokens;
    total.cached_tokens += value.cached_tokens;
    total.cost += value.cost;
}

void emit(const TraceSink& sink, TraceEvent event) {
    if (sink) sink(event);
}

std::string call_signature(const ToolCall& call) {
    return call.name + ":" + call.arguments.dump();
}

bool tool_succeeded(const Json& result) {
    return result.is_object() && result.contains("ok") && result.at("ok").is_bool() && result.at("ok").as_bool();
}

std::string authorization_outcome(const Json& result) {
    if (tool_succeeded(result)) return "allowed";
    if (!result.is_object() || !result.contains("error") || !result.at("error").is_object()
        || !result.at("error").contains("code")) {
        return "not_evaluated";
    }

    const std::string code = result.at("error").at("code").string_or("");
    if (code == "approval_required" || code == "approval_denied") return "rejected";
    if (code == "read_failed" || code == "write_failed") return "allowed";
    return "not_evaluated";
}

bool command_succeeded(const Json& result) {
    return tool_succeeded(result) && result.contains("data") && result.at("data").is_object()
        && result.at("data").contains("exit_code") && result.at("data").at("exit_code").number_or(-1.0) == 0.0;
}

} // namespace

AgentLoop::AgentLoop(ModelClient& model, const ToolDispatcher& tools, LoopConfig config)
    : model_(model), tools_(tools), config_(config) {}

LoopResult AgentLoop::run(
    const std::string& system_prompt,
    const std::string& user_prompt,
    TraceSink trace,
    CancelCheck cancelled) const {

    LoopResult result;
    result.history.push_back(Message{"system", system_prompt});
    result.history.push_back(Message{"user", user_prompt});

    const auto started = std::chrono::steady_clock::now();
    const auto started_at = std::chrono::system_clock::now();
    const auto started_at_ms = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
        started_at.time_since_epoch()).count());
    const std::string run_id = "run-" + std::to_string(started_at_ms);
    const auto emit_event = [&](TraceEvent event) {
        event.elapsed_ms = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - started).count());
        event.run_id = run_id;
        event.timestamp_ms = started_at_ms + event.elapsed_ms;
        emit(trace, std::move(event));
    };
    const auto stop_requested = [&]() -> std::string {
        if (cancelled && cancelled()) return "user_cancelled";
        if (std::chrono::steady_clock::now() - started > config_.wall_clock_limit) return "wall_clock_limit";
        return {};
    };
    std::string previous_signature;
    std::size_t consecutive_identical_calls = 0;
    std::set<std::string> seen_call_ids;
    bool passing_build_after_write = false;
    bool passing_test_after_write = false;

    for (std::size_t iteration = 1; iteration <= config_.max_iterations; ++iteration) {
        result.iterations = iteration;

        if (const std::string stop = stop_requested(); !stop.empty()) {
            result.stop_reason = stop;
            emit_event(TraceEvent{iteration, "stop", result.stop_reason});
            return result;
        }

        ModelResponse response;
        Json request_detail = Json::object();
        request_detail["message_count"] = result.history.size();
        request_detail["tool_definition_count"] = tools_.definitions().size();
        TraceEvent request_event{iteration, "model_request", request_detail.dump()};
        request_event.status = "sent";
        emit_event(std::move(request_event));
        const auto model_started = std::chrono::steady_clock::now();
        try {
            response = model_.complete(result.history, tools_.definitions());
        } catch (const std::exception& error) {
            result.stop_reason = "model_error";
            TraceEvent error_event{iteration, "model_error", error.what()};
            error_event.status = "error";
            error_event.duration_ms = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::steady_clock::now() - model_started).count());
            emit_event(std::move(error_event));
            return result;
        }

        add_usage(result.cumulative_usage, response.usage);
        Json response_detail = Json::object();
        response_detail["content"] = response.assistant.content;
        response_detail["finish_reason"] = response.finish_reason;
        response_detail["model"] = response.model;
        response_detail["tool_call_count"] = response.assistant.tool_calls.size();
        TraceEvent response_event{iteration, "model_response", response_detail.dump(), {}, {}, response.usage};
        response_event.model = response.model;
        response_event.finish_reason = response.finish_reason;
        response_event.status = "ok";
        response_event.duration_ms = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - model_started).count());
        emit_event(std::move(response_event));

        if (response.assistant.role != "assistant") {
            result.stop_reason = "protocol_error";
            emit_event(TraceEvent{iteration, "protocol_error", "Model response role must be assistant."});
            return result;
        }
        for (const ToolCall& call : response.assistant.tool_calls) {
            if (call.id.empty() || call.name.empty() || !seen_call_ids.insert(call.id).second) {
                result.stop_reason = "protocol_error";
                emit_event(TraceEvent{iteration, "protocol_error", "Tool call IDs and names must be non-empty and IDs must be unique.", call.name, call.id});
                return result;
            }
        }
        result.history.push_back(response.assistant);

        if (response.assistant.tool_calls.empty()) {
            if (response.assistant.content.empty()) {
                result.stop_reason = "empty_final_response";
                emit_event(TraceEvent{iteration, "stop", result.stop_reason});
                return result;
            }
            if (config_.require_build_and_test_evidence && !(passing_build_after_write && passing_test_after_write)) {
                result.stop_reason = "missing_completion_evidence";
                emit_event(TraceEvent{iteration, "stop", result.stop_reason});
                return result;
            }
            result.completed = true;
            result.stop_reason = "completed";
            result.final_text = response.assistant.content;
            emit_event(TraceEvent{iteration, "final", result.final_text});
            return result;
        }

        for (const ToolCall& call : response.assistant.tool_calls) {
            if (const std::string stop = stop_requested(); !stop.empty()) {
                result.stop_reason = stop;
                emit_event(TraceEvent{iteration, "stop", result.stop_reason, call.name, call.id});
                return result;
            }
            if (result.tool_calls >= config_.max_tool_calls) {
                result.stop_reason = "tool_call_limit";
                emit_event(TraceEvent{iteration, "stop", result.stop_reason, call.name, call.id});
                return result;
            }
            ++result.tool_calls;

            const std::string signature = call_signature(call);
            if (signature == previous_signature) ++consecutive_identical_calls;
            else {
                previous_signature = signature;
                consecutive_identical_calls = 1;
            }
            if (consecutive_identical_calls > config_.repeated_call_limit) {
                result.stop_reason = "repeated_tool_call";
                emit_event(TraceEvent{iteration, "stop", result.stop_reason, call.name, call.id});
                return result;
            }

            TraceEvent tool_request{iteration, "tool_request", call.arguments.dump(), call.name, call.id};
            tool_request.authorization = "pending_dispatcher";
            tool_request.status = "requested";
            emit_event(std::move(tool_request));
            const auto tool_started = std::chrono::steady_clock::now();
            const Json tool_result = tools_.execute(call);
            const auto tool_duration = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::steady_clock::now() - tool_started).count());

            if (call.name == "write_file" && tool_succeeded(tool_result)) {
                passing_build_after_write = false;
                passing_test_after_write = false;
            } else if (call.name == "run_command" && call.arguments.is_object() && call.arguments.contains("action")) {
                const std::string action = call.arguments.at("action").string_or("");
                if (action == "build") {
                    passing_build_after_write = command_succeeded(tool_result);
                    passing_test_after_write = false;
                } else if (action == "test") {
                    passing_test_after_write = passing_build_after_write && command_succeeded(tool_result);
                }
            }

            Message observation;
            observation.role = "tool";
            observation.content = tool_result.dump();
            observation.tool_call_id = call.id;
            observation.name = call.name;
            result.history.push_back(std::move(observation));

            TraceEvent tool_event{iteration, "tool_result", tool_result.dump(), call.name, call.id};
            tool_event.authorization = authorization_outcome(tool_result);
            tool_event.status = tool_succeeded(tool_result) ? "ok" : "error";
            tool_event.duration_ms = tool_duration;
            emit_event(std::move(tool_event));
        }
    }

    result.stop_reason = "iteration_limit";
    emit_event(TraceEvent{config_.max_iterations, "stop", result.stop_reason});
    return result;
}

Json trace_event_to_json(const TraceEvent& event) {
    Json result = Json::object();
    result["iteration"] = event.iteration;
    result["kind"] = event.kind;
    result["detail"] = event.detail;
    result["elapsed_ms"] = static_cast<double>(event.elapsed_ms);
    if (!event.tool_name.empty()) result["tool"] = event.tool_name;
    if (!event.tool_call_id.empty()) result["tool_call_id"] = event.tool_call_id;
    if (!event.run_id.empty()) result["run_id"] = event.run_id;
    if (event.timestamp_ms != 0) result["timestamp_ms"] = static_cast<double>(event.timestamp_ms);
    if (!event.model.empty()) result["model"] = event.model;
    if (!event.finish_reason.empty()) result["finish_reason"] = event.finish_reason;
    if (!event.authorization.empty()) result["authorization"] = event.authorization;
    if (!event.status.empty()) result["status"] = event.status;
    result["duration_ms"] = static_cast<double>(event.duration_ms);

    Json usage = Json::object();
    usage["prompt_tokens"] = event.usage.prompt_tokens;
    usage["completion_tokens"] = event.usage.completion_tokens;
    usage["reasoning_tokens"] = event.usage.reasoning_tokens;
    usage["cached_tokens"] = event.usage.cached_tokens;
    usage["cost"] = event.usage.cost;
    result["usage"] = std::move(usage);
    return result;
}

} // namespace course_agent
