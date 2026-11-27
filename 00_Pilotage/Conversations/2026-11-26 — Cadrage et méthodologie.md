---
type: "conversation"
statut: "Validé"
phase: 0
date: "2026-11-26"
aliases:
  - "Cadrage"
tags:
  - "conversation"
relations:
  - "[[Phase 0 — Compréhension]]"
  - "[[Alyson Virtuelle]]"
cree: "2026-11-26"
maj: "2026-11-26"
---

# 2026-11-26 — Cadrage et méthodologie

## Ce qu'Alyson a demandé
- Établir un cadrage et une méthodologie « en quarantaine » : comprendre et centraliser tout le contexte avant de modifier quoi que ce soit, un document à la fois.
- Méthode voulue : vider les documents dans ChatGPT, les faire analyser par Claude, puis utiliser Smart Second Brain dans le coffre Obsidian pour en faire une Orchestratrice locale et privée.
- Claude = la partie cloud (automatisations et connexions de l'entreprise). Le personnel = local : Ollama, LM Studio, OpenWebUI, n8n, Odysseus (renommé et personnalisé en Alyson Virtuelle).
- À la fin : une seule IA, locale et sur mobile, Alyson Virtuelle, jumelle numérique et Orchestratrice, qui donne les instructions à Claude pour le cloud, avec des rôles et des skills pour être la plus autonome possible.

## Ce que Claude a livré
- Le document « Alyson Virtuelle — Cadrage et méthodologie (phase quarantaine) » (Claude Docs) : règle de quarantaine, schéma de la cible local / cloud, état des lieux, méthode d'analyse en 5 étapes avec gabarit ChatGPT, centralisation, phases 0 à 7, protocole du premier document.

## Constats relevés (sans modification)
- Dans l'autre copie du coffre (dépôt GitHub), l'agente Smart Second Brain « Alyson Virtuelle » utilisait un modèle OpenAI dans le cloud avec accès aux notes privées : contraire à la cible.
- Trois plugins de synchronisation Git y étaient actifs ; un seul suffit.

## Décisions qui en sortent
- [[D-002 Personnel en local, entreprise dans le cloud]]
- [[D-003 Analyse des documents un à la fois]]
- [[D-004 Une seule IA finale, Alyson Virtuelle]]

## Questions restées ouvertes
- Quel document analyser en premier (proposé : « ROXXY — Document Source de Vérité »).
- Odysseus comme harnais et Smart Second Brain comme mémoire : à confirmer.
