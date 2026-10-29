/**
 * app.js - UI Controller & Application Orchestrator
 * Connects Lexer, Parser, and Analyzer to the Interactive Web Interface
 */

// ============================================================================
// Sample Code Presets
// ============================================================================
const CODE_PRESETS = {
    clean: `// ============================================================================
// Sample Test File: clean_code.cpp
// Purpose: Clean, idiomatic C++ code adhering to static analysis standards:
//          - All declared variables are used
//          - All identifiers are properly declared
//          - No dead or unreachable code
//          - Cyclomatic complexity is low and functions are modular
// ============================================================================

int square(int val) {
    return val * val;
}

int absoluteValue(int num) {
    if (num < 0) {
        return -num;
    }
    return num;
}

int computeFactorial(int n) {
    int result = 1;
    for (int i = 1; i <= n; i++) {
        result *= i;
    }
    return result;
}

int clamp(int value, int minVal, int maxVal) {
    if (value < minVal) {
        return minVal;
    }
    if (value > maxVal) {
        return maxVal;
    }
    return value;
}

int main() {
    int inputVal = 5;
    int squared = square(inputVal);
    int fact = computeFactorial(inputVal);
    int clamped = clamp(squared, 0, 100);

    int finalResult = clamped + fact;
    return finalResult;
}`,

    issues: `// ============================================================================
// Sample Test File: test_issues.cpp
// Purpose: Intentionally contains multiple compiler and static analysis issues:
//          1. Unused variables (-5% each)
//          2. Undeclared variable usage (-15% each)
//          3. Unreachable dead code after return (-8% each)
//          4. Deep control flow nesting (> 4 levels, -5% each)
//          5. Function length exceeding threshold (> 50 LOC, -4%)
//          6. High cyclomatic complexity (> 10, -6%)
// ============================================================================

int calculateSum(int a, int b) {
    int unusedLocal = 100; // Issue: Unused variable
    int result = a + b;
    return result;

    // Issue: Unreachable / Dead code after return
    int deadVariable = 999;
    deadVariable = deadVariable + 1;
}

void triggerUndeclared() {
    int validVar = 10;
    validVar = validVar + 5;
    
    // Issue: Undeclared variable 'undeclaredIdentifier'
    undeclaredIdentifier = 500;
}

void deepNestingExample(int x) {
    // Issue: Nesting depth exceeds 4 levels
    if (x > 0) {
        if (x > 10) {
            while (x < 100) {
                if (x % 2 == 0) {
                    for (int i = 0; i < 5; i++) {
                        int deepValue = x * 2;
                        deepValue = deepValue + i;
                    }
                }
                x++;
            }
        }
    }
}

// Issue: Function exceeds 50 lines of code (LOC)
// Issue: High Cyclomatic Complexity (> 10)
int complexAndLongFunction(int mode, int flag, int count) {
    int total = 0;
    int unusedMetric = -1; // Issue: Unused variable

    if (mode == 1) {
        total += 10;
    } else if (mode == 2) {
        total += 20;
    } else if (mode == 3) {
        total += 30;
    } else {
        total += 5;
    }

    if (flag && count > 0) {
        total += count;
    } else if (!flag || count < 0) {
        total -= count;
    }

    for (int i = 0; i < 10; i++) {
        if (i % 2 == 0) {
            total += 2;
        } else {
            total += 1;
        }
    }

    while (count > 0) {
        if (count % 3 == 0) {
            total += 3;
        }
        count--;
    }

    // Padding lines to exceed LOC threshold (> 50 LOC)
    total += 1;
    total += 2;
    total += 3;
    total += 4;
    total += 5;
    total += 6;
    total += 7;
    total += 8;
    total += 9;
    total += 10;
    total += 11;
    total += 12;
    total += 13;
    total += 14;
    total += 15;
    total += 16;
    total += 17;
    total += 18;
    total += 19;
    total += 20;

    return total;
}

int main() {
    int sum = calculateSum(5, 10);
    triggerUndeclared();
    deepNestingExample(15);
    int complexResult = complexAndLongFunction(1, 2, sum);
    return 0;
}`,

    complex: `// ============================================================================
// Sample Test File: complex_logic.cpp
// Purpose: Demonstrates McCabe's Cyclomatic Complexity calculation:
//          Formula: V(G) = P + 1 (where P = count of decision points:
//          if, while, for, &&, ||)
// ============================================================================

int evaluateConditions(int a, int b, int c, int d) {
    int score = 0;

    // Decision 1 & 2: if with logical AND (+2)
    if (a > 10 && b < 20) {
        score += 10;
    }

    // Decision 3 & 4: if with logical OR (+2)
    if (c == 0 || d == 0) {
        score += 5;
    }

    // Decision 5: while loop (+1)
    while (a > 0) {
        // Decision 6: nested if (+1)
        if (a % 3 == 0) {
            score += 2;
        }
        a--;
    }

    // Decision 7: for loop (+1)
    for (int i = 0; i < 5; i++) {
        // Decision 8: nested if (+1)
        if (i == b) {
            score += i;
        }
    }

    return score;
}

int main() {
    int val = evaluateConditions(15, 3, 0, 10);
    return 0;
}`,

    syntax: `// ============================================================================
// Sample Test File: syntax_errors.cpp
// Purpose: Demonstrates syntax error detection and LL(1) panic-mode recovery
// ============================================================================

int brokenFunction(int a, int b) {
    int x = a + b // Issue: Missing semicolon

    if (x > 10 { // Issue: Missing closing parenthesis
        return x;
    }

    return 0;
}

int main() {
    int res = brokenFunction(10, 20);
    return res;
}`
};

