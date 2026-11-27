/*
 * Alyson Virtuelle — plugin maison d'Alyson.
 * Un seul plugin, organisé en modules, pour éviter d'empiler des dizaines de plugins.
 *
 * Module 1 : Espaces (concept inspiré de Portals)
 *   - Une vue « Espaces » dans la barre latérale gauche, avec des onglets en haut.
 *   - Chaque espace montre seulement l'arborescence de son dossier.
 *   - En changeant d'espace : les onglets ouverts sont mémorisés pour l'espace quitté,
 *     puis ceux de l'espace choisi sont restaurés (ou sa note d'accueil s'ouvre).
 *
 * Modules prévus (voir 20_Système/Plugins/Plugin — Alyson Virtuelle.md) :
 *   Fiches rapides, Modèles automatiques par dossier, Page d'accueil,
 *   Journal automatique des modifications, Canevas enrichis.
 */
const { Plugin, ItemView, PluginSettingTab, Setting, TFolder, TFile, Notice, Menu, FuzzySuggestModal, setIcon, debounce } = require("obsidian");

const VIEW_ESPACES = "alyson-virtuelle-espaces";

const DEFAULT_ESPACES = [
  { nom: "Pilotage", icone: "layout-dashboard", dossier: "00_Pilotage", accueil: "00_Pilotage/Tableau de bord.md" },
  { nom: "Planification", icone: "calendar-check", dossier: "00_Planification", accueil: "" },
  { nom: "Organisation", icone: "network", dossier: "10_Organisation", accueil: "" },
  { nom: "Système", icone: "settings-2", dossier: "20_Système", accueil: "" },
  { nom: "Connaissances", icone: "library", dossier: "30_Connaissances", accueil: "" },
  { nom: "Brain In A Box", icone: "brain", dossier: "Brain In A Box", accueil: "Brain In A Box/Brain In A Box.md" },
  { nom: "Alyson Virtuelle", icone: "sparkles", dossier: "Alyson Virtuelle", accueil: "Alyson Virtuelle/AGENT.md" }
];

const DEFAULT_SETTINGS = {
  espaceActif: 0,
  memoriserOnglets: true,
  masquerCaches: true,
  espaces: DEFAULT_ESPACES,
  synchroAuto: true,
  synchroDelai: 60
};

/* ---------- Module 2 : Synchro automatique ----------
 * Après chaque modification du coffre, attend un délai sans nouvelle modification,
 * puis lance la synchronisation de Git Vault Sync (le seul plugin Git gardé).
 */
const GIT_PLUGIN = "git-vault-sync";
const GIT_COMMANDE = "git-vault-sync:sync";

class SynchroAuto {
  constructor(plugin) {
    this.plugin = plugin;
    this.timer = null;
  }

  ignorer(chemin) {
    const configDir = this.plugin.app.vault.configDir;
    return !chemin || chemin.startsWith(configDir + "/") || chemin === configDir || chemin.startsWith(".git/") || chemin.startsWith(".trash/");
  }

  demarrer() {
    const vault = this.plugin.app.vault;
    const surChangement = (file, ancien) => {
      if (this.ignorer(file && file.path) && this.ignorer(ancien)) return;
      this.planifier();
    };
    this.plugin.registerEvent(vault.on("modify", (f) => surChangement(f)));
    this.plugin.registerEvent(vault.on("create", (f) => surChangement(f)));
    this.plugin.registerEvent(vault.on("delete", (f) => surChangement(f)));
    this.plugin.registerEvent(vault.on("rename", (f, ancien) => surChangement(f, ancien)));
  }

  planifier() {
    const s = this.plugin.settings;
    if (!s.synchroAuto) return;
    if (this.timer) window.clearTimeout(this.timer);
    const delai = Math.max(10, Number(s.synchroDelai) || 60) * 1000;
    this.timer = window.setTimeout(() => this.lancer(), delai);
  }

  async lancer() {
    this.timer = null;
    if (!this.plugin.settings.synchroAuto) return;
    const app = this.plugin.app;
    const git = app.plugins && app.plugins.plugins ? app.plugins.plugins[GIT_PLUGIN] : null;
    if (git && git.syncing) { this.planifier(); return; }
    try {
      if (git && typeof git.sync === "function") await git.sync(true);
      else if (!app.commands.executeCommandById(GIT_COMMANDE)) new Notice("Synchro automatique : Git Vault Sync n'est pas activé.");
    } catch (e) {
      console.error("[Alyson Virtuelle] Synchro automatique", e);
      new Notice("Synchro automatique : échec, voir Git Vault Sync.");
    }
  }

  arreter() {
    if (this.timer) window.clearTimeout(this.timer);
    this.timer = null;
  }
}

