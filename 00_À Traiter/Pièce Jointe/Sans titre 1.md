---
type: "agente"
statut: "Idée"
niveau:
role:
fonction:
direction:
parent:
portee: "local"
relations: []
aliases: []
mots_cles: []
tags:
  - "agente"
source:
cree: "2026-11-27"
maj: "2026-11-27"
---

# Conceptrice

Agente de conception de systèmes et architecte de structures.

## Démarrage

```powershell
npm install
npm run dev          # app web seule (navigateur, localhost:5173)
npm run tauri dev    # app desktop (fenêtre native)
```

Copier `.env.example` vers `.env.local` et renseigner les clés Supabase avant de lancer le projet.

Build desktop (installeur Windows) :

```powershell
npm run tauri build
```

## SpecKit

Ce projet utilise [spec-kit](https://github.com/github/spec-kit) pour le développement piloté par spécifications. Commandes disponibles dans Claude Code : `/speckit-constitution`, `/speckit-specify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-implement`.