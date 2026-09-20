#include "Report.h"
#include <sstream>
#include <iomanip>
#include <algorithm>

ReportGenerator::ReportGenerator(const AnalysisReportData& data, const std::vector<std::string>& sourceLines)
    : data_(data), sourceLines_(sourceLines) {}

std::string ReportGenerator::getSourceLineSnippet(int lineNumber) const {
    if (lineNumber <= 0 || lineNumber > static_cast<int>(sourceLines_.size())) {
        return "";
    }
    return sourceLines_[lineNumber - 1];
}

void ReportGenerator::printConsole(std::ostream& os, bool useAnsi) const {
    // ANSI Color codes
    const std::string RESET   = useAnsi ? "\033[0m" : "";
    const std::string BOLD    = useAnsi ? "\033[1m" : "";
    const std::string RED     = useAnsi ? "\033[31m" : "";
    const std::string GREEN   = useAnsi ? "\033[32m" : "";
    const std::string YELLOW  = useAnsi ? "\033[33m" : "";
    const std::string BLUE    = useAnsi ? "\033[34m" : "";
    const std::string MAGENTA = useAnsi ? "\033[35m" : "";
    const std::string CYAN    = useAnsi ? "\033[36m" : "";
    const std::string GRAY    = useAnsi ? "\033[90m" : "";

    os << "\n" << BOLD << CYAN << "======================================================================\n";
    os << "           STATIC CODE ANALYZER & ACCURACY REPORT                     \n";
    os << "======================================================================\n" << RESET;

    os << BOLD << "Source Target     : " << RESET << data_.filename << "\n";
    os << BOLD << "Total Lines (LOC) : " << RESET << data_.totalLines << "\n";
    os << BOLD << "Functions Analyzed: " << RESET << data_.totalFunctions << "\n";
    os << BOLD << "Avg Complexity    : " << RESET << std::fixed << std::setprecision(1) 
       << data_.getAverageComplexity() << "\n";
    os << "----------------------------------------------------------------------\n";

    // Accuracy Score & Grade Display
    std::string gradeColor = GREEN;
    if (data_.accuracy.grade == "A+" || data_.accuracy.grade == "A") gradeColor = GREEN;
    else if (data_.accuracy.grade == "B") gradeColor = CYAN;
    else if (data_.accuracy.grade == "C") gradeColor = YELLOW;
    else if (data_.accuracy.grade == "D") gradeColor = MAGENTA;
    else gradeColor = RED;

    os << BOLD << "ACCURACY SCORE    : " << gradeColor << std::fixed << std::setprecision(1)
       << data_.accuracy.score << "% " << "[GRADE " << data_.accuracy.grade << "]" << RESET << "\n";
    os << BOLD << "QUALITY RATING    : " << RESET << data_.accuracy.description << "\n";

    // Deductions Breakdown
    if (!data_.accuracy.deductions.empty()) {
        os << GRAY << "Score Deductions  :\n";
        for (const auto& d : data_.accuracy.deductions) {
            os << "  * -" << std::fixed << std::setprecision(1) << d.second << "% : " << d.first << "\n";
        }
        os << RESET;
    }
    os << "----------------------------------------------------------------------\n";

    int errors = data_.getErrorCount();
    int warnings = data_.getWarningCount();
    int infos = data_.getInfoCount();

    os << BOLD << "ISSUE SUMMARY     : " << RESET
       << RED << errors << " Errors" << RESET << " | "
       << YELLOW << warnings << " Warnings" << RESET << " | "
       << BLUE << infos << " Info" << RESET << "\n";
    os << "----------------------------------------------------------------------\n";

    // Function Metrics Table
    if (!data_.functions.empty()) {
        os << "\n" << BOLD << MAGENTA << "FUNCTION METRICS & COMPLEXITY TABLE:" << RESET << "\n";
        os << GRAY << "--------------------------------------------------------------------------------\n" << RESET;
        os << BOLD << std::left << std::setw(24) << "Function"
           << std::setw(12) << "Lines"
           << std::setw(8)  << "LOC"
           << std::setw(12) << "Nesting"
           << std::setw(14) << "Complexity"
           << std::setw(10) << "Risk" << RESET << "\n";
        os << GRAY << "--------------------------------------------------------------------------------\n" << RESET;

        for (const auto& f : data_.functions) {
            std::string lineSpan = std::to_string(f.startLine) + "-" + std::to_string(f.endLine);
            std::string riskColor = GREEN;
            if (f.riskLevel == "Moderate") riskColor = YELLOW;
            else if (f.riskLevel == "High" || f.riskLevel == "Critical") riskColor = RED;

            os << std::left << std::setw(24) << (f.name.size() > 22 ? f.name.substr(0, 20) + ".." : f.name)
               << std::setw(12) << lineSpan
               << std::setw(8)  << f.loc
               << std::setw(12) << f.maxNestingDepth
               << std::setw(14) << f.cyclomaticComplexity
               << riskColor << BOLD << std::setw(10) << f.riskLevel << RESET << "\n";
        }
        os << GRAY << "--------------------------------------------------------------------------------\n\n" << RESET;
    }

    // Issues Detail List
    if (!data_.issues.empty()) {
        os << BOLD << "DETECTED CODE ISSUES & ERRORS (" << data_.issues.size() << "):" << RESET << "\n";
        os << "----------------------------------------------------------------------\n";

        for (const auto& issue : data_.issues) {
            std::string badge;
            if (issue.severity == IssueSeverity::ERROR) {
                badge = RED + BOLD + "[ERROR]  " + RESET;
            } else if (issue.severity == IssueSeverity::WARNING) {
                badge = YELLOW + BOLD + "[WARNING]" + RESET;
            } else {
                badge = BLUE + BOLD + "[INFO]   " + RESET;
            }

            os << badge << " Line " << std::setw(4) << issue.line << ":" << issue.column
               << " | " << BOLD << issue.category << RESET << "\n"
               << "          " << issue.message << "\n";

            // If snippet exists, show it with pointer
            std::string snippet = getSourceLineSnippet(issue.line);
            if (!snippet.empty()) {
                os << GRAY << "          " << issue.line << " | " << snippet << RESET << "\n";
                if (issue.column > 0) {
                    std::string pointer = "          " + std::string(std::to_string(issue.line).length(), ' ') + " | ";
                    for (int i = 1; i < issue.column; ++i) pointer += " ";
                    pointer += "^";
                    os << YELLOW << pointer << RESET << "\n";
                }
            }
            os << "\n";
        }
    } else {
        os << GREEN << BOLD << "\nNo static analysis issues found! Code is clean.\n" << RESET;
    }

    os << "======================================================================\n";
    if (errors > 0) {
        os << RED << BOLD << "FINAL RESULT: FAILED (" << errors << " Errors, " << warnings << " Warnings)\n" << RESET;
    } else if (warnings > 0) {
        os << YELLOW << BOLD << "FINAL RESULT: PASSED WITH WARNINGS (" << warnings << " Warnings)\n" << RESET;
    } else {
        os << GREEN << BOLD << "FINAL RESULT: PASSED (100% Accuracy, Zero Violations)\n" << RESET;
    }
    os << "======================================================================\n\n";
}
