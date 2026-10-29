"""
analyzer_engine.py - Core Static Code Analysis Engine (C/C++)
Includes:
- DFA Lexer & Tokenizer
- LL(1) Recursive Descent Parser with AST Generation & Precedence Climbing
- Scoped Symbol Table
- Semantic, Dead Code, Nesting, LOC & McCabe Cyclomatic Complexity Analyzers
- Uninitialized Variable Detection & Security Scanners (Hardcoded secrets, unsafe APIs)
- Exact Structured Output Generator
"""

import re
from typing import Dict, List, Any, Optional, Set, Tuple

# ============================================================================
# Token Definitions & Lexer
# ============================================================================

class TokenType:
    KEYWORD = "KEYWORD"
    IDENTIFIER = "IDENTIFIER"
    LITERAL_INT = "LITERAL_INT"
    LITERAL_FLOAT = "LITERAL_FLOAT"
    LITERAL_STRING = "LITERAL_STRING"
    LITERAL_CHAR = "LITERAL_CHAR"
    LITERAL_BOOL = "LITERAL_BOOL"
    OPERATOR = "OPERATOR"
    DELIMITER = "DELIMITER"
    COMMENT = "COMMENT"
    EOF = "EOF"
    UNKNOWN = "UNKNOWN"

KEYWORDS = {
    "int", "float", "double", "char", "void", "bool", "auto", "const", "static",
    "struct", "class", "public", "private", "protected",
    "if", "else", "while", "for", "do", "switch", "case", "default",
    "return", "break", "continue", "true", "false", "sizeof", "namespace", "using"
}

UNSAFE_FUNCTIONS = {
    "gets": ("gets() performs no bounds checking and is susceptible to buffer overflow exploits. Removed in C11.", "error"),
    "strcpy": ("strcpy() does not verify buffer boundary sizes, causing buffer overflow vulnerabilities. Use strncpy or std::string.", "warning"),
    "strcat": ("strcat() can overflow destination buffers. Use strncat or std::string.", "warning"),
    "sprintf": ("sprintf() can write past buffer bounds. Use snprintf() to specify buffer capacity.", "warning"),
    "system": ("system() executes arbitrary shell commands susceptible to command injection attacks. Avoid or sanitize arguments.", "warning")
}

SECRET_PATTERNS = re.compile(r"(password|passwd|secret|api_key|apikey|auth_token|access_token|private_key)", re.IGNORECASE)

class Token:
    def __init__(self, token_type: str, value: str, line: int, col: int, subtype: str = ""):
        self.type = token_type
        self.value = value
        self.line = line
        self.col = col
        self.subtype = subtype or token_type

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "value": self.value,
            "line": self.line,
            "col": self.col
        }

class Lexer:
    def __init__(self, source: str):
        self.source = source or ""
        self.cursor = 0
        self.line = 1
        self.col = 1
        self.errors: List[Dict[str, Any]] = []

    def is_at_end(self) -> bool:
        return self.cursor >= len(self.source)

    def peek(self) -> str:
        if self.is_at_end():
            return "\0"
        return self.source[self.cursor]

    def peek_next(self) -> str:
        if self.cursor + 1 >= len(self.source):
            return "\0"
        return self.source[self.cursor + 1]

    def advance(self) -> str:
        if self.is_at_end():
            return "\0"
        ch = self.source[self.cursor]
        self.cursor += 1
        if ch == "\n":
            self.line += 1
            self.col = 1
        else:
            self.col += 1
        return ch

    def match(self, expected: str) -> bool:
        if self.is_at_end() or self.source[self.cursor] != expected:
            return False
        self.advance()
        return True

    def skip_whitespace(self):
        while not self.is_at_end():
            ch = self.peek()
            if ch in (" ", "\t", "\r", "\n"):
                self.advance()
            else:
                break

    def tokenize(self) -> List[Token]:
        tokens: List[Token] = []

        while not self.is_at_end():
            self.skip_whitespace()
            if self.is_at_end():
                break

            start_line = self.line
            start_col = self.col
            ch = self.peek()

            # Single-line comment
            if ch == "/" and self.peek_next() == "/":
                self.advance()
                self.advance()
                val = "//"
                while not self.is_at_end() and self.peek() != "\n":
                    val += self.advance()
                tokens.append(Token(TokenType.COMMENT, val, start_line, start_col, "COMMENT_SINGLE"))
                continue

            # Multi-line comment
            if ch == "/" and self.peek_next() == "*":
                self.advance()
                self.advance()
                val = "/*"
                closed = False
                while not self.is_at_end():
                    if self.peek() == "*" and self.peek_next() == "/":
                        self.advance()
                        self.advance()
                        val += "*/"
                        closed = True
                        break
                    val += self.advance()
                if not closed:
                    self.errors.append({
                        "line": start_line,
                        "col": start_col,
                        "severity": "error",
                        "type": "Lexical Error",
                        "message": "Unterminated multi-line comment",
                        "suggestion": "Close multi-line comment with '*/'"
                    })
                tokens.append(Token(TokenType.COMMENT, val, start_line, start_col, "COMMENT_MULTI"))
                continue

            # Number literal
            if ch.isdigit():
                num_str = ""
                has_dot = False
                while not self.is_at_end() and (self.peek().isdigit() or self.peek() == "."):
                    if self.peek() == ".":
                        if has_dot:
                            break
                        has_dot = True
                    num_str += self.advance()
                t_type = TokenType.LITERAL_FLOAT if has_dot else TokenType.LITERAL_INT
                tokens.append(Token(t_type, num_str, start_line, start_col))
                continue

            # Identifiers & Keywords
            if ch.isalpha() or ch == "_":
                ident_str = ""
                while not self.is_at_end() and (self.peek().isalnum() or self.peek() == "_"):
                    ident_str += self.advance()
                if ident_str in KEYWORDS:
                    tokens.append(Token(TokenType.KEYWORD, ident_str, start_line, start_col))
                elif ident_str in ("true", "false"):
                    tokens.append(Token(TokenType.LITERAL_BOOL, ident_str, start_line, start_col))
                else:
                    tokens.append(Token(TokenType.IDENTIFIER, ident_str, start_line, start_col))
                continue

            # String literal
            if ch == '"':
                self.advance()
                s_val = '"'
                closed = False
                while not self.is_at_end():
                    c = self.advance()
                    s_val += c
                    if c == "\\":
                        if not self.is_at_end():
                            s_val += self.advance()
                    elif c == '"':
                        closed = True
                        break
                    elif c == "\n":
                        break
                if not closed:
                    self.errors.append({
                        "line": start_line,
                        "col": start_col,
                        "severity": "error",
                        "type": "Lexical Error",
                        "message": "Unterminated string literal",
                        "suggestion": 'Add closing quote `"` before end of line'
                    })
                tokens.append(Token(TokenType.LITERAL_STRING, s_val, start_line, start_col))
                continue

            # Char literal
            if ch == "'":
                self.advance()
                c_val = "'"
                closed = False
                while not self.is_at_end():
                    c = self.advance()
                    c_val += c
                    if c == "\\":
                        if not self.is_at_end():
                            c_val += self.advance()
                    elif c == "'":
                        closed = True
                        break
                    elif c == "\n":
                        break
                if not closed:
                    self.errors.append({
                        "line": start_line,
                        "col": start_col,
                        "severity": "error",
                        "type": "Lexical Error",
                        "message": "Unterminated character literal",
                        "suggestion": "Add closing single quote `'`"
                    })
                tokens.append(Token(TokenType.LITERAL_CHAR, c_val, start_line, start_col))
                continue

            # Single or multi-character operators
            self.advance()
            if ch == "+":
                if self.match("+"): tokens.append(Token(TokenType.OPERATOR, "++", start_line, start_col))
                elif self.match("="): tokens.append(Token(TokenType.OPERATOR, "+=", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "+", start_line, start_col))
            elif ch == "-":
                if self.match("-"): tokens.append(Token(TokenType.OPERATOR, "--", start_line, start_col))
                elif self.match("="): tokens.append(Token(TokenType.OPERATOR, "-=", start_line, start_col))
                elif self.match(">"): tokens.append(Token(TokenType.OPERATOR, "->", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "-", start_line, start_col))
            elif ch == "*":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "*=", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "*", start_line, start_col))
            elif ch == "/":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "/=", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "/", start_line, start_col))
            elif ch == "%":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "%=", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "%", start_line, start_col))
            elif ch == "=":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "==", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "=", start_line, start_col))
            elif ch == "!":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "!=", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "!", start_line, start_col))
            elif ch == "<":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, "<=", start_line, start_col))
                elif self.match("<"): tokens.append(Token(TokenType.OPERATOR, "<<", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "<", start_line, start_col))
            elif ch == ">":
                if self.match("="): tokens.append(Token(TokenType.OPERATOR, ">=", start_line, start_col))
                elif self.match(">"): tokens.append(Token(TokenType.OPERATOR, ">>", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, ">", start_line, start_col))
            elif ch == "&":
                if self.match("&"): tokens.append(Token(TokenType.OPERATOR, "&&", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "&", start_line, start_col))
            elif ch == "|":
                if self.match("|"): tokens.append(Token(TokenType.OPERATOR, "||", start_line, start_col))
                else: tokens.append(Token(TokenType.OPERATOR, "|", start_line, start_col))
            elif ch in (";", ",", "(", ")", "{", "}", "[", "]", ":"):
                if ch == ":" and self.match(":"):
                    tokens.append(Token(TokenType.DELIMITER, "::", start_line, start_col))
                else:
                    tokens.append(Token(TokenType.DELIMITER, ch, start_line, start_col))
            else:
                self.errors.append({
                    "line": start_line,
                    "col": start_col,
                    "severity": "error",
                    "type": "Lexical Error",
                    "message": f"Unrecognized character: '{ch}'",
                    "suggestion": "Remove or replace invalid character with standard C++ token"
                })
                tokens.append(Token(TokenType.UNKNOWN, ch, start_line, start_col))

        tokens.append(Token(TokenType.EOF, "", self.line, self.col))
        return tokens

