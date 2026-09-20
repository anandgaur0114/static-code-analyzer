#ifndef FILE_UTILS_H
#define FILE_UTILS_H

#include <string>
#include <vector>

class FileUtils {
public:
    static bool readFileToString(const std::string& filePath, std::string& outContent);
    static std::vector<std::string> splitLines(const std::string& content);
    static bool writeFile(const std::string& filePath, const std::string& content);
    static std::string getFileName(const std::string& filePath);
};

#endif // FILE_UTILS_H
