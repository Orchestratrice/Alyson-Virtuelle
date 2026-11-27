---
type: "plugin"
statut: "Actif"
categorie: "communautaire"
priorite: 1
fonction: "Synchronise le coffre avec le dépôt GitHub Orchestratrice/Alyson-Virtuelle, branche Cerveau-Système"
portee: "mixte"
phase: 0
relations:
  - "[[Plugins et paramètres de départ]]"
tags:
  - "plugin"
source: "[[Requêtes Claude]]"
cree: "2026-11-27"
maj: "2026-11-27"
---

# Plugin — Git Vault Sync

**Fonction :** synchronise le coffre avec le dépôt GitHub `Orchestratrice/Alyson-Virtuelle`, branche `Cerveau-Système`. C'est le seul plugin Git gardé : Alyson a confirmé que c'est celui qui fonctionne.

**Réglages actuels :**
- **À chaque modification :** déclenchée par le module Synchro automatique de [[Plugin — Alyson Virtuelle]], 60 secondes après la dernière modification. Git Vault Sync n'a pas cette option lui-même.
- Synchronisation au démarrage d'Obsidian : oui
- Synchronisation automatique toutes les 10 min : oui, en filet de sécurité (activée le 2026-11-27)
- Message de commit : `vault sync {{date}}`

**Sécurité :** le jeton GitHub est stocké dans les réglages du plugin. Il ne doit jamais être recopié dans une note.

Remplace [[Plugin — Obsidian Git]] et GitHub Sync, supprimés le 2026-11-27.
