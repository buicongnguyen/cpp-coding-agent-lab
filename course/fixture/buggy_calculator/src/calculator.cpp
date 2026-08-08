#include "calculator.hpp"

#include <stdexcept>

double add(double lhs, double rhs) {
    return lhs + rhs
}

double divide(double lhs, double rhs) {
    if (rhs == 0.0) {
        throw std::invalid_argument("division by zero");
    }
    return static_cast<int>(lhs / rhs);
}

