#pragma once

#include <chrono>
#include <filesystem>
#include <string>
#include <vector>

namespace course_agent {

struct ProcessRequest {
    std::string executable;
    std::vector<std::string> arguments;
    std::filesystem::path working_directory;
    std::chrono::milliseconds timeout{30000};
    std::size_t output_limit = 65536;
};

struct ProcessResult {
    int exit_code = -1;
    std::string output;
    bool timed_out = false;
    bool truncated = false;
};

ProcessResult run_process(const ProcessRequest& request);

} // namespace course_agent

