#include "Analyzer.h"
#include <cctype>
#include <algorithm>

int AnalysisReportData::getErrorCount() const {
    int count = 0;
    for (const auto& issue : issues) {
        if (issue.severity == IssueSeverity::ERROR) count++;
    }
    return count;
}

int AnalysisReportData::getWarningCount() const {
    int count = 0;
    for (const auto& issue : issues) {
        if (issue.severity == IssueSeverity::WARNING) count++;
    }
    return count;
}

int AnalysisReportData::getInfoCount() const {
    int count = 0;
    for (const auto& issue : issues) {
        if (issue.severity == IssueSeverity::INFO) count++;
    }
    return count;
}

double AnalysisReportData::getAverageComplexity() const {
    if (functions.empty()) return 0.0;
    double sum = 0;
    for (const auto& f : functions) {
        sum += f.cyclomaticComplexity;
    }
    return sum / static_cast<double>(functions.size());
}

void AnalysisReportData::calculateAccuracy() {
    accuracy.deductions.clear();
    double currentScore = 100.0;

    int syntaxOrLexErrors = 0;
    int semanticErrors = 0;
    int unusedVars = 0;
    int deadCode = 0;
    int highNesting = 0;
    int longFunctions = 0;
    int highComplexity = 0;

    for (const auto& issue : issues) {
        if (issue.category == "Syntax Error" || issue.category == "Lexical Error") {
            syntaxOrLexErrors++;
        } else if (issue.severity == IssueSeverity::ERROR) {
            semanticErrors++;
        } else if (issue.category == "Unused Variable") {
            unusedVars++;
        } else if (issue.category == "Dead Code") {
            deadCode++;
        } else if (issue.category == "Nesting Depth") {
            highNesting++;
        } else if (issue.category == "Function Length") {
            longFunctions++;
        } else if (issue.category == "High Complexity") {
            highComplexity++;
        }
    }

    if (syntaxOrLexErrors > 0) {
        double penalty = syntaxOrLexErrors * 20.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Syntax/Lexical Errors (" + std::to_string(syntaxOrLexErrors) + "x -20%)", penalty});
    }

    if (semanticErrors > 0) {
        double penalty = semanticErrors * 15.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Semantic / Undeclared Errors (" + std::to_string(semanticErrors) + "x -15%)", penalty});
    }

    if (unusedVars > 0) {
        double penalty = unusedVars * 5.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Unused Variables (" + std::to_string(unusedVars) + "x -5%)", penalty});
    }

    if (deadCode > 0) {
        double penalty = deadCode * 8.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Unreachable / Dead Code (" + std::to_string(deadCode) + "x -8%)", penalty});
    }

    if (highNesting > 0) {
        double penalty = highNesting * 5.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Excessive Nesting Depth (" + std::to_string(highNesting) + "x -5%)", penalty});
    }

    if (longFunctions > 0) {
        double penalty = longFunctions * 4.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"Excessive Function Length (" + std::to_string(longFunctions) + "x -4%)", penalty});
    }

    if (highComplexity > 0) {
        double penalty = highComplexity * 6.0;
        currentScore -= penalty;
        accuracy.deductions.push_back({"High Cyclomatic Complexity (" + std::to_string(highComplexity) + "x -6%)", penalty});
    }

    if (currentScore < 0.0) currentScore = 0.0;
    if (currentScore > 100.0) currentScore = 100.0;
    accuracy.score = currentScore;

    if (currentScore >= 95.0) {
        accuracy.grade = "A+";
        accuracy.description = "Outstanding (Clean, Production-Ready Code)";
    } else if (currentScore >= 85.0) {
        accuracy.grade = "A";
        accuracy.description = "Excellent (Robust Structure, Minor Recommendations)";
    } else if (currentScore >= 75.0) {
        accuracy.grade = "B";
        accuracy.description = "Good (Solid Logic, Minor Code Quality Warnings)";
    } else if (currentScore >= 60.0) {
        accuracy.grade = "C";
        accuracy.description = "Fair (Multiple Warnings, Refactoring Recommended)";
    } else if (currentScore >= 40.0) {
        accuracy.grade = "D";
        accuracy.description = "Poor (Significant Structural Issues or Errors)";
    } else {
        accuracy.grade = "F";
        accuracy.description = "Failing (Critical Errors & Severe Code Smells)";
    }
}

