#include "SymbolTable.h"

SymbolTable::SymbolTable() {
    enterScope(); // Global scope
    initBuiltins();
}

void SymbolTable::initBuiltins() {
    // Standard library and common symbols
    static const std::vector<std::string> builtins = {
        "cout", "cin", "cerr", "endl", "std", "string", "vector",
        "printf", "scanf", "malloc", "free", "exit", "nullptr",
        "NULL", "size_t", "max", "min", "abs", "sqrt"
    };

    for (const auto& b : builtins) {
        SymbolInfo info(b, "builtin", 0, 0, false, false, true);
        info.isUsed = true; // Builtins are always marked used
        scopes_.front()[b] = info;
    }
}

void SymbolTable::enterScope() {
    scopes_.emplace_back();
}

void SymbolTable::exitScope(std::vector<AnalysisIssue>& issues) {
    if (scopes_.empty()) return;

    // Check for unused variables in the scope being exited
    const auto& currentScope = scopes_.back();
    for (const auto& pair : currentScope) {
        const auto& sym = pair.second;
        // Don't warn for built-in or dummy identifiers (like _ or unused markers)
        if (!sym.isUsed && !sym.isFunction && sym.name != "_" && sym.name != "argc" && sym.name != "argv") {
            AnalysisIssue issue;
            issue.severity = IssueSeverity::WARNING;
            issue.category = "Unused Variable";
            issue.message = "Variable '" + sym.name + "' declared at line " +
                            std::to_string(sym.line) + " is never used";
            issue.line = sym.line;
            issue.column = sym.column;
            issues.push_back(issue);
        }
    }

    scopes_.pop_back();
}

bool SymbolTable::declare(const SymbolInfo& symbol, std::vector<AnalysisIssue>& issues) {
    if (scopes_.empty()) enterScope();

    auto& currentScope = scopes_.back();
    auto it = currentScope.find(symbol.name);
    if (it != currentScope.end()) {
        // Redefined in the same scope
        AnalysisIssue issue;
        issue.severity = IssueSeverity::ERROR;
        issue.category = "Redeclaration";
        issue.message = "Redeclaration of variable '" + symbol.name + "' (previous declaration at line " +
                        std::to_string(it->second.line) + ")";
        issue.line = symbol.line;
        issue.column = symbol.column;
        issues.push_back(issue);
        return false;
    }

    currentScope[symbol.name] = symbol;
    return true;
}

bool SymbolTable::markUsed(const std::string& name) {
    for (auto it = scopes_.rbegin(); it != scopes_.rend(); ++it) {
        auto entry = it->find(name);
        if (entry != it->end()) {
            entry->second.isUsed = true;
            return true;
        }
    }
    return false;
}

bool SymbolTable::exists(const std::string& name) const {
    return lookup(name) != nullptr;
}

const SymbolInfo* SymbolTable::lookup(const std::string& name) const {
    for (auto it = scopes_.rbegin(); it != scopes_.rend(); ++it) {
        auto entry = it->find(name);
        if (entry != it->end()) {
            return &(entry->second);
        }
    }
    return nullptr;
}

SymbolInfo* SymbolTable::lookup(const std::string& name) {
    for (auto it = scopes_.rbegin(); it != scopes_.rend(); ++it) {
        auto entry = it->find(name);
        if (entry != it->end()) {
            return &(entry->second);
        }
    }
    return nullptr;
}
