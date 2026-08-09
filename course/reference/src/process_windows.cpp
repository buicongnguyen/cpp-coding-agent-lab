#include "course_agent/process.hpp"

#include <windows.h>

#include <algorithm>
#include <chrono>
#include <cwctype>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

namespace course_agent {

namespace {

std::wstring widen(const std::string& value) {
    if (value.empty()) return {};
    const int count = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), nullptr, 0);
    if (count <= 0) throw std::runtime_error("Could not convert UTF-8 process argument");
    std::wstring result(static_cast<std::size_t>(count), L'\0');
    MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), result.data(), count);
    return result;
}

std::wstring quote_argument(const std::wstring& value) {
    if (value.find_first_of(L" \t\"") == std::wstring::npos) return value;
    std::wstring result = L"\"";
    std::size_t backslashes = 0;
    for (const wchar_t ch : value) {
        if (ch == L'\\') {
            ++backslashes;
        } else if (ch == L'"') {
            result.append(backslashes * 2 + 1, L'\\');
            result.push_back(L'"');
            backslashes = 0;
        } else {
            result.append(backslashes, L'\\');
            backslashes = 0;
            result.push_back(ch);
        }
    }
    result.append(backslashes * 2, L'\\');
    result.push_back(L'"');
    return result;
}

std::vector<wchar_t> sanitized_environment() {
    LPWCH block = GetEnvironmentStringsW();
    if (!block) throw std::runtime_error("Could not read process environment");

    std::vector<wchar_t> result;
    std::map<std::wstring, std::wstring> retained;
    const std::set<std::wstring> allowed_names = {
        L"PATH", L"SYSTEMROOT", L"WINDIR", L"COMSPEC", L"PATHEXT", L"TEMP", L"TMP",
        L"INCLUDE", L"LIB", L"LIBPATH", L"NUMBER_OF_PROCESSORS", L"PROCESSOR_ARCHITECTURE",
        L"VCINSTALLDIR", L"VCTOOLSINSTALLDIR", L"VCTOOLSREDISTDIR", L"WINDOWSSDKDIR",
        L"WINDOWSSDKVERSION", L"UNIVERSALCRTSDKDIR", L"UCRTVERSION", L"VSINSTALLDIR",
        L"CMAKE_PREFIX_PATH", L"CMAKE_GENERATOR", L"CC", L"CXX"
    };
    for (const wchar_t* current = block; *current; current += std::wcslen(current) + 1) {
        std::wstring entry(current);
        std::wstring upper = entry;
        std::transform(upper.begin(), upper.end(), upper.begin(), [](wchar_t ch) { return std::towupper(ch); });
        const std::size_t separator = upper.find(L'=');
        if (separator == std::wstring::npos) continue;
        const std::wstring name = upper.substr(0, separator);
        const bool visual_studio_command_variable = name.rfind(L"VSCMD_", 0) == 0 || name == L"__VSCMD_PREINIT_PATH";
        if (allowed_names.find(name) == allowed_names.end() && !visual_studio_command_variable) continue;
        retained[name] = std::move(entry);
    }
    // Windows environment blocks may contain case-variant duplicate names. Querying
    // the process environment returns the effective value, which is particularly
    // important for the developer-shell PATH/INCLUDE/LIB entries used by MSVC.
    for (const std::wstring& name : allowed_names) {
        const DWORD required = GetEnvironmentVariableW(name.c_str(), nullptr, 0);
        if (required == 0) continue;
        std::vector<wchar_t> value(required);
        const DWORD written = GetEnvironmentVariableW(name.c_str(), value.data(), required);
        if (written == 0 || written >= required) continue;
        retained[name] = name + L"=" + std::wstring(value.data(), written);
    }
    for (const auto& item : retained) {
        const std::wstring& entry = item.second;
        result.insert(result.end(), entry.begin(), entry.end());
        result.push_back(L'\0');
    }
    result.push_back(L'\0');
    FreeEnvironmentStringsW(block);
    return result;
}

void append_bounded(std::string& output, const char* data, std::size_t size, std::size_t limit, bool& truncated) {
    if (output.size() >= limit) {
        truncated = truncated || size > 0;
        return;
    }
    const std::size_t accepted = std::min(size, limit - output.size());
    output.append(data, accepted);
    truncated = truncated || accepted < size;
}

void drain_pipe(HANDLE pipe, std::string& output, std::size_t limit, bool& truncated) {
    char buffer[4096];
    while (true) {
        DWORD available = 0;
        if (!PeekNamedPipe(pipe, nullptr, 0, nullptr, &available, nullptr) || available == 0) return;
        DWORD read = 0;
        const DWORD requested = std::min<DWORD>(available, sizeof(buffer));
        if (!ReadFile(pipe, buffer, requested, &read, nullptr) || read == 0) return;
        append_bounded(output, buffer, read, limit, truncated);
    }
}

} // namespace

ProcessResult run_process(const ProcessRequest& request) {
    SECURITY_ATTRIBUTES security{sizeof(SECURITY_ATTRIBUTES), nullptr, TRUE};
    HANDLE read_pipe = nullptr;
    HANDLE write_pipe = nullptr;
    if (!CreatePipe(&read_pipe, &write_pipe, &security, 0)) throw std::runtime_error("Could not create process output pipe");
    SetHandleInformation(read_pipe, HANDLE_FLAG_INHERIT, 0);

    std::wstring command = quote_argument(widen(request.executable));
    for (const std::string& argument : request.arguments) command += L" " + quote_argument(widen(argument));
    std::vector<wchar_t> mutable_command(command.begin(), command.end());
    mutable_command.push_back(L'\0');
    std::vector<wchar_t> environment = sanitized_environment();
    const std::wstring working_directory = request.working_directory.wstring();

    STARTUPINFOW startup{};
    startup.cb = sizeof(startup);
    startup.dwFlags = STARTF_USESTDHANDLES;
    startup.hStdInput = GetStdHandle(STD_INPUT_HANDLE);
    startup.hStdOutput = write_pipe;
    startup.hStdError = write_pipe;

    PROCESS_INFORMATION process{};
    const BOOL created = CreateProcessW(
        nullptr,
        mutable_command.data(),
        nullptr,
        nullptr,
        TRUE,
        CREATE_NO_WINDOW | CREATE_UNICODE_ENVIRONMENT,
        environment.data(),
        working_directory.c_str(),
        &startup,
        &process);

    CloseHandle(write_pipe);
    if (!created) {
        CloseHandle(read_pipe);
        throw std::runtime_error("Could not start approved process; Windows error " + std::to_string(GetLastError()));
    }

    ProcessResult result;
    const auto deadline = std::chrono::steady_clock::now() + request.timeout;
    while (true) {
        drain_pipe(read_pipe, result.output, request.output_limit, result.truncated);
        const DWORD wait = WaitForSingleObject(process.hProcess, 25);
        if (wait == WAIT_OBJECT_0) break;
        if (std::chrono::steady_clock::now() >= deadline) {
            result.timed_out = true;
            TerminateProcess(process.hProcess, 124);
            WaitForSingleObject(process.hProcess, 5000);
            break;
        }
    }
    drain_pipe(read_pipe, result.output, request.output_limit, result.truncated);

    DWORD exit_code = 0;
    GetExitCodeProcess(process.hProcess, &exit_code);
    result.exit_code = static_cast<int>(exit_code);

    CloseHandle(process.hThread);
    CloseHandle(process.hProcess);
    CloseHandle(read_pipe);
    return result;
}

} // namespace course_agent