function copie(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------- Module Espaces : la vue ---------- */

class EspacesView extends ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.ouverts = new Set();
  }
  getViewType() { return VIEW_ESPACES; }
  getDisplayText() { return "Espaces"; }
  getIcon() { return "layout-grid"; }

  async onOpen() {
    this.contentEl.addClass("av-espaces");
    this.render();
    const refresh = debounce(() => this.render(), 300, true);
    this.registerEvent(this.app.vault.on("create", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));
    this.registerEvent(this.app.workspace.on("file-open", () => this.marquerActif()));
  }

  render() {
    const el = this.contentEl;
    el.empty();
    const p = this.plugin;
    const liste = p.settings.espaces;
    if (!liste.length) { el.createDiv({ cls: "av-vide", text: "Aucun espace. Ajoute-en dans les réglages du plugin." }); return; }

    const onglets = el.createDiv({ cls: "av-onglets" });
    liste.forEach((esp, i) => {
      const b = onglets.createDiv({ cls: "av-onglet" + (i === p.settings.espaceActif ? " is-active" : ""), attr: { "aria-label": esp.nom } });
      setIcon(b.createSpan({ cls: "av-onglet-icone" }), esp.icone || "folder");
      b.createSpan({ cls: "av-onglet-nom", text: esp.nom });
      b.onclick = () => p.choisirEspace(i);
    });

    const esp = p.espaceActif();
    const tete = el.createDiv({ cls: "av-tete" });
    tete.createDiv({ cls: "av-titre", text: esp.nom });
    if (esp.accueil) {
      const a = tete.createDiv({ cls: "av-bouton", attr: { "aria-label": "Ouvrir la note d'accueil" } });
      setIcon(a, "home");
      a.onclick = () => p.ouvrir(esp.accueil);
    }

    const arbre = el.createDiv({ cls: "av-arbre" });
    const racine = esp.dossier ? this.app.vault.getAbstractFileByPath(esp.dossier) : null;
    if (racine instanceof TFolder) this.contenu(arbre, racine, 0);
    else arbre.createDiv({ cls: "av-vide", text: "Dossier introuvable : " + (esp.dossier || "(aucun)") });
    this.marquerActif();
  }

  trier(enfants) {
    const masquer = this.plugin.settings.masquerCaches;
    return enfants
      .filter((c) => !(masquer && c.name.startsWith(".")))
      .sort((a, b) => {
        const da = a instanceof TFolder, db = b instanceof TFolder;
        if (da !== db) return da ? -1 : 1;
        return a.name.localeCompare(b.name, "fr", { numeric: true });
      });
  }

  contenu(parent, folder, niveau) {
    for (const c of this.trier(folder.children)) {
      if (c instanceof TFolder) this.dossier(parent, c, niveau);
      else if (c instanceof TFile) this.fichier(parent, c, niveau);
    }
  }

  dossier(parent, folder, niveau) {
    const ouvert = this.ouverts.has(folder.path);
    const ligne = parent.createDiv({ cls: "av-ligne av-dossier" });
    ligne.style.paddingLeft = 8 + niveau * 14 + "px";
    setIcon(ligne.createSpan({ cls: "av-chevron" }), ouvert ? "chevron-down" : "chevron-right");
    ligne.createSpan({ cls: "av-nom", text: folder.name });
    if (ouvert) this.contenu(parent.createDiv({ cls: "av-enfants" }), folder, niveau + 1);
    ligne.onclick = () => {
      if (this.ouverts.has(folder.path)) this.ouverts.delete(folder.path); else this.ouverts.add(folder.path);
      this.render();
    };
  }

  fichier(parent, file, niveau) {
    const ligne = parent.createDiv({ cls: "av-ligne av-fichier", attr: { "data-path": file.path } });
    ligne.style.paddingLeft = 22 + niveau * 14 + "px";
    ligne.createSpan({ cls: "av-nom", text: file.basename });
    if (file.extension !== "md") ligne.createSpan({ cls: "av-ext", text: file.extension });
    ligne.onclick = (e) => this.app.workspace.getLeaf(e.ctrlKey || e.metaKey ? "tab" : false).openFile(file);
    ligne.oncontextmenu = (e) => {
      const menu = new Menu();
      this.app.workspace.trigger("file-menu", menu, file, "alyson-virtuelle");
      menu.showAtMouseEvent(e);
    };
  }

  marquerActif() {
    const f = this.app.workspace.getActiveFile();
    this.contentEl.querySelectorAll(".av-fichier").forEach((n) => n.toggleClass("is-active", !!f && n.getAttr("data-path") === f.path));
  }
}

/* ---------- Module Espaces : choisir un espace (commande) ---------- */

class ChoixEspaceModal extends FuzzySuggestModal {
  constructor(app, plugin) { super(app); this.plugin = plugin; this.setPlaceholder("Changer d'espace…"); }
  getItems() { return this.plugin.settings.espaces.map((e, i) => ({ e, i })); }
  getItemText(x) { return x.e.nom; }
  onChooseItem(x) { this.plugin.choisirEspace(x.i); }
}