# ============================================================================
# AST Node Hierarchy
# ============================================================================

class ASTNode:
    def __init__(self, node_type: str, line: int = 1, col: int = 1):
        self.node_type = node_type
        self.line = line
        self.col = col

    def to_tree_dict(self) -> Dict[str, Any]:
        return {
            "name": self.node_type,
            "type": self.node_type,
            "line": self.line,
            "col": self.col,
            "children": []
        }

class ProgramNode(ASTNode):
    def __init__(self, line: int = 1, col: int = 1):
        super().__init__("ProgramNode", line, col)
        self.declarations: List[ASTNode] = []

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "Program"
        d["children"] = [decl.to_tree_dict() for decl in self.declarations if decl]
        return d

class FunctionDeclNode(ASTNode):
    def __init__(self, return_type: str, name: str, parameters: List[Any], body: Any, is_definition: bool, line: int, col: int, end_line: int):
        super().__init__("FunctionDeclNode", line, col)
        self.return_type = return_type
        self.name = name
        self.parameters = parameters or []
        self.body = body
        self.is_definition = is_definition
        self.end_line = end_line or line

    def get_loc(self) -> int:
        return max(1, self.end_line - self.line + 1)

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Function: {self.return_type} {self.name}() [LOC: {self.get_loc()}]"
        children = []
        for p in self.parameters:
            if p: children.append(p.to_tree_dict())
        if self.body:
            children.append(self.body.to_tree_dict())
        d["children"] = children
        return d

class ParamNode(ASTNode):
    def __init__(self, param_type: str, name: str, line: int, col: int):
        super().__init__("ParamNode", line, col)
        self.type = param_type
        self.name = name

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Param: {self.type} {self.name}"
        return d

class VarDeclNode(ASTNode):
    def __init__(self, var_type: str, name: str, initializer: Any, is_const: bool, line: int, col: int):
        super().__init__("VarDeclNode", line, col)
        self.type = var_type
        self.name = name
        self.initializer = initializer
        self.is_const = is_const

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        const_prefix = "const " if self.is_const else ""
        d["name"] = f"VarDecl: {const_prefix}{self.type} {self.name}"
        if self.initializer:
            d["children"] = [self.initializer.to_tree_dict()]
        return d

class BlockStmtNode(ASTNode):
    def __init__(self, line: int, col: int):
        super().__init__("BlockStmtNode", line, col)
        self.statements: List[ASTNode] = []

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "Block { ... }"
        d["children"] = [stmt.to_tree_dict() for stmt in self.statements if stmt]
        return d

class IfStmtNode(ASTNode):
    def __init__(self, condition: Any, then_branch: Any, else_branch: Any, line: int, col: int):
        super().__init__("IfStmtNode", line, col)
        self.condition = condition
        self.then_branch = then_branch
        self.else_branch = else_branch

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "If Statement"
        children = []
        if self.condition: children.append(self.condition.to_tree_dict())
        if self.then_branch: children.append(self.then_branch.to_tree_dict())
        if self.else_branch: children.append(self.else_branch.to_tree_dict())
        d["children"] = children
        return d

