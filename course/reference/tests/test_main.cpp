#include "course_agent/agent_loop.hpp"
#include "course_agent/json.hpp"
#include "course_agent/model_client.hpp"
#include "course_agent/tool_dispatcher.hpp"

#include <chrono>
#include <filesystem>
#include <fstream>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <vector>

namespace {

class TestFailure : public std::runtime_error {
public:
    using std::runtime_error::runtime_error;
};

void check(bool condition, const std::string& message) {
    if (!condition) throw TestFailure(message);
}

std::string error_code(const course_agent::Json& result) {
    return result.at("error").at("code").as_string();
}

course_agent::Json arguments(std::initializer_list<std::pair<std::string, std::string>> values) {
    course_agent::Json result = course_agent::Json::object();
    for (const auto& value : values) result[value.first] = value.second;
    return result;
}

std::filesystem::path unique_temp(const std::string& label) {
    const auto ticks = std::chrono::high_resolution_clock::now().time_since_epoch().count();
    return std::filesystem::temp_directory_path() / ("course_agent_" + label + "_" + std::to_string(ticks));
}

void copy_tree(const std::filesystem::path& source, const std::filesystem::path& destination) {
    std::filesystem::create_directories(destination);
    for (const auto& entry : std::filesystem::recursive_directory_iterator(source)) {
        const std::filesystem::path relative = std::filesystem::relative(entry.path(), source);
        const std::filesystem::path target = destination / relative;
        if (entry.is_directory()) std::filesystem::create_directories(target);
        else if (entry.is_regular_file()) std::filesystem::copy_file(entry.path(), target);
    }
}

class TempTree {
public:
    explicit TempTree(std::filesystem::path path) : path_(std::move(path)) {
        std::filesystem::create_directories(path_);
    }
    ~TempTree() {
        std::error_code ignored;
        std::filesystem::remove_all(path_, ignored);
    }
    const std::filesystem::path& path() const { return path_; }

private:
    std::filesystem::path path_;
};

void test_json_round_trip() {
    const std::string encoded = R"JSON({"array":[1,true,null,"line\ntext"],"name":"agent"})JSON";
    const course_agent::Json value = course_agent::Json::parse(encoded);
    check(value.at("name").as_string() == "agent", "JSON string did not parse");
    check(value.at("array").at(1).as_bool(), "JSON boolean did not parse");
    const course_agent::Json reparsed = course_agent::Json::parse(value.dump());
    check(reparsed.at("array").size() == 4, "JSON round trip changed array size");
}

void test_tool_boundaries() {
    TempTree tree(unique_temp("tools"));
    std::filesystem::create_directories(tree.path() / "src");
    {
        std::ofstream output(tree.path() / "README.md");
        output << "hello";
    }

    const course_agent::ToolDispatcher tools(tree.path());
    const course_agent::Json read = tools.execute({"read-1", "read_file", arguments({{"path", "README.md"}})});
    check(read.at("ok").as_bool(), "Valid file read failed");
    check(read.at("data").at("content").as_string() == "hello", "Read content was incorrect");

    const course_agent::Json escape = tools.execute({"read-2", "read_file", arguments({{"path", "../outside.txt"}})});
    check(!escape.at("ok").as_bool(), "Workspace traversal was not rejected");
    check(error_code(escape) == "path_outside_workspace", "Workspace traversal returned the wrong error code");

    course_agent::Json malformed_arguments = course_agent::Json::object();
    malformed_arguments["path"] = "README.md";
    malformed_arguments["unexpected"] = true;
    const course_agent::Json malformed = tools.execute({"read-3", "read_file", std::move(malformed_arguments)});
    check(!malformed.at("ok").as_bool(), "Unexpected tool argument was not rejected");
    check(error_code(malformed) == "invalid_arguments", "Malformed arguments returned the wrong error code");

    const course_agent::Json unknown = tools.execute({"unknown-1", "delete_everything", course_agent::Json::object()});
    check(!unknown.at("ok").as_bool(), "Unknown tool was not rejected");
    check(error_code(unknown) == "unknown_tool", "Unknown tool returned the wrong error code");

    const course_agent::Json write = tools.execute({"write-1", "write_file", arguments({{"path", "src/new.cpp"}, {"content", "int x = 1;\n"}})});
    check(write.at("ok").as_bool(), "Valid file write failed: " + write.dump());
    check(std::filesystem::is_regular_file(tree.path() / "src" / "new.cpp"), "Written file is missing");

    const course_agent::Json list = tools.execute({"list-1", "list_files", arguments({{"path", "."}})});
    check(list.at("ok").as_bool(), "File listing failed");
    check(list.at("data").at("count").as_number() >= 2.0, "File listing omitted expected files");

    TempTree list_tree(unique_temp("list_limit"));
    {
        std::ofstream(list_tree.path() / "b.txt") << "b";
        std::ofstream(list_tree.path() / "a.txt") << "a";
    }
    course_agent::ToolLimits list_limits;
    list_limits.max_list_entries = 2;
    const course_agent::ToolDispatcher limited_tools(list_tree.path(), list_limits);
    const course_agent::Json exact_list = limited_tools.execute({"list-2", "list_files", arguments({{"path", "."}})});
    check(!exact_list.at("data").at("truncated").as_bool(), "Exact-limit listing was incorrectly truncated");
    std::ofstream(list_tree.path() / "c.txt") << "c";
    const course_agent::Json over_list = limited_tools.execute({"list-3", "list_files", arguments({{"path", "."}})});
    check(over_list.at("data").at("truncated").as_bool(), "Over-limit listing did not report truncation");
    check(over_list.at("data").at("count").as_number() == 2.0, "Over-limit listing returned too many files");

    const course_agent::Json denied = tools.execute({"command-1", "run_command", arguments({{"action", "delete"}})});
    check(!denied.at("ok").as_bool(), "Unapproved command action was accepted");

    const course_agent::Json definitions = tools.definitions();
    check(definitions.is_array() && definitions.size() == 4, "Expected four tool definitions");
}

void test_full_repair_loop() {
    TempTree tree(unique_temp("repair"));
    const std::filesystem::path fixture = std::filesystem::path(COURSE_SOURCE_DIR).parent_path() / "fixture" / "buggy_calculator";
    copy_tree(fixture, tree.path());

    auto model = course_agent::ScriptedModelClient::scenario("full-repair");
    const course_agent::ToolDispatcher tools(tree.path());
    const course_agent::AgentLoop loop(*model, tools);
    std::vector<course_agent::TraceEvent> events;

    const course_agent::LoopResult result = loop.run(
        "Use tools and require build and test evidence.",
        "Repair the project.",
        [&](const course_agent::TraceEvent& event) { events.push_back(event); });

    check(result.completed, "Full repair scenario did not complete: " + result.stop_reason);
    check(result.tool_calls == 10, "Unexpected tool-call count in full repair");
    check(!events.empty(), "Agent loop emitted no trace events");
    check(events.front().kind == "model_request", "Trace did not begin with a model request");
    for (std::size_t index = 1; index < events.size(); ++index) {
        check(events[index].elapsed_ms >= events[index - 1].elapsed_ms, "Trace elapsed time moved backwards");
    }

    for (std::size_t index = 0; index < result.history.size(); ++index) {
        const auto& message = result.history[index];
        if (message.role != "assistant") continue;
        for (const auto& call : message.tool_calls) {
            bool found = false;
            for (std::size_t later = index + 1; later < result.history.size(); ++later) {
                if (result.history[later].role == "tool" && result.history[later].tool_call_id == call.id) {
                    found = true;
                    break;
                }
            }
            check(found, "Tool call was not correlated with a result: " + call.id);
        }
    }

    const course_agent::Json test = tools.execute({"verify", "run_command", arguments({{"action", "test"}})});
    check(test.at("ok").as_bool(), "Verification test tool did not execute");
    check(test.at("data").at("exit_code").as_number() == 0.0, "Repaired fixture tests did not pass");
}

void test_repeated_call_stop() {
    TempTree tree(unique_temp("repeat"));
    {
        std::ofstream output(tree.path() / "README.md");
        output << "repeat";
    }
    auto model = course_agent::ScriptedModelClient::scenario("repeated-read");
    const course_agent::ToolDispatcher tools(tree.path());
    course_agent::LoopConfig config;
    config.repeated_call_limit = 2;
    const course_agent::AgentLoop loop(*model, tools, config);
    const course_agent::LoopResult result = loop.run("system", "user");
    check(!result.completed, "Repeated-call scenario should not complete");
    check(result.stop_reason == "repeated_tool_call", "Repeated call stopped for the wrong reason");
}

void test_empty_final_stop() {
    TempTree tree(unique_temp("empty_final"));
    auto model = course_agent::ScriptedModelClient::scenario("empty-final");
    const course_agent::ToolDispatcher tools(tree.path());
    const course_agent::AgentLoop loop(*model, tools);
    const course_agent::LoopResult result = loop.run("system", "user");
    check(!result.completed, "Empty assistant content should not complete the loop");
    check(result.stop_reason == "empty_final_response", "Empty assistant content stopped for the wrong reason");
}

} // namespace

int main() {
    const std::vector<std::pair<std::string, std::function<void()>>> tests = {
        {"json_round_trip", test_json_round_trip},
        {"tool_boundaries", test_tool_boundaries},
        {"full_repair_loop", test_full_repair_loop},
        {"repeated_call_stop", test_repeated_call_stop},
        {"empty_final_stop", test_empty_final_stop},
    };

    int failures = 0;
    for (const auto& test : tests) {
        try {
            test.second();
            std::cout << "PASS " << test.first << '\n';
        } catch (const std::exception& error) {
            ++failures;
            std::cerr << "FAIL " << test.first << ": " << error.what() << '\n';
        }
    }
    if (failures != 0) std::cerr << failures << " test(s) failed\n";
    return failures == 0 ? 0 : 1;
}
