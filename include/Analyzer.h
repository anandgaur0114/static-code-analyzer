#ifndef ANALYZER_H
#define ANALYZER_H

#include "AST.h"
#include "SymbolTable.h"
#include <string>
#include <vector>
#include <memory>

struct FunctionMetrics {
    std::string name;
    std::string returnType;
    int startLine;
    int endLine;
    int loc;
    int cyclomaticComplexity;
    int maxNestingDepth;
    std::string riskLevel; // "Low", "Moderate", "High", "Critical"

    void calculateRisk() {
        if (cyclomaticComplexity <= 10) {
            riskLevel = "Low";
        } else if (cyclomaticComplexity <= 20) {
            riskLevel = "Moderate";
        } else if (cyclomaticComplexity <= 50) {
            riskLevel = "High";
        } else {
            riskLevel = "Critical";
        }
    }
};

struct AnalysisConfig {
    int thresholdLOC = 50;
    int thresholdNesting = 4;
    int thresholdComplexity = 10;
    bool checkNaming = false;
};

struct AccuracyScore {
    double score = 100.0;
    std::string grade = "A";
    std::string description = "Excellent (Production Ready)";
    std::vector<std::pair<std::string, double>> deductions;
};

struct AnalysisReportData {
    std::string filename;
    int totalLines = 0;
    int totalFunctions = 0;
    std::vector<FunctionMetrics> functions;
    std::vector<AnalysisIssue> issues;
    AccuracyScore accuracy;

    int getErrorCount() const;
    int getWarningCount() const;
    int getInfoCount() const;
    double getAverageComplexity() const;
    void calculateAccuracy();
};

class Analyzer : public ASTVisitor {
public:
    explicit Analyzer(AnalysisConfig config = AnalysisConfig());

    // Run all static analysis passes on AST
    AnalysisReportData analyze(ProgramNode& program, const std::string& filename, int totalSourceLines);

    // Visitor methods
    void visit(ProgramNode& node) override;
    void visit(TypeNode& node) override;
    void visit(VarDeclNode& node) override;
    void visit(ParamNode& node) override;
    void visit(FunctionDeclNode& node) override;
    void visit(BlockStmtNode& node) override;
    void visit(IfStmtNode& node) override;
    void visit(WhileStmtNode& node) override;
    void visit(ForStmtNode& node) override;
    void visit(ReturnStmtNode& node) override;
    void visit(BreakStmtNode& node) override;
    void visit(ContinueStmtNode& node) override;
    void visit(ExprStmtNode& node) override;
    void visit(BinaryExprASTNode& node) override;
    void visit(UnaryExprASTNode& node) override;
    void visit(LiteralExprASTNode& node) override;
    void visit(VariableExprASTNode& node) override;
    void visit(CallExprASTNode& node) override;
    void visit(AssignExprASTNode& node) override;

private:
    AnalysisConfig config_;
    SymbolTable symbolTable_;
    AnalysisReportData report_;

    // Contextual state during traversal
    FunctionMetrics* currentFunction_;
    int currentNestingDepth_;
    int currentFunctionComplexity_;
    int maxDepthInCurrentFunction_;
    bool insideFunction_;

    // Helper checking methods
    void checkNamingConvention(const std::string& name, bool isConst, bool isFunction, int line, int column);
    void addIssue(IssueSeverity severity, const std::string& category,
                  const std::string& message, int line, int column);
};

#endif // ANALYZER_H
