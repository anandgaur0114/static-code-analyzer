#ifndef SYMBOL_TABLE_H
#define SYMBOL_TABLE_H

#include <string>
#include <vector>
#include <unordered_map>
#include <memory>

enum class IssueSeverity {
    INFO,
    WARNING,
    ERROR
};

struct AnalysisIssue {
    IssueSeverity severity;
    std::string category;     // e.g., "Unused Variable", "Complexity", "Dead Code"
    std::string message;
    std::string functionName; // Contextual function if available
    int line;
    int column;

    std::string severityToString() const {
        switch (severity) {
            case IssueSeverity::INFO:    return "INFO";
            case IssueSeverity::WARNING: return "WARNING";
            case IssueSeverity::ERROR:   return "ERROR";
            default:                     return "UNKNOWN";
        }
    }
};

struct SymbolInfo {
    std::string name;
    std::string type;
    int line;
    int column;
    bool isUsed;
    bool isParam;
    bool isConst;
    bool isFunction;

    SymbolInfo(std::string name = "", std::string type = "int", int line = 1, int column = 1,
               bool isParam = false, bool isConst = false, bool isFunction = false)
        : name(std::move(name)), type(std::move(type)), line(line), column(column),
          isUsed(false), isParam(isParam), isConst(isConst), isFunction(isFunction) {}
};

class SymbolTable {
public:
    SymbolTable();

    void enterScope();
    void exitScope(std::vector<AnalysisIssue>& issues);

    bool declare(const SymbolInfo& symbol, std::vector<AnalysisIssue>& issues);
    bool markUsed(const std::string& name);
    bool exists(const std::string& name) const;
    const SymbolInfo* lookup(const std::string& name) const;
    SymbolInfo* lookup(const std::string& name);

    int currentDepth() const { return static_cast<int>(scopes_.size()); }

private:
    std::vector<std::unordered_map<std::string, SymbolInfo>> scopes_;

    void initBuiltins();
};

#endif // SYMBOL_TABLE_H
