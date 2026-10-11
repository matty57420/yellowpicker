#!/usr/bin/env bash
# Hook — block-secrets (PreToolUse)
# Bloque la lecture/ecriture/edition de fichiers sensibles.
# Pre-requis : jq installe (apt install jq / brew install jq).
#
# Wire dans .claude/settings.json :
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "Read|Write|Edit",
#       "hooks": [{"type": "command", "command": "./.claude/hooks/block-secrets/hook.sh"}]
#     }]
#   }

set -euo pipefail

input="$(cat)"
file_path="$(echo "$input" | jq -r '.tool_input.file_path // .tool_input.path // empty')"

if [[ -z "$file_path" ]]; then
    exit 0
fi

SENSITIVE_PATTERNS=(
    '\.env$'
    '\.env\.[^/]+$'
    '\.pem$'
    '\.pfx$'
    '\.key$'
    '\.p12$'
    'id_rsa$'
    'id_ed25519$'
    '/credentials(\.json)?$'
    '/secrets(\.json|\.yaml|\.yml)?$'
    'application-prod\.properties$'
    'application-prod\.yml$'
    '\.kube/config$'
    '\.aws/credentials$'
    '\.azure/.*\.json$'
)

for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if echo "$file_path" | grep -qE "$pattern"; then
        echo "[block-secrets] BLOCKED : tentative d'acces a un fichier sensible" >&2
        echo "  Chemin     : $file_path" >&2
        echo "  Pattern    : $pattern" >&2
        echo "  Decision   : refus du hook PreToolUse" >&2
        echo "" >&2
        echo "  Si c'est legitime : edite .claude/hooks/block-secrets/hook.sh pour retirer le pattern," >&2
        echo "  documente la raison dans tasks/lessons.md et commit." >&2
        exit 2
    fi
done

exit 0
