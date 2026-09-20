#ifndef REPORT_H
#define REPORT_H

#include "Analyzer.h"
#include <string>
#include <vector>
#include <iostream>

class ReportGenerator {
public:
    explicit ReportGenerator(const AnalysisReportData& data, const std::vector<std::string>& sourceLines = {});

    // Print styled report to console/terminal
    void printConsole(std::ostream& os = std::cout, bool useAnsi = true) const;

private:
    AnalysisReportData data_;
    std::vector<std::string> sourceLines_;

    std::string getSourceLineSnippet(int lineNumber) const;
};

#endif // REPORT_H