class WhileStmtNode(ASTNode):
    def __init__(self, condition: Any, body: Any, line: int, col: int):
        super().__init__("WhileStmtNode", line, col)
        self.condition = condition
        self.body = body

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "While Loop"
        children = []
        if self.condition: children.append(self.condition.to_tree_dict())
        if self.body: children.append(self.body.to_tree_dict())
        d["children"] = children
        return d

class ForStmtNode(ASTNode):
    def __init__(self, init: Any, condition: Any, update: Any, body: Any, line: int, col: int):
        super().__init__("ForStmtNode", line, col)
        self.init = init
        self.condition = condition
        self.update = update
        self.body = body

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "For Loop"
        children = []
        if self.init: children.append(self.init.to_tree_dict())
        if self.condition: children.append(self.condition.to_tree_dict())
        if self.update: children.append(self.update.to_tree_dict())
        if self.body: children.append(self.body.to_tree_dict())
        d["children"] = children
        return d

class ReturnStmtNode(ASTNode):
    def __init__(self, expression: Any, line: int, col: int):
        super().__init__("ReturnStmtNode", line, col)
        self.expression = expression

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = "Return"
        if self.expression:
            d["children"] = [self.expression.to_tree_dict()]
        return d

class BreakStmtNode(ASTNode):
    def __init__(self, line: int, col: int):
        super().__init__("BreakStmtNode", line, col)

class ContinueStmtNode(ASTNode):
    def __init__(self, line: int, col: int):
        super().__init__("ContinueStmtNode", line, col)

class ExprStmtNode(ASTNode):
    def __init__(self, expression: Any, line: int, col: int):
        super().__init__("ExprStmtNode", line, col)
        self.expression = expression

    def to_tree_dict(self) -> Dict[str, Any]:
        if self.expression:
            return self.expression.to_tree_dict()
        return super().to_tree_dict()

class BinaryExprASTNode(ASTNode):
    def __init__(self, op: str, left: Any, right: Any, line: int, col: int):
        super().__init__("BinaryExprASTNode", line, col)
        self.op = op
        self.left = left
        self.right = right

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"BinaryOp '{self.op}'"
        children = []
        if self.left: children.append(self.left.to_tree_dict())
        if self.right: children.append(self.right.to_tree_dict())
        d["children"] = children
        return d

class UnaryExprASTNode(ASTNode):
    def __init__(self, op: str, operand: Any, is_prefix: bool, line: int, col: int):
        super().__init__("UnaryExprASTNode", line, col)
        self.op = op
        self.operand = operand
        self.is_prefix = is_prefix

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"UnaryOp '{self.op}'"
        if self.operand:
            d["children"] = [self.operand.to_tree_dict()]
        return d

class LiteralExprASTNode(ASTNode):
    def __init__(self, value: str, literal_type: str, line: int, col: int):
        super().__init__("LiteralExprASTNode", line, col)
        self.value = value
        self.literal_type = literal_type

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Literal: {self.value} ({self.literal_type})"
        return d

class VariableExprASTNode(ASTNode):
    def __init__(self, name: str, line: int, col: int):
        super().__init__("VariableExprASTNode", line, col)
        self.name = name

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Var: {self.name}"
        return d

class CallExprASTNode(ASTNode):
    def __init__(self, callee: str, arguments: List[Any], line: int, col: int):
        super().__init__("CallExprASTNode", line, col)
        self.callee = callee
        self.arguments = arguments or []

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Call: {self.callee}()"
        d["children"] = [arg.to_tree_dict() for arg in self.arguments if arg]
        return d

class AssignExprASTNode(ASTNode):
    def __init__(self, var_name: str, op: str, value: Any, line: int, col: int):
        super().__init__("AssignExprASTNode", line, col)
        self.var_name = var_name
        self.op = op
        self.value = value

    def to_tree_dict(self) -> Dict[str, Any]:
        d = super().to_tree_dict()
        d["name"] = f"Assign: {self.var_name} {self.op} ..."
        if self.value:
            d["children"] = [self.value.to_tree_dict()]
        return d

# ============================================================================
# LL(1) Recursive Descent Parser
# ============================================================================

