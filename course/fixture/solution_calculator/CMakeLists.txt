cmake_minimum_required(VERSION 3.20)
project(solution_calculator LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

add_library(calculator src/calculator.cpp)
target_include_directories(calculator PUBLIC include)

add_executable(calculator_tests tests/calculator_tests.cpp)
target_link_libraries(calculator_tests PRIVATE calculator)

enable_testing()
add_test(NAME calculator_tests COMMAND calculator_tests)

