#include "Parser.h"
#include <iostream>

Parser::Parser(std::vector<Token> tokens, std::string filename)
    : tokens_(std::move(tokens)), filename_(std::move(filename)), current_(0) {}

const Token& Parser::peek() const {
    if (current_ >= tokens_.size()) {
        static Token eofTok(TokenType::END_OF_FILE, "", 0, 0);
        return eofTok;
    }
    return tokens_[current_];
}

const Token& Parser::previous() const {
    if (current_ == 0) return tokens_[0];
    return tokens_[current_ - 1];
}

bool Parser::isAtEnd() const {
    return peek().type == TokenType::END_OF_FILE;
}

const Token& Parser::advance() {
    if (!isAtEnd()) current_++;
    return previous();
}

bool Parser::check(TokenType type) const {
    if (isAtEnd()) return false;
    return peek().type == type;
}

bool Parser::match(TokenType type) {
    if (check(type)) {
        advance();
        return true;
    }
    return false;
}

bool Parser::matchAny(const std::vector<TokenType>& types) {
    for (TokenType t : types) {
        if (check(t)) {
            advance();
            return true;
        }
    }
    return false;
}

const Token& Parser::consume(TokenType type, const std::string& errorMessage) {
    if (check(type)) return advance();
    error(peek(), errorMessage);
    static Token errorTok(TokenType::UNKNOWN, "", 0, 0);
    return errorTok;
}

void Parser::error(const Token& token, const std::string& message) {
    errors_.push_back({message, token.line, token.column});
}

void Parser::synchronize() {
    advance();
    while (!isAtEnd()) {
        if (previous().type == TokenType::SEMICOLON || previous().type == TokenType::RBRACE) {
            return;
        }
        switch (peek().type) {
            case TokenType::KEYWORD_CLASS:
            case TokenType::KEYWORD_STRUCT:
            case TokenType::KEYWORD_INT:
            case TokenType::KEYWORD_FLOAT:
            case TokenType::KEYWORD_DOUBLE:
            case TokenType::KEYWORD_CHAR:
            case TokenType::KEYWORD_VOID:
            case TokenType::KEYWORD_BOOL:
            case TokenType::KEYWORD_IF:
            case TokenType::KEYWORD_WHILE:
            case TokenType::KEYWORD_FOR:
            case TokenType::KEYWORD_RETURN:
                return;
            default:
                break;
        }
        advance();
    }
}

bool Parser::isTypeSpecifier() const {
    if (check(TokenType::KEYWORD_CONST)) return true;
    if (peek().isTypeSpecifier()) return true;
    // Check if it's a user-defined type: IDENTIFIER followed by another IDENTIFIER
    if (check(TokenType::IDENTIFIER) && current_ + 1 < tokens_.size()) {
        if (tokens_[current_ + 1].type == TokenType::IDENTIFIER ||
            tokens_[current_ + 1].type == TokenType::STAR ||
            tokens_[current_ + 1].type == TokenType::BITWISE_AND) {
            return true;
        }
    }
    return false;
}

std::string Parser::parseType(bool& isConst) {
    isConst = false;
    if (match(TokenType::KEYWORD_CONST)) {
        isConst = true;
    }

    std::string typeName;
    if (peek().isTypeSpecifier() || check(TokenType::IDENTIFIER)) {
        typeName = advance().lexeme;
    } else {
        error(peek(), "Expected type name");
        typeName = "int";
    }

    // Handle pointers / references like int* or char&
    while (check(TokenType::STAR) || check(TokenType::BITWISE_AND)) {
        typeName += advance().lexeme;
    }

    return typeName;
}

std::unique_ptr<ProgramNode> Parser::parseProgram() {
    auto program = std::make_unique<ProgramNode>(1, 1);

    while (!isAtEnd()) {
        // Skip stray semicolons
        if (match(TokenType::SEMICOLON)) continue;

        try {
            auto decl = parseTopLevelDeclaration();
            if (decl) {
                program->declarations.push_back(std::move(decl));
            }
        } catch (...) {
            synchronize();
        }
    }

    return program;
}

