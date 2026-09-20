cmake_minimum_required(VERSION 3.10)
project(StaticCodeAnalyzer VERSION 1.0.0 LANGUAGES CXX)

# Require C++17
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

# Include directories
include_directories(include)

# Source files
set(SOURCES
    src/Token.cpp
    src/Lexer.cpp
    src/AST.cpp
    src/Parser.cpp
    src/SymbolTable.cpp
    src/Analyzer.cpp
    src/Report.cpp
    src/utils/CommandLine.cpp
    src/utils/FileUtils.cpp
    src/main.cpp
)

# Executable target
add_executable(analyzer ${SOURCES})

# Compiler warnings
if(MSVC)
    target_compile_options(analyzer PRIVATE /W4 /permissive-)
else()
    target_compile_options(analyzer PRIVATE -Wall -Wextra -pedantic)
endif()

# Installation target (optional)
install(TARGETS analyzer DESTINATION bin)