/* ---------- Réglages ---------- */

class AlysonSettingTab extends PluginSettingTab {
  constructor(app, plugin) { super(app, plugin); this.plugin = plugin; }

  display() {
    const el = this.containerEl;
    const p = this.plugin;
    el.empty();
    el.createEl("h2", { text: "Alyson Virtuelle" });
    el.createEl("h3", { text: "Module Espaces" });

    new Setting(el).setName("Mémoriser les onglets de chaque espace")
      .setDesc("En changeant d'espace, garde les onglets ouverts de l'espace quitté et rouvre ceux de l'espace choisi.")
      .addToggle((t) => t.setValue(p.settings.memoriserOnglets).onChange(async (v) => { p.settings.memoriserOnglets = v; await p.sauver(); }));
    new Setting(el).setName("Masquer les éléments cachés")
      .setDesc("Ne montre pas les dossiers et fichiers dont le nom commence par un point.")
      .addToggle((t) => t.setValue(p.settings.masquerCaches).onChange(async (v) => { p.settings.masquerCaches = v; await p.sauver(); }));

    const liste = p.settings.espaces;
    liste.forEach((esp, i) => {
      const s = new Setting(el).setClass("av-reglage-espace").setName((i + 1) + ". " + (esp.nom || "(sans nom)"));
      s.addText((t) => t.setPlaceholder("Nom").setValue(esp.nom).onChange(async (v) => { esp.nom = v; await p.sauver(); }));
      s.addText((t) => t.setPlaceholder("Icône Lucide").setValue(esp.icone || "").onChange(async (v) => { esp.icone = v.trim(); await p.sauver(); }));
      s.addText((t) => t.setPlaceholder("Dossier racine").setValue(esp.dossier || "").onChange(async (v) => { esp.dossier = v.trim(); await p.sauver(); }));
      s.addText((t) => t.setPlaceholder("Note d'accueil (chemin)").setValue(esp.accueil || "").onChange(async (v) => { esp.accueil = v.trim(); await p.sauver(); }));
      s.addExtraButton((b) => b.setIcon("arrow-up").setTooltip("Monter").onClick(async () => {
        if (i === 0) return;
        [liste[i - 1], liste[i]] = [liste[i], liste[i - 1]];
        if (p.settings.espaceActif === i) p.settings.espaceActif = i - 1; else if (p.settings.espaceActif === i - 1) p.settings.espaceActif = i;
        await p.sauver(); this.display();
      }));
      s.addExtraButton((b) => b.setIcon("arrow-down").setTooltip("Descendre").onClick(async () => {
        if (i === liste.length - 1) return;
        [liste[i + 1], liste[i]] = [liste[i], liste[i + 1]];
        if (p.settings.espaceActif === i) p.settings.espaceActif = i + 1; else if (p.settings.espaceActif === i + 1) p.settings.espaceActif = i;
        await p.sauver(); this.display();
      }));
      s.addExtraButton((b) => b.setIcon("trash").setTooltip("Supprimer l'espace (aucun fichier n'est touché)").onClick(async () => {
        liste.splice(i, 1);
        if (p.settings.espaceActif >= liste.length) p.settings.espaceActif = Math.max(0, liste.length - 1);
        await p.sauver(); this.display();
      }));
    });

    new Setting(el)
      .addButton((b) => b.setButtonText("Ajouter un espace").setCta().onClick(async () => {
        liste.push({ nom: "Nouvel espace", icone: "folder", dossier: "", accueil: "" });
        await p.sauver(); this.display();
      }))
      .addButton((b) => b.setButtonText("Rétablir les espaces de départ").onClick(async () => {
        p.settings.espaces = copie(DEFAULT_ESPACES); p.settings.espaceActif = 0;
        await p.sauver(); this.display();
      }));
    el.createEl("p", { cls: "setting-item-description", text: "Icônes : noms Lucide (lucide.dev), par exemple home, brain, folder, calendar. Supprimer un espace ne supprime aucun fichier." });

    el.createEl("h3", { text: "Module Synchro automatique" });
    new Setting(el).setName("Synchroniser à chaque modification")
      .setDesc("Après une modification, attend le délai ci-dessous sans nouvelle modification, puis lance la synchro de Git Vault Sync.")
      .addToggle((t) => t.setValue(p.settings.synchroAuto).onChange(async (v) => { p.settings.synchroAuto = v; if (!v) p.synchro.arreter(); await p.sauver(); }));
    new Setting(el).setName("Délai avant synchro (secondes)")
      .setDesc("10 secondes minimum. 60 évite de lancer une synchro à chaque frappe.")
      .addText((t) => t.setValue(String(p.settings.synchroDelai)).onChange(async (v) => { const n = parseInt(v, 10); if (n >= 10) { p.settings.synchroDelai = n; await p.sauver(); } }));
  }
}

