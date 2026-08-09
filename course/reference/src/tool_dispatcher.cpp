#include "course_agent/tool_dispatcher.hpp"

#include "course_agent/process.hpp"

#include <algorithm>
#include <cctype>
#include <cstdlib>
#include <fstream>
#include <set>
#include <sstream>
#include <stdexcept>
#include <utility>

namespace course_agent {

namespace {

class ToolRequestError final : public std::runtime_error {
public:
    ToolRequestError(std::string code, const std::string& message)
        : std::runtime_error(message), code_(std::move(code)) {}

    const std::string& code() const { return code_; }

private:
    std::string code_;
};

std::string required_string(const Json& arguments, const std::string& key) {
    if (!arguments.is_object()) throw ToolRequestError("invalid_arguments", "Tool arguments must be an object");
    if (!arguments.contains(key) || !arguments.at(key).is_string()) {
        throw ToolRequestError("invalid_arguments", "Missing or non-string argument: " + key);
    }
    return arguments.at(key).as_string();
}

void require_only(const Json& arguments, const std::set<std::string>& allowed) {
    if (!arguments.is_object()) throw ToolRequestError("invalid_arguments", "Tool arguments must be an object");
    for (const auto& item : arguments.as_object()) {
        if (allowed.find(item.first) == allowed.end()) {
            throw ToolRequestError("invalid_arguments", "Unexpected argument: " + item.first);
        }
    }
}

std::string lower_for_comparison(std::string value) {
#ifdef _WIN32
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char ch) { return static_cast<char>(std::tolower(ch)); });
#endif
    return value;
}

bool is_component_prefix(const std::filesystem::path& prefix, const std::filesystem::path& value) {
    auto prefix_it = prefix.begin();
    auto value_it = value.begin();
    for (; prefix_it != prefix.end(); ++prefix_it, ++value_it) {
        if (value_it == value.end()) return false;
        if (lower_for_comparison(prefix_it->string()) != lower_for_comparison(value_it->string())) return false;
    }
    return true;
}

Json function_tool(const std::string& name, const std::string& description, Json properties, Json required) {
    Json parameters = Json::object();
    parameters["type"] = "object";
    parameters["properties"] = std::move(properties);
    parameters["required"] = std::move(required);
    parameters["additionalProperties"] = false;

    Json function = Json::object();
    function["name"] = name;
    function["description"] = description;
    function["parameters"] = std::move(parameters);

    Json tool = Json::object();
    tool["type"] = "function";
    tool["function"] = std::move(function);
    return tool;
}

Json string_property(const std::string& description) {
    Json property = Json::object();
    property["type"] = "string";
    property["description"] = description;
    return property;
}

Json required_fields(std::initializer_list<const char*> names) {
    Json result = Json::array();
    for (const char* name : names) result.push_back(name);
    return result;
}

std::string environment_or(const char* name, const char* fallback) {
#ifdef _WIN32
    char* value = nullptr;
    std::size_t length = 0;
    if (_dupenv_s(&value, &length, name) != 0 || !value || !*value) {
        std::free(value);
        return fallback;
    }
    const std::string result(value);
    std::free(value);
    return result;
#else
    const char* value = std::getenv(name);
    return value && *value ? value : fallback;
#endif
}

} // namespace

Json tool_success(Json data) {
    Json result = Json::object();
    result["ok"] = true;
    result["data"] = std::move(data);
    result["error"] = Json(nullptr);
    return result;
}

Json tool_failure(const std::string& code, const std::string& message) {
    Json error = Json::object();
    error["code"] = code;
    error["message"] = message;

    Json result = Json::object();
    result["ok"] = false;
    result["data"] = Json(nullptr);
    result["error"] = std::move(error);
    return result;
}

ToolDispatcher::ToolDispatcher(std::filesystem::path workspace, ToolLimits limits, ToolPolicy policy)
    : limits_(limits), policy_(std::move(policy)) {
    if (workspace.empty()) throw std::runtime_error("Workspace path must not be empty");
    workspace_ = std::filesystem::weakly_canonical(std::filesystem::absolute(std::move(workspace)));
    if (!std::filesystem::is_directory(workspace_)) throw std::runtime_error("Workspace is not a directory");
}