// ============================================================================
// Application State
// ============================================================================
let currentTokens = [];
let currentAST = null;
let currentReport = null;
let currentSourceCode = '';
let activeSeverityFilter = 'ALL';
let activeSearchQuery = '';

// ============================================================================
// DOM References
// ============================================================================
const editorTextarea = document.getElementById('code-editor');
const editorGutter = document.getElementById('editor-gutter');
const presetSelect = document.getElementById('preset-select');
const btnRun = document.getElementById('btn-run');
const btnClear = document.getElementById('btn-clear');
const btnCopy = document.getElementById('btn-copy');
const fileInput = document.getElementById('file-upload');
const statusCursor = document.getElementById('status-cursor');
const statusStats = document.getElementById('status-stats');

// Tab elements
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// ============================================================================
// Line Number Gutter Synchronization
// ============================================================================
function updateLineNumbers() {
    const text = editorTextarea.value;
    const lines = text.split('\n');
    const lineCount = lines.length;

    let gutterHtml = '';
    for (let i = 1; i <= lineCount; i++) {
        gutterHtml += `<div>${i}</div>`;
    }
    editorGutter.innerHTML = gutterHtml;

    // Update status bar stats
    statusStats.textContent = `Lines: ${lineCount} | Chars: ${text.length}`;
}

function updateCursorPosition() {
    const text = editorTextarea.value.substring(0, editorTextarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    statusCursor.textContent = `Ln ${line}, Col ${col}`;
}

// Synchronize gutter scroll with textarea
editorTextarea.addEventListener('scroll', () => {
    editorGutter.scrollTop = editorTextarea.scrollTop;
});

editorTextarea.addEventListener('input', () => {
    updateLineNumbers();
    updateCursorPosition();
});

editorTextarea.addEventListener('keyup', updateCursorPosition);
editorTextarea.addEventListener('click', updateCursorPosition);

// Enable Tab indentation inside textarea
editorTextarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editorTextarea.selectionStart;
        const end = editorTextarea.selectionEnd;

        // Insert 4 spaces
        editorTextarea.value = editorTextarea.value.substring(0, start) + '    ' + editorTextarea.value.substring(end);
        editorTextarea.selectionStart = editorTextarea.selectionEnd = start + 4;
        updateLineNumbers();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runAnalysis();
    }
});

// ============================================================================
// Preset Selection & File Upload Handlers
// ============================================================================
presetSelect.addEventListener('change', (e) => {
    const presetKey = e.target.value;
    if (CODE_PRESETS[presetKey]) {
        editorTextarea.value = CODE_PRESETS[presetKey];
        updateLineNumbers();
        runAnalysis();
    }
});

