// ============================================================================
// Sample Test File: test_issues.cpp
// Purpose: Intentionally contains multiple code quality and compiler-detectable
//          issues to test the Static Code Analyzer:
//          1. Unused variables
//          2. Undeclared variable usage
//          3. Unreachable dead code after return
//          4. Deep control flow nesting (> 4 levels)
//          5. Function length exceeding threshold (> 50 LOC)
//          6. High cyclomatic complexity (> 10)
// ============================================================================

int calculateSum(int a, int b) {
    int unusedLocal = 100; // Issue: Unused variable
    int result = a + b;
    return result;

    // Issue: Unreachable / Dead code after return
    int deadVariable = 999;
    deadVariable = deadVariable + 1;
}

void triggerUndeclared() {
    int validVar = 10;
    validVar = validVar + 5;
    
    // Issue: Undeclared variable 'undeclaredIdentifier'
    undeclaredIdentifier = 500;
}

void deepNestingExample(int x) {
    // Issue: Nesting depth exceeds 4 levels
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

// Issue: Function exceeds 50 lines of code (LOC)
// Issue: High Cyclomatic Complexity (> 10) due to multiple decision points
int complexAndLongFunction(int mode, int flag, int count) {
    int total = 0;
    int unusedMetric = -1; // Issue: Unused variable

    /* Multi-line comment block:
       Processing various modes and flags with branches.
       Each if / loop / logical operator increments cyclomatic complexity.
    */

    if (mode == 1) {
        total += 10;
    } else if (mode == 2) {
        total += 20;
    } else if (mode == 3) {
        total += 30;
    } else if (mode == 4) {
        total += 40;
    } else {
        total += 50;
    }

    if (flag == 1 && count > 0) {
        total += 5;
    }

    if (flag == 2 || count < 0) {
        total -= 5;
    }

    for (int i = 0; i < 10; i++) {
        if (i % 2 == 0) {
            total += i;
        } else {
            total -= i;
        }
    }

    while (count > 0) {
        total += 1;
        count--;
    }

    if (mode > 10 && flag > 5) {
        total += 100;
    }

    if (mode < 0 || flag < 0) {
        total -= 100;
    }

    // Adding lines to comfortably exceed 50 LOC threshold
    total = total + 1;
    total = total + 2;
    total = total + 3;
    total = total + 4;
    total = total + 5;
    total = total + 6;
    total = total + 7;
    total = total + 8;
    total = total + 9;
    total = total + 10;

    return total;
}

int main() {
    int x = 5;
    int y = 10;
    int sum = calculateSum(x, y);

    deepNestingExample(x);
    int complexResult = complexAndLongFunction(1, 2, sum);

    return 0;
}
