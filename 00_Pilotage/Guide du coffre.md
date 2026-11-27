---
type: "pilotage"
statut: "Actif"
aliases:
  - "Règles du coffre"
  - "Conventions"
tags:
  - "pilotage"
  - "methode"
cree: "2026-11-26"
maj: "2026-11-26"
---

# Guide du coffre

Le coffre reste simple : un dossier par grande famille, une fiche par élément, et des propriétés communes qui alimentent les bases (vues type Notion) et le canevas.

## Dossiers
| Dossier | Ce qu'on y range |
| --- | --- |
| Racine | Le moins de choses possible (Diagramme-évolutif-demandé en attendant son déplacement) |
| `00_Pilotage` | Tableau de bord, Journal des modifications, ce guide, conversations consignées, plugins, `Référence` (exemples de tableaux de bord) |
| `Brain In A Box` | Le concept fondateur : projet, structure universelle d'agente, Roxxy (second cerveau), mémoire à trier |
| `Tâches Claude` | Tes demandes à Claude |
| `Alyson Virtuelle` | Dossier de l'agente Smart Second Brain (AGENT.md, mémoire, skills) : géré par le plugin |
| `00_Planification` | Phases, tâches, problèmes prioritaires |
| `10_Organisation` | Agentes (Alyson Virtuelle, Claude), directions, rôles, skills |
| `20_Système` | Outils (Ollama, n8n...) et plugins |
| `30_Connaissances` | Concepts (glossaire), décisions, sources hors Brain In A Box |
| `80_Canevas` | Cartes visuelles de l'organisation |
| `90_Bases` | Les bases (vues tableau, cartes, listes) |
| `99_Modèles` | Les modèles de fiches |

## Propriétés communes
Chaque fiche commence par ces propriétés. Une propriété vide est permise.

| Propriété | Sert à | Valeurs |
| --- | --- | --- |
| `type` | Dire ce qu'est la fiche (filtre principal des bases) | agente, direction, role, skill, outil, plugin, concept, source, decision, phase, tache, conversation, pilotage |
| `statut` | Où en est la fiche | Idée, À valider, Validé, Actif, En pause, Archivé (tâches : À faire, En cours, Fait) |
| `phase` | Phase du plan à laquelle elle sert | 0 à 7 |
| `niveau` | Hiérarchie dans l'organisation | 0 = Alyson, 1 = Orchestratrice, 2 = direction, 3 = rôle ou agente spécialisée, 4 = skill |
| `role` | Rôle tenu | texte libre (ex. Orchestratrice) |
| `fonction` | Ce que fait l'élément, en une ligne | texte |
| `direction` | Direction de rattachement | lien vers une fiche direction |
| `parent` | Élément au-dessus dans l'organigramme | lien |
| `relations` | Autres éléments liés | liste de liens |
| `portee` | Local et privé, ou cloud | local, cloud, mixte |
| `mots_cles` | Mots-clés de recherche | liste |
| `aliases` | Autres noms de la fiche | liste |
| `tags` | Étiquettes Obsidian | liste |
| `source` | D'où vient l'information | lien vers une fiche source ou une conversation |
| `cree` / `maj` | Dates de création et de mise à jour | AAAA-MM-JJ |

## Statuts et validation
- Tout ce qui vient d'un document pas encore analysé reste « À valider ».
- Seule Alyson fait passer une fiche à « Validé ».
- Les décisions validées vivent dans `30_Connaissances/Décisions`.

## Créer une fiche
Palette de commandes → « Modèles : insérer un modèle » → choisir le modèle du bon type dans `99_Modèles`.
