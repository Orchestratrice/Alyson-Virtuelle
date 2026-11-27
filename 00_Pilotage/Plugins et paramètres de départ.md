---
type: "pilotage"
statut: "À valider"
phase: 0
aliases:
  - "Plugins de départ"
tags:
  - "pilotage"
  - "plugin"
cree: "2026-11-26"
maj: "2026-11-26"
---

# Plugins et paramètres de départ

> Première liste à valider par Alyson. Rien n'est installé tant qu'elle n'a pas dit oui. Les plugins de cœur cochés « Actif » étaient déjà activés.

## Vue d'ensemble
![[Système.base#Plugins]]

## Plugins de cœur (déjà dans Obsidian)
| Plugin | État | Pourquoi |
| --- | --- | --- |
| Bases | Activé | Vues type Notion sur les fiches |
| Canevas | Activé | Organigramme et connexions visuelles |
| Modèles | Activé, dossier réglé sur `99_Modèles` | Créer les fiches au bon format |
| Propriétés | Activé, types déclarés | Phase, niveau, rôle, fonction, etc. |
| Notes quotidiennes | Activé | Pourra servir de journal de bord ; dossier à décider |
| Obsidian Sync | Activé | **À décider** : service cloud d'Obsidian, chiffré, mais hors de la machine |

## Décision du 2026-11-27 : un seul plugin maison
Alyson ne veut pas empiler les plugins. Les fonctions se regroupent dans **un seul plugin personnalisé**, [[Plugin — Alyson Virtuelle]], qui grandit module par module.

### Plugins externes gardés
| Plugin | Pourquoi |
| --- | --- |
| Smart Second Brain | Le chat local d'Alyson Virtuelle, branché sur Ollama ou LM Studio |
| [[Plugin — Git Vault Sync]] | Le seul plugin Git : synchronise le coffre avec GitHub. Obsidian Git et GitHub Sync ont été envoyés à la corbeille le 2026-11-27 |

### Remplacés par les modules du plugin Alyson Virtuelle
| Plugin proposé avant | Module qui le remplace | État |
| --- | --- | --- |
| Portals (concept) | Espaces | Fait (v0.1) |
| QuickAdd | Fiches rapides | À venir |
| Templater | Modèles automatiques par dossier | À venir |
| Homepage | Page d'accueil | À venir |
| Advanced Canvas | Canevas enrichis | À venir |
| — | Journal automatique des modifications | À venir |
| Linter | Sera couvert par les modules Modèles et Journal (date `maj`) | À venir |

Pas nécessaires : Dataview (Bases le remplace).

## Paramètres de base à décider
- [ ] Dossier des pièces jointes : proposé `99_Fichiers`
- [ ] Emplacement des nouvelles notes : proposé « dossier courant »
- [ ] Format des liens : liens wiki, chemin le plus court (réglage actuel par défaut)
- [ ] Dossier des notes quotidiennes : proposé `00_Pilotage/Journal`
- [ ] Obsidian Sync : garder, ou passer à une synchro locale ou Git privée
- [ ] Mode restreint : à désactiver pour installer les plugins communautaires
