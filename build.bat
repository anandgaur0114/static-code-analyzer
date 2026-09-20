@echo off
echo =======================================================
echo Building C++ Static Code Analyzer (MinGW / GCC)
echo =======================================================

if not exist bin mkdir bin

set CXX=g++
set CXXFLAGS=-std=c++17 -Wall -Wextra -O2 -I include

set SOURCES=src\Token.cpp src\Lexer.cpp src\AST.cpp src\Parser.cpp src\SymbolTable.cpp src\Analyzer.cpp src\Report.cpp src\utils\CommandLine.cpp src\utils\FileUtils.cpp src\main.cpp

echo Compiling %SOURCES%...
%CXX% %CXXFLAGS% %SOURCES% -o bin\analyzer.exe

if %ERRORLEVEL% equ 0 (
    echo [SUCCESS] Built bin\analyzer.exe successfully!
    echo Run: bin\analyzer.exe --help
) else (
    echo [ERROR] Compilation failed! Check error messages above.
    exit /b %ERRORLEVEL%
)
