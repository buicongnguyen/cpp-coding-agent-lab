#include "course_agent/agent_loop.hpp"
#include "course_agent/model_client.hpp"
#include "course_agent/tool_dispatcher.hpp"

#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <memory>
#include <stdexcept>
#include <string>
#include <utility>
#include <vector>

namespace {

const char* default_system_prompt = R"PROMPT(You are a small educational C++ coding agent.
Use tools to inspect evidence before making claims.
Work only inside the supplied workshop workspace.
Use run_command actions to configure, build, and test.
Make the smallest appropriate source change.
Do not claim success unless the latest build and requested tests succeeded.
When finished, report the evidence concisely.)PROMPT";

std::string environment(const char* name) {
#ifdef _WIN32
    char* value = nullptr;
    std::size_t size = 0;
    if (_dupenv_s(&value, &size, name) != 0 || value == nullptr) return "";
    const std::string result(value);
    std::free(value);
    return result;
#else
    const char* value = std::getenv(name);
    return value ? value : "";
#endif
}

void replace_all(std::string& value, const std::string& from, const std::string& to) {
    if (from.empty()) return;
    std::size_t position = 0;
    while ((position = value.find(from, position)) != std::string::npos) {
        value.replace(position, from.size(), to);
        position += to.size();
    }
}

void redact_json_strings(
    course_agent::Json& value,
    const std::vector<std::pair<std::string, std::string>>& replacements) {
    if (value.is_string()) {
        std::string text = value.as_string();
        for (const auto& replacement : replacements) replace_all(text, replacement.first, replacement.second);
        value = course_agent::Json(std::move(text));
    } else if (value.is_array()) {
        for (course_agent::Json& item : value.as_array()) redact_json_strings(item, replacements);
    } else if (value.is_object()) {
        for (auto& item : value.as_object()) redact_json_strings(item.second, replacements);
    }
}

std::string redact_detail(
    const std::string& detail,
    const std::vector<std::pair<std::string, std::string>>& replacements) {
    try {
        course_agent::Json parsed = course_agent::Json::parse(detail);
        redact_json_strings(parsed, replacements);
        return parsed.dump();
    } catch (const std::exception&) {
        std::string result = detail;
        for (const auto& replacement : replacements) replace_all(result, replacement.first, replacement.second);
        return result;
    }
}

void usage() {
    std::cerr
        << "Usage:\n"
        << "  coding_agent --mock --workspace PATH [--scenario full-repair] [--trace PATH]\n"
        << "  coding_agent --live --workspace PATH --prompt TEXT [--trace PATH]\n";
}

} // namespace

int main(int argc, char** argv) {
    try {
        bool live = false;
        bool mock = false;
        std::filesystem::path workspace;
        std::filesystem::path trace_path;
        std::string scenario = "full-repair";
        std::string prompt = "Configure, build, test, and repair this project. Use the smallest appropriate changes.";

        for (int index = 1; index < argc; ++index) {
            const std::string argument = argv[index];
            if (argument == "--live") live = true;
            else if (argument == "--mock") mock = true;
            else if (argument == "--workspace" && index + 1 < argc) workspace = argv[++index];
            else if (argument == "--scenario" && index + 1 < argc) scenario = argv[++index];
            else if (argument == "--prompt" && index + 1 < argc) prompt = argv[++index];
            else if (argument == "--trace" && index + 1 < argc) trace_path = argv[++index];
            else {
                usage();
                return 64;
            }
        }

        if (live == mock || workspace.empty()) {
            usage();
            return 64;
        }

        std::unique_ptr<course_agent::ModelClient> model;
        if (mock) {
            model = course_agent::ScriptedModelClient::scenario(scenario);
        } else {
            model = std::make_unique<course_agent::OpenRouterModelClient>(
                environment("OPENROUTER_API_KEY"),
                environment("OPENROUTER_MODEL"));
        }

        const std::string configured_system = environment("COURSE_AGENT_SYSTEM_PROMPT");
        const std::string system_prompt = configured_system.empty() ? default_system_prompt : configured_system;
        const course_agent::ToolDispatcher tools(workspace);
        const course_agent::AgentLoop loop(*model, tools);
        const std::filesystem::path normalized_workspace = std::filesystem::weakly_canonical(workspace);
        const std::string native_workspace = normalized_workspace.string();
        const std::string generic_workspace = normalized_workspace.generic_string();
        std::vector<std::pair<std::string, std::string>> trace_replacements = {
            {native_workspace, "<WORKSPACE>"},
            {generic_workspace, "<WORKSPACE>"},
        };
        const std::string api_key = environment("OPENROUTER_API_KEY");
        if (!api_key.empty()) trace_replacements.push_back({api_key, "<REDACTED_SECRET>"});

        std::ofstream trace_file;
        if (!trace_path.empty()) {
            trace_file.open(trace_path, std::ios::out | std::ios::trunc);
            if (!trace_file) throw std::runtime_error("Could not open trace output: " + trace_path.string());
        }

        const course_agent::LoopResult result = loop.run(
            system_prompt,
            prompt,
            [&trace_file, &trace_replacements](const course_agent::TraceEvent& event) {
                course_agent::TraceEvent portable_event = event;
                portable_event.detail = redact_detail(portable_event.detail, trace_replacements);
                const std::string line = course_agent::trace_event_to_json(portable_event).dump();
                std::cout << line << '\n';
                if (trace_file) trace_file << line << '\n';
            });

        course_agent::Json summary = course_agent::Json::object();
        summary["completed"] = result.completed;
        summary["stop_reason"] = result.stop_reason;
        summary["iterations"] = result.iterations;
        summary["tool_calls"] = result.tool_calls;
        summary["final"] = redact_detail(result.final_text, trace_replacements);
        summary["prompt_tokens"] = result.cumulative_usage.prompt_tokens;
        summary["completion_tokens"] = result.cumulative_usage.completion_tokens;
        summary["cost"] = result.cumulative_usage.cost;
        std::cout << summary.dump(2) << '\n';
        return result.completed ? 0 : 2;
    } catch (const std::exception& error) {
        std::cerr << "coding_agent: " << error.what() << '\n';
        return 1;
    }
}
