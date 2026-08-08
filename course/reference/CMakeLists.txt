cmake_minimum_required(VERSION 3.20)

project(cpp_coding_agent_course LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(course_agent
    src/agent_loop.cpp
    src/openrouter_model_client.cpp
    src/scripted_model_client.cpp
    src/tool_dispatcher.cpp
    src/types.cpp
)

target_include_directories(course_agent PUBLIC include)

if(WIN32)
    target_sources(course_agent PRIVATE src/http_winhttp.cpp src/process_windows.cpp)
    target_link_libraries(course_agent PRIVATE winhttp)
    target_compile_definitions(course_agent PRIVATE NOMINMAX WIN32_LEAN_AND_MEAN)
else()
    find_package(CURL REQUIRED)
    target_sources(course_agent PRIVATE src/http_curl.cpp src/process_posix.cpp)
    target_link_libraries(course_agent PRIVATE CURL::libcurl)
endif()

add_executable(coding_agent src/main.cpp)
target_link_libraries(coding_agent PRIVATE course_agent)

add_executable(agent_preflight src/preflight.cpp)
target_link_libraries(agent_preflight PRIVATE course_agent)

enable_testing()

add_executable(agent_tests tests/test_main.cpp)
target_link_libraries(agent_tests PRIVATE course_agent)
target_compile_definitions(agent_tests PRIVATE COURSE_SOURCE_DIR="${CMAKE_CURRENT_SOURCE_DIR}")

foreach(workshop_target IN ITEMS course_agent coding_agent agent_preflight agent_tests)
    if(MSVC)
        target_compile_options(${workshop_target} PRIVATE /W4 /permissive- /EHsc /Zc:__cplusplus)
    else()
        target_compile_options(${workshop_target} PRIVATE -Wall -Wextra -Wpedantic)
    endif()
endforeach()

add_test(NAME agent_tests COMMAND agent_tests)
set_tests_properties(agent_tests PROPERTIES
    ENVIRONMENT "CMAKE_COMMAND=${CMAKE_COMMAND};CTEST_COMMAND=${CMAKE_CTEST_COMMAND}"
)
