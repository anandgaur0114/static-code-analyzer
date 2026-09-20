#include "Lexer.h"
#include <cctype>

Lexer::Lexer(std::string source, std::string filename)
    : source_(std::move(source)), filename_(std::move(filename)), cursor_(0), line_(1), column_(1) {
    initKeywordMap();
}

void Lexer::initKeywordMap() {
    keywordMap_["int"] = TokenType::KEYWORD_INT;
    keywordMap_["float"] = TokenType::KEYWORD_FLOAT;
    keywordMap_["double"] = TokenType::KEYWORD_DOUBLE;
    keywordMap_["char"] = TokenType::KEYWORD_CHAR;
    keywordMap_["void"] = TokenType::KEYWORD_VOID;
    keywordMap_["bool"] = TokenType::KEYWORD_BOOL;
    keywordMap_["auto"] = TokenType::KEYWORD_AUTO;
    keywordMap_["const"] = TokenType::KEYWORD_CONST;
    keywordMap_["static"] = TokenType::KEYWORD_STATIC;
    keywordMap_["struct"] = TokenType::KEYWORD_STRUCT;
    keywordMap_["class"] = TokenType::KEYWORD_CLASS;
    keywordMap_["if"] = TokenType::KEYWORD_IF;
    keywordMap_["else"] = TokenType::KEYWORD_ELSE;
    keywordMap_["while"] = TokenType::KEYWORD_WHILE;
    keywordMap_["for"] = TokenType::KEYWORD_FOR;
    keywordMap_["do"] = TokenType::KEYWORD_DO;
    keywordMap_["return"] = TokenType::KEYWORD_RETURN;
    keywordMap_["break"] = TokenType::KEYWORD_BREAK;
    keywordMap_["continue"] = TokenType::KEYWORD_CONTINUE;
    keywordMap_["true"] = TokenType::KEYWORD_TRUE;
    keywordMap_["false"] = TokenType::KEYWORD_FALSE;
}

char Lexer::peek() const {
    if (isAtEnd()) return '\0';
    return source_[cursor_];
}

char Lexer::peekNext() const {
    if (cursor_ + 1 >= source_.size()) return '\0';
    return source_[cursor_ + 1];
}

char Lexer::advance() {
    if (isAtEnd()) return '\0';
    char c = source_[cursor_++];
    if (c == '\n') {
        line_++;
        column_ = 1;
    } else {
        column_++;
    }
    return c;
}

bool Lexer::match(char expected) {
    if (isAtEnd() || source_[cursor_] != expected) return false;
    advance();
    return true;
}

bool Lexer::isAtEnd() const {
    return cursor_ >= source_.size();
}

void Lexer::skipWhitespace() {
    while (!isAtEnd()) {
        char c = peek();
        if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
            advance();
        } else {
            break;
        }
    }
}

void Lexer::handlePreprocessor() {
    // Consume until end of line for preprocessor directives like #include, #define
    while (!isAtEnd() && peek() != '\n') {
        advance();
    }
}

void Lexer::reportError(const std::string& message, int line, int column) {
    errors_.push_back({message, line, column});
}

Token Lexer::lexIdentifierOrKeyword(int startLine, int startCol) {
    std::string lexeme;
    while (!isAtEnd()) {
        char c = peek();
        if (std::isalnum(static_cast<unsigned char>(c)) || c == '_') {
            lexeme += advance();
        } else {
            break;
        }
    }

    auto it = keywordMap_.find(lexeme);
    if (it != keywordMap_.end()) {
        return Token(it->second, lexeme, startLine, startCol);
    }
    return Token(TokenType::IDENTIFIER, lexeme, startLine, startCol);
}

Token Lexer::lexNumber(int startLine, int startCol) {
    std::string lexeme;
    bool isFloat = false;

    while (!isAtEnd() && std::isdigit(static_cast<unsigned char>(peek()))) {
        lexeme += advance();
    }

    // Check for fractional part
    if (peek() == '.' && std::isdigit(static_cast<unsigned char>(peekNext()))) {
        isFloat = true;
        lexeme += advance(); // consume '.'
        while (!isAtEnd() && std::isdigit(static_cast<unsigned char>(peek()))) {
            lexeme += advance();
        }
    }

    // Optional float suffix 'f' or 'F'
    if (peek() == 'f' || peek() == 'F') {
        isFloat = true;
        lexeme += advance();
    }

    TokenType type = isFloat ? TokenType::LITERAL_FLOAT : TokenType::LITERAL_INT;
    return Token(type, lexeme, startLine, startCol);
}

