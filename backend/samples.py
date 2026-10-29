"""
samples.py - Sample C++ Programs with Deliberate Quality, Semantic, and Security Bugs
"""

from typing import List, Dict, Any

SAMPLES: List[Dict[str, Any]] = [
    {
        "id": "clean",
        "name": "Clean Code (100% Pass - Grade A+)",
        "description": "Clean, idiomatic C++ code adhering to all compiler & static analysis rules (0 errors, 0 warnings).",
        "code": """// ============================================================================
// Clean Code: Idiomatic C++ adhering to static analysis standards
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
"""
    },
    {
        "id": "bugs",
        "name": "Compiler Issues & Dead Code",
        "description": "Demonstrates undeclared variables, unused variables, unreachable dead code, and deep nesting.",
        "code": """// ============================================================================
// Sample File: Compiler Issues, Dead Code & Deep Nesting
// ============================================================================

int calculateSum(int a, int b) {
    int unusedLocal = 100; // Issue: Unused variable (-5%)
    int result = a + b;
    return result;

    // Issue: Unreachable / Dead code after return (-8%)
    int deadVariable = 999;
    deadVariable = deadVariable + 1;
}

void triggerUndeclared() {
    int validVar = 10;
    validVar = validVar + 5;
    
    // Issue: Undeclared variable (-15%)
    undeclaredIdentifier = 500;
}

void deepNestingExample(int x) {
    // Issue: Control-flow nesting depth exceeds threshold (> 4 levels)
    if (x > 0) {
        if (x > 10) {
            while (x < 100) {
                if (x % 2 == 0) {
                    for (int i = 0; i < 5; i++) {
                        int deepValue = x * 2;
                        deepValue = deepValue + i;
                    }
                }
                x++;
            }
        }
    }
}

int main() {
    int sum = calculateSum(5, 10);
    triggerUndeclared();
    deepNestingExample(15);
    return sum;
}
"""
    },
    {
        "id": "security",
        "name": "Security Flaws & Uninitialized Variables",
        "description": "Demonstrates security risks (hardcoded credentials, unsafe C APIs like gets/strcpy) and uninitialized variables.",
        "code": """// ============================================================================
// Security Vulnerabilities & Uninitialized Variables
// ============================================================================

void authenticateUser() {
    // Security Issue: Hardcoded API Secret / Password
    const char* api_key = "AIzaSyD-98124_secret_production_key";
    const char* password = "SuperSecretPassword123!";

    // Issue: Uninitialized variable read before assignment
    int loginAttempts;
    int currentCount = loginAttempts + 1; 

    // Security Issue: Call to banned/unsafe buffer overflow function gets()
    char buffer[64];
    gets(buffer);

    // Security Issue: Call to unsafe strcpy() without bounds checking
    char dest[32];
    strcpy(dest, buffer);
}

int main() {
    authenticateUser();
    return 0;
}
"""
    },
    {
        "id": "complex",
        "name": "High McCabe Cyclomatic Complexity",
        "description": "Complex control-flow logic with multiple decision branches, short-circuit operators, and nested loops.",
        "code": """// ============================================================================
// Cyclomatic Complexity: V(G) = P + 1 (Decision nodes: if, while, for, &&, ||)
// ============================================================================

int evaluateConditions(int a, int b, int c, int d) {
    int score = 0;

    // Decisions 1 & 2: if with logical AND (+2)
    if (a > 10 && b < 20) {
        score += 10;
    }

    // Decisions 3 & 4: if with logical OR (+2)
    if (c == 0 || d == 0) {
        score += 5;
    }

    // Decision 5: while loop (+1)
    while (a > 0) {
        // Decision 6: nested if (+1)
        if (a % 3 == 0) {
            score += 2;
        }
        a--;
    }

    // Decision 7: for loop (+1)
    for (int i = 0; i < 5; i++) {
        // Decision 8: nested if (+1)
        if (i == b) {
            score += i;
        }
    }

    return score;
}

int main() {
    int val = evaluateConditions(15, 3, 0, 10);
    return val;
}
"""
    },
    {
        "id": "syntax",
        "name": "Syntax Errors & Panic Recovery",
        "description": "Missing semicolons and unmatched brackets showing parser panic-mode error recovery.",
        "code": """// ============================================================================
// Syntax Errors: Missing delimiters triggering LL(1) panic recovery
// ============================================================================

int brokenFunction(int a, int b) {
    int x = a + b // Error: Missing semicolon

    if (x > 10 { // Error: Missing closing parenthesis
        return x;
    }

    return 0;
}

int main() {
    int res = brokenFunction(10, 20);
    return res;
}
"""
    }
]