Analyzer::Analyzer(AnalysisConfig config)
    : config_(config), currentFunction_(nullptr), currentNestingDepth_(0),
      currentFunctionComplexity_(1), maxDepthInCurrentFunction_(0), insideFunction_(false) {}

void Analyzer::addIssue(IssueSeverity severity, const std::string& category,
                        const std::string& message, int line, int column) {
    AnalysisIssue issue;
    issue.severity = severity;
    issue.category = category;
    issue.message = message;
    issue.functionName = (currentFunction_ ? currentFunction_->name : "global");
    issue.line = line;
    issue.column = column;
    report_.issues.push_back(issue);
}

void Analyzer::checkNamingConvention(const std::string& name, bool isConst, bool isFunction, int line, int column) {
    if (!config_.checkNaming || name.empty()) return;

    if (isConst) {
        // Constants should preferably be UPPER_CASE
        bool hasLower = false;
        for (char c : name) {
            if (std::islower(static_cast<unsigned char>(c))) {
                hasLower = true;
                break;
            }
        }
        if (hasLower) {
            addIssue(IssueSeverity::INFO, "Naming Convention",
                     "Constant '" + name + "' should preferably be in UPPER_CASE", line, column);
        }
    } else if (isFunction) {
        // Functions typically start with lower case (camelCase or snake_case)
        if (std::isupper(static_cast<unsigned char>(name[0]))) {
            addIssue(IssueSeverity::INFO, "Naming Convention",
                     "Function '" + name + "' should preferably start with lowercase (camelCase or snake_case)",
                     line, column);
        }
    } else {
        // Variables should start with lower case
        if (std::isupper(static_cast<unsigned char>(name[0]))) {
            addIssue(IssueSeverity::INFO, "Naming Convention",
                     "Variable '" + name + "' should preferably start with lowercase (camelCase or snake_case)",
                     line, column);
        }
    }
}

AnalysisReportData Analyzer::analyze(ProgramNode& program, const std::string& filename, int totalSourceLines) {
    report_ = AnalysisReportData();
    report_.filename = filename;
    report_.totalLines = totalSourceLines;

    program.accept(*this);

    // Final global scope cleanup
    symbolTable_.exitScope(report_.issues);

    report_.totalFunctions = static_cast<int>(report_.functions.size());
    report_.calculateAccuracy();
    return report_;
}

void Analyzer::visit(ProgramNode& node) {
    for (const auto& decl : node.declarations) {
        if (decl) decl->accept(*this);
    }
}

void Analyzer::visit(TypeNode& /*node*/) {
    // Type checking information
}

void Analyzer::visit(VarDeclNode& node) {
    checkNamingConvention(node.name, node.isConst, false, node.line, node.column);

    SymbolInfo sym(node.name, node.type, node.line, node.column, false, node.isConst, false);
    symbolTable_.declare(sym, report_.issues);

    if (node.initializer) {
        node.initializer->accept(*this);
    }
}

void Analyzer::visit(ParamNode& node) {
    if (!node.name.empty()) {
        checkNamingConvention(node.name, false, false, node.line, node.column);
        SymbolInfo sym(node.name, node.type, node.line, node.column, true, false, false);
        // Parameters are considered marked used or checked if strictly required
        sym.isUsed = true;
        symbolTable_.declare(sym, report_.issues);
    }
}

