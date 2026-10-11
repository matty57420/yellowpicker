# Hook — block-secrets (PreToolUse) — version PowerShell
# Bloque la lecture/ecriture/edition de fichiers sensibles.
#
# Wire dans .claude/settings.json :
#   "hooks": {
#     "PreToolUse": [{
#       "matcher": "Read|Write|Edit",
#       "hooks": [{"type": "command", "command": "pwsh -File .claude/hooks/block-secrets/hook.ps1"}]
#     }]
#   }

$ErrorActionPreference = 'Stop'

$input = [System.Console]::In.ReadToEnd()
if ([string]::IsNullOrWhiteSpace($input)) { exit 0 }

try {
    $json = $input | ConvertFrom-Json
} catch {
    exit 0
}

$filePath = $null
if ($json.tool_input -and $json.tool_input.file_path) { $filePath = $json.tool_input.file_path }
elseif ($json.tool_input -and $json.tool_input.path)  { $filePath = $json.tool_input.path }

if (-not $filePath) { exit 0 }

$sensitivePatterns = @(
    '\.env$',
    '\.env\.[^/\\]+$',
    '\.pem$',
    '\.pfx$',
    '\.key$',
    '\.p12$',
    'id_rsa$',
    'id_ed25519$',
    '[/\\]credentials(\.json)?$',
    '[/\\]secrets(\.json|\.yaml|\.yml)?$',
    'application-prod\.properties$',
    'application-prod\.yml$',
    '\.kube[/\\]config$',
    '\.aws[/\\]credentials$',
    '\.azure[/\\].*\.json$'
)

foreach ($pattern in $sensitivePatterns) {
    if ($filePath -match $pattern) {
        [System.Console]::Error.WriteLine("[block-secrets] BLOCKED : tentative d'acces a un fichier sensible")
        [System.Console]::Error.WriteLine("  Chemin     : $filePath")
        [System.Console]::Error.WriteLine("  Pattern    : $pattern")
        [System.Console]::Error.WriteLine("  Decision   : refus du hook PreToolUse")
        [System.Console]::Error.WriteLine("")
        [System.Console]::Error.WriteLine("  Si c'est legitime : edite .claude/hooks/block-secrets/hook.ps1, documente dans tasks/lessons.md, commit.")
        exit 2
    }
}

exit 0