/* ---------- Plugin ---------- */

module.exports = class AlysonVirtuellePlugin extends Plugin {
  async onload() {
    const data = (await this.loadData()) || {};
    this.settings = Object.assign(copie(DEFAULT_SETTINGS), data);
    if (!Array.isArray(this.settings.espaces) || !this.settings.espaces.length) this.settings.espaces = copie(DEFAULT_ESPACES);

    this.registerView(VIEW_ESPACES, (leaf) => new EspacesView(leaf, this));
    this.addRibbonIcon("layout-grid", "Espaces", () => this.afficherVue());
    this.addCommand({ id: "changer-espace", name: "Changer d'espace", callback: () => new ChoixEspaceModal(this.app, this).open() });
    this.addCommand({ id: "afficher-espaces", name: "Afficher la vue Espaces", callback: () => this.afficherVue() });
    this.addCommand({ id: "espace-suivant", name: "Espace suivant", callback: () => this.choisirEspace((this.settings.espaceActif + 1) % this.settings.espaces.length) });
    this.addCommand({ id: "espace-precedent", name: "Espace précédent", callback: () => { const n = this.settings.espaces.length; this.choisirEspace((this.settings.espaceActif - 1 + n) % n); } });
    this.addSettingTab(new AlysonSettingTab(this.app, this));

    this.synchro = new SynchroAuto(this);
    this.addCommand({ id: "synchroniser-maintenant", name: "Synchroniser maintenant (Git Vault Sync)", callback: () => this.synchro.lancer() });

    this.app.workspace.onLayoutReady(() => {
      this.afficherVue(false);
      this.synchro.demarrer();
    });
  }

  onunload() { if (this.synchro) this.synchro.arreter(); }

  espaceActif() {
    const l = this.settings.espaces;
    return l[Math.min(Math.max(0, this.settings.espaceActif), l.length - 1)];
  }

  async sauver() {
    await this.saveData(this.settings);
    this.app.workspace.getLeavesOfType(VIEW_ESPACES).forEach((l) => { if (l.view instanceof EspacesView) l.view.render(); });
  }

  async afficherVue(reveler = true) {
    let leaf = this.app.workspace.getLeavesOfType(VIEW_ESPACES)[0];
    if (!leaf) {
      leaf = this.app.workspace.getLeftLeaf(false);
      if (!leaf) return;
      await leaf.setViewState({ type: VIEW_ESPACES, active: true });
    }
    if (reveler) this.app.workspace.revealLeaf(leaf);
  }

  /* Onglets de la zone principale (pas les barres latérales). */
  ongletsPrincipaux() {
    const leaves = [];
    this.app.workspace.iterateRootLeaves((l) => leaves.push(l));
    return leaves;
  }

  async choisirEspace(i) {
    const l = this.settings.espaces;
    if (i < 0 || i >= l.length) return;
    const ancien = this.espaceActif();

    if (this.settings.memoriserOnglets && ancien && i !== this.settings.espaceActif) {
      ancien.onglets = this.ongletsPrincipaux().map((leaf) => leaf.view && leaf.view.file ? leaf.view.file.path : null).filter(Boolean);
    }
    const changement = i !== this.settings.espaceActif;
    this.settings.espaceActif = i;
    await this.sauver();

    const esp = l[i];
    let chemins = this.settings.memoriserOnglets && changement && Array.isArray(esp.onglets) ? esp.onglets : [];
    let fichiers = chemins.map((c) => this.app.vault.getAbstractFileByPath(c)).filter((f) => f instanceof TFile);
    if (!fichiers.length && esp.accueil) {
      const a = this.app.vault.getAbstractFileByPath(esp.accueil);
      if (a instanceof TFile) fichiers = [a];
    }
    if (!fichiers.length) return;

    if (this.settings.memoriserOnglets && changement) {
      const existants = this.ongletsPrincipaux();
      const premier = existants[0] || this.app.workspace.getLeaf(true);
      existants.slice(1).forEach((leaf) => leaf.detach());
      await premier.openFile(fichiers[0]);
      for (const f of fichiers.slice(1)) await this.app.workspace.getLeaf("tab").openFile(f);
      this.app.workspace.setActiveLeaf(premier, { focus: true });
    } else {
      await this.app.workspace.getLeaf(false).openFile(fichiers[0]);
    }
  }

  ouvrir(chemin) {
    const f = this.app.vault.getAbstractFileByPath(chemin);
    if (f instanceof TFile) this.app.workspace.getLeaf(false).openFile(f);
    else new Notice("Note introuvable : " + chemin);
  }
};
