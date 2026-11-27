# Décision 0001 — Isolement du projet

- **Statut** : adoptée
- **Date** : 2026-08-25
- **Décideur** : utilisateur du projet

## Décision

Le dépôt `Orchestratrice` est réservé à une instance autonome dont le rôle initial est de construire son propre cerveau documentaire et son propre espace de connaissance.

## Conséquences

- Les autres dépôts, vaults et historiques ne sont pas pris en compte par défaut.
- Les informations externes doivent être importées explicitement et documentées.
- Les documents fondamentaux sont conservés dans ce dépôt.
- La qualité du système repose sur la traçabilité et la séparation entre faits, hypothèses et décisions.