void Analyzer::visit(FunctionDeclNode& node) {
    // Register function symbol in current scope
    SymbolInfo fnSym(node.name, node.returnType, node.line, node.column, false, false, true);
    fnSym.isUsed = true;
    symbolTable_.declare(fnSym, report_.issues);

    checkNamingConvention(node.name, false, true, node.line, node.column);

    if (node.isDefinition && node.body) {
        FunctionMetrics metrics;
        metrics.name = node.name;
        metrics.returnType = node.returnType;
        metrics.startLine = node.line;
        metrics.endLine = node.endLine;
        metrics.loc = node.getLOC();

        // Check function length (LOC)
        if (metrics.loc > config_.thresholdLOC) {
            AnalysisIssue issue;
            issue.severity = IssueSeverity::WARNING;
            issue.category = "Function Length";
            issue.message = "Function '" + node.name + "' exceeds LOC threshold (" +
                            std::to_string(metrics.loc) + " lines > " +
                            std::to_string(config_.thresholdLOC) + " lines)";
            issue.functionName = node.name;
            issue.line = node.line;
            issue.column = node.column;
            report_.issues.push_back(issue);
        }

        // Setup metrics tracking
        currentFunctionComplexity_ = 1; // Base complexity
        currentNestingDepth_ = 0;
        maxDepthInCurrentFunction_ = 0;
        insideFunction_ = true;
        currentFunction_ = &metrics;

        // Enter function scope
        symbolTable_.enterScope();

        // Add parameters
        for (const auto& param : node.parameters) {
            if (param) param->accept(*this);
        }

        // Visit body statements directly (without extra nesting for body root)
        if (node.body) {
            // Process block statements directly in function scope
            bool hasReturnOrTerminator = false;
            int termLine = 0;

            for (const auto& stmt : node.body->statements) {
                if (!stmt) continue;

                if (hasReturnOrTerminator) {
                    addIssue(IssueSeverity::WARNING, "Dead Code",
                             "Unreachable code detected after terminating statement at line " +
                             std::to_string(termLine), stmt->line, stmt->column);
                    // Flag only first dead code sequence per block to avoid spam
                    hasReturnOrTerminator = false;
                }

                stmt->accept(*this);

                if (dynamic_cast<ReturnStmtNode*>(stmt.get()) ||
                    dynamic_cast<BreakStmtNode*>(stmt.get()) ||
                    dynamic_cast<ContinueStmtNode*>(stmt.get())) {
                    hasReturnOrTerminator = true;
                    termLine = stmt->line;
                }
            }
        }

        // Exit function scope
        symbolTable_.exitScope(report_.issues);

        metrics.cyclomaticComplexity = currentFunctionComplexity_;
        metrics.maxNestingDepth = maxDepthInCurrentFunction_;
        metrics.calculateRisk();

        // Check nesting depth threshold
        if (maxDepthInCurrentFunction_ > config_.thresholdNesting) {
            AnalysisIssue issue;
            issue.severity = IssueSeverity::WARNING;
            issue.category = "Nesting Depth";
            issue.message = "Control flow nesting depth in function '" + node.name +
                            "' exceeds threshold (" + std::to_string(maxDepthInCurrentFunction_) +
                            " > " + std::to_string(config_.thresholdNesting) + ")";
            issue.functionName = node.name;
            issue.line = node.line;
            issue.column = node.column;
            report_.issues.push_back(issue);
        }

        // Check cyclomatic complexity threshold
        if (currentFunctionComplexity_ > config_.thresholdComplexity) {
            AnalysisIssue issue;
            issue.severity = IssueSeverity::WARNING;
            issue.category = "High Complexity";
            issue.message = "Function '" + node.name + "' has high cyclomatic complexity (" +
                            std::to_string(currentFunctionComplexity_) + " > " +
                            std::to_string(config_.thresholdComplexity) + ") - Risk Level: " + metrics.riskLevel;
            issue.functionName = node.name;
            issue.line = node.line;
            issue.column = node.column;
            report_.issues.push_back(issue);
        }

        report_.functions.push_back(metrics);
        currentFunction_ = nullptr;
        insideFunction_ = false;
    }
}

void Analyzer::visit(BlockStmtNode& node) {
    symbolTable_.enterScope();

    bool hasReturnOrTerminator = false;
    int termLine = 0;

    for (const auto& stmt : node.statements) {
        if (!stmt) continue;

        if (hasReturnOrTerminator) {
            addIssue(IssueSeverity::WARNING, "Dead Code",
                     "Unreachable code detected after terminating statement at line " +
                     std::to_string(termLine), stmt->line, stmt->column);
            hasReturnOrTerminator = false;
        }

        stmt->accept(*this);

        if (dynamic_cast<ReturnStmtNode*>(stmt.get()) ||
            dynamic_cast<BreakStmtNode*>(stmt.get()) ||
            dynamic_cast<ContinueStmtNode*>(stmt.get())) {
            hasReturnOrTerminator = true;
            termLine = stmt->line;
        }
    }

    symbolTable_.exitScope(report_.issues);
}

