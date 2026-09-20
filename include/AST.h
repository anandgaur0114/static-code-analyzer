#ifndef AST_H
#define AST_H

#include <string>
#include <vector>
#include <memory>
#include <iostream>

// Forward declarations of AST nodes
class ProgramNode;
class TypeNode;
class VarDeclNode;
class ParamNode;
class FunctionDeclNode;
class BlockStmtNode;
class IfStmtNode;
class WhileStmtNode;
class ForStmtNode;
class ReturnStmtNode;
class BreakStmtNode;
class ContinueStmtNode;
class ExprStmtNode;
class BinaryExprASTNode;
class UnaryExprASTNode;
class LiteralExprASTNode;
class VariableExprASTNode;
class CallExprASTNode;
class AssignExprASTNode;

// AST Visitor interface
class ASTVisitor {
public:
    virtual ~ASTVisitor() = default;
    virtual void visit(ProgramNode& node) = 0;
    virtual void visit(TypeNode& node) = 0;
    virtual void visit(VarDeclNode& node) = 0;
    virtual void visit(ParamNode& node) = 0;
    virtual void visit(FunctionDeclNode& node) = 0;
    virtual void visit(BlockStmtNode& node) = 0;
    virtual void visit(IfStmtNode& node) = 0;
    virtual void visit(WhileStmtNode& node) = 0;
    virtual void visit(ForStmtNode& node) = 0;
    virtual void visit(ReturnStmtNode& node) = 0;
    virtual void visit(BreakStmtNode& node) = 0;
    virtual void visit(ContinueStmtNode& node) = 0;
    virtual void visit(ExprStmtNode& node) = 0;
    virtual void visit(BinaryExprASTNode& node) = 0;
    virtual void visit(UnaryExprASTNode& node) = 0;
    virtual void visit(LiteralExprASTNode& node) = 0;
    virtual void visit(VariableExprASTNode& node) = 0;
    virtual void visit(CallExprASTNode& node) = 0;
    virtual void visit(AssignExprASTNode& node) = 0;
};

// Base AST Node
class ASTNode {
public:
    int line;
    int column;

    ASTNode(int line = 1, int column = 1) : line(line), column(column) {}
    virtual ~ASTNode() = default;

    virtual void accept(ASTVisitor& visitor) = 0;
    virtual std::string toString() const = 0;
};

// Base Expression Node
class ExprNode : public ASTNode {
public:
    ExprNode(int line = 1, int column = 1) : ASTNode(line, column) {}
};

// Base Statement Node
class StmtNode : public ASTNode {
public:
    StmtNode(int line = 1, int column = 1) : ASTNode(line, column) {}
};

// Program Root
class ProgramNode : public ASTNode {
public:
    std::vector<std::unique_ptr<ASTNode>> declarations;

    ProgramNode(int line = 1, int column = 1) : ASTNode(line, column) {}
    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "ProgramNode"; }
};

// Type Node (e.g., int, float, const char)
class TypeNode : public ASTNode {
public:
    std::string name;
    bool isConst;

    TypeNode(std::string name, bool isConst = false, int line = 1, int column = 1)
        : ASTNode(line, column), name(std::move(name)), isConst(isConst) {}
    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return (isConst ? "const " : "") + name; }
};

// Variable Declaration Node
class VarDeclNode : public StmtNode {
public:
    std::string type;
    std::string name;
    std::unique_ptr<ExprNode> initializer;
    bool isConst;

    VarDeclNode(std::string type, std::string name, std::unique_ptr<ExprNode> init = nullptr,
                bool isConst = false, int line = 1, int column = 1)
        : StmtNode(line, column), type(std::move(type)), name(std::move(name)),
          initializer(std::move(init)), isConst(isConst) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "VarDecl: " + type + " " + name; }
};

// Function Parameter Node
class ParamNode : public ASTNode {
public:
    std::string type;
    std::string name;

    ParamNode(std::string type, std::string name, int line = 1, int column = 1)
        : ASTNode(line, column), type(std::move(type)), name(std::move(name)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "Param: " + type + " " + name; }
};

// Block Statement Node { ... }
class BlockStmtNode : public StmtNode {
public:
    std::vector<std::unique_ptr<ASTNode>> statements;

    BlockStmtNode(int line = 1, int column = 1) : StmtNode(line, column) {}
    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "BlockStmt"; }
};

// Function Declaration / Definition Node
class FunctionDeclNode : public ASTNode {
public:
    std::string returnType;
    std::string name;
    std::vector<std::unique_ptr<ParamNode>> parameters;
    std::unique_ptr<BlockStmtNode> body;
    bool isDefinition;
    int endLine;

    FunctionDeclNode(std::string returnType, std::string name,
                     std::vector<std::unique_ptr<ParamNode>> params,
                     std::unique_ptr<BlockStmtNode> body = nullptr,
                     bool isDef = true, int line = 1, int column = 1, int endLine = 1)
        : ASTNode(line, column), returnType(std::move(returnType)), name(std::move(name)),
          parameters(std::move(params)), body(std::move(body)),
          isDefinition(isDef), endLine(endLine) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "FunctionDecl: " + returnType + " " + name; }
    int getLOC() const { return (endLine >= line) ? (endLine - line + 1) : 1; }
};

// If Statement Node
class IfStmtNode : public StmtNode {
public:
    std::unique_ptr<ExprNode> condition;
    std::unique_ptr<ASTNode> thenBranch;
    std::unique_ptr<ASTNode> elseBranch;

