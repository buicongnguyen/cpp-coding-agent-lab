#pragma once

#include "course_agent/types.hpp"

#include <cstddef>
#include <memory>
#include <string>
#include <vector>

namespace course_agent {

class ModelClient {
public:
    virtual ~ModelClient() = default;
    virtual ModelResponse complete(const std::vector<Message>& messages, const Json& tools) = 0;
};

class ScriptedModelClient final : public ModelClient {
public:
    explicit ScriptedModelClient(std::vector<ModelResponse> responses);
    ModelResponse complete(const std::vector<Message>& messages, const Json& tools) override;
    std::size_t calls() const { return index_; }

    static std::unique_ptr<ScriptedModelClient> scenario(const std::string& name);

private:
    std::vector<ModelResponse> responses_;
    std::size_t index_ = 0;
};

class OpenRouterModelClient final : public ModelClient {
public:
    OpenRouterModelClient(std::string api_key, std::string model);
    ModelResponse complete(const std::vector<Message>& messages, const Json& tools) override;

private:
    std::string api_key_;
    std::string model_;
};

std::string http_post_json(
    const std::string& host,
    const std::string& path,
    const std::vector<std::string>& headers,
    const std::string& body,
    int timeout_seconds);

} // namespace course_agent

