#include "calculator.hpp"

#include <cmath>
#include <iostream>

namespace {

bool close(double lhs, double rhs) {
    return std::fabs(lhs - rhs) < 1e-9;
}

} // namespace

int main() {
    if (!close(add(2.0, 3.0), 5.0)) return 1;
    if (!close(divide(5.0, 2.0), 2.5)) return 1;
    std::cout << "calculator tests passed\n";
    return 0;
}