class Parser:
    def __init__(self, tokens: List[Token]):
        self.tokens = [t for t in tokens if t.type != TokenType.COMMENT]
        self.current = 0
        self.errors: List[Dict[str, Any]] = []

    def peek(self) -> Token:
        if self.current >= len(self.tokens):
            return Token(TokenType.EOF, "", 0, 0)
        return self.tokens[self.current]

    def previous(self) -> Token:
        if self.current == 0:
            return self.tokens[0]
        return self.tokens[self.current - 1]

    def is_at_end(self) -> bool:
        return self.peek().type == TokenType.EOF

    def advance(self) -> Token:
        if not self.is_at_end():
            self.current += 1
        return self.previous()

    def check(self, token_type: str, value: Optional[str] = None) -> bool:
        if self.is_at_end():
            return False
        tok = self.peek()
        if tok.type != token_type:
            return False
        if value is not None and tok.value != value:
            return False
        return True

    def match(self, token_type: str, value: Optional[str] = None) -> bool:
        if self.check(token_type, value):
            self.advance()
            return True
        return False

    def consume(self, token_type: str, value: Optional[str] = None, error_msg: str = "") -> Token:
        if self.check(token_type, value):
            return self.advance()
        tok = self.peek()
        msg = error_msg or f"Expected '{value or token_type}' but found '{tok.value}'"
        self.errors.append({
            "line": tok.line,
            "col": tok.col,
            "severity": "error",
            "type": "Syntax Error",
            "message": msg,
            "suggestion": f"Insert missing '{value or token_type}'"
        })
        return tok

    def synchronize(self):
        self.advance()
        while not self.is_at_end():
            if self.previous().value in (";", "}"):
                return
            if self.peek().value in ("int", "float", "double", "char", "void", "bool", "if", "while", "for", "return", "class", "struct"):
                return
            self.advance()

    def is_type_specifier(self) -> bool:
        tok = self.peek()
        if tok.value == "const":
            return True
        if tok.value in ("int", "float", "double", "char", "void", "bool", "auto"):
            return True
        if tok.type == TokenType.IDENTIFIER and self.current + 1 < len(self.tokens):
            next_tok = self.tokens[self.current + 1]
            if next_tok.type == TokenType.IDENTIFIER or next_tok.value in ("*", "&"):
                return True
        return False

    def parse_type(self) -> Tuple[str, bool]:
        is_const = self.match(TokenType.KEYWORD, "const")
        type_name = "int"
        if self.is_type_specifier() or self.check(TokenType.IDENTIFIER):
            type_name = self.advance().value
        else:
            tok = self.peek()
            self.errors.append({
                "line": tok.line,
                "col": tok.col,
                "severity": "error",
                "type": "Syntax Error",
                "message": f"Expected type name but found '{tok.value}'",
                "suggestion": "Specify a valid type (e.g. 'int', 'void', 'float')"
            })
        while self.check(TokenType.OPERATOR, "*") or self.check(TokenType.OPERATOR, "&"):
            type_name += self.advance().value
        return type_name, is_const

    def parse(self) -> ProgramNode:
        prog = ProgramNode(1, 1)
        while not self.is_at_end():
            if self.match(TokenType.DELIMITER, ";"):
                continue
            try:
                decl = self.parse_top_level_declaration()
                if decl:
                    prog.declarations.append(decl)
            except Exception:
                self.synchronize()
        return prog

    def parse_top_level_declaration(self) -> Optional[ASTNode]:
        if self.is_type_specifier():
            lookahead = self.current
            if self.tokens[lookahead].value == "const":
                lookahead += 1
            if lookahead < len(self.tokens) and (self.tokens[lookahead].type == TokenType.KEYWORD or self.tokens[lookahead].type == TokenType.IDENTIFIER):
                lookahead += 1
            while lookahead < len(self.tokens) and self.tokens[lookahead].value in ("*", "&"):
                lookahead += 1
            if lookahead < len(self.tokens) and self.tokens[lookahead].type == TokenType.IDENTIFIER:
                lookahead += 1
                if lookahead < len(self.tokens) and self.tokens[lookahead].value == "(":
                    return self.parse_function_declaration()
                return self.parse_variable_declaration()
        return self.parse_statement()

    def parse_function_declaration(self) -> Optional[FunctionDeclNode]:
        start_tok = self.peek()
        ret_type, _ = self.parse_type()
        name_tok = self.consume(TokenType.IDENTIFIER, error_msg="Expected function name")
        fn_name = name_tok.value

        self.consume(TokenType.DELIMITER, "(", "Expected '(' after function name")
        params: List[ParamNode] = []
        if not self.check(TokenType.DELIMITER, ")"):
            while True:
                p_type, _ = self.parse_type()
                p_name = ""
                if self.check(TokenType.IDENTIFIER):
                    p_name = self.advance().value
                params.append(ParamNode(p_type, p_name, start_tok.line, start_tok.col))
                if not self.match(TokenType.DELIMITER, ","):
                    break
        self.consume(TokenType.DELIMITER, ")", "Expected ')' after parameters")

        if self.match(TokenType.DELIMITER, ";"):
            return FunctionDeclNode(ret_type, fn_name, params, None, False, start_tok.line, start_tok.col, self.previous().line)

        body = self.parse_block()
        end_line = self.previous().line
        return FunctionDeclNode(ret_type, fn_name, params, body, True, start_tok.line, start_tok.col, end_line)

    def parse_variable_declaration(self) -> Optional[VarDeclNode]:
        start_tok = self.peek()
        var_type, is_const = self.parse_type()
        name_tok = self.consume(TokenType.IDENTIFIER, error_msg="Expected variable name")
        # Support array dimensions (e.g. char buffer[64];)
        if self.match(TokenType.DELIMITER, "["):
            if not self.check(TokenType.DELIMITER, "]"):
                self.parse_expression()
            self.consume(TokenType.DELIMITER, "]", "Expected ']' after array size")
            var_type += "[]"
        init_expr = None
        if self.match(TokenType.OPERATOR, "="):
            init_expr = self.parse_expression()
        self.consume(TokenType.DELIMITER, ";", "Expected ';' after variable declaration")
        return VarDeclNode(var_type, name_tok.value, init_expr, is_const, start_tok.line, start_tok.col)

    def parse_block(self) -> BlockStmtNode:
        start_tok = self.consume(TokenType.DELIMITER, "{", "Expected '{' to start block")
        block = BlockStmtNode(start_tok.line, start_tok.col)
        while not self.check(TokenType.DELIMITER, "}") and not self.is_at_end():
            stmt = self.parse_statement()
            if stmt:
                block.statements.append(stmt)
        self.consume(TokenType.DELIMITER, "}", "Expected '}' to close block")
        return block

    def parse_statement(self) -> Optional[ASTNode]:
        if self.match(TokenType.DELIMITER, ";"):
            return None
        if self.check(TokenType.DELIMITER, "{"):
            return self.parse_block()
        if self.match(TokenType.KEYWORD, "if"):
            return self.parse_if()
        if self.match(TokenType.KEYWORD, "while"):
            return self.parse_while()
        if self.match(TokenType.KEYWORD, "for"):
            return self.parse_for()
        if self.match(TokenType.KEYWORD, "return"):
            return self.parse_return()
        if self.match(TokenType.KEYWORD, "break"):
            t = self.previous()
            self.consume(TokenType.DELIMITER, ";", "Expected ';' after break")
            return BreakStmtNode(t.line, t.col)
        if self.match(TokenType.KEYWORD, "continue"):
            t = self.previous()
            self.consume(TokenType.DELIMITER, ";", "Expected ';' after continue")
            return ContinueStmtNode(t.line, t.col)
        if self.is_type_specifier():
            return self.parse_variable_declaration()

        expr = self.parse_expression()
        self.consume(TokenType.DELIMITER, ";", "Expected ';' after expression")
        return ExprStmtNode(expr, expr.line if expr else 1, expr.col if expr else 1)

    def parse_if(self) -> IfStmtNode:
        start_tok = self.previous()
        self.consume(TokenType.DELIMITER, "(", "Expected '(' after 'if'")
        cond = self.parse_expression()
        self.consume(TokenType.DELIMITER, ")", "Expected ')' after if condition")
        then_b = self.parse_statement()
        else_b = None
        if self.match(TokenType.KEYWORD, "else"):
            else_b = self.parse_statement()
        return IfStmtNode(cond, then_b, else_b, start_tok.line, start_tok.col)

    def parse_while(self) -> WhileStmtNode:
        start_tok = self.previous()
        self.consume(TokenType.DELIMITER, "(", "Expected '(' after 'while'")
        cond = self.parse_expression()
        self.consume(TokenType.DELIMITER, ")", "Expected ')' after while condition")
        body = self.parse_statement()
        return WhileStmtNode(cond, body, start_tok.line, start_tok.col)

    def parse_for(self) -> ForStmtNode:
        start_tok = self.previous()
        self.consume(TokenType.DELIMITER, "(", "Expected '(' after 'for'")
        init = None
        if not self.match(TokenType.DELIMITER, ";"):
            if self.is_type_specifier():
                init = self.parse_variable_declaration()
            else:
                expr = self.parse_expression()
                self.consume(TokenType.DELIMITER, ";", "Expected ';' after for init")
                init = ExprStmtNode(expr, expr.line if expr else start_tok.line, expr.col if expr else start_tok.col)
        cond = None
        if not self.check(TokenType.DELIMITER, ";"):
            cond = self.parse_expression()
        self.consume(TokenType.DELIMITER, ";", "Expected ';' after for condition")
        update = None
        if not self.check(TokenType.DELIMITER, ")"):
            update = self.parse_expression()
        self.consume(TokenType.DELIMITER, ")", "Expected ')' after for clauses")
        body = self.parse_statement()
        return ForStmtNode(init, cond, update, body, start_tok.line, start_tok.col)

    def parse_return(self) -> ReturnStmtNode:
        start_tok = self.previous()
        expr = None
        if not self.check(TokenType.DELIMITER, ";"):
            expr = self.parse_expression()
        self.consume(TokenType.DELIMITER, ";", "Expected ';' after return")
        return ReturnStmtNode(expr, start_tok.line, start_tok.col)

    def parse_expression(self) -> Any:
        return self.parse_assignment()

    def parse_assignment(self) -> Any:
        expr = self.parse_logical_or()
        if self.check(TokenType.OPERATOR) and self.peek().value in ("=", "+=", "-=", "*=", "/=", "%="):
            op = self.advance().value
            val = self.parse_assignment()
            if isinstance(expr, VariableExprASTNode):
                return AssignExprASTNode(expr.name, op, val, expr.line, expr.col)
            self.errors.append({
                "line": expr.line if expr else 1,
                "col": expr.col if expr else 1,
                "severity": "error",
                "type": "Syntax Error",
                "message": "Invalid l-value in assignment target",
                "suggestion": "Assign to an identifier or variable"
            })
        return expr

    def parse_logical_or(self) -> Any:
        expr = self.parse_logical_and()
        while self.match(TokenType.OPERATOR, "||"):
            op = self.previous()
            right = self.parse_logical_and()
            expr = BinaryExprASTNode("||", expr, right, op.line, op.col)
        return expr

    def parse_logical_and(self) -> Any:
        expr = self.parse_equality()
        while self.match(TokenType.OPERATOR, "&&"):
            op = self.previous()
            right = self.parse_equality()
            expr = BinaryExprASTNode("&&", expr, right, op.line, op.col)
        return expr

    def parse_equality(self) -> Any:
        expr = self.parse_relational()
        while self.check(TokenType.OPERATOR) and self.peek().value in ("==", "!="):
            op = self.advance()
            right = self.parse_relational()
            expr = BinaryExprASTNode(op.value, expr, right, op.line, op.col)
        return expr

    def parse_relational(self) -> Any:
        expr = self.parse_additive()
        while self.check(TokenType.OPERATOR) and self.peek().value in ("<", "<=", ">", ">="):
            op = self.advance()
            right = self.parse_additive()
            expr = BinaryExprASTNode(op.value, expr, right, op.line, op.col)
        return expr

    def parse_additive(self) -> Any:
        expr = self.parse_multiplicative()
        while self.check(TokenType.OPERATOR) and self.peek().value in ("+", "-"):
            op = self.advance()
            right = self.parse_multiplicative()
            expr = BinaryExprASTNode(op.value, expr, right, op.line, op.col)
        return expr

    def parse_multiplicative(self) -> Any:
        expr = self.parse_unary()
        while self.check(TokenType.OPERATOR) and self.peek().value in ("*", "/", "%"):
            op = self.advance()
            right = self.parse_unary()
            expr = BinaryExprASTNode(op.value, expr, right, op.line, op.col)
        return expr

    def parse_unary(self) -> Any:
        if self.check(TokenType.OPERATOR) and self.peek().value in ("!", "-", "+", "++", "--"):
            op = self.advance()
            operand = self.parse_unary()
            return UnaryExprASTNode(op.value, operand, True, op.line, op.col)
        return self.parse_postfix()

    def parse_postfix(self) -> Any:
        expr = self.parse_primary()
        while True:
            if self.match(TokenType.DELIMITER, "("):
                args = []
                if not self.check(TokenType.DELIMITER, ")"):
                    while True:
                        args.append(self.parse_expression())
                        if not self.match(TokenType.DELIMITER, ","):
                            break
                r_paren = self.consume(TokenType.DELIMITER, ")", "Expected ')' after function call arguments")
                callee_name = expr.name if isinstance(expr, VariableExprASTNode) else "unknown"
                expr = CallExprASTNode(callee_name, args, expr.line if expr else r_paren.line, expr.col if expr else r_paren.col)
            elif self.match(TokenType.DELIMITER, "["):
                idx = self.parse_expression()
                self.consume(TokenType.DELIMITER, "]", "Expected ']' after array index")
                expr = BinaryExprASTNode("[]", expr, idx, expr.line if expr else 1, expr.col if expr else 1)
            elif self.check(TokenType.OPERATOR) and self.peek().value in ("++", "--"):
                op = self.advance()
                expr = UnaryExprASTNode(op.value, expr, False, op.line, op.col)
            else:
                break
        return expr

    def parse_primary(self) -> Any:
        tok = self.peek()
        if tok.type in (TokenType.LITERAL_INT, TokenType.LITERAL_FLOAT):
            self.advance()
            return LiteralExprASTNode(tok.value, "number", tok.line, tok.col)
        if tok.type == TokenType.LITERAL_STRING:
            self.advance()
            return LiteralExprASTNode(tok.value, "string", tok.line, tok.col)
        if tok.type == TokenType.LITERAL_CHAR:
            self.advance()
            return LiteralExprASTNode(tok.value, "char", tok.line, tok.col)
        if tok.type == TokenType.LITERAL_BOOL:
            self.advance()
            return LiteralExprASTNode(tok.value, "bool", tok.line, tok.col)
        if tok.type == TokenType.IDENTIFIER:
            self.advance()
            return VariableExprASTNode(tok.value, tok.line, tok.col)
        if self.match(TokenType.DELIMITER, "("):
            expr = self.parse_expression()
            self.consume(TokenType.DELIMITER, ")", "Expected ')' after parenthesized expression")
            return expr

        self.errors.append({
            "line": tok.line,
            "col": tok.col,
            "severity": "error",
            "type": "Syntax Error",
            "message": f"Expected expression but found '{tok.value}'",
            "suggestion": "Provide a valid variable, literal, or expression"
        })
        self.advance()
        return None

