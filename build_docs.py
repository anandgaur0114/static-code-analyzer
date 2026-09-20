import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn
import os

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_heading_styled(doc, text, level=1, space_before=12, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.bold = True
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)
    elif level == 2:
        run.font.size = Pt(13.5)
        run.font.color.rgb = RGBColor(0x1e, 0x3a, 0x8a)
    elif level == 3:
        run.font.size = Pt(12)
        run.font.color.rgb = RGBColor(0x33, 0x41, 0x55)
    return p

def add_body_paragraph(doc, text, space_after=6, line_spacing=1.15):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = line_spacing
    run = p.add_run(text)
    run.font.name = 'Times New Roman'
    run.font.size = Pt(11.5)
    run.font.color.rgb = RGBColor(0x1e, 0x29, 0x3b)
    return p

def add_bullet_point(doc, title, body):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    r1 = p.add_run(title + ": ")
    r1.font.name = 'Times New Roman'
    r1.font.size = Pt(11.5)
    r1.bold = True
    r2 = p.add_run(body)
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(11.5)
    return p

def add_figure(doc, img_path, caption, width=Inches(6.0)):
    if os.path.exists(img_path):
        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_before = Pt(8)
        p_img.paragraph_format.space_after = Pt(4)
        run = p_img.add_run()
        run.add_picture(img_path, width=width)
        
        p_cap = doc.add_paragraph()
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.paragraph_format.space_after = Pt(12)
        r_cap = p_cap.add_run(caption)
        r_cap.font.name = 'Times New Roman'
        r_cap.font.size = Pt(10)
        r_cap.italic = True
        r_cap.font.color.rgb = RGBColor(0x47, 0x55, 0x69)
    else:
        print(f"Warning: Image not found: {img_path}")

