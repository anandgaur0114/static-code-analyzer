#include "utils/CommandLine.h"
#include <iostream>
#include <cstdlib>

Options CommandLineParser::parse(int argc, char* argv[]) {
    Options opts;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];

        if (arg == "--help" || arg == "-h") {
            opts.showHelp = true;
        } else if (arg == "--version" || arg == "-v") {
            opts.showVersion = true;
        } else if (arg == "--dump-tokens") {
            opts.dumpTokens = true;
        } else if (arg == "--dump-ast") {
            opts.dumpAST = true;
        } else if (arg == "--interactive" || arg == "-i") {
            opts.interactive = true;
        } else if (arg == "--check-naming") {
            opts.checkNaming = true;
        } else if (arg.rfind("--check-naming=", 0) == 0) {
            std::string val = arg.substr(15);
            opts.checkNaming = (val == "true" || val == "1" || val == "yes");
        } else if (arg.rfind("--threshold-loc=", 0) == 0) {
            opts.thresholdLOC = std::atoi(arg.substr(16).c_str());
        } else if (arg.rfind("--threshold-nesting=", 0) == 0) {
            opts.thresholdNesting = std::atoi(arg.substr(20).c_str());
        } else if (arg.rfind("--threshold-complexity=", 0) == 0) {
            opts.thresholdComplexity = std::atoi(arg.substr(23).c_str());
        } else if (arg[0] == '-') {
            std::cerr << "Warning: Unknown option '" << arg << "'. Use --help for usage.\n";
        } else {
            // Positional argument: input source file
            if (opts.inputFile.empty()) {
                opts.inputFile = arg;
            } else {
                std::cerr << "Warning: Multiple input files specified; ignoring '" << arg << "'\n";
            }
        }
    }

    return opts;
}

void CommandLineParser::printHelp(const std::string& programName) {
    std::cout << "Usage: " << programName << " [source_file] [options]\n\n"
              << "A command-line static code analyzer for C/C++ supporting lexical analysis,\n"
              << "AST parsing, semantic checking (unused/undeclared variables, dead code),\n"
              << "cyclomatic complexity calculation, and code accuracy reporting.\n\n"
              << "Options:\n"
              << "  --interactive, -i            Interactively enter or paste C++ code directly in terminal\n"
              << "  --threshold-loc=<N>          Maximum lines of code threshold per function (default: 50)\n"
              << "  --threshold-nesting=<N>      Maximum allowed control flow nesting depth (default: 4)\n"
              << "  --threshold-complexity=<N>   Cyclomatic complexity threshold per function (default: 10)\n"
              << "  --check-naming[=true|false]  Enable identifier naming convention checks (default: false)\n"
              << "  --dump-tokens                Print token stream from lexical analysis\n"
              << "  --dump-ast                   Print syntax tree from recursive descent parser\n"
              << "  --version, -v                Display analyzer version\n"
              << "  --help, -h                   Display this help message\n\n"
              << "Examples:\n"
              << "  " << programName << " --interactive\n"
              << "  " << programName << " samples/test_issues.cpp\n"
              << "  " << programName << " samples/clean_code.cpp --dump-tokens --dump-ast\n"
              << "  type samples\\test_issues.cpp | " << programName << "\n\n";
}

void CommandLineParser::printVersion() {
    std::cout << "Antigravity C++ Static Code Analyzer v1.0.0\n"
              << "Compiler Design Course Project (B.Tech CSE / AI)\n"
              << "Built with pure C++17 without external dependencies\n";
}