Token Lexer::lexString(int startLine, int startCol) {
    advance(); // Consume opening quote "
    std::string lexeme;

    while (!isAtEnd() && peek() != '"') {
        if (peek() == '\\') {
            advance(); // consume '\\'
            if (!isAtEnd()) {
                char escaped = advance();
                switch (escaped) {
                    case 'n': lexeme += '\n'; break;
                    case 't': lexeme += '\t'; break;
                    case 'r': lexeme += '\r'; break;
                    case '\\': lexeme += '\\'; break;
                    case '"': lexeme += '"'; break;
                    default: lexeme += escaped; break;
                }
            }
        } else {
            if (peek() == '\n') {
                reportError("Unterminated string literal before end of line", startLine, startCol);
                break;
            }
            lexeme += advance();
        }
    }

    if (peek() == '"') {
        advance(); // consume closing quote
    } else {
        reportError("Unterminated string literal", startLine, startCol);
    }

    return Token(TokenType::LITERAL_STRING, lexeme, startLine, startCol);
}

Token Lexer::lexChar(int startLine, int startCol) {
    advance(); // Consume opening '
    std::string lexeme;

    if (!isAtEnd() && peek() == '\\') {
        advance();
        if (!isAtEnd()) {
            char escaped = advance();
            lexeme += '\\';
            lexeme += escaped;
        }
    } else if (!isAtEnd() && peek() != '\'') {
        lexeme += advance();
    }

    if (peek() == '\'') {
        advance();
    } else {
        reportError("Unterminated character literal", startLine, startCol);
    }

    return Token(TokenType::LITERAL_CHAR, lexeme, startLine, startCol);
}

Token Lexer::lexSingleComment(int startLine, int startCol) {
    // Consume the two slashes //
    advance();
    advance();
    std::string comment;
    while (!isAtEnd() && peek() != '\n') {
        comment += advance();
    }
    return Token(TokenType::COMMENT_SINGLE, comment, startLine, startCol);
}

Token Lexer::lexMultiComment(int startLine, int startCol) {
    // Consume /*
    advance();
    advance();
    std::string comment;
    bool closed = false;

    while (!isAtEnd()) {
        if (peek() == '*' && peekNext() == '/') {
            advance(); // *
            advance(); // /
            closed = true;
            break;
        }
        comment += advance();
    }

    if (!closed) {
        reportError("Unclosed multi-line comment starting at line " + std::to_string(startLine), startLine, startCol);
    }

    return Token(TokenType::COMMENT_MULTI, comment, startLine, startCol);
}

