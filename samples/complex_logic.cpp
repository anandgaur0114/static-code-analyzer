// ============================================================================
// Sample Test File: complex_logic.cpp
// Purpose: Demonstrates precise McCabe's Cyclomatic Complexity calculation:
//          Formula: V(G) = P + 1 (where P = count of decision points:
//          if, while, for, &&, ||, ?)
// ============================================================================

int evaluateConditions(int a, int b, int c, int d) {
    int score = 0;

    // Decision 1 & 2: if with logical AND (2 decision points -> +2)
    if (a > 10 && b < 20) {
        score += 10;
    }

    // Decision 3 & 4: if with logical OR (2 decision points -> +2)
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
    return 0;
}
