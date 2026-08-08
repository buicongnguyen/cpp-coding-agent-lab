#include "course_agent/model_client.hpp"

#include <stdexcept>

namespace course_agent {

namespace {

ModelResponse tool_call(std::string id, std::string name, Json arguments, std::size_t prompt_tokens = 100) {
    ModelResponse response;
    response.model = "scripted/course-model";
    response.finish_reason = "tool_calls";
    response.usage.prompt_tokens = prompt_tokens;
    response.usage.completion_tokens = 12;
    response.assistant.role = "assistant";
    response.assistant.tool_calls.push_back(ToolCall{std::move(id), std::move(name), std::move(arguments)});
    return response;
}

ModelResponse final_response(std::string content, std::size_t prompt_tokens = 180) {
    ModelResponse response;
    response.model = "scripted/course-model";
    response.finish_reason = "stop";
    response.usage.prompt_tokens = prompt_tokens;
    response.usage.completion_tokens = 32;
    response.assistant.role = "assistant";
    response.assistant.content = std::move(content);
    return response;
}

Json one_argument(const std::string& name, const std::string& value) {
    Json arguments = Json::object();
    arguments[name] = value;
    return arguments;
}

Json write_arguments(const std::string& path, const std::string& content) {
    Json arguments = Json::object();
    arguments["path"] = path;
    arguments["content"] = content;
    return arguments;
}

const char* compile_fixed_source = R"CPP(#include "calculator.hpp"

#include <stdexcept>

double add(double lhs, double rhs) {
    return lhs + rhs;
}

double divide(double lhs, double rhs) {
    if (rhs == 0.0) {
        throw std::invalid_argument("division by zero");
    }
    return static_cast<int>(lhs / rhs);
}
)CPP";

const char* fully_fixed_source = R"CPP(#include "calculator.hpp"

#include <stdexcept>

double add(double lhs, double rhs) {
    return lhs + rhs;
}

double divide(double lhs, double rhs) {
    if (rhs == 0.0) {
        throw std::invalid_argument("division by zero");
    }
    return lhs / rhs;
}
)CPP";

} // namespace

ScriptedModelClient::ScriptedModelClient(std::vector<ModelResponse> responses)
    : responses_(std::move(responses)) {}

ModelResponse ScriptedModelClient::complete(const std::vector<Message>&, const Json&) {
    if (index_ >= responses_.size()) throw std::runtime_error("Scripted model has no response for this call");
    return responses_[index_++];
}

std::unique_ptr<ScriptedModelClient> ScriptedModelClient::scenario(const std::string& name) {
    std::vector<ModelResponse> responses;

    if (name == "smoke") {
        responses.push_back(final_response("Mock model is ready.", 10));
    } else if (name == "compile-fix") {
        responses.push_back(tool_call("call-1", "run_command", one_argument("action", "configure")));
        responses.push_back(tool_call("call-2", "run_command", one_argument("action", "build"), 130));
        responses.push_back(tool_call("call-3", "read_file", one_argument("path", "src/calculator.cpp"), 180));
        responses.push_back(tool_call("call-4", "write_file", write_arguments("src/calculator.cpp", compile_fixed_source), 240));
        responses.push_back(tool_call("call-5", "run_command", one_argument("action", "build"), 300));
        responses.push_back(final_response("The compile error was corrected and the project now builds. The behavioral test has not been claimed as passing.", 340));
    } else if (name == "full-repair") {
        responses.push_back(tool_call("call-1", "run_command", one_argument("action", "configure")));
        responses.push_back(tool_call("call-2", "run_command", one_argument("action", "build"), 130));
        responses.push_back(tool_call("call-3", "read_file", one_argument("path", "src/calculator.cpp"), 180));
        responses.push_back(tool_call("call-4", "write_file", write_arguments("src/calculator.cpp", compile_fixed_source), 240));
        responses.push_back(tool_call("call-5", "run_command", one_argument("action", "build"), 300));
        responses.push_back(tool_call("call-6", "run_command", one_argument("action", "test"), 350));
        responses.push_back(tool_call("call-7", "read_file", one_argument("path", "tests/calculator_tests.cpp"), 410));
        responses.push_back(tool_call("call-8", "write_file", write_arguments("src/calculator.cpp", fully_fixed_source), 480));
        responses.push_back(tool_call("call-9", "run_command", one_argument("action", "build"), 530));
        responses.push_back(tool_call("call-10", "run_command", one_argument("action", "test"), 580));
        responses.push_back(final_response("The project builds and its test passes. The compile error and integer-division defect were both corrected.", 640));
    } else if (name == "repeated-read") {
        for (int index = 1; index <= 4; ++index) {
            responses.push_back(tool_call("repeat-" + std::to_string(index), "read_file", one_argument("path", "README.md")));
        }
    } else if (name == "empty-final") {
        responses.push_back(final_response(""));
    } else {
        throw std::runtime_error("Unknown scripted scenario: " + name);
    }

    return std::make_unique<ScriptedModelClient>(std::move(responses));
}

} // namespace course_agent
