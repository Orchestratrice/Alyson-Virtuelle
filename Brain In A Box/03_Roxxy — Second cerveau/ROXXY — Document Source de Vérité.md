# **ROXXY — Document Source de Vérité**

**Version 1.1 — Alyson** **Stack : Windows 11 · SQLite → PostgreSQL · Ollama · n8n · Obsidian** **Contraintes : 256 Go SSD · 16 Go RAM · Budget zéro au départ** **Mise à jour v1.1 : Agent Analyste de Documents — pipeline complet, SQL, n8n, directives évolutives**

---

## **TABLE DES MATIÈRES**

1. [Philosophie du système](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#1-philosophie)  
2. [Stack technique](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#2-stack-technique)  
3. [Architecture des données — Noyau universel](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#3-noyau-universel)  
4. [Les 4 Cerveaux — Structure SQL complète](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#4-les-4-cerveaux)  
5. [Modules spécialisés](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#5-modules-sp%C3%A9cialis%C3%A9s)  
6. [Système de preuves et d'intégrité](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#6-syst%C3%A8me-de-preuves)  
7. [Roxxy — Rôles, directives et gouvernance](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#7-roxxy-gouvernance)  
8. [Agents spécialisés — Fiches de rôles](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#8-agents-sp%C3%A9cialis%C3%A9s)  
9. [Automatisations n8n — Plan de flux](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#9-automatisations-n8n)  
10. [Roadmap de déploiement](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#10-roadmap)  
11. [Règles fondamentales du système](https://claude.ai/chat/2d8be52f-413e-479b-9f2f-78bd62069b8f#11-r%C3%A8gles-fondamentales)

---

## **1\. PHILOSOPHIE**

Roxxy n'est pas un assistant IA. C'est un **empire cognitif modulaire** en trois couches :

* **Clone in a box** — vie personnelle, quotidien, lifestyle, confidente, coach  
* **Business in a box** — gestion d'entreprise sur l'autopilote, évolution continue  
* **Finance in a box** — budget, épargne, placements, comptabilité, impôts

### **Principes directeurs**

* **SQL d'abord** — toute donnée a une table, une clé primaire, une date de création  
* **Vault immuable** — tout fichier ingéré est en lecture seule, jamais modifié  
* **Un agent \= une responsabilité** — pas de chevauchement, pas d'ambiguïté  
* **Autopilot supervisé** — Roxxy propose, Alyson valide pour toute action à risque  
* **Pas de diagnostic · Pas de conseil juridique définitif** — préparation et organisation seulement  
* **Légèreté d'abord** — SQLite jusqu'à 10 Go de données, puis PostgreSQL

---

## **2\. STACK TECHNIQUE**

### **Couche IA (gratuit, local)**

| Outil | Rôle | Notes |
| ----- | ----- | ----- |
| **Ollama** | Moteur LLM local | Mistral 7B pour commencer |
| **Open WebUI** | Interface chat Roxxy | localhost:3000 |
| **LangChain / LlamaIndex** | Orchestration agents | Python, gratuit |

### **Couche données (gratuit, local)**

| Outil | Rôle | Notes |
| ----- | ----- | ----- |
| **SQLite** | Base principale phase 1 | Fichier unique `roxxy.db` |
| **PostgreSQL** | Migration phase 2 | Quand volume augmente |
| **pgvector** | Mémoire vectorielle | Recherche sémantique |
| **DB Browser for SQLite** | Interface graphique | Gratuit, Windows |

### **Couche automatisation (gratuit, auto-hébergé)**

| Outil | Rôle | Notes |
| ----- | ----- | ----- |
| **n8n** | Workflows et automatisations | Docker Desktop |
| **Docker Desktop** | Conteneurs | Gratuit usage personnel |

### **Couche documentation (gratuit, local)**

| Outil | Rôle | Notes |
| ----- | ----- | ----- |
| **Obsidian** | Notes, SOP, fiches agents | Coffre local, zéro cloud |
| **Syncthing** | Synchronisation locale | Zéro abonnement |

### **Structure de dossiers Windows**

C:\\Roxxy\\  
├── VAULT\\          ← originaux immuables (lecture seule)  
│   ├── preuves\\  
│   ├── documents\\  
│   └── media\\  
├── WORK\\           ← copies de travail  
├── INBOX\\          ← dépôt initial (n8n surveille ce dossier)  
├── DB\\             ← roxxy.db \+ backups  
├── OBSIDIAN\\       ← coffre Obsidian (SOP, fiches, roadmaps)  
├── EXPORTS\\        ← rapports générés  
└── LOGS\\           ← journaux append-only  
    ├── audit.log  
    └── manifest.csv

### **Empreinte mémoire estimée (256 Go SSD)**

* OS \+ apps : \~60 Go  
* Roxxy stack complet : \~15 Go  
* Données \+ vault : \~80 Go disponibles au départ  
* Marge système : \~100 Go → Confortable pour 2-3 ans de données

---

## **3\. NOYAU UNIVERSEL — 8 TABLES DE BASE**

Tout le système repose sur ces 8 tables. Chaque cerveau et chaque module s'y greffe.

\-- \============================================================  
\-- TABLE 1 : ITEMS (Inbox universelle)  
\-- Tout ce qui entre dans le système  
\-- \============================================================  
CREATE TABLE items (  
  id          INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre       TEXT NOT NULL,  
  contenu     TEXT,  
  type        TEXT CHECK(type IN (  
                'note','tache','idee','lien','promo','rappel',  
                'recette','preuve','document','evenement','autre'  
              )),  
  statut      TEXT DEFAULT 'inbox' CHECK(statut IN (  
                'inbox','en\_cours','traite','archive','supprime'  
              )),  
  urgence     INTEGER DEFAULT 3 CHECK(urgence BETWEEN 1 AND 5),  
  cerveau\_id  INTEGER REFERENCES cerveaux(id),  
  aire\_id     INTEGER REFERENCES aires(id),  
  source      TEXT,  
  convertir\_en TEXT,  
  cree\_le     TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
  traite\_le   TIMESTAMP  
);

\-- \============================================================  
\-- TABLE 2 : CERVEAUX  
\-- Les 4 modules principaux  
\-- \============================================================  
CREATE TABLE cerveaux (  
  id          INTEGER PRIMARY KEY AUTOINCREMENT,  
  nom         TEXT NOT NULL,  
  code        TEXT UNIQUE NOT NULL,  \-- 'identite','vie\_perso','entreprise','finances'  
  description TEXT,  
  directrice  TEXT,  
  statut      TEXT DEFAULT 'actif'  
);

INSERT INTO cerveaux (nom, code, description, directrice) VALUES  
  ('Identité & Psychologie', 'identite',   'Clone numérique d''Alyson', 'Directrice Cerveau Personnel'),  
  ('Vie Personnelle',        'vie\_perso',  'Quotidien, lifestyle, agenda', 'Directrice Vie Personnelle'),  
  ('Entreprise',             'entreprise', 'Business in a box', 'Directrice Générale Entreprise'),  
  ('Finances',               'finances',   'Finance in a box', 'Directrice Financière');

\-- \============================================================  
\-- TABLE 3 : AIRES (Domaines fonctionnels)  
\-- Système nerveux du routing  
\-- \============================================================  
CREATE TABLE aires (  
  id          INTEGER PRIMARY KEY AUTOINCREMENT,  
  nom         TEXT NOT NULL,  
  cerveau\_id  INTEGER REFERENCES cerveaux(id),  
  type        TEXT CHECK(type IN ('admin','operationnel','support')),  
  priorite    INTEGER DEFAULT 3,  
  responsable TEXT,  
  actif       BOOLEAN DEFAULT 1  
);

\-- \============================================================  
\-- TABLE 4 : PERSONNES  
\-- Toutes les relations humaines et agents  
\-- \============================================================  
CREATE TABLE personnes (  
  id          INTEGER PRIMARY KEY AUTOINCREMENT,  
  prenom      TEXT NOT NULL,  
  nom         TEXT,  
  type        TEXT CHECK(type IN (  
                'ami','famille','collegue','professionnel',  
                'client','fournisseur','agent\_ia','autre'  
              )),  
  role        TEXT,  
  importance  INTEGER DEFAULT 3 CHECK(importance BETWEEN 1 AND 5),  
  statut      TEXT DEFAULT 'actif' CHECK(statut IN ('actif','distant','inactif','termine')),  
  notes       TEXT,  
  tags        TEXT,  
  cree\_le     TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- \============================================================  
\-- TABLE 5 : EVENEMENTS  
\-- Ligne du temps universelle  
\-- \============================================================  
CREATE TABLE evenements (  
  id               INTEGER PRIMARY KEY AUTOINCREMENT,  
  date\_evenement   DATE NOT NULL,  
  titre            TEXT NOT NULL,  
  description      TEXT,  
  type             TEXT CHECK(type IN (  
                     'souvenir','decision','emotion','reve',  
                     'relation','etape','professionnel','financier','autre'  
                   )),  
  intensite        INTEGER CHECK(intensite BETWEEN 1 AND 10),  
  cerveau\_id       INTEGER REFERENCES cerveaux(id),  
  aire\_id          INTEGER REFERENCES aires(id),  
  personnes\_liees  TEXT,  \-- IDs séparés par virgule  
  tags             TEXT,  
  source           TEXT,  
  cree\_le          TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- \============================================================  
\-- TABLE 6 : PROJETS  
\-- Initiatives avec résultat attendu  
\-- \============================================================  
CREATE TABLE projets (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre           TEXT NOT NULL,  
  description     TEXT,  
  cerveau\_id      INTEGER REFERENCES cerveaux(id),  
  aire\_id         INTEGER REFERENCES aires(id),  
  statut          TEXT DEFAULT 'planifie' CHECK(statut IN (  
                    'idee','planifie','en\_cours','en\_pause',  
                    'termine','abandonne'  
                  )),  
  priorite        INTEGER DEFAULT 3 CHECK(priorite BETWEEN 1 AND 5),  
  date\_debut      DATE,  
  date\_cible      DATE,  
  date\_fin        DATE,  
  resultat\_attendu TEXT,  
  kpi             TEXT,  
  responsable\_id  INTEGER REFERENCES personnes(id),  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- \============================================================  
\-- TABLE 7 : TACHES  
\-- Actions concrètes  
\-- \============================================================  
CREATE TABLE taches (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  description   TEXT,  
  projet\_id     INTEGER REFERENCES projets(id),  
  cerveau\_id    INTEGER REFERENCES cerveaux(id),  
  aire\_id       INTEGER REFERENCES aires(id),  
  assignee\_id   INTEGER REFERENCES personnes(id),  
  statut        TEXT DEFAULT 'a\_faire' CHECK(statut IN (  
                  'a\_faire','en\_cours','bloque','fait','annule'  
                )),  
  priorite      INTEGER DEFAULT 3 CHECK(priorite BETWEEN 1 AND 5),  
  energie       TEXT CHECK(energie IN ('faible','moyenne','elevee')),  
  echeance      DATE,  
  rappel        TIMESTAMP,  
  recurrence    TEXT,  
  complete\_le   TIMESTAMP,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- \============================================================  
\-- TABLE 8 : ARTEFACTS (Documents \+ Preuves \+ Médias)  
\-- Tout fichier physique du système  
\-- \============================================================  
CREATE TABLE artefacts (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  artefact\_id     TEXT UNIQUE NOT NULL,  \-- 'PRV-2026-000001' ou 'DOC-2026-000001'  
  nom             TEXT NOT NULL,  
  type            TEXT CHECK(type IN (  
                    'preuve','document','media','export','rapport','autre'  
                  )),  
  categorie       TEXT,  
  vault\_path      TEXT NOT NULL,  
  work\_path       TEXT,  
  hash\_sha256     TEXT,  
  taille\_octets   INTEGER,  
  source          TEXT,  
  cerveau\_id      INTEGER REFERENCES cerveaux(id),  
  projet\_id       INTEGER REFERENCES projets(id),  
  evenement\_id    INTEGER REFERENCES evenements(id),  
  personne\_id     INTEGER REFERENCES personnes(id),  
  certifie        BOOLEAN DEFAULT 0,  
  certifie\_le     TIMESTAMP,  
  notes           TEXT,  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- \============================================================  
\-- TABLE TRANSVERSALE : JOURNAL DE BORD (audit append-only)  
\-- \============================================================  
CREATE TABLE journal\_audit (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  action        TEXT NOT NULL CHECK(action IN (  
                  'import','deplacement','renommage','lien',  
                  'certification','modification','suppression',  
                  'note','approbation','rejet'  
                )),  
  artefact\_id   TEXT,  
  entite\_type   TEXT,  \-- 'tache','projet','evenement','personne'  
  entite\_id     INTEGER,  
  qui           TEXT DEFAULT 'Alyson',  
  quand         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP,  
  pourquoi      TEXT,  
  hash\_avant    TEXT,  
  hash\_apres    TEXT  
);  
\-- NOTE : Cette table ne doit JAMAIS être mise à jour (INSERT uniquement)

---

## **4\. LES 4 CERVEAUX — TABLES SPÉCIALISÉES**

### **Cerveau 1 — Identité & Psychologie (le plus sensible)**

\-- Profil d'Alyson — source de vérité identitaire  
CREATE TABLE profil\_identite (  
  cle           TEXT PRIMARY KEY,  
  valeur        TEXT NOT NULL,  
  categorie     TEXT CHECK(categorie IN (  
                  'trait','besoin','valeur','pattern',  
                  'force','faiblesse','declencheur','ambition'  
                )),  
  source        TEXT,  \-- 'auto-declaration','observation','therapeute'  
  confiance     INTEGER DEFAULT 3 CHECK(confiance BETWEEN 1 AND 5),  
  derniere\_maj  DATE  
);

\-- Journal intime  
CREATE TABLE journal\_intime (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  date\_entree   DATE NOT NULL,  
  humeur        INTEGER CHECK(humeur BETWEEN 1 AND 10),  
  energie       INTEGER CHECK(energie BETWEEN 1 AND 10),  
  contenu       TEXT NOT NULL,  
  themes        TEXT,  
  personnes     TEXT,  
  evenement\_id  INTEGER REFERENCES evenements(id),  
  prive         BOOLEAN DEFAULT 1,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Objectifs personnels  
CREATE TABLE objectifs (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  description   TEXT,  
  type          TEXT CHECK(type IN ('vie','annuel','mensuel','hebdo','quotidien')),  
  cerveau\_id    INTEGER REFERENCES cerveaux(id),  
  statut        TEXT DEFAULT 'actif',  
  progression   INTEGER DEFAULT 0 CHECK(progression BETWEEN 0 AND 100),  
  date\_cible    DATE,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Habitudes  
CREATE TABLE habitudes (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  frequence     TEXT CHECK(frequence IN ('quotidien','hebdo','mensuel')),  
  categorie     TEXT,  
  actif         BOOLEAN DEFAULT 1,  
  serie\_actuelle INTEGER DEFAULT 0,  
  meilleure\_serie INTEGER DEFAULT 0,  
  derniere\_fois  DATE  
);

CREATE TABLE habitudes\_log (  
  id          INTEGER PRIMARY KEY AUTOINCREMENT,  
  habitude\_id INTEGER REFERENCES habitudes(id),  
  date\_log    DATE NOT NULL,  
  complete    BOOLEAN DEFAULT 1,  
  note        TEXT  
);

### **Cerveau 2 — Vie Personnelle**

\-- Agenda (complète les taches pour événements calendrier)  
CREATE TABLE agenda (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  type          TEXT CHECK(type IN (  
                  'rdv','sortie','rappel','anniversaire',  
                  'voyage','activite','autre'  
                )),  
  debut         TIMESTAMP NOT NULL,  
  fin           TIMESTAMP,  
  lieu          TEXT,  
  personnes     TEXT,  
  notes         TEXT,  
  recurrence    TEXT,  
  rappel\_avant  INTEGER,  \-- minutes avant  
  statut        TEXT DEFAULT 'planifie',  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Recettes  
CREATE TABLE recettes (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  description   TEXT,  
  ingredients   TEXT NOT NULL,  \-- JSON : \[{nom, quantite, unite}\]  
  etapes        TEXT,  
  temps\_prep    INTEGER,  \-- minutes  
  temps\_cuisson INTEGER,  
  portions      INTEGER,  
  categories    TEXT,  
  tags          TEXT,  
  source        TEXT,  
  note          INTEGER CHECK(note BETWEEN 1 AND 5),  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Liste d'épicerie  
CREATE TABLE liste\_epicerie (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  item          TEXT NOT NULL,  
  quantite      TEXT,  
  unite         TEXT,  
  magasin       TEXT,  
  special       TEXT,  
  prix\_estime   REAL,  
  recette\_id    INTEGER REFERENCES recettes(id),  
  complete      BOOLEAN DEFAULT 0,  
  semaine       TEXT,  \-- 'YYYY-WXX'  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Abonnements & services actifs  
CREATE TABLE abonnements (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  service       TEXT NOT NULL,  
  categorie     TEXT,  
  montant       REAL,  
  frequence     TEXT CHECK(frequence IN ('mensuel','annuel','hebdo','unique')),  
  devise        TEXT DEFAULT 'CAD',  
  renouvellement DATE,  
  statut        TEXT DEFAULT 'actif' CHECK(statut IN ('actif','pause','annule')),  
  valeur\_reelle INTEGER DEFAULT 3 CHECK(valeur\_reelle BETWEEN 1 AND 5),  
  notes         TEXT,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Contenus suivis (podcasts, artistes, chaînes)  
CREATE TABLE contenus\_suivis (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  type          TEXT CHECK(type IN ('podcast','artiste','chaine','newsletter','blog')),  
  source\_url    TEXT,  
  rss\_url       TEXT,  
  actif         BOOLEAN DEFAULT 1,  
  derniere\_notif TIMESTAMP,  
  notes         TEXT  
);

### **Cerveau 3 — Entreprise**

\-- Pipeline de vente  
CREATE TABLE opportunites (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  titre         TEXT NOT NULL,  
  client\_id     INTEGER REFERENCES personnes(id),  
  valeur        REAL,  
  devise        TEXT DEFAULT 'CAD',  
  etape         TEXT CHECK(etape IN (  
                  'lead','contact','proposition',  
                  'negociation','signe','livre','paye','perdu'  
                )),  
  probabilite   INTEGER CHECK(probabilite BETWEEN 0 AND 100),  
  date\_cible    DATE,  
  notes         TEXT,  
  projet\_id     INTEGER REFERENCES projets(id),  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Offres / Devis  
CREATE TABLE offres (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  reference     TEXT UNIQUE NOT NULL,  
  client\_id     INTEGER REFERENCES personnes(id),  
  opportunite\_id INTEGER REFERENCES opportunites(id),  
  description   TEXT,  
  montant       REAL,  
  statut        TEXT DEFAULT 'brouillon' CHECK(statut IN (  
                  'brouillon','envoye','accepte','refuse','expire'  
                )),  
  date\_envoi    DATE,  
  date\_expiration DATE,  
  notes         TEXT,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Factures  
CREATE TABLE factures (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  numero        TEXT UNIQUE NOT NULL,  
  client\_id     INTEGER REFERENCES personnes(id),  
  offre\_id      INTEGER REFERENCES offres(id),  
  montant\_ht    REAL,  
  tva           REAL DEFAULT 0,  
  montant\_ttc   REAL,  
  statut        TEXT DEFAULT 'emise' CHECK(statut IN (  
                  'brouillon','emise','payee','en\_retard','annulee'  
                )),  
  date\_emission DATE,  
  date\_echeance DATE,  
  date\_paiement DATE,  
  notes         TEXT,  
  artefact\_id   INTEGER REFERENCES artefacts(id),  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- KPIs entreprise  
CREATE TABLE kpis (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  nom           TEXT NOT NULL,  
  aire\_id       INTEGER REFERENCES aires(id),  
  valeur        REAL,  
  unite         TEXT,  
  cible         REAL,  
  periode       TEXT,  
  date\_mesure   DATE,  
  notes         TEXT  
);

### **Cerveau 4 — Finances**

\-- Comptes financiers  
CREATE TABLE comptes\_financiers (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  nom           TEXT NOT NULL,  
  type          TEXT CHECK(type IN (  
                  'banque','carte\_credit','epargne',  
                  'investissement','cash','crypto'  
                )),  
  institution   TEXT,  
  solde\_actuel  REAL DEFAULT 0,  
  devise        TEXT DEFAULT 'CAD',  
  actif         BOOLEAN DEFAULT 1,  
  notes         TEXT,  
  derniere\_maj  DATE  
);

\-- Transactions  
CREATE TABLE transactions (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  date\_tx       DATE NOT NULL,  
  description   TEXT NOT NULL,  
  montant       REAL NOT NULL,  
  type          TEXT CHECK(type IN ('revenu','depense','transfert','remboursement')),  
  categorie     TEXT,  
  sous\_categorie TEXT,  
  compte\_id     INTEGER REFERENCES comptes\_financiers(id),  
  compte\_dest\_id INTEGER REFERENCES comptes\_financiers(id),  
  projet\_id     INTEGER REFERENCES projets(id),  
  artefact\_id   INTEGER REFERENCES artefacts(id),  
  notes         TEXT,  
  cree\_le       TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Budget  
CREATE TABLE budget (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  categorie     TEXT NOT NULL,  
  enveloppe     REAL NOT NULL,  
  periode       TEXT DEFAULT 'mensuel',  
  annee         INTEGER,  
  mois          INTEGER,  
  alerte\_seuil  INTEGER DEFAULT 80,  \-- % avant alerte  
  notes         TEXT  
);

\-- Placements  
CREATE TABLE placements (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  nom           TEXT NOT NULL,  
  type          TEXT CHECK(type IN ('action','etf','oblig','crypto','immo','autre')),  
  symbole       TEXT,  
  compte\_id     INTEGER REFERENCES comptes\_financiers(id),  
  quantite      REAL,  
  prix\_achat    REAL,  
  prix\_actuel   REAL,  
  devise        TEXT DEFAULT 'CAD',  
  date\_achat    DATE,  
  notes         TEXT,  
  derniere\_maj  DATE  
);

---

## **5\. MODULES SPÉCIALISÉS**

### **Module Voyages**

CREATE TABLE voyages (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  destination   TEXT NOT NULL,  
  type          TEXT CHECK(type IN ('solo','groupe','affaires','detente')),  
  date\_depart   DATE,  
  date\_retour   DATE,  
  budget\_prevu  REAL,  
  budget\_reel   REAL,  
  statut        TEXT DEFAULT 'planifie',  
  notes         TEXT,  
  projet\_id     INTEGER REFERENCES projets(id)  
);

CREATE TABLE reservations (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  voyage\_id     INTEGER REFERENCES voyages(id),  
  type          TEXT CHECK(type IN ('vol','hotel','transport','activite','autre')),  
  fournisseur   TEXT,  
  reference     TEXT,  
  date\_debut    TIMESTAMP,  
  date\_fin      TIMESTAMP,  
  montant       REAL,  
  statut        TEXT DEFAULT 'confirme',  
  artefact\_id   INTEGER REFERENCES artefacts(id),  
  notes         TEXT  
);

### **Module Santé & Bien-être**

CREATE TABLE sante\_logs (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  date\_log      DATE NOT NULL,  
  type          TEXT CHECK(type IN (  
                  'sommeil','energie','humeur','symptome',  
                  'medicament','activite','nutrition'  
                )),  
  valeur        TEXT,  
  unite         TEXT,  
  notes         TEXT  
);

CREATE TABLE rdv\_medicaux (  
  id            INTEGER PRIMARY KEY AUTOINCREMENT,  
  date\_rdv      TIMESTAMP NOT NULL,  
  type          TEXT,  
  praticien\_id  INTEGER REFERENCES personnes(id),  
  notes         TEXT,  
  suivi         TEXT,  
  agenda\_id     INTEGER REFERENCES agenda(id)  
);

---

## **6\. SYSTÈME DE PREUVES ET D'INTÉGRITÉ**

### **Règles immuables**

1. Tout fichier ingéré → copie dans `VAULT\` en lecture seule  
2. Tout fichier de travail → copie dans `WORK\`  
3. Jamais modifier un fichier dans VAULT  
4. Toute modification \= nouvelle version avec nouveau hash  
5. Le journal\_audit est INSERT ONLY — aucun UPDATE ni DELETE

### **Workflow d'ingestion (n8n)**

Fichier déposé dans INBOX\\  
        ↓  
Calcul SHA-256  
        ↓  
Génération EvidenceID (PRV-YYYY-XXXXXX)  
        ↓  
Copie vers VAULT\\preuves\\PRV-YYYY-XXXXXX\\  
        ↓  
Écriture dans manifest.csv (LOGS\\)  
        ↓  
INSERT dans artefacts \+ journal\_audit  
        ↓  
Notification Roxxy "nouveau fichier ingéré"

### **Format EvidenceID**

* Preuves : `PRV-2026-000001`  
* Documents : `DOC-2026-000001`  
* Médias : `MED-2026-000001`  
* Exports : `EXP-2026-000001`

### **Manifest CSV (LOGS\\manifest.csv)**

EvidenceID,nom,hash\_sha256,taille\_octets,date\_ingestion,source,vault\_path,certifie  
PRV-2026-000001,contrat.pdf,abc123...,245760,2026-05-28T14:32:00,email,VAULT/preuves/PRV-2026-000001/,0

---

## **7\. ROXXY — GOUVERNANCE ET DIRECTIVES**

### **Identité de Roxxy**

* **Nom** : Roxxy  
* **Rôle** : Orchestratrice conversationnelle et clone cognitif d'Alyson  
* **Persona** : confidente, coach, gestionnaire, conseillère — toujours du côté d'Alyson  
* **Moteur** : Ollama / Mistral local (phase 1\) → modèle plus puissant si budget disponible

### **Conseil Exécutif Central**

| Poste | Responsabilité |
| ----- | ----- |
| Présidente Exécutive (Roxxy) | Vision, arbitrage, cohérence identitaire |
| Directrice de Cabinet | Routing des requêtes, priorisation |
| Directrice Gouvernance | Règles, permissions, SOP |
| Directrice Mémoire & Contexte | Cohérence entre cerveaux, mémoire long terme |
| Directrice Sécurité | Vault, hash, audit, confidentialité |
| Directrice Systèmes | Infrastructure, SQL, n8n, Ollama |

### **Règles de routing de Roxxy**

Chaque entrée → Roxxy produit obligatoirement :

1. **Cerveau** : identite / vie\_perso / entreprise / finances  
2. **Type** : item / tache / projet / evenement / artefact / journal  
3. **Action** : écrire en DB / lancer automation / demander clarification  
4. **Risque** : faible (auto) / élevé (validation Alyson requise)

### **Ce que Roxxy peut faire seule (faible risque)**

* Écrire dans toutes les tables  
* Générer des résumés, rapports, listes  
* Lancer des automations de lecture  
* Classer, tagger, relier des entrées  
* Envoyer des notifications internes

### **Ce qui nécessite validation d'Alyson (risque élevé)**

* Supprimer ou modifier un artefact dans VAULT  
* Envoyer vers l'extérieur (email avocate, dépôt officiel)  
* Exécuter une transaction financière  
* Toute action irréversible

### **Ce que Roxxy ne fait jamais**

* Poser un diagnostic médical ou psychologique  
* Donner un conseil juridique définitif  
* Prédire l'issue d'une procédure légale  
* Affirmer "tu as définitivement raison selon l'article X"

---

## **8\. AGENTS SPÉCIALISÉS — FICHES DE RÔLES**

### **Agent 1 — Analyste de Documents**

**Mission** : extraire, structurer et router l'information de tout document déposé dans le système — du texte brut au PDF volumineux — avec une précision qui s'améliore à chaque itération.

**Principe d'amélioration continue** : les directives alimentent le modèle. Plus on corrige et précise, plus l'agent devient exactement ce qu'on veut. C'est un outil vivant, pas figé.

---

#### **Tables SQL dédiées à l'agent analyste**

\-- File d'attente des documents à analyser  
CREATE TABLE analyse\_queue (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  artefact\_id     INTEGER REFERENCES artefacts(id) NOT NULL,  
  statut          TEXT DEFAULT 'a\_analyser' CHECK(statut IN (  
                    'a\_analyser','en\_cours','phase1\_complete',  
                    'phase2\_en\_cours','complete','erreur'  
                  )),  
  priorite        INTEGER DEFAULT 3 CHECK(priorite BETWEEN 1 AND 5),  
  directives      TEXT,  \-- instructions spécifiques pour ce document  
  tentatives      INTEGER DEFAULT 0,  
  derniere\_erreur TEXT,  
  debut\_analyse   TIMESTAMP,  
  fin\_analyse     TIMESTAMP,  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Résultats Phase 1 : table des matières structurée  
CREATE TABLE analyse\_toc (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  analyse\_id      INTEGER REFERENCES analyse\_queue(id) NOT NULL,  
  topic\_id        TEXT NOT NULL,       \-- 'T1', 'T2', etc.  
  titre\_sujet     TEXT NOT NULL,  
  secteur         TEXT CHECK(secteur IN (  
                    'vie\_personnelle','entreprise','finance',  
                    'automatisation','juridique','sante',  
                    'psychologie','education','loisirs','autre'  
                  )),  
  categories      TEXT NOT NULL,       \-- JSON array \["recit\_de\_vie","journal","ligne\_du\_temps"\]  
  agents\_concernes TEXT NOT NULL,      \-- JSON array \["psychologue","avocate","comptable"\]  
  description     TEXT NOT NULL,  
  signaux         TEXT,                \-- JSON array de mots-clés détectés  
  confiance       REAL DEFAULT 0.8,   \-- 0.0 à 1.0  
  page\_debut      INTEGER,  
  page\_fin        INTEGER,  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Résultats Phase 2 : extractions ciblées  
CREATE TABLE analyse\_extractions (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  analyse\_id      INTEGER REFERENCES analyse\_queue(id) NOT NULL,  
  topic\_id        TEXT,                \-- lien vers analyse\_toc.topic\_id  
  type\_extraction TEXT CHECK(type\_extraction IN (  
                    'fait','chronologie','citation','entite',  
                    'decision','chiffre','symptome','conflict'  
                  )),  
  contenu         TEXT NOT NULL,       \-- le contenu extrait  
  localisation    TEXT,               \-- 'page 3, paragraphe 2'  
  destination\_table TEXT,             \-- 'evenements','personnes','transactions'  
  destination\_id  INTEGER,            \-- ID une fois écrit  
  ecrit\_en\_db     BOOLEAN DEFAULT 0,  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Directives évolutives (alimentées en continu)  
CREATE TABLE analyse\_directives (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  version         TEXT NOT NULL,       \-- 'v1.0', 'v1.1'  
  titre           TEXT NOT NULL,  
  type            TEXT CHECK(type IN (  
                    'taxonomie\_secteur','mapping\_agents',  
                    'regle\_categorie','exemple\_correction',  
                    'instruction\_style','filtre\_sensibilite'  
                  )),  
  contenu         TEXT NOT NULL,       \-- la directive en texte  
  actif           BOOLEAN DEFAULT 1,  
  priorite        INTEGER DEFAULT 3,  
  cree\_le         TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

\-- Flags de sensibilité par document  
CREATE TABLE analyse\_flags (  
  id              INTEGER PRIMARY KEY AUTOINCREMENT,  
  analyse\_id      INTEGER REFERENCES analyse\_queue(id) NOT NULL,  
  contient\_donnees\_perso   BOOLEAN DEFAULT 0,  
  contient\_conflit\_legal   BOOLEAN DEFAULT 0,  
  contient\_trauma\_abus     BOOLEAN DEFAULT 0,  
  contient\_numeros\_comptes BOOLEAN DEFAULT 0,  
  contient\_donnees\_sante   BOOLEAN DEFAULT 0,  
  questions\_ouvertes       TEXT,   \-- JSON array de points ambigus  
  cree\_le                  TIMESTAMP DEFAULT CURRENT\_TIMESTAMP  
);

---

#### **Taxonomie des secteurs et catégories**

| Secteur | Catégories possibles |
| ----- | ----- |
| `vie_personnelle` | recit\_de\_vie, journal\_intime, ligne\_du\_temps, habitudes, objectifs\_perso, relations, bien\_etre, identite |
| `entreprise` | strategie, marketing, vente, operations, rh, produit, client, contrat\_affaires |
| `finance` | budget, depenses, revenus, impots, placements, dettes, abonnements, epargne |
| `juridique` | conflit\_familial, separation, garde, pension, litige\_civil, mise\_en\_demeure, contrat |
| `psychologie` | trauma, anxiete, depression, pattern\_comportemental, estime\_soi, relation\_toxique |
| `sante` | symptomes, medicaments, rdv\_medicaux, habitudes\_sante, bilan |
| `automatisation` | sop, workflow, outil, script, processus, integration |
| `education` | formation, competence, recherche, apprentissage |
| `loisirs` | voyage, sortie, culture, musique, lecture, cuisine |

---

#### **Mapping signaux → agents concernés**

| Signaux détectés | Agents concernés |
| ----- | ----- |
| trauma, abus, violence, anxiété, dépression, peur | psychologue, thérapeute |
| ex-conjoint, séparation, garde, pension, divorce, conflit | avocate (droit familial), médiatrice |
| impôts, dettes, budget, factures, revenus, fiscalité | comptable, conseillère\_financiere |
| contrat, mise en demeure, litige, poursuite | avocate (civil/affaires) |
| processus, automatisation, SOP, workflow, outil | agent\_automatisation |
| santé, symptôme, médecin, médicament | agent\_sante |
| voyage, sortie, activité, loisir | agent\_lifestyle |
| stratégie, client, vente, marketing | agent\_business |

---

#### **Pipeline complet — Phase 0 à Phase 3**

**Phase 0 — Ingestion technique** (automatique via Flux 1\)

* Fichier déposé dans `INBOX\` → hash SHA-256 → copie VAULT  
* INSERT dans `artefacts` \+ `analyse_queue` (statut \= `a_analyser`)  
* Extraction texte : PDF natif en priorité, sinon OCR sur copie WORK  
* Si document \> 15 000 caractères → découpage en chunks de 8 000 caractères avec overlap de 500

**Phase 1 — Carte du document** (sortie structurée automatique)

Le modèle produit **obligatoirement** ce JSON :

{  
  "document\_title": "Titre détecté ou nom du fichier",  
  "type\_document": "rapport|courriel|decision|contrat|note|journal|conversation",  
  "toc": \[  
    {  
      "topic\_id": "T1",  
      "titre\_sujet": "Titre clair du sujet",  
      "secteur": "vie\_personnelle",  
      "categories": \["journal\_intime", "ligne\_du\_temps"\],  
      "agents\_concernes": \["psychologue", "thérapeute"\],  
      "description": "Description détaillée de 3-5 phrases. Ce qui est abordé, le contexte, les éléments clés, sans paraphraser platement.",  
      "signaux": \["mot-clé 1", "mot-clé 2"\],  
      "confiance": 0.85,  
      "page\_debut": 1,  
      "page\_fin": 3  
    }  
  \],  
  "tags\_globaux": \["tag1", "tag2"\],  
  "flags\_sensibilite": {  
    "contient\_donnees\_perso": true,  
    "contient\_conflit\_legal": false,  
    "contient\_trauma\_abus": false,  
    "contient\_numeros\_comptes": false,  
    "contient\_donnees\_sante": false  
  },  
  "questions\_ouvertes": \["Point ambigu qui mérite clarification"\]  
}

Roxxy lit ce rapport, valide ou ajuste, et décide des cibles Phase 2\.

**Phase 2 — Extraction ciblée** (guidée par Roxxy)

* Roxxy choisit les `topic_id` à approfondir  
* L'agent extrait avec localisation précise : `"page 3, paragraphe 2, ligne 4"`  
* Jamais de paraphrase seule — toujours la citation exacte \+ interprétation  
* INSERT dans `analyse_extractions` avec `destination_table` et `destination_id`

**Phase 3 — Écriture en base \+ traçabilité**

* Écriture dans les tables cibles (`evenements`, `personnes`, `journal_intime`, etc.)  
* Mise à jour `analyse_extractions.ecrit_en_db = 1`  
* INSERT dans `journal_audit` (action \= 'import', pourquoi \= 'analyse phase 3')  
* Statut `analyse_queue` → `complete`

---

#### **Directives évolutives — Version initiale (v1.0)**

Ces directives sont stockées dans `analyse_directives` et injectées dans le prompt à chaque analyse.

DIRECTIVE v1.0 — TAXONOMIE SECTEURS  
Utiliser EXACTEMENT les secteurs définis : vie\_personnelle, entreprise, finance,  
automatisation, juridique, sante, psychologie, education, loisirs, autre.  
Ne jamais inventer un nouveau secteur. Si ambigu → choisir le plus probable \+ confiance \< 0.7.

DIRECTIVE v1.0 — DESCRIPTIONS  
Chaque description doit répondre à : Qui ? Quoi ? Quand (si mentionné) ? Quel contexte ?  
Minimum 3 phrases. Ne pas répéter le titre. Donner suffisamment de détails pour décider  
quelle agente doit intervenir sans relire le document.

DIRECTIVE v1.0 — AGENTS  
Toujours lister les agents au pluriel si pertinent (plusieurs peuvent s'appliquer).  
Ordre de priorité : agent le plus directement concerné en premier.  
Si trauma ET conflit légal → psychologue ET avocate (les deux).

DIRECTIVE v1.0 — SENSIBILITÉ  
Si le document contient des noms réels, numéros de téléphone, adresses, numéros de compte  
→ activer les flags correspondants.  
Ne jamais inclure ces informations dans les descriptions de la table des matières.

DIRECTIVE v1.0 — CONFIANCE  
confiance \>= 0.85 : classification certaine  
confiance 0.60-0.84 : probable, Roxxy valide  
confiance \< 0.60 : ambigu, ajouter à questions\_ouvertes

---

### **Agent 2 — Dossier & Structuration**

**Mission** : organiser les informations sensibles (sans conseil juridique)

**Peut faire** :

* Table des matières, chronologies, index de preuves  
* Mapping "faits → éléments à démontrer" (préparation)  
* Citations vers textes officiels, lois, guides gouvernementaux  
* Questions à apporter à une avocate

**Ne fait jamais** :

* Dire quoi plaider  
* Prédire l'issue  
* Affirmer "tu as raison selon l'article X"

---

### **Agent 3 — Profil Psychologique**

**Mission** : observer les patterns sans diagnostiquer

**Peut faire** :

* Identifier thèmes récurrents (isolement, contrôle, déclencheurs)  
* Chronologie d'impact (symptômes rapportés, conséquences concrètes)  
* Corrélations ("après tel événement, tu rapportes X")  
* Questions à apporter à une psychologue

**Ne fait jamais** :

* "Tu as le trouble X"  
* Conclusions cliniques

---

### **Agent 4 — Finance Tracker**

**Mission** : suivre, analyser, alerter — sans exécuter seul

**Peut faire** :

* Catégoriser les transactions  
* Détecter anomalies et dépassements de budget  
* Générer rapports cashflow, tendances  
* Préparer pour impôts (classification, récapitulatifs)  
* Proposer des simulations

**Validation requise pour** :

* Tout mouvement financier réel  
* Déclarations officielles

---

### **Agent 5 — Lifestyle Curator**

**Mission** : quotidien, découvertes, alimentation, loisirs

**Capacités** :

* Surveiller RSS podcasts/artistes → notifier Inbox  
* Trouver sorties peu coûteuses selon critères  
* Générer menu semaine \+ liste épicerie regroupée par magasin  
* Suggérer activités selon humeur/énergie du jour

---

### **Agent 6 — Business Ops**

**Mission** : pipeline, projets, livrables, facturation

**Capacités** :

* Gérer le pipeline opportunités → offres → factures  
* Déclencher checklists projets à la signature  
* Weekly review business automatique  
* Relances paiements

---

### **Agent 7 — Vault & Audit**

**Mission** : intégrité des preuves, journalisation, certification

**Capacités** :

* Calculer SHA-256 à l'ingestion  
* Écrire dans manifest.csv \+ journal\_audit  
* Vérifier intégrité périodique (re-hash \+ comparaison)  
* Alerter si hash ne correspond plus

---

## **9\. AUTOMATISATIONS N8N — PLAN DE FLUX**

### **Flux 1 — Ingestion de preuve**

Trigger: Fichier déposé dans INBOX\\  
→ Calculer SHA-256 (node Execute Command)  
→ Générer EvidenceID (node Code)  
→ Copier vers VAULT\\ (node Move Binary File)  
→ Écrire manifest.csv (node Append to File)  
→ INSERT artefacts \+ journal\_audit (node SQLite)  
→ Notification Roxxy (node Webhook interne)

### **Flux 2 — Capture Inbox universelle**

Trigger: Message à Roxxy / Email / Formulaire  
→ Classification par Ollama (type \+ cerveau \+ urgence)  
→ INSERT dans items (node SQLite)  
→ Si urgence ≥ 4 → créer tache immédiatement  
→ Retour : "Capturé dans \[aire\] — \[action suggérée\]"

### **Flux 3 — Weekly Review automatique**

Trigger: Dimanche 18h00  
→ Requête SQL : taches complétées cette semaine  
→ Requête SQL : projets en retard  
→ Requête SQL : transactions de la semaine  
→ Requête SQL : habitudes (séries)  
→ Ollama génère résumé \+ recommandations  
→ Sauvegarde dans items (type: rapport)  
→ Notification

### **Flux 4 — Alerte budget**

Trigger: Nouvelle transaction insérée  
→ Calcul total catégorie du mois (SQL)  
→ Si \> seuil% de l'enveloppe → alerte Roxxy  
→ Roxxy notifie Alyson avec contexte

### **Flux 6 — Analyse de documents Phase 1 (MVP)**

Trigger: Nouveau enregistrement dans analyse\_queue (statut \= 'a\_analyser')  
  \[SQLite Trigger ou polling toutes les 5 min\]  
        ↓  
Verrouillage : UPDATE analyse\_queue SET statut='en\_cours', debut\_analyse=now()  
        ↓  
Récupérer artefact : SELECT vault\_path, nom FROM artefacts WHERE id \= ?  
        ↓  
Extraction texte (node Execute Command) :  
  Si PDF → pdftotext vault\_path/fichier.pdf \- (texte vers stdout)  
  Si DOCX → LibreOffice headless → export txt  
  Si TXT → lecture directe  
        ↓  
Charger directives actives :  
  SELECT contenu FROM analyse\_directives WHERE actif=1 ORDER BY priorite  
        ↓  
Si longueur texte \> 15000 chars → chunking (node Code)  
  Découper en chunks 8000 chars \+ overlap 500  
  Stratégie MAP : analyser chaque chunk → listes de sujets partielles  
  Stratégie REDUCE : fusionner, dédupliquer, harmoniser secteurs  
Sinon → 1 seul appel LLM  
        ↓  
Appel Ollama (node HTTP Request → localhost:11434/api/generate)  
  Modèle : mistral (ou llama3 si disponible)  
  Prompt : \[directives\] \+ \[texte\] \+ \[schéma JSON attendu\]  
  Température : 0.2 (précision \> créativité)  
        ↓  
Parsing JSON (node Code) :  
  Valider structure  
  Si invalide → retry 1 fois avec prompt de correction  
  Si toujours invalide → statut='erreur', log erreur  
        ↓  
Écriture résultats (node SQLite) :  
  INSERT INTO analyse\_toc (un INSERT par topic)  
  INSERT INTO analyse\_flags  
  UPDATE analyse\_queue SET statut='phase1\_complete'  
        ↓  
Entrée journal\_audit (action='import', pourquoi='analyse\_phase1')  
        ↓  
Notification Roxxy : "Phase 1 complète — \[N\] sujets identifiés — validation requise"

### **Flux 7 — Analyse Phase 2 (extraction ciblée, déclenché manuellement)**

Trigger: Roxxy approuve Phase 1 \+ spécifie les topic\_id cibles  
  \[Webhook depuis Open WebUI ou entrée manuelle\]  
        ↓  
Récupérer topics ciblés :  
  SELECT \* FROM analyse\_toc WHERE analyse\_id=? AND topic\_id IN (cibles)  
        ↓  
Pour chaque topic :  
  Relire le chunk correspondant (page\_debut → page\_fin)  
  Appel Ollama avec directive d'extraction précise :  
    "Extrais tous les faits vérifiables, citations exactes avec localisation,  
     entités nommées, dates, et détermine la table de destination."  
        ↓  
INSERT INTO analyse\_extractions (un par extraction)  
        ↓  
Si destination connue et confiance \>= 0.85 :  
  INSERT automatique dans la table cible (evenements / personnes / journal\_intime / etc.)  
  Mettre à jour analyse\_extractions.ecrit\_en\_db \= 1  
Sinon :  
  Marquer pour validation Alyson  
        ↓  
UPDATE analyse\_queue SET statut='complete', fin\_analyse=now()  
        ↓  
Entrée journal\_audit (action='import', pourquoi='analyse\_phase2')  
        ↓  
Notification Roxxy : "Phase 2 complète — \[N\] extractions — \[M\] en attente de validation"

### **Flux 8 — Mise à jour des directives (amélioration continue)**

Trigger: Alyson soumet une correction ou nouvelle règle  
  \[Webhook ou formulaire simple\]  
        ↓  
Roxxy formate la correction en directive structurée  
        ↓  
INSERT INTO analyse\_directives (nouvelle version)  
        ↓  
Désactiver l'ancienne version si remplacement :  
  UPDATE analyse\_directives SET actif=0 WHERE titre=? AND version \< nouvelle\_version  
        ↓  
Confirmation : "Directive \[titre\] v\[X\] active — sera appliquée aux prochaines analyses"

---

## **10\. ROADMAP DE DÉPLOIEMENT**

### **Phase 0 — Jour J (nouveau portable arrivé)**

* \[ \] Installer Docker Desktop  
* \[ \] Installer Ollama \+ `ollama pull mistral`  
* \[ \] Installer Open WebUI  
* \[ \] Installer DB Browser for SQLite  
* \[ \] Installer Obsidian  
* \[ \] Créer structure `C:\Roxxy\`  
* \[ \] Créer `roxxy.db` avec les 8 tables noyau

### **Phase 1 — Semaine 1 : Colonne vertébrale**

* \[ \] Insérer les 4 cerveaux \+ aires de base  
* \[ \] Créer les tables des 4 cerveaux  
* \[ \] Créer les tables agent analyste : `analyse_queue`, `analyse_toc`, `analyse_extractions`, `analyse_directives`, `analyse_flags`  
* \[ \] Insérer les directives v1.0 dans `analyse_directives`  
* \[ \] Configurer n8n via Docker  
* \[ \] Flux d'ingestion preuve (Flux 1\)  
* \[ \] Flux de capture Inbox (Flux 2\)  
* \[ \] Flux analyse Phase 1 (Flux 6\) — MVP  
* \[ \] Commencer à alimenter profil\_identite \+ evenements

### **Phase 2 — Semaine 2 : Business in a box**

* \[ \] Tables opportunites \+ offres \+ factures  
* \[ \] Flux email client → opportunité  
* \[ \] Pipeline dashboard (requête SQL → rapport Roxxy)  
* \[ \] Agent Business Ops opérationnel

### **Phase 3 — Semaine 3 : Finance in a box**

* \[ \] Tables comptes \+ transactions \+ budget  
* \[ \] Import abonnements existants  
* \[ \] Alertes budget (Flux 4\)  
* \[ \] Agent Finance Tracker opérationnel

### **Phase 4 — Semaine 4 : Lifestyle**

* \[ \] Tables recettes \+ liste\_epicerie \+ contenus\_suivis  
* \[ \] Flux RSS (Flux 5\)  
* \[ \] Agent Lifestyle Curator opérationnel  
* \[ \] Premières recettes \+ liste épicerie testée

### **Phase 5 — Mois 2 : Raffinement**

* \[ \] Flux analyse Phase 2 (Flux 7\) — extraction ciblée  
* \[ \] Flux mise à jour directives (Flux 8\) — amélioration continue  
* \[ \] Premières corrections → nouvelles directives v1.1, v1.2...  
* \[ \] Weekly Review automatique (Flux 3\)  
* \[ \] Migration PostgreSQL si volume \> 5 Go  
* \[ \] Ajout pgvector pour mémoire sémantique (recherche dans les analyses)

### **Phase 6 — Mois 3+ : Évolution**

* \[ \] Voix (STT/TTS local via Whisper \+ Piper)  
* \[ \] Dashboard visuel (Grafana ou Metabase, gratuits)  
* \[ \] Robot de trading (sandbox \+ supervision obligatoire)  
* \[ \] Connexion API externe si revenus disponibles

---

## **11\. RÈGLES FONDAMENTALES DU SYSTÈME**

### **Règles de données**

1. Tout a une clé primaire auto-incrémentée  
2. Tout a un `cree_le` timestamp  
3. Rien n'est supprimé — on archive (statut \= 'archive')  
4. journal\_audit \= INSERT ONLY, jamais UPDATE ni DELETE  
5. VAULT \= lecture seule, jamais modifié

### **Règles d'agents**

1. Un agent \= une mission \= une sortie structurée  
2. Toute action destructrice \= validation Alyson  
3. Toute création de workflow \= sandbox → test → prod  
4. Citations toujours localisées (page/section) pour les documents  
5. Niveau de confiance déclaré sur chaque extraction

### **Règles de Roxxy**

1. Toujours du côté d'Alyson  
2. Pas de diagnostic · Pas de conseil juridique définitif  
3. Transparence totale sur les limites  
4. Autopilot supervisé pour tout ce qui est irréversible  
5. La mémoire d'Alyson est sacrée et protégée

### **Gestion de la mémoire sur 256 Go SSD**

* SQLite : \< 100 Mo pour des années de données textuelles  
* VAULT : comprimer les médias non essentiels  
* Nettoyage WORK\\ mensuel (fichiers temporaires)  
* Backup hebdomadaire sur disque externe ou clé USB  
* Jamais stocker de vidéos dans VAULT (liens seulement)

---

*Document généré le 2026-05-28 — Mise à jour v1.1 le 2026-05-28* *Prochaine révision : à chaque changement d'architecture majeur* *Propriétaire : Alyson · Système : Roxxy v1.1*