Json ToolDispatcher::definitions() const {
    Json tools = Json::array();

    Json read_properties = Json::object();
    read_properties["path"] = string_property("UTF-8 text file path relative to the workshop workspace.");
    tools.push_back(function_tool(
        "read_file",
        "Read a bounded UTF-8 text file inside the workshop workspace. Returns structured success or error data.",
        std::move(read_properties),
        required_fields({"path"})));

    Json write_properties = Json::object();
    write_properties["path"] = string_property("Existing or new text file path relative to the workshop workspace.");
    write_properties["content"] = string_property("Complete UTF-8 text content to write, within the workshop size limit.");
    tools.push_back(function_tool(
        "write_file",
        "Write bounded UTF-8 text inside the workshop workspace. The parent directory must already exist.",
        std::move(write_properties),
        required_fields({"path", "content"})));

    Json command_properties = Json::object();
    Json action = string_property("Approved build action selected by symbolic name; never a shell command.");
    Json action_enum = Json::array();
    action_enum.push_back("configure");
    action_enum.push_back("build");
    action_enum.push_back("test");
    action["enum"] = std::move(action_enum);
    command_properties["action"] = std::move(action);
    tools.push_back(function_tool(
        "run_command",
        "Run one approved configure, build, or test action in the workspace with a timeout and bounded output.",
        std::move(command_properties),
        required_fields({"action"})));

    Json list_properties = Json::object();
    list_properties["path"] = string_property("Directory path relative to the workshop workspace; use '.' for the root.");
    tools.push_back(function_tool(
        "list_files",
        "List a bounded number of regular files below a workspace-relative directory without following paths outside the workspace.",
        std::move(list_properties),
        required_fields({"path"})));

    return tools;
}

std::filesystem::path ToolDispatcher::resolve_inside_workspace(const std::string& relative_path) const {
    if (relative_path.empty()) throw ToolRequestError("invalid_arguments", "Path must not be empty");
    const std::filesystem::path supplied(relative_path);
    if (supplied.is_absolute() || supplied.has_root_name()) {
        throw ToolRequestError("path_outside_workspace", "Absolute paths are not allowed");
    }

    const std::filesystem::path combined = (workspace_ / supplied).lexically_normal();
    std::filesystem::path candidate;
    try {
        if (std::filesystem::exists(combined)) {
            candidate = std::filesystem::canonical(combined);
        } else {
            candidate = std::filesystem::canonical(combined.parent_path()) / combined.filename();
        }
    } catch (const std::filesystem::filesystem_error&) {
        throw ToolRequestError("path_not_found", "The requested path has no accessible existing parent.");
    }
    if (!is_component_prefix(workspace_, candidate)) {
        throw ToolRequestError("path_outside_workspace", "Path is outside the workshop workspace");
    }
    return candidate;
}

Json ToolDispatcher::execute(const ToolCall& call) const {
    try {
        if (call.name == "read_file") return read_file(call.arguments);
        if (call.name == "write_file") {
            require_only(call.arguments, {"path", "content"});
            const std::filesystem::path path = resolve_inside_workspace(required_string(call.arguments, "path"));
            const std::string content = required_string(call.arguments, "content");
            if (content.size() > limits_.max_write_bytes) {
                return tool_failure("content_too_large", "The requested content exceeds the write limit.");
            }
            if (!std::filesystem::is_directory(path.parent_path())) {
                return tool_failure("parent_missing", "The destination parent directory does not exist.");
            }

            ToolCall normalized = call;
            const std::filesystem::path normalized_relative = path.lexically_relative(workspace_);
            if (normalized_relative.empty() || *normalized_relative.begin() == "..") {
                return tool_failure("path_outside_workspace", "The normalized write path is outside the workshop workspace.");
            }
            normalized.arguments["path"] = normalized_relative.generic_string();
            if (policy_.require_write_approval && !policy_.approve) {
                return tool_failure("approval_required", "This write requires an approval decision before execution.");
            }
            if (policy_.require_write_approval && !policy_.approve(normalized)) {
                return tool_failure("approval_denied", "The operator denied this write request.");
            }
            return write_file(normalized.arguments);
        }
        if (call.name == "list_files") return list_files(call.arguments);
        if (call.name == "run_command") return run_command(call.arguments);
        return tool_failure("unknown_tool", "The requested tool is not registered.");
    } catch (const ToolRequestError& error) {
        return tool_failure(error.code(), error.what());
    } catch (const std::exception& error) {
        return tool_failure("invalid_tool_request", error.what());
    }
}

Json ToolDispatcher::read_file(const Json& arguments) const {
    require_only(arguments, {"path"});
    const std::filesystem::path path = resolve_inside_workspace(required_string(arguments, "path"));
    if (!std::filesystem::is_regular_file(path)) return tool_failure("not_a_file", "The requested workspace path is not a regular file.");
    if (std::filesystem::file_size(path) > limits_.max_read_bytes) return tool_failure("file_too_large", "The requested file exceeds the read limit.");

    std::ifstream input(path, std::ios::binary);
    if (!input) return tool_failure("read_failed", "The requested file could not be opened.");
    std::ostringstream buffer;
    buffer << input.rdbuf();
    const std::string content = buffer.str();
    if (content.find('\0') != std::string::npos) return tool_failure("binary_file", "The workshop read tool accepts UTF-8 text files only.");

    Json data = Json::object();
    data["path"] = std::filesystem::relative(path, workspace_).generic_string();
    data["bytes"] = content.size();
    data["content"] = content;
    return tool_success(std::move(data));
}

