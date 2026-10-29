/**
 * Parser.js - Recursive Descent LL(1) Parser with AST Generation
 * Part of C++ Static Code Analyzer & Quality Scorer
 */

if (typeof globalThis !== 'undefined' && typeof globalThis.TokenType === 'undefined' && typeof require !== 'undefined') {
    try {
        const _lex = require('./lexer.js');
        globalThis.TokenType = _lex.TokenType;
        globalThis.Token = _lex.Token;
    } catch (e) {}
}

class ASTNode {
    constructor(type, line = 1, column = 1) {
        this.nodeType = type;
        this.line = line;
        this.column = column;
    }
}

class ProgramNode extends ASTNode {
    constructor(line, column) {
        super('ProgramNode', line, column);
        this.declarations = [];
    }
}

class FunctionDeclNode extends ASTNode {
    constructor(returnType, name, parameters, body, isDefinition, line, column, endLine) {
        super('FunctionDeclNode', line, column);
        this.returnType = returnType;
        this.name = name;
        this.parameters = parameters || [];
        this.body = body;
        this.isDefinition = isDefinition;
        this.endLine = endLine || line;
    }
    getLOC() {
        return Math.max(1, this.endLine - this.line + 1);
    }
}

class ParamNode extends ASTNode {
    constructor(type, name, line, column) {
        super('ParamNode', line, column);
        this.type = type;
        this.name = name;
    }
}

class VarDeclNode extends ASTNode {
    constructor(type, name, initializer, isConst, line, column) {
        super('VarDeclNode', line, column);
        this.type = type;
        this.name = name;
        this.initializer = initializer;
        this.isConst = isConst;
    }
}

class BlockStmtNode extends ASTNode {
    constructor(line, column) {
        super('BlockStmtNode', line, column);
        this.statements = [];
    }
}

class IfStmtNode extends ASTNode {
    constructor(condition, thenBranch, elseBranch, line, column) {
        super('IfStmtNode', line, column);
        this.condition = condition;
        this.thenBranch = thenBranch;
        this.elseBranch = elseBranch;
    }
}

class WhileStmtNode extends ASTNode {
    constructor(condition, body, line, column) {
        super('WhileStmtNode', line, column);
        this.condition = condition;
        this.body = body;
    }
}

class ForStmtNode extends ASTNode {
    constructor(init, condition, update, body, line, column) {
        super('ForStmtNode', line, column);
        this.init = init;
        this.condition = condition;
        this.update = update;
        this.body = body;
    }
}

class ReturnStmtNode extends ASTNode {
    constructor(expression, line, column) {
        super('ReturnStmtNode', line, column);
        this.expression = expression;
    }
}

class BreakStmtNode extends ASTNode {
    constructor(line, column) {
        super('BreakStmtNode', line, column);
    }
}

class ContinueStmtNode extends ASTNode {
    constructor(line, column) {
        super('ContinueStmtNode', line, column);
    }
}

class ExprStmtNode extends ASTNode {
    constructor(expression, line, column) {
        super('ExprStmtNode', line, column);
        this.expression = expression;
    }
}

class BinaryExprASTNode extends ASTNode {
    constructor(left, op, right, line, column) {
        super('BinaryExprASTNode', line, column);
        this.left = left;
        this.op = op;
        this.right = right;
    }
}

class UnaryExprASTNode extends ASTNode {
    constructor(op, operand, isPrefix, line, column) {
        super('UnaryExprASTNode', line, column);
        this.op = op;
        this.operand = operand;
        this.isPrefix = isPrefix;
    }
}

class LiteralExprASTNode extends ASTNode {
    constructor(value, literalType, line, column) {
        super('LiteralExprASTNode', line, column);
        this.value = value;
        this.literalType = literalType;
    }
}

class VariableExprASTNode extends ASTNode {
    constructor(name, line, column) {
        super('VariableExprASTNode', line, column);
        this.name = name;
    }
}

class CallExprASTNode extends ASTNode {
    constructor(callee, args, line, column) {
        super('CallExprASTNode', line, column);
        this.callee = callee;
        this.arguments = args || [];
    }
}

class AssignExprASTNode extends ASTNode {
    constructor(varName, op, value, line, column) {
        super('AssignExprASTNode', line, column);
        this.varName = varName;
        this.op = op;
        this.value = value;
    }
}

