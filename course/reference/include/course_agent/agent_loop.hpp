#pragma once

#include "course_agent/model_client.hpp"
#include "course_agent/tool_dispatcher.hpp"

#include <chrono>
#include <cstddef>
#include <cstdint>
#include <functional>
#include <string>
#include <vector>

namespace course_agent {

struct LoopConfig {
    std::size_t max_iterations = 16;
    std::size_t max_tool_calls = 32;
    std::size_t repeated_call_limit = 2;
    std::chrono::seconds wall_clock_limit{300};
};

struct TraceEvent {
    std::size_t iteration = 0;
    std::string kind;
    std::string detail;
    std::string tool_name;
    std::string tool_call_id;
    Usage usage;
    std::uint64_t elapsed_ms = 0;
};

using TraceSink = std::function<void(const TraceEvent&)>;
using CancelCheck = std::function<bool()>;

struct LoopResult {
    bool completed = false;
    std::string stop_reason;
    std::string final_text;
    std::vector<Message> history;
    std::size_t iterations = 0;
    std::size_t tool_calls = 0;
    Usage cumulative_usage;
};

class AgentLoop {
public:
    AgentLoop(ModelClient& model, const ToolDispatcher& tools, LoopConfig config = {});

    LoopResult run(
        const std::string& system_prompt,
        const std::string& user_prompt,
        TraceSink trace = {},
        CancelCheck cancelled = {}) const;

private:
    ModelClient& model_;
    const ToolDispatcher& tools_;
    LoopConfig config_;
};

Json trace_event_to_json(const TraceEvent& event);

} // namespace course_agent
