#include "AST.h"

class ASTDumpVisitor : public ASTVisitor {
public:
    explicit ASTDumpVisitor(int indent = 0, std::ostream& os = std::cout)
        : indent_(indent), os_(os) {}

    void printIndent() const {
        for (int i = 0; i < indent_; ++i) os_ << "  ";
    }

    void visit(ProgramNode& node) override {
        printIndent();
        os_ << "Program (Line " << node.line << ")\n";
        indent_++;
        for (const auto& decl : node.declarations) {
            if (decl) decl->accept(*this);
        }
        indent_--;
    }

    void visit(TypeNode& node) override {
        printIndent();
        os_ << "Type: " << node.toString() << "\n";
    }

    void visit(VarDeclNode& node) override {
        printIndent();
        os_ << "VarDecl: " << (node.isConst ? "const " : "") << node.type << " " << node.name
            << " [Line " << node.line << ":" << node.column << "]\n";
        if (node.initializer) {
            indent_++;
            printIndent();
            os_ << "Init:\n";
            indent_++;
            node.initializer->accept(*this);
            indent_ -= 2;
        }
    }

    void visit(ParamNode& node) override {
        printIndent();
        os_ << "Param: " << node.type << " " << node.name << "\n";
    }

    void visit(FunctionDeclNode& node) override {
        printIndent();
        os_ << "FunctionDecl: " << node.returnType << " " << node.name
            << " (Lines " << node.line << "-" << node.endLine << ", LOC: " << node.getLOC() << ")\n";
        indent_++;
        if (!node.parameters.empty()) {
            printIndent();
            os_ << "Parameters:\n";
            indent_++;
            for (const auto& param : node.parameters) {
                if (param) param->accept(*this);
            }
            indent_--;
        }
        if (node.body) {
            printIndent();
            os_ << "Body:\n";
            indent_++;
            node.body->accept(*this);
            indent_--;
        }
        indent_--;
    }

    void visit(BlockStmtNode& node) override {
        printIndent();
        os_ << "BlockStmt [Line " << node.line << "]\n";
        indent_++;
        for (const auto& stmt : node.statements) {
            if (stmt) stmt->accept(*this);
        }
        indent_--;
    }

    void visit(IfStmtNode& node) override {
        printIndent();
        os_ << "IfStmt [Line " << node.line << "]\n";
        indent_++;
        printIndent();
        os_ << "Condition:\n";
        indent_++;
        if (node.condition) node.condition->accept(*this);
        indent_--;

        printIndent();
        os_ << "Then:\n";
        indent_++;
        if (node.thenBranch) node.thenBranch->accept(*this);
        indent_--;

        if (node.elseBranch) {
            printIndent();
            os_ << "Else:\n";
            indent_++;
            node.elseBranch->accept(*this);
            indent_--;
        }
        indent_--;
    }

    void visit(WhileStmtNode& node) override {
        printIndent();
        os_ << "WhileStmt [Line " << node.line << "]\n";
        indent_++;
        printIndent();
        os_ << "Condition:\n";
        indent_++;
        if (node.condition) node.condition->accept(*this);
        indent_--;

        printIndent();
        os_ << "Body:\n";
        indent_++;
        if (node.body) node.body->accept(*this);
        indent_--;
        indent_--;
    }

    void visit(ForStmtNode& node) override {
        printIndent();
        os_ << "ForStmt [Line " << node.line << "]\n";
        indent_++;
        if (node.init) {
            printIndent();
            os_ << "Init:\n";
            indent_++;
            node.init->accept(*this);
            indent_--;
        }
        if (node.condition) {
            printIndent();
            os_ << "Condition:\n";
            indent_++;
            node.condition->accept(*this);
            indent_--;
        }
        if (node.update) {
            printIndent();
            os_ << "Update:\n";
            indent_++;
            node.update->accept(*this);
            indent_--;
        }
        if (node.body) {
            printIndent();
            os_ << "Body:\n";
            indent_++;
            node.body->accept(*this);
            indent_--;
        }
        indent_--;
    }

    void visit(ReturnStmtNode& node) override {
        printIndent();
        os_ << "ReturnStmt [Line " << node.line << "]\n";
        if (node.expression) {
            indent_++;
            node.expression->accept(*this);
            indent_--;
        }
    }

    void visit(BreakStmtNode& node) override {
        printIndent();
        os_ << "BreakStmt [Line " << node.line << "]\n";
    }

    void visit(ContinueStmtNode& node) override {
        printIndent();
        os_ << "ContinueStmt [Line " << node.line << "]\n";
    }

    void visit(ExprStmtNode& node) override {
        printIndent();
        os_ << "ExprStmt [Line " << node.line << "]\n";
        if (node.expression) {
            indent_++;
            node.expression->accept(*this);
            indent_--;
        }
    }

    void visit(BinaryExprASTNode& node) override {
        printIndent();
        os_ << "BinaryExpr: " << node.op << " [Line " << node.line << "]\n";
        indent_++;
        if (node.left) node.left->accept(*this);
        if (node.right) node.right->accept(*this);
        indent_--;
    }

    void visit(UnaryExprASTNode& node) override {
        printIndent();
        os_ << "UnaryExpr: " << (node.isPrefix ? "prefix " : "postfix ") << node.op
            << " [Line " << node.line << "]\n";
        indent_++;
        if (node.operand) node.operand->accept(*this);
        indent_--;
    }

    void visit(LiteralExprASTNode& node) override {
        printIndent();
        os_ << "Literal: " << node.value << " (" << node.literalType << ")\n";
    }

    void visit(VariableExprASTNode& node) override {
        printIndent();
        os_ << "Variable: " << node.name << " [Line " << node.line << ":" << node.column << "]\n";
    }

    void visit(CallExprASTNode& node) override {
        printIndent();
        os_ << "Call: " << node.callee << " [Line " << node.line << "]\n";
        if (!node.arguments.empty()) {
            indent_++;
            printIndent();
            os_ << "Args:\n";
            indent_++;
            for (const auto& arg : node.arguments) {
                if (arg) arg->accept(*this);
            }
            indent_ -= 2;
        }
    }

    void visit(AssignExprASTNode& node) override {
        printIndent();
        os_ << "Assign: " << node.varName << " " << node.op << " [Line " << node.line << "]\n";
        if (node.value) {
            indent_++;
            node.value->accept(*this);
            indent_--;
        }
    }

private:
    int indent_;
    std::ostream& os_;
};

void dumpAST(const ASTNode* node, int indent, std::ostream& os) {
    if (!node) return;
    ASTDumpVisitor visitor(indent, os);
    const_cast<ASTNode*>(node)->accept(visitor);
}