std::unique_ptr<ASTNode> Parser::parseTopLevelDeclaration() {
    if (isTypeSpecifier()) {
        bool isConst = false;
        size_t lookahead = current_;
        if (tokens_[lookahead].type == TokenType::KEYWORD_CONST) lookahead++;
        if (lookahead < tokens_.size()) lookahead++; // type name
        while (lookahead < tokens_.size() && 
               (tokens_[lookahead].type == TokenType::STAR || tokens_[lookahead].type == TokenType::BITWISE_AND)) {
            lookahead++;
        }

        // Now look at the token after the type
        if (lookahead < tokens_.size() && tokens_[lookahead].type == TokenType::IDENTIFIER) {
            size_t afterName = lookahead + 1;
            if (afterName < tokens_.size() && tokens_[afterName].type == TokenType::LPAREN) {
                // Function declaration or definition!
                std::string returnType = parseType(isConst);
                Token nameTok = advance(); // function name
                return parseFunction(returnType, nameTok);
            }
        }

        // Otherwise, it's a variable declaration
        std::string typeName = parseType(isConst);
        auto varDecls = parseVarDeclaration(isConst, typeName);
        if (!varDecls.empty()) {
            if (varDecls.size() == 1) {
                return std::move(varDecls[0]);
            } else {
                auto block = std::make_unique<BlockStmtNode>(varDecls[0]->line, varDecls[0]->column);
                for (auto& vd : varDecls) {
                    block->statements.push_back(std::move(vd));
                }
                return block;
            }
        }
    }

    // Top-level statement or unrecognized declaration
    return parseStatement();
}

std::unique_ptr<FunctionDeclNode> Parser::parseFunction(const std::string& returnType, const Token& nameToken) {
    int startLine = nameToken.line;
    int startCol = nameToken.column;

    consume(TokenType::LPAREN, "Expected '(' after function name");
    std::vector<std::unique_ptr<ParamNode>> params;

    if (!check(TokenType::RPAREN)) {
        do {
            bool isConst = false;
            std::string paramType = parseType(isConst);
            std::string paramName = "";
            if (check(TokenType::IDENTIFIER)) {
                paramName = advance().lexeme;
            }
            params.push_back(std::make_unique<ParamNode>(paramType, paramName, previous().line, previous().column));
        } while (match(TokenType::COMMA));
    }

    consume(TokenType::RPAREN, "Expected ')' after parameter list");

    // Check if it is a declaration only (ends in ';') or definition (starts with '{')
    if (match(TokenType::SEMICOLON)) {
        return std::make_unique<FunctionDeclNode>(returnType, nameToken.lexeme, std::move(params),
                                                 nullptr, false, startLine, startCol, startLine);
    }

    if (check(TokenType::LBRACE)) {
        auto body = parseBlock();
        int endLine = previous().line;
        return std::make_unique<FunctionDeclNode>(returnType, nameToken.lexeme, std::move(params),
                                                 std::move(body), true, startLine, startCol, endLine);
    }

    error(peek(), "Expected '{' or ';' after function signature");
    synchronize();
    return nullptr;
}

std::vector<std::unique_ptr<ASTNode>> Parser::parseVarDeclaration(bool isConst, const std::string& typeName) {
    std::vector<std::unique_ptr<ASTNode>> decls;

    do {
        if (!check(TokenType::IDENTIFIER)) {
            error(peek(), "Expected variable name in declaration");
            break;
        }

        Token varToken = advance();
        std::unique_ptr<ExprNode> init = nullptr;

        if (match(TokenType::ASSIGN)) {
            init = parseAssignment();
        }

        decls.push_back(std::make_unique<VarDeclNode>(
            typeName, varToken.lexeme, std::move(init), isConst, varToken.line, varToken.column
        ));

    } while (match(TokenType::COMMA));

    consume(TokenType::SEMICOLON, "Expected ';' after variable declaration");
    return decls;
}

