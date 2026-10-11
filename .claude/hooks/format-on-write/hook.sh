#!/usr/bin/env bash
# Hook — format-on-write (PostToolUse sur Write/Edit)
# Auto-format le fichier ecrit selon la stack detectee.
# Best-effort : silencieux en cas d'echec, n'interrompt pas Claude.
#
# Wire dans .claude/settings.json :
#   "hooks": {
#     "PostToolUse": [{
#       "matcher": "Write|Edit",
#       "hooks": [{"type": "command", "command": "./.claude/hooks/format-on-write/hook.sh"}]
#     }]
#   }
#
# ATTENTION : ce hook ajoute de la latence (1-5s typiquement). Opt-in.

set +e  # ne JAMAIS bloquer en cas de failure du formatter

input="$(cat)"

file_path=""
if command -v jq >/dev/null 2>&1; then
    file_path="$(echo "$input" | jq -r '.tool_input.file_path // empty')"
fi

if [[ -z "$file_path" ]] || [[ ! -f "$file_path" ]]; then
    exit 0
fi

case "$file_path" in
    *.java)
        if [[ -f pom.xml ]] && command -v mvn >/dev/null 2>&1; then
            mvn -q net.revelc.code.formatter:formatter-maven-plugin:format -Dformatter.includes="$file_path" >/dev/null 2>&1 || true
        elif [[ -f build.gradle ]] || [[ -f build.gradle.kts ]]; then
            ./gradlew spotlessApply -PspotlessFiles="$file_path" >/dev/null 2>&1 || true
        fi
        ;;
    *.ts|*.tsx|*.js|*.jsx|*.vue|*.json|*.md|*.css|*.scss|*.html|*.yaml|*.yml)
        if [[ -f package.json ]] && command -v npx >/dev/null 2>&1; then
            npx --no-install prettier --write "$file_path" >/dev/null 2>&1 || true
        fi
        ;;
    *.py)
        if command -v ruff >/dev/null 2>&1; then
            ruff format "$file_path" >/dev/null 2>&1 || true
        elif command -v black >/dev/null 2>&1; then
            black --quiet "$file_path" >/dev/null 2>&1 || true
        fi
        ;;
    *.cs)
        if command -v dotnet >/dev/null 2>&1; then
            dotnet format --include "$file_path" >/dev/null 2>&1 || true
        fi
        ;;
    *.go)
        if command -v gofmt >/dev/null 2>&1; then
            gofmt -w "$file_path" >/dev/null 2>&1 || true
        fi
        ;;
    *.rs)
        if command -v rustfmt >/dev/null 2>&1; then
            rustfmt --quiet "$file_path" >/dev/null 2>&1 || true
        fi
        ;;
esac

exit 0
