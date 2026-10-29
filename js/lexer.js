/**
 * Lexer.js - Hand-written Deterministic Finite Automaton (DFA) Tokenizer
 * Part of C++ Static Code Analyzer & Quality Scorer
 */

const TokenType = {
    // Keywords
    KEYWORD: 'KEYWORD',
    
    // Identifiers & Literals
    IDENTIFIER: 'IDENTIFIER',
    LITERAL_INT: 'LITERAL_INT',
    LITERAL_FLOAT: 'LITERAL_FLOAT',
    LITERAL_STRING: 'LITERAL_STRING',
    LITERAL_CHAR: 'LITERAL_CHAR',
    LITERAL_BOOL: 'LITERAL_BOOL',

    // Operators
    OPERATOR: 'OPERATOR',

    // Delimiters
    DELIMITER: 'DELIMITER',

    // Comments
    COMMENT_SINGLE: 'COMMENT_SINGLE',
    COMMENT_MULTI: 'COMMENT_MULTI',

    // Special
    EOF: 'EOF',
    UNKNOWN: 'UNKNOWN'
};

const KEYWORDS = new Set([
    'int', 'float', 'double', 'char', 'void', 'bool', 'auto', 'const', 'static',
    'struct', 'class', 'public', 'private', 'protected',
    'if', 'else', 'while', 'for', 'do', 'switch', 'case', 'default',
    'return', 'break', 'continue', 'true', 'false', 'sizeof', 'namespace', 'using'
]);

class Token {
    constructor(type, lexeme, line, column, subtype = '') {
        this.type = type;
        this.lexeme = lexeme;
        this.line = line;
        this.column = column;
        this.subtype = subtype || type;
    }
}

class Lexer {
    constructor(source) {
        this.source = source || '';
        this.cursor = 0;
        this.line = 1;
        this.column = 1;
        this.errors = [];
    }

    isAtEnd() {
        return this.cursor >= this.source.length;
    }

    peek() {
        if (this.isAtEnd()) return '\0';
        return this.source[this.cursor];
    }

    peekNext() {
        if (this.cursor + 1 >= this.source.length) return '\0';
        return this.source[this.cursor + 1];
    }

    advance() {
        if (this.isAtEnd()) return '\0';
        const ch = this.source[this.cursor++];
        if (ch === '\n') {
            this.line++;
            this.column = 1;
        } else {
            this.column++;
        }
        return ch;
    }

    match(expected) {
        if (this.isAtEnd() || this.source[this.cursor] !== expected) return false;
        this.advance();
        return true;
    }