std::unique_ptr<ASTNode> Parser::parseStatement() {
    if (check(TokenType::LBRACE)) {
        return parseBlock();
    }
    if (match(TokenType::KEYWORD_IF)) {
        return parseIfStatement();
    }
    if (match(TokenType::KEYWORD_WHILE)) {
        return parseWhileStatement();
    }
    if (match(TokenType::KEYWORD_FOR)) {
        return parseForStatement();
    }
    if (match(TokenType::KEYWORD_RETURN)) {
        return parseReturnStatement();
    }
    if (match(TokenType::KEYWORD_BREAK)) {
        return parseBreakStatement();
    }
    if (match(TokenType::KEYWORD_CONTINUE)) {
        return parseContinueStatement();
    }
    if (isTypeSpecifier()) {
        bool isConst = false;
        std::string typeName = parseType(isConst);
        auto varDecls = parseVarDeclaration(isConst, typeName);
        if (varDecls.size() == 1) {
            return std::move(varDecls[0]);
        } else if (varDecls.size() > 1) {
            auto block = std::make_unique<BlockStmtNode>(varDecls[0]->line, varDecls[0]->column);
            for (auto& vd : varDecls) {
                block->statements.push_back(std::move(vd));
            }
            return block;
        }
        return nullptr;
    }

    return parseExpressionStatement();
}

std::unique_ptr<BlockStmtNode> Parser::parseBlock() {
    Token braceTok = consume(TokenType::LBRACE, "Expected '{' to begin block");
    auto block = std::make_unique<BlockStmtNode>(braceTok.line, braceTok.column);

    while (!check(TokenType::RBRACE) && !isAtEnd()) {
        try {
            auto stmt = parseStatement();
            if (stmt) {
                block->statements.push_back(std::move(stmt));
            }
        } catch (...) {
            synchronize();
        }
    }

    consume(TokenType::RBRACE, "Expected '}' to close block");
    return block;
}

std::unique_ptr<IfStmtNode> Parser::parseIfStatement() {
    int startLine = previous().line;
    int startCol = previous().column;

    consume(TokenType::LPAREN, "Expected '(' after 'if'");
    auto condition = parseExpression();
    consume(TokenType::RPAREN, "Expected ')' after if condition");

    auto thenBranch = parseStatement();
    std::unique_ptr<ASTNode> elseBranch = nullptr;

    if (match(TokenType::KEYWORD_ELSE)) {
        elseBranch = parseStatement();
    }

    return std::make_unique<IfStmtNode>(std::move(condition), std::move(thenBranch),
                                       std::move(elseBranch), startLine, startCol);
}

std::unique_ptr<WhileStmtNode> Parser::parseWhileStatement() {
    int startLine = previous().line;
    int startCol = previous().column;

    consume(TokenType::LPAREN, "Expected '(' after 'while'");
    auto condition = parseExpression();
    consume(TokenType::RPAREN, "Expected ')' after while condition");

    auto body = parseStatement();
    return std::make_unique<WhileStmtNode>(std::move(condition), std::move(body), startLine, startCol);
}

std::unique_ptr<ForStmtNode> Parser::parseForStatement() {
    int startLine = previous().line;
    int startCol = previous().column;

    consume(TokenType::LPAREN, "Expected '(' after 'for'");

    std::unique_ptr<ASTNode> init = nullptr;
    if (!match(TokenType::SEMICOLON)) {
        if (isTypeSpecifier()) {
            bool isConst = false;
            std::string typeName = parseType(isConst);
            auto varDecls = parseVarDeclaration(isConst, typeName);
            if (!varDecls.empty()) {
                if (varDecls.size() == 1) init = std::move(varDecls[0]);
                else {
                    auto blk = std::make_unique<BlockStmtNode>(varDecls[0]->line, varDecls[0]->column);
                    for (auto& vd : varDecls) blk->statements.push_back(std::move(vd));
                    init = std::move(blk);
                }
            }
        } else {
            init = parseExpressionStatement();
        }
    }

    std::unique_ptr<ExprNode> condition = nullptr;
    if (!check(TokenType::SEMICOLON)) {
        condition = parseExpression();
    }
    consume(TokenType::SEMICOLON, "Expected ';' after for loop condition");

    std::unique_ptr<ExprNode> update = nullptr;
    if (!check(TokenType::RPAREN)) {
        update = parseExpression();
    }
    consume(TokenType::RPAREN, "Expected ')' after for loop update");

    auto body = parseStatement();
    return std::make_unique<ForStmtNode>(std::move(init), std::move(condition),
                                        std::move(update), std::move(body), startLine, startCol);
}

