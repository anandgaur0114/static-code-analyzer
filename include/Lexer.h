#ifndef LEXER_H
#define LEXER_H

#include "Token.h"
#include <string>
#include <vector>
#include <unordered_map>

struct LexicalError {
    std::string message;
    int line;
    int column;
};

class Lexer {
public:
    explicit Lexer(std::string source, std::string filename = "<source>");

    // Tokenize entire input stream
    std::vector<Token> tokenize(bool includeComments = false);

    // Get the next single token (advances internal cursor)
    Token nextToken(bool includeComments = false);

    // Inspect collected errors during lexical phase
    const std::vector<LexicalError>& getErrors() const { return errors_; }
    bool hasErrors() const { return !errors_.empty(); }

    const std::string& getFilename() const { return filename_; }
    const std::string& getSource() const { return source_; }

private:
    std::string source_;
    std::string filename_;
    size_t cursor_;
    int line_;
    int column_;
    std::vector<LexicalError> errors_;
    std::unordered_map<std::string, TokenType> keywordMap_;

    void initKeywordMap();

    char peek() const;
    char peekNext() const;
    char advance();
    bool match(char expected);
    bool isAtEnd() const;

    void skipWhitespace();
    void handlePreprocessor();

    Token lexIdentifierOrKeyword(int startLine, int startCol);
    Token lexNumber(int startLine, int startCol);
    Token lexString(int startLine, int startCol);
    Token lexChar(int startLine, int startCol);
    Token lexSingleComment(int startLine, int startCol);
    Token lexMultiComment(int startLine, int startCol);

    void reportError(const std::string& message, int line, int column);
};

#endif // LEXER_H
