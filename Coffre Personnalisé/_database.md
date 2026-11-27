---
notion-bases: true
schema:
  - id: edit
    name: Edit
    type: text
    visible: true
    width: 200
  - id: aliases
    name: Aliases
    type: multiselect
    visible: true
    width: 140
    options:
      - value: Alyson
  - id: status
    name: Status
    type: select
    visible: true
    width: 140
    options:
      - value: à analyser
  - id: tags
    name: Tags
    type: multiselect
    visible: true
    width: 140
    options:
      - value: contexte
      - value: Modèle
      - value: Objectif
  - id: Secteur
    name: Secteur
    type: text
    visible: true
    width: 200
  - id: Niveau
    name: Niveau
    type: text
    visible: true
    width: 200
  - id: Juridiction
    name: Juridiction
    type: text
    visible: true
    width: 200
  - id: type
    name: Type
    type: select
    visible: true
    width: 140
    options:
      - value: capture
  - id: Objectif
    name: Objectif
    type: text
    visible: true
    width: 200
views:
  - id: default
    type: table
    filters: []
    sorts: []
    hiddenColumns: []
    columnWidths: {}
  - id: 3fa816c2-27fb-4939-a437-3c8f34f0f566
    type: gallery
    filters: []
    sorts: []
    hiddenColumns:
      - Juridiction
      - Niveau
      - Secteur
      - tags
      - status
      - aliases
      - edit
      - Objectif
    columnWidths: {}
    pinnedColumnId:
    name: Galerie
    includeSubfolders: false
    conditionalFormats:
      - id: 36b2b0c4-7f85-430c-b11f-690572c4fe2a
        columnId: edit
        operator: contains
        value: Images
        bgColor: "#f7026d"
        textColor: ""
    galleryCoverField: edit
    activePills:
      - id: 6a925b0f-61a4-42c4-9e95-84a0f3634bcf
        columnId: tags
        operator: is
        value: ""
        conjunction: and
---

> [!tip] Notion Bases
> Ce fichier est une base de données. Ouvrez-le pour voir la vue tableau.