btnClear.addEventListener('click', () => {
    editorTextarea.value = '';
    updateLineNumbers();
    statusCursor.textContent = 'Ln 1, Col 1';
});

btnCopy.addEventListener('click', () => {
    navigator.clipboard.writeText(editorTextarea.value).then(() => {
        const originalText = btnCopy.innerHTML;
        btnCopy.innerHTML = '✓ Copied!';
        setTimeout(() => { btnCopy.innerHTML = originalText; }, 1500);
    });
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        editorTextarea.value = event.target.result;
        presetSelect.value = '';
        updateLineNumbers();
        runAnalysis();
    };
    reader.readAsText(file);
});

// ============================================================================
// Tab Navigation
// ============================================================================
tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const targetContent = document.getElementById(targetId);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

// ============================================================================
// Static Analysis Engine Orchestrator
// ============================================================================
btnRun.addEventListener('click', runAnalysis);

function runAnalysis() {
    currentSourceCode = editorTextarea.value;
    if (!currentSourceCode.trim()) {
        alert('Please enter or paste C++ code to analyze.');
        return;
    }

    const lines = currentSourceCode.split('\n');
    const totalLines = lines.length;

    // 1. Lexical Analysis (DFA Tokenizer)
    const lexer = new Lexer(currentSourceCode);
    currentTokens = lexer.tokenize();

    // 2. Syntax Analysis (LL(1) Recursive Descent Parser)
    const parser = new Parser(currentTokens);
    currentAST = parser.parse();

    // Combine any lexical or syntax errors found during front-end
    const initialIssues = [];
    for (const lexErr of lexer.errors) {
        initialIssues.push({
            severity: IssueSeverity.ERROR,
            category: "Lexical Error",
            message: lexErr.message,
            functionName: "lexer",
            line: lexErr.line,
            column: lexErr.column
        });
    }

    for (const synErr of parser.errors) {
        initialIssues.push({
            severity: IssueSeverity.ERROR,
            category: "Syntax Error",
            message: synErr.message,
            functionName: "parser",
            line: synErr.line,
            column: synErr.column
        });
    }

    // 3. Static Semantic & Metric Analysis
    const analyzer = new Analyzer({
        thresholdLOC: 50,
        thresholdComplexity: 10,
        thresholdNesting: 4,
        checkNaming: true
    });

    currentReport = analyzer.analyze(currentAST, "user_input.cpp", totalLines, initialIssues);

    // Render all tabs
    renderOverviewTab(currentReport);
    renderDiagnosticsTab(currentReport, lines);
    renderTokenStreamTab(currentTokens);
    renderASTTab(currentAST);
    renderTerminalTab(currentReport, lines);
}