Json ToolDispatcher::write_file(const Json& arguments) const {
    require_only(arguments, {"path", "content"});
    const std::filesystem::path path = resolve_inside_workspace(required_string(arguments, "path"));
    const std::string content = required_string(arguments, "content");
    if (content.size() > limits_.max_write_bytes) return tool_failure("content_too_large", "The requested content exceeds the write limit.");
    if (!std::filesystem::is_directory(path.parent_path())) return tool_failure("parent_missing", "The destination parent directory does not exist.");

    std::ofstream output(path, std::ios::binary | std::ios::trunc);
    if (!output) return tool_failure("write_failed", "The destination file could not be opened.");
    output.write(content.data(), static_cast<std::streamsize>(content.size()));
    if (!output) return tool_failure("write_failed", "The complete file content could not be written.");
    output.close();
    if (!output) return tool_failure("write_failed", "The destination file could not be finalized.");

    Json data = Json::object();
    data["path"] = std::filesystem::relative(path, workspace_).generic_string();
    data["bytes_written"] = content.size();
    return tool_success(std::move(data));
}

Json ToolDispatcher::list_files(const Json& arguments) const {
    require_only(arguments, {"path"});
    const std::filesystem::path directory = resolve_inside_workspace(required_string(arguments, "path"));
    if (!std::filesystem::is_directory(directory)) return tool_failure("not_a_directory", "The requested workspace path is not a directory.");

    std::vector<std::string> paths;
    bool truncated = false;
    for (std::filesystem::recursive_directory_iterator iterator(
             directory, std::filesystem::directory_options::skip_permission_denied), end;
         iterator != end;
         ++iterator) {
        std::error_code error;
        if (iterator->is_symlink(error)) {
            if (iterator->is_directory(error)) iterator.disable_recursion_pending();
            continue;
        }
        if (iterator->is_regular_file(error)) {
            if (paths.size() == limits_.max_list_entries) {
                truncated = true;
                break;
            }
            paths.push_back(std::filesystem::relative(iterator->path(), workspace_).generic_string());
        }
    }
    std::sort(paths.begin(), paths.end());

    Json files = Json::array();
    for (const std::string& path : paths) files.push_back(path);
    Json data = Json::object();
    data["files"] = std::move(files);
    data["count"] = paths.size();
    data["truncated"] = truncated;
    return tool_success(std::move(data));
}

Json ToolDispatcher::run_command(const Json& arguments) const {
    require_only(arguments, {"action"});
    const std::string action = required_string(arguments, "action");

    ProcessRequest request;
    request.working_directory = workspace_;
    request.timeout = std::chrono::seconds(limits_.command_timeout_seconds);
    request.output_limit = limits_.max_tool_output_bytes;

    if (action == "configure") {
        request.executable = environment_or("CMAKE_COMMAND", "cmake");
        request.arguments = {"-S", ".", "-B", "build"};
        const std::string generator = environment_or("COURSE_CMAKE_GENERATOR", "");
        const std::string make_program = environment_or("COURSE_CMAKE_MAKE_PROGRAM", "");
        const std::string compiler = environment_or("COURSE_CXX_COMPILER", "");
        if (!generator.empty()) {
            request.arguments.push_back("-G");
            request.arguments.push_back(generator);
        }
        if (!make_program.empty()) request.arguments.push_back("-DCMAKE_MAKE_PROGRAM=" + make_program);
        if (!compiler.empty()) request.arguments.push_back("-DCMAKE_CXX_COMPILER=" + compiler);
    } else if (action == "build") {
        request.executable = environment_or("CMAKE_COMMAND", "cmake");
        request.arguments = {"--build", "build", "--config", "Debug", "--clean-first"};
    } else if (action == "test") {
        request.executable = environment_or("CTEST_COMMAND", "ctest");
        request.arguments = {"--test-dir", "build", "-C", "Debug", "--output-on-failure"};
    } else {
        return tool_failure("action_not_allowed", "Only configure, build, and test actions are allowed.");
    }

    const ProcessResult process = run_process(request);
    Json data = Json::object();
    data["action"] = action;
    data["exit_code"] = process.exit_code;
    data["output"] = process.output;
    data["timed_out"] = process.timed_out;
    data["truncated"] = process.truncated;
    return tool_success(std::move(data));
}

} // namespace course_agent
