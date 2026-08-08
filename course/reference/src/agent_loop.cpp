#include "course_agent/agent_loop.hpp"

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
    const auto emit_event = [&](TraceEvent event) {
        event.elapsed_ms = static_cast<std::uint64_t>(std::chrono::duration_cast<std::chrono::milliseconds>(
            std::chrono::steady_clock::now() - started).count());
        emit(trace, std::move(event));
    };
    std::string previous_signature;
    std::size_t consecutive_identical_calls = 0;

    for (std::size_t iteration = 1; iteration <= config_.max_iterations; ++iteration) {
        result.iterations = iteration;

        if (cancelled && cancelled()) {
            result.stop_reason = "user_cancelled";
            emit_event(TraceEvent{iteration, "stop", result.stop_reason});
            return result;
        }

        if (std::chrono::steady_clock::now() - started > config_.wall_clock_limit) {
            result.stop_reason = "wall_clock_limit";
            emit_event(TraceEvent{iteration, "stop", result.stop_reason});
            return result;
        }

        ModelResponse response;
        Json request_detail = Json::object();
        request_detail["message_count"] = result.history.size();
        request_detail["tool_definition_count"] = tools_.definitions().size();
        emit_event(TraceEvent{iteration, "model_request", request_detail.dump()});
        try {
            response = model_.complete(result.history, tools_.definitions());
        } catch (const std::exception& error) {
            result.stop_reason = "model_error";
            emit_event(TraceEvent{iteration, "model_error", error.what()});
            return result;
        }

        add_usage(result.cumulative_usage, response.usage);
        Json response_detail = Json::object();
        response_detail["content"] = response.assistant.content;
        response_detail["finish_reason"] = response.finish_reason;
        response_detail["model"] = response.model;
        response_detail["tool_call_count"] = response.assistant.tool_calls.size();
        emit_event(TraceEvent{iteration, "model_response", response_detail.dump(), {}, {}, response.usage});
        result.history.push_back(response.assistant);

        if (response.assistant.tool_calls.empty()) {
            if (response.assistant.content.empty()) {
                result.stop_reason = "empty_final_response";
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
            if (++result.tool_calls > config_.max_tool_calls) {
                result.stop_reason = "tool_call_limit";
                emit_event(TraceEvent{iteration, "stop", result.stop_reason, call.name, call.id});
                return result;
            }

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

            emit_event(TraceEvent{iteration, "tool_request", call.arguments.dump(), call.name, call.id});
            const Json tool_result = tools_.execute(call);

            Message observation;
            observation.role = "tool";
            observation.content = tool_result.dump();
            observation.tool_call_id = call.id;
            observation.name = call.name;
            result.history.push_back(std::move(observation));

            emit_event(TraceEvent{iteration, "tool_result", tool_result.dump(), call.name, call.id});
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
    result["elapsed_ms"] = event.elapsed_ms;
    if (!event.tool_name.empty()) result["tool"] = event.tool_name;
    if (!event.tool_call_id.empty()) result["tool_call_id"] = event.tool_call_id;

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
