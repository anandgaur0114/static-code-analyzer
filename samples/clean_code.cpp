// ============================================================================
// Sample Test File: clean_code.cpp
// Purpose: Clean, idiomatic C++ code adhering to static analysis standards:
//          - All declared variables are used
//          - All identifiers are properly declared
//          - No dead or unreachable code
//          - Cyclomatic complexity is low and functions are modular
//          - Nesting depth stays well below threshold (<= 2 levels)
//          - Function lengths stay well below threshold (< 25 LOC)
// ============================================================================

int square(int val) {
    return val * val;
}

int absoluteValue(int num) {
    if (num < 0) {
        return -num;
    }
    return num;
}

int computeFactorial(int n) {
    int result = 1;
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

int clamp(int value, int minVal, int maxVal) {
    if (value < minVal) {
        return minVal;
    }
    if (value > maxVal) {
        return maxVal;
    }
    return value;
}

int main() {
    int inputVal = 5;
    int squared = square(inputVal);
    int fact = computeFactorial(inputVal);
    int clamped = clamp(squared, 0, 100);

    int finalResult = clamped + fact;
    return finalResult;
}