Token Lexer::nextToken(bool includeComments) {
    while (!isAtEnd()) {
        skipWhitespace();
        if (isAtEnd()) break;

        int startLine = line_;
        int startCol = column_;
        char c = peek();

        // Handle C/C++ preprocessor directives (#include, #define, etc.)
        if (c == '#' && startCol == 1) {
            handlePreprocessor();
            continue;
        }

        // Single-line and multi-line comments or division operator
        if (c == '/') {
            if (peekNext() == '/') {
                Token commentTok = lexSingleComment(startLine, startCol);
                if (includeComments) return commentTok;
                continue;
            } else if (peekNext() == '*') {
                Token commentTok = lexMultiComment(startLine, startCol);
                if (includeComments) return commentTok;
                continue;
            } else if (peekNext() == '=') {
                advance(); advance();
                return Token(TokenType::SLASH_ASSIGN, "/=", startLine, startCol);
            } else {
                advance();
                return Token(TokenType::SLASH, "/", startLine, startCol);
            }
        }

        // Identifiers and keywords
        if (std::isalpha(static_cast<unsigned char>(c)) || c == '_') {
            return lexIdentifierOrKeyword(startLine, startCol);
        }

        // Numeric literals
        if (std::isdigit(static_cast<unsigned char>(c))) {
            return lexNumber(startLine, startCol);
        }

        // String literals
        if (c == '"') {
            return lexString(startLine, startCol);
        }

        // Character literals
        if (c == '\'') {
            return lexChar(startLine, startCol);
        }

        // Operators & delimiters
        advance(); // consume character c

        switch (c) {
            case '+':
                if (match('+')) return Token(TokenType::INCREMENT, "++", startLine, startCol);
                if (match('=')) return Token(TokenType::PLUS_ASSIGN, "+=", startLine, startCol);
                return Token(TokenType::PLUS, "+", startLine, startCol);
            case '-':
                if (match('-')) return Token(TokenType::DECREMENT, "--", startLine, startCol);
                if (match('=')) return Token(TokenType::MINUS_ASSIGN, "-=", startLine, startCol);
                if (match('>')) return Token(TokenType::ARROW, "->", startLine, startCol);
                return Token(TokenType::MINUS, "-", startLine, startCol);
            case '*':
                if (match('=')) return Token(TokenType::STAR_ASSIGN, "*=", startLine, startCol);
                return Token(TokenType::STAR, "*", startLine, startCol);
            case '%':
                return Token(TokenType::PERCENT, "%", startLine, startCol);
            case '=':
                if (match('=')) return Token(TokenType::EQUAL_EQUAL, "==", startLine, startCol);
                return Token(TokenType::ASSIGN, "=", startLine, startCol);
            case '!':
                if (match('=')) return Token(TokenType::NOT_EQUAL, "!=", startLine, startCol);
                return Token(TokenType::LOGICAL_NOT, "!", startLine, startCol);
            case '<':
                if (match('=')) return Token(TokenType::LESS_EQUAL, "<=", startLine, startCol);
                if (match('<')) return Token(TokenType::LEFT_SHIFT, "<<", startLine, startCol);
                return Token(TokenType::LESS, "<", startLine, startCol);
            case '>':
                if (match('=')) return Token(TokenType::GREATER_EQUAL, ">=", startLine, startCol);
                if (match('>')) return Token(TokenType::RIGHT_SHIFT, ">>", startLine, startCol);
                return Token(TokenType::GREATER, ">", startLine, startCol);
            case '&':
                if (match('&')) return Token(TokenType::LOGICAL_AND, "&&", startLine, startCol);
                return Token(TokenType::BITWISE_AND, "&", startLine, startCol);
            case '|':
                if (match('|')) return Token(TokenType::LOGICAL_OR, "||", startLine, startCol);
                return Token(TokenType::BITWISE_OR, "|", startLine, startCol);
            case '^':
                return Token(TokenType::BITWISE_XOR, "^", startLine, startCol);
            case '~':
                return Token(TokenType::BITWISE_NOT, "~", startLine, startCol);
            case '?':
                return Token(TokenType::QUESTION, "?", startLine, startCol);
            case ':':
                if (match(':')) return Token(TokenType::COLON_COLON, "::", startLine, startCol);
                return Token(TokenType::COLON, ":", startLine, startCol);
            case '.':
                return Token(TokenType::DOT, ".", startLine, startCol);
            case ';':
                return Token(TokenType::SEMICOLON, ";", startLine, startCol);
            case ',':
                return Token(TokenType::COMMA, ",", startLine, startCol);
            case '(':
                return Token(TokenType::LPAREN, "(", startLine, startCol);
            case ')':
                return Token(TokenType::RPAREN, ")", startLine, startCol);
            case '{':
                return Token(TokenType::LBRACE, "{", startLine, startCol);
            case '}':
                return Token(TokenType::RBRACE, "}", startLine, startCol);
            case '[':
                return Token(TokenType::LBRACKET, "[", startLine, startCol);
            case ']':
                return Token(TokenType::RBRACKET, "]", startLine, startCol);
            default: {
                std::string s(1, c);
                reportError("Unrecognized character: '" + s + "'", startLine, startCol);
                return Token(TokenType::UNKNOWN, s, startLine, startCol);
            }
        }
    }

    return Token(TokenType::END_OF_FILE, "", line_, column_);
}

std::vector<Token> Lexer::tokenize(bool includeComments) {
    std::vector<Token> tokens;
    while (true) {
        Token tok = nextToken(includeComments);
        tokens.push_back(tok);
        if (tok.type == TokenType::END_OF_FILE) {
            break;
        }
    }
    return tokens;
}
