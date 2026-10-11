# Architecture Decision Records (ADR)

> Discipline : toute décision structurante non triviale dans un projet est documentée dans un ADR court (1-2 pages). Stocké dans `docs/adr/` du repo.

Format **MADR 4.0** (Markdown Architectural Decision Records) — cf. [`template.md`](template.md).

---

## 1. Quand écrire un ADR ?

**Écrire un ADR si** :
- Décision touche à l'architecture (choix d'une lib, d'un pattern, d'un service externe)
- Non réversible facilement (≥ 1 jour-dev pour annuler)
- Impact transverse (touche plusieurs modules ou plusieurs équipes)
- Sujet à débat (plusieurs options sérieuses considérées)
- Question susceptible de revenir (« pourquoi a-t-on choisi X ? » sera posée dans 6 mois)

**Ne PAS écrire d'ADR pour** :
- Décision triviale (renommer une variable, ajouter un endpoint CRUD standard)
- Implémentation détail (« on utilise un `Map<String, User>` ici »)
- Sujet déjà tranché par la doctrine ou une policy (ne pas dupliquer)

**Test de l'ADR** : si dans 6 mois quelqu'un peut légitimement demander « pourquoi a-t-on fait comme ça ? », alors l'ADR est justifié.

---

## 2. Format et numérotation

### 2.1 Nommage de fichier
`<NNNN>-<titre-en-kebab-case>.md`

- `<NNNN>` : numéro séquentiel sur 4 chiffres, sans trou (`0001`, `0002`, …, `0042`)
- `<titre-en-kebab-case>` : 3-6 mots, descriptif, anglais ou français selon convention projet

Exemples :
- `0001-choix-orm-hibernate-vs-jooq.md`
- `0002-rest-vs-graphql-pour-api-publique.md`
- `0014-strategy-multi-tenant-row-level-security.md`

### 2.2 Format MADR 4.0
Cf. [`template.md`](template.md) — sections :
- **Status** (Proposed / Accepted / Deprecated / Superseded)
- **Date**, **Decision-makers**, **Consulted**, **Informed**
- **Context and Problem Statement**
- **Decision Drivers**
- **Considered Options**
- **Decision Outcome** + Pros / Cons
- **Validation** (critères mesurables + date de revue)
- **More Information**

### 2.3 Pourquoi MADR (pas Nygard) ?

- MADR est **plus structuré** : decision drivers explicites, options listées, validation prévue
- Adoption dans le tooling enterprise (adr-tools, IntelliJ plugins, Backstage)
- Mieux pour audit (un RSSI peut lire et challenger sans contexte projet)

**Exception** : si un client utilise déjà Nygard, conserver Nygard dans son repo. Préciser dans le `CLAUDE.md` projet.

---

## 3. Lifecycle d'un ADR

### 3.1 Status workflow
```
Proposed → Accepted → Deprecated → Superseded
              ↓
           Rejected (rare, gardé pour mémoire)
```

- **Proposed** : draft, en discussion
- **Accepted** : décision validée, application en cours / faite
- **Deprecated** : l'ADR ne reflète plus la pratique mais reste référence historique
- **Superseded** : remplacé explicitement par un autre ADR (lien dans le status)

### 3.2 Modification d'un ADR Accepted
**Règle** : un ADR Accepted ne se **modifie pas** sur le fond — on en écrit un nouveau qui le supersede.

Exceptions acceptables :
- Correction de typo, lien cassé, clarification mineure
- Ajout d'une section « Update YYYY-MM-DD : <précision> »

### 3.3 Revue programmée
Chaque ADR doit définir une **date de revue** dans la section Validation (typiquement 3-6 mois après acceptance).

À la date :
- Si la décision est validée par les faits → mettre à jour la section Validation, garder Accepted
- Si la décision est dépassée → écrire un ADR Superseding

---

## 4. Où stocker les ADRs

### 4.1 Dans le repo client
```
docs/
  adr/
    0001-choix-orm.md
    0002-rest-vs-graphql.md
    README.md           ← copie de ce fichier
    template.md         ← copie du template
    INDEX.md            ← liste auto-générée des ADRs (optionnel)
```

### 4.2 Référencement depuis le code
Pour les décisions qui se reflètent dans le code, lier l'ADR en commentaire :

```java
/**
 * Repository pour les comptes carbone.
 *
 * Choix de Hibernate vs jOOQ : cf. docs/adr/0001-choix-orm.md
 */
@Repository
public class CarbonAccountRepository { ... }
```

### 4.3 Référencement depuis `CLAUDE.md`
La section « Architecture Decision Records » du `CLAUDE.md` projet pointe vers `docs/adr/` et liste les ADRs majeurs.

---

## 5. Comment démarrer

### 5.1 Bootstrap dans un nouveau projet
```bash
mkdir -p docs/adr
cp ~/dev/config-dev/adr/template.md docs/adr/template.md
cp ~/dev/config-dev/adr/README.md docs/adr/README.md
```

### 5.2 Premier ADR
Souvent : `0001-record-architecture-decisions.md` qui acte la pratique elle-même (méta-ADR). Pas obligatoire, mais utile pour les équipes qui découvrent.

### 5.3 Outils recommandés
- **adr-tools** (Nygard) : CLI pour créer/lister ADRs. Marche aussi avec MADR adapté.
- **VSCode extension MADR** : completion + lint sur les fichiers ADR
- **Markdown link check** : valider que les liens entre ADRs ne se cassent pas

---

## 6. Anti-patterns

| Anti-pattern | Pourquoi mauvais | Bonne pratique |
|---|---|---|
| ADR de 10 pages | Personne ne le relira | Max 2 pages, l'essentiel |
| ADR sans options considérées | « On a fait X » ne se justifie pas | Lister ≥ 2 alternatives sérieuses |
| ADR pour décision triviale | Bruit, perte de signal | Garder ADR pour structurant uniquement |
| Réécrire un ADR accepté | Perte de traçabilité | Nouveau ADR superseding |
| Pas de critère de validation | Aucune façon de challenger | Toujours définir comment on saura si la décision tient |

---

## 7. Exemple

Voir [`0001-example-choix-orm.md`](0001-example-choix-orm.md) — exemple rempli inspiré d'un choix réel Hibernate vs jOOQ.

---

## 8. Référencement dans `CLAUDE.md` projet

```markdown
## Architecture Decision Records

Toute décision structurante est documentée dans `docs/adr/` au format MADR 4.0.

- Template : `docs/adr/template.md`
- Discipline : `docs/adr/README.md`
- ADRs majeurs : <liste raccourcie avec liens>

Voir [`adr/`](../../adr/) pour la doctrine.
```
