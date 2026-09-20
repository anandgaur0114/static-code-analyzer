import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('docs_diagrams', exist_ok=True)

# -------------------------------------------------------------
# 1. System Block Diagram
# -------------------------------------------------------------
def create_block_diagram():
    fig, ax = plt.subplots(figsize=(12, 7), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 7)
    ax.axis('off')

    # Title
    ax.text(6, 6.6, "Static Code Analyzer & Accuracy Scorer - System Architecture Block Diagram", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1e293b')

    # Styles
    box_style = dict(boxstyle='round,pad=0.5', facecolor='#f8fafc', edgecolor='#3b82f6', linewidth=2)
    highlight_style = dict(boxstyle='round,pad=0.5', facecolor='#eff6ff', edgecolor='#1d4ed8', linewidth=2)
    stage_style = dict(boxstyle='round,pad=0.5', facecolor='#f0fdf4', edgecolor='#16a34a', linewidth=2)
    score_style = dict(boxstyle='round,pad=0.5', facecolor='#fefce8', edgecolor='#ca8a04', linewidth=2)
    out_style = dict(boxstyle='round,pad=0.5', facecolor='#faf5ff', edgecolor='#9333ea', linewidth=2)

    # Blocks
    # 1. Input
    ax.text(1.5, 4.5, "Input Source\nCode\n(Interactive Stdin\nor .cpp File)", ha='center', va='center', 
            fontsize=10, fontweight='bold', bbox=box_style)

    # 2. Lexical Phase
    ax.text(4.2, 4.5, "1. Lexical Analyzer\n(Hand-written DFA)\nTokenization & Line/Col", ha='center', va='center', 
            fontsize=10, fontweight='bold', bbox=stage_style)

    # 3. Syntax Phase
    ax.text(7.2, 4.5, "2. Syntax Analyzer\n(Recursive Descent LL(1))\nGrammar & Precedence", ha='center', va='center', 
            fontsize=10, fontweight='bold', bbox=stage_style)

    # 4. AST
    ax.text(10.2, 4.5, "3. Abstract Syntax\nTree (AST)\nComposite Node Graph", ha='center', va='center', 
            fontsize=10, fontweight='bold', bbox=highlight_style)

    # 5. Semantic & Static Engine
    ax.text(7.2, 2.0, "4. Static Analysis Engine\n(AST Visitor Passes)\n* Scoped Symbol Table\n* Unused/Undeclared Check\n* Dead Code Eliminator\n* Nesting Depth Check", 
            ha='center', va='center', fontsize=9, fontweight='bold', bbox=stage_style)

    # 6. Complexity & Accuracy Engine
    ax.text(3.5, 2.0, "5. Software Metrics &\nAccuracy Scorer\n* McCabe Complexity V(G)\n* 0-100% Score Engine\n* Letter Grade Calibration", 
            ha='center', va='center', fontsize=9, fontweight='bold', bbox=score_style)

    # 7. Output Terminal Report
    ax.text(10.2, 2.0, "6. Terminal Report\nGenerator\n* ANSI Color Banners\n* Error Caret Pointers\n* Pass/Fail Evaluation", 
            ha='center', va='center', fontsize=9, fontweight='bold', bbox=out_style)

    # Arrows
    arrow_props = dict(arrowstyle='->', lw=2, color='#334155')
    
    # 1 -> 2
    ax.annotate('', xy=(3.0, 4.5), xytext=(2.3, 4.5), arrowprops=arrow_props)
    # 2 -> 3
    ax.annotate('', xy=(5.7, 4.5), xytext=(5.4, 4.5), arrowprops=arrow_props)
    # 3 -> 4
    ax.annotate('', xy=(8.9, 4.5), xytext=(8.7, 4.5), arrowprops=arrow_props)
    # 4 -> 5 (down & left)
    ax.annotate('', xy=(8.7, 2.3), xytext=(10.2, 3.8), arrowprops=arrow_props)
    # 5 -> 6 (left)
    ax.annotate('', xy=(5.2, 2.0), xytext=(5.7, 2.0), arrowprops=arrow_props)
    # 5 -> 7 (right)
    ax.annotate('', xy=(8.7, 2.0), xytext=(8.7, 2.0), arrowprops=arrow_props)
    ax.annotate('', xy=(9.0, 2.0), xytext=(8.7, 2.0), arrowprops=arrow_props)

    plt.tight_layout()
    plt.savefig('docs_diagrams/diagram_block.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Created docs_diagrams/diagram_block.png")


# -------------------------------------------------------------
# 2. UML Class Diagram
# -------------------------------------------------------------
def create_class_diagram():
    fig, ax = plt.subplots(figsize=(13, 9), dpi=300)
    ax.set_xlim(0, 13)
    ax.set_ylim(0, 9)
    ax.axis('off')

    ax.text(6.5, 8.6, "UML Class Diagram - Core Architecture & AST Visitor Hierarchy", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1e293b')

    c_box = dict(boxstyle='square,pad=0.5', facecolor='#ffffff', edgecolor='#0284c7', linewidth=1.8)
    i_box = dict(boxstyle='square,pad=0.5', facecolor='#f0f9ff', edgecolor='#0369a1', linewidth=1.8)

    # ASTNode (Base)
    ax.text(6.5, 7.3, "<<abstract>>\nASTNode\n---\n+ line: int\n+ column: int\n---\n+ accept(ASTVisitor&): void\n+ toString(): string", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # Derived categories
    ax.text(2.5, 5.5, "<<abstract>>\nExprNode\n---\n+ line: int\n+ col: int\n---\n+ accept(ASTVisitor&)", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    ax.text(6.5, 5.5, "<<abstract>>\nStmtNode\n---\n+ line: int\n+ col: int\n---\n+ accept(ASTVisitor&)", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    ax.text(10.5, 5.5, "FunctionDeclNode\n---\n+ name: string\n+ returnType: string\n+ params: vector<Param>\n+ body: BlockStmtNode*\n+ endLine: int\n---\n+ getLOC(): int", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # Concrete Expressions
    ax.text(1.5, 3.4, "BinaryExprASTNode\n---\n+ left: ExprNode*\n+ op: string\n+ right: ExprNode*", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    ax.text(3.8, 3.4, "VariableExprASTNode\n---\n+ name: string", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # Concrete Statements
    ax.text(6.0, 3.4, "IfStmtNode / LoopNode\n---\n+ condition: ExprNode*\n+ thenBranch: StmtNode*\n+ elseBranch: StmtNode*", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    ax.text(8.8, 3.4, "BlockStmtNode\n---\n+ statements: vector<Stmt*>", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # ASTVisitor Interface
    ax.text(10.8, 1.6, "<<interface>>\nASTVisitor\n---\n+ visit(ProgramNode&)\n+ visit(FunctionDeclNode&)\n+ visit(IfStmtNode&)\n+ visit(WhileStmtNode&)\n+ visit(VarDeclNode&)", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=i_box)

    # Analyzer
    ax.text(6.5, 1.6, "Analyzer : public ASTVisitor\n---\n- symbolTable: SymbolTable\n- currentComplexity: int\n- maxNesting: int\n---\n+ analyze(ProgramNode&): ReportData\n+ calculateAccuracy(): void", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # Lexer & Parser
    ax.text(1.8, 1.6, "Lexer\n---\n- source: string\n- cursor: int\n---\n+ tokenize(): vector<Token>\n+ nextToken(): Token", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    ax.text(4.0, 1.6, "Parser\n---\n- tokens: vector<Token>\n---\n+ parseProgram(): ProgramNode*\n+ synchronize(): void", 
            ha='center', va='center', fontsize=8, family='monospace', bbox=c_box)

    # Inheritance arrows
    arrow_inh = dict(arrowstyle='-|>', lw=1.5, color='#0284c7')
    ax.annotate('', xy=(6.5, 6.4), xytext=(2.5, 6.0), arrowprops=arrow_inh)
    ax.annotate('', xy=(6.5, 6.4), xytext=(6.5, 6.0), arrowprops=arrow_inh)
    ax.annotate('', xy=(6.5, 6.4), xytext=(10.5, 6.2), arrowprops=arrow_inh)

    ax.annotate('', xy=(2.5, 4.8), xytext=(1.5, 3.9), arrowprops=arrow_inh)
    ax.annotate('', xy=(2.5, 4.8), xytext=(3.8, 3.8), arrowprops=arrow_inh)
    ax.annotate('', xy=(6.5, 4.8), xytext=(6.0, 4.0), arrowprops=arrow_inh)
    ax.annotate('', xy=(6.5, 4.8), xytext=(8.8, 3.8), arrowprops=arrow_inh)

    # Realization arrow
    arrow_real = dict(arrowstyle='-|>', lw=1.5, color='#0369a1', linestyle='--')
    ax.annotate('', xy=(9.6, 1.6), xytext=(8.4, 1.6), arrowprops=arrow_real)

    plt.tight_layout()
    plt.savefig('docs_diagrams/diagram_class.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Created docs_diagrams/diagram_class.png")


# -------------------------------------------------------------
# 3. UML Sequence Diagram
# -------------------------------------------------------------
def create_sequence_diagram():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 12)
    ax.set_ylim(0, 9)
    ax.axis('off')

    ax.text(6, 8.6, "UML Sequence Diagram - Execution Flow & Dynamic Interaction", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1e293b')

    lifelines = ["User", "main()", "Lexer (DFA)", "Parser (LL1)", "AST", "Analyzer", "Reporter"]
    x_coords = [1.0, 2.5, 4.2, 5.9, 7.6, 9.3, 11.0]

    # Draw lifeline headers and vertical dashed lines
    for name, x in zip(lifelines, x_coords):
        ax.text(x, 8.0, name, ha='center', va='center', fontsize=9, fontweight='bold',
                bbox=dict(boxstyle='square,pad=0.3', facecolor='#f1f5f9', edgecolor='#475569', linewidth=1.5))
        ax.plot([x, x], [1.0, 7.6], color='#cbd5e1', linestyle='--', lw=1.2)

    # Messages
    steps = [
        (1.0, 2.5, 7.3, "1. Input C++ Code (Interactive / File)", False),
        (2.5, 4.2, 6.7, "2. tokenize()", False),
        (4.2, 2.5, 6.2, "3. return Token Stream", True),
        (2.5, 5.9, 5.6, "4. parseProgram(tokens)", False),
        (5.9, 7.6, 5.0, "5. build AST nodes", False),
        (5.9, 2.5, 4.4, "6. return ProgramNode AST", True),
        (2.5, 9.3, 3.8, "7. analyze(*ast)", False),
        (9.3, 7.6, 3.3, "8. accept(*visitor) traversal", False),
        (9.3, 9.3, 2.8, "9. compute McCabe Complexity & Accuracy", False),
        (9.3, 2.5, 2.3, "10. return AnalysisReportData", True),
        (2.5, 11.0, 1.7, "11. printConsole(reportData)", False),
        (11.0, 1.0, 1.2, "12. Output Accuracy Score & Issues to User", True)
    ]

    for x1, x2, y, msg, is_return in steps:
        style = '--' if is_return else '-'
        color = '#0284c7' if not is_return else '#059669'
        ax.annotate('', xy=(x2, y), xytext=(x1, y),
                    arrowprops=dict(arrowstyle='->', lw=1.4, color=color, linestyle=style))
        mid_x = (x1 + x2) / 2
        ax.text(mid_x, y + 0.15, msg, ha='center', va='bottom', fontsize=7.5, color='#0f172a')

    plt.tight_layout()
    plt.savefig('docs_diagrams/diagram_sequence.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Created docs_diagrams/diagram_sequence.png")


# -------------------------------------------------------------
# 4. UML Activity Diagram (Process Flowchart)
# -------------------------------------------------------------
def create_activity_diagram():
    fig, ax = plt.subplots(figsize=(10, 8), dpi=300)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')

    ax.text(5, 9.6, "UML Activity Diagram - Static Analysis Pipeline", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#1e293b')

    act_box = dict(boxstyle='round,pad=0.4', facecolor='#f8fafc', edgecolor='#0284c7', linewidth=1.6)
    dec_box = dict(boxstyle='round,pad=0.3', facecolor='#fef3c7', edgecolor='#d97706', linewidth=1.6)

    nodes = [
        (5.0, 8.9, "Start / Receive C++ Source Input"),
        (5.0, 7.8, "Lexical DFA: Scan Lexemes & Emit Tokens"),
        (5.0, 6.7, "Recursive Descent Parsing: Validate CFG Grammar"),
        (5.0, 5.6, "Generate Abstract Syntax Tree (AST)"),
        (5.0, 4.5, "AST Visitor: Populate Scoped Symbol Table"),
        (5.0, 3.4, "Semantic Checks: Undeclared, Unused, Dead Code"),
        (5.0, 2.3, "Evaluate McCabe Complexity & Accuracy Score"),
        (5.0, 1.2, "Render Terminal Diagnostics & Accuracy Report"),
        (5.0, 0.4, "End / Exit")
    ]

    for x, y, text in nodes:
        if "End" in text or "Start" in text:
            ax.text(x, y, text, ha='center', va='center', fontsize=9, fontweight='bold',
                    bbox=dict(boxstyle='round,pad=0.3', facecolor='#e2e8f0', edgecolor='#475569', linewidth=2))
        else:
            ax.text(x, y, text, ha='center', va='center', fontsize=8.5, bbox=act_box)

    for i in range(len(nodes) - 1):
        x1, y1, _ = nodes[i]
        x2, y2, _ = nodes[i+1]
        ax.annotate('', xy=(x2, y2 + 0.3), xytext=(x1, y1 - 0.3),
                    arrowprops=dict(arrowstyle='->', lw=1.5, color='#0284c7'))

    plt.tight_layout()
    plt.savefig('docs_diagrams/diagram_activity.png', dpi=300, bbox_inches='tight')
    plt.close()
    print("Created docs_diagrams/diagram_activity.png")

if __name__ == '__main__':
    create_block_diagram()
    create_class_diagram()
    create_sequence_diagram()
    create_activity_diagram()
