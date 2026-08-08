#include "course_agent/model_client.hpp"

#include <stdexcept>

namespace course_agent {

OpenRouterModelClient::OpenRouterModelClient(std::string api_key, std::string model)
    : api_key_(std::move(api_key)), model_(std::move(model)) {
    if (api_key_.empty()) throw std::runtime_error("OPENROUTER_API_KEY is required for live mode");
    if (model_.empty()) throw std::runtime_error("OPENROUTER_MODEL is required for live mode");
}

ModelResponse OpenRouterModelClient::complete(const std::vector<Message>& messages, const Json& tools) {
    Json encoded_messages = Json::array();
    for (const Message& message : messages) encoded_messages.push_back(message_to_json(message));

    Json body = Json::object();
    body["model"] = model_;
    body["messages"] = std::move(encoded_messages);
    if (tools.is_array() && !tools.as_array().empty()) {
        body["tools"] = tools;
        body["tool_choice"] = "auto";
        body["parallel_tool_calls"] = false;
    }

    const std::vector<std::string> headers = {
        "Authorization: Bearer " + api_key_,
        "Content-Type: application/json",
        "X-OpenRouter-Title: C++ Coding Agent Workshop"
    };
    const std::string response_text = http_post_json(
        "openrouter.ai",
        "/api/v1/chat/completions",
        headers,
        body.dump(),
        90);

    return model_response_from_json(Json::parse(response_text));
}

} // namespace course_agent