    skipWhitespace() {
        while (!this.isAtEnd()) {
            const ch = this.peek();
            if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
                this.advance();
            } else {
                break;
            }
        }
    }

    tokenize(includeComments = false) {
        const tokens = [];
        this.errors = [];
        this.cursor = 0;
        this.line = 1;
        this.column = 1;

        while (!this.isAtEnd()) {
            this.skipWhitespace();
            if (this.isAtEnd()) break;

            const startLine = this.line;
            const startCol = this.column;
            const ch = this.peek();

            // Handle preprocessor #include, #define
            if (ch === '#' && startCol === 1) {
                while (!this.isAtEnd() && this.peek() !== '\n') {
                    this.advance();
                }
                continue;
            }

            // Comments or Division
            if (ch === '/') {
                if (this.peekNext() === '/') {
                    this.advance(); this.advance();
                    let comment = '';
                    while (!this.isAtEnd() && this.peek() !== '\n') {
                        comment += this.advance();
                    }
                    if (includeComments) {
                        tokens.push(new Token(TokenType.COMMENT_SINGLE, '//' + comment, startLine, startCol, 'COMMENT'));
                    }
                    continue;
                } else if (this.peekNext() === '*') {
                    this.advance(); this.advance();
                    let comment = '';
                    let closed = false;
                    while (!this.isAtEnd()) {
                        if (this.peek() === '*' && this.peekNext() === '/') {
                            this.advance(); this.advance();
                            closed = true;
                            break;
                        }
                        comment += this.advance();
                    }
                    if (!closed) {
                        this.errors.push({
                            message: `Unclosed multi-line comment starting at line ${startLine}`,
                            line: startLine,
                            column: startCol
                        });
                    }
                    if (includeComments) {
                        tokens.push(new Token(TokenType.COMMENT_MULTI, '/*' + comment + '*/', startLine, startCol, 'COMMENT'));
                    }
                    continue;
                } else if (this.peekNext() === '=') {
                    this.advance(); this.advance();
                    tokens.push(new Token(TokenType.OPERATOR, '/=', startLine, startCol, 'ASSIGN_OP'));
                    continue;
                } else {
                    this.advance();
                    tokens.push(new Token(TokenType.OPERATOR, '/', startLine, startCol, 'ARITHMETIC_OP'));
                    continue;
                }
            }

            // Identifiers and Keywords
            if (/[a-zA-Z_]/.test(ch)) {
                let lexeme = '';
                while (!this.isAtEnd() && /[a-zA-Z0-9_]/.test(this.peek())) {
                    lexeme += this.advance();
                }
                if (KEYWORDS.has(lexeme)) {
                    if (lexeme === 'true' || lexeme === 'false') {
                        tokens.push(new Token(TokenType.LITERAL_BOOL, lexeme, startLine, startCol, 'BOOL_LITERAL'));
                    } else {
                        tokens.push(new Token(TokenType.KEYWORD, lexeme, startLine, startCol, 'KEYWORD'));
                    }
                } else {
                    tokens.push(new Token(TokenType.IDENTIFIER, lexeme, startLine, startCol, 'IDENTIFIER'));
                }
                continue;
            }

            // Numeric Literals
            if (/[0-9]/.test(ch)) {
                let lexeme = '';
                let isFloat = false;
                while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
                    lexeme += this.advance();
                }
                if (this.peek() === '.' && /[0-9]/.test(this.peekNext())) {
                    isFloat = true;
                    lexeme += this.advance();
                    while (!this.isAtEnd() && /[0-9]/.test(this.peek())) {
                        lexeme += this.advance();
                    }
                }
                if (this.peek() === 'f' || this.peek() === 'F') {
                    isFloat = true;
                    lexeme += this.advance();
                }
                tokens.push(new Token(isFloat ? TokenType.LITERAL_FLOAT : TokenType.LITERAL_INT, lexeme, startLine, startCol, isFloat ? 'FLOAT' : 'INT'));
                continue;
            }

            // String Literals
            if (ch === '"') {
                this.advance();
                let lexeme = '';
                let closed = false;
                while (!this.isAtEnd()) {
                    const c = this.peek();
                    if (c === '\\') {
                        this.advance();
                        if (!this.isAtEnd()) lexeme += '\\' + this.advance();
                    } else if (c === '"') {
                        this.advance();
                        closed = true;
                        break;
                    } else if (c === '\n') {
                        this.errors.push({
                            message: `Unterminated string literal before end of line`,
                            line: startLine,
                            column: startCol
                        });
                        break;
                    } else {
                        lexeme += this.advance();
                    }
                }
                if (!closed && this.isAtEnd()) {
                    this.errors.push({
                        message: `Unterminated string literal`,
                        line: startLine,
                        column: startCol
                    });
                }
                tokens.push(new Token(TokenType.LITERAL_STRING, `"${lexeme}"`, startLine, startCol, 'STRING_LITERAL'));
                continue;
            }

            // Character Literals
            if (ch === "'") {
                this.advance();
                let lexeme = '';
                if (!this.isAtEnd() && this.peek() === '\\') {
                    lexeme += this.advance();
                    if (!this.isAtEnd()) lexeme += this.advance();
                } else if (!this.isAtEnd() && this.peek() !== "'") {
                    lexeme += this.advance();
                }
                if (this.peek() === "'") {
                    this.advance();
                } else {
                    this.errors.push({
                        message: `Unterminated character literal`,
                        line: startLine,
                        column: startCol
                    });
                }
                tokens.push(new Token(TokenType.LITERAL_CHAR, `'${lexeme}'`, startLine, startCol, 'CHAR_LITERAL'));
                continue;
            }

            // Operators & Delimiters
            this.advance();
            switch (ch) {
                case '+':
                    if (this.match('+')) tokens.push(new Token(TokenType.OPERATOR, '++', startLine, startCol, 'INCREMENT'));
                    else if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '+=', startLine, startCol, 'ASSIGN_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '+', startLine, startCol, 'ARITHMETIC_OP'));
                    break;
                case '-':
                    if (this.match('-')) tokens.push(new Token(TokenType.OPERATOR, '--', startLine, startCol, 'DECREMENT'));
                    else if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '-=', startLine, startCol, 'ASSIGN_OP'));
                    else if (this.match('>')) tokens.push(new Token(TokenType.OPERATOR, '->', startLine, startCol, 'ARROW'));
                    else tokens.push(new Token(TokenType.OPERATOR, '-', startLine, startCol, 'ARITHMETIC_OP'));
                    break;
                case '*':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '*=', startLine, startCol, 'ASSIGN_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '*', startLine, startCol, 'ARITHMETIC_OP'));
                    break;
                case '%':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '%=', startLine, startCol, 'ASSIGN_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '%', startLine, startCol, 'ARITHMETIC_OP'));
                    break;
                case '=':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '==', startLine, startCol, 'COMPARE_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '=', startLine, startCol, 'ASSIGN_OP'));
                    break;
                case '!':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '!=', startLine, startCol, 'COMPARE_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '!', startLine, startCol, 'LOGICAL_OP'));
                    break;
                case '<':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '<=', startLine, startCol, 'COMPARE_OP'));
                    else if (this.match('<')) tokens.push(new Token(TokenType.OPERATOR, '<<', startLine, startCol, 'SHIFT_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '<', startLine, startCol, 'COMPARE_OP'));
                    break;
                case '>':
                    if (this.match('=')) tokens.push(new Token(TokenType.OPERATOR, '>=', startLine, startCol, 'COMPARE_OP'));
                    else if (this.match('>')) tokens.push(new Token(TokenType.OPERATOR, '>>', startLine, startCol, 'SHIFT_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '>', startLine, startCol, 'COMPARE_OP'));
                    break;
                case '&':
                    if (this.match('&')) tokens.push(new Token(TokenType.OPERATOR, '&&', startLine, startCol, 'LOGICAL_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '&', startLine, startCol, 'BITWISE_OP'));
                    break;
                case '|':
                    if (this.match('|')) tokens.push(new Token(TokenType.OPERATOR, '||', startLine, startCol, 'LOGICAL_OP'));
                    else tokens.push(new Token(TokenType.OPERATOR, '|', startLine, startCol, 'BITWISE_OP'));
                    break;
                case '^': tokens.push(new Token(TokenType.OPERATOR, '^', startLine, startCol, 'BITWISE_OP')); break;
                case '~': tokens.push(new Token(TokenType.OPERATOR, '~', startLine, startCol, 'BITWISE_OP')); break;
                case '?': tokens.push(new Token(TokenType.OPERATOR, '?', startLine, startCol, 'TERNARY_OP')); break;
                case ':':
                    if (this.match(':')) tokens.push(new Token(TokenType.DELIMITER, '::', startLine, startCol, 'SCOPE_OP'));
                    else tokens.push(new Token(TokenType.DELIMITER, ':', startLine, startCol, 'COLON'));
                    break;
                case '.': tokens.push(new Token(TokenType.DELIMITER, '.', startLine, startCol, 'DOT')); break;
                case ';': tokens.push(new Token(TokenType.DELIMITER, ';', startLine, startCol, 'SEMICOLON')); break;
                case ',': tokens.push(new Token(TokenType.DELIMITER, ',', startLine, startCol, 'COMMA')); break;
                case '(': tokens.push(new Token(TokenType.DELIMITER, '(', startLine, startCol, 'LPAREN')); break;
                case ')': tokens.push(new Token(TokenType.DELIMITER, ')', startLine, startCol, 'RPAREN')); break;
                case '{': tokens.push(new Token(TokenType.DELIMITER, '{', startLine, startCol, 'LBRACE')); break;
                case '}': tokens.push(new Token(TokenType.DELIMITER, '}', startLine, startCol, 'RBRACE')); break;
                case '[': tokens.push(new Token(TokenType.DELIMITER, '[', startLine, startCol, 'LBRACKET')); break;
                case ']': tokens.push(new Token(TokenType.DELIMITER, ']', startLine, startCol, 'RBRACKET')); break;
                default:
                    this.errors.push({
                        message: `Unrecognized character: '${ch}'`,
                        line: startLine,
                        column: startCol
                    });
                    tokens.push(new Token(TokenType.UNKNOWN, ch, startLine, startCol, 'UNKNOWN'));
                    break;
            }
        }

        tokens.push(new Token(TokenType.EOF, '', this.line, this.column, 'EOF'));
        this.tokens = tokens;
        return tokens;
    }
}

if (typeof globalThis !== 'undefined') {
    globalThis.TokenType = TokenType;
    globalThis.Token = Token;
    globalThis.Lexer = Lexer;
}

if (typeof window !== 'undefined') {
    window.TokenType = TokenType;
    window.Token = Token;
    window.Lexer = Lexer;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TokenType, Token, Lexer };
}
