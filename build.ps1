# PowerShell build script for C++ Static Code Analyzer
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Building C++ Static Code Analyzer (MinGW / GCC)" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan

if (-not (Test-Path -Path "bin")) {
    New-Item -ItemType Directory -Path "bin" | Out-Null
}

$sources = @(
    "src/Token.cpp",
    "src/Lexer.cpp",
    "src/AST.cpp",
    "src/Parser.cpp",
    "src/SymbolTable.cpp",
    "src/Analyzer.cpp",
    "src/Report.cpp",
    "src/utils/CommandLine.cpp",
    "src/utils/FileUtils.cpp",
    "src/main.cpp"
)

Write-Host "Compiling source files..." -ForegroundColor Yellow
& g++ -std=c++17 -Wall -Wextra -O2 -I include $sources -o bin/analyzer.exe

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Built bin/analyzer.exe successfully!" -ForegroundColor Green
    Write-Host "Run: .\bin\analyzer.exe --help" -ForegroundColor Yellow
} else {
    Write-Host "[ERROR] Compilation failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