// ============================================================================
// Render: Overview & Accuracy Tab
// ============================================================================
function renderOverviewTab(report) {
    const score = report.accuracy.score;
    const grade = report.accuracy.grade;
    const desc = report.accuracy.description;
    const errCount = report.getErrorCount();
    const warnCount = report.getWarningCount();
    const infoCount = report.getInfoCount();
    const avgComplexity = report.getAverageComplexity();
    const totalFuncs = report.functions.length;

    // Update tab badges
    const totalIssues = report.issues.length;
    document.getElementById('badge-issues-count').textContent = totalIssues;
    document.getElementById('badge-tokens-count').textContent = currentTokens.length;

    // 1. Verdict Banner
    const verdictBanner = document.getElementById('verdict-banner');
    const isPassed = (errCount === 0 && warnCount === 0);

    verdictBanner.className = `verdict-banner ${isPassed ? 'verdict-passed' : 'verdict-failed'}`;
    verdictBanner.innerHTML = `
        <div>
            <div class="verdict-title">
                <span>${isPassed ? '✓' : '⚠️'}</span>
                <span>${isPassed ? 'STATIC ANALYSIS PASSED - ZERO VIOLATIONS' : `STATIC ANALYSIS FAILED (${errCount} Errors, ${warnCount} Warnings)`}</span>
            </div>
            <div class="verdict-desc">${desc}</div>
        </div>
        <div class="verdict-grade-pill">${grade}</div>
    `;

    // 2. SVG Circular Gauge Animation
    const circle = document.getElementById('gauge-progress-circle');
    const scoreText = document.getElementById('gauge-score-value');
    const circumference = 2 * Math.PI * 45; // r=45 -> ~282.74
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;

    // Choose color based on score
    let strokeColor = '#3fb950'; // Green
    if (score < 50) strokeColor = '#f85149'; // Red
    else if (score < 75) strokeColor = '#d29922'; // Orange/Yellow
    else if (score < 90) strokeColor = '#58a6ff'; // Blue
    circle.style.stroke = strokeColor;

    scoreText.textContent = `${score.toFixed(1)}%`;

    // 3. KPI Cards
    document.getElementById('kpi-errors').textContent = errCount;
    document.getElementById('kpi-warnings').textContent = warnCount;
    document.getElementById('kpi-complexity').textContent = avgComplexity;
    document.getElementById('kpi-functions').textContent = totalFuncs;

    // 4. Score Deductions Breakdown
    const deductionsList = document.getElementById('deductions-list');
    if (report.accuracy.deductions.length === 0) {
        deductionsList.innerHTML = `
            <li class="deduction-item" style="color: var(--color-success); font-weight: 600;">
                <span>✓ Perfect Code Quality - No penalties applied (100.0% accuracy maintained)</span>
                <span class="deduction-points" style="color: var(--color-success);">+0%</span>
            </li>
        `;
    } else {
        let html = '';
        for (const ded of report.accuracy.deductions) {
            html += `
                <li class="deduction-item">
                    <span class="deduction-rule">
                        <span style="color: var(--color-error);">✗</span>
                        <span>${escapeHtml(ded.rule)}</span>
                    </span>
                    <span class="deduction-points">-${ded.points.toFixed(1)}%</span>
                </li>
            `;
        }
        deductionsList.innerHTML = html;
    }

    // 5. Function Metrics Table
    const fnTableBody = document.getElementById('fn-metrics-body');
    if (report.functions.length === 0) {
        fnTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                    No function definitions detected in source code.
                </td>
            </tr>
        `;
    } else {
        let html = '';
        for (const fn of report.functions) {
            let riskClass = 'risk-low';
            if (fn.riskLevel === 'Moderate') riskClass = 'risk-moderate';
            else if (fn.riskLevel === 'High') riskClass = 'risk-high';
            else if (fn.riskLevel === 'Very High') riskClass = 'risk-veryhigh';

            html += `
                <tr>
                    <td><strong>${escapeHtml(fn.name)}</strong></td>
                    <td>${fn.startLine}-${fn.endLine}</td>
                    <td>${fn.loc}</td>
                    <td>${fn.maxNestingDepth}</td>
                    <td>${fn.cyclomaticComplexity}</td>
                    <td><span class="risk-badge ${riskClass}">${fn.riskLevel}</span></td>
                </tr>
            `;
        }
        fnTableBody.innerHTML = html;
    }
}

// ============================================================================
// Render: Diagnostics & Issues Explorer Tab
// ============================================================================
function renderDiagnosticsTab(report, lines) {
    const issuesContainer = document.getElementById('issues-list-container');
    const filterAllBtn = document.getElementById('filter-all');
    const filterErrBtn = document.getElementById('filter-error');
    const filterWarnBtn = document.getElementById('filter-warning');
    const filterInfoBtn = document.getElementById('filter-info');

    const errCount = report.getErrorCount();
    const warnCount = report.getWarningCount();
    const infoCount = report.getInfoCount();

    filterAllBtn.textContent = `All (${report.issues.length})`;
    filterErrBtn.textContent = `Errors (${errCount})`;
    filterWarnBtn.textContent = `Warnings (${warnCount})`;
    filterInfoBtn.textContent = `Info (${infoCount})`;

    // Filter logic
    const filterIssues = () => {
        let filtered = report.issues;
        if (activeSeverityFilter !== 'ALL') {
            filtered = filtered.filter(i => i.severity === activeSeverityFilter);
        }
        if (activeSearchQuery.trim()) {
            const q = activeSearchQuery.toLowerCase();
            filtered = filtered.filter(i =>
                i.message.toLowerCase().includes(q) ||
                i.category.toLowerCase().includes(q) ||
                i.functionName.toLowerCase().includes(q)
            );
        }

        if (filtered.length === 0) {
            if (report.issues.length === 0) {
                issuesContainer.innerHTML = `
                    <div class="clean-slate">
                        <div class="clean-icon">✓</div>
                        <div class="clean-title">No Static Analysis Issues Found!</div>
                        <div class="clean-desc">
                            Your code adheres to all static analysis standards. Zero lexical, syntactic, semantic, or complexity violations detected.
                        </div>
                    </div>
                `;
            } else {
                issuesContainer.innerHTML = `
                    <div class="clean-slate">
                        <div class="clean-icon" style="color: var(--text-muted);">🔍</div>
                        <div class="clean-title">No Matching Issues</div>
                        <div class="clean-desc">No diagnostics match the selected filter criteria.</div>
                    </div>
                `;
            }
            return;
        }

        let html = '';
        for (const issue of filtered) {
            // Extract snippet line & caret
            let snippetHtml = '';
            if (issue.line > 0 && issue.line <= lines.length) {
                const srcLine = lines[issue.line - 1];
                const caretIndent = ' '.repeat(Math.max(0, issue.column - 1));
                snippetHtml = `
                    <div class="issue-snippet">
                        <div class="code-line">${issue.line} | ${escapeHtml(srcLine)}</div>
                        <div class="caret-line">  | ${caretIndent}^</div>
                    </div>
                `;
            }

            html += `
                <div class="issue-card severity-${issue.severity}">
                    <div class="issue-header">
                        <div class="issue-title-group">
                            <span class="severity-pill ${issue.severity}">${issue.severity}</span>
                            <span class="issue-category">${escapeHtml(issue.category)}</span>
                        </div>
                        <span class="issue-location">Line ${issue.line}:${issue.column} (${escapeHtml(issue.functionName || 'global')})</span>
                    </div>
                    <div class="issue-message">${escapeHtml(issue.message)}</div>
                    ${snippetHtml}
                </div>
            `;
        }
        issuesContainer.innerHTML = html;
    };

    filterIssues();

    // Attach filter button listeners once
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSeverityFilter = btn.getAttribute('data-severity');
            filterIssues();
        };
    });

    const searchInput = document.getElementById('search-issues');
    searchInput.oninput = (e) => {
        activeSearchQuery = e.target.value;
        filterIssues();
    };
}

// ============================================================================
// Render: Token Stream Tab
// ============================================================================
function renderTokenStreamTab(tokens) {
    const tbody = document.getElementById('tokens-table-body');
    if (!tokens || tokens.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No tokens generated.</td></tr>';
        return;
    }

    let html = '';
    tokens.forEach((tok, idx) => {
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${tok.line}</td>
                <td>${tok.column}</td>
                <td><span class="token-tag ${tok.type}">${tok.type}</span></td>
                <td>${escapeHtml(tok.subtype)}</td>
                <td><code>${escapeHtml(tok.lexeme)}</code></td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

// ============================================================================
// Render: AST Hierarchy Tab
// ============================================================================
function renderASTTab(ast) {
    const container = document.getElementById('ast-tree-container');
    if (!ast) {
        container.innerHTML = '<div style="color: var(--text-muted); padding: 1rem;">No AST generated due to syntax errors.</div>';
        return;
    }

    function renderNode(node) {
        if (!node) return '';

        let label = `<span class="ast-type">${node.nodeType}</span>`;
        let meta = `<span class="ast-loc">(Line ${node.line}:${node.column})</span>`;
        let details = '';
        let children = [];

        switch (node.nodeType) {
            case 'ProgramNode':
                children = node.declarations || [];
                break;
            case 'FunctionDeclNode':
                details = `<span class="ast-val">${node.returnType} ${node.name}(...) [LOC: ${node.getLOC()}]</span>`;
                children = [...(node.parameters || [])];
                if (node.body) children.push(node.body);
                break;
            case 'ParamNode':
                details = `<span class="ast-val">${node.type} ${node.name}</span>`;
                break;
            case 'VarDeclNode':
                details = `<span class="ast-val">${node.isConst ? 'const ' : ''}${node.type} ${node.name}</span>`;
                if (node.initializer) children.push(node.initializer);
                break;
            case 'BlockStmtNode':
                children = node.statements || [];
                break;
            case 'IfStmtNode':
                if (node.condition) children.push(node.condition);
                if (node.thenBranch) children.push(node.thenBranch);
                if (node.elseBranch) children.push(node.elseBranch);
                break;
            case 'WhileStmtNode':
                if (node.condition) children.push(node.condition);
                if (node.body) children.push(node.body);
                break;
            case 'ForStmtNode':
                if (node.init) children.push(node.init);
                if (node.condition) children.push(node.condition);
                if (node.update) children.push(node.update);
                if (node.body) children.push(node.body);
                break;
            case 'ReturnStmtNode':
                if (node.expression) children.push(node.expression);
                break;
            case 'ExprStmtNode':
                if (node.expression) children.push(node.expression);
                break;
            case 'BinaryExprASTNode':
                details = `<span class="ast-val">Operator '${node.op}'</span>`;
                if (node.left) children.push(node.left);
                if (node.right) children.push(node.right);
                break;
            case 'UnaryExprASTNode':
                details = `<span class="ast-val">Unary '${node.op}'</span>`;
                if (node.operand) children.push(node.operand);
                break;
            case 'LiteralExprASTNode':
                details = `<span class="ast-val">${escapeHtml(node.value)} (${node.literalType})</span>`;
                break;
            case 'VariableExprASTNode':
                details = `<span class="ast-val">${escapeHtml(node.name)}</span>`;
                break;
            case 'CallExprASTNode':
                details = `<span class="ast-val">${escapeHtml(node.callee)}()</span>`;
                children = node.arguments || [];
                break;
            case 'AssignExprASTNode':
                details = `<span class="ast-val">${escapeHtml(node.varName)} = ...</span>`;
                if (node.value) children.push(node.value);
                break;
            default:
                break;
        }

        let childrenHtml = '';
        if (children.length > 0) {
            childrenHtml = children.map(child => renderNode(child)).join('');
        }

        return `
            <div class="ast-node">
                <div class="ast-node-header">
                    ${label} ${details} ${meta}
                </div>
                ${childrenHtml}
            </div>
        `;
    }

    container.innerHTML = renderNode(ast);
}

// ============================================================================
// Render: Authentic Terminal Simulation Tab
// ============================================================================
function renderTerminalTab(report, lines) {
    const terminalBody = document.getElementById('terminal-content');
    const isPassed = (report.getErrorCount() === 0 && report.getWarningCount() === 0);

    let output = '';
    const hr = "======================================================================";
    const subHr = "----------------------------------------------------------------------";

    output += `<span class="term-cyan">${hr}\n           STATIC CODE ANALYZER & ACCURACY REPORT\n${hr}</span>\n`;
    output += `<span class="term-white">Source Target     : </span><span class="term-cyan">${report.filename}</span>\n`;
    output += `<span class="term-white">Total Lines (LOC) : </span><span class="term-cyan">${report.totalLines}</span>\n`;
    output += `<span class="term-white">Functions Analyzed: </span><span class="term-cyan">${report.totalFunctions}</span>\n`;
    output += `<span class="term-white">Avg Complexity    : </span><span class="term-cyan">${report.getAverageComplexity()}</span>\n`;
    output += `<span class="term-gray">${subHr}</span>\n`;
    output += `<span class="term-white">ACCURACY SCORE    : </span><span class="term-green">${report.accuracy.score.toFixed(1)}% [GRADE ${report.accuracy.grade}]</span>\n`;
    output += `<span class="term-white">QUALITY RATING    : </span><span class="term-white">${report.accuracy.description}</span>\n`;
    output += `<span class="term-gray">${subHr}</span>\n`;
    output += `<span class="term-white">SUMMARY: </span><span class="term-red">${report.getErrorCount()} Errors</span> | <span class="term-yellow">${report.getWarningCount()} Warnings</span> | <span class="term-cyan">${report.getInfoCount()} Info</span>\n\n`;

    output += `<span class="term-cyan">FUNCTION METRICS & COMPLEXITY TABLE:</span>\n`;
    output += `<span class="term-gray">--------------------------------------------------------------------------------\nFunction                Lines       LOC     Nesting     Complexity    Risk      \n--------------------------------------------------------------------------------</span>\n`;

    if (report.functions.length === 0) {
        output += `(No function definitions found)\n`;
    } else {
        for (const fn of report.functions) {
            const namePad = fn.name.padEnd(24, ' ');
            const linesPad = `${fn.startLine}-${fn.endLine}`.padEnd(12, ' ');
            const locPad = `${fn.loc}`.padEnd(8, ' ');
            const nestPad = `${fn.maxNestingDepth}`.padEnd(12, ' ');
            const compPad = `${fn.cyclomaticComplexity}`.padEnd(14, ' ');
            const riskPad = fn.riskLevel;
            output += `<span class="term-white">${namePad}${linesPad}${locPad}${nestPad}${compPad}${riskPad}</span>\n`;
        }
    }
    output += `<span class="term-gray">--------------------------------------------------------------------------------</span>\n\n`;

    if (report.issues.length === 0) {
        output += `<span class="term-green">No static analysis issues found! Code is clean.</span>\n`;
        output += `<span class="term-cyan">${hr}</span>\n`;
        output += `<span class="term-green">FINAL RESULT: PASSED (100% Accuracy, Zero Violations)</span>\n`;
        output += `<span class="term-cyan">${hr}</span>\n`;
    } else {
        output += `<span class="term-cyan">DETECTED STATIC ANALYSIS ISSUES (${report.issues.length}):</span>\n`;
        output += `<span class="term-gray">${subHr}</span>\n`;

        for (const iss of report.issues) {
            const sevColor = iss.severity === 'ERROR' ? 'term-red' : (iss.severity === 'WARNING' ? 'term-yellow' : 'term-cyan');
            const lineCol = `Line ${iss.line} :${iss.column}`;
            output += `[<span class="${sevColor}">${iss.severity}</span>] ${lineCol.padEnd(15, ' ')} | ${iss.category}\n`;
            output += `          ${iss.message}\n`;

            if (iss.line > 0 && iss.line <= lines.length) {
                const srcLine = lines[iss.line - 1];
                const caretIndent = ' '.repeat(Math.max(0, iss.column - 1));
                output += `          <span class="term-gray">${iss.line} | ${srcLine}</span>\n`;
                output += `          <span class="term-red">   | ${caretIndent}^</span>\n`;
            }
            output += '\n';
        }

        output += `<span class="term-cyan">${hr}</span>\n`;
        output += `<span class="term-red">FINAL RESULT: FAILED (${report.getErrorCount()} Errors, ${report.getWarningCount()} Warnings)</span>\n`;
        output += `<span class="term-cyan">${hr}</span>\n`;
    }

    terminalBody.innerHTML = output;

    // Terminal Copy Button
    const btnCopyTerm = document.getElementById('btn-copy-terminal');
    btnCopyTerm.onclick = () => {
        const plainText = terminalBody.innerText;
        navigator.clipboard.writeText(plainText).then(() => {
            const original = btnCopyTerm.innerHTML;
            btnCopyTerm.innerHTML = '✓ Copied Terminal Output!';
            setTimeout(() => { btnCopyTerm.innerHTML = original; }, 1500);
        });
    };
}

// ============================================================================
// Utilities
// ============================================================================
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================================
// Initialization on Load
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Load clean code preset by default
    editorTextarea.value = CODE_PRESETS.clean;
    presetSelect.value = 'clean';
    updateLineNumbers();
    updateCursorPosition();
    runAnalysis();
});
