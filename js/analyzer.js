/**
 * Analyzer.js - Static Semantic Analyzer, Metric Calculator & Accuracy Scorer
 * Part of C++ Static Code Analyzer & Quality Scorer
 */

const IssueSeverity = {
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
};

class SymbolInfo {
    constructor(name, type, line, column, isParameter = false, isConst = false, isFunction = false) {
        this.name = name;
        this.type = type;
        this.line = line;
        this.column = column;
        this.isParameter = isParameter;
        this.isConst = isConst;
        this.isFunction = isFunction;
        this.isUsed = false;
    }
}

class SymbolTable {
    constructor() {
        this.scopes = [];
        this.enterScope();
        this.initBuiltins();
    }

    initBuiltins() {
        const builtins = [
            "cout", "cin", "cerr", "endl", "std", "string", "vector",
            "printf", "scanf", "malloc", "free", "exit", "nullptr",
            "NULL", "size_t", "max", "min", "abs", "sqrt"
        ];
        for (const b of builtins) {
            const sym = new SymbolInfo(b, "builtin", 0, 0, false, false, true);
            sym.isUsed = true;
            this.scopes[0][b] = sym;
        }
    }

    enterScope() {
        this.scopes.push({});
    }

    exitScope(issues) {
        if (this.scopes.length === 0) return;
        const currentScope = this.scopes[this.scopes.length - 1];

        for (const name in currentScope) {
            const sym = currentScope[name];
            if (!sym.isUsed && !sym.isFunction && sym.name !== "_" && sym.name !== "argc" && sym.name !== "argv") {
                issues.push({
                    severity: IssueSeverity.WARNING,
                    category: "Unused Variable",
                    message: `Variable '${sym.name}' declared at line ${sym.line} is never used`,
                    line: sym.line,
                    column: sym.column,
                    functionName: ""
                });
            }
        }
        this.scopes.pop();
    }

    declare(symbol, issues) {
        if (this.scopes.length === 0) this.enterScope();
        const currentScope = this.scopes[this.scopes.length - 1];

        if (currentScope[symbol.name]) {
            issues.push({
                severity: IssueSeverity.ERROR,
                category: "Redeclaration",
                message: `Redeclaration of variable '${symbol.name}' (previous declaration at line ${currentScope[symbol.name].line})`,
                line: symbol.line,
                column: symbol.column,
                functionName: ""
            });
            return false;
        }

        currentScope[symbol.name] = symbol;
        return true;
    }

    markUsed(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i][name]) {
                this.scopes[i][name].isUsed = true;
                return true;
            }
        }
        return false;
    }

    exists(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i][name]) return true;
        }
        return false;
    }

    lookup(name) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i][name]) return this.scopes[i][name];
        }
        return null;
    }
}

class FunctionMetrics {
    constructor(name, returnType, startLine, endLine, loc) {
        this.name = name;
        this.returnType = returnType;
        this.startLine = startLine;
        this.endLine = endLine;
        this.loc = loc;
        this.cyclomaticComplexity = 1;
        this.maxNestingDepth = 0;
        this.riskLevel = "Low";
    }

    calculateRisk() {
        if (this.cyclomaticComplexity <= 10) {
            this.riskLevel = "Low";
        } else if (this.cyclomaticComplexity <= 20) {
            this.riskLevel = "Moderate";
        } else if (this.cyclomaticComplexity <= 40) {
            this.riskLevel = "High";
        } else {
            this.riskLevel = "Very High";
        }
    }
}

class AnalysisReportData {
    constructor(filename = "source.cpp", totalLines = 0) {
        this.filename = filename;
        this.totalLines = totalLines;
        this.totalFunctions = 0;
        this.issues = [];
        this.functions = [];
        this.accuracy = {
            score: 100.0,
            grade: "A+",
            description: "Outstanding (Clean, Production-Ready Code)",
            deductions: []
        };
    }

    getErrorCount() {
        return this.issues.filter(i => i.severity === IssueSeverity.ERROR).length;
    }

    getWarningCount() {
        return this.issues.filter(i => i.severity === IssueSeverity.WARNING).length;
    }

    getInfoCount() {
        return this.issues.filter(i => i.severity === IssueSeverity.INFO).length;
    }

