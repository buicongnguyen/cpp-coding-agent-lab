#include "course_agent/model_client.hpp"

#include <cstdlib>
#include <filesystem>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

namespace {

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

} // namespace

int main(int argc, char** argv) {
    const bool live = argc > 1 && std::string(argv[1]) == "--live";
    const std::string key = environment("OPENROUTER_API_KEY");
    const std::string model_name = environment("OPENROUTER_MODEL");

    std::cout << "C++ standard: " << __cplusplus << '\n';
    std::cout << "Current directory: " << std::filesystem::current_path().string() << '\n';
    std::cout << "Mode: " << (live ? "live" : "deterministic") << '\n';
    std::cout << "OPENROUTER_API_KEY present: " << (!key.empty() ? "yes" : "no") << '\n';
    std::cout << "OPENROUTER_MODEL: " << (model_name.empty() ? "<not set>" : model_name) << '\n';

    try {
        std::unique_ptr<course_agent::ModelClient> client;
        if (live) client = std::make_unique<course_agent::OpenRouterModelClient>(key, model_name);
        else client = course_agent::ScriptedModelClient::scenario("smoke");

        std::vector<course_agent::Message> messages;
        messages.push_back(course_agent::Message{"user", "Reply with a short preflight confirmation."});
        const course_agent::ModelResponse response = client->complete(messages, course_agent::Json::array());

        std::cout << "Model used: " << response.model << '\n';
        std::cout << "Finish reason: " << response.finish_reason << '\n';
        std::cout << "Prompt tokens: " << response.usage.prompt_tokens << '\n';
        std::cout << "Completion tokens: " << response.usage.completion_tokens << '\n';
        std::cout << "Response: " << response.assistant.content << '\n';
        return 0;
    } catch (const std::exception& error) {
        std::cerr << "Preflight failed: " << error.what() << '\n';
        return 1;
    }
}
