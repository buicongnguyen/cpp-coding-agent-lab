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
target_compile_definitions(agent_preflight PRIVATE COURSE_CMAKE_VERSION="${CMAKE_VERSION}")

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

add_test(NAME checkpoint-00-preflight COMMAND agent_preflight)
set_tests_properties(checkpoint-00-preflight PROPERTIES LABELS "checkpoint-00")

add_test(NAME checkpoint-01 COMMAND agent_tests --case checkpoint-01)
add_test(NAME checkpoint-03 COMMAND agent_tests --case checkpoint-03)
add_test(NAME checkpoint-04 COMMAND agent_tests --case checkpoint-04)
add_test(NAME checkpoint-05 COMMAND agent_tests --case checkpoint-05)
add_test(NAME checkpoint-07 COMMAND agent_tests --case checkpoint-07)
add_test(NAME checkpoint-08 COMMAND agent_tests --case checkpoint-08)
set_tests_properties(checkpoint-01 PROPERTIES LABELS "checkpoint-01")
set_tests_properties(checkpoint-03 PROPERTIES LABELS "checkpoint-03")
set_tests_properties(checkpoint-04 PROPERTIES LABELS "checkpoint-04")
set_tests_properties(checkpoint-05 PROPERTIES LABELS "checkpoint-05")
set_tests_properties(checkpoint-07 PROPERTIES LABELS "checkpoint-07")
set_tests_properties(checkpoint-08 PROPERTIES LABELS "checkpoint-08")

add_test(NAME checkpoint-06-trace COMMAND agent_tests --case E3)
set_tests_properties(checkpoint-06-trace PROPERTIES LABELS "checkpoint-06")
add_test(NAME checkpoint-07-environment COMMAND agent_tests --case checkpoint-07-env)
set_tests_properties(checkpoint-07-environment PROPERTIES LABELS "checkpoint-07")

foreach(eval_id IN ITEMS E1 E2 E3 E4 E5 E6 E7)
    add_test(NAME eval-${eval_id} COMMAND agent_tests --case ${eval_id})
    set_tests_properties(eval-${eval_id} PROPERTIES LABELS "evaluation")
endforeach()

set(course_nested_generator "${CMAKE_GENERATOR}")
set(course_nested_make_program "${CMAKE_MAKE_PROGRAM}")
if(WIN32)
    find_program(course_ninja_program NAMES ninja ninja.exe)
    if(course_ninja_program)
        set(course_nested_generator "Ninja")
        set(course_nested_make_program "${course_ninja_program}")
    endif()
endif()

set(course_test_environment
    "CMAKE_COMMAND=${CMAKE_COMMAND}"
    "CTEST_COMMAND=${CMAKE_CTEST_COMMAND}"
    "COURSE_CMAKE_GENERATOR=${course_nested_generator}"
    "COURSE_CMAKE_MAKE_PROGRAM=${course_nested_make_program}"
    "COURSE_CXX_COMPILER=${CMAKE_CXX_COMPILER}"
)
foreach(environment_name IN ITEMS PATH INCLUDE LIB LIBPATH SYSTEMROOT TEMP TMP)
    string(REPLACE ";" "\\;" environment_value "$ENV{${environment_name}}")
    if(NOT environment_value STREQUAL "")
        list(APPEND course_test_environment "${environment_name}=${environment_value}")
    endif()
endforeach()

set_tests_properties(
    checkpoint-00-preflight
    checkpoint-01
    checkpoint-03
    checkpoint-04
    checkpoint-05
    checkpoint-06-trace
    checkpoint-07
    checkpoint-07-environment
    checkpoint-08
    eval-E1 eval-E2 eval-E3 eval-E4 eval-E5 eval-E6 eval-E7
    PROPERTIES
    ENVIRONMENT "${course_test_environment}"
)
