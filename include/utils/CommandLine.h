#ifndef COMMAND_LINE_H
#define COMMAND_LINE_H

#include <string>
#include <vector>

struct Options {
    std::string inputFile = "";
    int thresholdLOC = 50;
    int thresholdNesting = 4;
    int thresholdComplexity = 10;
    bool checkNaming = false;
    bool dumpTokens = false;
    bool dumpAST = false;
    bool interactive = false;
    bool showHelp = false;
    bool showVersion = false;
};

class CommandLineParser {
public:
    static Options parse(int argc, char* argv[]);
    static void printHelp(const std::string& programName);
    static void printVersion();
};

#endif // COMMAND_LINE_H
