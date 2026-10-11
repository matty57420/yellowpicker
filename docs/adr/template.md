# <NNNN> — <Titre court de la décision>

* **Status** : Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX](XXXX-titre.md)
* **Date** : YYYY-MM-DD
* **Decision-makers** : <Lead tech>, <Sponsor>, <autres>
* **Consulted** : <experts consultés>
* **Informed** : <équipes notifiées>

---

## Context and Problem Statement

> Décris la situation, le contexte, et le problème à résoudre. 2-4 paragraphes max. Le lecteur doit comprendre **pourquoi** une décision est nécessaire, sans avoir besoin de poser de questions.

Inclure :
- Quel est le besoin métier ou technique ?
- Quelles contraintes (techniques, légales, temporelles, budgétaires) ?
- Quelle est la situation actuelle (status quo) ?

---

## Decision Drivers

> Critères qui ont guidé le choix. Liste à puces, 3-7 items.

- Driver 1 : <ex: performance — l'opération doit tenir sous 200ms p95>
- Driver 2 : <ex: courbe d'apprentissage équipe>
- Driver 3 : <ex: coût d'infrastructure>
- Driver 4 : <ex: compatibilité avec le stack existant>
- Driver 5 : <ex: réversibilité — peut-on revenir en arrière ?>

---

## Considered Options

> Toutes les options sérieusement envisagées, y compris « ne rien faire » si pertinent. Une option = une sous-section.

### Option 1 : <Nom>
Description courte.

### Option 2 : <Nom>
Description courte.

### Option 3 : <Nom>
Description courte.

---

## Decision Outcome

**Option retenue** : <Option N — Nom>

### Pourquoi cette option ?

> 1-3 paragraphes qui expliquent **comment** les decision drivers ci-dessus penchent vers cette option. C'est la section la plus importante de l'ADR.

### Conséquences positives

- <ex: réduction de la complexité d'intégration>
- <ex: alignement avec le reste de la stack>
- <ex: meilleure observabilité>

### Conséquences négatives / Trade-offs assumés

- <ex: dépendance à un vendor spécifique>
- <ex: coût d'apprentissage initial>
- <ex: performance dégradée sur tel cas marginal>

---

## Pros and Cons of the Options

### Option 1 : <Nom>
**Pros** :
- <ex: maturité de l'écosystème>

**Cons** :
- <ex: complexité opérationnelle>

### Option 2 : <Nom>
**Pros** :
- ...

**Cons** :
- ...

### Option 3 : <Nom>
**Pros** :
- ...

**Cons** :
- ...

---

## Validation

> Comment vérifier que la décision tient ses promesses ? Définir des **critères mesurables** et une **date de revue**.

- **Critère 1** : <ex: latence p95 sous 200ms en charge nominale, mesuré 1 mois après déploiement>
- **Critère 2** : <ex: pas de régression de complexité de code — `cyclomatic complexity` du module impacté <= +10%>
- **Date de revue** : YYYY-MM-DD (3 mois après acceptance typique)

---

## More Information

> Tout ce qui est utile au lecteur pour aller plus loin.

- Liens vers spec / RFC / doc fournisseur
- Tickets / discussions associés
- ADR liés : [ADR-XXXX](XXXX-titre.md), [ADR-YYYY](YYYY-titre.md)
- Personnes à contacter pour questions