    IfStmtNode(std::unique_ptr<ExprNode> cond, std::unique_ptr<ASTNode> thenBr,
               std::unique_ptr<ASTNode> elseBr = nullptr, int line = 1, int column = 1)
        : StmtNode(line, column), condition(std::move(cond)),
          thenBranch(std::move(thenBr)), elseBranch(std::move(elseBr)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "IfStmt"; }
};

// While Loop Node
class WhileStmtNode : public StmtNode {
public:
    std::unique_ptr<ExprNode> condition;
    std::unique_ptr<ASTNode> body;

    WhileStmtNode(std::unique_ptr<ExprNode> cond, std::unique_ptr<ASTNode> body,
                  int line = 1, int column = 1)
        : StmtNode(line, column), condition(std::move(cond)), body(std::move(body)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "WhileStmt"; }
};

// For Loop Node
class ForStmtNode : public StmtNode {
public:
    std::unique_ptr<ASTNode> init;
    std::unique_ptr<ExprNode> condition;
    std::unique_ptr<ExprNode> update;
    std::unique_ptr<ASTNode> body;

    ForStmtNode(std::unique_ptr<ASTNode> init, std::unique_ptr<ExprNode> cond,
                std::unique_ptr<ExprNode> upd, std::unique_ptr<ASTNode> body,
                int line = 1, int column = 1)
        : StmtNode(line, column), init(std::move(init)), condition(std::move(cond)),
          update(std::move(upd)), body(std::move(body)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "ForStmt"; }
};

// Return Statement Node
class ReturnStmtNode : public StmtNode {
public:
    std::unique_ptr<ExprNode> expression;

    ReturnStmtNode(std::unique_ptr<ExprNode> expr = nullptr, int line = 1, int column = 1)
        : StmtNode(line, column), expression(std::move(expr)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "ReturnStmt"; }
};

// Break Statement Node
class BreakStmtNode : public StmtNode {
public:
    BreakStmtNode(int line = 1, int column = 1) : StmtNode(line, column) {}
    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "BreakStmt"; }
};

// Continue Statement Node
class ContinueStmtNode : public StmtNode {
public:
    ContinueStmtNode(int line = 1, int column = 1) : StmtNode(line, column) {}
    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "ContinueStmt"; }
};

// Expression Statement Node (e.g. `foo();` or `x = y + 1;`)
class ExprStmtNode : public StmtNode {
public:
    std::unique_ptr<ExprNode> expression;

    ExprStmtNode(std::unique_ptr<ExprNode> expr, int line = 1, int column = 1)
        : StmtNode(line, column), expression(std::move(expr)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "ExprStmt"; }
};

// Binary Expression Node
class BinaryExprASTNode : public ExprNode {
public:
    std::unique_ptr<ExprNode> left;
    std::string op;
    std::unique_ptr<ExprNode> right;

    BinaryExprASTNode(std::unique_ptr<ExprNode> left, std::string op,
                      std::unique_ptr<ExprNode> right, int line = 1, int column = 1)
        : ExprNode(line, column), left(std::move(left)), op(std::move(op)), right(std::move(right)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "BinaryExpr (" + op + ")"; }
};

// Unary Expression Node
class UnaryExprASTNode : public ExprNode {
public:
    std::string op;
    std::unique_ptr<ExprNode> operand;
    bool isPrefix;

    UnaryExprASTNode(std::string op, std::unique_ptr<ExprNode> operand, bool isPrefix = true,
                     int line = 1, int column = 1)
        : ExprNode(line, column), op(std::move(op)), operand(std::move(operand)), isPrefix(isPrefix) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "UnaryExpr (" + op + ")"; }
};

// Literal Expression Node
class LiteralExprASTNode : public ExprNode {
public:
    std::string value;
    std::string literalType;

    LiteralExprASTNode(std::string value, std::string literalType, int line = 1, int column = 1)
        : ExprNode(line, column), value(std::move(value)), literalType(std::move(literalType)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "Literal: " + value + " [" + literalType + "]"; }
};

// Variable Reference Expression Node
class VariableExprASTNode : public ExprNode {
public:
    std::string name;

    VariableExprASTNode(std::string name, int line = 1, int column = 1)
        : ExprNode(line, column), name(std::move(name)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "Variable: " + name; }
};

// Function Call Expression Node
class CallExprASTNode : public ExprNode {
public:
    std::string callee;
    std::vector<std::unique_ptr<ExprNode>> arguments;

    CallExprASTNode(std::string callee, std::vector<std::unique_ptr<ExprNode>> args,
                    int line = 1, int column = 1)
        : ExprNode(line, column), callee(std::move(callee)), arguments(std::move(args)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "Call: " + callee + "()"; }
};

// Assignment Expression Node
class AssignExprASTNode : public ExprNode {
public:
    std::string varName;
    std::string op;
    std::unique_ptr<ExprNode> value;

    AssignExprASTNode(std::string varName, std::string op, std::unique_ptr<ExprNode> value,
                      int line = 1, int column = 1)
        : ExprNode(line, column), varName(std::move(varName)), op(std::move(op)), value(std::move(value)) {}

    void accept(ASTVisitor& visitor) override { visitor.visit(*this); }
    std::string toString() const override { return "Assign (" + op + ") to " + varName; }
};

// Utility function to print/dump AST
void dumpAST(const ASTNode* node, int indent = 0, std::ostream& os = std::cout);

#endif // AST_H
