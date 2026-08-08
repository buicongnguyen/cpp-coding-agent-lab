#pragma once

#include "course_agent/json.hpp"

#include <cstddef>
#include <string>
#include <vector>

namespace course_agent {

struct ToolCall {
    std::string id;
    std::string name;
    Json arguments = Json::object();
};

struct Message {
    std::string role;
    std::string content;
    std::vector<ToolCall> tool_calls;
    std::string tool_call_id;
    std::string name;
};

struct Usage {
    std::size_t prompt_tokens = 0;
    std::size_t completion_tokens = 0;
    std::size_t reasoning_tokens = 0;
    std::size_t cached_tokens = 0;
    double cost = 0.0;
};

struct ModelResponse {
    Message assistant;
    std::string finish_reason;
    std::string model;
    Usage usage;
};

Json message_to_json(const Message& message);
Message assistant_message_from_json(const Json& value);
ModelResponse model_response_from_json(const Json& value);

} // namespace course_agent

