---
type: "plugin"
statut: "Actif"
categorie: "maison"
priorite: 1
version: "0.1.0"
fonction: "Plugin maison unique qui regroupe peu à peu les fonctions du système, au lieu d'empiler des plugins"
portee: "local"
phase: 0
relations:
  - "[[Alyson Virtuelle]]"
  - "[[Plugins et paramètres de départ]]"
tags:
  - "plugin"
source: "[[Requêtes Claude]]"
cree: "2026-11-27"
maj: "2026-11-27"
---

# Plugin — Alyson Virtuelle

**Fonction :** un seul gros plugin personnalisé, écrit pour ce coffre. Chaque besoin devient un module de ce plugin plutôt qu'un plugin de plus.

**Emplacement :** `.Cerveau Système/plugins/alyson-virtuelle/` (JavaScript simple, sans compilation, sans dépendance, rien de téléchargé).

## Module 1 — Espaces (v0.1, actif)
Inspiré du concept de Portals, mais fait maison.
- Une vue **Espaces** dans la barre latérale gauche : icône en grille dans le ruban, ou commande « Changer d'espace ».
- Des onglets en haut de la vue, un par espace. Chaque espace a un nom, une icône, un dossier racine et une note d'accueil.
- Cliquer sur un espace n'affiche **que** l'arborescence de son dossier. Les dossiers se replient, et un clic sur une note l'ouvre (Ctrl + clic : dans un nouvel onglet).
- En changeant d'espace, les onglets ouverts de l'espace quitté sont **mémorisés**, puis ceux de l'espace choisi sont **restaurés**. La première fois, c'est sa note d'accueil qui s'ouvre.
- Réglages : ajouter, renommer, réordonner ou supprimer un espace. Supprimer un espace ne supprime aucun fichier.

| Espace de départ | Dossier | Note d'accueil |
| --- | --- | --- |
| Pilotage | `00_Pilotage` | [[Tableau de bord]] |
| Planification | `00_Planification` | — |
| Organisation | `10_Organisation` | — |
| Système | `20_Système` | — |
| Connaissances | `30_Connaissances` | — |
| Brain In A Box | `Brain In A Box` | [[Brain In A Box]] |
| Alyson Virtuelle | `Alyson Virtuelle` | `AGENT.md` |

## Module 2 — Synchro automatique (v0.1, actif)
- À chaque modification du coffre (note modifiée, créée, supprimée ou renommée), le module attend **60 secondes sans nouvelle modification**, puis lance la synchronisation de [[Plugin — Git Vault Sync]]. On ne lance donc pas une synchro à chaque frappe.
- Les changements dans `.Cerveau Système` (réglages) et `.git` sont ignorés.
- Réglages : activer ou désactiver, et choisir le délai (10 secondes minimum).
- Commande « Synchroniser maintenant (Git Vault Sync) » pour lancer la synchro tout de suite.

## Feuille de route : modules à venir
Chaque module remplace un plugin qui était proposé dans [[Plugins et paramètres de départ]].

| Module | Remplace | Ce qu'il fera |
| --- | --- | --- |
| Fiches rapides | QuickAdd | Menu « Nouvelle tâche / décision / source… » en deux clics, relié aux modèles |
| Modèles automatiques par dossier | Templater | Le bon modèle s'applique seul selon le dossier ; dates `cree` et `maj` remplies seules |
| Page d'accueil | Homepage | Le Tableau de bord, ou l'accueil de l'espace actif, s'ouvre au démarrage |
| Journal automatique des modifications | — | Chaque fichier créé, déplacé ou supprimé s'inscrit seul dans le [[Journal des modifications]] |
| Canevas enrichis | Advanced Canvas | Canevas plus lisibles, connexions typées |
