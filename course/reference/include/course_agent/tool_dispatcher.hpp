#pragma once

#include "course_agent/json.hpp"
#include "course_agent/types.hpp"

#include <filesystem>
#include <string>

namespace course_agent {

struct ToolLimits {
    std::size_t max_read_bytes = 65536;
    std::size_t max_write_bytes = 65536;
    std::size_t max_list_entries = 200;
    std::size_t max_tool_output_bytes = 65536;
    int command_timeout_seconds = 45;
};

class ToolDispatcher {
public:
    explicit ToolDispatcher(std::filesystem::path workspace, ToolLimits limits = {});

    const std::filesystem::path& workspace() const { return workspace_; }
    Json definitions() const;
    Json execute(const ToolCall& call) const;

private:
    std::filesystem::path workspace_;
    ToolLimits limits_;

    std::filesystem::path resolve_inside_workspace(const std::string& relative_path) const;
    Json read_file(const Json& arguments) const;
    Json write_file(const Json& arguments) const;
    Json list_files(const Json& arguments) const;
    Json run_command(const Json& arguments) const;
};

Json tool_success(Json data);
Json tool_failure(const std::string& code, const std::string& message);

} // namespace course_agent

