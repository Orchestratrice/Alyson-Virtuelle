Cette note vous propose une courte visite de TaskNotes dans votre propre coffre. Suivez les étapes ici même, puis conservez-la comme référence ou supprimez-la lorsque vous n'en aurez plus besoin.

TaskNotes est particulièrement utile lorsque trois étapes vont de pair :

1. Saisir rapidement une tâche.
2. Enregistrer la tâche comme une note Markdown ordinaire.
3. Consulter les tâches dans les vues Bases.

## Avant de commencer

- [ ] Activez le plugin principal **Bases** d'Obsidian.
- [ ] Vérifiez que TaskNotes a créé les fichiers `.base` par défaut dans `TaskNotes/Views/`.
- [ ] Ouvrez la palette de commandes et lancez **TaskNotes: Open tasks view**.

TaskNotes crée automatiquement au démarrage les fichiers `.base` par défaut manquants si l'option **Auto-create default files** est activée. S'ils manquent, utilisez **Settings -> TaskNotes -> Apparence et interactions -> Vues et fichiers base -> Créer les fichiers**.

## 1. Créer une tâche depuis la palette de commandes

Lancez **TaskNotes: Create new task** et créez une vraie tâche que vous comptez bientôt accomplir.

Essayez un titre comme :

```text
Review my TaskNotes setup tomorrow #admin
```

Après l'enregistrement, TaskNotes crée une note Markdown pour cette tâche. Ouvrez cette note de tâche et examinez les propriétés YAML en haut du fichier. Bases utilise ces propriétés pour filtrer, trier et regrouper les tâches, ainsi que pour les placer dans le calendrier.

## 2. Convertir les tâches dans la note en tâches TaskNotes

Les cases à cocher ci-dessous sont des tâches Markdown ordinaires. Convertissez chacune en note de tâche avec l'action intégrée à la ligne ou depuis la palette de commandes.

- [ ] Créer une tâche TaskNotes dans la boîte de réception avec une échéance demain #admin
- [ ] Planifier une tâche de 20 minutes lundi prochain #planning
- [ ] Créer une tâche liée à une note de projet actif

Après la conversion, remarquez les points suivants :

- La ligne source peut rester dans cette note pour fournir du contexte.
- La tâche proprement dite est désormais une note Markdown distincte et peut donc apparaître dans les vues TaskNotes.
- La ligne convertie contient un lien vers la note de tâche. Faites un clic droit sur ce lien pour ouvrir le menu de la tâche, puis essayez de modifier une propriété comme le statut, la priorité, l'échéance, la date planifiée ou le projet.

## 3. Consulter vos tâches

Les vues intégrées ci-dessous utilisent les fichiers Bases par défaut de TaskNotes.

### Liste des tâches

![[TaskNotes/Views/tasks-default.base]]

Utilisez-la pour voir simplement toutes les tâches ouvertes.

### Agenda

![[TaskNotes/Views/agenda-default.base]]

Utilisez-le pour suivre les échéances, les dates planifiées et les tâches qui demandent bientôt votre attention.

### Mini-calendrier

![[TaskNotes/Views/mini-calendar-default.base]]

Utilisez-le pour afficher un calendrier compact à côté de vos notes.

### Calendrier

![[TaskNotes/Views/calendar-default.base]]

Utilisez-le pour afficher un calendrier plus grand avec les tâches planifiées, les échéances, les blocs de temps et les événements du calendrier.

### Kanban

![[TaskNotes/Views/kanban-default.base]]

Utilisez-le pour faire passer les tâches d'un statut à l'autre, par exemple d'ouverte à en cours puis terminée.

## 4. Ne modifier que ce qui vous gêne

Les réglages par défaut suffisent pour commencer. Revenez aux paramètres plus tard, lorsque vous saurez ce que vous voulez changer :

- Si les fichiers de tâche se trouvent au mauvais endroit, vérifiez **Settings -> TaskNotes -> Fichiers de tâches**.
- Si les tâches converties depuis une note doivent être créées ailleurs, vérifiez **Settings -> TaskNotes -> Création de tâches -> Tâches dans les notes**.
- Si la fenêtre de tâche affiche trop ou trop peu de champs, vérifiez **Settings -> TaskNotes -> Création de tâches -> Champs du formulaire**.
- Si votre coffre utilise d'autres noms de propriétés, statuts, priorités ou champs personnalisés, vérifiez **Settings -> TaskNotes -> Propriétés**.

## 5. Personnaliser votre configuration

Essayez d'ajouter une propriété personnalisée à une tâche, par exemple `energy`, `client` ou `area`. Comme les tâches sont des notes Markdown, vous pouvez utiliser leurs propriétés personnalisées dans Bases sans dépendre d'une base de données de tâches distincte.

## 6. Vues contextuelles

Vous pouvez intégrer des vues Bases dans des notes quotidiennes, des notes de projet, des notes de réunion ou des notes de tâche. Les filtres avancés de Bases peuvent utiliser la note actuelle comme contexte, afin qu'une même vue affiche les tâches liées à la note qui l'héberge.

TaskNotes utilise ce principe pour le widget Relations dans les notes de tâche. Lorsque vous voudrez personnaliser les vues, consultez la documentation de TaskNotes pour trouver des exemples.

Autres essais utiles :

- Dupliquez `TaskNotes/Views/tasks-default.base` et créez une vue consacrée à un projet.
- Ajoutez un regroupement à une vue Bases, par exemple par statut ou par priorité.
- Ajoutez un filtre pour les tâches dont l'échéance est cette semaine.
- Liez une tâche à une note de projet et utilisez les liens entrants pour voir où elle est mentionnée.

## Aide et extensions

- Documentation : [tasknotes.dev](https://tasknotes.dev/)
- Problèmes ou bugs : [ouvrir un ticket sur GitHub](https://github.com/callumalpass/tasknotes/issues)
- Plugins complémentaires :
  - [Canvas Bases](https://tasknotes.dev/companion-plugins/canvas-bases/) ajoute des tableaux de type canevas et des instantanés JSON Canvas pour les vues Bases, avec des badges, des actions et des liens de relation TaskNotes facultatifs.
  - [TaskNotes Workflows](https://tasknotes.dev/companion-plugins/tasknotes-workflows/) ajoute des automatisations définies en Markdown pour les événements TaskNotes, les horaires, les commandes manuelles et les actions sur les tâches.

## Terminé

Vous connaissez maintenant l'essentiel : les tâches sont des notes, leurs propriétés permettent de les interroger et Bases les transforme en vues.