std::unique_ptr<ReturnStmtNode> Parser::parseReturnStatement() {
    int startLine = previous().line;
    int startCol = previous().column;

    std::unique_ptr<ExprNode> expr = nullptr;
    if (!check(TokenType::SEMICOLON)) {
        expr = parseExpression();
    }
    consume(TokenType::SEMICOLON, "Expected ';' after return statement");
    return std::make_unique<ReturnStmtNode>(std::move(expr), startLine, startCol);
}

std::unique_ptr<BreakStmtNode> Parser::parseBreakStatement() {
    int startLine = previous().line;
    int startCol = previous().column;
    consume(TokenType::SEMICOLON, "Expected ';' after 'break'");
    return std::make_unique<BreakStmtNode>(startLine, startCol);
}

std::unique_ptr<ContinueStmtNode> Parser::parseContinueStatement() {
    int startLine = previous().line;
    int startCol = previous().column;
    consume(TokenType::SEMICOLON, "Expected ';' after 'continue'");
    return std::make_unique<ContinueStmtNode>(startLine, startCol);
}

std::unique_ptr<ASTNode> Parser::parseExpressionStatement() {
    int startLine = peek().line;
    int startCol = peek().column;

    auto expr = parseExpression();
    consume(TokenType::SEMICOLON, "Expected ';' after expression");
    return std::make_unique<ExprStmtNode>(std::move(expr), startLine, startCol);
}

std::unique_ptr<ExprNode> Parser::parseExpression() {
    return parseAssignment();
}

std::unique_ptr<ExprNode> Parser::parseAssignment() {
    auto expr = parseLogicalOr();

    if (peek().isAssignmentOperator()) {
        Token opToken = advance();
        auto value = parseAssignment();

        // If LHS is a variable, construct an AssignExprASTNode
        if (auto varExpr = dynamic_cast<VariableExprASTNode*>(expr.get())) {
            return std::make_unique<AssignExprASTNode>(varExpr->name, opToken.lexeme,
                                                      std::move(value), opToken.line, opToken.column);
        } else {
            error(opToken, "Invalid assignment target lvalue");
        }
    }

    return expr;
}

