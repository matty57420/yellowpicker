# Hook `block-secrets` — Patterns détectés

> Documentation des patterns regex détectés par le hook `block-secrets`. Référencé par [`policies/secrets-handling.md`](../../policies/secrets-handling.md).

**Comportement** : si l'un de ces patterns est détecté dans un fichier lu ou écrit, le hook **bloque l'opération** avec un message d'erreur explicite. Le consultant doit corriger avant de continuer.

---

## 1. Patterns standards (tous projets)

### 1.1 Clés privées PEM
```regex
-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----
```
**Détecte** : SSH private keys, certificats privés TLS, clés PGP exportées.
**Action** : bloque, demande de stocker la clé dans Key Vault.

### 1.2 AWS Access Keys
```regex
AKIA[0-9A-Z]{16}                    # Access Key ID
aws_secret_access_key\s*=\s*[A-Za-z0-9/+=]{40}   # Secret Access Key
```
**Détecte** : credentials AWS en clair dans le code ou config.

### 1.3 Azure
```regex
DefaultEndpointsProtocol=https;AccountName=[a-z0-9]+;AccountKey=[A-Za-z0-9+/=]+ # Storage connection string
Server=tcp:[a-z0-9-]+\.database\.windows\.net.*Password=[^;]+;                  # SQL Azure connection
[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}                   # GUID (tenant/subscription/client) — attention faux positifs
```
**Détecte** : Azure storage keys, connection strings SQL Azure.
**Note** : GUID détection désactivable (trop de faux positifs sur les IDs publics).

### 1.4 GitHub / Azure DevOps PAT
```regex
ghp_[A-Za-z0-9]{36}                  # GitHub Classic PAT
github_pat_[A-Za-z0-9_]{82}          # GitHub Fine-grained PAT
gho_[A-Za-z0-9]{36}                  # GitHub OAuth
ghs_[A-Za-z0-9]{36}                  # GitHub Server
[a-z0-9]{52}                         # Azure DevOps PAT (heuristique — 52 chars alphanumlower)
```

### 1.5 OpenAI / Anthropic API keys
```regex
sk-proj-[A-Za-z0-9_-]{40,}           # OpenAI project key
sk-[A-Za-z0-9]{48}                   # OpenAI legacy key
sk-ant-api03-[A-Za-z0-9_-]{93,}      # Anthropic API key
```

### 1.6 Stripe / Sendgrid / autres SaaS
```regex
sk_live_[A-Za-z0-9]{24,}             # Stripe secret (live)
rk_live_[A-Za-z0-9]{24,}             # Stripe restricted (live)
SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}  # SendGrid
xox[baprs]-[A-Za-z0-9-]+             # Slack token
```

### 1.7 JWT (avec payload réaliste)
```regex
eyJ[A-Za-z0-9_=-]+\.eyJ[A-Za-z0-9_=-]{20,}\.[A-Za-z0-9_=.+/-]+
```
**Note** : un JWT en exemple/doc (3 chars payload) ne déclenche pas. Seuil ≥ 20 chars dans payload pour limiter faux positifs.

### 1.8 Generic high-entropy
```regex
(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*["']?[A-Za-z0-9!@#$%^&*()_+={}\[\]:";'<>?,./|\\-]{12,}["']?
```
**Détecte** : `password = "foobar123!"`, `API_KEY: 'xyz...'` etc. en évitant les placeholders vides.

### 1.9 Database connection strings
```regex
(mongodb|postgres|mysql|mariadb|redis)://[^:]+:[^@]+@[^/]+
```
**Détecte** : connection strings avec password en clair.

### 1.10 Private SSH keys references (paths)
```regex
~/.ssh/id_(rsa|ecdsa|ed25519|dsa)(?!\.pub)
/home/[^/]+/.ssh/id_(rsa|ecdsa|ed25519|dsa)(?!\.pub)
```
**Détecte** : tentative de lecture d'une clé privée SSH (cf. deny-list §2.5).

### 1.11 .env files content
```regex
^\s*[A-Z_]+\s*=\s*[^\s#]+   # ligne format VAR=value (heuristique)
```
**Application** : uniquement sur fichiers `.env`, `.env.*` (jamais `.env.example`).

