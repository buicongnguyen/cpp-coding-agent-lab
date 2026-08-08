#include "course_agent/model_client.hpp"

#include <windows.h>
#include <winhttp.h>

#include <stdexcept>
#include <string>
#include <vector>

namespace course_agent {

namespace {

std::wstring widen(const std::string& value) {
    if (value.empty()) return {};
    const int count = MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), nullptr, 0);
    if (count <= 0) throw std::runtime_error("Could not convert HTTP text to UTF-16");
    std::wstring result(static_cast<std::size_t>(count), L'\0');
    MultiByteToWideChar(CP_UTF8, MB_ERR_INVALID_CHARS, value.data(), static_cast<int>(value.size()), result.data(), count);
    return result;
}

class InternetHandle {
public:
    explicit InternetHandle(HINTERNET value = nullptr) : value_(value) {}
    ~InternetHandle() { if (value_) WinHttpCloseHandle(value_); }
    InternetHandle(const InternetHandle&) = delete;
    InternetHandle& operator=(const InternetHandle&) = delete;
    HINTERNET get() const { return value_; }
    explicit operator bool() const { return value_ != nullptr; }

private:
    HINTERNET value_;
};

[[noreturn]] void fail(const std::string& message) {
    throw std::runtime_error(message + "; Windows error " + std::to_string(GetLastError()));
}

} // namespace

std::string http_post_json(
    const std::string& host,
    const std::string& path,
    const std::vector<std::string>& headers,
    const std::string& body,
    int timeout_seconds) {

    InternetHandle session(WinHttpOpen(
        L"cpp-coding-agent-workshop/1.0",
        WINHTTP_ACCESS_TYPE_AUTOMATIC_PROXY,
        WINHTTP_NO_PROXY_NAME,
        WINHTTP_NO_PROXY_BYPASS,
        0));
    if (!session) fail("WinHttpOpen failed");

    const int timeout_ms = timeout_seconds * 1000;
    WinHttpSetTimeouts(session.get(), timeout_ms, timeout_ms, timeout_ms, timeout_ms);

    InternetHandle connection(WinHttpConnect(session.get(), widen(host).c_str(), INTERNET_DEFAULT_HTTPS_PORT, 0));
    if (!connection) fail("WinHttpConnect failed");

    InternetHandle request(WinHttpOpenRequest(
        connection.get(),
        L"POST",
        widen(path).c_str(),
        nullptr,
        WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES,
        WINHTTP_FLAG_SECURE));
    if (!request) fail("WinHttpOpenRequest failed");

    for (const std::string& header : headers) {
        const std::wstring wide_header = widen(header);
        if (!WinHttpAddRequestHeaders(request.get(), wide_header.c_str(), static_cast<DWORD>(-1), WINHTTP_ADDREQ_FLAG_ADD)) {
            fail("WinHttpAddRequestHeaders failed");
        }
    }

    if (!WinHttpSendRequest(
            request.get(),
            WINHTTP_NO_ADDITIONAL_HEADERS,
            0,
            const_cast<char*>(body.data()),
            static_cast<DWORD>(body.size()),
            static_cast<DWORD>(body.size()),
            0)) {
        fail("WinHttpSendRequest failed");
    }
    if (!WinHttpReceiveResponse(request.get(), nullptr)) fail("WinHttpReceiveResponse failed");

    DWORD status = 0;
    DWORD status_size = sizeof(status);
    if (!WinHttpQueryHeaders(
            request.get(),
            WINHTTP_QUERY_STATUS_CODE | WINHTTP_QUERY_FLAG_NUMBER,
            WINHTTP_HEADER_NAME_BY_INDEX,
            &status,
            &status_size,
            WINHTTP_NO_HEADER_INDEX)) {
        fail("WinHttpQueryHeaders failed");
    }

    std::string response;
    while (true) {
        DWORD available = 0;
        if (!WinHttpQueryDataAvailable(request.get(), &available)) fail("WinHttpQueryDataAvailable failed");
        if (available == 0) break;
        std::vector<char> buffer(available);
        DWORD read = 0;
        if (!WinHttpReadData(request.get(), buffer.data(), available, &read)) fail("WinHttpReadData failed");
        response.append(buffer.data(), read);
    }

    if (status < 200 || status >= 300) {
        const std::string bounded = response.size() > 2048 ? response.substr(0, 2048) + "..." : response;
        throw std::runtime_error("OpenRouter HTTP " + std::to_string(status) + ": " + bounded);
    }
    return response;
}

} // namespace course_agent

