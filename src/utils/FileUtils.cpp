#include "utils/FileUtils.h"
#include <fstream>
#include <sstream>

bool FileUtils::readFileToString(const std::string& filePath, std::string& outContent) {
    std::ifstream inFile(filePath, std::ios::in | std::ios::binary);
    if (!inFile.is_open()) return false;

    std::ostringstream ss;
    ss << inFile.rdbuf();
    outContent = ss.str();
    return true;
}

std::vector<std::string> FileUtils::splitLines(const std::string& content) {
    std::vector<std::string> lines;
    std::string current;
    for (size_t i = 0; i < content.size(); ++i) {
        char c = content[i];
        if (c == '\r') {
            if (i + 1 < content.size() && content[i + 1] == '\n') {
                i++;
            }
            lines.push_back(current);
            current.clear();
        } else if (c == '\n') {
            lines.push_back(current);
            current.clear();
        } else {
            current.push_back(c);
        }
    }
    if (!current.empty() || (!content.empty() && (content.back() == '\n' || content.back() == '\r'))) {
        lines.push_back(current);
    }
    return lines;
}

bool FileUtils::writeFile(const std::string& filePath, const std::string& content) {
    std::ofstream outFile(filePath);
    if (!outFile.is_open()) return false;
    outFile << content;
    return true;
}

std::string FileUtils::getFileName(const std::string& filePath) {
    size_t lastSlash = filePath.find_last_of("/\\");
    if (lastSlash != std::string::npos) {
        return filePath.substr(lastSlash + 1);
    }
    return filePath;
}