void Analyzer::visit(IfStmtNode& node) {
    if (insideFunction_) {
        currentFunctionComplexity_++; // +1 for 'if'
        currentNestingDepth_++;
        if (currentNestingDepth_ > maxDepthInCurrentFunction_) {
            maxDepthInCurrentFunction_ = currentNestingDepth_;
        }
    }

    if (node.condition) node.condition->accept(*this);
    if (node.thenBranch) node.thenBranch->accept(*this);
    if (node.elseBranch) node.elseBranch->accept(*this);

    if (insideFunction_) {
        currentNestingDepth_--;
    }
}

void Analyzer::visit(WhileStmtNode& node) {
    if (insideFunction_) {
        currentFunctionComplexity_++; // +1 for 'while'
        currentNestingDepth_++;
        if (currentNestingDepth_ > maxDepthInCurrentFunction_) {
            maxDepthInCurrentFunction_ = currentNestingDepth_;
        }
    }

    if (node.condition) node.condition->accept(*this);
    if (node.body) node.body->accept(*this);

    if (insideFunction_) {
        currentNestingDepth_--;
    }
}

void Analyzer::visit(ForStmtNode& node) {
    if (insideFunction_) {
        currentFunctionComplexity_++; // +1 for 'for'
        currentNestingDepth_++;
        if (currentNestingDepth_ > maxDepthInCurrentFunction_) {
            maxDepthInCurrentFunction_ = currentNestingDepth_;
        }
    }

    symbolTable_.enterScope();
    if (node.init) node.init->accept(*this);
    if (node.condition) node.condition->accept(*this);
    if (node.update) node.update->accept(*this);
    if (node.body) node.body->accept(*this);
    symbolTable_.exitScope(report_.issues);

    if (insideFunction_) {
        currentNestingDepth_--;
    }
}

void Analyzer::visit(ReturnStmtNode& node) {
    if (node.expression) {
        node.expression->accept(*this);
    }
}

void Analyzer::visit(BreakStmtNode& /*node*/) {}

void Analyzer::visit(ContinueStmtNode& /*node*/) {}

void Analyzer::visit(ExprStmtNode& node) {
    if (node.expression) {
        node.expression->accept(*this);
    }
}

void Analyzer::visit(BinaryExprASTNode& node) {
    // McCabe's Cyclomatic Complexity: logical AND (&&) and logical OR (||) create decision branches
    if (insideFunction_ && (node.op == "&&" || node.op == "||")) {
        currentFunctionComplexity_++;
    }

    if (node.left) node.left->accept(*this);
    if (node.right) node.right->accept(*this);
}

void Analyzer::visit(UnaryExprASTNode& node) {
    if (node.operand) {
        node.operand->accept(*this);
    }
}

void Analyzer::visit(LiteralExprASTNode& /*node*/) {}

void Analyzer::visit(VariableExprASTNode& node) {
    if (!symbolTable_.exists(node.name)) {
        addIssue(IssueSeverity::ERROR, "Undeclared Variable",
                 "Variable '" + node.name + "' is used without being declared",
                 node.line, node.column);
    } else {
        symbolTable_.markUsed(node.name);
    }
}

void Analyzer::visit(CallExprASTNode& node) {
    // Mark callee function used if it exists in symbol table
    if (symbolTable_.exists(node.callee)) {
        symbolTable_.markUsed(node.callee);
    }

    for (const auto& arg : node.arguments) {
        if (arg) arg->accept(*this);
    }
}

void Analyzer::visit(AssignExprASTNode& node) {
    if (!symbolTable_.exists(node.varName)) {
        addIssue(IssueSeverity::ERROR, "Undeclared Variable",
                 "Assignment to undeclared variable '" + node.varName + "'",
                 node.line, node.column);
    } else {
        symbolTable_.markUsed(node.varName);
    }

    if (node.value) {
        node.value->accept(*this);
    }
}
