#ifndef TOKEN_H
#define TOKEN_H

#include <string>
#include <ostream>

enum class TokenType {
    // End of file / Special
    END_OF_FILE,
    UNKNOWN,

    // Keywords
    KEYWORD_INT,
    KEYWORD_FLOAT,
    KEYWORD_DOUBLE,
    KEYWORD_CHAR,
    KEYWORD_VOID,
    KEYWORD_BOOL,
    KEYWORD_AUTO,
    KEYWORD_CONST,
    KEYWORD_STATIC,
    KEYWORD_STRUCT,
    KEYWORD_CLASS,
    KEYWORD_IF,
    KEYWORD_ELSE,
    KEYWORD_WHILE,
    KEYWORD_FOR,
    KEYWORD_DO,
    KEYWORD_RETURN,
    KEYWORD_BREAK,
    KEYWORD_CONTINUE,
    KEYWORD_TRUE,
    KEYWORD_FALSE,

    // Identifiers & Literals
    IDENTIFIER,
    LITERAL_INT,
    LITERAL_FLOAT,
    LITERAL_STRING,
    LITERAL_CHAR,
    LITERAL_BOOL,

    // Operators
    PLUS,           // +
    MINUS,          // -
    STAR,           // *
    SLASH,          // /
    PERCENT,        // %
    ASSIGN,         // =
    PLUS_ASSIGN,    // +=
    MINUS_ASSIGN,   // -=
    STAR_ASSIGN,    // *=
    SLASH_ASSIGN,   // /=
    INCREMENT,      // ++
    DECREMENT,      // --

    EQUAL_EQUAL,    // ==
    NOT_EQUAL,      // !=
    LESS,           // <
    LESS_EQUAL,     // <=
    GREATER,        // >
    GREATER_EQUAL,  // >=

    LOGICAL_AND,    // &&
    LOGICAL_OR,     // ||
    LOGICAL_NOT,    // !

    BITWISE_AND,    // &
    BITWISE_OR,     // |
    BITWISE_XOR,    // ^
    BITWISE_NOT,    // ~
    LEFT_SHIFT,     // <<
    RIGHT_SHIFT,    // >>

    QUESTION,       // ?
    COLON,          // :
    COLON_COLON,    // ::
    DOT,            // .
    ARROW,          // ->

    // Delimiters
    SEMICOLON,      // ;
    COMMA,          // ,
    LPAREN,         // (
    RPAREN,         // )
    LBRACE,         // {
    RBRACE,         // }
    LBRACKET,       // [
    RBRACKET,       // ]

    // Comments
    COMMENT_SINGLE,
    COMMENT_MULTI
};

struct Token {
    TokenType type;
    std::string lexeme;
    int line;
    int column;

    Token(TokenType type = TokenType::UNKNOWN, std::string lexeme = "", int line = 1, int column = 1)
        : type(type), lexeme(std::move(lexeme)), line(line), column(column) {}

    bool isKeyword() const;
    bool isLiteral() const;
    bool isOperator() const;
    bool isTypeSpecifier() const;
    bool isAssignmentOperator() const;
    bool isComparisonOperator() const;
    bool isArithmeticOperator() const;
    std::string typeName() const;
};

std::string tokenTypeToString(TokenType type);
std::ostream& operator<<(std::ostream& os, const Token& token);

#endif // TOKEN_H
