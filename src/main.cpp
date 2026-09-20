#include "Token.h"
#include "Lexer.h"
#include "AST.h"
#include "Parser.h"
#include "Analyzer.h"
#include "Report.h"
#include "utils/CommandLine.h"
#include "utils/FileUtils.h"
#include <iostream>
#include <iomanip>

static std::string readInteractiveCode() {
    std::cout << "\n======================================================================\n";
    std::cout << "                INTERACTIVE C++ CODE INPUT MODE                       \n";
    std::cout << "======================================================================\n";
    std::cout << "Enter or paste your C++ code below.\n";
    std::cout << "To finish, type 'END' on an empty line or press Ctrl+Z (Enter on Windows):\n";
    std::cout << "----------------------------------------------------------------------\n";

    std::string code;
    std::string line;
    while (std::getline(std::cin, line)) {
        if (line == "END" || line == "end" || line == "EOF" || line == "exit") {
            break;
        }
        code += line + "\n";
    }
    return code;
}

int main(int argc, char* argv[]) {
    Options opts = CommandLineParser::parse(argc, argv);

    if (opts.showHelp) {
        CommandLineParser::printHelp(argv[0]);
        return 0;
    }

    if (opts.showVersion) {
        CommandLineParser::printVersion();
        return 0;
    }

    std::string sourceCode;
    std::string filename;

    // Check if input should be read interactively or from file
    if (opts.interactive || opts.inputFile.empty()) {
        sourceCode = readInteractiveCode();
        if (sourceCode.empty() || sourceCode.find_first_not_of(" \t\n\r") == std::string::npos) {
            std::cerr << "\n[!] No C++ code entered. Exiting analyzer.\n";
            return 1;
        }
        filename = "user_input.cpp";
    } else {
        // Read source code file
        if (!FileUtils::readFileToString(opts.inputFile, sourceCode)) {
            std::cerr << "Error: Could not open or read source file '" << opts.inputFile << "'.\n";
            return 1;
        }
        filename = FileUtils::getFileName(opts.inputFile);
    }

    auto sourceLines = FileUtils::splitLines(sourceCode);

    // ==========================================
    // Phase 1: Lexical Analysis (Hand-written DFA)
    // ==========================================
    Lexer lexer(sourceCode, filename);
    std::vector<Token> allTokens = lexer.tokenize(true); // Include comments

    if (opts.dumpTokens) {
        std::cout << "\n================ TOKEN STREAM (DFA Lexer) ================\n";
        std::cout << std::left << std::setw(8) << "Line" 
                  << std::setw(8) << "Col" 
                  << std::setw(22) << "Token Type" 
                  << "Lexeme\n";
        std::cout << "---------------------------------------------------------\n";
        for (const auto& tok : allTokens) {
            std::cout << std::left << std::setw(8) << tok.line
                      << std::setw(8) << tok.column
                      << std::setw(22) << tok.typeName()
                      << "'" << tok.lexeme << "'\n";
        }
        std::cout << "=========================================================\n\n";
    }

    // Filter out comments for syntactic parsing
    std::vector<Token> parserTokens;
    parserTokens.reserve(allTokens.size());
    for (const auto& tok : allTokens) {
        if (tok.type != TokenType::COMMENT_SINGLE && tok.type != TokenType::COMMENT_MULTI) {
            parserTokens.push_back(tok);
        }
    }

    // ==========================================
    // Phase 2: Syntax Analysis (Recursive Descent -> AST)
    // ==========================================
    Parser parser(parserTokens, filename);
    std::unique_ptr<ProgramNode> ast = parser.parseProgram();

    if (opts.dumpAST && ast) {
        std::cout << "\n================ ABSTRACT SYNTAX TREE (AST) ================\n";
        dumpAST(ast.get(), 0, std::cout);
        std::cout << "============================================================\n\n";
    }

    // ==========================================
    // Phase 3: Semantic & Static Analysis Passes
    // ==========================================
    AnalysisConfig config;
    config.thresholdLOC = opts.thresholdLOC;
    config.thresholdNesting = opts.thresholdNesting;
    config.thresholdComplexity = opts.thresholdComplexity;
    config.checkNaming = opts.checkNaming;

    Analyzer analyzer(config);
    AnalysisReportData reportData;
    if (ast) {
        reportData = analyzer.analyze(*ast, filename, static_cast<int>(sourceLines.size()));
    } else {
        reportData.filename = filename;
        reportData.totalLines = static_cast<int>(sourceLines.size());
    }

    // Integrate Lexical Errors
    for (const auto& lexErr : lexer.getErrors()) {
        AnalysisIssue issue;
        issue.severity = IssueSeverity::ERROR;
        issue.category = "Lexical Error";
        issue.message = lexErr.message;
        issue.functionName = "lexer";
        issue.line = lexErr.line;
        issue.column = lexErr.column;
        reportData.issues.push_back(issue);
    }

    // Integrate Parser Errors
    for (const auto& parseErr : parser.getErrors()) {
        AnalysisIssue issue;
        issue.severity = IssueSeverity::ERROR;
        issue.category = "Syntax Error";
        issue.message = parseErr.message;
        issue.functionName = "parser";
        issue.line = parseErr.line;
        issue.column = parseErr.column;
        reportData.issues.push_back(issue);
    }

    // Recalculate Accuracy & Quality Score taking all integrated errors into account
    reportData.calculateAccuracy();

    // ==========================================
    // Phase 4: Quality Report Generation
    // ==========================================
    ReportGenerator reporter(reportData, sourceLines);

    // Terminal report output
    reporter.printConsole(std::cout, true);

    return (reportData.getErrorCount() > 0) ? 1 : 0;
}
