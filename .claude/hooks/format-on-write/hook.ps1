# Hook — format-on-write (PostToolUse sur Write/Edit) — version PowerShell
# Best-effort : silencieux en cas d'echec.

$ErrorActionPreference = 'Continue'

$input = [System.Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($input)) { exit 0 }

$filePath = $null
try {
    $json = $input | ConvertFrom-Json
    if ($json.tool_input -and $json.tool_input.file_path) { $filePath = $json.tool_input.file_path }
} catch { exit 0 }

if (-not $filePath -or -not (Test-Path $filePath)) { exit 0 }

$ext = [System.IO.Path]::GetExtension($filePath).ToLower()

function Run-Silent { param([string]$cmd, [string[]]$args)
    try { & $cmd @args *>$null } catch { }
}

switch -Regex ($ext) {
    '\.java$' {
        if (Test-Path 'pom.xml') {
            if (Get-Command mvn -ErrorAction SilentlyContinue) {
                Run-Silent 'mvn' @('-q', 'net.revelc.code.formatter:formatter-maven-plugin:format', "-Dformatter.includes=$filePath")
            }
        } elseif ((Test-Path 'build.gradle') -or (Test-Path 'build.gradle.kts')) {
            if (Test-Path '.\gradlew.bat') { Run-Silent '.\gradlew.bat' @('spotlessApply', "-PspotlessFiles=$filePath") }
        }
    }
    '\.(ts|tsx|js|jsx|vue|json|md|css|scss|html|yaml|yml)$' {
        if ((Test-Path 'package.json') -and (Get-Command npx -ErrorAction SilentlyContinue)) {
            Run-Silent 'npx' @('--no-install', 'prettier', '--write', $filePath)
        }
    }
    '\.py$' {
        if (Get-Command ruff -ErrorAction SilentlyContinue) {
            Run-Silent 'ruff' @('format', $filePath)
        } elseif (Get-Command black -ErrorAction SilentlyContinue) {
            Run-Silent 'black' @('--quiet', $filePath)
        }
    }
    '\.cs$' {
        if (Get-Command dotnet -ErrorAction SilentlyContinue) {
            Run-Silent 'dotnet' @('format', '--include', $filePath)
        }
    }
    '\.go$' {
        if (Get-Command gofmt -ErrorAction SilentlyContinue) {
            Run-Silent 'gofmt' @('-w', $filePath)
        }
    }
    '\.rs$' {
        if (Get-Command rustfmt -ErrorAction SilentlyContinue) {
            Run-Silent 'rustfmt' @('--quiet', $filePath)
        }
    }
}

exit 0
