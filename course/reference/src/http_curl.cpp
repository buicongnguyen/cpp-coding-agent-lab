#include "course_agent/model_client.hpp"

#include <curl/curl.h>

#include <stdexcept>
#include <string>
#include <vector>

namespace course_agent {

namespace {

std::size_t append_response(char* data, std::size_t size, std::size_t count, void* destination) {
    const std::size_t bytes = size * count;
    static_cast<std::string*>(destination)->append(data, bytes);
    return bytes;
}

} // namespace

std::string http_post_json(
    const std::string& host,
    const std::string& path,
    const std::vector<std::string>& headers,
    const std::string& body,
    int timeout_seconds) {

    CURL* curl = curl_easy_init();
    if (!curl) throw std::runtime_error("curl_easy_init failed");

    curl_slist* header_list = nullptr;
    for (const std::string& header : headers) header_list = curl_slist_append(header_list, header.c_str());

    std::string response;
    const std::string url = "https://" + host + path;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, header_list);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.data());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, static_cast<long>(body.size()));
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, static_cast<long>(timeout_seconds));
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, append_response);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);

    const CURLcode code = curl_easy_perform(curl);
    long status = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &status);
    curl_slist_free_all(header_list);
    curl_easy_cleanup(curl);

    if (code != CURLE_OK) throw std::runtime_error(std::string("OpenRouter transport error: ") + curl_easy_strerror(code));
    if (status < 200 || status >= 300) {
        const std::string bounded = response.size() > 2048 ? response.substr(0, 2048) + "..." : response;
        throw std::runtime_error("OpenRouter HTTP " + std::to_string(status) + ": " + bounded);
    }
    return response;
}

} // namespace course_agent