# ============================================================================
# Symbol Table & Scoping
# ============================================================================

class SymbolInfo:
    def __init__(self, name: str, var_type: str, scope: str, line: int, col: int, is_param: bool = False, is_const: bool = False, is_function: bool = False, is_initialized: bool = False):
        self.name = name
        self.type = var_type
        self.scope = scope
        self.line = line
        self.col = col
        self.is_param = is_param
        self.is_const = is_const
        self.is_function = is_function
        self.is_used = False
        self.is_initialized = is_initialized

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "type": self.type,
            "scope": self.scope,
            "line": self.line
        }

class SymbolTable:
    def __init__(self):
        self.scopes: List[Dict[str, SymbolInfo]] = []
        self.scope_names: List[str] = []
        self.all_symbols: List[SymbolInfo] = []
        self.enter_scope("global")
        self.init_builtins()

    def init_builtins(self):
        builtins = [
            "cout", "cin", "cerr", "endl", "std", "string", "vector",
            "printf", "scanf", "malloc", "free", "exit", "nullptr",
            "NULL", "size_t", "max", "min", "abs", "sqrt"
        ]
        for b in builtins:
            sym = SymbolInfo(b, "builtin", "global", 0, 0, is_function=True, is_initialized=True)
            sym.is_used = True
            self.scopes[0][b] = sym

    def current_scope_name(self) -> str:
        return self.scope_names[-1] if self.scope_names else "global"

    def enter_scope(self, name: str = "block"):
        self.scopes.append({})
        self.scope_names.append(name)

    def exit_scope(self, issues: List[Dict[str, Any]]):
        if not self.scopes:
            return
        current = self.scopes[-1]
        for name, sym in current.items():
            if not sym.is_used and not sym.is_function and sym.name not in ("_", "argc", "argv"):
                issues.append({
                    "line": sym.line,
                    "col": sym.col,
                    "severity": "warning",
                    "type": "Unused Variable",
                    "message": f"Variable '{sym.name}' declared at line {sym.line} is never used",
                    "suggestion": f"Remove variable '{sym.name}' or use it in calculations to free stack memory"
                })
        self.scopes.pop()
        self.scope_names.pop()

    def declare(self, sym: SymbolInfo, issues: List[Dict[str, Any]]) -> bool:
        if not self.scopes:
            self.enter_scope("global")
        current = self.scopes[-1]
        if sym.name in current:
            prev = current[sym.name]
            issues.append({
                "line": sym.line,
                "col": sym.col,
                "severity": "error",
                "type": "Redeclaration",
                "message": f"Redeclaration of variable '{sym.name}' (previous declaration at line {prev.line})",
                "suggestion": f"Rename '{sym.name}' or reuse the existing variable"
            })
            return False
        current[sym.name] = sym
        self.all_symbols.append(sym)
        return True

    def mark_used(self, name: str) -> bool:
        for scope in reversed(self.scopes):
            if name in scope:
                scope[name].is_used = True
                return True
        return False

    def mark_initialized(self, name: str):
        for scope in reversed(self.scopes):
            if name in scope:
                scope[name].is_initialized = True
                return

    def exists(self, name: str) -> bool:
        for scope in reversed(self.scopes):
            if name in scope:
                return True
        return False

    def lookup(self, name: str) -> Optional[SymbolInfo]:
        for scope in reversed(self.scopes):
            if name in scope:
                return scope[name]
        return None

