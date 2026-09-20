#ifndef PARSER_H
#define PARSER_H

#include "Token.h"
#include "AST.h"
#include <vector>
#include <memory>
#include <string>

struct ParseError {
    std::string message;
    int line;
    int column;
};

class Parser {
public:
    explicit Parser(std::vector<Token> tokens, std::string filename = "<source>");

    // Parse the entire token stream into a ProgramNode AST
    std::unique_ptr<ProgramNode> parseProgram();

    const std::vector<ParseError>& getErrors() const { return errors_; }
    bool hasErrors() const { return !errors_.empty(); }

private:
    std::vector<Token> tokens_;
    std::string filename_;
    size_t current_;
    std::vector<ParseError> errors_;

    // Navigation & Inspection
    const Token& peek() const;
    const Token& previous() const;
    bool isAtEnd() const;
    const Token& advance();
    bool check(TokenType type) const;
    bool match(TokenType type);
    bool matchAny(const std::vector<TokenType>& types);
    const Token& consume(TokenType type, const std::string& errorMessage);

    // Error handling & Panic-mode Recovery
    void error(const Token& token, const std::string& message);
    void synchronize();

    // Type parsing
    bool isTypeSpecifier() const;
    std::string parseType(bool& isConst);

    // Grammar rules
    std::unique_ptr<ASTNode> parseTopLevelDeclaration();
    std::unique_ptr<FunctionDeclNode> parseFunction(const std::string& returnType, const Token& nameToken);
    std::vector<std::unique_ptr<ASTNode>> parseVarDeclaration(bool isConst, const std::string& typeName);

    std::unique_ptr<ASTNode> parseStatement();
    std::unique_ptr<BlockStmtNode> parseBlock();
    std::unique_ptr<IfStmtNode> parseIfStatement();
    std::unique_ptr<WhileStmtNode> parseWhileStatement();
    std::unique_ptr<ForStmtNode> parseForStatement();
    std::unique_ptr<ReturnStmtNode> parseReturnStatement();
    std::unique_ptr<BreakStmtNode> parseBreakStatement();
    std::unique_ptr<ContinueStmtNode> parseContinueStatement();
    std::unique_ptr<ASTNode> parseExpressionStatement();

    // Expression precedence hierarchy
    std::unique_ptr<ExprNode> parseExpression();
    std::unique_ptr<ExprNode> parseAssignment();
    std::unique_ptr<ExprNode> parseLogicalOr();
    std::unique_ptr<ExprNode> parseLogicalAnd();
    std::unique_ptr<ExprNode> parseBitwiseOr();
    std::unique_ptr<ExprNode> parseBitwiseXor();
    std::unique_ptr<ExprNode> parseBitwiseAnd();
    std::unique_ptr<ExprNode> parseEquality();
    std::unique_ptr<ExprNode> parseRelational();
    std::unique_ptr<ExprNode> parseShift();
    std::unique_ptr<ExprNode> parseAdditive();
    std::unique_ptr<ExprNode> parseMultiplicative();
    std::unique_ptr<ExprNode> parseUnary();
    std::unique_ptr<ExprNode> parsePostfix();
    std::unique_ptr<ExprNode> parsePrimary();
};

#endif // PARSER_H
