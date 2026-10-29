# Static Code Analyzer & Report Generator (C++)
> **Compiler Design Course Project** &bull; 3rd-Year B.Tech Computer Science & Engineering (AI)  
> *Demonstrating Lexical Analysis, Syntax Analysis, Semantic Checking, and Software Metrics in Modern C++17*

[![C++ Standard](https://img.shields.io/badge/C%2B%2B-17-blue.svg)](https://en.cppreference.com/w/cpp/17)
[![Build](https://img.shields.io/badge/Build-CMake%20%7C%20MinGW-brightgreen.svg)](#building-the-project)
[![Dependencies](https://img.shields.io/badge/Dependencies-Zero%20(Pure%20STL)-orange.svg)](#tech-stack--constraints)
[![Viva Ready](https://img.shields.io/badge/Documentation-Viva%20Ready-purple.svg)](#compiler-design-theory-mapping-viva-guide)

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Compiler Design Theory Mapping (Viva Guide)](#compiler-design-theory-mapping-viva-guide)
   - [Stage 1: Lexical Analysis (DFA Tokenizer)](#stage-1-lexical-analysis-dfa-tokenizer)
   - [Stage 2: Syntax Analysis (Recursive Descent Parser)](#stage-2-syntax-analysis-recursive-descent-parser)
   - [Stage 3: Abstract Syntax Tree (AST) & Visitor Pattern](#stage-3-abstract-syntax-tree-ast--visitor-pattern)
   - [Stage 4: Semantic Analysis & Scoped Symbol Table](#stage-4-semantic-analysis--scoped-symbol-table)
   - [Stage 5: Static Analysis & Metrics Calculation](#stage-5-static-analysis--metrics-calculation)
3. [Interactive Web UI & Real-Time Studio](#interactive-web-ui--real-time-studio)
4. [Architecture & Project Structure](#architecture--project-structure)
5. [Building the Project](#building-the-project)
6. [CLI Usage & Options](#cli-usage--options)
7. [Terminal Accuracy Report Features](#terminal-accuracy-report-features)
8. [Test Samples & Validation](#test-samples--validation)
9. [Viva Voce Q&A Cheat Sheet](#viva-voce-qa-cheat-sheet)

---

## Project Overview

This static code analyzer inspects C/C++ source code and generates structured code quality diagnostics, software metrics, and a calculated **Code Accuracy Score (0%–100%)** directly in your terminal without executing the code. Written from scratch in **pure C++17** with **zero external dependencies** (no Flex, Bison, Boost, or third-party libraries), it demonstrates how compiler front-end and middle-end stages are implemented.

```
+------------------+     +-------------------+     +------------------+
| C/C++ Source     | --> | Lexical Analyzer  | --> | Token Stream     |
| (Paste or File)  |     | (DFA State Mach.) |     | (Type, Lex, Pos) |
+------------------+     +-------------------+     +------------------+
                                                            |
                                                            v
+------------------+     +-------------------+     +------------------+
| Terminal Report: | <-- | Static & Semantic | <-- | Recursive Descent|
| Accuracy & Score |     | Passes (Visitor)  |     | Parser -> AST    |
+------------------+     +-------------------+     +------------------+
```

---

## Compiler Design Theory Mapping (Viva Guide)

### Stage 1: Lexical Analysis (DFA Tokenizer)
*Files: [`include/Token.h`](include/Token.h), [`src/Token.cpp`](src/Token.cpp), [`include/Lexer.h`](include/Lexer.h), [`src/Lexer.cpp`](src/Lexer.cpp)*

- **Formal Foundation**: Implements a Deterministic Finite Automaton (DFA) $M = (Q, \Sigma, \delta, q_0, F)$:
  - **States ($Q$)**: `START`, `IN_IDENTIFIER`, `IN_NUMBER`, `IN_STRING`, `IN_CHAR`, `IN_SLASH`, `IN_SINGLE_COMMENT`, `IN_MULTI_COMMENT`.
  - **Alphabet ($\Sigma$)**: ASCII character set.
  - **Transitions ($\delta$)**: Lookahead character matching (e.g., `/` followed by `/` transitions to single-line comment; followed by `*` transitions to multi-line comment; followed by `=` transitions to compound assignment `/=`).
  - **Accepting States ($F$)**: Emits a strongly typed `Token(TokenType, lexeme, line, column)`.
- **Key Concepts Demonstrated**:
  - **Maximal Munch (Longest Match Rule)**: Operators like `++`, `+=`, `==`, `->`, `::` are greedily consumed over single characters `+`, `=`, `-`, `:`.
  - **Coordinate Tracking**: 1-indexed line and column tracking for exact error diagnostics.
  - **Comment & Whitespace Handling**: Strips or classifies whitespace, single-line `// ...`, and multi-line `/* ... */` blocks.

---

### Stage 2: Syntax Analysis (Recursive Descent Parser)
*Files: [`include/Parser.h`](include/Parser.h), [`src/Parser.cpp`](src/Parser.cpp)*

- **Formal Foundation**: Implements top-down LL(1) Recursive Descent parsing for a Context-Free Grammar (CFG) $G = (V, \Sigma, R, S)$:
  - **Grammar Productions**:
    $$\text{Program} \to (\text{FunctionDecl} \mid \text{VarDecl} \mid \text{Statement})^*$$
    $$\text{Statement} \to \text{Block} \mid \text{IfStmt} \mid \text{WhileStmt} \mid \text{ForStmt} \mid \text{ReturnStmt} \mid \text{ExprStmt} \mid \text{VarDecl}$$
    $$\text{Expression} \to \text{Assignment}$$
    $$\text{Assignment} \to \text{LogicalOr} \, ((\text{`=`} \mid \text{`+=`} \mid \text{`-=`} \mid \dots) \, \text{Assignment})^?$$
- **Precedence Climbing**: Encodes operator precedence into mutually recursive procedures:
  $$\text{Primary} \prec \text{Postfix/Call} \prec \text{Unary} \prec \text{Multiplicative} \prec \text{Additive} \prec \text{Relational} \prec \text{Equality} \prec \text{Logical AND} \prec \text{Logical OR} \prec \text{Assignment}$$
- **Panic-Mode Error Recovery**:
  When a syntax error is detected, the parser records the diagnostic with coordinates and enters `synchronize()`, advancing tokens until a safe delimiter (`;`, `}`) or statement keyword (`if`, `while`, `for`, `return`, `int`, etc.) is reached. This prevents cascading errors and enables multi-error reporting in a single pass.

---

### Stage 3: Abstract Syntax Tree (AST) & Visitor Pattern
*Files: [`include/AST.h`](include/AST.h), [`src/AST.cpp`](src/AST.cpp)*

- **Representation**: While a Parse Tree (Concrete Syntax Tree) contains every grammar derivation symbol, an AST discards punctuation and redundant non-terminals, preserving only the semantic structure.
- **Node Hierarchy**:
  - `ASTNode` (Base)
    - `ExprNode` $\to$ `BinaryExprASTNode`, `UnaryExprASTNode`, `LiteralExprASTNode`, `VariableExprASTNode`, `CallExprASTNode`, `AssignExprASTNode`
    - `StmtNode` $\to$ `BlockStmtNode`, `IfStmtNode`, `WhileStmtNode`, `ForStmtNode`, `ReturnStmtNode`, `BreakStmtNode`, `ExprStmtNode`
    - `DeclNode` $\to$ `FunctionDeclNode`, `VarDeclNode`, `ParamNode`
- **Design Pattern**: Implements the **Visitor Pattern** (`ASTVisitor` interface). Decouples the syntax tree structure from the operations performed on it (pretty printing, metric calculation, static analysis).
- **Ownership Semantics**: Strict tree ownership using `std::unique_ptr<ASTNode>` guaranteeing leak-free RAII memory management.

---

### Stage 4: Semantic Analysis & Scoped Symbol Table
*Files: [`include/SymbolTable.h`](include/SymbolTable.h), [`src/SymbolTable.cpp`](src/SymbolTable.cpp)*

- **Data Structure**: A **Scope Stack** ($\text{Stack of Hash Maps}$) mapping identifiers to `SymbolInfo` (name, type, line, column, `isUsed`, `isParam`, `isConst`).
  - `enterScope()`: Pushes a new symbol environment on block `{` or function entry.
  - `exitScope()`: Pops the environment. Evaluates symbols in that scope; any variable with `isUsed == false` triggers an **Unused Variable Warning**.
  - `lookup(id)`: Traverses from innermost scope to outermost scope (lexical scope resolution).
- **Diagnostic Rules**:
  - **Undeclared Variable**: An identifier referenced as an R-value or assignment target that does not exist in any enclosing scope.
  - **Unused Variable**: A variable declared in a scope that is never read before the scope ends.
  - **Redeclaration**: Variable declared twice within the *same* lexical scope level.

---

### Stage 5: Static Analysis & Metrics Calculation
*Files: [`include/Analyzer.h`](include/Analyzer.h), [`src/Analyzer.cpp`](src/Analyzer.cpp)*

1. **McCabe's Cyclomatic Complexity**:
   Calculates the number of linearly independent paths through a function's control-flow graph (CFG):
   $$V(G) = P + 1$$
   Where $P$ is the number of predicate/decision points:
   - Each `if` branch ($+1$)
   - Each `while` loop ($+1$)
   - Each `for` loop ($+1$)
   - Each short-circuit logical operator `&&` and `||` ($+1$)
   - Risk categorization: Low (1–10), Moderate (11–20), High (21–50), Critical (>50).
2. **Control Flow Nesting Depth**:
   Tracks the dynamic nesting level of decision structures inside each function. Warns when depth $> \text{threshold}$ (default: 4).
3. **Dead / Unreachable Code Detection**:
   Analyzes sequences of statements in blocks. If statements appear directly after a terminating node (`ReturnStmtNode`, `BreakStmtNode`, `ContinueStmtNode`), an unreachable code warning is flagged.
4. **Function Length (LOC)**:
   Measures physical lines between function signature and closing brace. Warns when LOC $> \text{threshold}$ (default: 50).
5. **Naming Conventions (Configurable)**:
   Validates camelCase / snake_case conventions for functions and variables, and UPPER_CASE for constants.

---

## Interactive Web UI & Real-Time Studio

In addition to the high-performance C++ CLI, this project includes a **pure client-side Web IDE & Diagnostics Studio** built with modern HTML5, CSS3, and JavaScript:
- **Zero Dependencies**: 100% offline and portable — open [`index.html`](index.html) directly in any web browser without needing Node.js or a web server.
- **Interactive Code Studio**:
  - Live synchronized line numbers gutter.
  - Tab indentation handling (`    `) and real-time cursor coordinate indicator (`Ln X, Col Y`).
  - One-click presets (`Clean Code`, `Issues Sample`, `Complex Logic`, `Syntax Errors`).
  - File upload support (`.cpp`, `.c`, `.h`, `.hpp`, `.txt`), code copy, and clear tools.
  - Keyboard shortcut: <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to run analysis immediately.
- **Evaluation Dashboard**:
  - **Animated Circular Score Gauge**: Live SVG progress gauge displaying the Accuracy Score (0%–100%) and Grade badge (`A+`, `A`, `B`, `C`, `D`, `F`).
  - **Itemized Deductions Table**: Fully transparent list showing exact penalties applied for violations.
  - **Function Metrics Table**: Shows line range, physical LOC, nesting depth, McCabe $V(G)$, and risk badges.
- **Diagnostics Explorer**:
  - Filter by severity: `ALL`, `ERROR`, `WARNING`, `INFO`.
  - Search filter input to search issues in real time.
  - Code snippet boxes with column caret pointers (`^`) highlighting exact problem locations.
- **Token Stream Inspector**: Interactive table displaying token index, line, column, token type, subtype, and lexeme.
- **AST Hierarchy Tree**: Expandable/collapsible graphical representation of the parsed Abstract Syntax Tree.
- **Terminal Simulation**: Live ANSI-styled dark console view with 1-click clipboard copy.

#### Launching the Web UI:
Simply double-click [`index.html`](index.html) or open it with your default browser:
```powershell
# Open directly in Windows default browser
Start-Process index.html
```

---

## Architecture & Project Structure

```
CD/
├── CMakeLists.txt              # Cross-platform CMake configuration (C++17)
├── build.bat                   # Direct Windows batch build script (MinGW g++)
├── build.ps1                   # Direct Windows PowerShell build script
├── include/
│   ├── Token.h                 # Token classification and structures
│   ├── Lexer.h                 # Hand-written DFA tokenizer
│   ├── AST.h                   # Complete AST node hierarchy and Visitor
│   ├── Parser.h                # Recursive descent parser & panic recovery
│   ├── SymbolTable.h           # Lexical scope stack and symbol tracking
│   ├── Analyzer.h              # Static analysis engine & metrics
│   ├── Report.h                # Formatted Console and HTML generators
│   └── utils/
│       ├── CommandLine.h       # Command-line options parser
│       └── FileUtils.h         # File I/O and line parsing helpers
├── src/
│   ├── Token.cpp               # Token implementations
│   ├── Lexer.cpp               # DFA state machine
│   ├── AST.cpp                 # AST pretty-printer visitor
│   ├── Parser.cpp              # LL(1) grammar parsing implementation
│   ├── SymbolTable.cpp         # Scope stack implementation
│   ├── Analyzer.cpp            # Analysis passes (complexity, dead code, etc.)
│   ├── Report.cpp              # ANSI console and modern HTML generation
│   ├── utils/
│   │   ├── CommandLine.cpp     # CLI parsing
│   │   └── FileUtils.cpp       # File utilities
│   └── main.cpp                # Application entry point
├── index.html                  # Interactive Web UI studio & compiler dashboard
├── css/
│   └── style.css               # Modern developer dark theme (GitHub / VS Code)
├── js/
│   ├── lexer.js                # DFA tokenizer module with coordinate tracking
│   ├── parser.js               # LL(1) recursive descent parser & AST generator
│   ├── analyzer.js             # Semantic scope checker, McCabe V(G) & accuracy scorer
│   └── app.js                  # UI controller, presets, and terminal simulation
├── samples/
│   ├── test_issues.cpp         # Intentional issues (unused, undeclared, dead code, etc.)
│   ├── clean_code.cpp          # 100% clean baseline sample
│   └── complex_logic.cpp       # Intricate branching validating McCabe complexity
├── PROJECT_REPORT.docx         # Complete lab practical report with UML diagrams
├── PROJECT_SYNOPSIS.docx       # Practical synopsis document
└── README.md                   # Project documentation & viva guide
```

---

## Building the Project

### Option 1: Direct Build on Windows (MinGW / GCC)
No CMake required. Run either the batch script or PowerShell script:
```powershell
# Using the Batch script
.\build.bat

# Or using the PowerShell script
.\build.ps1
```
The binary will be generated at `bin/analyzer.exe`.

### Option 2: Using CMake (Cross-Platform: Windows, Linux, macOS)
```bash
cmake -B build
cmake --build build --config Release
```

---

## CLI Usage & Options

```bash
analyzer [source_file] [options]
```

| Option | Default | Description |
|---|---|---|
| `[source_file]` | *Optional* | Path to the source file. If omitted, launches **Interactive Input Mode** |
| `--interactive`, `-i` | `false` | Explicitly launch interactive terminal input prompt to paste code |
| `--report=<console\|html>` | `console` | Report format to display/generate |
| `--output=<path>` | `report.html` | Destination path for the generated HTML report |
| `--threshold-loc=<N>` | `50` | Maximum allowed Lines of Code (LOC) per function |
| `--threshold-nesting=<N>` | `4` | Maximum allowed control-flow nesting depth |
| `--threshold-complexity=<N>`| `10` | Cyclomatic complexity threshold per function |
| `--check-naming[=true\|false]` | `false` | Enable/disable identifier naming style checks |
| `--dump-tokens` | `false` | Dump the complete lexical token stream (great for viva!) |
| `--dump-ast` | `false` | Dump the formatted Abstract Syntax Tree (great for viva!) |
| `--help`, `-h` | - | Show usage options and examples |
| `--version`, `-v` | - | Display version and project info |

### Accuracy & Code Quality Scoring Formula

The analyzer computes a mathematically calibrated **Accuracy Score (0% – 100%)** and **Letter Grade**:
- **Base Score**: $100.0\%$
- **Deduction Penalties**:
  - Syntax & Lexical Errors: **-20.0%** per occurrence
  - Semantic Errors (Undeclared Variables): **-15.0%** per occurrence
  - Unused Variables: **-5.0%** per occurrence
  - Unreachable / Dead Code: **-8.0%** per occurrence
  - Excessive Nesting Depth ($> 4$): **-5.0%**
  - Excessive Function Length ($> 50$ LOC): **-4.0%**
  - High Cyclomatic Complexity ($> 10$): **-6.0%**
- **Grading Scale**:
  - **95% – 100%**: Grade **A+** (Outstanding / Clean Production Ready)
  - **85% – 94%**: Grade **A** (Excellent / Robust Structure)
  - **75% – 84%**: Grade **B** (Good / Minor Code Smells)
  - **60% – 74%**: Grade **C** (Fair / Refactoring Recommended)
  - **40% – 59%**: Grade **D** (Poor / Multiple Issues)
  - **< 40%**: Grade **F** (Failing / Critical Errors Detected)

### Example Usage Scenarios

#### 1. Interactive Direct Code Input (Paste & Analyze)
```bash
./bin/analyzer --interactive
# Or simply run without arguments:
./bin/analyzer
```
Prompt will appear:
```text
======================================================================
                INTERACTIVE C++ CODE INPUT MODE                       
======================================================================
Enter or paste your C++ code below.
To finish, type 'END' on an empty line or press Ctrl+Z:
----------------------------------------------------------------------
int main() {
    int unusedVal = 42;
    return 0;
}
END
```

#### 2. Piped Stdin Analysis
```powershell
Get-Content samples/test_issues.cpp | .\bin\analyzer.exe
```

#### 3. Analyzing a File Directly
```bash
./bin/analyzer samples/test_issues.cpp
```

#### 4. Viva Voce Demo (Inspect Lexer Tokens & AST)
```bash
./bin/analyzer samples/clean_code.cpp --dump-tokens --dump-ast
```

---

## Terminal Accuracy Report Features

The analyzer outputs a clean, ANSI-colored terminal report:
- **Executive Accuracy & Quality Score**: Prominently displayed percentage score ($0.0\% - 100.0\%$) and Letter Grade (A+, A, B, C, D, F).
- **Itemized Deductions Table**: Fully transparent list showing exactly which errors, unused variables, dead code, or complexity violations triggered point penalties.
- **Function Metrics & Complexity Table**: Tabulates every function with its exact line span, physical LOC, maximum control flow nesting depth, McCabe Cyclomatic Complexity value, and risk level.
- **Pinpointed Diagnostics**: Every detected error/warning shows its category, description, and source code line with a caret (`^`) pointing directly to the offending column coordinate.
- **Pass/Fail Verdict**: Final summary highlighting whether the code satisfies all quality standards.

---

## Test Samples & Validation

| Test File | Purpose | Expected Output |
|---|---|---|
| [`samples/test_issues.cpp`](samples/test_issues.cpp) | Exercises all static checks: unused variables, undeclared variable, dead code after return, nesting depth > 4, long function > 50 LOC, high complexity. | 1 Error, 7 Warnings, Status: `FAILED` |
| [`samples/clean_code.cpp`](samples/clean_code.cpp) | Idiomatic, well-factored code with modular functions and zero violations. | 0 Errors, 0 Warnings, Status: `PASSED` |
| [`samples/complex_logic.cpp`](samples/complex_logic.cpp) | Validates McCabe's formula $V(G) = P + 1$ with compound conditions (`&&`, `||`), loops, and branches. | Evaluates complexity of 9 accurately. |

---

## Viva Voce Q&A Cheat Sheet

Here are common Compiler Design viva questions and how they map to this project:

#### Q1: What is the difference between Lexical Analysis and Syntax Analysis?
> **Answer**: Lexical analysis (Phase 1) converts an unstructured stream of characters into discrete tokens using regular expressions and a Deterministic Finite Automaton (DFA). It strips whitespace and comments. Syntax analysis (Phase 2) takes those tokens and enforces grammatical structure according to a Context-Free Grammar (CFG), creating an Abstract Syntax Tree (AST).

#### Q2: Why did you choose a Recursive Descent parser instead of an automated tool like Bison or Yacc?
> **Answer**: Recursive descent is an LL(1) top-down parsing technique where each non-terminal in the grammar corresponds directly to a C++ function (`parseIfStatement()`, `parseForStatement()`, `parseAssignment()`). Implementing it manually demonstrates direct understanding of parsing algorithms, grammar factorization, and panic-mode error recovery, without relying on opaque generated tables.

#### Q3: How did you implement operator precedence without left recursion?
> **Answer**: We used **precedence climbing** (layered recursive descent). Lower-precedence operators (like assignment and logical OR) are at the top of the call hierarchy, calling higher-precedence levels (like multiplicative and unary) before combining them into binary AST nodes. This naturally preserves standard C/C++ associativity without infinite recursion.

#### Q4: How is the Symbol Table implemented and how does it detect unused variables?
> **Answer**: The Symbol Table is implemented as a **Stack of Hash Maps** (`std::vector<std::unordered_map<std::string, SymbolInfo>>`). When entering a block `{`, a new hash map is pushed (`enterScope()`). When exiting `}`, `exitScope()` iterates over all symbols in that top frame. If any symbol has `isUsed == false`, an **Unused Variable Warning** is emitted with its declaration line and column before the frame is popped.

#### Q5: What is McCabe's Cyclomatic Complexity and how does your analyzer compute it?
> **Answer**: Cyclomatic complexity measures the number of linearly independent execution paths through a program graph: $V(G) = E - N + 2P$. For structured programming, this simplifies to $V(G) = P + 1$, where $P$ is the count of predicate/decision nodes. Our AST Visitor visits each function and counts 1 point for the function base, plus 1 point for every `if`, `while`, `for`, `&&`, and `||`.

#### Q6: How does the analyzer detect dead code?
> **Answer**: Inside each `BlockStmtNode`, statements are executed sequentially. If our AST traversal encounters a terminating statement (`ReturnStmtNode`, `BreakStmtNode`, or `ContinueStmtNode`), any subsequent statement within that same block frame is mathematically unreachable, prompting an **Unreachable Code Warning**.

#### Q7: How does panic-mode error recovery work?
> **Answer**: When the parser encounters an unexpected token (e.g. missing closing parenthesis), it records a `ParseError` and calls `synchronize()`. It discards incoming tokens until it finds a synchronizing token—either a statement terminator (`;`) or a block delimiter (`}`)—allowing the parser to resume parsing subsequent declarations without aborting the entire compilation.