class Parser {
    constructor(tokens) {
        this.tokens = tokens || [];
        this.current = 0;
        this.errors = [];
    }

    peek() {
        if (this.current >= this.tokens.length) {
            return new Token(TokenType.EOF, '', 0, 0);
        }
        return this.tokens[this.current];
    }

    previous() {
        if (this.current === 0) return this.tokens[0];
        return this.tokens[this.current - 1];
    }

    isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    check(type, lexeme = null) {
        if (this.isAtEnd()) return false;
        const tok = this.peek();
        if (tok.type !== type) return false;
        if (lexeme !== null && tok.lexeme !== lexeme) return false;
        return true;
    }

    match(type, lexeme = null) {
        if (this.check(type, lexeme)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, lexeme = null, errorMsg = '') {
        if (this.check(type, lexeme)) {
            return this.advance();
        }
        const tok = this.peek();
        this.errors.push({
            message: errorMsg || `Expected '${lexeme || type}' but found '${tok.lexeme}'`,
            line: tok.line,
            column: tok.column
        });
        return tok;
    }

    synchronize() {
        this.advance();
        while (!this.isAtEnd()) {
            if (this.previous().lexeme === ';' || this.previous().lexeme === '}') {
                return;
            }
            const lex = this.peek().lexeme;
            if (['int', 'float', 'double', 'char', 'void', 'bool', 'if', 'while', 'for', 'return', 'class', 'struct'].includes(lex)) {
                return;
            }
            this.advance();
        }
    }

    isTypeSpecifier() {
        const tok = this.peek();
        if (tok.lexeme === 'const') return true;
        if (['int', 'float', 'double', 'char', 'void', 'bool', 'auto'].includes(tok.lexeme)) return true;
        // User defined type (Identifier followed by another Identifier or pointer)
        if (tok.type === TokenType.IDENTIFIER && this.current + 1 < this.tokens.length) {
            const next = this.tokens[this.current + 1];
            if (next.type === TokenType.IDENTIFIER || next.lexeme === '*' || next.lexeme === '&') {
                return true;
            }
        }
        return false;
    }

    parseType() {
        let isConst = false;
        if (this.match(TokenType.KEYWORD, 'const')) {
            isConst = true;
        }
        let typeName = 'int';
        if (this.isTypeSpecifier() || this.check(TokenType.IDENTIFIER)) {
            typeName = this.advance().lexeme;
        } else {
            const tok = this.peek();
            this.errors.push({
                message: `Expected type name but found '${tok.lexeme}'`,
                line: tok.line,
                column: tok.column
            });
        }
        while (this.check(TokenType.OPERATOR, '*') || this.check(TokenType.OPERATOR, '&')) {
            typeName += this.advance().lexeme;
        }
        return { typeName, isConst };
    }

    parseProgram() {
        const prog = new ProgramNode(1, 1);
        while (!this.isAtEnd()) {
            if (this.match(TokenType.DELIMITER, ';')) continue;
            try {
                const decl = this.parseTopLevelDeclaration();
                if (decl) {
                    prog.declarations.push(decl);
                }
            } catch (err) {
                this.synchronize();
            }
        }
        return { ast: prog, errors: this.errors };
    }

    parseTopLevelDeclaration() {
        if (this.isTypeSpecifier()) {
            let lookahead = this.current;
            if (this.tokens[lookahead].lexeme === 'const') lookahead++;
            if (lookahead < this.tokens.length) lookahead++; // type name
            while (lookahead < this.tokens.length && (this.tokens[lookahead].lexeme === '*' || this.tokens[lookahead].lexeme === '&')) {
                lookahead++;
            }
            if (lookahead < this.tokens.length && this.tokens[lookahead].type === TokenType.IDENTIFIER) {
                const afterName = lookahead + 1;
                if (afterName < this.tokens.length && this.tokens[afterName].lexeme === '(') {
                    // Function declaration / definition
                    const { typeName } = this.parseType();
                    const nameTok = this.advance();
                    return this.parseFunction(typeName, nameTok);
                }
            }
            // Variable declaration
            const { typeName, isConst } = this.parseType();
            const varDecls = this.parseVarDeclaration(isConst, typeName);
            if (varDecls.length === 1) return varDecls[0];
            if (varDecls.length > 1) {
                const blk = new BlockStmtNode(varDecls[0].line, varDecls[0].column);
                blk.statements = varDecls;
                return blk;
            }
        }
        return this.parseStatement();
    }

    parseFunction(returnType, nameToken) {
        const startLine = nameToken.line;
        const startCol = nameToken.column;

        this.consume(TokenType.DELIMITER, '(', "Expected '(' after function name");
        const params = [];
        if (!this.check(TokenType.DELIMITER, ')')) {
            do {
                const { typeName } = this.parseType();
                let paramName = '';
                if (this.check(TokenType.IDENTIFIER)) {
                    paramName = this.advance().lexeme;
                }
                params.push(new ParamNode(typeName, paramName, this.previous().line, this.previous().column));
            } while (this.match(TokenType.DELIMITER, ','));
        }
        this.consume(TokenType.DELIMITER, ')', "Expected ')' after parameter list");

        if (this.match(TokenType.DELIMITER, ';')) {
            return new FunctionDeclNode(returnType, nameToken.lexeme, params, null, false, startLine, startCol, startLine);
        }

        if (this.check(TokenType.DELIMITER, '{')) {
            const body = this.parseBlock();
            const endLine = this.previous().line;
            return new FunctionDeclNode(returnType, nameToken.lexeme, params, body, true, startLine, startCol, endLine);
        }

        this.errors.push({
            message: `Expected '{' or ';' after function signature`,
            line: this.peek().line,
            column: this.peek().column
        });
        this.synchronize();
        return null;
    }

    parseVarDeclaration(isConst, typeName) {
        const decls = [];
        do {
            if (!this.check(TokenType.IDENTIFIER)) {
                this.errors.push({
                    message: "Expected variable name in declaration",
                    line: this.peek().line,
                    column: this.peek().column
                });
                break;
            }
            const varTok = this.advance();
            let init = null;
            if (this.match(TokenType.OPERATOR, '=')) {
                init = this.parseAssignment();
            }
            decls.push(new VarDeclNode(typeName, varTok.lexeme, init, isConst, varTok.line, varTok.column));
        } while (this.match(TokenType.DELIMITER, ','));

        this.consume(TokenType.DELIMITER, ';', "Expected ';' after variable declaration");
        return decls;
    }

    parseStatement() {
        if (this.check(TokenType.DELIMITER, '{')) {
            return this.parseBlock();
        }
        if (this.match(TokenType.KEYWORD, 'if')) {
            return this.parseIfStatement();
        }
        if (this.match(TokenType.KEYWORD, 'while')) {
            return this.parseWhileStatement();
        }
        if (this.match(TokenType.KEYWORD, 'for')) {
            return this.parseForStatement();
        }
        if (this.match(TokenType.KEYWORD, 'return')) {
            return this.parseReturnStatement();
        }
        if (this.match(TokenType.KEYWORD, 'break')) {
            const t = this.previous();
            this.consume(TokenType.DELIMITER, ';', "Expected ';' after 'break'");
            return new BreakStmtNode(t.line, t.column);
        }
        if (this.match(TokenType.KEYWORD, 'continue')) {
            const t = this.previous();
            this.consume(TokenType.DELIMITER, ';', "Expected ';' after 'continue'");
            return new ContinueStmtNode(t.line, t.column);
        }
        if (this.isTypeSpecifier()) {
            const { typeName, isConst } = this.parseType();
            const varDecls = this.parseVarDeclaration(isConst, typeName);
            if (varDecls.length === 1) return varDecls[0];
            if (varDecls.length > 1) {
                const blk = new BlockStmtNode(varDecls[0].line, varDecls[0].column);
                blk.statements = varDecls;
                return blk;
            }
            return null;
        }
        return this.parseExpressionStatement();
    }

    parseBlock() {
        const braceTok = this.consume(TokenType.DELIMITER, '{', "Expected '{' to begin block");
        const blk = new BlockStmtNode(braceTok.line, braceTok.column);
        while (!this.check(TokenType.DELIMITER, '}') && !this.isAtEnd()) {
            try {
                const stmt = this.parseStatement();
                if (stmt) blk.statements.push(stmt);
            } catch (err) {
                this.synchronize();
            }
        }
        this.consume(TokenType.DELIMITER, '}', "Expected '}' to close block");
        return blk;
    }

    parseIfStatement() {
        const startLine = this.previous().line;
        const startCol = this.previous().column;
        this.consume(TokenType.DELIMITER, '(', "Expected '(' after 'if'");
        const cond = this.parseExpression();
        this.consume(TokenType.DELIMITER, ')', "Expected ')' after if condition");
        const thenBranch = this.parseStatement();
        let elseBranch = null;
        if (this.match(TokenType.KEYWORD, 'else')) {
            elseBranch = this.parseStatement();
        }
        return new IfStmtNode(cond, thenBranch, elseBranch, startLine, startCol);
    }

    parseWhileStatement() {
        const startLine = this.previous().line;
        const startCol = this.previous().column;
        this.consume(TokenType.DELIMITER, '(', "Expected '(' after 'while'");
        const cond = this.parseExpression();
        this.consume(TokenType.DELIMITER, ')', "Expected ')' after while condition");
        const body = this.parseStatement();
        return new WhileStmtNode(cond, body, startLine, startCol);
    }

    parseForStatement() {
        const startLine = this.previous().line;
        const startCol = this.previous().column;
        this.consume(TokenType.DELIMITER, '(', "Expected '(' after 'for'");

        let init = null;
        if (!this.match(TokenType.DELIMITER, ';')) {
            if (this.isTypeSpecifier()) {
                const { typeName, isConst } = this.parseType();
                const varDecls = this.parseVarDeclaration(isConst, typeName);
                if (varDecls.length === 1) init = varDecls[0];
                else {
                    const blk = new BlockStmtNode(varDecls[0].line, varDecls[0].column);
                    blk.statements = varDecls;
                    init = blk;
                }
            } else {
                init = this.parseExpressionStatement();
            }
        }

        let cond = null;
        if (!this.check(TokenType.DELIMITER, ';')) {
            cond = this.parseExpression();
        }
        this.consume(TokenType.DELIMITER, ';', "Expected ';' after for loop condition");

        let update = null;
        if (!this.check(TokenType.DELIMITER, ')')) {
            update = this.parseExpression();
        }
        this.consume(TokenType.DELIMITER, ')', "Expected ')' after for loop update");

        const body = this.parseStatement();
        return new ForStmtNode(init, cond, update, body, startLine, startCol);
    }

    parseReturnStatement() {
        const startLine = this.previous().line;
        const startCol = this.previous().column;
        let expr = null;
        if (!this.check(TokenType.DELIMITER, ';')) {
            expr = this.parseExpression();
        }
        this.consume(TokenType.DELIMITER, ';', "Expected ';' after return");
        return new ReturnStmtNode(expr, startLine, startCol);
    }

    parseExpressionStatement() {
        const startLine = this.peek().line;
        const startCol = this.peek().column;
        const expr = this.parseExpression();
        this.consume(TokenType.DELIMITER, ';', "Expected ';' after expression");
        return new ExprStmtNode(expr, startLine, startCol);
    }

    parseExpression() {
        return this.parseAssignment();
    }

    parseAssignment() {
        const expr = this.parseLogicalOr();
        if (['=', '+=', '-=', '*=', '/=', '%='].includes(this.peek().lexeme)) {
            const opTok = this.advance();
            const val = this.parseAssignment();
            if (expr instanceof VariableExprASTNode) {
                return new AssignExprASTNode(expr.name, opTok.lexeme, val, opTok.line, opTok.column);
            } else {
                this.errors.push({
                    message: "Invalid assignment target lvalue",
                    line: opTok.line,
                    column: opTok.column
                });
            }
        }
        return expr;
    }

    parseLogicalOr() {
        let expr = this.parseLogicalAnd();
        while (this.match(TokenType.OPERATOR, '||')) {
            const op = this.previous();
            const right = this.parseLogicalAnd();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseLogicalAnd() {
        let expr = this.parseEquality();
        while (this.match(TokenType.OPERATOR, '&&')) {
            const op = this.previous();
            const right = this.parseEquality();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseEquality() {
        let expr = this.parseRelational();
        while (this.match(TokenType.OPERATOR, '==') || this.match(TokenType.OPERATOR, '!=')) {
            const op = this.previous();
            const right = this.parseRelational();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseRelational() {
        let expr = this.parseAdditive();
        while (['<', '<=', '>', '>='].includes(this.peek().lexeme) && this.peek().type === TokenType.OPERATOR) {
            const op = this.advance();
            const right = this.parseAdditive();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseAdditive() {
        let expr = this.parseMultiplicative();
        while (['+', '-'].includes(this.peek().lexeme) && this.peek().type === TokenType.OPERATOR) {
            const op = this.advance();
            const right = this.parseMultiplicative();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseMultiplicative() {
        let expr = this.parseUnary();
        while (['*', '/', '%'].includes(this.peek().lexeme) && this.peek().type === TokenType.OPERATOR) {
            const op = this.advance();
            const right = this.parseUnary();
            expr = new BinaryExprASTNode(expr, op.lexeme, right, op.line, op.column);
        }
        return expr;
    }

    parseUnary() {
        if (['!', '-', '+', '++', '--', '~'].includes(this.peek().lexeme) && this.peek().type === TokenType.OPERATOR) {
            const op = this.advance();
            const operand = this.parseUnary();
            return new UnaryExprASTNode(op.lexeme, operand, true, op.line, op.column);
        }
        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();
        while (true) {
            if (this.match(TokenType.DELIMITER, '(')) {
                const lparen = this.previous();
                const args = [];
                if (!this.check(TokenType.DELIMITER, ')')) {
                    do {
                        args.push(this.parseExpression());
                    } while (this.match(TokenType.DELIMITER, ','));
                }
                this.consume(TokenType.DELIMITER, ')', "Expected ')' after function arguments");
                if (expr instanceof VariableExprASTNode) {
                    expr = new CallExprASTNode(expr.name, args, lparen.line, lparen.column);
                } else {
                    this.errors.push({
                        message: "Expression cannot be called as a function",
                        line: lparen.line,
                        column: lparen.column
                    });
                }
            } else if (this.match(TokenType.OPERATOR, '++') || this.match(TokenType.OPERATOR, '--')) {
                const op = this.previous();
                expr = new UnaryExprASTNode(op.lexeme, expr, false, op.line, op.column);
            } else {
                break;
            }
        }
        return expr;
    }

    parsePrimary() {
        const tok = this.peek();
        if (tok.type === TokenType.LITERAL_INT) {
            this.advance();
            return new LiteralExprASTNode(tok.lexeme, 'int', tok.line, tok.column);
        }
        if (tok.type === TokenType.LITERAL_FLOAT) {
            this.advance();
            return new LiteralExprASTNode(tok.lexeme, 'float', tok.line, tok.column);
        }
        if (tok.type === TokenType.LITERAL_STRING) {
            this.advance();
            return new LiteralExprASTNode(tok.lexeme, 'string', tok.line, tok.column);
        }
        if (tok.type === TokenType.LITERAL_CHAR) {
            this.advance();
            return new LiteralExprASTNode(tok.lexeme, 'char', tok.line, tok.column);
        }
        if (tok.type === TokenType.LITERAL_BOOL) {
            this.advance();
            return new LiteralExprASTNode(tok.lexeme, 'bool', tok.line, tok.column);
        }
        if (tok.type === TokenType.IDENTIFIER) {
            this.advance();
            return new VariableExprASTNode(tok.lexeme, tok.line, tok.column);
        }
        if (this.match(TokenType.DELIMITER, '(')) {
            const expr = this.parseExpression();
            this.consume(TokenType.DELIMITER, ')', "Expected ')' after expression");
            return expr;
        }

        this.errors.push({
            message: `Expected expression but found '${tok.lexeme}'`,
            line: tok.line,
            column: tok.column
        });
        this.advance();
        return null;
    }

    parse() {
        return this.parseProgram().ast;
    }
}

if (typeof globalThis !== 'undefined') {
    globalThis.Parser = Parser;
    globalThis.ASTNode = ASTNode;
}

if (typeof window !== 'undefined') {
    window.Parser = Parser;
    window.ASTNode = ASTNode;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Parser, ASTNode };
}