std::unique_ptr<ExprNode> Parser::parseLogicalOr() {
    auto expr = parseLogicalAnd();

    while (match(TokenType::LOGICAL_OR)) {
        Token op = previous();
        auto right = parseLogicalAnd();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseLogicalAnd() {
    auto expr = parseBitwiseOr();

    while (match(TokenType::LOGICAL_AND)) {
        Token op = previous();
        auto right = parseBitwiseOr();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseBitwiseOr() {
    auto expr = parseBitwiseXor();

    while (match(TokenType::BITWISE_OR)) {
        Token op = previous();
        auto right = parseBitwiseXor();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseBitwiseXor() {
    auto expr = parseBitwiseAnd();

    while (match(TokenType::BITWISE_XOR)) {
        Token op = previous();
        auto right = parseBitwiseAnd();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseBitwiseAnd() {
    auto expr = parseEquality();

    while (match(TokenType::BITWISE_AND)) {
        Token op = previous();
        auto right = parseEquality();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseEquality() {
    auto expr = parseRelational();

    while (match(TokenType::EQUAL_EQUAL) || match(TokenType::NOT_EQUAL)) {
        Token op = previous();
        auto right = parseRelational();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseRelational() {
    auto expr = parseShift();

    while (match(TokenType::LESS) || match(TokenType::LESS_EQUAL) ||
           match(TokenType::GREATER) || match(TokenType::GREATER_EQUAL)) {
        Token op = previous();
        auto right = parseShift();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseShift() {
    auto expr = parseAdditive();

    while (match(TokenType::LEFT_SHIFT) || match(TokenType::RIGHT_SHIFT)) {
        Token op = previous();
        auto right = parseAdditive();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseAdditive() {
    auto expr = parseMultiplicative();

    while (match(TokenType::PLUS) || match(TokenType::MINUS)) {
        Token op = previous();
        auto right = parseMultiplicative();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseMultiplicative() {
    auto expr = parseUnary();

    while (match(TokenType::STAR) || match(TokenType::SLASH) || match(TokenType::PERCENT)) {
        Token op = previous();
        auto right = parseUnary();
        expr = std::make_unique<BinaryExprASTNode>(std::move(expr), op.lexeme, std::move(right), op.line, op.column);
    }
    return expr;
}

std::unique_ptr<ExprNode> Parser::parseUnary() {
    if (match(TokenType::LOGICAL_NOT) || match(TokenType::MINUS) ||
        match(TokenType::PLUS) || match(TokenType::BITWISE_NOT) ||
        match(TokenType::INCREMENT) || match(TokenType::DECREMENT)) {
        Token op = previous();
        auto operand = parseUnary();
        return std::make_unique<UnaryExprASTNode>(op.lexeme, std::move(operand), true, op.line, op.column);
    }
    return parsePostfix();
}

std::unique_ptr<ExprNode> Parser::parsePostfix() {
    auto expr = parsePrimary();

    while (true) {
        if (match(TokenType::LPAREN)) {
            // Function call
            Token lparen = previous();
            std::vector<std::unique_ptr<ExprNode>> args;
            if (!check(TokenType::RPAREN)) {
                do {
                    args.push_back(parseExpression());
                } while (match(TokenType::COMMA));
            }
            consume(TokenType::RPAREN, "Expected ')' after function call arguments");

            if (auto varExpr = dynamic_cast<VariableExprASTNode*>(expr.get())) {
                expr = std::make_unique<CallExprASTNode>(varExpr->name, std::move(args), lparen.line, lparen.column);
            } else {
                error(lparen, "Expression cannot be called as a function");
            }
        } else if (match(TokenType::INCREMENT) || match(TokenType::DECREMENT)) {
            Token op = previous();
            expr = std::make_unique<UnaryExprASTNode>(op.lexeme, std::move(expr), false, op.line, op.column);
        } else {
            break;
        }
    }

    return expr;
}

std::unique_ptr<ExprNode> Parser::parsePrimary() {
    if (match(TokenType::LITERAL_INT)) {
        return std::make_unique<LiteralExprASTNode>(previous().lexeme, "int", previous().line, previous().column);
    }
    if (match(TokenType::LITERAL_FLOAT)) {
        return std::make_unique<LiteralExprASTNode>(previous().lexeme, "float", previous().line, previous().column);
    }
    if (match(TokenType::LITERAL_STRING)) {
        return std::make_unique<LiteralExprASTNode>(previous().lexeme, "string", previous().line, previous().column);
    }
    if (match(TokenType::LITERAL_CHAR)) {
        return std::make_unique<LiteralExprASTNode>(previous().lexeme, "char", previous().line, previous().column);
    }
    if (match(TokenType::KEYWORD_TRUE) || match(TokenType::KEYWORD_FALSE)) {
        return std::make_unique<LiteralExprASTNode>(previous().lexeme, "bool", previous().line, previous().column);
    }

    if (match(TokenType::IDENTIFIER)) {
        return std::make_unique<VariableExprASTNode>(previous().lexeme, previous().line, previous().column);
    }

    if (match(TokenType::LPAREN)) {
        auto expr = parseExpression();
        consume(TokenType::RPAREN, "Expected ')' after expression");
        return expr;
    }

    error(peek(), "Expected expression but found '" + peek().lexeme + "'");
    advance();
    return nullptr;
}
