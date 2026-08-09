#include "course_agent/process.hpp"

#include <fcntl.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#include <algorithm>
#include <cerrno>
#include <chrono>
#include <cstring>
#include <set>
#include <stdexcept>
#include <string>
#include <thread>
#include <utility>
#include <vector>

extern char** environ;

namespace course_agent {

namespace {

void append_bounded(std::string& output, const char* data, std::size_t size, std::size_t limit, bool& truncated) {
    if (output.size() >= limit) {
        truncated = truncated || size > 0;
        return;
    }
    const std::size_t accepted = std::min(size, limit - output.size());
    output.append(data, accepted);
    truncated = truncated || accepted < size;
}

void drain(int descriptor, ProcessResult& result, std::size_t limit) {
    char buffer[4096];
    while (true) {
        const ssize_t count = read(descriptor, buffer, sizeof(buffer));
        if (count > 0) append_bounded(result.output, buffer, static_cast<std::size_t>(count), limit, result.truncated);
        else if (count < 0 && (errno == EAGAIN || errno == EWOULDBLOCK)) return;
        else return;
    }
}

void retain_build_environment_only() {
    static const std::set<std::string> allowed = {
        "PATH", "TMPDIR", "TMP", "TEMP", "LANG", "LC_ALL",
        "CC", "CXX", "SDKROOT", "MACOSX_DEPLOYMENT_TARGET",
        "CMAKE_PREFIX_PATH", "CMAKE_GENERATOR"
    };

    std::vector<std::string> names_to_remove;
    for (char** entry = ::environ; entry && *entry; ++entry) {
        const std::string value(*entry);
        const std::size_t separator = value.find('=');
        if (separator == std::string::npos) continue;
        const std::string name = value.substr(0, separator);
        if (allowed.find(name) == allowed.end()) names_to_remove.push_back(name);
    }
    for (const std::string& name : names_to_remove) unsetenv(name.c_str());
}

} // namespace

ProcessResult run_process(const ProcessRequest& request) {
    int output_pipe[2];
    if (pipe(output_pipe) != 0) throw std::runtime_error("Could not create process output pipe");

    const pid_t child = fork();
    if (child < 0) throw std::runtime_error("Could not fork approved process");
    if (child == 0) {
        close(output_pipe[0]);
        dup2(output_pipe[1], STDOUT_FILENO);
        dup2(output_pipe[1], STDERR_FILENO);
        close(output_pipe[1]);
        retain_build_environment_only();
        if (chdir(request.working_directory.c_str()) != 0) _exit(126);

        std::vector<char*> arguments;
        arguments.push_back(const_cast<char*>(request.executable.c_str()));
        for (const std::string& value : request.arguments) arguments.push_back(const_cast<char*>(value.c_str()));
        arguments.push_back(nullptr);
        execvp(request.executable.c_str(), arguments.data());
        _exit(127);
    }

    close(output_pipe[1]);
    fcntl(output_pipe[0], F_SETFL, fcntl(output_pipe[0], F_GETFL) | O_NONBLOCK);

    ProcessResult result;
    const auto deadline = std::chrono::steady_clock::now() + request.timeout;
    int status = 0;
    while (true) {
        drain(output_pipe[0], result, request.output_limit);
        const pid_t state = waitpid(child, &status, WNOHANG);
        if (state == child) break;
        if (std::chrono::steady_clock::now() >= deadline) {
            result.timed_out = true;
            kill(child, SIGKILL);
            waitpid(child, &status, 0);
            break;
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(20));
    }
    drain(output_pipe[0], result, request.output_limit);
    close(output_pipe[0]);

    if (WIFEXITED(status)) result.exit_code = WEXITSTATUS(status);
    else if (WIFSIGNALED(status)) result.exit_code = 128 + WTERMSIG(status);
    return result;
}

} // namespace course_agent