### 1.12 PII patterns (cf. data-classification §3 — Restricted)
```regex
\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b   # email
(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}                # tel FR
\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b                    # CB (Luhn check ideal mais coûteux)
FR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{3}      # IBAN FR (heuristique)
LU\d{2}\s?\d{3}\s?\d{13}                             # IBAN LU
```
**Note** : seuil de detection > 3 occurrences dans le fichier pour limiter faux positifs (un email dans une signature ne déclenche pas, une liste d'emails oui).

### 1.13 Certificats / clés inline
```regex
-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----
```
**Détecte** : certificats publics inline (généralement OK si CA / cert public, sinon à valider). Bloquant en mission client par défaut, débloquable par allowlist locale.

---

## 2. Patterns optionnels (activables par projet)

### 2.1 Noms de clients / projets stratégiques
Une regex spécifique peut être ajoutée dans `.claude/settings.local.json` pour bloquer la fuite de noms de clients sous NDA strict :

```json
{
  "hooks": {
    "BlockSecretsExtraPatterns": [
      "ProjectAtlas|Atlas2026|AcmeCorp-internal"
    ]
  }
}
```

### 2.2 Code propriétaire identifié
Idem pour des noms de classes / modules considérés Restricted :
```json
{
  "hooks": {
    "BlockSecretsExtraPatterns": [
      "ProprietaryAlgorithm|TradingStrategy_v2"
    ]
  }
}
```

---

## 3. Comment ajouter un pattern

### 3.1 Cas 1 — Pattern universel (impacte tous les projets)
1. PR sur le kit : modification de `hook.sh` + `hook.ps1` pour ajouter la regex
2. Mise à jour de ce fichier (PATTERNS.md) avec la nouvelle entrée
3. Test : sample file avec pattern → hook doit bloquer ; sample file sans pattern → hook doit passer
4. Revue ton RSSI (ou toi-même en solo) obligatoire
5. Release dans une nouvelle version du kit (bump CHANGELOG)

### 3.2 Cas 2 — Pattern projet-specific (impacte un seul repo client)
1. Ajout dans `.claude/settings.local.json` (jamais `settings.json` partagé)
2. Documentation dans `tasks/lessons.md` du projet :
   ```
   ## Block-secrets — pattern projet ajouté le 2026-05-12
   Pattern : <regex>
   Pourquoi : <raison>
   Revu par : <lead mission>
   ```
3. Pas de revue RSSI (scope projet uniquement)

---

## 4. Comment tester le hook

### 4.1 Smoke test
Créer un fichier test :
```bash
cat > /tmp/test-block-secrets.txt <<EOF
This file contains a fake secret:
AWS_KEY=AKIAIOSFODNN7EXAMPLE
EOF
```

Tenter de le lire via Claude Code :
```
Read /tmp/test-block-secrets.txt
```

**Résultat attendu** : opération bloquée, message d'erreur indiquant le pattern détecté.

### 4.2 Test négatif (pas de faux positif)
```bash
cat > /tmp/test-no-secret.txt <<EOF
This is a normal file with an example placeholder:
API_KEY=<YOUR_KEY_HERE>
EOF
```
Tentative de lecture → doit **passer** (placeholder reconnu).

### 4.3 Suite de tests automatisée
Le dossier `hooks/block-secrets/tests/` (à créer en v0.4) contient :
- `positive/` : fichiers qui DOIVENT être bloqués
- `negative/` : fichiers qui DOIVENT passer
- Script `run-tests.sh` qui boucle et vérifie

---

## 5. Limites connues

- **Pas de scan d'historique git** : le hook protège les opérations en cours, pas le passé. Pour scanner l'historique → `gitleaks detect`.
- **Pas de détection sémantique** : un secret encodé/obfusqué passe (ex: base64 encodé). Limite assumée.
- **Performance** : sur très gros fichiers (> 10 MB), le hook peut ajouter de la latence — alerter si problème.
- **Faux positifs** : inevitables sur certaines regex large (générique high-entropy). Mécanisme d'allowlist projet pour les whitelister explicitement.

---

## 6. Historique des patterns

| Version | Date | Modifs |
|---|---|---|
| v0.3 | 2026-05-12 | Doc initiale, 13 catégories de patterns recensées |
