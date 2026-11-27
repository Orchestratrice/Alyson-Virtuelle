---
type: "pilotage"
statut: "Actif"
aliases:
  - "Changelog"
  - "Historique"
tags:
  - "pilotage"
  - "journal"
cree: "2026-11-26"
maj: "2026-11-26"
---

# Journal des modifications

> Claude est, pour l'instant, la seule instance qui modifie ce coffre (voir [[D-001 Claude seule instance qui modifie le coffre]]).
> Chaque changement est inscrit ici : une ligne par fichier créé, modifié, déplacé ou supprimé. Les plus récents en haut.

| Date | Action | Fichier | Raison | Conversation |
| --- | --- | --- | --- | --- |
| 2026-11-27 | Modifié | `.Cerveau Système/plugins/alyson-virtuelle/main.js` | Ajout du module Synchro automatique (synchro GitHub 60 s après la dernière modification) | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `.Cerveau Système/plugins/git-vault-sync/data.json` | Synchro automatique toutes les 10 min activée en filet de sécurité ; jeton non touché | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `20_Système/Plugins/Plugin — Alyson Virtuelle.md` | Description du module Synchro automatique | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `20_Système/Plugins/Plugin — Git Vault Sync.md` | Nouveaux réglages de synchro | [[Requêtes Claude]] |
| 2026-11-27 | Supprimé | `.Cerveau Système/plugins/obsidian-git/` (envoyé à la corbeille) | Doublon Git ; Alyson garde Git Vault Sync | [[Requêtes Claude]] |
| 2026-11-27 | Supprimé | `.Cerveau Système/plugins/github-sync/` (envoyé à la corbeille) | Doublon Git ; Alyson garde Git Vault Sync | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `.Cerveau Système/community-plugins.json` | Retrait de `obsidian-git` et `github-sync` ; restent smart-second-brain, git-vault-sync, alyson-virtuelle | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `20_Système/Plugins/Plugin — Obsidian Git.md` | Statut Archivé, remplacé par Git Vault Sync | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `20_Système/Plugins/Plugin — Git Vault Sync.md` | Fiche du seul plugin Git gardé | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `00_Pilotage/Plugins et paramètres de départ.md` | Choix du plugin Git réglé | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `.Cerveau Système/plugins/alyson-virtuelle/` (`manifest.json`, `main.js`, `styles.css`) | Plugin maison unique, v0.1 : module Espaces (concept Portals) | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `.Cerveau Système/community-plugins.json` | Ajout de `alyson-virtuelle`, les autres plugins restent | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `20_Système/Plugins/Plugin — Alyson Virtuelle.md` | Fiche du plugin et feuille de route des modules | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `00_Pilotage/Plugins et paramètres de départ.md` | Un seul plugin maison ; externes gardés : Smart Second Brain et un seul plugin Git | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `Tâches Claude/Requêtes Claude.md` | Demande « espaces et onglets » cochée | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/` et ses 4 espaces (`01_Concept fondateur`, `02_Structure universelle`, `03_Roxxy — Second cerveau`, `04_Mémoire à trier`) | Requêtes Claude : section Brain In A Box | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/Brain In A Box.md` | Accueil de la section | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/01_Concept fondateur/Projet — Concept fondateur.md` | Faire du Diagramme un projet avec vision et objectifs | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/02_Structure universelle/Structure universelle d'agente.md` | Modèle réplicable d'agente tiré du Diagramme | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/04_Mémoire à trier/À propos de la mémoire à trier.md` | Expliquer l'espace d'arrivée des documents d'IA | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `Brain In A Box/03_Roxxy — Second cerveau/ROXXY — Document Source de Vérité.md` | Copie de `D:\Système Des Opérations\Centrale Système` (l'original reste sur D:) | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `30_Connaissances/Concepts/Roxxy.md` → `Brain In A Box/03_Roxxy — Second cerveau/` | Requêtes Claude : Roxxy dans Brain In A Box | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `30_Connaissances/Sources/Fiche — ROXXY — Document Source de Vérité.md` → `Brain In A Box/03_Roxxy — Second cerveau/` | Idem | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `30_Connaissances/Sources/Fiche — Alyson Virtuelle — Orchestratrice Centrale.md` → `Brain In A Box/03_Roxxy — Second cerveau/` | Idem | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `30_Connaissances/Sources/Fiche — Architecture d'une agente personnalisée opérationnelle.md` → `Brain In A Box/02_Structure universelle/` | Idem | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `30_Connaissances/Sources/Fiche — Diagramme-évolutif-demandé.md` → `Brain In A Box/01_Concept fondateur/` | Idem | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `Brain In A Box/03_Roxxy — Second cerveau/Roxxy.md` | Définition donnée par Alyson | [[Requêtes Claude]] |
| 2026-11-27 | Déplacé | `Tableau de bord.md` → `00_Pilotage/` | Requêtes Claude : intégrer le tableau de bord aux dossiers | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `00_Pilotage/Tableau de bord.md` | Ajout du projet Concept fondateur | [[Requêtes Claude]] |
| 2026-11-27 | Créé | `00_Pilotage/Référence/À propos de Référence.md` | Dossier pour tes exemples de tableaux de bord | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `80_Canevas/Organigramme Alyson Virtuelle.canvas` | Nouveau chemin du tableau de bord | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `90_Bases/Connaissances.base` | Inclure les fiches de Brain In A Box | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `00_Pilotage/Guide du coffre.md` | Nouveaux dossiers | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `Alyson Virtuelle/AGENT.md` | Ajout du bloc Identité (structure universelle, réplique de Claude) en tête ; le reste est intact | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `Alyson Virtuelle/Memories/User.md` | Premiers faits sur Alyson | [[Requêtes Claude]] |
| 2026-11-27 | Modifié | `Tâches Claude/Requêtes Claude.md` | Cocher les demandes faites | [[Requêtes Claude]] |
| 2026-11-26 | Déplacé | 4 fichiers de C:\Users\adminpc\Cerveau Système vers `00_À Traiter/Ancien coffre/` | Conserver le seul contenu non vide du doublon | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Supprimé | Dossier C:\Users\adminpc\Cerveau Système (hors coffre) | Doublon du coffre, suppression demandée par Alyson | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Pilotage/Journal des modifications.md` | Journal de tous les changements | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Modifié | `Tableau de bord.md` | Ajout de propriétés en tête et des vues (bases) à la fin ; ton contenu d'origine est intact | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `.Cerveau Système/templates.json` | Réglage Obsidian (nouveau fichier) | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `.Cerveau Système/types.json` | Réglage Obsidian (nouveau fichier) | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Pilotage/Conversations/2026-11-26 — Cadrage et méthodologie.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Pilotage/Conversations/2026-11-26 — Structure du coffre.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Pilotage/Guide du coffre.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Pilotage/Plugins et paramètres de départ.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 0 — Compréhension.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 1 — Architecture fondatrice.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 2 — Framework et schéma universel.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 3 — Identité, rôles et skills.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 4 — Socle local et privé.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 5 — Automatisations et pont cloud.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 6 — Mobile et interfaces.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Phases/Phase 7 — Tests, Alyson #0001.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Confirmer le rôle d'Odysseus et de Smart Second Brain.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Décider du sort d'Obsidian Sync.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Envoyer le premier document à analyser.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Installer et régler les plugins validés.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Valider la liste des plugins de départ.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `00_Planification/Tâches/Valider les directions et rôles proposés.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Alyson Virtuelle.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Alyson.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Claude.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Directions/Archives et Intelligence documentaire.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Directions/Conscience.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Directions/Patrimoine et Finances.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Directions/Psychologie et Bien-être.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Directions/Vie personnelle.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Rôles/Conceptrice.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `10_Organisation/Rôles/Orchestratrice.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/LM Studio.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/Obsidian.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/Odysseus.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/Ollama.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/OpenWebUI.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/Smart Second Brain.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Outils/n8n.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Advanced Canvas.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Bases.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Canevas.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Homepage.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Linter.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Modèles.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Obsidian Git.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Obsidian Sync.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Propriétés.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — QuickAdd.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Smart Second Brain.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `20_Système/Plugins/Plugin — Templater.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Concepts/Direction.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Concepts/Jumelle numérique.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Concepts/Quarantaine.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Concepts/Roxxy.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Décisions/D-001 Claude seule instance qui modifie le coffre.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Décisions/D-002 Personnel en local, entreprise dans le cloud.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Décisions/D-003 Analyse des documents un à la fois.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Décisions/D-004 Une seule IA finale, Alyson Virtuelle.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Décisions/D-005 Bases et canevas comme interface de départ.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Sources/Fiche — Alyson Virtuelle — Orchestratrice Centrale.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Sources/Fiche — Architecture d'une agente personnalisée opérationnelle.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Sources/Fiche — Diagramme-évolutif-demandé.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `30_Connaissances/Sources/Fiche — ROXXY — Document Source de Vérité.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `80_Canevas/Organigramme Alyson Virtuelle.canvas` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `90_Bases/Connaissances.base` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `90_Bases/Organisation.base` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `90_Bases/Pilotage.base` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `90_Bases/Planification.base` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `90_Bases/Système.base` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Agente.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Concept.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Conversation.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Direction.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Décision.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Outil.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Plugin.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Rôle.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Skill.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Source.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |
| 2026-11-26 | Créé | `99_Modèles/Modèle — Tâche.md` | Structure initiale du coffre | [[2026-11-26 — Structure du coffre]] |

## Fichiers existants non touchés
`Diagramme-évolutif-demandé.md`, `Plugin De Départ.md`, `Sans titre.md`, `Tâches.md`, le dossier `Alyson Virtuelle/` (agente Smart Second Brain), le dossier `Roxxy/`, les plugins et réglages existants de `.Cerveau Système/` et `.obsidian/`, et le dépôt `.git/`.

## Incident
- 2026-11-26 : la copie faite par erreur dans `C:\Users\adminpc\Cerveau Système` a été supprimée (envoyée à la corbeille) le 2026-11-26 avec l'accord d'Alyson ; ses 4 fichiers utiles sont dans `00_À Traiter/Ancien coffre/`.