    getAverageComplexity() {
        if (this.functions.length === 0) return 0.0;
        const sum = this.functions.reduce((acc, f) => acc + f.cyclomaticComplexity, 0);
        return parseFloat((sum / this.functions.length).toFixed(1));
    }

    calculateAccuracy() {
        this.accuracy.deductions = [];
        let currentScore = 100.0;

        let syntaxOrLexErrors = 0;
        let semanticErrors = 0;
        let unusedVars = 0;
        let deadCode = 0;
        let highNesting = 0;
        let longFunctions = 0;
        let highComplexity = 0;

        for (const issue of this.issues) {
            if (issue.category === "Syntax Error" || issue.category === "Lexical Error") {
                syntaxOrLexErrors++;
            } else if (issue.severity === IssueSeverity.ERROR) {
                semanticErrors++;
            } else if (issue.category === "Unused Variable") {
                unusedVars++;
            } else if (issue.category === "Dead Code") {
                deadCode++;
            } else if (issue.category === "Nesting Depth") {
                highNesting++;
            } else if (issue.category === "Function Length") {
                longFunctions++;
            } else if (issue.category === "High Complexity") {
                highComplexity++;
            }
        }

        if (syntaxOrLexErrors > 0) {
            const penalty = syntaxOrLexErrors * 20.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Syntax/Lexical Errors (${syntaxOrLexErrors}x -20%)`, points: penalty });
        }

        if (semanticErrors > 0) {
            const penalty = semanticErrors * 15.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Semantic / Undeclared Errors (${semanticErrors}x -15%)`, points: penalty });
        }

        if (unusedVars > 0) {
            const penalty = unusedVars * 5.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Unused Variables (${unusedVars}x -5%)`, points: penalty });
        }

        if (deadCode > 0) {
            const penalty = deadCode * 8.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Unreachable / Dead Code (${deadCode}x -8%)`, points: penalty });
        }

        if (highNesting > 0) {
            const penalty = highNesting * 5.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Excessive Nesting Depth (${highNesting}x -5%)`, points: penalty });
        }

        if (longFunctions > 0) {
            const penalty = longFunctions * 4.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `Excessive Function Length (${longFunctions}x -4%)`, points: penalty });
        }

        if (highComplexity > 0) {
            const penalty = highComplexity * 6.0;
            currentScore -= penalty;
            this.accuracy.deductions.push({ rule: `High Cyclomatic Complexity (${highComplexity}x -6%)`, points: penalty });
        }

        if (currentScore < 0.0) currentScore = 0.0;
        if (currentScore > 100.0) currentScore = 100.0;
        this.accuracy.score = parseFloat(currentScore.toFixed(1));

        if (currentScore >= 95.0) {
            this.accuracy.grade = "A+";
            this.accuracy.description = "Outstanding (Clean, Production-Ready Code)";
        } else if (currentScore >= 85.0) {
            this.accuracy.grade = "A";
            this.accuracy.description = "Excellent (Robust Structure, Minor Recommendations)";
        } else if (currentScore >= 75.0) {
            this.accuracy.grade = "B";
            this.accuracy.description = "Good (Solid Logic, Minor Code Quality Warnings)";
        } else if (currentScore >= 60.0) {
            this.accuracy.grade = "C";
            this.accuracy.description = "Fair (Multiple Warnings, Refactoring Recommended)";
        } else if (currentScore >= 40.0) {
            this.accuracy.grade = "D";
            this.accuracy.description = "Poor (Significant Structural Issues or Errors)";
        } else {
            this.accuracy.grade = "F";
            this.accuracy.description = "Failing (Critical Errors & Severe Code Smells)";
        }
    }
}

class Analyzer {
    constructor(config = {}) {
        this.config = Object.assign({
            thresholdLOC: 50,
            thresholdComplexity: 10,
            thresholdNesting: 4,
            checkNaming: true
        }, config);

        this.symbolTable = new SymbolTable();
        this.report = new AnalysisReportData();
        this.currentFunction = null;
        this.currentNestingDepth = 0;
        this.currentFunctionComplexity = 1;
        this.maxDepthInCurrentFunction = 0;
        this.insideFunction = false;
    }

    addIssue(severity, category, message, line, column) {
        this.report.issues.push({
            severity,
            category,
            message,
            functionName: this.currentFunction ? this.currentFunction.name : "global",
            line,
            column
        });
    }

    checkNamingConvention(name, isConst, isFunction, line, column) {
        if (!this.config.checkNaming || !name) return;

        if (isConst) {
            const hasLower = /[a-z]/.test(name);
            if (hasLower) {
                this.addIssue(IssueSeverity.INFO, "Naming Convention",
                    `Constant '${name}' should preferably be in UPPER_CASE`, line, column);
            }
        } else if (isFunction) {
            if (/^[A-Z]/.test(name)) {
                this.addIssue(IssueSeverity.INFO, "Naming Convention",
                    `Function '${name}' should preferably start with lowercase (camelCase or snake_case)`, line, column);
            }
        } else {
            if (/^[A-Z]/.test(name)) {
                this.addIssue(IssueSeverity.INFO, "Naming Convention",
                    `Variable '${name}' should preferably start with lowercase (camelCase or snake_case)`, line, column);
            }
        }
    }

    analyze(programNode, filename = "source.cpp", totalSourceLines = 0, initialIssues = []) {
        this.report = new AnalysisReportData(filename, totalSourceLines);
        this.symbolTable = new SymbolTable();

        // Include any initial syntax/lexical errors passed from Parser/Lexer
        if (initialIssues && initialIssues.length > 0) {
            for (const iss of initialIssues) {
                this.report.issues.push({
                    severity: iss.severity || IssueSeverity.ERROR,
                    category: iss.category || (iss.message && iss.message.includes('Unrecognized') ? "Lexical Error" : "Syntax Error"),
                    message: iss.message || "Syntax Error",
                    functionName: iss.functionName || "syntax",
                    line: iss.line || 1,
                    column: iss.column || 1
                });
            }
        }

        if (programNode) {
            this.visit(programNode);
        }

        // Global scope check for unused variables
        this.symbolTable.exitScope(this.report.issues);

        this.report.totalFunctions = this.report.functions.length;
        this.report.calculateAccuracy();
        return this.report;
    }

    visit(node) {
        if (!node) return;

        switch (node.nodeType) {
            case 'ProgramNode':
                return this.visitProgram(node);
            case 'VarDeclNode':
                return this.visitVarDecl(node);
            case 'ParamNode':
                return this.visitParam(node);
            case 'FunctionDeclNode':
                return this.visitFunctionDecl(node);
            case 'BlockStmtNode':
                return this.visitBlockStmt(node);
            case 'IfStmtNode':
                return this.visitIfStmt(node);
            case 'WhileStmtNode':
                return this.visitWhileStmt(node);
            case 'ForStmtNode':
                return this.visitForStmt(node);
            case 'ReturnStmtNode':
                return this.visitReturnStmt(node);
            case 'BreakStmtNode':
            case 'ContinueStmtNode':
                return;
            case 'ExprStmtNode':
                return this.visitExprStmt(node);
            case 'BinaryExprASTNode':
                return this.visitBinaryExpr(node);
            case 'UnaryExprASTNode':
                return this.visitUnaryExpr(node);
            case 'LiteralExprASTNode':
                return;
            case 'VariableExprASTNode':
                return this.visitVariableExpr(node);
            case 'CallExprASTNode':
                return this.visitCallExpr(node);
            case 'AssignExprASTNode':
                return this.visitAssignExpr(node);
            default:
                break;
        }
    }

    visitProgram(node) {
        for (const decl of node.declarations) {
            this.visit(decl);
        }
    }

    visitVarDecl(node) {
        this.checkNamingConvention(node.name, node.isConst, false, node.line, node.column);

        const sym = new SymbolInfo(node.name, node.type, node.line, node.column, false, node.isConst, false);
        this.symbolTable.declare(sym, this.report.issues);

        if (node.initializer) {
            this.visit(node.initializer);
        }
    }

    visitParam(node) {
        if (node.name) {
            this.checkNamingConvention(node.name, false, false, node.line, node.column);
            const sym = new SymbolInfo(node.name, node.type, node.line, node.column, true, false, false);
            sym.isUsed = true;
            this.symbolTable.declare(sym, this.report.issues);
        }
    }

    visitFunctionDecl(node) {
        const fnSym = new SymbolInfo(node.name, node.returnType, node.line, node.column, false, false, true);
        fnSym.isUsed = true;
        this.symbolTable.declare(fnSym, this.report.issues);

        this.checkNamingConvention(node.name, false, true, node.line, node.column);

        if (node.isDefinition && node.body) {
            const metrics = new FunctionMetrics(
                node.name,
                node.returnType,
                node.line,
                node.endLine,
                node.getLOC()
            );

            if (metrics.loc > this.config.thresholdLOC) {
                this.report.issues.push({
                    severity: IssueSeverity.WARNING,
                    category: "Function Length",
                    message: `Function '${node.name}' exceeds LOC threshold (${metrics.loc} lines > ${this.config.thresholdLOC} lines)`,
                    functionName: node.name,
                    line: node.line,
                    column: node.column
                });
            }

            this.currentFunctionComplexity = 1;
            this.currentNestingDepth = 0;
            this.maxDepthInCurrentFunction = 0;
            this.insideFunction = true;
            this.currentFunction = metrics;

            this.symbolTable.enterScope();

            for (const param of node.parameters) {
                this.visit(param);
            }

            let hasReturnOrTerminator = false;
            let termLine = 0;

            if (node.body && node.body.statements) {
                for (const stmt of node.body.statements) {
                    if (!stmt) continue;

                    if (hasReturnOrTerminator) {
                        this.addIssue(IssueSeverity.WARNING, "Dead Code",
                            `Unreachable code detected after terminating statement at line ${termLine}`,
                            stmt.line, stmt.column);
                        hasReturnOrTerminator = false;
                    }

                    this.visit(stmt);

                    if (stmt.nodeType === 'ReturnStmtNode' ||
                        stmt.nodeType === 'BreakStmtNode' ||
                        stmt.nodeType === 'ContinueStmtNode') {
                        hasReturnOrTerminator = true;
                        termLine = stmt.line;
                    }
                }
            }

            this.symbolTable.exitScope(this.report.issues);

            metrics.cyclomaticComplexity = this.currentFunctionComplexity;
            metrics.maxNestingDepth = this.maxDepthInCurrentFunction;
            metrics.calculateRisk();

            if (this.maxDepthInCurrentFunction > this.config.thresholdNesting) {
                this.report.issues.push({
                    severity: IssueSeverity.WARNING,
                    category: "Nesting Depth",
                    message: `Control flow nesting depth in function '${node.name}' exceeds threshold (${this.maxDepthInCurrentFunction} > ${this.config.thresholdNesting})`,
                    functionName: node.name,
                    line: node.line,
                    column: node.column
                });
            }

            if (this.currentFunctionComplexity > this.config.thresholdComplexity) {
                this.report.issues.push({
                    severity: IssueSeverity.WARNING,
                    category: "High Complexity",
                    message: `Function '${node.name}' has high cyclomatic complexity (${this.currentFunctionComplexity} > ${this.config.thresholdComplexity}) - Risk Level: ${metrics.riskLevel}`,
                    functionName: node.name,
                    line: node.line,
                    column: node.column
                });
            }

            this.report.functions.push(metrics);
            this.currentFunction = null;
            this.insideFunction = false;
        }
    }

    visitBlockStmt(node) {
        this.symbolTable.enterScope();

        let hasReturnOrTerminator = false;
        let termLine = 0;

        for (const stmt of node.statements) {
            if (!stmt) continue;

            if (hasReturnOrTerminator) {
                this.addIssue(IssueSeverity.WARNING, "Dead Code",
                    `Unreachable code detected after terminating statement at line ${termLine}`,
                    stmt.line, stmt.column);
                hasReturnOrTerminator = false;
            }

            this.visit(stmt);

            if (stmt.nodeType === 'ReturnStmtNode' ||
                stmt.nodeType === 'BreakStmtNode' ||
                stmt.nodeType === 'ContinueStmtNode') {
                hasReturnOrTerminator = true;
                termLine = stmt.line;
            }
        }

        this.symbolTable.exitScope(this.report.issues);
    }

    visitIfStmt(node) {
        if (this.insideFunction) {
            this.currentFunctionComplexity++;
            this.currentNestingDepth++;
            if (this.currentNestingDepth > this.maxDepthInCurrentFunction) {
                this.maxDepthInCurrentFunction = this.currentNestingDepth;
            }
        }

        if (node.condition) this.visit(node.condition);
        if (node.thenBranch) this.visit(node.thenBranch);
        if (node.elseBranch) this.visit(node.elseBranch);

        if (this.insideFunction) {
            this.currentNestingDepth--;
        }
    }

    visitWhileStmt(node) {
        if (this.insideFunction) {
            this.currentFunctionComplexity++;
            this.currentNestingDepth++;
            if (this.currentNestingDepth > this.maxDepthInCurrentFunction) {
                this.maxDepthInCurrentFunction = this.currentNestingDepth;
            }
        }

        if (node.condition) this.visit(node.condition);
        if (node.body) this.visit(node.body);

        if (this.insideFunction) {
            this.currentNestingDepth--;
        }
    }

    visitForStmt(node) {
        if (this.insideFunction) {
            this.currentFunctionComplexity++;
            this.currentNestingDepth++;
            if (this.currentNestingDepth > this.maxDepthInCurrentFunction) {
                this.maxDepthInCurrentFunction = this.currentNestingDepth;
            }
        }

        this.symbolTable.enterScope();
        if (node.init) this.visit(node.init);
        if (node.condition) this.visit(node.condition);
        if (node.update) this.visit(node.update);
        if (node.body) this.visit(node.body);
        this.symbolTable.exitScope(this.report.issues);

        if (this.insideFunction) {
            this.currentNestingDepth--;
        }
    }

    visitReturnStmt(node) {
        if (node.expression) {
            this.visit(node.expression);
        }
    }

    visitExprStmt(node) {
        if (node.expression) {
            this.visit(node.expression);
        }
    }

    visitBinaryExpr(node) {
        if (this.insideFunction && (node.op === "&&" || node.op === "||")) {
            this.currentFunctionComplexity++;
        }
        if (node.left) this.visit(node.left);
        if (node.right) this.visit(node.right);
    }

    visitUnaryExpr(node) {
        if (node.operand) {
            this.visit(node.operand);
        }
    }

    visitVariableExpr(node) {
        if (!this.symbolTable.exists(node.name)) {
            this.addIssue(IssueSeverity.ERROR, "Undeclared Variable",
                `Variable '${node.name}' is used without being declared`,
                node.line, node.column);
        } else {
            this.symbolTable.markUsed(node.name);
        }
    }

    visitCallExpr(node) {
        if (this.symbolTable.exists(node.callee)) {
            this.symbolTable.markUsed(node.callee);
        }
        for (const arg of node.arguments) {
            if (arg) this.visit(arg);
        }
    }

    visitAssignExpr(node) {
        if (!this.symbolTable.exists(node.varName)) {
            this.addIssue(IssueSeverity.ERROR, "Undeclared Variable",
                `Assignment to undeclared variable '${node.varName}'`,
                node.line, node.column);
        } else {
            this.symbolTable.markUsed(node.varName);
        }

        if (node.value) {
            this.visit(node.value);
        }
    }
}

if (typeof globalThis !== 'undefined') {
    globalThis.IssueSeverity = IssueSeverity;
    globalThis.SymbolInfo = SymbolInfo;
    globalThis.SymbolTable = SymbolTable;
    globalThis.FunctionMetrics = FunctionMetrics;
    globalThis.AnalysisReportData = AnalysisReportData;
    globalThis.Analyzer = Analyzer;
}

if (typeof window !== 'undefined') {
    window.IssueSeverity = IssueSeverity;
    window.SymbolInfo = SymbolInfo;
    window.SymbolTable = SymbolTable;
    window.FunctionMetrics = FunctionMetrics;
    window.AnalysisReportData = AnalysisReportData;
    window.Analyzer = Analyzer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IssueSeverity, SymbolInfo, SymbolTable, FunctionMetrics, AnalysisReportData, Analyzer };
}