# ============================================================================
# Static Semantic & Metrics Analyzer
# ============================================================================

class Analyzer:
    def __init__(self, threshold_loc: int = 50, threshold_nesting: int = 4, threshold_complexity: int = 10):
        self.threshold_loc = threshold_loc
        self.threshold_nesting = threshold_nesting
        self.threshold_complexity = threshold_complexity

        self.symbol_table = SymbolTable()
        self.issues: List[Dict[str, Any]] = []
        self.functions_metrics: List[Dict[str, Any]] = []

        self.current_function: Optional[Dict[str, Any]] = None
        self.current_nesting = 0
        self.max_nesting_in_func = 0
        self.current_complexity = 1
        self.inside_function = False

    def analyze(self, program: ProgramNode, total_lines: int, front_end_errors: List[Dict[str, Any]]) -> Dict[str, Any]:
        self.issues = list(front_end_errors or [])
        self.symbol_table = SymbolTable()
        self.functions_metrics = []

        if program:
            self.visit(program)

        # Global scope cleanup
        self.symbol_table.exit_scope(self.issues)

        # Compute accuracy score & deductions
        metrics = self.calculate_metrics(total_lines)

        return {
            "issues": self.issues,
            "metrics": metrics,
            "symbol_table": [s.to_dict() for s in self.symbol_table.all_symbols if s.type != "builtin"],
            "ast": program.to_tree_dict() if program else {}
        }

    def calculate_metrics(self, total_lines: int) -> Dict[str, Any]:
        score = 100.0
        deductions: List[Dict[str, Any]] = []

        syntax_lex_count = sum(1 for i in self.issues if i.get("type") in ("Syntax Error", "Lexical Error"))
        semantic_count = sum(1 for i in self.issues if i.get("type") in ("Undeclared Variable", "Redeclaration"))
        unused_count = sum(1 for i in self.issues if i.get("type") == "Unused Variable")
        uninit_count = sum(1 for i in self.issues if i.get("type") == "Uninitialized Variable")
        dead_code_count = sum(1 for i in self.issues if i.get("type") == "Dead Code")
        nesting_count = sum(1 for i in self.issues if i.get("type") == "Nesting Depth")
        loc_count = sum(1 for i in self.issues if i.get("type") == "Function Length")
        complexity_count = sum(1 for i in self.issues if i.get("type") == "High Complexity")
        security_count = sum(1 for i in self.issues if "Security" in i.get("type", ""))

        if syntax_lex_count > 0:
            penalty = syntax_lex_count * 20.0
            score -= penalty
            deductions.append({"rule": f"Syntax/Lexical Errors ({syntax_lex_count}x -20%)", "points": penalty})

        if semantic_count > 0:
            penalty = semantic_count * 15.0
            score -= penalty
            deductions.append({"rule": f"Semantic / Undeclared Errors ({semantic_count}x -15%)", "points": penalty})

        if unused_count > 0:
            penalty = unused_count * 5.0
            score -= penalty
            deductions.append({"rule": f"Unused Variables ({unused_count}x -5%)", "points": penalty})

        if uninit_count > 0:
            penalty = uninit_count * 5.0
            score -= penalty
            deductions.append({"rule": f"Uninitialized Variables ({uninit_count}x -5%)", "points": penalty})

        if dead_code_count > 0:
            penalty = dead_code_count * 8.0
            score -= penalty
            deductions.append({"rule": f"Unreachable / Dead Code ({dead_code_count}x -8%)", "points": penalty})

        if nesting_count > 0:
            penalty = nesting_count * 5.0
            score -= penalty
            deductions.append({"rule": f"Excessive Nesting Depth ({nesting_count}x -5%)", "points": penalty})

        if loc_count > 0:
            penalty = loc_count * 4.0
            score -= penalty
            deductions.append({"rule": f"Excessive Function Length ({loc_count}x -4%)", "points": penalty})

        if complexity_count > 0:
            penalty = complexity_count * 6.0
            score -= penalty
            deductions.append({"rule": f"High Cyclomatic Complexity ({complexity_count}x -6%)", "points": penalty})

        if security_count > 0:
            penalty = security_count * 5.0
            score -= penalty
            deductions.append({"rule": f"Security Warnings ({security_count}x -5%)", "points": penalty})

        score = max(0.0, min(100.0, score))
        score = round(score, 1)

        if score >= 95.0:
            grade, desc = "A+", "Outstanding (Clean, Production-Ready Code)"
        elif score >= 85.0:
            grade, desc = "A", "Excellent (Robust Structure, Minor Recommendations)"
        elif score >= 75.0:
            grade, desc = "B", "Good (Solid Logic, Minor Code Quality Warnings)"
        elif score >= 60.0:
            grade, desc = "C", "Fair (Multiple Warnings, Refactoring Recommended)"
        elif score >= 40.0:
            grade, desc = "D", "Poor (Significant Structural Issues or Errors)"
        else:
            grade, desc = "F", "Failing (Critical Errors & Severe Code Smells)"

        avg_comp = 0.0
        if self.functions_metrics:
            avg_comp = round(sum(f["complexity"] for f in self.functions_metrics) / len(self.functions_metrics), 1)

        overall_risk = "Low"
        if avg_comp > 20: overall_risk = "High"
        elif avg_comp > 10: overall_risk = "Moderate"

        return {
            "lines": total_lines,
            "functions": len(self.functions_metrics),
            "cyclomatic_complexity": avg_comp,
            "quality_score": score,
            "grade": grade,
            "description": desc,
            "risk_level": overall_risk,
            "function_metrics": self.functions_metrics,
            "deductions": deductions
        }

    def visit(self, node: Any):
        if not node:
            return

        ntype = getattr(node, "node_type", "")
        if ntype == "ProgramNode":
            for d in node.declarations:
                self.visit(d)
        elif ntype == "FunctionDeclNode":
            self.visit_function(node)
        elif ntype == "VarDeclNode":
            self.visit_var_decl(node)
        elif ntype == "BlockStmtNode":
            self.visit_block(node)
        elif ntype == "IfStmtNode":
            self.visit_if(node)
        elif ntype == "WhileStmtNode":
            self.visit_while(node)
        elif ntype == "ForStmtNode":
            self.visit_for(node)
        elif ntype == "ReturnStmtNode":
            if node.expression: self.visit(node.expression)
        elif ntype == "ExprStmtNode":
            if node.expression: self.visit(node.expression)
        elif ntype == "BinaryExprASTNode":
            self.visit_binary(node)
        elif ntype == "UnaryExprASTNode":
            if node.operand: self.visit(node.operand)
        elif ntype == "VariableExprASTNode":
            self.visit_variable(node)
        elif ntype == "CallExprASTNode":
            self.visit_call(node)
        elif ntype == "AssignExprASTNode":
            self.visit_assign(node)

    def visit_var_decl(self, node: VarDeclNode):
        scope_name = self.symbol_table.current_scope_name()
        has_init = node.initializer is not None
        sym = SymbolInfo(node.name, node.type, scope_name, node.line, node.col, is_const=node.is_const, is_initialized=has_init)
        self.symbol_table.declare(sym, self.issues)

        # Security check: Hardcoded secrets
        if SECRET_PATTERNS.search(node.name) and node.initializer:
            if isinstance(node.initializer, LiteralExprASTNode) and len(str(node.initializer.value).strip('"\'')) > 0:
                self.issues.append({
                    "line": node.line,
                    "col": node.col,
                    "severity": "warning",
                    "type": "Security: Hardcoded Secret",
                    "message": f"Potential hardcoded credential or secret detected in variable '{node.name}'",
                    "suggestion": "Extract secrets into secure environment variables or a configuration vault"
                })

        if node.initializer:
            self.visit(node.initializer)

    def visit_function(self, node: FunctionDeclNode):
        fn_sym = SymbolInfo(node.name, node.return_type, "global", node.line, node.col, is_function=True, is_initialized=True)
        fn_sym.is_used = True
        self.symbol_table.declare(fn_sym, self.issues)

        if node.is_definition and node.body:
            loc = node.get_loc()
            fn_metric = {
                "name": node.name,
                "lines": f"{node.line}-{node.end_line}",
                "loc": loc,
                "nesting": 0,
                "complexity": 1,
                "risk": "Low"
            }

            if loc > self.threshold_loc:
                self.issues.append({
                    "line": node.line,
                    "col": node.col,
                    "severity": "warning",
                    "type": "Function Length",
                    "message": f"Function '{node.name}' exceeds LOC threshold ({loc} lines > {self.threshold_loc} lines)",
                    "suggestion": f"Decompose '{node.name}' into smaller helper functions (target < {self.threshold_loc} LOC)"
                })

            self.current_complexity = 1
            self.current_nesting = 0
            self.max_nesting_in_func = 0
            self.inside_function = True
            self.current_function = fn_metric

            self.symbol_table.enter_scope(node.name)

            for p in node.parameters:
                p_sym = SymbolInfo(p.name, p.type, node.name, p.line, p.col, is_param=True, is_initialized=True)
                p_sym.is_used = True
                self.symbol_table.declare(p_sym, self.issues)

            # Dead code tracking in body
            has_terminator = False
            term_line = 0

            for stmt in node.body.statements:
                if not stmt: continue
                if has_terminator:
                    self.issues.append({
                        "line": stmt.line,
                        "col": stmt.col,
                        "severity": "warning",
                        "type": "Dead Code",
                        "message": f"Unreachable code detected after terminating statement at line {term_line}",
                        "suggestion": "Remove unreachable dead statements or relocate them before the return/terminating statement"
                    })
                    has_terminator = False

                self.visit(stmt)

                if getattr(stmt, "node_type", "") in ("ReturnStmtNode", "BreakStmtNode", "ContinueStmtNode"):
                    has_terminator = True
                    term_line = stmt.line

            self.symbol_table.exit_scope(self.issues)

            fn_metric["complexity"] = self.current_complexity
            fn_metric["nesting"] = self.max_nesting_in_func

            # Risk level
            if self.current_complexity <= 10:
                fn_metric["risk"] = "Low"
            elif self.current_complexity <= 20:
                fn_metric["risk"] = "Moderate"
            elif self.current_complexity <= 40:
                fn_metric["risk"] = "High"
            else:
                fn_metric["risk"] = "Very High"

            if self.max_nesting_in_func > self.threshold_nesting:
                self.issues.append({
                    "line": node.line,
                    "col": node.col,
                    "severity": "warning",
                    "type": "Nesting Depth",
                    "message": f"Control flow nesting depth in function '{node.name}' exceeds threshold ({self.max_nesting_in_func} > {self.threshold_nesting})",
                    "suggestion": "Flatten logic with guard clauses or break nested branches into helper functions"
                })

            if self.current_complexity > self.threshold_complexity:
                self.issues.append({
                    "line": node.line,
                    "col": node.col,
                    "severity": "warning",
                    "type": "High Complexity",
                    "message": f"Function '{node.name}' has high cyclomatic complexity ({self.current_complexity} > {self.threshold_complexity}) - Risk Level: {fn_metric['risk']}",
                    "suggestion": f"Refactor '{node.name}' to reduce decision branching (McCabe V(G) target <= 10)"
                })

            self.functions_metrics.append(fn_metric)
            self.current_function = None
            self.inside_function = False

    def visit_block(self, node: BlockStmtNode):
        self.symbol_table.enter_scope("block")
        has_terminator = False
        term_line = 0

        for stmt in node.statements:
            if not stmt: continue
            if has_terminator:
                self.issues.append({
                    "line": stmt.line,
                    "col": stmt.col,
                    "severity": "warning",
                    "type": "Dead Code",
                    "message": f"Unreachable code detected after terminating statement at line {term_line}",
                    "suggestion": "Remove unreachable dead code block"
                })
                has_terminator = False

            self.visit(stmt)

            if getattr(stmt, "node_type", "") in ("ReturnStmtNode", "BreakStmtNode", "ContinueStmtNode"):
                has_terminator = True
                term_line = stmt.line

        self.symbol_table.exit_scope(self.issues)

    def visit_if(self, node: IfStmtNode):
        if self.inside_function:
            self.current_complexity += 1
            self.current_nesting += 1
            self.max_nesting_in_func = max(self.max_nesting_in_func, self.current_nesting)

        if node.condition: self.visit(node.condition)
        if node.then_branch: self.visit(node.then_branch)
        if node.else_branch: self.visit(node.else_branch)

        if self.inside_function:
            self.current_nesting -= 1

    def visit_while(self, node: WhileStmtNode):
        if self.inside_function:
            self.current_complexity += 1
            self.current_nesting += 1
            self.max_nesting_in_func = max(self.max_nesting_in_func, self.current_nesting)

        if node.condition: self.visit(node.condition)
        if node.body: self.visit(node.body)

        if self.inside_function:
            self.current_nesting -= 1

    def visit_for(self, node: ForStmtNode):
        if self.inside_function:
            self.current_complexity += 1
            self.current_nesting += 1
            self.max_nesting_in_func = max(self.max_nesting_in_func, self.current_nesting)

        self.symbol_table.enter_scope("for")
        if node.init: self.visit(node.init)
        if node.condition: self.visit(node.condition)
        if node.update: self.visit(node.update)
        if node.body: self.visit(node.body)
        self.symbol_table.exit_scope(self.issues)

        if self.inside_function:
            self.current_nesting -= 1

    def visit_binary(self, node: BinaryExprASTNode):
        if self.inside_function and node.op in ("&&", "||"):
            self.current_complexity += 1
        if node.left: self.visit(node.left)
        if node.right: self.visit(node.right)

    def visit_variable(self, node: VariableExprASTNode):
        if not self.symbol_table.exists(node.name):
            self.issues.append({
                "line": node.line,
                "col": node.col,
                "severity": "error",
                "type": "Undeclared Variable",
                "message": f"Variable '{node.name}' is used without being declared",
                "suggestion": f"Declare '{node.name}' with its type (e.g. 'int {node.name};') before referencing it"
            })
        else:
            sym = self.symbol_table.lookup(node.name)
            if sym and not sym.is_initialized:
                self.issues.append({
                    "line": node.line,
                    "col": node.col,
                    "severity": "warning",
                    "type": "Uninitialized Variable",
                    "message": f"Variable '{node.name}' declared at line {sym.line} is used before being initialized",
                    "suggestion": f"Initialize '{node.name}' (e.g. 'int {node.name} = 0;') to avoid undefined behavior"
                })
            self.symbol_table.mark_used(node.name)

    def visit_call(self, node: CallExprASTNode):
        # Security check: Unsafe functions
        if node.callee in UNSAFE_FUNCTIONS:
            msg, sev = UNSAFE_FUNCTIONS[node.callee]
            self.issues.append({
                "line": node.line,
                "col": node.col,
                "severity": sev,
                "type": "Security: Unsafe Function",
                "message": f"Call to unsafe API '{node.callee}()': {msg}",
                "suggestion": f"Replace '{node.callee}' with a safer bounds-checked alternative"
            })

        if self.symbol_table.exists(node.callee):
            self.symbol_table.mark_used(node.callee)

        for arg in node.arguments:
            if arg: self.visit(arg)

    def visit_assign(self, node: AssignExprASTNode):
        if not self.symbol_table.exists(node.var_name):
            self.issues.append({
                "line": node.line,
                "col": node.col,
                "severity": "error",
                "type": "Undeclared Variable",
                "message": f"Assignment to undeclared variable '{node.var_name}'",
                "suggestion": f"Declare variable '{node.var_name}' before assignment"
            })
        else:
            self.symbol_table.mark_used(node.var_name)
            self.symbol_table.mark_initialized(node.var_name)

        if node.value:
            self.visit(node.value)

# ============================================================================
# Public Analysis API
# ============================================================================

def analyze_code(source_code: str, filename: str = "source.cpp") -> Dict[str, Any]:
    lines = source_code.splitlines()
    total_lines = len(lines)

    lexer = Lexer(source_code)
    tokens = lexer.tokenize()

    parser = Parser(tokens)
    ast = parser.parse()

    front_end_errors = list(lexer.errors) + list(parser.errors)

    analyzer = Analyzer(threshold_loc=50, threshold_nesting=4, threshold_complexity=10)
    result = analyzer.analyze(ast, total_lines, front_end_errors)

    # Format tokens per Step 2 schema: [{"type", "value", "line", "col"}]
    clean_tokens = [t.to_dict() for t in tokens if t.type != TokenType.EOF]

    return {
        "tokens": clean_tokens,
        "symbol_table": result["symbol_table"],
        "issues": result["issues"],
        "metrics": result["metrics"],
        "ast": result["ast"]
    }