# ==============================================================================
# BUILD PROJECT REPORT
# ==============================================================================
def build_project_report(output_path):
    print(f"Building {output_path}...")
    doc = docx.Document()
    
    # Page Margins
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.2)
        sec.right_margin = Inches(1.0)

    # -------------------------------------------------------------
    # 1. Cover Page
    # -------------------------------------------------------------
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("A\nProject Report\nOn\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    r_title = p.add_run("STATIC CODE ANALYZER & ACCURACY SCORER IN C++\n\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(16)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    r_sub = p.add_run("Submitted in partial fulfillment for the award of degree of\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)
    r_sub.italic = True

    r_deg = p.add_run("Bachelor of Technology\n")
    r_deg.font.name = 'Times New Roman'
    r_deg.font.size = Pt(13)
    r_deg.bold = True

    r_deg2 = p.add_run("Degree Of\n")
    r_deg2.font.name = 'Times New Roman'
    r_deg2.font.size = Pt(11.5)

    r_uni = p.add_run("Rajasthan Technical University, KOTA\n\n")
    r_uni.font.name = 'Times New Roman'
    r_uni.font.size = Pt(13)
    r_uni.bold = True

    # Logo
    logo_path = 'extracted_images/image3.png'
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(4)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.8))

    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(4)
    p_col.paragraph_format.space_after = Pt(14)
    r_jecrc = p_col.add_run("JAIPUR ENGINEERING COLLEGE AND RESEARCH CENTRE\n2026-2027\n")
    r_jecrc.font.name = 'Times New Roman'
    r_jecrc.font.size = Pt(13)
    r_jecrc.bold = True

    # 2-Column Table for Submitted By / Coordinator
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(3.2)

    cell_left = table.cell(0, 0)
    p_left = cell_left.paragraphs[0]
    p_left.paragraph_format.space_after = Pt(2)
    r = p_left.add_run("Submitted By:\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True
    r2 = p_left.add_run("Anand Gaur\n<Roll No.>\n3rd Year, B.Tech CSE (AI)\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(10.5)

    cell_right = table.cell(0, 1)
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_right.paragraph_format.space_after = Pt(2)
    r = p_right.add_run("ITS Coordinator (CC):\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True
    r2 = p_right.add_run("<Faculty Name>\n<Designation>\nDept. of CSE (AI)\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(10.5)

    # Department footer
    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(18)
    p_foot.paragraph_format.space_after = Pt(0)
    r_dept = p_foot.add_run(
        "DEPARTMENT OF\n"
        "COMPUTER SCIENCE & ENGINEERING (ARTIFICIAL INTELLIGENCE)\n"
        "JAIPUR ENGINEERING COLLEGE AND RESEARCH CENTRE\n"
        "Shri Ram ki Nangal, via Sitapura RIICO, Tonk Road, Sukhpuria, Bambala, Jaipur, Rajasthan\n"
    )
    r_dept.font.name = 'Times New Roman'
    r_dept.font.size = Pt(10)
    r_dept.bold = True

    doc.add_page_break()

    # -------------------------------------------------------------
    # 2. Table of Contents
    # -------------------------------------------------------------
    p_toc_title = doc.add_paragraph()
    p_toc_title.paragraph_format.space_before = Pt(12)
    p_toc_title.paragraph_format.space_after = Pt(16)
    p_toc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_toc = p_toc_title.add_run("TABLE OF CONTENTS")
    r_toc.font.name = 'Times New Roman'
    r_toc.font.size = Pt(16)
    r_toc.bold = True
    r_toc.underline = True

    toc_items = [
        ("1. Introduction", "1"),
        ("2. Objective", "2"),
        ("3. Methodology And Planning", "3"),
        ("4. Literature Review", "5"),
        ("5. Applications of the Project", "6"),
        ("6. Block Diagram", "7"),
        ("7. UML Diagrams", "8"),
        ("8. Screenshots", "10"),
        ("9. References", "13"),
        ("10. Approval of the Project", "14")
    ]

    toc_table = doc.add_table(rows=len(toc_items), cols=2)
    toc_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    toc_table.autofit = False
    toc_table.columns[0].width = Inches(5.2)
    toc_table.columns[1].width = Inches(1.0)

    for i, (topic, page_str) in enumerate(toc_items):
        c0 = toc_table.cell(i, 0)
        c1 = toc_table.cell(i, 1)
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_after = Pt(4)
        p0.paragraph_format.line_spacing = 1.15
        r0 = p0.add_run(topic)
        r0.font.name = 'Times New Roman'
        r0.font.size = Pt(11.5)
        
        dots = "." * max(10, int((5.0 - len(topic) * 0.08) * 12))
        r_dots = p0.add_run(f" {dots}")
        r_dots.font.name = 'Times New Roman'
        r_dots.font.size = Pt(10)
        r_dots.font.color.rgb = RGBColor(0x94, 0xa3, 0xb8)
        
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        p1.paragraph_format.space_after = Pt(4)
        r1 = p1.add_run(page_str)
        r1.font.name = 'Times New Roman'
        r1.font.size = Pt(11.5)

    doc.add_page_break()

    # -------------------------------------------------------------
    # Section 1: Introduction
    # -------------------------------------------------------------
    add_heading_styled(doc, "1. Introduction", level=1)
    add_body_paragraph(doc, 
        "In modern software engineering, software quality, code correctness, and algorithmic maintainability "
        "are paramount. While dynamic testing checks execution correctness for specific test vectors, it cannot "
        "exhaustively identify edge cases, unused memory structures, dead code paths, or architectural complexity. "
        "Static code analysis addresses this limitation by inspecting and verifying source code directly without execution, "
        "enforcing language grammars, semantic invariants, and structural best practices."
    )
    add_body_paragraph(doc, 
        "This project, titled 'Static Code Analyzer & Accuracy Scorer', develops a complete, production-grade command-line "
        "static analyzer written in pure standard C++17. Designed as an applied Compiler Design practical project, it implements "
        "the complete front-end and middle-end phases of compiler architecture from first principles without relying on third-party "
        "parser generators (such as Flex, Bison, or ANTLR) or external library dependencies (such as Boost)."
    )
    add_body_paragraph(doc, 
        "The system accepts C/C++ source code through interactive terminal prompts, shell pipes, or file inputs. It executes "
        "deterministic finite automaton (DFA) lexical analysis, LL(1) recursive descent syntax parsing, abstract syntax tree (AST) "
        "generation via the Composite and Visitor design patterns, scoped symbol table tracking, and multiple static analysis passes. "
        "Finally, it calculates an automated Code Accuracy & Quality Score (0% to 100%, Grade A+ to F) with an itemized deduction breakdown, "
        "rendering formatted diagnostic reports directly in the user's terminal."
    )

    # -------------------------------------------------------------
    # Section 2: Objective
    # -------------------------------------------------------------
    add_heading_styled(doc, "2. Objective", level=1)
    add_body_paragraph(doc, "The primary objectives of this project are:")
    add_bullet_point(doc, "1. Hand-Written DFA Lexical Tokenizer", 
                     "Implement an explicit state machine recognizing keywords, identifiers, numeric literals (integer/floating-point), string literals, compound operators (==, !=, <=, >=, &&, ||, ++, --), delimiters, and comments while tracking 1-indexed (line, column) coordinates.")
    add_bullet_point(doc, "2. Recursive Descent LL(1) Syntax Parser", 
                     "Construct a top-down parser that enforces Context-Free Grammar (CFG) rules for functions, variable declarations, control structures (if-else, while, for), and expressions using operator precedence climbing, featuring panic-mode error recovery.")
    add_bullet_point(doc, "3. Abstract Syntax Tree (AST) Hierarchy", 
                     "Establish a strongly typed node hierarchy utilizing modern C++ unique ownership pointers (std::unique_ptr) and the Visitor Design Pattern to decouple tree representation from analysis passes.")
    add_bullet_point(doc, "4. Scoped Symbol Table Management", 
                     "Engineer a stack of hash maps to manage lexical scoping, accurately distinguishing variable declarations, shadowing, and usages to detect unused variables and undeclared identifiers.")
    add_bullet_point(doc, "5. Control-Flow & Complexity Metrics", 
                     "Calculate McCabe's Cyclomatic Complexity V(G) = P + 1, measure maximum block nesting depth, detect long functions exceeding configurable LOC thresholds, and identify unreachable dead code after block terminators.")
    add_bullet_point(doc, "6. Calibrated Accuracy & Quality Scoring Engine", 
                     "Develop a quantifiable scoring engine starting at 100.0% with transparent deductions for syntax errors (-20%), semantic errors (-15%), dead code (-8%), unused variables (-5%), high nesting (-5%), and high complexity (-6%), mapping to letter grades A+ through F.")
    add_bullet_point(doc, "7. Pure Terminal Output Engine", 
                     "Deliver an interactive terminal experience supporting direct typing, stdin piping, and ANSI-highlighted diagnostics with exact line and column caret pointers.")

    # -------------------------------------------------------------
    # Section 3: Methodology And Planning
    # -------------------------------------------------------------
    add_heading_styled(doc, "3. Methodology And Planning", level=1)
    add_body_paragraph(doc, 
        "The project development adopted an iterative, compiler-driven engineering methodology divided into four structured phases:"
    )

    add_heading_styled(doc, "Phase 1 - Lexical Engineering & DFA Construction", level=2)
    add_body_paragraph(doc, 
        "Designed the lexical specification for C/C++ tokens in Token.h and Lexer.h. Formulated a hand-written DFA state machine "
        "in Lexer.cpp handling states START, IN_IDENTIFIER, IN_NUMBER, IN_STRING, IN_CHAR, IN_SLASH, and comment handlers. "
        "Implemented the maximal-munch rule to prioritize compound operators (e.g. '++' over '+') and engineered coordinate tracking "
        "to record the exact line number and column offset for every emitted token."
    )

    add_heading_styled(doc, "Phase 2 - Context-Free Grammar & Recursive Descent Parser", level=2)
    add_body_paragraph(doc, 
        "Formulated the grammar productions for declarations, statements, and expressions. Implemented Parser.cpp using recursive descent. "
        "To prevent left recursion and maintain proper operator associativity, layered precedence climbing was designed "
        "(Primary < Postfix < Unary < Multiplicative < Additive < Relational < Equality < Logical AND < Logical OR < Assignment). "
        "Constructed an AST node hierarchy in AST.h rooted at ASTNode with unique pointer tree ownership. Implemented panic-mode "
        "synchronization on statement delimiters (';', '}') to prevent cascading syntax aborts."
    )

    add_heading_styled(doc, "Phase 3 - Scoped Symbol Table & Static Analysis Passes", level=2)
    add_body_paragraph(doc, 
        "Constructed SymbolTable.cpp implementing lexical environments via std::vector<std::unordered_map<std::string, SymbolInfo>>. "
        "Pushed scopes upon entering blocks and popped on exit, flagging unreferenced variables. Implemented the ASTVisitor interface "
        "in Analyzer.cpp to compute McCabe Cyclomatic Complexity V(G) = P + 1 (counting if, while, for, &&, || predicate points), "
        "evaluate dynamic control-flow nesting depth, inspect statement sequences for dead code following return/break, and verify "
        "function line-count thresholds."
    )

    add_heading_styled(doc, "Phase 4 - Accuracy Scoring Engine & Interactive CLI", level=2)
    add_body_paragraph(doc, 
        "Formulated the mathematical scoring formula subtracting calibrated penalties from 100.0%. Developed an interactive input reader "
        "in main.cpp supporting terminal keyboard entry terminated by 'END' or Ctrl+Z, standard input pipes (cat/Get-Content), and file paths. "
        "Constructed ReportGenerator in Report.cpp to render colored ANSI banners, risk assessment tables, itemized deduction lists, "
        "and source code line pointers."
    )

    # -------------------------------------------------------------
    # Section 4: Literature Review
    # -------------------------------------------------------------
    add_heading_styled(doc, "4. Literature Review", level=1)
    add_body_paragraph(doc, 
        "Static code analysis and compiler front-end architectures have a deep theoretical foundation in computer science:"
    )
    add_bullet_point(doc, "Formal Grammars and Automata (Hopcroft et al., 2006)", 
                     "Chomsky's hierarchy classifies programming language lexicons as Regular Grammars recognized by Deterministic Finite Automata (DFA), whereas syntax structures require Context-Free Grammars (CFG) recognized by Pushdown Automata. Our tokenizer applies DFA state transition matrices to guarantee O(N) linear-time scanning.")
    add_bullet_point(doc, "Top-Down LL(1) Parsing (Aho, Lam, Sethi, & Ullman, 'Dragon Book', 2006)", 
                     "The Dragon Book establishes that recursive descent parsers evaluate LL(1) grammars efficiently without backtracking by utilizing 1-token lookaheads. Precedence climbing provides deterministic operator resolution while panic-mode error recovery ensures compiler survivability across multiple syntax faults.")
    add_bullet_point(doc, "Software Complexity Measurement (Thomas J. McCabe, IEEE TSE, 1976)", 
                     "McCabe introduced Cyclomatic Complexity V(G) = E - N + 2P based on graph theory, where E is edges, N is vertices, and P is connected components. For structured single-entry single-exit functions, this equals P + 1 (predicate decision nodes). Empirical studies show functions with V(G) > 10 exhibit exponentially higher defect densities and testing costs.")
    add_bullet_point(doc, "Static Analysis Paradigms (Chess & McGraw, 2004)", 
                     "Static analysis detects security vulnerabilities (buffer overflows, uninitialized memory) and code smells early in the development lifecycle (Shift-Left principle). In-memory AST visitor passes provide efficient syntactic and semantic property verification without execution overhead.")

    # -------------------------------------------------------------
    # Section 5: Applications of the Project
    # -------------------------------------------------------------
    add_heading_styled(doc, "5. Applications of the Project", level=1)
    add_bullet_point(doc, "1. Automated Academic Lab Grading & Assessment", 
                     "Universities and coding platforms can utilize the analyzer to automatically grade student programming assignments, penalizing dead code, undeclared variables, high complexity, and deeply nested loops while generating a transparent 0-100% Accuracy Score.")
    add_bullet_point(doc, "2. Continuous Integration (CI/CD) Pre-Commit Quality Gates", 
                     "The analyzer executable can be integrated into Git pre-commit hooks or GitHub Actions pipelines to block commits that introduce excessive cyclomatic complexity or dead code.")
    add_bullet_point(doc, "3. Safety-Critical & Embedded Software Auditing", 
                     "Safety standards (such as MISRA C/C++ and ISO 26262) mandate strict upper bounds on nesting depth, function length, and cyclomatic complexity to guarantee testability and predictable stack usage.")
    add_bullet_point(doc, "4. Pedagogical Compiler Design Demonstrator", 
                     "The modular separation between DFA lexing, LL(1) parsing, AST construction, and symbol table resolution serves as an educational model for compiler design coursework.")

    # -------------------------------------------------------------
    # Section 6: Block Diagram
    # -------------------------------------------------------------
    add_heading_styled(doc, "6. Block Diagram", level=1)
    add_body_paragraph(doc, 
        "The system architecture follows a decoupled, sequential pipelining model. Source code enters through the "
        "input handler, undergoes lexical tokenization, syntax analysis, AST generation, semantic validation, "
        "and metric scoring before the terminal report is emitted."
    )
    add_figure(doc, 'docs_diagrams/diagram_block.png', 
               "Figure 6.1: High-Level System Architecture and Component Interfacing Block Diagram", 
               width=Inches(6.2))

    # -------------------------------------------------------------
    # Section 7: UML Diagrams
    # -------------------------------------------------------------
    add_heading_styled(doc, "7. UML Diagrams", level=1)
    
    add_heading_styled(doc, "7.1 UML Class Diagram", level=2)
    add_body_paragraph(doc, 
        "The UML Class Diagram illustrates the object-oriented design of the AST hierarchy, the Visitor pattern "
        "implementation, and the core operational classes (Lexer, Parser, SymbolTable, Analyzer, ReportGenerator)."
    )
    add_figure(doc, 'docs_diagrams/diagram_class.png', 
               "Figure 7.1: UML Class Diagram Representing AST Nodes and Visitor Design Pattern", 
               width=Inches(6.2))

    add_heading_styled(doc, "7.2 UML Sequence Diagram", level=2)
    add_body_paragraph(doc, 
        "The UML Sequence Diagram models the dynamic interaction between objects across time, tracking message flow "
        "from user input down through tokenization, parsing, traversal, and terminal reporting."
    )
    add_figure(doc, 'docs_diagrams/diagram_sequence.png', 
               "Figure 7.2: UML Sequence Diagram Illustrating Runtime Execution Pipeline", 
               width=Inches(6.2))

    add_heading_styled(doc, "7.3 UML Activity Diagram", level=2)
    add_body_paragraph(doc, 
        "The UML Activity Diagram outlines the control-flow state transitions of the static analysis engine from initialization "
        "to final quality rating calculation."
    )
    add_figure(doc, 'docs_diagrams/diagram_activity.png', 
               "Figure 7.3: UML Activity Diagram Depicting Step-by-Step Analysis Workflow", 
               width=Inches(5.6))

    # -------------------------------------------------------------
    # Section 8: Screenshots
    # -------------------------------------------------------------
    add_heading_styled(doc, "8. Screenshots", level=1)
    add_body_paragraph(doc, 
        "The following screenshots document the actual runtime execution of the Static Code Analyzer in the Windows PowerShell "
        "environment, demonstrating interactive code input, accuracy evaluation, function metrics calculation, and diagnostic reports."
    )

    img_shot1 = 'C:/Users/HP/.gemini/antigravity/brain/b48756ac-1d97-442e-a84e-117e54f8f241/.user_uploaded/media_1789887653292.png'
    add_figure(doc, img_shot1, 
               "Figure 8.1: Live Terminal Execution - Interactive C++ Code Input via PowerShell Pipeline", 
               width=Inches(5.8))
    add_body_paragraph(doc, 
        "Figure 8.1 illustrates the interactive input mechanism. The user pipes C++ source code directly into the analyzer executable. "
        "The program reads the multi-line input buffer and passes it into the compiler front-end pipeline without requiring a physical file."
    )

    img_shot2 = 'C:/Users/HP/.gemini/antigravity/brain/b48756ac-1d97-442e-a84e-117e54f8f241/.user_uploaded/media_1789887653237.png'
    add_figure(doc, img_shot2, 
               "Figure 8.2: Static Code Analyzer & Accuracy Report Header (100% Accuracy Score, Grade A+)", 
               width=Inches(5.8))
    add_body_paragraph(doc, 
        "Figure 8.2 demonstrates the Accuracy & Quality Assessment output for clean code. The system evaluated the input code, "
        "awarded a 100.0% Accuracy Score (Grade A+), and confirmed zero syntax, semantic, or structural violations."
    )

    img_shot3 = 'C:/Users/HP/.gemini/antigravity/brain/b48756ac-1d97-442e-a84e-117e54f8f241/.user_uploaded/media_1789887660975.png'
    add_figure(doc, img_shot3, 
               "Figure 8.3: Function Metrics Table, McCabe Cyclomatic Complexity, and Final Passed Status", 
               width=Inches(5.8))
    add_body_paragraph(doc, 
        "Figure 8.3 shows the per-function complexity metrics table. Each function's line span, LOC, maximum control flow nesting depth, "
        "McCabe cyclomatic complexity, and risk level are tabulated, followed by the final clean pass status."
    )

    # -------------------------------------------------------------
    # Section 9: References
    # -------------------------------------------------------------
    add_heading_styled(doc, "9. References", level=1)
    refs = [
        "Aho, A. V., Lam, M. S., Sethi, R., & Ullman, J. D. (2006). Compilers: Principles, Techniques, and Tools (2nd ed.). Addison-Wesley (The Dragon Book).",
        "McCabe, T. J. (1976). A Complexity Measure. IEEE Transactions on Software Engineering, SE-2(4), 308-320.",
        "Hopcroft, J. E., Motwani, R., & Ullman, J. D. (2006). Introduction to Automata Theory, Languages, and Computation (3rd ed.). Pearson.",
        "Stroustrup, B. (2018). A Tour of C++ (2nd ed.). Addison-Wesley Professional.",
        "Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). Design Patterns: Elements of Reusable Object-Oriented Software. Addison-Wesley.",
        "ISO/IEC 14882:2017. (2017). Programming Languages - C++ (Standard C++17). International Organization for Standardization.",
        "Chess, B., & McGraw, G. (2004). Static Analysis for Security. IEEE Security & Privacy, 2(6), 76-79.",
        "MISRA C++:2008. (2008). Guidelines for the Use of the C++ Language in Critical Systems. Motor Industry Software Reliability Association."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.paragraph_format.space_after = Pt(6)
        p_ref.paragraph_format.left_indent = Inches(0.4)
        p_ref.paragraph_format.first_line_indent = Inches(-0.4)
        r_run = p_ref.add_run(r)
        r_run.font.name = 'Times New Roman'
        r_run.font.size = Pt(10.5)

    # -------------------------------------------------------------
    # Section 10: Approval of the Project
    # -------------------------------------------------------------
    add_heading_styled(doc, "10. Approval of the Project", level=1)
    add_body_paragraph(doc, 
        "This is to certify that the project report entitled 'STATIC CODE ANALYZER & ACCURACY SCORER IN C++' submitted by "
        "Anand Gaur (Roll No: <Roll No.>) in partial fulfillment of the requirements for the award of the degree of Bachelor of Technology "
        "in Computer Science & Engineering (Artificial Intelligence) of Rajasthan Technical University, Kota, is an authentic work carried out "
        "under my guidance and supervision at Jaipur Engineering College and Research Centre, Jaipur."
    )
    add_body_paragraph(doc, 
        "To the best of my knowledge, the matter embodied in this report has not been submitted to any other University / Institute "
        "for the award of any degree or diploma."
    )

    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(36)
    p_sig.paragraph_format.space_after = Pt(2)
    
    sig_table = doc.add_table(rows=1, cols=2)
    sig_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    sig_table.autofit = False
    sig_table.columns[0].width = Inches(3.2)
    sig_table.columns[1].width = Inches(3.2)

    c_sig1 = sig_table.cell(0, 0)
    p1 = c_sig1.paragraphs[0]
    p1.add_run("____________________________\nSignature of Candidate\nAnand Gaur\nRoll No: <Roll No.>")
    p1.runs[0].font.name = 'Times New Roman'
    p1.runs[0].font.size = Pt(11)
    p1.runs[0].bold = True

    c_sig2 = sig_table.cell(0, 1)
    p2 = c_sig2.paragraphs[0]
    p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p2.add_run("____________________________\nSignature of Faculty Coordinator\n<Faculty Name>\n<Designation>, CSE (AI)")
    p2.runs[0].font.name = 'Times New Roman'
    p2.runs[0].font.size = Pt(11)
    p2.runs[0].bold = True

    doc.save(output_path)
    print(f"Successfully generated: {output_path}")


# ==============================================================================
# BUILD PROJECT SYNOPSIS
# ==============================================================================
def build_project_synopsis(output_path):
    print(f"Building {output_path}...")
    doc = docx.Document()
    
    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.2)
        sec.right_margin = Inches(1.0)

    # 1. Cover Page
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    r = p.add_run("A\nProject\nSYNOPSIS\nOf\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(14)
    r.bold = True

    r_title = p.add_run("STATIC CODE ANALYZER & ACCURACY SCORER IN C++\n\n")
    r_title.font.name = 'Times New Roman'
    r_title.font.size = Pt(16)
    r_title.bold = True
    r_title.font.color.rgb = RGBColor(0x0f, 0x17, 0x2a)

    r_sub = p.add_run("Submitted in partial fulfillment for the award of degree of\n")
    r_sub.font.name = 'Times New Roman'
    r_sub.font.size = Pt(12)
    r_sub.italic = True

    r_deg = p.add_run("Bachelor of Technology\n")
    r_deg.font.name = 'Times New Roman'
    r_deg.font.size = Pt(13)
    r_deg.bold = True

    r_deg2 = p.add_run("Degree Of\n")
    r_deg2.font.name = 'Times New Roman'
    r_deg2.font.size = Pt(11.5)

    r_uni = p.add_run("Rajasthan Technical University, KOTA\n\n")
    r_uni.font.name = 'Times New Roman'
    r_uni.font.size = Pt(13)
    r_uni.bold = True

    logo_path = 'extracted_images/image3.png'
    if os.path.exists(logo_path):
        p_logo = doc.add_paragraph()
        p_logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_logo.paragraph_format.space_before = Pt(0)
        p_logo.paragraph_format.space_after = Pt(4)
        run_logo = p_logo.add_run()
        run_logo.add_picture(logo_path, width=Inches(1.8))

    p_col = doc.add_paragraph()
    p_col.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_col.paragraph_format.space_before = Pt(4)
    p_col.paragraph_format.space_after = Pt(14)
    r_jecrc = p_col.add_run("JAIPUR ENGINEERING COLLEGE AND RESEARCH CENTRE\n2026-2027\n")
    r_jecrc.font.name = 'Times New Roman'
    r_jecrc.font.size = Pt(13)
    r_jecrc.bold = True

    # 2-Column Table for Submitted By / Coordinator
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    table.columns[0].width = Inches(3.2)
    table.columns[1].width = Inches(3.2)

    cell_left = table.cell(0, 0)
    p_left = cell_left.paragraphs[0]
    p_left.paragraph_format.space_after = Pt(2)
    r = p_left.add_run("Submitted By:\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True
    r2 = p_left.add_run("Anand Gaur\n<Roll No.>\n3rd Year, B.Tech CSE (AI)\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(10.5)

    cell_right = table.cell(0, 1)
    p_right = cell_right.paragraphs[0]
    p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_right.paragraph_format.space_after = Pt(2)
    r = p_right.add_run("ITS Coordinator (CC):\n")
    r.font.name = 'Times New Roman'
    r.font.size = Pt(11)
    r.bold = True
    r2 = p_right.add_run("<Faculty Name>\n<Designation>\nDept. of CSE (AI)\n")
    r2.font.name = 'Times New Roman'
    r2.font.size = Pt(10.5)

    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(18)
    p_foot.paragraph_format.space_after = Pt(0)
    r_dept = p_foot.add_run(
        "DEPARTMENT OF\n"
        "COMPUTER SCIENCE & ENGINEERING (ARTIFICIAL INTELLIGENCE)\n"
        "JAIPUR ENGINEERING COLLEGE AND RESEARCH CENTRE\n"
        "Shri Ram ki Nangal, via Sitapura RIICO, Tonk Road, Sukhpuria, Bambala, Jaipur, Rajasthan\n"
    )
    r_dept.font.name = 'Times New Roman'
    r_dept.font.size = Pt(10)
    r_dept.bold = True

    doc.add_page_break()

    # 2. ABSTRACT
    p_abs_title = doc.add_paragraph()
    p_abs_title.paragraph_format.space_before = Pt(16)
    p_abs_title.paragraph_format.space_after = Pt(14)
    p_abs_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_abs = p_abs_title.add_run("ABSTRACT")
    r_abs.font.name = 'Times New Roman'
    r_abs.font.size = Pt(16)
    r_abs.bold = True
    r_abs.underline = True

    add_body_paragraph(doc, 
        "Static code analysis is a crucial discipline in compiler design and software engineering that inspects source "
        "code without dynamic execution to evaluate correctness, detect logical anti-patterns, and measure algorithmic complexity. "
        "This project presents a robust, standalone Static Code Analyzer and Accuracy Scoring System implemented in pure C++17. "
        "The system embodies classical compiler construction principles by engineering a hand-written Deterministic Finite Automaton (DFA) "
        "for lexical tokenization, an LL(1) Recursive Descent parser for Context-Free Grammar (CFG) analysis, and an Abstract Syntax Tree (AST) "
        "using the Visitor pattern."
    )
    add_body_paragraph(doc, 
        "The middle-end features a scoped symbol table that evaluates lexical environments to catch unused variables and undeclared identifiers. "
        "Static analysis passes calculate McCabe's Cyclomatic Complexity (V(G) = P + 1), track control-flow nesting depth, and detect dead / unreachable "
        "code after block terminators. The system computes a calibrated Code Accuracy Score (0% to 100%, Grade A+ to F) with an itemized deduction "
        "breakdown. Supporting direct interactive typing, standard input pipes, and file inputs, the tool delivers ANSI-formatted diagnostics "
        "and line caret pointers directly in the terminal with zero external dependencies."
    )

    doc.add_page_break()

    # 3. INTRODUCTION
    p_intro_title = doc.add_paragraph()
    p_intro_title.paragraph_format.space_before = Pt(16)
    p_intro_title.paragraph_format.space_after = Pt(14)
    p_intro_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_intro = p_intro_title.add_run("INTRODUCTION")
    r_intro.font.name = 'Times New Roman'
    r_intro.font.size = Pt(16)
    r_intro.bold = True
    r_intro.underline = True

    add_bullet_point(doc, "Problem Statement", 
                     "Standard software testing relies on dynamic execution test cases, which fail to detect unexercised code paths, memory leaks, unreachable dead code, and cyclomatic complexity bloat. Developers need early, automated feedback on code correctness and structural health directly in their command-line workflow.")
    add_bullet_point(doc, "Scope of the Project", 
                     "The project encompasses a complete compiler front-end and static checking engine for C/C++ source code, featuring DFA tokenization, LL(1) recursive descent grammar verification, scoped symbol table tracking, and an automated accuracy scoring model.")
    add_bullet_point(doc, "Technologies Used", 
                     "Pure Standard C++17 (STL), CMake build system, MinGW GCC toolchain, and Git version control, completely independent of external parser generators or third-party libraries.")
    add_bullet_point(doc, "Methodology", 
                     "Component-driven engineering organized into four phases: (1) DFA lexical tokenizer, (2) Recursive descent LL(1) parser with precedence climbing, (3) AST Visitor static analysis passes, and (4) Accuracy scoring and terminal diagnostics.")
    add_bullet_point(doc, "Expected Outcome", 
                     "A high-performance command-line tool capable of ingesting C/C++ code, diagnosing syntax/semantic faults with exact coordinate pointers, evaluating McCabe complexity, and calculating an accurate 0-100% quality grade.")
    add_bullet_point(doc, "Applications of Project", 
                     "Academic programming evaluation, CI/CD automated code reviews, safety-critical software compliance checks, and pedagogical compiler demonstrations.")

    doc.add_page_break()

    # 4. CONCLUSIONS AND FUTURE ENHANCEMENTS
    p_conc_title = doc.add_paragraph()
    p_conc_title.paragraph_format.space_before = Pt(16)
    p_conc_title.paragraph_format.space_after = Pt(14)
    p_conc_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_conc = p_conc_title.add_run("CONCLUSIONS AND FUTURE ENHANCEMENTS")
    r_conc.font.name = 'Times New Roman'
    r_conc.font.size = Pt(16)
    r_conc.bold = True
    r_conc.underline = True

    add_heading_styled(doc, "Conclusions", level=2)
    add_body_paragraph(doc, 
        "The developed C++ Static Code Analyzer successfully realizes the foundational theories of Compiler Design—lexical analysis, "
        "syntax analysis, and semantic checking—into an industry-applicable software quality auditing tool. By eliminating external parser "
        "generators, the project demonstrates mastery over DFA state transitions, LL(1) parsing, operator precedence climbing, and AST "
        "visitor patterns. The integration of McCabe's Cyclomatic Complexity and a transparent accuracy deduction scoring formula provides "
        "an objective, quantifiable assessment of source code quality."
    )

    add_heading_styled(doc, "Future Enhancements", level=2)
    add_bullet_point(doc, "1. Dataflow & Taint Analysis", 
                     "Extend the AST passes to perform intra-procedural dataflow analysis (e.g., reaching definitions, live variable analysis) to catch null pointer dereferences and uninitialized memory reads.")
    add_bullet_point(doc, "2. Modern Language Server Protocol (LSP)", 
                     "Wrap the core analyzer into an LSP daemon compatible with Visual Studio Code, Cursor, and Neovim for real-time in-editor linting.")
    add_bullet_point(doc, "3. LLVM / Clang AST Frontend Integration", 
                     "Provide an optional LLVM Clang frontend ingestion mode to support full C++20/C++23 template metaprogramming and concepts.")

    add_heading_styled(doc, "Reference Screenshots", level=2)
    img_shot1 = 'C:/Users/HP/.gemini/antigravity/brain/b48756ac-1d97-442e-a84e-117e54f8f241/.user_uploaded/media_1789887653292.png'
    add_figure(doc, img_shot1, "Figure: Interactive Pipeline Code Execution & Real-Time Terminal Analysis", width=Inches(5.4))

    doc.add_page_break()

    # 5. REFERENCES
    p_ref_title = doc.add_paragraph()
    p_ref_title.paragraph_format.space_before = Pt(16)
    p_ref_title.paragraph_format.space_after = Pt(14)
    p_ref_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_ref = p_ref_title.add_run("References")
    r_ref.font.name = 'Times New Roman'
    r_ref.font.size = Pt(16)
    r_ref.bold = True
    r_ref.underline = True

    refs = [
        "Aho, A. V., Lam, M. S., Sethi, R., & Ullman, J. D. (2006). Compilers: Principles, Techniques, and Tools (2nd ed.). Addison-Wesley.",
        "McCabe, T. J. (1976). A Complexity Measure. IEEE Transactions on Software Engineering, SE-2(4), 308-320.",
        "Hopcroft, J. E., Motwani, R., & Ullman, J. D. (2006). Introduction to Automata Theory, Languages, and Computation (3rd ed.). Pearson.",
        "Stroustrup, B. (2018). A Tour of C++ (2nd ed.). Addison-Wesley Professional.",
        "ISO/IEC 14882:2017. (2017). Programming Languages - C++ (Standard C++17). International Organization for Standardization."
    ]
    for r in refs:
        p_r = doc.add_paragraph()
        p_r.paragraph_format.space_after = Pt(6)
        p_r.paragraph_format.left_indent = Inches(0.4)
        p_r.paragraph_format.first_line_indent = Inches(-0.4)
        run = p_r.add_run(r)
        run.font.name = 'Times New Roman'
        run.font.size = Pt(11)

    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == '__main__':
    build_project_report('C:/Users/HP/Desktop/CD/PROJECT_REPORT.docx')
    build_project_report('C:/Users/HP/Desktop/PROJECT_REPORT.docx')
    build_project_synopsis('C:/Users/HP/Desktop/CD/PROJECT_SYNOPSIS.docx')
    build_project_synopsis('C:/Users/HP/Desktop/PROJECT_SYNOPSIS.docx')
