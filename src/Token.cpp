#include "Token.h"

std::string tokenTypeToString(TokenType type) {
    switch (type) {
        case TokenType::END_OF_FILE:   return "END_OF_FILE";
        case TokenType::UNKNOWN:       return "UNKNOWN";
        case TokenType::KEYWORD_INT:   return "KEYWORD_INT";
        case TokenType::KEYWORD_FLOAT: return "KEYWORD_FLOAT";
        case TokenType::KEYWORD_DOUBLE:return "KEYWORD_DOUBLE";
        case TokenType::KEYWORD_CHAR:  return "KEYWORD_CHAR";
        case TokenType::KEYWORD_VOID:  return "KEYWORD_VOID";
        case TokenType::KEYWORD_BOOL:  return "KEYWORD_BOOL";
        case TokenType::KEYWORD_AUTO:  return "KEYWORD_AUTO";
        case TokenType::KEYWORD_CONST: return "KEYWORD_CONST";
        case TokenType::KEYWORD_STATIC:return "KEYWORD_STATIC";
        case TokenType::KEYWORD_STRUCT:return "KEYWORD_STRUCT";
        case TokenType::KEYWORD_CLASS: return "KEYWORD_CLASS";
        case TokenType::KEYWORD_IF:    return "KEYWORD_IF";
        case TokenType::KEYWORD_ELSE:  return "KEYWORD_ELSE";
        case TokenType::KEYWORD_WHILE: return "KEYWORD_WHILE";
        case TokenType::KEYWORD_FOR:   return "KEYWORD_FOR";
        case TokenType::KEYWORD_DO:    return "KEYWORD_DO";
        case TokenType::KEYWORD_RETURN:return "KEYWORD_RETURN";
        case TokenType::KEYWORD_BREAK: return "KEYWORD_BREAK";
        case TokenType::KEYWORD_CONTINUE: return "KEYWORD_CONTINUE";
        case TokenType::KEYWORD_TRUE:  return "KEYWORD_TRUE";
        case TokenType::KEYWORD_FALSE: return "KEYWORD_FALSE";

        case TokenType::IDENTIFIER:    return "IDENTIFIER";
        case TokenType::LITERAL_INT:   return "LITERAL_INT";
        case TokenType::LITERAL_FLOAT: return "LITERAL_FLOAT";
        case TokenType::LITERAL_STRING:return "LITERAL_STRING";
        case TokenType::LITERAL_CHAR:  return "LITERAL_CHAR";
        case TokenType::LITERAL_BOOL:  return "LITERAL_BOOL";

        case TokenType::PLUS:          return "PLUS";
        case TokenType::MINUS:         return "MINUS";
        case TokenType::STAR:          return "STAR";
        case TokenType::SLASH:         return "SLASH";
        case TokenType::PERCENT:       return "PERCENT";
        case TokenType::ASSIGN:        return "ASSIGN";
        case TokenType::PLUS_ASSIGN:   return "PLUS_ASSIGN";
        case TokenType::MINUS_ASSIGN:  return "MINUS_ASSIGN";
        case TokenType::STAR_ASSIGN:   return "STAR_ASSIGN";
        case TokenType::SLASH_ASSIGN:  return "SLASH_ASSIGN";
        case TokenType::INCREMENT:     return "INCREMENT";
        case TokenType::DECREMENT:     return "DECREMENT";

        case TokenType::EQUAL_EQUAL:   return "EQUAL_EQUAL";
        case TokenType::NOT_EQUAL:     return "NOT_EQUAL";
        case TokenType::LESS:          return "LESS";
        case TokenType::LESS_EQUAL:    return "LESS_EQUAL";
        case TokenType::GREATER:       return "GREATER";
        case TokenType::GREATER_EQUAL: return "GREATER_EQUAL";

        case TokenType::LOGICAL_AND:   return "LOGICAL_AND";
        case TokenType::LOGICAL_OR:    return "LOGICAL_OR";
        case TokenType::LOGICAL_NOT:   return "LOGICAL_NOT";

        case TokenType::BITWISE_AND:   return "BITWISE_AND";
        case TokenType::BITWISE_OR:    return "BITWISE_OR";
        case TokenType::BITWISE_XOR:   return "BITWISE_XOR";
        case TokenType::BITWISE_NOT:   return "BITWISE_NOT";
        case TokenType::LEFT_SHIFT:    return "LEFT_SHIFT";
        case TokenType::RIGHT_SHIFT:   return "RIGHT_SHIFT";

        case TokenType::QUESTION:      return "QUESTION";
        case TokenType::COLON:         return "COLON";
        case TokenType::COLON_COLON:   return "COLON_COLON";
        case TokenType::DOT:           return "DOT";
        case TokenType::ARROW:         return "ARROW";

        case TokenType::SEMICOLON:     return "SEMICOLON";
        case TokenType::COMMA:         return "COMMA";
        case TokenType::LPAREN:        return "LPAREN";
        case TokenType::RPAREN:        return "RPAREN";
        case TokenType::LBRACE:        return "LBRACE";
        case TokenType::RBRACE:        return "RBRACE";
        case TokenType::LBRACKET:      return "LBRACKET";
        case TokenType::RBRACKET:      return "RBRACKET";

        case TokenType::COMMENT_SINGLE:return "COMMENT_SINGLE";
        case TokenType::COMMENT_MULTI: return "COMMENT_MULTI";
        default:                       return "UNKNOWN_TOKEN";
    }
}

bool Token::isKeyword() const {
    return (type >= TokenType::KEYWORD_INT && type <= TokenType::KEYWORD_FALSE);
}

bool Token::isLiteral() const {
    return (type >= TokenType::LITERAL_INT && type <= TokenType::LITERAL_BOOL);
}

bool Token::isOperator() const {
    return (type >= TokenType::PLUS && type <= TokenType::ARROW);
}

bool Token::isTypeSpecifier() const {
    return type == TokenType::KEYWORD_INT ||
           type == TokenType::KEYWORD_FLOAT ||
           type == TokenType::KEYWORD_DOUBLE ||
           type == TokenType::KEYWORD_CHAR ||
           type == TokenType::KEYWORD_VOID ||
           type == TokenType::KEYWORD_BOOL ||
           type == TokenType::KEYWORD_AUTO;
}

bool Token::isAssignmentOperator() const {
    return type == TokenType::ASSIGN ||
           type == TokenType::PLUS_ASSIGN ||
           type == TokenType::MINUS_ASSIGN ||
           type == TokenType::STAR_ASSIGN ||
           type == TokenType::SLASH_ASSIGN;
}

bool Token::isComparisonOperator() const {
    return type == TokenType::EQUAL_EQUAL ||
           type == TokenType::NOT_EQUAL ||
           type == TokenType::LESS ||
           type == TokenType::LESS_EQUAL ||
           type == TokenType::GREATER ||
           type == TokenType::GREATER_EQUAL;
}

bool Token::isArithmeticOperator() const {
    return type == TokenType::PLUS ||
           type == TokenType::MINUS ||
           type == TokenType::STAR ||
           type == TokenType::SLASH ||
           type == TokenType::PERCENT;
}

std::string Token::typeName() const {
    return tokenTypeToString(type);
}

std::ostream& operator<<(std::ostream& os, const Token& token) {
    os << "[" << token.line << ":" << token.column << "] " 
       << tokenTypeToString(token.type) << " ('" << token.lexeme << "')";
    return os;
}
