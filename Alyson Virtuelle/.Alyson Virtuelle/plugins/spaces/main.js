"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SpacesPlugin,
  renameTouchesDefs: () => renameTouchesDefs,
  sameDefs: () => sameDefs,
  sameResortSignature: () => sameResortSignature
});
module.exports = __toCommonJS(main_exports);
var import_obsidian24 = require("obsidian");

// src/types.ts
var SCHEMA_VERSION = 4;
var DEFAULT_DEFINITIONS = {
  // Literal 1, not `SCHEMA_VERSION`. An empty document holds no spaces, so
  // no tag member and no exclusion — nothing a version 1 build cannot
  // represent — and `schemaVersionFor` (schema.ts) would compute 1 for it.
  // `SCHEMA_VERSION` answers a different question, the highest version this
  // build can READ, not what an empty document should be WRITTEN as. If a
  // later change ever persists these defaults directly, stamping them
  // `SCHEMA_VERSION` would mark an empty vault version 2 for holding
  // nothing that needs it, and an older install would then refuse it
  // outright — exactly the failure `schemaVersionFor` exists to prevent.
  schemaVersion: 1,
  settings: {
    globalIgnore: [],
    // Off by default. Restoring tabs on every switch rearranges the workspace
    // the user was just looking at, which is a surprising thing for a tree
    // filter to do uninvited. The feature stays one toggle away.
    restoreLayouts: false,
    revealVisitors: true,
    // On by default: an additive interception (only between rows; folder
    // drops, drag-into-editor and drag-out-of-app are untouched), and a
    // feature defaulted off is a feature nobody finds.
    allowReordering: true,
    // On by default, so All behaves like a space until told otherwise.
    allowReorderingAll: true,
    // On by default: the orientation cue the feature exists for, which a
    // default of off would mean nobody discovers.
    showSpaceHeader: true,
    // OFF, unlike `showSpaceHeader`: this annotates a detail only some care
    // about, and adding chrome to an existing install unasked reads as a bug.
    showPinnedFolder: false,
    // Off by default. This changes how every curated space draws, and an
    // update must not rearrange an explorer the user was reading.
    compactFolderChains: false,
    // ON, and the only Appearance default that is about another SETTING
    // working rather than about this one's own feature. A deep run's joined
    // label overflows a narrow pane and the ellipsis eats the TIP, so
    // compaction without this is compaction that hides the one segment naming
    // the row. It costs an existing install nothing either way: nothing
    // changes for anyone until they turn `compactFolderChains` on themselves.
    abbreviateCompactedPaths: true,
    // OFF by default: this rearranges a strip every existing install already
    // reads fluently, and doing that unasked on an update reads as a bug.
    pinAllSpace: false,
    // ON, like its Appearance neighbours: coloring new spaces is what the
    // palette is for, and quietly stopping would read as the feature
    // breaking rather than a default being applied.
    autoAssignColor: true,
    // OFF: it changes how every existing install looks. Turning up after an
    // update with every icon the same color reads as the colors having
    // been lost rather than as a default being applied.
    useThemeIconColor: false,
    customColors: [],
    stripPlacement: "bottom",
    // OFF, like every setting that changes how an existing install looks.
    hideStrip: false,
    activeSpaceStyle: "shaded",
    // `box` even though it changes how an existing install looks on upgrade,
    // which the neighbouring defaults deliberately avoid doing. The gap is the
    // better answer to "where does this land" and the line remains one click
    // away, so the upgrade is worth the surprise.
    dropIndicatorStyle: "box"
  },
  spaces: []
};

// src/definitions/archived.ts
function isArchived(space) {
  return space.archived === true;
}
function activeSpaces(spaces) {
  return spaces.filter((s) => !isArchived(s));
}
function archivedSpaces(spaces) {
  return spaces.filter(isArchived);
}

// src/visibility/tagMatch.ts
function normalizeTag(raw) {
  const trimmed = raw.trim();
  const bare = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;
  return bare.toLowerCase();
}
function tagMatches(member, noteTag) {
  return noteTag === member || noteTag.startsWith(member + "/");
}

// src/visibility/glob.ts
var MAX_PATTERNS = 100;
var MAX_PATTERN_LENGTH = 200;
function canonicalPath(path) {
  return path.toLowerCase();
}
function escapeSeg(seg) {
  return seg.replace(/\*+/g, "*").replace(/[.+^${}()|[\]\\?]/g, "\\$&").replace(/\*/g, "[^/]*");
}
function patternToRegExp(pattern) {
  const segs = pattern.split("/").filter((seg, i, all) => !(seg === "**" && all[i - 1] === "**"));
  let out = "^";
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const isLast = i === segs.length - 1;
    if (seg === "**") {
      if (isLast) {
        out += "[^/]+(?:/[^/]+)*";
      } else {
        out += "(?:[^/]+/)*";
        continue;
      }
    } else {
      out += escapeSeg(seg);
    }
    if (!isLast) out += "/";
  }
  return new RegExp(out + "$", "i");
}
function compileIgnore(patterns) {
  const skipped = [];
  const compiled = [];
  patterns.forEach((raw, index) => {
    const skip = (reason) => {
      skipped.push({ pattern: raw, index, reason });
    };
    if (index >= MAX_PATTERNS) return skip("over-cap");
    const p = raw.trim();
    if (!p) return skip("blank");
    if (p.length > MAX_PATTERN_LENGTH) return skip("too-long");
    if (p.split("/").some((seg) => seg === "..")) return skip("traversal");
    if (p.startsWith("/")) return skip("absolute");
    try {
      compiled.push(patternToRegExp(p));
    } catch (e) {
      skip("uncompilable");
    }
  });
  return {
    skipped,
    matches(path) {
      return compiled.some((re) => re.test(path));
    }
  };
}

// src/visibility/propertyValues.ts
function normalizeValue(text) {
  return text.trim().toLowerCase().normalize("NFC");
}
function hasOwnKey(frontmatter, key) {
  if (frontmatter === null || typeof frontmatter !== "object") return false;
  return Object.prototype.hasOwnProperty.call(frontmatter, key);
}

// src/definitions/schema.ts
var COLOR = /^#[0-9a-f]{6}$/i;
var STRIP_PLACEMENTS = /* @__PURE__ */ new Set(["bottom", "top", "left", "right"]);
var DROP_INDICATOR_STYLES = /* @__PURE__ */ new Set(["box", "line"]);
var ACTIVE_SPACE_STYLES = /* @__PURE__ */ new Map([
  ["shaded", "shaded"],
  ["boxed", "boxed"],
  ["bolded", "bolded"],
  ["box", "shaded"],
  ["bold", "bolded"]
]);
var MAX_CUSTOM_COLORS = 12;
var ID = /^[A-Za-z0-9_-]{1,64}$/;
var RESERVED_IDS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
var MAX_SPACE_NAME_LENGTH = 100;
function fail(error, futureSchema = false) {
  return { ok: false, error, futureSchema };
}
function isSafeVaultPath(p) {
  if (typeof p !== "string" || p.length === 0 || p.length > 1e3) return false;
  if (p.startsWith("/") || p.includes("\\") || /^[A-Za-z]:/.test(p)) return false;
  return !p.split("/").some((seg) => seg === ".." || seg === ".");
}
function memberIdentity(m) {
  switch (m.kind) {
    case "file":
    case "folder":
      return JSON.stringify([m.kind, m.path]);
    case "tag":
      return JSON.stringify(["tag", normalizeTag(m.tag)]);
    case "property":
      return m.value === void 0 ? JSON.stringify(["property", m.key, "exists"]) : JSON.stringify(["property", m.key, "equals", normalizeValue(m.value)]);
  }
}
function isEligiblePropertyKey(key) {
  return key.trim().length > 0;
}
function validateMembers(raw) {
  if (!Array.isArray(raw)) return null;
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") return null;
    const { kind } = m;
    if (kind === "file" || kind === "folder") {
      const { path } = m;
      if (!isSafeVaultPath(path)) return null;
      const key = "p:" + path;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind, path });
      continue;
    }
    if (kind === "tag") {
      const { tag } = m;
      if (typeof tag !== "string") return null;
      const normalized = normalizeTag(tag);
      if (normalized.length === 0) return null;
      const key = "t:" + normalized;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: "tag", tag: normalized });
      continue;
    }
    if (kind === "property") {
      const { key, value } = m;
      if (typeof key !== "string" || !isEligiblePropertyKey(key)) return null;
      if (value !== void 0 && typeof value !== "string") return null;
      const member = value === void 0 ? { kind: "property", key } : { kind: "property", key, value };
      const id = memberIdentity(member);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(member);
      continue;
    }
    return null;
  }
  return out;
}
function validateOrderMap(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const out = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of Object.entries(raw)) {
    if (key !== "" && !isSafeVaultPath(key)) continue;
    if (!Array.isArray(value)) continue;
    const seen = /* @__PURE__ */ new Set();
    const list = [];
    for (const p of value) {
      if (!isSafeVaultPath(p)) continue;
      if (seen.has(p)) continue;
      seen.add(p);
      list.push(p);
    }
    if (list.length > 0) out[key] = list;
  }
  return Object.keys(out).length > 0 ? out : void 0;
}
function validateOrders(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return void 0;
  const r = raw;
  const all = validateOrderMap(r.all);
  let bySpaceId;
  const rawBy = r.bySpaceId;
  if (rawBy && typeof rawBy === "object" && !Array.isArray(rawBy)) {
    const acc = /* @__PURE__ */ Object.create(null);
    for (const [id, m] of Object.entries(rawBy)) {
      const map = validateOrderMap(m);
      if (map) acc[id] = map;
    }
    if (Object.keys(acc).length > 0) bySpaceId = acc;
  }
  if (!all && !bySpaceId) return void 0;
  return { ...all ? { all } : {}, ...bySpaceId ? { bySpaceId } : {} };
}
function validateSpace(raw) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw;
  if (typeof r.id !== "string" || !ID.test(r.id)) return null;
  if (RESERVED_IDS.has(r.id)) return null;
  if (typeof r.name !== "string" || !r.name.trim() || r.name.length > MAX_SPACE_NAME_LENGTH) {
    return null;
  }
  if (typeof r.icon !== "string" || r.icon.length > 64) return null;
  if (typeof r.color !== "string" || !COLOR.test(r.color)) return null;
  let root;
  if (typeof r.root === "string") {
    const spelled = r.root === "" || r.root === "/" ? r.root : r.root.replace(/\/+$/, "");
    if (spelled === "" || spelled === "/" || isSafeVaultPath(spelled)) root = spelled;
  }
  let exclude;
  if (Array.isArray(r.exclude)) {
    const seen = /* @__PURE__ */ new Set();
    const kept = [];
    for (const e of r.exclude) {
      if (!isSafeVaultPath(e)) continue;
      const folded = canonicalPath(e);
      if (seen.has(folded)) continue;
      seen.add(folded);
      kept.push(e);
    }
    if (kept.length > 0) exclude = kept;
  }
  const archived = r.archived === true ? true : void 0;
  const members = validateMembers(r.members);
  if (!members) return null;
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    ...root === void 0 ? {} : { root },
    ...exclude === void 0 ? {} : { exclude },
    ...archived === void 0 ? {} : { archived },
    members
  };
}
function schemaVersionFor(spaces) {
  if (spaces.some(isArchived)) return 4;
  const usesV3 = spaces.some((s) => s.members.some((m) => m.kind === "property"));
  if (usesV3) return 3;
  const usesV2 = spaces.some(
    (s) => {
      var _a, _b;
      return s.members.some((m) => m.kind === "tag") || ((_b = (_a = s.exclude) == null ? void 0 : _a.length) != null ? _b : 0) > 0;
    }
  );
  return usesV2 ? 2 : 1;
}
function validateDefinitions(raw) {
  var _a;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return fail("definitions must be an object");
  }
  const r = raw;
  if (typeof r.schemaVersion !== "number" || !Number.isInteger(r.schemaVersion)) {
    return fail("schemaVersion must be an integer");
  }
  if (r.schemaVersion > SCHEMA_VERSION) {
    return fail(
      `schemaVersion ${r.schemaVersion} is newer than supported ${SCHEMA_VERSION}`,
      true
    );
  }
  const s = r.settings;
  if (!s || typeof s !== "object") return fail("settings must be an object");
  const st = s;
  const globalIgnore = Array.isArray(st.globalIgnore) ? st.globalIgnore.filter((p) => typeof p === "string") : [];
  const orders = validateOrders(r.orders);
  if (!Array.isArray(r.spaces)) return fail("spaces must be an array");
  const spaces = [];
  const ids = /* @__PURE__ */ new Set();
  for (const rawSpace of r.spaces) {
    const sp = validateSpace(rawSpace);
    if (!sp) return fail("invalid space definition");
    if (ids.has(sp.id)) return fail(`duplicate space id: ${sp.id}`);
    ids.add(sp.id);
    spaces.push(sp);
  }
  return {
    ok: true,
    value: {
      schemaVersion: schemaVersionFor(spaces),
      settings: {
        globalIgnore,
        // Defaults to FALSE, matching `DEFAULT_DEFINITIONS`. A *missing*
        // key (fresh install, or a document written before this setting
        // existed) becomes false; an *explicit* true is kept. Restoring tabs
        // moves the workspace on every switch, so it is opted into rather than
        // inherited from an absent key.
        restoreLayouts: st.restoreLayouts === true,
        // A missing key defaults to true, but a present
        // non-boolean is NOT trusted — `revealVisitors: 0` must not read as
        // true the way the looser check above would make it.
        revealVisitors: st.revealVisitors === void 0 ? true : st.revealVisitors === true,
        // Defaults to true. Strict for the same reason as
        // `revealVisitors` directly above — `allowReordering: 0` must not
        // read as true. Only an absent key defaults to true; a present
        // non-boolean reads as false, consistent with the neighbouring key.
        allowReordering: st.allowReordering === void 0 ? true : st.allowReordering === true,
        // Defaults to true, strict like its neighbours —
        // `allowReorderingAll: 0` must not read as true.
        allowReorderingAll: st.allowReorderingAll === void 0 ? true : st.allowReorderingAll === true,
        // Defaults to true, strict for the same reason as the two keys
        // above — `showSpaceHeader: 0` must not read as true.
        showSpaceHeader: st.showSpaceHeader === void 0 ? true : st.showSpaceHeader === true,
        // Degrades rather than rejects, exactly like `revealVisitors` above: a
        // hand-edited or future-version value must never cost someone their
        // spaces, and a strip in the wrong corner is a cosmetic complaint.
        stripPlacement: typeof st.stripPlacement === "string" && STRIP_PLACEMENTS.has(st.stripPlacement) ? st.stripPlacement : "bottom",
        // Strict like `useThemeIconColor`: shape only, and a present non-boolean
        // falls back to off rather than being trusted. A document written before
        // this setting existed carries no key, which also reads as off.
        hideStrip: st.hideStrip === true,
        // Degrades for the same reason as the placement above, and to the
        // look every existing vault already has: a document written before
        // this setting existed carries no key at all.
        activeSpaceStyle: (_a = typeof st.activeSpaceStyle === "string" ? ACTIVE_SPACE_STYLES.get(st.activeSpaceStyle) : void 0) != null ? _a : "shaded",
        // Degrades rather than rejects, like the two above. A wrong indicator
        // is a cosmetic complaint and must never cost someone their spaces.
        dropIndicatorStyle: typeof st.dropIndicatorStyle === "string" && DROP_INDICATOR_STYLES.has(st.dropIndicatorStyle) ? st.dropIndicatorStyle : "box",
        // Defaults to FALSE, so absent and non-boolean collapse to the
        // same answer and no `undefined` branch is needed. Strict for the same
        // reason as the keys above — `pinAllSpace: 1` must not read as true.
        pinAllSpace: st.pinAllSpace === true,
        // Defaults to FALSE like `pinAllSpace` above, so absent and
        // non-boolean collapse to the same answer. Strict for the same reason:
        // `showPinnedFolder: 1` must not read as true.
        showPinnedFolder: st.showPinnedFolder === true,
        // Defaults to FALSE like the keys above, so absent and non-boolean
        // collapse to the same answer. Strict for the same reason:
        // `compactFolderChains: 1` must not read as true.
        compactFolderChains: st.compactFolderChains === true,
        // `!== false`, and this is the ONE key on this list that is looser
        // than its neighbours on purpose.
        //
        // Every other boolean on this list answers "unrecognised means OFF",
        // whatever it does about an absent key: four above default ON when the
        // key is missing (`revealVisitors`, `allowReordering`,
        // `allowReorderingAll`, `showSpaceHeader`) and still read a present
        // non-boolean as false. This one inverts that second half: absent AND
        // unrecognised both mean ON, and only a literal `false` -- the value
        // the toggle itself writes -- turns it off.
        //
        // Why it differs: without it, compaction is actively broken on a deep
        // vault. The joined label overflows a narrow pane, `text-overflow:
        // ellipsis` truncates from the right, and the TIP is the first thing
        // lost -- the one segment that says which folder the row is. The
        // opt-in a user already made by enabling `compactFolderChains` should
        // not also require opting into it working. A strict check here would
        // leave a document holding any unrecognised value on the broken label,
        // which is the failure this setting exists to remove.
        abbreviateCompactedPaths: st.abbreviateCompactedPaths !== false,
        // `compactPathThreshold` was read here in an earlier draft of this
        // feature and is read nowhere now. No RELEASE ever carried it, so no
        // stored document can hold one; what follows is why removing a read
        // would have been safe even if one did:
        // shortening triggers on a measured overflow instead of on a folder
        // count. Removing it is a READ-SIDE change and nothing else. Every
        // settings key is listed by name in this object, so a document still
        // carrying the old one is simply not asked for it -- it is not
        // migrated, nothing is written back on load, and no stored value this
        // build does not understand can cost someone their spaces.
        // Defaults to FALSE for the same reason as the two above, and because
        // it changes how every existing install looks. Nothing here touches a
        // space's stored color: this key governs drawing alone.
        useThemeIconColor: st.useThemeIconColor === true,
        // Defaults to true, strict like `showSpaceHeader` above —
        // `autoAssignColor: 0` must not read as true the way a `!== false`
        // check would make it. An explicit false is kept: someone who turned
        // color off wants it off, and re-enabling it on the next load would
        // undo a choice they made on purpose.
        autoAssignColor: st.autoAssignColor === void 0 ? true : st.autoAssignColor === true,
        // Same defensive shape as `globalIgnore`: keep what parses, drop
        // what does not, never refuse the document over a bad chip.
        customColors: Array.isArray(st.customColors) ? st.customColors.filter((c) => typeof c === "string" && COLOR.test(c)).map((c) => c.toLowerCase()).filter((c, i, a) => a.indexOf(c) === i).slice(0, MAX_CUSTOM_COLORS) : []
      },
      spaces,
      ...orders ? { orders } : {}
    }
  };
}

// src/definitions/DefinitionStore.ts
var DATA_FILE = "data.json";
function nullProtoOrders(orders) {
  const out = {};
  if (orders.all) out.all = Object.assign(/* @__PURE__ */ Object.create(null), orders.all);
  if (orders.bySpaceId) {
    const by = /* @__PURE__ */ Object.create(null);
    for (const [id, m] of Object.entries(orders.bySpaceId)) {
      by[id] = Object.assign(/* @__PURE__ */ Object.create(null), m);
    }
    out.bySpaceId = by;
  }
  return out;
}
function clone(d) {
  const out = JSON.parse(JSON.stringify(d));
  if (out.orders) out.orders = nullProtoOrders(out.orders);
  return out;
}
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
    return false;
  }
  const aArr = Array.isArray(a);
  if (aArr !== Array.isArray(b)) return false;
  if (aArr) {
    const x = a;
    const y = b;
    return x.length === y.length && x.every((v, i) => deepEqual(v, y[i]));
  }
  const ax = a;
  const bx = b;
  const keys = Object.keys(ax);
  if (keys.length !== Object.keys(bx).length) return false;
  return keys.every(
    (k) => Object.prototype.hasOwnProperty.call(bx, k) && deepEqual(ax[k], bx[k])
  );
}
var DefinitionStore = class {
  constructor(backing, warn = () => void 0) {
    this.backing = backing;
    this.warn = warn;
    this.defs = clone(DEFAULT_DEFINITIONS);
    this.queue = Promise.resolve();
    this.subscribers = /* @__PURE__ */ new Set();
    /**
     * The load outcome, made STICKY. `load()` refuses to overwrite a file it
     * could not understand, and that refusal must hold beyond the moment
     * `load()` returns — `mutate()` has to consult it too, or the very next
     * ordinary action (a settings toggle, a blur, one drag) would persist the
     * defaults over the user's spaces. While this is set, nothing writes.
     */
    this.loadFailure = null;
    /** The document as it sat on disk before this session wrote anything. */
    this.pristine = null;
    /** One backup attempt per session, whether or not it succeeded. */
    this.backedUp = false;
    /** Bumped on every write that reached the backing. See `writeToken`. */
    this.writes = 0;
    /** So a locked volume produces one Notice, not one per mutation. */
    this.saveFailureWarned = false;
  }
  get() {
    return this.defs;
  }
  /**
   * A caller that is about to capture the external bytes
   * takes this token FIRST, and hands it back to `onExternalChange`. Any write
   * that lands in between is then detectable, so the reconciliation can be
   * conditioned on that.
   */
  writeToken() {
    return this.writes;
  }
  subscribe(fn) {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }
  notify() {
    for (const fn of this.subscribers) {
      try {
        fn(this.defs);
      } catch (e) {
        console.error("Spaces: a definitions subscriber threw", e);
      }
    }
  }
  /** All state changes funnel through here, so writes never interleave. */
  enqueue(fn) {
    const next = this.queue.then(fn, fn);
    this.queue = next.catch(() => void 0);
    return next;
  }
  async load() {
    return this.enqueue(async () => {
      let raw;
      try {
        raw = await this.backing.read();
      } catch (e) {
        return this.refuseWrites(String(e), false);
      }
      if (raw === null) {
        this.defs = clone(DEFAULT_DEFINITIONS);
        this.pristine = null;
        this.loadFailure = null;
        return { ok: true };
      }
      if (raw === void 0) {
        return this.refuseWrites(`${DATA_FILE} could not be parsed`, false);
      }
      const result = validateDefinitions(raw);
      if (!result.ok) {
        return this.refuseWrites(result.error, result.futureSchema);
      }
      this.defs = result.value;
      this.pristine = raw;
      this.loadFailure = null;
      return { ok: true };
    });
  }
  /**
   * Fail OPEN in memory (the tree still renders, out of All) but
   * CLOSED on disk — the file stays exactly as the user left it, and so does
   * every later write, until a document we can read arrives.
   */
  refuseWrites(error, futureSchema) {
    this.defs = clone(DEFAULT_DEFINITIONS);
    this.loadFailure = error;
    return { ok: false, error, futureSchema };
  }
  async mutate(fn) {
    await this.enqueue(async () => {
      if (this.loadFailure !== null) {
        const message = `Spaces: not saving. ${DATA_FILE} in the spaces plugin folder could not be read (${this.loadFailure}). Your spaces are still in that file. Fix or move it, then reload the plugin.`;
        this.warn(message);
        throw new Error(message);
      }
      const draft = clone(this.defs);
      fn(draft);
      const result = validateDefinitions(draft);
      if (!result.ok) throw new Error(`invalid mutation: ${result.error}`);
      this.defs = result.value;
      await this.persist();
      this.notify();
    });
  }
  /** Back up once, write, then check the write actually landed. */
  async persist() {
    await this.backUpOnce();
    await this.backing.write(this.defs);
    this.writes += 1;
    await this.verifyWrite();
  }
  async backUpOnce() {
    if (this.backedUp) return;
    const copy = this.pristine;
    if (copy === null || copy === void 0) return;
    this.backedUp = true;
    this.pristine = null;
    if (!this.backing.backup) return;
    try {
      await this.backing.backup(copy);
    } catch (e) {
      console.error(`Spaces: could not write the ${DATA_FILE} backup`, e);
    }
  }
  /**
   * `Vault.writeJson` swallows the adapter error outright — it does not
   * even log, unlike `readJson` — so `Plugin.saveData` resolves whether or not
   * a byte reached disk, and there is nothing to catch. On a locked, full or
   * read-only volume every mutation used to repaint as saved, indefinitely,
   * with no signal anywhere. Reading the file back is the only detection
   * available: one small read of the file just written, still in the OS cache,
   * per mutation — proportionate against silently losing a curation session.
   */
  async verifyWrite() {
    let readBack;
    try {
      readBack = await this.backing.read();
    } catch (e) {
      return;
    }
    if (deepEqual(readBack, this.defs)) {
      this.saveFailureWarned = false;
      return;
    }
    if (this.saveFailureWarned) return;
    this.saveFailureWarned = true;
    this.warn(
      `Spaces: your change may not have been saved. ${DATA_FILE} on disk does not match what was just written. Check that the plugin folder is writable and not locked by a sync client.`
    );
  }
  /**
   * External-wins (spec section 4.5). The caller captures the external
   * snapshot BEFORE calling, so a queued local write cannot clobber it, and
   * passes the `writeToken()` it took before that read so steps 5 and 6 can
   * tell whether a local write slipped in behind the capture.
   */
  async onExternalChange(snapshot, capturedAt = this.writes) {
    await this.enqueue(async () => {
      const result = validateDefinitions(snapshot);
      if (!result.ok) return;
      const superseded = this.writes !== capturedAt && !deepEqual(this.defs, result.value);
      this.defs = result.value;
      this.loadFailure = null;
      if (!this.backedUp && this.pristine === null) this.pristine = snapshot;
      if (superseded) {
        await this.persist();
        this.warn(
          `Spaces: a local change was superseded by a newer ${DATA_FILE} from another device.`
        );
      }
      this.notify();
    });
  }
};

// src/order/orderingScope.ts
function orderingEnabledFor(selection, settings) {
  if (!settings.allowReordering) return false;
  return selection.kind !== "all" || settings.allowReorderingAll;
}

// src/order/sortOverride.ts
function sameSelection(a, b) {
  return a.kind === b.kind && (a.kind === "all" || a.kind === "space" && b.kind === "space" && a.id === b.id);
}
function isOverridden(sel, o) {
  return sel.kind === "all" ? o.all : o.bySpaceId[sel.id] === true;
}
function withOverride(o, sel, on) {
  if (sel.kind === "all") return { all: on, bySpaceId: { ...o.bySpaceId } };
  const bySpaceId = { ...o.bySpaceId };
  if (on) bySpaceId[sel.id] = true;
  else delete bySpaceId[sel.id];
  return { all: o.all, bySpaceId };
}
function sortGestureFrom(seen, current) {
  if (current === null) return "none";
  if (seen === null) return "seed";
  return seen === current ? "none" : "gesture";
}
function shouldExplainBlockedDrag(overridden, orderingEnabled) {
  if (!orderingEnabled) return false;
  return overridden;
}
function isOverrideActionable(sel, overrides, settings) {
  return isOverridden(sel, overrides) && orderingEnabledFor(sel, settings);
}
function shouldRecordSortOverride(overridden, orderingEnabled) {
  if (overridden) return false;
  return orderingEnabled;
}
function sortMenuRowState(sel, overrides, settings, orders) {
  var _a;
  const hidden = { show: false, checked: false };
  if (!orderingEnabledFor(sel, settings)) return hidden;
  const overridden = isOverridden(sel, overrides);
  const map = sel.kind === "all" ? orders == null ? void 0 : orders.all : (_a = orders == null ? void 0 : orders.bySpaceId) == null ? void 0 : _a[sel.id];
  const saved = !!map && Object.values(map).some((list) => list.length > 0);
  if (!saved && !overridden) return hidden;
  return { show: true, checked: !overridden };
}

// src/runtime/RuntimeStateStore.ts
var KEY = "spaces:runtime";
var LEGACY_KEY = "spacejam:runtime";
var ALL = { kind: "all" };
function parseSelection(raw) {
  if (!raw || typeof raw !== "object") return ALL;
  const sel = raw.activeSelection;
  if (!sel || typeof sel !== "object") return ALL;
  const s = sel;
  if (s.kind === "all") return ALL;
  if (s.kind === "space" && typeof s.id === "string" && s.id) {
    return { kind: "space", id: s.id };
  }
  return ALL;
}
function isBlob(v) {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function parseLayouts(raw) {
  if (!raw || typeof raw !== "object") return {};
  const m = raw.layoutsBySpaceId;
  if (!isBlob(m)) return {};
  const out = {};
  for (const [k, v] of Object.entries(m)) if (isBlob(v)) out[k] = v;
  return out;
}
function parseOverrides(raw) {
  const empty = { all: false, bySpaceId: {} };
  if (!raw || typeof raw !== "object") return empty;
  const r = raw;
  const bySpaceId = {};
  const m = r.nativeSortBySpaceId;
  if (m && typeof m === "object" && !Array.isArray(m)) {
    for (const [k, v] of Object.entries(m)) {
      if (v === true) bySpaceId[k] = true;
    }
  }
  return { all: r.allNativeSort === true, bySpaceId };
}
var RuntimeStateStore = class {
  constructor(backing, onWriteError) {
    this.backing = backing;
    this.onWriteError = onWriteError;
    this.selection = ALL;
    this.allLayout = null;
    this.layouts = {};
    this.overrides = { all: false, bySpaceId: {} };
  }
  load() {
    var _a;
    try {
      const raw = (_a = this.backing.get(KEY)) != null ? _a : this.backing.get(LEGACY_KEY);
      this.selection = parseSelection(raw);
      this.layouts = parseLayouts(raw);
      const a = raw && typeof raw === "object" ? raw.allLayout : void 0;
      this.allLayout = isBlob(a) ? a : null;
      this.overrides = parseOverrides(raw);
    } catch (e) {
      this.selection = ALL;
      this.allLayout = null;
      this.layouts = {};
      this.overrides = { all: false, bySpaceId: {} };
      console.error("Spaces: could not read stored runtime state; starting in All", e);
    }
  }
  getSelection() {
    return this.selection;
  }
  setSelection(selection) {
    this.selection = selection;
    this.persist();
  }
  getLayoutFor(sel) {
    var _a;
    if (sel.kind === "all") return this.allLayout;
    return (_a = this.layouts[sel.id]) != null ? _a : null;
  }
  setLayoutFor(sel, layout) {
    if (sel.kind === "all") this.allLayout = layout;
    else this.layouts[sel.id] = layout;
    this.persist();
  }
  /** Called when a space is deleted, so its layout does not linger forever. */
  dropLayoutFor(spaceId) {
    delete this.layouts[spaceId];
    this.persist();
  }
  getSortOverrides() {
    return this.overrides;
  }
  /** Never writes a saved order; this is view state only. */
  setSortOverride(sel, on) {
    this.overrides = withOverride(this.overrides, sel, on);
    this.persist();
  }
  /** Called when a space is deleted, beside `dropLayoutFor`. */
  dropSortOverrideFor(spaceId) {
    if (this.overrides.bySpaceId[spaceId] === void 0) return;
    this.overrides = withOverride(this.overrides, { kind: "space", id: spaceId }, false);
    this.persist();
  }
  /**
   * Drops any stored per-space layout whose id is not in `knownSpaceIds`.
   * Guards against a space removed by a `data.json` hand-edit (bypassing
   * `dropLayoutFor`, which only runs from the Settings Delete button) leaving
   * its layout blob orphaned forever. Never touches All's layout — All is
   * structural, not a space id.
   */
  reconcileLayouts(knownSpaceIds) {
    const known = new Set(knownSpaceIds);
    let changed = false;
    for (const id of Object.keys(this.layouts)) {
      if (!known.has(id)) {
        delete this.layouts[id];
        changed = true;
      }
    }
    for (const id of Object.keys(this.overrides.bySpaceId)) {
      if (!known.has(id)) {
        this.overrides = withOverride(this.overrides, { kind: "space", id }, false);
        changed = true;
      }
    }
    if (changed) this.persist();
  }
  persist() {
    var _a;
    try {
      this.backing.set(KEY, {
        activeSelection: this.selection,
        ...this.allLayout ? { allLayout: this.allLayout } : {},
        layoutsBySpaceId: this.layouts,
        ...this.overrides.all ? { allNativeSort: true } : {},
        nativeSortBySpaceId: this.overrides.bySpaceId
      });
    } catch (e) {
      (_a = this.onWriteError) == null ? void 0 : _a.call(this, e);
    }
  }
};

// src/visibility/includedPaths.ts
function includedPaths(vault, seedPaths, ignore, excluded) {
  var _a, _b;
  const seeds = /* @__PURE__ */ new Set();
  for (const p of seedPaths) if (vault.exists(p)) seeds.add(p);
  const inherited = /* @__PURE__ */ new Set();
  let filtered = excluded.size > 0;
  for (const seed of seeds) {
    if (vault.kindOf(seed) !== "folder") continue;
    for (const d of vault.descendantsOf(seed)) {
      if (ignore.matches(d)) {
        filtered = true;
        continue;
      }
      if (excluded.has(canonicalPath(d))) continue;
      inherited.add(d);
    }
  }
  const included = /* @__PURE__ */ new Set([...seeds, ...inherited]);
  if (filtered) {
    const carry = /* @__PURE__ */ new Map();
    const carries = (p) => {
      const known = carry.get(p);
      if (known !== void 0) return known;
      let any = false;
      for (const k of vault.childrenOf(p)) {
        if (included.has(k) || vault.kindOf(k) === "folder" && carries(k)) {
          any = true;
          break;
        }
      }
      carry.set(p, any);
      return any;
    };
    const byDepth = [];
    for (const p of included) {
      if (vault.kindOf(p) !== "folder") continue;
      let d = 0;
      for (let i = 0; i < p.length; i++) if (p.charCodeAt(i) === 47) d++;
      ((_a = byDepth[d]) != null ? _a : byDepth[d] = []).push(p);
    }
    for (let d = byDepth.length - 1; d >= 0; d--) {
      for (const p of (_b = byDepth[d]) != null ? _b : []) {
        if (seeds.has(p)) continue;
        if (vault.childrenOf(p).length === 0) continue;
        if (!carries(p)) included.delete(p);
      }
    }
    for (const p of [...inherited]) {
      if (!included.has(p)) inherited.delete(p);
    }
  }
  return { seeds, inherited, included };
}

// src/visibility/resolveLivePath.ts
function resolveLivePath(vault, stored) {
  if (vault.exists(stored)) return stored;
  let at = "";
  for (const seg of stored.split("/")) {
    const want = canonicalPath(seg);
    const offset = at === "" ? 0 : at.length + 1;
    const hit = vault.childrenOf(at).find((c) => canonicalPath(c.slice(offset)) === want);
    if (hit === void 0) return null;
    at = hit;
  }
  return at;
}

// src/visibility/VaultIndex.ts
function ancestorsOf(path) {
  const parts = path.split("/");
  const out = [];
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join("/"));
  return out;
}
function createTreeVaultIndex(kinds) {
  const children = /* @__PURE__ */ new Map();
  const push = (parent, path) => {
    const bucket = children.get(parent);
    if (bucket === void 0) children.set(parent, [path]);
    else bucket.push(path);
  };
  let synthetic = false;
  const synthesised = /* @__PURE__ */ new Set();
  const synthesise = (path) => {
    for (let p = path; p !== "" && !synthesised.has(p); ) {
      synthesised.add(p);
      const cut = p.lastIndexOf("/");
      const parent = cut === -1 ? "" : p.slice(0, cut);
      push(parent, p);
      p = kinds.has(parent) ? "" : parent;
    }
  };
  for (const path of kinds.keys()) {
    const cut = path.lastIndexOf("/");
    if (cut === -1) {
      push("", path);
      continue;
    }
    const parent = path.slice(0, cut);
    if (!kinds.has(parent)) {
      synthetic = true;
      synthesise(parent);
    }
    push(parent, path);
  }
  return {
    exists: (p) => kinds.has(p),
    kindOf: (p) => {
      var _a;
      return (_a = kinds.get(p)) != null ? _a : null;
    },
    childrenOf: (p) => {
      const bucket = children.get(p);
      if (bucket === void 0) return [];
      return synthetic ? bucket.filter((c) => kinds.has(c)) : bucket.slice();
    },
    descendantsOf: (p) => {
      const bucket = children.get(p);
      if (bucket === void 0) return [];
      const out = [];
      const stack = [];
      for (let i = bucket.length - 1; i >= 0; i--) stack.push(bucket[i]);
      while (stack.length > 0) {
        const cur = stack.pop();
        if (kinds.has(cur)) out.push(cur);
        const kids = children.get(cur);
        if (kids !== void 0) {
          for (let i = kids.length - 1; i >= 0; i--) stack.push(kids[i]);
        }
      }
      return out;
    },
    allPaths: () => [...kinds.keys()]
  };
}
function createLazyVaultIndex(build) {
  let built = null;
  const index = () => built != null ? built : built = build();
  return {
    exists: (p) => index().exists(p),
    kindOf: (p) => index().kindOf(p),
    childrenOf: (p) => index().childrenOf(p),
    descendantsOf: (p) => index().descendantsOf(p),
    allPaths: () => index().allPaths()
  };
}

// src/visibility/folderSpace.ts
function isVaultRoot(folderPath) {
  return folderPath === "/" || folderPath === "";
}
function parentPathOf(path) {
  const cut = path.lastIndexOf("/");
  return cut === -1 ? "" : path.slice(0, cut);
}
function hasRoot(space) {
  return typeof (space == null ? void 0 : space.root) === "string";
}
function rootOf(space) {
  const root = space == null ? void 0 : space.root;
  if (typeof root !== "string" || isVaultRoot(root)) return null;
  return root;
}
function isFolderSpace(space) {
  return hasRoot(space);
}
function makePermits(root, elsewhere) {
  return (folderPath, itemPath) => {
    if (!isVaultRoot(folderPath)) return false;
    if (typeof itemPath !== "string") return false;
    if (elsewhere.has(itemPath)) return true;
    return parentPathOf(itemPath) === root;
  };
}
function elsewhereOf(root, livePaths) {
  const prefix = `${root}/`;
  const out = [];
  for (const p of livePaths) {
    if (p === root || p.startsWith(prefix)) continue;
    out.push(p);
  }
  return out.sort();
}

// src/controller/resolveMembers.ts
function resolveMembers(space, tags, properties, ignore) {
  const stored = space.exclude;
  const excluded = stored === void 0 || stored.length === 0 ? null : new Set(stored.map(canonicalPath));
  const out = [];
  expandMembers(space.members, tags, () => properties, excluded, ignore, (m) => out.push(m));
  return out;
}
var MEMBER_NAMING = {
  file: "picked",
  folder: "picked",
  tag: "rule",
  property: "rule"
};
function expandMembers(members, tags, properties, excluded, ignore, add) {
  const seen = /* @__PURE__ */ new Set();
  let naming = "picked";
  const take = (m, key) => {
    if (seen.has(key)) return;
    if (naming === "rule") {
      if (excluded !== null && excluded.has(key)) return;
      if (ignore.matches(m.path)) return;
    }
    seen.add(key);
    add(m, key);
  };
  let index;
  const propertyIndex = () => {
    if (index === void 0) index = properties();
    return index;
  };
  for (const m of members) {
    naming = MEMBER_NAMING[m.kind];
    expandOne(m, take, tags, propertyIndex);
  }
}
function expandOne(m, take, tags, propertyIndex) {
  switch (m.kind) {
    case "file":
    case "folder":
      take(m, canonicalPath(m.path));
      return;
    case "tag":
      for (const path of tags.pathsMatching(m.tag)) {
        take({ kind: "file", path }, canonicalPath(path));
      }
      return;
    case "property": {
      const index = propertyIndex();
      if (index === null) return;
      const matched = m.value === void 0 ? index.pathsWithKey(m.key) : index.pathsMatching(m.key, m.value);
      for (const path of matched) {
        take({ kind: "file", path }, canonicalPath(path));
      }
      return;
    }
    default: {
      const unreached = m;
      return unreached;
    }
  }
}

// src/definitions/membership.ts
function coveringFolder(members, path) {
  return coveringFolderIn(memberFolderSet(members), path);
}
function memberFolderSet(members, vault) {
  const folders = /* @__PURE__ */ new Set();
  for (const m of members) {
    if (m.kind !== "folder") continue;
    if (vault === void 0) {
      folders.add(canonicalPath(m.path));
      continue;
    }
    const live = resolveLivePath(vault, m.path);
    if (live !== null) folders.add(live);
  }
  return { folders, exact: vault !== void 0 };
}
function coveringFolderIn(set, path) {
  const ancestors = ancestorsOf(path);
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const key = set.exact ? ancestors[i] : canonicalPath(ancestors[i]);
    if (set.folders.has(key)) return ancestors[i];
  }
  return null;
}
function inheritedFromFolder(space, path) {
  return coveringFolder(space.members, path);
}
function memberTagSet(members) {
  return new Set(
    members.flatMap((m) => m.kind === "tag" ? [normalizeTag(m.tag)] : [])
  );
}
function coveringTagIn(tags, tag) {
  for (const ancestor of ancestorsOf(normalizeTag(tag))) {
    if (tags.has(ancestor)) return ancestor;
  }
  return null;
}
function pathMembers(space) {
  return space.members.filter(isPathMember);
}
function isPathMember(m) {
  switch (m.kind) {
    case "file":
    case "folder":
      return true;
    case "tag":
    case "property":
      return false;
    default: {
      const unreached = m;
      return unreached;
    }
  }
}
function watchesMetadata(space) {
  if (space === null) return false;
  if (hasRoot(space)) return false;
  return space.members.some((m) => m.kind === "tag" || m.kind === "property");
}
function holdsPropertyMember(space) {
  return space.members.some((m) => m.kind === "property");
}
function armsParseStall(spaces) {
  return activeSpaces(spaces).some(holdsPropertyMember);
}
function resolvedPaths(space, tags, properties, ignore) {
  return new Set(resolveMembers(space, tags, properties, ignore).map((m) => canonicalPath(m.path)));
}
function heldBy(space, resolved, path) {
  var _a;
  if (resolved.has(canonicalPath(path))) return { held: true, viaFolder: null };
  const folder = inheritedFromFolder(space, path);
  if (folder === null) return { held: false, viaFolder: null };
  const excluded = ((_a = space.exclude) != null ? _a : []).some((e) => canonicalPath(e) === canonicalPath(path));
  if (excluded) return { held: false, viaFolder: null };
  return { held: true, viaFolder: folder };
}

// src/visibility/VisibilityEngine.ts
var HIDDEN_NONMEMBER = {
  visible: false,
  reason: "hidden-nonmember",
  canRemoveMembership: false,
  overridesIgnore: false
};
function buildVisibilitySnapshot(vault, space, visitorPaths, ignore, excluded) {
  const exact = /* @__PURE__ */ new Set();
  for (const m of pathMembers(space)) {
    const live = resolveLivePath(vault, m.path);
    if (live !== null) exact.add(live);
  }
  const visitors = /* @__PURE__ */ new Set();
  for (const p of visitorPaths) {
    const live = resolveLivePath(vault, p);
    if (live !== null) visitors.add(live);
  }
  const { inherited, included } = includedPaths(
    vault,
    [...exact, ...visitors],
    ignore,
    excluded
  );
  const scaffold = /* @__PURE__ */ new Set();
  const done = /* @__PURE__ */ new Set();
  for (const p of included) {
    let i = p.lastIndexOf("/");
    if (i === -1) continue;
    let d = p.slice(0, i);
    while (d !== "" && !done.has(d)) {
      done.add(d);
      if (!included.has(d)) scaffold.add(d);
      i = d.lastIndexOf("/");
      if (i === -1) break;
      d = d.slice(0, i);
    }
  }
  const visible = /* @__PURE__ */ new Set([...included, ...scaffold]);
  function reasonFor(path) {
    if (exact.has(path)) return "exact-member";
    if (inherited.has(path)) return "inherited-member";
    if (visitors.has(path)) return "visitor";
    if (scaffold.has(path)) return "scaffold";
    return ignore.matches(path) ? "hidden-ignore" : "hidden-nonmember";
  }
  return {
    visiblePaths: () => new Set(visible),
    decisionFor(path) {
      if (!visible.has(path)) {
        const reason = reasonFor(path);
        return { ...HIDDEN_NONMEMBER, reason };
      }
      return {
        visible: true,
        reason: reasonFor(path),
        canRemoveMembership: exact.has(path),
        overridesIgnore: exact.has(path) && ignore.matches(path)
      };
    }
  };
}

// src/visibility/RevealedSet.ts
var RevealedSet = class {
  constructor() {
    this.revealed = /* @__PURE__ */ new Set();
    /**
     * Dismissals outlive the path still being live — otherwise "Stop showing
     * here" would do nothing at all while the tab is open, which is exactly when
     * a user reaches for it.
     */
    this.dismissed = /* @__PURE__ */ new Set();
    /**
     * Paths that dropped out of the live set on a `pruneClosed: false` sync —
     * i.e. spaces's own layout restoration closed the leaf, not the user.
     * `pruneClosed: false` protects only the ONE sync in which the leaf
     * vanishes; every later ordinary sync sees the same shrunken live set with
     * no way to tell "user closed it" from "restore closed it" unless that
     * distinction is remembered here.
     *
     * The protection is scoped to ONE space visit: `releaseCarried()` empties
     * this set at the start of the next switch. Nothing drained it before, and
     * an indefinite carry contradicted the definition of a visitor as "a
     * path open in a qualifying leaf" — a path revealed in one space stayed
     * revealed in a space it was never opened in, every open-then-switch cycle
     * left a phantom row backed by no leaf, and "Remove from space" appeared
     * to fail because the row came straight back as a visitor.
     *
     * Also cleared when the path is genuinely live again (an ordinary path once
     * more) or dismissed (final).
     */
    this.carried = /* @__PURE__ */ new Set();
    /**
     * Paths that entered via `noteOpened` — i.e. the user opened the file, as
     * opposed to `sync`'s self-healing clause revealing whatever happens to
     * back a live leaf. Only a deliberate open may be carried past a
     * restore; a path revealed solely because a layout restore made it live
     * was never the user's doing.
     *
     * Without provenance, the carry loop below cannot tell those two cases
     * apart and would protect every revealed-but-not-live path — but at the
     * moment a restoring `sync` runs, that set IS the visitor set of the space
     * just being LEFT, whose leaves the incoming space's restore just closed.
     * Switching A → B → A would then carry B's visitor into A: neither an
     * indefinite carry nor a per-visit carry alone records *how* a path became
     * revealed. Recording it here is the missing input; `releaseCarried`'s
     * timing is already correct.
     *
     * Must not outlive the reveal it describes: cleared wherever a path leaves
     * `revealed` (the ordinary prune loop, `dismiss`, `releaseCarried`) or is
     * forgotten (`forget`). Otherwise the flag would survive its path's exit
     * from `revealed`, and a later re-reveal of the same path by `sync` alone
     * would be wrongly treated as deliberate.
     */
    this.deliberate = /* @__PURE__ */ new Set();
  }
  /**
   * End the restore-carry protection. Called at the START of a
   * switch, before the transition runs: the carry exists so that a reveal
   * survives the restore which closed it for the duration of that space
   * visit, and the next switch ends that visit — from then on the path
   * prunes like any other closed tab.
   *
   * It drops only the reveals that exist BECAUSE of the carry (see below). A
   * reveal backed by a live leaf must survive a switch, and `dismissed`
   * is not touched at all — a dismissal is final.
   */
  releaseCarried() {
    for (const p of this.carried) {
      this.revealed.delete(p);
      this.deliberate.delete(p);
    }
    this.carried.clear();
  }
  /**
   * The first exit condition: the path became a member of the active
   * space, so it is no longer a visitor. NOT a dismissal (`dismissed` is
   * untouched) and not final — `sync` re-reveals it while a leaf still backs
   * it, so a member that is still open becomes a visitor again the moment its
   * membership ends.
   */
  forget(path) {
    this.revealed.delete(path);
    this.carried.delete(path);
    this.deliberate.delete(path);
  }
  noteOpened(path) {
    this.dismissed.delete(path);
    this.carried.delete(path);
    this.revealed.add(path);
    this.deliberate.add(path);
  }
  sync(livePaths, opts) {
    for (const p of livePaths) {
      this.revealed.add(p);
      this.carried.delete(p);
    }
    if (!opts.pruneClosed) {
      for (const p of livePaths) {
        this.dismissed.delete(p);
      }
      for (const p of this.revealed) {
        if (!livePaths.has(p) && this.deliberate.has(p)) this.carried.add(p);
      }
    }
    for (const p of [...this.revealed]) {
      if (!livePaths.has(p) && !this.carried.has(p)) {
        this.revealed.delete(p);
        this.deliberate.delete(p);
      }
    }
  }
  dismiss(path) {
    this.dismissed.add(path);
    this.carried.delete(path);
    this.deliberate.delete(path);
  }
  paths() {
    const out = /* @__PURE__ */ new Set();
    for (const p of this.revealed) if (!this.dismissed.has(p)) out.add(p);
    return out;
  }
};

// src/controller/SpaceController.ts
var UNAVAILABLE_PROPERTIES = () => ({ status: "unavailable", unparsed: [] });
function resolvesPropertyMembers(space) {
  return !hasRoot(space) && holdsPropertyMember(space);
}
var SpaceController = class {
  constructor(defs, runtime, vault, host, tags, properties, layout) {
    this.defs = defs;
    this.runtime = runtime;
    this.vault = vault;
    this.host = host;
    this.tags = tags;
    this.properties = properties;
    this.layout = layout;
    this.snapshot = null;
    this.queue = Promise.resolve();
    // Set the guard, suppressing reentrant layout-change and visitor
    // recomputation, then await changeLayout(), which restores leaves one at a
    // time — each firing file-open against the OLD selection, since the new one
    // commits only after transition() resolves below. Without it, main.ts's
    // handlers classify the incoming space's restored tabs as visitors inside
    // the outgoing space's tree: a full snapshot rebuild per restored leaf. It
    // converges either way — this guards against wasted work, not wrong output.
    this.switching = false;
    /**
     * Set once by `dispose()` when the plugin unloads, and never cleared — a
     * disposed controller is dead, not paused.
     *
     * Deliberately NOT `switching`: that flag guards against *wasted* work and
     * is cleared in a `finally`; this one guards against *harmful* work after
     * teardown and must survive every `finally` in the class.
     *
     * The hazard is specific: `switchTo` parks on `layout.transition()`, and
     * everything downstream of that await re-installs what teardown has just
     * removed — leaving a filtered explorer owned by a disabled plugin.
     */
    this.disposed = false;
    /**
     * Owned here rather than derived per-recompute. Restoring a layout closes
     * leaves, so a derived set would make a tabs setting govern visibility.
     */
    this.revealed = new RevealedSet();
    /**
     * The last READY property index this controller saw, used only while the
     * snapshot is unavailable. Never replaced by an unavailable answer.
     *
     * Held for the life of the controller, not for the life of the need: it is
     * not dropped when the last property member is removed, because the next
     * ready snapshot would replace it anyway and a space can regain one between
     * two recomputes. `dispose()` releases it, so teardown does not leave a
     * vault-sized structure reachable.
     */
    this.lastReadyIndex = null;
  }
  /**
   * The vault index is a snapshot, so it is replaced wholesale when the vault
   * changes. Mutating in place keeps every captured controller reference valid.
   */
  setVaultIndex(index) {
    this.vault = index;
  }
  /**
   * The tag index is a snapshot, like the vault index, and is replaced
   * wholesale when a note's metadata changes.
   */
  setTagIndex(index) {
    this.tags = index;
  }
  /**
   * The property snapshot accessor is replaced wholesale when a note's
   * metadata changes, for the reason the tag index is. It is a FUNCTION so a
   * lazy one costs nothing until a property member asks.
   */
  setPropertySnapshot(get) {
    this.properties = get;
  }
  /**
   * The property index the tree is drawn from: the ready one when the
   * snapshot is ready, otherwise the last one that WAS ready, and `null` only
   * when none ever has been (a true first start).
   *
   * Exposed, as `tagIndex()` is, so a membership question asked outside a
   * recompute answers from the same picture the tree was drawn from rather
   * than from a second one that may differ. Not the raw snapshot: while the
   * cache is cold that is `null`, which would make an add path refuse or
   * misjudge a note the tree is showing. Each call asks the accessor, which
   * answers from its own one build, so the cost of asking is a walk only for
   * the FIRST caller after a metadata event. A caller that needs it for
   * several spaces still reads it ONCE and passes it down, so every space it
   * answers for describes one picture.
   */
  drawnPropertyIndex() {
    const snapshot = this.properties();
    if (snapshot.status === "ready") this.lastReadyIndex = snapshot.index;
    return this.lastReadyIndex;
  }
  /**
   * The tag index the CURRENT snapshot was computed from.
   *
   * Exposed so a membership question asked outside a recompute answers from
   * the same picture the tree was drawn from, rather than taking a second,
   * possibly different one. *All*'s "Add to space" menu is the caller.
   */
  tagIndex() {
    return this.tags;
  }
  /** The vault index this controller computes against. */
  vaultIndex() {
    return this.vault;
  }
  activeSpace() {
    const sel = this.runtime.getSelection();
    if (sel.kind === "all") return null;
    const space = this.defs.get().spaces.find((s) => s.id === sel.id);
    return space && !isArchived(space) ? space : null;
  }
  currentSnapshot() {
    return this.snapshot;
  }
  /**
   * Run a layout job with the same serialization and the same `switching`
   * guard a switch gets.
   *
   * `onSelectionDropped` hands `main.ts` a transition to run, and the obvious
   * way to run it is to just call it. That is wrong twice over, and both ways
   * reintroduce the corruption the dropped-selection fix exists to prevent:
   *
   *  - **Off the queue.** `LayoutCoordinator.transition` has no reentrancy
   *    guard and captures the live workspace before its first await. A strip
   *    click landing while the settle transition is parked would start a
   *    second transition that captures a HALF-RESTORED workspace into All's
   *    slot, which is the exact corruption, in a narrower window.
   *  - **Without `switching`.** `refresh()` and `onFileOpened` return early
   *    on that flag. With it clear, any ordinary recompute during the settle
   *    reaches `host.apply`, releasing the switch mask mid-transition.
   *
   * Fire and forget by design: the caller is inside `recompute`, so awaiting
   * the queue from there would be awaiting a slot this call may itself be
   * inside. Saving and restoring `switching` rather than clearing it keeps
   * that nesting harmless if the queue is ever drained re-entrantly.
   */
  runQueuedLayoutJob(job) {
    const run = this.queue.then(async () => {
      if (this.disposed) return;
      const prev = this.switching;
      this.switching = true;
      try {
        await job();
      } catch (e) {
        console.error("[spaces] queued layout job failed", e);
      } finally {
        this.switching = prev;
      }
    });
    this.queue = run.catch(() => void 0);
    return run;
  }
  /**
   * `target` may be a resolver instead of a fixed selection, so a caller whose
   * target is RELATIVE to the current one ("next space") computes it from the
   * committed selection inside the queue. Two rapid presses then advance two
   * spaces; reading the selection at call time made the second press resolve
   * to the same target as the first and run a self-transition.
   */
  async switchTo(target) {
    const run = this.queue.then(async () => {
      var _a, _b;
      if (this.disposed) return;
      const from = this.runtime.getSelection();
      const selection = typeof target === "function" ? target(from) : target;
      if (sameSelection(from, selection)) return;
      this.revealed.releaseCarried();
      this.switching = true;
      try {
        let commit = true;
        if (this.layout) {
          let outcome;
          try {
            outcome = await this.layout.transition(from, selection);
          } catch (e) {
            console.error("[spaces] layout transition failed", e);
            outcome = { kind: "aborted", reason: String(e) };
          }
          if (this.disposed) return;
          commit = outcome.kind !== "rolled-back" && outcome.kind !== "failed-open" && outcome.kind !== "aborted";
          try {
            (_b = (_a = this.layout).onOutcome) == null ? void 0 : _b.call(_a, outcome);
          } catch (e) {
            console.error("[spaces] layout outcome hook failed", e);
          }
        }
        if (commit) this.runtime.setSelection(selection);
        this.recompute({ pruneClosed: false });
      } finally {
        this.switching = false;
      }
    });
    this.queue = run.catch(() => void 0);
    return run;
  }
  /**
   * A file was opened in the main window. Recording it is separate from
   * recomputing, so this still lands correctly while a switch's guard is
   * suppressing refresh() — the post-commit recompute reads the set.
   *
   * A restore fires file-open for every leaf IT reopens, but `noteOpened`'s
   * dismissal wipe means "the user wants to see this again", so during a
   * switch it must not run: spaces's own actions must not mutate spaces's
   * own bookkeeping. `sync` re-adds live paths on the post-commit recompute.
   */
  onFileOpened(path, live = this.host.livePaths()) {
    if (this.switching) return;
    this.revealed.noteOpened(path);
    this.refreshWith(live);
  }
  /**
   * The workspace's active-file signal, translated into revealed-set policy.
   * `null` means the newly active pane names no file: it recomputes with
   * pruning like an ordinary `refresh()`. A string path the walk can see is
   * additionally recorded as deliberately (re)opened via `onFileOpened`, which
   * is what clears a prior dismissal; one the walk cannot see recomputes like
   * `null` (see the gate below). This policy belongs here rather than in
   * main.ts's `file-open` listener, which has no tests.
   */
  onActiveFileChanged(path) {
    if (path === null) {
      this.refresh();
      return;
    }
    const live = this.host.livePaths();
    if (!live.has(path)) {
      this.refreshWith(live);
      return;
    }
    this.onFileOpened(path, live);
  }
  /** "Stop showing here" — drops a reveal without touching membership. */
  dismissRevealed(path) {
    this.revealed.dismiss(path);
    this.refresh();
  }
  /**
   * Recompute from current definitions and re-apply. Cheap and idempotent —
   * except while a switch's layout transition is in flight, when it is a
   * no-op. Only this external entry point is guarded; the internal
   * post-commit recompute above still runs.
   */
  refresh() {
    this.refreshWith(this.host.livePaths());
  }
  /**
   * Call FIRST in the host's teardown, before anything is unpatched: from
   * here the controller does nothing that touches the host.
   *
   * Idempotent, and one-way. A switch already parked on an await still runs to
   * completion — a promise cannot be un-awaited — but it commits nothing,
   * rebinds nothing and applies nothing when it resumes.
   */
  dispose() {
    this.disposed = true;
    this.lastReadyIndex = null;
    this.properties = UNAVAILABLE_PROPERTIES;
  }
  /**
   * `refresh()` for a caller that has already walked the leaves — the guard
   * stays in one place so it cannot be forgotten at a new call site.
   */
  refreshWith(live) {
    if (this.switching) return;
    this.recompute({ pruneClosed: true }, live);
  }
  /**
   * A folder space has no member list, but the visibility engine is written in
   * terms of one — and that engine is where `globalIgnore`, visitors and
   * precedence live. So a folder space presents itself as a space whose single
   * member is its root folder: everything under it is then an inherited member
   * by the existing rules, and the hoist (main.ts) stays a rendering concern
   * rather than a second visibility path.
   *
   * Two `rootOf`-null cases must not be conflated: `rootOf` returns null both
   * for a curated space (no root declared at all) and for a folder space
   * DECLARING an unusable root spelled as the vault root (`""`/`"/"` —
   * `hasRoot` true, the missing-root state). `hasRoot` tells those apart; only
   * the latter falls back to `members`.
   *
   * ANY missing-root shape must render the empty tree: a hand-edited
   * `root: ""` can still carry a leftover `members` list, and rendering those
   * would diverge from a root naming a folder gone from the vault, which
   * empties correctly by the existing mechanism.
   *
   * Storage is left alone — only what is handed to the engine changes.
   */
  membersForSnapshot(space, properties, ignore) {
    if (hasRoot(space)) {
      const root = rootOf(space);
      return root === null ? [] : [{ path: root, kind: "folder" }];
    }
    return resolveMembers(space, this.tags, properties, ignore);
  }
  /**
   * The property index this recompute resolves against, read ONCE and handed
   * to both readers, so the gate and the resolve cannot disagree.
   *
   * `null` without asking at all unless the space's membership actually
   * depends on it: the first ask after a metadata event is a frontmatter walk
   * of the whole vault, and neither a space with no property member nor a
   * folder space — which renders from its root and never reads its member
   * list — may pay for one.
   */
  propertiesFor(space) {
    return resolvesPropertyMembers(space) ? this.drawnPropertyIndex() : null;
  }
  /**
   * Whether this space's membership is still unknown rather than empty.
   *
   * TWO signals, not one, because they measure different things.
   * `metadataReady` is the host's: resolved, and the layout ready. Snapshot
   * readiness is strictly stricter — ONE unparsed file makes the whole
   * property snapshot unavailable (`ObsidianPropertyIndex.ts` says why), and
   * that can outlast `resolved`. Reading only the host's signal let a space
   * pass this gate with no ready index behind it, so `resolveMembers` was
   * handed `properties = null`, every property member contributed nothing,
   * and the space published itself EMPTY. `resolveMembers.ts` states the
   * contract that breaks: null is "not known yet", not "matches nothing", and
   * a caller publishing the result as a membership must hold its previous
   * answer instead.
   *
   * Both arms are cheap in the case that matters. `metadataReady` answers on
   * its own and the index is never asked for, which is why `properties` is a
   * thunk: reading it before this point made a property space pay for a walk
   * at first paint that this gate was about to make pointless. A space that
   * resolves no property member never asks either.
   * `drawnPropertyIndex` keeps the last READY index, so this is false as soon
   * as one has EVER been ready: a cache going cold mid-session neither blanks
   * a space that already has a good answer nor re-opens the tree. Reachable
   * only before the first ready index of a session, which is why the
   * fall-open below is the right posture for it.
   */
  stillReading(space, properties) {
    var _a, _b;
    if (((_b = (_a = this.host).metadataReady) == null ? void 0 : _b.call(_a)) === false) return true;
    return resolvesPropertyMembers(space) && properties() === null;
  }
  recompute(opts, live = this.host.livePaths()) {
    var _a, _b, _c;
    if (this.disposed) return;
    this.revealed.sync(live, opts);
    const space = this.activeSpace();
    if (!space) {
      const current = this.runtime.getSelection();
      if (current.kind === "space") {
        const wasDrawn = this.snapshot !== null;
        this.runtime.setSelection({ kind: "all" });
        if (wasDrawn) (_b = (_a = this.layout) == null ? void 0 : _a.onSelectionDropped) == null ? void 0 : _b.call(_a, current);
      }
      this.snapshot = null;
      this.host.apply(null);
      return;
    }
    let asked;
    const properties = () => asked = asked === void 0 ? this.propertiesFor(space) : asked;
    if (watchesMetadata(space) && this.stillReading(space, properties)) {
      this.snapshot = null;
      this.host.apply(null);
      return;
    }
    const settings = this.defs.get().settings;
    const ignore = compileIgnore(settings.globalIgnore);
    const revealed = this.revealed.paths();
    const visitors = settings.revealVisitors ? revealed : /* @__PURE__ */ new Set();
    this.snapshot = buildVisibilitySnapshot(
      this.vault,
      { ...space, members: [...this.membersForSnapshot(space, properties(), ignore)] },
      visitors,
      ignore,
      new Set(((_c = space.exclude) != null ? _c : []).map(canonicalPath))
    );
    for (const p of revealed) {
      if (live.has(p)) continue;
      const reason = this.snapshot.decisionFor(p).reason;
      if (reason === "exact-member" || reason === "inherited-member") {
        this.revealed.forget(p);
      }
    }
    this.host.apply(this.snapshot);
  }
};

// src/explorer/selectors.ts
var SEL = {
  container: ".nav-files-container",
  /**
   * Carries data-path. We never replace its children — Obsidian built them —
   * but we DO insert exactly one element of our own into it: the compact
   * prefix (`CLS_COMPACT_PREFIX`), placed before `rowText`. That element is
   * identified by its own class and removed again by the same pass, so the
   * row returns to Obsidian's own children by identity rather than by being
   * rewritten to look the same.
   *
   * Nothing else about this element is written: not its text, not its other
   * children, not its order.
   */
  titleWithPath: "[data-path]",
  /** The row container: parentElement of a title. This is what we class. */
  rowWrapper: ".tree-item",
  /**
   * The explorer's own action buttons (new note, new folder, sort,
   * collapse). A click on ANY of them arms a creation intent — deliberately
   * not matched by label, which would couple us to Obsidian's UI copy and
   * break under localisation. Arming is harmless: only a create in the
   * computed destination consumes it, so a click on "collapse all" arms an
   * intent that simply expires.
   */
  navActionButton: ".nav-action-button",
  /** Scopes the above to the FILE explorer; other panes have action buttons too. */
  fileExplorerPane: '.workspace-leaf-content[data-type="file-explorer"]',
  /**
   * The left ribbon's icons, read ONLY to measure where they sit — the create
   * panel lines its name field up with one (`ribbonAlign.ts`). Never clicked,
   * classed or mutated; this is a ruler, not a handle.
   *
   * Two selectors because the ribbon's action elements changed class between
   * Obsidian versions and both spellings are still in the wild. Matching
   * neither is a supported outcome: the ribbon can be hidden from settings and
   * does not exist on mobile, and the alignment simply does not apply then.
   */
  ribbonIcon: ".workspace-ribbon .clickable-icon, .side-dock-ribbon-action",
  /**
   * Obsidian's own multi-select state, carried by the `[data-path]`
   * element of every row in an explorer selection.
   *
   * The one Obsidian-owned class spaces matches that is not structural.
   * `DragOrdering` must read this constant rather than hard-code the class
   * itself — the single genuine escape from this file. It is read OPPORTUNISTICALLY and is never
   * authoritative: the class appears in several unrelated places in Obsidian's
   * UI, so `collectDragged` uses it only to WIDEN a drag the user started on a
   * row already carrying it. If it ever means something else there, the
   * fallback is the correct single-row drag.
   */
  selectedRow: ".is-selected",
  /**
   * The sort button specifically, among the buttons above. Unlike the
   * creation-intent arming above, this one must discriminate — matching
   * "Change sort order" would couple us to Obsidian's UI copy and break
   * under localisation, so the icon class is used instead (measured against
   * 1.13.7: the six explorer buttons are `lucide-edit`, `lucide-folder-plus`,
   * `lucide-sort-asc`, `lucide-gallery-vertical`, `lucide-chevrons-down-up`
   * and `lucide-search`).
   *
   * If Obsidian ever renames it, the row silently stops appearing while the
   * sort-override feature's other surfaces keep working — the intended
   * failure.
   */
  sortButtonIcon: "svg.lucide-sort-asc",
  /**
   * The explorer's "New folder" nav action, identified the same way and for
   * the same reason as `sortButtonIcon` above: by its icon, not its
   * `aria-label`, which is translated and would break in every non-English
   * install.
   *
   * Used to redirect the button into a folder space's pinned folder. If
   * Obsidian renames the icon the redirect silently stops and Obsidian's own
   * behaviour returns — the intended failure, same as the sort row.
   */
  newFolderButtonIcon: "svg.lucide-folder-plus",
  /**
   * Obsidian's toolbar row above the file tree, and the first row of the
   * tree itself. Both are read ONLY to measure where they sit: the vertical
   * strip lines its pinned control and its rail up with them
   * (`stripAlign.ts`). Rulers, not handles -- never clicked, classed or
   * mutated.
   *
   * Matching neither is a supported outcome, the same way the ribbon's is:
   * a theme can hide the toolbar, and a space with no visible rows has no
   * first row. The alignment simply does not apply, and the stylesheet's own
   * spacing stands.
   */
  navHeader: ".nav-header",
  treeRow: ".tree-item-self",
  /**
   * The TEXT element inside a row. UNTOUCHABLE: this plugin never writes it —
   * not its text, not its children, not replaced. It is READ ONLY as an
   * anchor, to insert the compact prefix before.
   *
   * Measured against 1.13.7: the `[data-path]` element is `.tree-item-self`,
   * and its children are the collapse chevron (`.tree-item-icon`) and this.
   * Writing the label onto the `[data-path]` row therefore DESTROYS the
   * chevron and this element, and a row rebuilt that way does not come back
   * when the label is removed — it is left as a bare text node until Obsidian
   * itself re-renders.
   *
   * WHY IT IS UNTOUCHABLE, measured in a live vault: Obsidian makes this
   * element contenteditable for inline rename and SEEDS THE EDITOR FROM ITS
   * TEXT. A compact chain's joined label written here offered
   * `Clients/Meetings` for a folder whose real name is `Meetings`; accepting
   * it resolved against the parent and failed with
   * `ENOENT ... -> ...\Clients\Clients\Meetings`. Editing only the tail failed
   * the same way, so a compacted folder could not be renamed at all unless
   * the user deleted the `Clients/` prefix by hand, with nothing to say why.
   * Its text already IS the folder's real name, which is exactly the label's
   * tip, so there is nothing to gain by writing it and a rename to lose.
   *
   * Resolved from the row, never assumed: a row that does not have one is
   * left exactly as Obsidian drew it — no prefix and no class — rather than
   * labelled on the row instead.
   */
  rowText: ".tree-item-inner"
};
var CLS = {
  scaffold: "spaces-scaffold",
  visitor: "spaces-visitor",
  // Deliberately NOT in `ALL_OWNED_CLASSES`: the per-row class loop would
  // strip it each pass, and `applyCompactLabels` owns it alongside the prefix
  // element it belongs to.
  compacted: "spaces-compacted"
};
var CLS_COMPACT_PREFIX = "spaces-compact-prefix";
var CLS_ELSEWHERE = "spaces-elsewhere";
var ALL_OWNED_CLASSES = [CLS.scaffold, CLS.visitor, CLS_ELSEWHERE];
var CLS_SWITCHING = "spaces-switching";
var CLS_DROP_LINE = "spaces-drop-line";
var CLS_DROP_BOX = "spaces-drop-box";
var CLS_GAP_DRAG = "spaces-gap-drag";
var CLS_BOX_OPEN = "is-open";
var CLS_CLAIMS_DROP = "spaces-claims-drop";
var CLS_DROP_PARENT = "spaces-drop-parent";
var CLS_SPACE_DROP_LINE = "spaces-space-drop-line";
var CLS_SPACE_DRAGGING = "is-being-dragged";
var CLS_STRIP_HIDDEN = "spaces-strip-hidden";
var CLS_STRIP_OPEN = "spaces-strip-open";
var CLS_STRIP_FOCUS = "spaces-strip-focus";
var CLS_STRIP_ZONE = "spaces-strip-zone";

// src/ui/compactLabel.ts
var GAP = "..";
function maxDrop(segments) {
  return Math.max(0, segments.length - 2);
}
function dropped(segments, opts) {
  if (!Number.isFinite(opts.drop)) return 0;
  return Math.min(Math.max(0, Math.trunc(opts.drop)), maxDrop(segments));
}
function compactLabel(segments, opts) {
  const drop = dropped(segments, opts);
  const parts = [];
  if (drop > 0) parts.push({ text: GAP, role: "gap" });
  const shown = segments.slice(drop);
  shown.forEach((name, i) => {
    if (i > 0 || drop > 0) parts.push({ text: "/", role: "sep" });
    parts.push({ text: name, role: i === shown.length - 1 ? "tip" : "lead" });
  });
  return parts;
}
function isAbbreviated(parts) {
  return parts.some((p) => p.role === "gap");
}

// src/explorer/ExplorerAdapter.ts
var ARIA_LABEL = "aria-label";
var RELABEL_FRAME_MS = 16;
var OVERFLOW_SLACK = 1;
var ourTooltips = /* @__PURE__ */ new WeakSet();
function rowOverflows(title) {
  if (title.scrollWidth > title.clientWidth + OVERFLOW_SLACK) return true;
  const textEl = title.querySelector(`:scope > ${SEL.rowText}`);
  if (!textEl) return false;
  return textEl.scrollWidth > textEl.clientWidth + OVERFLOW_SLACK;
}
var ExplorerAdapter = class {
  /**
   * The measuring step, substitutable for the reason `OverflowProbe`
   * documents: no test environment lays anything out.
   *
   * A defaulted constructor argument rather than a setter, so production
   * constructs this class exactly as it always did and no branch exists that
   * only a test can take.
   */
  constructor(overflows = rowOverflows) {
    this.overflows = overflows;
    this.containers = [];
    this.observers = [];
    /** One per bound container, disconnected in `unbind()` with the rest. */
    this.resizeObservers = [];
    /** The pass armed by `onPaneResize`, cleared in `unbind()`. */
    this.resizeTimer = 0;
    this.snapshot = null;
    /**
     * `apply()` takes only a snapshot, and a snapshot carries no order — there
     * is no way to ask it "which row is first". The caller
     * (`main.ts`) computed the elsewhere group's order to build the hoisted
     * tree in the first place, so it hands the one path to mark here rather
     * than this class inventing its own idea of ordering. Held exactly like
     * `snapshot` — set by `apply()`, read by every `applyNow()` pass including
     * the ones the MutationObserver drives, since the marked row can arrive in
     * the DOM after the queued re-sort completes, well after this `apply()`
     * call returned.
     */
    this.elsewhereFirst = null;
    this.chainIndex = null;
    /**
     * Seeded to the shipped default rather than to "never shorten".
     *
     * It is only ever read with a non-null `chainIndex`, which cannot exist
     * before `setChainIndex` has supplied both — so this value is unreachable in
     * practice. It matches `DEFAULT_DEFINITIONS` anyway, so the failure mode if
     * that ever stops being true is the shipped behaviour rather than a silently
     * disabled setting.
     */
    this.labelPolicy = { abbreviateWhenOverflowing: true };
    /**
     * The current measurement regime, bumped by anything that can change what
     * fits in the pane.
     *
     * A row already drawn short is normally left alone: deciding again means
     * drawing the full label to measure it, and a pass that rewrote the prefix
     * every time would be seen by this class's own MutationObserver and schedule
     * the next pass forever. So the decision stands until something that could
     * change it happens, and the bump is how this class says so.
     *
     * NEVER RESET, including by `unbind()`. It is a sequence number, not a
     * state: a row decided under epoch 4 must still read as stale after a
     * rebind, and setting it back to zero would make a stale decision look
     * current. It costs one integer that no teardown has to remember.
     */
    this.measureEpoch = 0;
    /**
     * Which epoch each row's standing decision was taken under.
     *
     * Beside the epoch rather than inside the pass, because the pass is
     * stateless and the question outlives it: a row absent from one pass is
     * asked about by the next. See `LabelPassOptions.decidedAt`.
     */
    this.decidedAt = /* @__PURE__ */ new WeakMap();
    /**
     * Every row this adapter currently has a prefix element on.
     *
     * See `LabelPassOptions.drawn` for why a record is the only thing that can
     * reach a row Obsidian has detached. Held per adapter rather than per module
     * because it is a list of what to UNDO, and undoing is this instance's job.
     *
     * It does not grow without bound: an entry goes in when a prefix is drawn
     * and comes out when it is removed, and `bindAll` calls `unbind()` first,
     * which empties it on every layout change.
     *
     * Most of what it keeps alive between those points is what Obsidian is
     * keeping alive anyway, on its own tree items. NOT ALL of it: a row whose
     * folder is deleted or renamed while the row is detached is never drawn
     * again and so is never restored, and this is a strong `Set`, so that one
     * element outlives Obsidian's own tree item until the next
     * `bind`/`unbind`. Bounded by a layout change, which is why it is accepted
     * — and a `WeakSet` is not the alternative it looks like, because the
     * record has to be ITERATED at teardown and a `WeakSet` cannot be.
     */
    this.drawn = /* @__PURE__ */ new Set();
    this.frame = 0;
    this.healthy = true;
    this.healthListener = null;
  }
  /**
   * Set with the snapshot, because the runs are a function of it.
   *
   * The policy is a REQUIRED second argument, not a separate setter with a
   * default, so a caller cannot hand over an index and forget it — which
   * would silently draw every row with the shipped behaviour whatever the
   * user had chosen, and pass the whole suite.
   */
  setChainIndex(index, policy) {
    if (index !== this.chainIndex || policy.abbreviateWhenOverflowing !== this.labelPolicy.abbreviateWhenOverflowing) {
      this.measureEpoch += 1;
    }
    this.chainIndex = index;
    this.labelPolicy = policy;
  }
  /**
   * Fires only on a healthy/unhealthy transition (not on every apply pass),
   * including transitions triggered internally by the MutationObserver, not
   * just the applies the caller initiates directly. This lets a caller show
   * a single Notice per break without tracking apply-by-apply state itself.
   */
  onHealthChange(fn) {
    this.healthListener = fn;
  }
  /** The single-container case, which is every case but a split explorer. */
  bind(container) {
    this.bindAll([container]);
  }
  /**
   * Bind every main-window file explorer's container at once.
   *
   * Wholesale, not incremental: `changeLayout()` replaces containers rather
   * than mutating the set, so a diffing rebind would be machinery serving a
   * case that does not arise — and `unbind()` first is what guarantees the
   * owned classes come off the OUTGOING nodes while they can still be reached
   *. Duplicates are dropped so a caller that queries the same node twice
   * cannot install two observers on it.
   */
  bindAll(containers) {
    this.unbind();
    for (const container of containers) {
      if (this.containers.includes(container)) continue;
      this.containers.push(container);
      const observer = new MutationObserver(() => this.schedule());
      observer.observe(container, { childList: true, subtree: true });
      this.observers.push(observer);
      const view = container.ownerDocument.defaultView;
      if (!view) continue;
      const resize = new view.ResizeObserver(() => this.onPaneResize());
      resize.observe(container);
      this.resizeObservers.push(resize);
    }
  }
  /**
   * A resize, then one pass with the decision retaken -- in the next frame,
   * not after the drag stops.
   *
   * ARMED, NOT RESTARTED, AND IT USED TO BE DEBOUNCED. A 120ms settle timer
   * was restarted by every callback, so a sidebar drag relabelled nothing at
   * all while it moved and then snapped once, a tenth of a second after the
   * pointer came to rest. The reasoning for it was that a label nobody can
   * read mid-drag is worth nothing, and that is wrong twice: the row is what
   * the user is dragging the pane to read, and the snap arrives after they
   * have stopped looking for it. Obsidian's own text reflows under the same
   * drag, so ours standing still reads as the plugin lagging the app.
   *
   * ONE PASS PER FRAME IS THE CEILING, which is what makes this affordable:
   * the observer delivers at most once a frame, a pass is synchronous, and a
   * pass already armed swallows every further callback until it runs. The
   * climb inside the pass costs one layout per level given up, and during a
   * drag that is a level or two, because the row starts each pass where the
   * last one left it.
   */
  onPaneResize() {
    if (this.resizeTimer) return;
    this.resizeTimer = window.setTimeout(() => {
      this.resizeTimer = 0;
      this.measureEpoch += 1;
      this.applyNow();
    }, RELABEL_FRAME_MS);
  }
  unbind() {
    var _a;
    for (const observer of this.observers) observer.disconnect();
    this.observers = [];
    for (const resize of this.resizeObservers) resize.disconnect();
    this.resizeObservers = [];
    if (this.resizeTimer) {
      window.clearTimeout(this.resizeTimer);
      this.resizeTimer = 0;
    }
    if (this.frame) {
      window.cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
    this.clearOwnedClasses("everywhere");
    this.containers = [];
    this.snapshot = null;
    this.elsewhereFirst = null;
    const wasHealthy = this.healthy;
    this.healthy = true;
    if (!wasHealthy) (_a = this.healthListener) == null ? void 0 : _a.call(this, true);
  }
  isHealthy() {
    return this.healthy;
  }
  /**
   * There is deliberately no `currentSnapshot()` here.
   *
   * The snapshot this class holds is the DOM layer's working copy — what the
   * last `applyNow()` wrote, nulled by `unbind()`, which is a DOM-PRESENCE
   * event and says nothing about which space is active. `filterAndOrderFolder`
   * used to read it to decide which files exist in the tree, making a domain
   * decision depend on this layer's lifecycle; it reads
   * `SpaceController.currentSnapshot()` now, which is where the snapshot is
   * owned and which the other two consumers (`creation.ts`, `membershipMenu.ts`)
   * already read. Keeping a public reader here would invite that back.
   */
  /**
   * Take everything of ours back off, wherever it ended up.
   *
   * THREE REACHES, because no one of them finds every row. The tree is
   * WINDOWED and the containers are REPLACED, so "the rows I can see from the
   * container I hold" — which is all this used to be — is the smallest of the
   * three sets and the only one that is never enough.
   *
   *  - The bound CONTAINERS. Still first, and still necessary: a container may
   *    be detached from its document by the time this runs (`changeLayout()`
   *    replaces `.nav-files-container`, and `bindExplorer` unbinds when it
   *    finds none), and a detached container is not reachable from the
   *    document either. Its rows carry no prefix unless they were compacted,
   *    so the record does not hold them either — pinned by the detached-
   *    container case in `tests/compactTeardownSweep.test.ts`.
   *  - The DOCUMENTS those containers and rows belong to, asked for our own
   *    classes rather than enumerated row by row. This is what reaches the
   *    LIVE tree when the adapter is holding an outgoing container —
   *    `bindExplorer` documents that exact window, where a cleanup scoped to
   *    what we hold "can never reach the live tree either". Asking for our
   *    classes also costs one query per class instead of a pass over every
   *    row in the vault's rendered window.
   *  - The RECORD of rows a prefix was drawn on, which is the only reach that
   *    finds a row Obsidian has DETACHED — see `LabelPassOptions.drawn`.
   *
   * Overlap between the three is free: every removal here is idempotent.
   *
   * THE SCOPE ARGUMENT, and why it is not an optimisation. The document reach
   * is for ONE window — the moment the adapter is holding a container the
   * layout has already replaced — and `unbind()`/teardown is the only caller
   * inside it. The other two callers are `applyNow`'s null-snapshot branch,
   * which runs on every apply while filtering is PAUSED (an ordinary state the
   * user can sit in all day), and its unhealthy branch, which runs on every
   * MutationObserver pass while the DOM contract looks broken. Both still hold
   * their containers; neither is in that window. Sweeping the whole document
   * there asks every document for our three owned classes and our prefix
   * element, repeatedly, to find rows that are by definition inside the tree
   * we are bound to.
   */
  clearOwnedClasses(reach) {
    const roots = [...this.containers];
    if (reach === "everywhere") {
      const docs = /* @__PURE__ */ new Set();
      for (const c of this.containers) docs.add(c.ownerDocument);
      for (const title of this.drawn) docs.add(title.ownerDocument);
      for (const doc of docs) roots.push(doc);
    }
    for (const root of roots) {
      for (const cls of ALL_OWNED_CLASSES) {
        root.querySelectorAll(`.${cls}`).forEach((el) => el.classList.remove(cls));
      }
      root.querySelectorAll(`.${CLS_COMPACT_PREFIX}`).forEach((prefix) => {
        const title = prefix.parentElement;
        if (!title) return;
        title.removeAttribute(ARIA_LABEL);
        restoreRow(title, this.drawn);
      });
    }
    for (const title of [...this.drawn]) restoreRow(title, this.drawn);
  }
  /** Coalesce bursts of mutations into a single pass. */
  schedule() {
    if (this.frame) return;
    this.frame = window.requestAnimationFrame(() => {
      this.frame = 0;
      this.applyNow();
    });
  }
  /**
   * Returns the number of rows whose classes actually changed.
   *
   * `elsewhereFirst` defaults to `null`: most callers, and every
   * space that is not a folder space, have no elsewhere group at all, and
   * `null` classes nothing rather than requiring every call site to pass it.
   */
  apply(snapshot, elsewhereFirst = null) {
    this.snapshot = snapshot;
    this.elsewhereFirst = elsewhereFirst;
    return this.applyNow();
  }
  applyNow() {
    var _a, _b;
    if (this.containers.length === 0) return 0;
    if (this.snapshot === null) {
      this.clearOwnedClasses("bound");
      return 0;
    }
    const titles = [];
    for (const c of this.containers) {
      c.querySelectorAll(SEL.titleWithPath).forEach((t) => titles.push(t));
    }
    let rowCount = 0;
    for (const c of this.containers) rowCount += c.querySelectorAll(SEL.rowWrapper).length;
    if (titles.length === 0 && rowCount > 0) {
      const wasHealthy2 = this.healthy;
      this.healthy = false;
      this.clearOwnedClasses("bound");
      if (wasHealthy2) (_a = this.healthListener) == null ? void 0 : _a.call(this, false);
      return 0;
    }
    const wasHealthy = this.healthy;
    this.healthy = true;
    if (!wasHealthy) (_b = this.healthListener) == null ? void 0 : _b.call(this, true);
    let changed = 0;
    for (const title of titles) {
      const path = title.getAttribute("data-path");
      const wrapper = title.parentElement;
      if (!path || !wrapper) continue;
      const d = this.snapshot.decisionFor(path);
      const want = {
        [CLS.scaffold]: d.visible && d.reason === "scaffold",
        [CLS.visitor]: d.visible && d.reason === "visitor",
        // Not derived from `d`: this is an ORDER fact the caller computed,
        // not a visibility reason `decisionFor` knows about.
        [CLS_ELSEWHERE]: path === this.elsewhereFirst
      };
      for (const cls of ALL_OWNED_CLASSES) {
        const has = wrapper.classList.contains(cls);
        if (want[cls] && !has) {
          wrapper.classList.add(cls);
          changed++;
        } else if (!want[cls] && has) {
          wrapper.classList.remove(cls);
          changed++;
        }
      }
    }
    applyCompactLabels(titles, this.chainIndex, this.labelPolicy, {
      epoch: this.measureEpoch,
      decidedAt: this.decidedAt,
      overflows: this.overflows,
      drawn: this.drawn
    });
    return changed;
  }
};
function applyCompactLabels(titles, index, policy, pass = {}) {
  var _a, _b;
  const overflows = (_a = pass.overflows) != null ? _a : rowOverflows;
  const drawn = pass.drawn;
  const decidedAt = pass.decidedAt;
  const epoch = (_b = pass.epoch) != null ? _b : 0;
  const settle = (title, textEl, run, drop) => {
    drawRow(title, textEl, run, drop, drawn);
    decidedAt == null ? void 0 : decidedAt.set(title, epoch);
  };
  const undecided = [];
  for (const title of titles) {
    const path = title.getAttribute("data-path");
    if (!path) continue;
    const textEl = title.querySelector(`:scope > ${SEL.rowText}`);
    const run = index == null ? void 0 : index.runByTip.get(path);
    if (!textEl || !index || !run || !drawnWhereTheHeadWas(title, run, index)) {
      restoreRow(title, drawn);
      continue;
    }
    if (!policy.abbreviateWhenOverflowing) {
      settle(title, textEl, run, 0);
      continue;
    }
    const current = decidedAt ? decidedAt.get(title) === epoch : epoch === 0;
    const standing = current ? drawnDropOn(title, run) : null;
    if (standing !== null && standing > 0) {
      settle(title, textEl, run, standing);
      continue;
    }
    settle(title, textEl, run, 0);
    undecided.push({ title, run, drop: 0 });
  }
  let pending = undecided;
  while (pending.length > 0) {
    const tooLong = pending.filter((row) => overflows(row.title));
    pending = [];
    for (const row of tooLong) {
      if (row.drop >= maxDrop(row.run.segments)) continue;
      const textEl = row.title.querySelector(`:scope > ${SEL.rowText}`);
      if (!textEl) continue;
      row.drop += 1;
      settle(row.title, textEl, row.run, row.drop);
      pending.push(row);
    }
  }
}
function drawnWhereTheHeadWas(title, run, index) {
  var _a;
  const childrenEl = (_a = title.parentElement) == null ? void 0 : _a.parentElement;
  const ancestorRow = childrenEl == null ? void 0 : childrenEl.parentElement;
  const ancestorTitle = ancestorRow == null ? void 0 : ancestorRow.querySelector(
    `:scope > ${SEL.treeRow}${SEL.titleWithPath}`
  );
  const ancestorPath = ancestorTitle == null ? void 0 : ancestorTitle.getAttribute("data-path");
  if (!ancestorPath) return true;
  return index.hiddenSegments.get(ancestorPath) !== run;
}
function textOf(run, drop) {
  return partsFor(run, drop).map((p) => p.text).join("");
}
function drawnDropOn(title, run) {
  const text = prefixTextOn(title);
  if (text === null) return null;
  for (let drop = 0; drop <= maxDrop(run.segments); drop++) {
    if (textOf(run, drop) === text) return drop;
  }
  return null;
}
function partsFor(run, drop) {
  return compactLabel(run.segments, { drop }).filter((p) => p.role !== "tip");
}
function prefixTextOn(title) {
  const prefix = title.querySelector(`:scope > .${CLS_COMPACT_PREFIX}`);
  return prefix ? prefix.textContent : null;
}
function drawRow(title, textEl, run, drop, drawn) {
  var _a;
  const label = compactLabel(run.segments, { drop });
  const parts = partsFor(run, drop);
  const text = parts.map((p) => p.text).join("");
  let prefix = title.querySelector(`:scope > .${CLS_COMPACT_PREFIX}`);
  if (!prefix) {
    prefix = textEl.ownerDocument.win.createSpan({ cls: CLS_COMPACT_PREFIX });
    title.insertBefore(prefix, textEl);
  }
  if (prefix.textContent !== text) {
    prefix.replaceChildren(
      ...parts.map(
        (p) => textEl.ownerDocument.win.createSpan({ cls: `spaces-compact-${p.role}`, text: p.text })
      )
    );
  }
  if (isAbbreviated(label)) {
    title.setAttribute(ARIA_LABEL, run.tip);
    ourTooltips.add(title);
  } else if (ourTooltips.has(title)) {
    title.removeAttribute(ARIA_LABEL);
    ourTooltips.delete(title);
  }
  (_a = title.parentElement) == null ? void 0 : _a.classList.add(CLS.compacted);
  drawn == null ? void 0 : drawn.add(title);
}
function restoreRow(title, drawn) {
  var _a;
  const prefix = title.querySelector(`:scope > .${CLS_COMPACT_PREFIX}`);
  if (prefix) prefix.remove();
  if (ourTooltips.has(title)) {
    title.removeAttribute(ARIA_LABEL);
    ourTooltips.delete(title);
  }
  (_a = title.parentElement) == null ? void 0 : _a.classList.remove(CLS.compacted);
  drawn == null ? void 0 : drawn.delete(title);
}

// src/ui/SwitcherView.ts
var import_obsidian5 = require("obsidian");

// src/ui/IconPickerPopover.ts
var import_obsidian = require("obsidian");

// src/ui/AnchoredPopover.ts
var AnchoredPopover = class {
  constructor(opts) {
    this.opts = opts;
    this.el = null;
    this.doc = null;
    this.onKeydown = (e) => {
      var _a, _b;
      if (e.key !== "Escape") return;
      if ((_b = (_a = this.opts).suppressEscape) == null ? void 0 : _b.call(_a)) return;
      e.preventDefault();
      this.close();
    };
    this.onDocMouseDown = (e) => {
      var _a;
      const t = e.target;
      if (t instanceof Node && ((_a = this.el) == null ? void 0 : _a.contains(t))) return;
      this.close();
    };
    this.onResize = () => this.close();
    /**
     * A scroll ELSEWHERE moves the anchor out from under a fixed element, so the
     * popover would point at nothing and closing beats drifting. A scroll INSIDE
     * is the user reading the contents — the listener is on the document in
     * capture, so without this check the popover dismissed itself the moment
     * anyone scrolled its own list.
     */
    this.onOutsideScroll = (e) => {
      var _a;
      const t = e.target;
      if (t instanceof Node && ((_a = this.el) == null ? void 0 : _a.contains(t))) return;
      this.close();
    };
  }
  get isOpen() {
    return this.el !== null;
  }
  get root() {
    return this.el;
  }
  open() {
    var _a;
    this.close();
    const doc = this.opts.anchor.ownerDocument;
    this.doc = doc;
    const el = doc.win.createDiv();
    el.className = this.opts.className;
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-label", this.opts.ariaLabel);
    doc.body.appendChild(el);
    this.el = el;
    this.opts.build(el, this);
    this.reposition();
    doc.addEventListener("keydown", this.onKeydown, true);
    doc.addEventListener("mousedown", this.onDocMouseDown, true);
    (_a = doc.defaultView) == null ? void 0 : _a.addEventListener("resize", this.onResize);
    doc.addEventListener("scroll", this.onOutsideScroll, true);
  }
  /**
   * Above the anchor, left-aligned, clamped into the viewport, falling below
   * only when there is no room above. Call again whenever the contents change
   * height, or a shorter list leaves the popover floating away from its anchor.
   */
  reposition() {
    var _a;
    const el = this.el;
    const view = (_a = this.doc) == null ? void 0 : _a.defaultView;
    if (!el || !view) return;
    const a = this.opts.anchor.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = a.left;
    const maxLeft = view.innerWidth - rect.width - margin;
    if (left > maxLeft) left = maxLeft;
    if (left < margin) left = margin;
    const above = a.top - rect.height - 6;
    const below = a.bottom + 6;
    const fitsAbove = above >= margin;
    const fitsBelow = below + rect.height <= view.innerHeight - margin;
    let top;
    if (this.opts.placement === "below") {
      top = fitsBelow ? below : fitsAbove ? above : margin;
    } else {
      top = fitsAbove ? above : Math.min(below, view.innerHeight - rect.height - margin);
    }
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }
  /**
   * Closes if the anchor has left the document, and does nothing otherwise.
   *
   * An anchor can be destroyed with no event a popover could listen for:
   * `SwitcherView.render()` and `SpaceHeaderView.render()` both rebuild their
   * row with `replaceChildren()`, and a space switch replaces the left split's
   * DOM wholesale. Left alone, the popover floats over a detached anchor and
   * the next `reposition()` measures an all-zero rect.
   *
   * `isConnected`, checked by the owner at the one moment it destroys the
   * anchor, rather than a `MutationObserver`: the observer would have to watch
   * `body`'s whole subtree for the life of every popover to learn what a
   * property read tells us for free, and it would answer a microtask late.
   */
  closeIfAnchorDetached() {
    if (!this.el) return;
    if (this.opts.anchor.isConnected) return;
    this.close();
  }
  /**
   * Idempotent, and scoped to this instance: it removes only the listeners
   * this popover added and only the element it created, so a stale reference
   * held by an owner after a self-dismissal is inert rather than destructive.
   */
  close() {
    var _a, _b, _c, _d;
    const wasOpen = this.el !== null;
    const doc = this.doc;
    if (doc) {
      doc.removeEventListener("keydown", this.onKeydown, true);
      doc.removeEventListener("mousedown", this.onDocMouseDown, true);
      (_a = doc.defaultView) == null ? void 0 : _a.removeEventListener("resize", this.onResize);
      doc.removeEventListener("scroll", this.onOutsideScroll, true);
    }
    (_b = this.el) == null ? void 0 : _b.remove();
    this.el = null;
    this.doc = null;
    if (wasOpen) (_d = (_c = this.opts).onClose) == null ? void 0 : _d.call(_c);
  }
};

// src/ui/createSpaceForm.ts
var PRESET_ICONS = [
  "box",
  "microscope",
  "briefcase",
  "book",
  "code",
  "palette",
  "target",
  "sprout"
];
function emptyForm(color) {
  return { name: "", icon: "", color, items: [], root: "", folderMode: false };
}
function isFolderForm(s) {
  return s.root !== "" && s.root !== "/";
}
function setRoot(s, path) {
  return { ...s, root: path };
}
function setFolderMode(s, on) {
  if (s.folderMode === on) return s;
  return { ...s, folderMode: on };
}
function modeHoldsChoice(s, folderMode) {
  return folderMode ? isFolderForm(s) : s.items.length > 0;
}
function collapseMode(s, folderMode) {
  return modeHoldsChoice(s, folderMode) ? s : setFolderMode(s, false);
}
function validateForm(s) {
  const trimmed = s.name.trim();
  if (trimmed === "") {
    return { field: "name", message: "give the space a name." };
  }
  if (trimmed.length > MAX_SPACE_NAME_LENGTH) {
    return { field: "name", message: `keep the name under ${MAX_SPACE_NAME_LENGTH} characters.` };
  }
  if (s.folderMode && !isFolderForm(s)) {
    return {
      field: "root",
      message: "select a folder to pin, or deselect 'Folder pinned'."
    };
  }
  return null;
}
function sameEntry(a, b) {
  if (a.kind === "tag" || b.kind === "tag") {
    return a.kind === "tag" && b.kind === "tag" && a.tag === b.tag;
  }
  if (a.kind === "property" || b.kind === "property") {
    return a.kind === "property" && b.kind === "property" && memberIdentity(a) === memberIdentity(b);
  }
  return a.path === b.path;
}
function covers(outer, inner) {
  if (outer.kind === "tag") {
    return inner.kind === "tag" && tagMatches(normalizeTag(outer.tag), normalizeTag(inner.tag));
  }
  if (outer.kind !== "folder" || inner.kind !== "file" && inner.kind !== "folder") return false;
  return inner.path !== outer.path && inner.path.startsWith(`${outer.path}/`);
}
function toggleItem(s, entry) {
  const without = s.items.filter((i) => !sameEntry(i, entry));
  if (without.length !== s.items.length) return { ...s, items: without };
  if (s.items.some((i) => covers(i, entry))) return s;
  return { ...s, items: [...s.items.filter((i) => !covers(entry, i)), entry] };
}
var basename = (p) => p.slice(p.lastIndexOf("/") + 1);
function folderCandidates(src, query, limit = 20) {
  const q = query.trim().toLowerCase();
  const folders = src.allPaths().filter((p) => src.kindOf(p) === "folder" && p !== "/" && p !== "");
  if (q === "") {
    return folders.filter((p) => !p.includes("/")).sort((a, b) => a.localeCompare(b)).slice(0, limit);
  }
  const matches = folders.filter((p) => p.toLowerCase().includes(q));
  matches.sort((a, b) => {
    const ap = basename(a).toLowerCase().startsWith(q) ? 0 : 1;
    const bp = basename(b).toLowerCase().startsWith(q) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
  return matches.slice(0, limit);
}
function toCreateOptions(s) {
  const base = { icon: s.icon === "" ? PRESET_ICONS[0] : s.icon, color: s.color };
  if (s.folderMode && isFolderForm(s)) {
    return { ...base, root: s.root, members: [] };
  }
  return { ...base, members: [...s.items] };
}

// src/definitions/appearance.ts
var PALETTE = [
  "#808080",
  "#5b5bff",
  "#4ecdc4",
  "#ff6b6b",
  "#f0a35e",
  "#9b6bff"
];
var DEFAULT_SPACE_COLOR = PALETTE[0];
var PALETTE_NAMES = [
  "Neutral",
  "Indigo",
  "Teal",
  "Coral",
  "Amber",
  "Violet"
];
function normalizeHex(input) {
  const raw = input.trim().toLowerCase();
  const body = raw.startsWith("#") ? raw.slice(1) : raw;
  if (/^[0-9a-f]{3}$/.test(body)) {
    return `#${body[0]}${body[0]}${body[1]}${body[1]}${body[2]}${body[2]}`;
  }
  if (/^[0-9a-f]{6}$/.test(body)) return `#${body}`;
  return null;
}
function isIconIdShape(id) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) && id.length <= 64;
}

// src/ui/iconPicker.ts
var CURATED_ICONS = [
  ...PRESET_ICONS,
  "folder",
  "file-text",
  "notebook-pen",
  "calendar",
  "check-square",
  "list-todo",
  "star",
  "heart",
  "flag",
  "bookmark",
  "lightbulb",
  "flask-conical",
  "graduation-cap",
  "building-2",
  "users",
  "message-square",
  "mail",
  "phone",
  "camera",
  "music",
  "film",
  "gamepad-2",
  "plane",
  "map-pin",
  "compass",
  "wrench",
  "cpu",
  "database",
  "terminal",
  "git-branch",
  "shield",
  "key"
];
function normalizeIconId(id) {
  return id.startsWith("lucide-") ? id.slice("lucide-".length) : id;
}
function basenameRank(id, q) {
  return id.startsWith(q) ? 0 : 1;
}
function iconSearchResults(args) {
  var _a, _b;
  const limit = (_a = args.limit) != null ? _a : 60;
  const q = args.query.trim().toLowerCase();
  if (q === "") return [...(_b = args.curated) != null ? _b : CURATED_ICONS].slice(0, limit);
  const seen = /* @__PURE__ */ new Set();
  const matches = [];
  for (const raw of args.allIds) {
    const id = normalizeIconId(raw);
    if (seen.has(id)) continue;
    if (!id.toLowerCase().includes(q)) continue;
    seen.add(id);
    matches.push(id);
  }
  matches.sort((a, b) => {
    const ar = basenameRank(a, q);
    const br = basenameRank(b, q);
    if (ar !== br) return ar - br;
    if (a.length !== b.length) return a.length - b.length;
    return a.localeCompare(b);
  });
  return matches.slice(0, limit);
}
function renderableIcon(stored, known, fallback = "box") {
  if (!stored) return fallback;
  const id = normalizeIconId(stored);
  if (known.size === 0) return id;
  return known.has(id) ? id : fallback;
}

// src/ui/IconPickerPopover.ts
function openIconPicker(anchor, currentIcon, apply, placement) {
  let allIds;
  try {
    allIds = (0, import_obsidian.getIconIds)().map(normalizeIconId);
  } catch (e) {
    allIds = [...CURATED_ICONS];
  }
  let query = "";
  const pop = new AnchoredPopover({
    anchor,
    placement,
    className: "spaces-icon-popover",
    ariaLabel: "Choose an icon",
    build: (root, popover) => {
      const doc = root.ownerDocument;
      const search = doc.win.createEl("input");
      search.type = "text";
      search.className = "spaces-icon-search";
      search.placeholder = "Search icons\u2026";
      search.setAttribute("aria-label", "Search icons");
      root.appendChild(search);
      const grid = doc.win.createDiv();
      grid.className = "spaces-icon-grid";
      root.appendChild(grid);
      const renderGrid = () => {
        grid.replaceChildren();
        const ids = iconSearchResults({ query, allIds });
        if (ids.length === 0) {
          const empty = doc.win.createDiv();
          empty.className = "spaces-icon-empty";
          empty.textContent = "No matching icon";
          grid.appendChild(empty);
          popover.reposition();
          return;
        }
        for (const id of ids) {
          const cell = doc.win.createDiv();
          cell.className = "spaces-icon-cell";
          cell.setAttribute("role", "button");
          cell.setAttribute("tabindex", "0");
          cell.setAttribute("aria-label", id);
          cell.setAttribute("aria-pressed", String(id === currentIcon));
          if (id === currentIcon) cell.classList.add("is-selected");
          try {
            (0, import_obsidian.setIcon)(cell, id);
          } catch (e) {
            continue;
          }
          const choose = () => {
            void apply(id).catch((err) => {
              new import_obsidian.Notice(`Spaces: could not change the icon (${String(err)})`);
            });
            popover.close();
          };
          cell.addEventListener("click", choose);
          cell.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              choose();
            }
          });
          grid.appendChild(cell);
        }
        popover.reposition();
      };
      search.addEventListener("input", () => {
        query = search.value;
        renderGrid();
      });
      renderGrid();
      search.focus();
    }
  });
  pop.open();
  return pop;
}

// src/ui/ColorPickerPopover.ts
var import_obsidian2 = require("obsidian");

// src/ui/spaceIconColor.ts
function iconColorFor(color, useThemeColor) {
  if (useThemeColor) return void 0;
  if (!color) return void 0;
  return color.toLowerCase() === DEFAULT_SPACE_COLOR.toLowerCase() ? void 0 : color;
}
function swatchPaint(color) {
  var _a;
  return (_a = iconColorFor(color, false)) != null ? _a : "var(--icon-color)";
}

// src/lifecycle/pathRepair.ts
function rewritePrefix(path, oldBase, newBase) {
  if (path === oldBase) return newBase;
  if (path.startsWith(oldBase + "/")) {
    return newBase + path.slice(oldBase.length);
  }
  return path;
}
function dedupe(members) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const m of members) {
    const key = m.kind === "tag" ? "t:" + m.tag : m.kind === "property" ? memberIdentity(m) : "p:" + m.path;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}
function repairExclude(exclude, oldPath, newPath) {
  if (exclude === void 0) return void 0;
  const seen = /* @__PURE__ */ new Set();
  const kept = [];
  for (const p of exclude) {
    const next = rewritePrefix(p, oldPath, newPath);
    const folded = canonicalPath(next);
    if (seen.has(folded)) continue;
    seen.add(folded);
    kept.push(next);
  }
  return kept.length > 0 ? kept : void 0;
}
function dirnameOf(path) {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}
function repairOrderMap(map, oldPath, newPath) {
  const out = /* @__PURE__ */ Object.create(null);
  const rewritten = /* @__PURE__ */ new Set();
  for (const [key, list] of Object.entries(map)) {
    const newKey = key === "" ? "" : rewritePrefix(key, oldPath, newPath);
    const changed = newKey !== key;
    if (!changed && rewritten.has(newKey)) continue;
    out[newKey] = list.map((entry) => rewritePrefix(entry, oldPath, newPath));
    if (changed) rewritten.add(newKey);
  }
  const from = dirnameOf(oldPath);
  if (from !== dirnameOf(newPath)) {
    const source = out[from];
    if (source) {
      const kept = source.filter((entry) => entry !== newPath);
      if (kept.length > 0) out[from] = kept;
      else delete out[from];
    }
  }
  return out;
}
function repairOrders(orders, oldPath, newPath) {
  if (!orders) return void 0;
  const all = orders.all ? repairOrderMap(orders.all, oldPath, newPath) : void 0;
  let bySpaceId;
  if (orders.bySpaceId) {
    bySpaceId = /* @__PURE__ */ Object.create(null);
    for (const [id, map] of Object.entries(orders.bySpaceId)) {
      bySpaceId[id] = repairOrderMap(map, oldPath, newPath);
    }
  }
  return { ...all ? { all } : {}, ...bySpaceId ? { bySpaceId } : {} };
}
function repairOnRename(defs, oldPath, newPath) {
  const orders = repairOrders(defs.orders, oldPath, newPath);
  return {
    ...defs,
    ...orders ? { orders } : {},
    spaces: defs.spaces.map((s) => {
      const exclude = repairExclude(s.exclude, oldPath, newPath);
      const repaired = {
        ...s,
        ...s.root === void 0 ? {} : { root: rewritePrefix(s.root, oldPath, newPath) },
        members: dedupe(
          s.members.map(
            (m) => m.kind === "file" || m.kind === "folder" ? { ...m, path: rewritePrefix(m.path, oldPath, newPath) } : m
          )
        )
      };
      if (exclude) repaired.exclude = exclude;
      else delete repaired.exclude;
      return repaired;
    })
  };
}
function repairRenameIn(draft, oldPath, newPath) {
  const repaired = repairOnRename(draft, oldPath, newPath);
  if (!repaired.orders) delete draft.orders;
  Object.assign(draft, repaired);
}

// src/actions/spaceLifecycle.ts
function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
}
function normalizeMemberPath(path) {
  return path.normalize("NFC").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
}
function nextPaletteColor(spaceCount) {
  const vivid = PALETTE.slice(1);
  return vivid[spaceCount % vivid.length];
}
function startingSpaceColor(autoAssign, spaceCount) {
  return autoAssign ? nextPaletteColor(spaceCount) : DEFAULT_SPACE_COLOR;
}
async function createSpace(defs, name, opts) {
  const base = slugify(name) || "space";
  let id = base;
  await defs.mutate((d) => {
    var _a, _b, _c;
    const taken = /* @__PURE__ */ new Set([...RESERVED_IDS, ...d.spaces.map((s) => s.id)]);
    id = base;
    let n = 2;
    while (taken.has(id)) id = `${base}-${n++}`;
    d.spaces.push({
      id,
      name: name.trim() || "Untitled space",
      icon: (_a = opts == null ? void 0 : opts.icon) != null ? _a : "box",
      color: (_b = opts == null ? void 0 : opts.color) != null ? _b : nextPaletteColor(d.spaces.length),
      // Copy, never adopt: a caller that keeps mutating its own list must not
      // silently edit a space it already created. Normalize the path here:
      // data.json is real, synced, hand-editable config, and
      // isSafeVaultPath() in schema.ts validates format without
      // canonicalising, so an un-normalized member written here would
      // silently never match a real vault path.
      members: ((_c = opts == null ? void 0 : opts.members) != null ? _c : []).map((m) => {
        if (m.kind === "tag") return { kind: "tag", tag: m.tag };
        if (m.kind === "property") {
          return m.value === void 0 ? { kind: "property", key: m.key } : { kind: "property", key: m.key, value: m.value };
        }
        return { kind: m.kind, path: normalizeMemberPath(m.path) };
      }),
      // Same normalization as members, same reason — a root
      // is a vault path too. Omitted entirely rather than written as `""`
      // when absent, so a curated space's stored shape is unchanged from
      // before this field existed (`hasRoot`, folderSpace.ts, keys off the
      // field's presence, not its value).
      ...(opts == null ? void 0 : opts.root) === void 0 ? {} : { root: normalizeMemberPath(opts.root) }
    });
  });
  return id;
}
async function deleteSpace(defs, id, hooks) {
  var _a;
  await defs.mutate((d) => {
    var _a2;
    d.spaces = d.spaces.filter((s) => s.id !== id);
    if ((_a2 = d.orders) == null ? void 0 : _a2.bySpaceId) delete d.orders.bySpaceId[id];
  });
  (_a = hooks == null ? void 0 : hooks.onDeleted) == null ? void 0 : _a.call(hooks, id);
}
async function setSpaceIcon(defs, id, icon) {
  if (!isIconIdShape(icon)) {
    throw new Error(`Spaces: ${icon} is not a valid icon id`);
  }
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (s) s.icon = icon;
  });
}
async function setSpaceColor(defs, id, color) {
  const hex = normalizeHex(color);
  if (!hex) throw new Error(`Spaces: ${color} is not a color`);
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (s) s.color = hex;
  });
}
async function renameSpace(defs, id, name) {
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (s) s.name = name.trim() || s.name;
  });
}
async function setSpaceRoot(defs, id, root) {
  const normalized = normalizeMemberPath(root);
  if (normalized !== "" && normalized !== "/" && !isSafeVaultPath(normalized)) return;
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (!s || typeof s.root !== "string") return;
    const from = s.root;
    s.root = normalized;
    if (from === "" || normalized === "") return;
    const next = repairExclude(s.exclude, from, normalized);
    if (next) s.exclude = next;
    else delete s.exclude;
  });
}

// src/ui/colorPicker.ts
var MAX_CUSTOM_COLORS2 = 12;
function addCustomColor(customs, palette, color, max = MAX_CUSTOM_COLORS2) {
  const hex = normalizeHex(color);
  if (!hex) return [...customs];
  const paletteSet = new Set(palette.map((c) => c.toLowerCase()));
  if (paletteSet.has(hex)) return [...customs];
  const without = customs.filter((c) => c.toLowerCase() !== hex);
  return [hex, ...without].slice(0, max);
}
function removeCustomColor(customs, color) {
  const hex = normalizeHex(color);
  if (!hex) return [...customs];
  return customs.filter((c) => c.toLowerCase() !== hex);
}
function colorSwatches(args) {
  var _a;
  const current = (_a = normalizeHex(args.current)) != null ? _a : args.current.toLowerCase();
  const out = args.palette.map((color, i) => {
    var _a2;
    return {
      color,
      label: (_a2 = args.paletteNames[i]) != null ? _a2 : color,
      selected: color.toLowerCase() === current,
      custom: false,
      removable: false
    };
  });
  const seen = new Set(args.palette.map((c) => c.toLowerCase()));
  for (const color of args.customs) {
    const hex = normalizeHex(color);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push({
      color: hex,
      label: hex,
      selected: hex === current,
      custom: true,
      removable: true
    });
  }
  if (!out.some((s) => s.selected)) {
    const hex = normalizeHex(args.current);
    if (hex) {
      out.push({ color: hex, label: hex, selected: true, custom: true, removable: false });
    }
  }
  return out;
}

// src/ui/colorMath.ts
function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}
function wrapHue(deg) {
  if (!Number.isFinite(deg)) return 0;
  const h = deg % 360;
  return h < 0 ? h + 360 : h;
}
function toHex2(n) {
  return Math.round(clamp01(n) * 255).toString(16).padStart(2, "0");
}
function hsvToHex({ h, s, v }) {
  const hue = wrapHue(h) / 60;
  const sat = clamp01(s);
  const val = clamp01(v);
  const c = val * sat;
  const x = c * (1 - Math.abs(hue % 2 - 1));
  const m = val - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 1) [r, g, b] = [c, x, 0];
  else if (hue < 2) [r, g, b] = [x, c, 0];
  else if (hue < 3) [r, g, b] = [0, c, x];
  else if (hue < 4) [r, g, b] = [0, x, c];
  else if (hue < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return `#${toHex2(r + m)}${toHex2(g + m)}${toHex2(b + m)}`;
}
function hexToHsv(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  const r = (int >> 16 & 255) / 255;
  const g = (int >> 8 & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = (g - b) / d % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: wrapHue(h), s: max === 0 ? 0 : d / max, v: max };
}
function svFromPoint(x, y, width, height) {
  if (!(width > 0) || !(height > 0)) return { s: 0, v: 0 };
  return { s: clamp01(x / width), v: clamp01(1 - y / height) };
}
function hueFromPoint(x, width) {
  if (!(width > 0)) return 0;
  return clamp01(x / width) * 360;
}

// src/ui/ColorPickerPopover.ts
function openColorPicker(deps) {
  let customs = [...deps.customs];
  let mode = "palette";
  const popover = new AnchoredPopover({
    anchor: deps.anchor,
    placement: deps.placement,
    className: "spaces-color-popover",
    ariaLabel: "Choose a color",
    build: (root, pop) => render(root, pop)
  });
  function fail2(err) {
    new import_obsidian2.Notice(`Spaces: could not change the color (${String(err)})`);
  }
  function render(root, pop) {
    root.replaceChildren();
    const doc = root.ownerDocument;
    if (mode === "custom") {
      renderCustom(root, doc, pop);
    } else {
      renderPalette(root, doc, pop);
    }
    pop.reposition();
  }
  function renderPalette(root, doc, pop) {
    const grid = doc.win.createDiv();
    grid.className = "spaces-color-grid";
    for (const sw of colorSwatches({
      palette: PALETTE,
      paletteNames: PALETTE_NAMES,
      customs,
      current: deps.current
    })) {
      const cell = doc.win.createDiv();
      cell.className = "spaces-color-cell";
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", "0");
      cell.setAttribute("aria-label", sw.label);
      cell.setAttribute("aria-pressed", String(sw.selected));
      cell.style.backgroundColor = swatchPaint(sw.color);
      if (sw.selected) cell.classList.add("is-selected");
      const choose = () => {
        void deps.apply(sw.color).catch(fail2);
        pop.close();
      };
      cell.addEventListener("click", choose);
      if (sw.removable) {
        const remove = () => {
          customs = removeCustomColor(customs, sw.color);
          void deps.saveCustoms(customs).catch(fail2);
          render(root, pop);
        };
        const del = doc.win.createDiv();
        del.className = "spaces-color-remove";
        del.setAttribute("role", "button");
        del.setAttribute("tabindex", "0");
        del.setAttribute("aria-label", `Delete color ${sw.label}`);
        (0, import_obsidian2.setIcon)(del, "x");
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          remove();
        });
        del.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            remove();
          }
        });
        cell.appendChild(del);
        cell.addEventListener("keydown", (e) => {
          if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            remove();
          }
        });
      }
      cell.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          choose();
        }
      });
      grid.appendChild(cell);
    }
    const add = doc.win.createDiv();
    add.className = "spaces-color-cell spaces-color-add";
    add.setAttribute("role", "button");
    add.setAttribute("tabindex", "0");
    add.setAttribute("aria-label", "Add a custom color");
    add.textContent = "+";
    const openCustom = () => {
      mode = "custom";
      render(root, pop);
    };
    add.addEventListener("click", openCustom);
    add.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCustom();
      }
    });
    grid.appendChild(add);
    root.appendChild(grid);
  }
  function renderCustom(root, doc, pop) {
    var _a, _b;
    let hsv = (_b = hexToHsv((_a = normalizeHex(deps.current)) != null ? _a : "#5b5bff")) != null ? _b : {
      h: 240,
      s: 0.64,
      v: 1
    };
    const wrap = doc.win.createDiv();
    wrap.className = "spaces-color-custom";
    const field = doc.win.createDiv();
    field.className = "spaces-sv-field";
    const fieldDot = doc.win.createDiv();
    fieldDot.className = "spaces-picker-dot";
    field.appendChild(fieldDot);
    wrap.appendChild(field);
    const hue = doc.win.createDiv();
    hue.className = "spaces-hue-bar";
    const hueDot = doc.win.createDiv();
    hueDot.className = "spaces-picker-dot";
    hue.appendChild(hueDot);
    wrap.appendChild(hue);
    const row = doc.win.createDiv();
    row.className = "spaces-color-row";
    const preview = doc.win.createDiv();
    preview.className = "spaces-color-preview";
    const hex = doc.win.createEl("input");
    hex.type = "text";
    hex.className = "spaces-color-hex";
    hex.setAttribute("aria-label", "Color hex value");
    hex.placeholder = "Hex value";
    row.appendChild(preview);
    row.appendChild(hex);
    wrap.appendChild(row);
    const paint = (skipHex = false) => {
      const hexValue = hsvToHex(hsv);
      field.style.backgroundColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
      fieldDot.style.left = `${hsv.s * 100}%`;
      fieldDot.style.top = `${(1 - hsv.v) * 100}%`;
      fieldDot.style.backgroundColor = hexValue;
      hueDot.style.left = `${hsv.h / 360 * 100}%`;
      hueDot.style.backgroundColor = hsvToHex({ h: hsv.h, s: 1, v: 1 });
      preview.style.backgroundColor = hexValue;
      if (!skipHex) hex.value = hexValue;
      hex.removeClass("is-invalid");
    };
    const track = (el, onPoint) => {
      const handle = (e) => {
        onPoint(e, el.getBoundingClientRect());
        paint();
      };
      el.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        el.setPointerCapture(e.pointerId);
        handle(e);
      });
      el.addEventListener("pointermove", (e) => {
        if (!el.hasPointerCapture(e.pointerId)) return;
        handle(e);
      });
      el.addEventListener("pointerup", (e) => el.releasePointerCapture(e.pointerId));
    };
    track(field, (e, r) => {
      const { s: sat, v } = svFromPoint(e.clientX - r.left, e.clientY - r.top, r.width, r.height);
      hsv = { ...hsv, s: sat, v };
    });
    track(hue, (e, r) => {
      hsv = { ...hsv, h: hueFromPoint(e.clientX - r.left, r.width) };
    });
    hex.addEventListener("input", () => {
      const parsed = normalizeHex(hex.value);
      const next = parsed ? hexToHsv(parsed) : null;
      if (!next) {
        hex.addClass("is-invalid");
        return;
      }
      hsv = next;
      paint(true);
    });
    const actions = doc.win.createDiv();
    actions.className = "spaces-color-actions";
    const addBtn = doc.win.createEl("button");
    addBtn.className = "mod-cta";
    addBtn.textContent = "Add color";
    addBtn.addEventListener("click", () => {
      var _a2;
      const parsed = (_a2 = normalizeHex(hex.value)) != null ? _a2 : hsvToHex(hsv);
      customs = addCustomColor(customs, PALETTE, parsed);
      void deps.saveCustoms(customs).catch(fail2);
      void deps.apply(parsed).catch(fail2);
      pop.close();
    });
    const back = doc.win.createEl("button");
    back.textContent = "Back";
    back.addEventListener("click", () => {
      mode = "palette";
      render(root, pop);
    });
    actions.appendChild(addBtn);
    actions.appendChild(back);
    wrap.appendChild(actions);
    root.appendChild(wrap);
    paint();
  }
  popover.open();
  return popover;
}

// src/ui/RenamePopover.ts
var import_obsidian3 = require("obsidian");

// src/ui/renameSpaceForm.ts
function normalizeSpaceName(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_SPACE_NAME_LENGTH) return null;
  return trimmed;
}

// src/ui/RenamePopover.ts
function openRenamePopover(deps) {
  const popover = new AnchoredPopover({
    anchor: deps.anchor,
    className: "spaces-rename-popover",
    ariaLabel: `Rename ${deps.current}`,
    build: (root, pop) => {
      const doc = root.ownerDocument;
      const input = doc.win.createEl("input");
      input.type = "text";
      input.className = "spaces-rename-input";
      input.setAttribute("aria-label", "Space name");
      input.maxLength = MAX_SPACE_NAME_LENGTH;
      input.value = deps.current;
      const commit = () => {
        const next = normalizeSpaceName(input.value);
        if (next && next !== deps.current) {
          void deps.apply(next).catch((e) => {
            new import_obsidian3.Notice(`Spaces: could not rename the space (${String(e)})`);
          });
        }
        pop.close();
      };
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          pop.close();
        }
      });
      const go = doc.win.createEl("button");
      go.className = "mod-cta";
      go.textContent = "Rename";
      go.addEventListener("click", commit);
      root.appendChild(input);
      root.appendChild(go);
      input.focus();
      input.select();
    }
  });
  popover.open();
  return popover;
}

// src/ui/knownIcons.ts
var import_obsidian4 = require("obsidian");
var cache = null;
function knownIconIds() {
  if (cache) return cache;
  try {
    cache = new Set((0, import_obsidian4.getIconIds)().map(normalizeIconId));
  } catch (e) {
    cache = /* @__PURE__ */ new Set();
  }
  return cache;
}

// src/ui/spaceEntries.ts
var ALL_ICON = "layers";
var ALL_LABEL = "All";
function spaceEntries(spaces, selection, knownIcons) {
  return [
    {
      key: { kind: "all" },
      icon: ALL_ICON,
      label: ALL_LABEL,
      color: void 0,
      active: selection.kind === "all"
    },
    // The one place the rule lives, so every reader (strip, header dropdown,
    // picker) omits an archived space and a new reader gets it for free.
    ...activeSpaces(spaces).map((s) => ({
      key: { kind: "space", id: s.id },
      icon: renderableIcon(s.icon, knownIcons),
      label: s.name,
      color: s.color,
      active: selection.kind === "space" && selection.id === s.id
    }))
  ];
}
function splitPinnedEntry(entries, pinAll) {
  var _a;
  if (!pinAll) return { pinned: null, railed: [...entries] };
  const pinned = (_a = entries.find((e) => e.key.kind === "all")) != null ? _a : null;
  if (pinned === null) return { pinned: null, railed: [...entries] };
  return { pinned, railed: entries.filter((e) => e !== pinned) };
}

// src/ui/railScroll.ts
var PAD = 8;
function railScrollOffset(args) {
  const { scroll, clientSize, itemOffset, itemSize } = args;
  if (!(clientSize > 0)) return scroll;
  if (!Number.isFinite(itemOffset) || !Number.isFinite(itemSize)) return scroll;
  if (!Number.isFinite(scroll)) return 0;
  if (itemSize + PAD * 2 > clientSize) return Math.max(0, itemOffset - PAD);
  if (itemOffset - PAD < scroll) return Math.max(0, itemOffset - PAD);
  const end = itemOffset + itemSize + PAD;
  if (end > scroll + clientSize) return Math.max(0, end - clientSize);
  return scroll;
}
function railWheelDelta(args) {
  const { along, across, scroll, scrollSize, clientSize } = args;
  if (!Number.isFinite(along) || !Number.isFinite(across)) return 0;
  if (along !== 0) return 0;
  if (!Number.isFinite(scroll) || !(scrollSize > clientSize)) return 0;
  const max = scrollSize - clientSize;
  const next = Math.min(Math.max(scroll + across, 0), max);
  return next - scroll;
}

// src/ui/spaceReorder.ts
var EDGE_ZONE_PX = 36;
var MAX_STEP_PX = 24;
var MIN_STEP_PX = 2;
function insertionIndexAt(pointer, boxes) {
  let index = 0;
  for (const box of boxes) {
    if (pointer < box.start + box.size / 2) break;
    index++;
  }
  return index;
}
function moveTo(list, from, insertionIndex) {
  const out = [...list];
  const [item] = out.splice(from, 1);
  if (item === void 0) return [...list];
  out.splice(insertionIndex > from ? insertionIndex - 1 : insertionIndex, 0, item);
  return out;
}
function isNoOpMove(from, insertionIndex) {
  return insertionIndex === from || insertionIndex === from + 1;
}
function edgeScrollStep(pointer, rail) {
  const fromStart = pointer - rail.start;
  const fromEnd = rail.start + rail.size - pointer;
  if (fromStart < EDGE_ZONE_PX) return -stepFor(fromStart);
  if (fromEnd < EDGE_ZONE_PX) return stepFor(fromEnd);
  return 0;
}
function stepFor(distance) {
  const depth = Math.min(1, Math.max(0, (EDGE_ZONE_PX - distance) / EDGE_ZONE_PX));
  return MIN_STEP_PX + (MAX_STEP_PX - MIN_STEP_PX) * depth;
}
function gapCenterAt(index, boxes) {
  if (boxes.length === 0) return 0;
  const first = boxes[0];
  if (index <= 0) return first.start - EDGE_LINE_INSET_PX;
  const last = boxes[boxes.length - 1];
  if (index >= boxes.length) return last.start + last.size + EDGE_LINE_INSET_PX;
  const prev = boxes[index - 1];
  const cur = boxes[index];
  return (prev.start + prev.size + cur.start) / 2;
}
var EDGE_LINE_INSET_PX = 2;
function visibleIndexOf(spaces, id) {
  const at = activeSpaces(spaces).findIndex((sp) => sp.id === id);
  return at < 0 ? null : at;
}
function moveVisibleTo(spaces, id, visibleGap) {
  const from = spaces.findIndex((sp) => sp.id === id);
  if (from < 0 || isArchived(spaces[from])) return [...spaces];
  const visible = activeSpaces(spaces);
  const gap = Math.max(0, Math.min(visibleGap, visible.length));
  if (isNoOpMove(visible.findIndex((sp) => sp.id === id), gap)) return [...spaces];
  const stored = gap < visible.length ? spaces.indexOf(visible[gap]) : spaces.indexOf(visible[visible.length - 1]) + 1;
  return moveTo(spaces, from, stored);
}

// src/ui/stripAxis.ts
function axisFor(placement) {
  return placement === "left" || placement === "right" ? "y" : "x";
}
function spanOf(rect, axis) {
  return axis === "x" ? { start: rect.left, size: rect.width } : { start: rect.top, size: rect.height };
}
function pointerAlong(ev, axis) {
  return axis === "x" ? ev.clientX : ev.clientY;
}

// src/ui/stripDock.ts
var DOCK_CLASSES = {
  bottom: null,
  top: "spaces-dock-top",
  left: "spaces-dock-left",
  right: "spaces-dock-right"
};
var PLACEMENTS = Object.values(DOCK_CLASSES).filter((c) => c !== null);
var ALL2 = [...PLACEMENTS, CLS_STRIP_HIDDEN, CLS_STRIP_OPEN, CLS_STRIP_FOCUS];
function applyDock(pane, placement) {
  pane.classList.remove(...placement === "left" ? PLACEMENTS : ALL2);
  const cls = DOCK_CLASSES[placement];
  if (cls) pane.classList.add(cls);
}
function applyHidden(pane, hidden) {
  pane.classList.toggle(CLS_STRIP_HIDDEN, hidden);
  if (!hidden) pane.classList.remove(CLS_STRIP_OPEN, CLS_STRIP_FOCUS);
}
function clearDock(pane) {
  pane == null ? void 0 : pane.classList.remove(...ALL2);
}
var GRIP_CLASS = "spaces-strip-grip";
function applyUnlockState(strip, unlocked) {
  const existing = strip.querySelector(`.${GRIP_CLASS}`);
  strip.classList.toggle("is-unlocked", unlocked);
  if (!unlocked) {
    existing == null ? void 0 : existing.remove();
    return null;
  }
  if (existing) return existing;
  const grip = strip.doc.win.createDiv({ cls: GRIP_CLASS });
  grip.setAttribute("aria-label", "Move the space strip");
  strip.insertBefore(grip, strip.firstChild);
  return grip;
}

// src/ui/canHideStrip.ts
function placementCanHideStrip(placement) {
  return placement === "left";
}
function canHideStrip(placement, hasHover) {
  return placementCanHideStrip(placement) && hasHover;
}
function deviceHasHover() {
  return typeof matchMedia === "function" && matchMedia("(hover: hover)").matches;
}

// src/ui/stripReveal.ts
var StripReveal = class {
  constructor(deps) {
    this.deps = deps;
    this.zone = null;
    this.doc = null;
    this.win = null;
    this.open = false;
    this.onEnter = () => this.show();
    /**
     * A drag entering the zone or the strip opens it. `dragenter` fires once per
     * element entry, so this is not per-pointer-move work.
     *
     * Nothing holds it open afterwards, and nothing has to: the browser fires no
     * `mousemove` during a native drag, only drag events, so the watcher that
     * would close the strip hears nothing until the drag is over. Counted in a
     * running Obsidian over one drag across the strip: 12 `dragover`, 0
     * `mousemove`. The grip is the one pointer drag that does fire `mousemove`,
     * and it never meets a hidden strip, because hiding is suspended for as long
     * as the strip is unlocked and the grip exists only while it is unlocked.
     */
    this.onDragEnter = () => this.show();
    /** Overshooting past the edge and out of the window still reveals. */
    this.onDocLeave = (e) => {
      if (e.clientX <= this.deps.lipRight()) this.show();
    };
    /**
     * Leaving the pane leftward reveals. With the ribbon visible the pane sits
     * right of the screen edge, so the trigger band is mid-screen and a fast
     * sweep can cross it without a `mousemove` landing inside, ending on the
     * ribbon. `mouseleave` is a boundary event (once per exit, no per-move
     * cost), so the ribbon becomes approach space. The test is the overshoot's:
     * `lipRight()` is the lip's right edge while closed, so the lip width
     * is read from the layout rather than copied from `styles.css`.
     */
    this.onPaneLeave = (e) => {
      if (e.clientX <= this.deps.lipRight()) this.show();
    };
    /**
     * A control inside the strip took focus. Reveals only for KEYBOARD focus:
     * clicking a space focuses its icon too, and revealing on that left the
     * strip out after the click with no pointer gesture able to dismiss it.
     *
     * `:focus-visible` is the browser's own keyboard/mouse answer, asked here
     * with `matches()` instead of in a CSS `:has()`, which the plugin scan
     * flags for the invalidation it forces on every ancestor.
     */
    this.onFocusIn = (e) => {
      const el = e.target;
      const keyboard = el instanceof Element && el.matches(":focus-visible");
      this.deps.pane.classList.toggle(CLS_STRIP_FOCUS, keyboard);
    };
    /**
     * Focus left the strip entirely. `focusout`'s `relatedTarget` is where focus
     * is going, so a move from one space icon to the next keeps the reveal and
     * does not flicker it off and on.
     */
    this.onFocusOut = (e) => {
      const to = e.relatedTarget;
      if (to instanceof Node && this.deps.strip.contains(to)) return;
      this.deps.pane.classList.remove(CLS_STRIP_FOCUS);
    };
    this.onMove = (e) => {
      if (e.clientX > this.deps.openRight()) this.hide();
    };
  }
  /** Creates the zone and binds the open triggers. */
  attach() {
    if (this.zone) return;
    const { pane, strip } = this.deps;
    const doc = pane.ownerDocument;
    this.doc = doc;
    this.win = doc.defaultView;
    const zone = pane.createDiv({ cls: CLS_STRIP_ZONE });
    this.zone = zone;
    zone.addEventListener("mouseenter", this.onEnter);
    strip.addEventListener("mouseenter", this.onEnter);
    zone.addEventListener("dragenter", this.onDragEnter);
    strip.addEventListener("dragenter", this.onDragEnter);
    doc.addEventListener("mouseleave", this.onDocLeave);
    pane.addEventListener("mouseleave", this.onPaneLeave);
    strip.addEventListener("focusin", this.onFocusIn);
    strip.addEventListener("focusout", this.onFocusOut);
  }
  /** Removes every listener and the zone. Idempotent. */
  destroy() {
    var _a;
    this.unwatch();
    if (this.zone) {
      this.zone.removeEventListener("mouseenter", this.onEnter);
      this.zone.removeEventListener("dragenter", this.onDragEnter);
      this.zone.remove();
      this.zone = null;
    }
    this.deps.strip.removeEventListener("mouseenter", this.onEnter);
    this.deps.strip.removeEventListener("dragenter", this.onDragEnter);
    this.deps.strip.removeEventListener("focusin", this.onFocusIn);
    this.deps.strip.removeEventListener("focusout", this.onFocusOut);
    (_a = this.doc) == null ? void 0 : _a.removeEventListener("mouseleave", this.onDocLeave);
    this.deps.pane.removeEventListener("mouseleave", this.onPaneLeave);
    this.deps.pane.classList.remove(CLS_STRIP_FOCUS);
    this.doc = null;
    this.win = null;
    if (this.open) {
      this.open = false;
      this.deps.pane.classList.remove(CLS_STRIP_OPEN);
    }
  }
  /** Opens without a pointer event: a rebuilt pane under a resting pointer. */
  reopen() {
    this.show();
  }
  isOpen() {
    return this.open;
  }
  show() {
    if (this.open || !this.win) return;
    this.open = true;
    this.deps.pane.classList.add(CLS_STRIP_OPEN);
    this.win.addEventListener("mousemove", this.onMove);
  }
  hide() {
    if (!this.open) return;
    this.open = false;
    this.deps.pane.classList.remove(CLS_STRIP_OPEN);
    this.unwatch();
  }
  unwatch() {
    var _a;
    (_a = this.win) == null ? void 0 : _a.removeEventListener("mousemove", this.onMove);
  }
};

// src/ui/activeStyle.ts
var BOXED_CLASS = "spaces-active-boxed";
var BOLDED_CLASS = "spaces-active-bolded";
function activeStyleClass(style) {
  if (style === "boxed") return BOXED_CLASS;
  if (style === "bolded") return BOLDED_CLASS;
  return null;
}

// src/ui/stripAlign.ts
var DESIGN_RAIL_GAP = 17;
var DESIGN_PAD_TOP = 6;
var MIN_RAIL_GAP = 1;
var MAX_OFFSET = 400;
function usable(box) {
  return box !== null && Number.isFinite(box.top) && Number.isFinite(box.height) && box.height > 0;
}
function solve(current, boxCentre, target, min) {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return null;
  const next = Math.round(current + (target - boxCentre));
  if (Math.abs(next - current) > MAX_OFFSET) return null;
  return Math.max(min, next);
}
function stripAlignment(input) {
  const { toolbarCentre, anchorCentre, pinned, firstIcon, currentPadTop, currentRailGap } = input;
  const { railScroll } = input;
  const padTop = toolbarCentre !== null && usable(pinned) ? solve(currentPadTop, pinned.top + pinned.height / 2, toolbarCentre, 0) : null;
  const padDelta = padTop === null ? 0 : padTop - currentPadTop;
  const railGap = anchorCentre !== null && usable(firstIcon) && Number.isFinite(railScroll) ? solve(
    currentRailGap,
    firstIcon.top + railScroll + padDelta + firstIcon.height / 2,
    anchorCentre,
    MIN_RAIL_GAP
  ) : null;
  return { padTop, railGap };
}

// src/ui/stripDrag.ts
var DRAG_THRESHOLD_PX = 4;
var CORNER_BIAS_PX = 8;
function nearestPlacement(pointer, pane) {
  const dL = Math.abs(pointer.x - pane.left);
  const dR = Math.abs(pane.right - pointer.x);
  const dT = Math.abs(pointer.y - pane.top);
  const dB = Math.abs(pane.bottom - pointer.y);
  const v = Math.min(dL, dR);
  const h = Math.min(dT, dB);
  if (v <= h + CORNER_BIAS_PX) return dL <= dR ? "left" : "right";
  return dT <= dB ? "top" : "bottom";
}
function passedThreshold(from, to) {
  return Math.hypot(to.x - from.x, to.y - from.y) >= DRAG_THRESHOLD_PX;
}

// src/actions/stripPlacement.ts
async function setStripPlacement(defs, next, onCancelDrag) {
  onCancelDrag == null ? void 0 : onCancelDrag();
  if (defs.get().settings.stripPlacement === next) return;
  await defs.mutate((d) => {
    d.settings.stripPlacement = next;
  });
}

// src/ui/spaceDrop.ts
var CLIPPED_SELECTION = "part of the selection is outside the render window";
var FOLDER_PINNED_SPACE = "a space pinned to a folder has no member list";
var SPACE_GONE = "not a space";
function spaceDropFor(space, drag) {
  if (!space) return { kind: "refuse", reason: SPACE_GONE };
  if (drag.paths.length === 0) {
    return { kind: "refuse", reason: "nothing is being dragged" };
  }
  if (hasRoot(space)) {
    return { kind: "refuse", reason: FOLDER_PINNED_SPACE, spaceName: space.name };
  }
  if (drag.truncated) {
    return { kind: "refuse", reason: CLIPPED_SELECTION, spaceName: space.name };
  }
  return { kind: "add", spaceId: space.id };
}
var SPOKEN_AT_HOVER = [CLIPPED_SELECTION, FOLDER_PINNED_SPACE];
function dropTargetFor(dragFromId, space, drag) {
  if (dragFromId !== null) return null;
  const drop = spaceDropFor(space, drag);
  if (drop.kind !== "refuse") return drop;
  return SPOKEN_AT_HOVER.includes(drop.reason) ? drop : null;
}

// src/ui/SwitcherView.ts
var PLACEMENTS2 = ["top", "bottom", "left", "right"];
var PROP_PAD_TOP = "--spaces-strip-pad-top";
var PROP_RAIL_GAP = "--spaces-strip-rail-gap";
var CLS_SPACE_HEADER = ".spaces-space-header";
var ADD_FOCUS_KEY = "add";
var GRIP_FOCUS_KEY = "grip";
function focusKeyFor(key) {
  return key.kind === "all" ? "all" : `space:${key.id}`;
}
function centreOf(node) {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return r.height > 0 ? r.top + r.height / 2 : null;
}
function boxOf(node) {
  if (!node) return null;
  const r = node.getBoundingClientRect();
  return { top: r.top, height: r.height };
}
function readPx(el, name, fallback) {
  const raw = Number.parseFloat(el.style.getPropertyValue(name));
  return Number.isFinite(raw) ? raw : fallback;
}
function writePx(el, name, value) {
  if (value === null) el.style.removeProperty(name);
  else el.style.setProperty(name, `${value}px`);
}
var SwitcherView = class {
  constructor(defs, runtime, controller, onCreateClicked, isSortOverridden, onRestoreOrdering, fileDrop) {
    this.defs = defs;
    this.runtime = runtime;
    this.controller = controller;
    this.onCreateClicked = onCreateClicked;
    this.isSortOverridden = isSortOverridden;
    this.onRestoreOrdering = onRestoreOrdering;
    this.fileDrop = fileDrop;
    this.el = null;
    /** The pane this strip is currently docked in, so a remount can clean it. */
    this.host = null;
    /** Watches the pane for the layout changes no render hears about. */
    this.paneResize = null;
    /** Where the strip sits, mirroring the persisted setting. */
    this.placement = "bottom";
    /**
     * Whether the strip shows its grab handle. Locked (the default, and what
     * everyone sees) has no handle and no chrome at all; unlocked is the mode
     * that offers something to take hold of. The drag itself is a later task.
     */
    this.unlocked = false;
    /** A pointer drag of the grip in progress, or null when idle. */
    this.drag = null;
    /**
     * The ID of the space being dragged, or null when no space drag is running.
     *
     * An ID rather than the index it used to be. The index was captured at
     * `dragstart` and spent at `drop`, and `render()` can run between the two:
     * it is called from five sites in `main.ts`, one of them inside
     * `onSnapshotApplied`, which runs on every file open and every coalesced
     * vault flush. If the definitions changed in that window -- realistically
     * `onExternalSettingsChange` applying a `data.json` written on another
     * device -- the index named a different space and the drop moved that one
     * instead.
     *
     * `draggedIndex()` re-derives the position from this at the moment it is
     * needed, and answers null when the space is no longer there.
     */
    this.dragFromId = null;
    /** Last pointer reading, projected onto the strip's axis, re-read every auto-scroll frame. */
    this.dragPointerAlong = 0;
    this.dragRaf = 0;
    /**
     * The one icon wearing `is-drop-target`, or null. Held as a field so
     * `markDropTarget` can take the mark off the previous icon without
     * querying the rail, and so a fast drag can never leave two icons lit.
     */
    this.dropTargetEl = null;
    /**
     * Which refusals this drag has already been told about, as `spaceId::reason`.
     *
     * `dragover` fires once per few pixels of pointer travel, so without this one
     * notice becomes dozens. Keyed rather than a single flag per drag, because a
     * drag crosses several icons: one boolean meant that after a folder-pinned
     * space spoke, a clipped-selection refusal over a DIFFERENT space said
     * nothing and lit nothing, leaving the only notice on screen naming another
     * space and giving advice that did not apply. That is the silence
     * `spaceDrop.ts` says reads as a broken feature. Cleared in `clearDropTarget`,
     * which `main.ts` calls from `DragOrdering`'s drag-done callback. That
     * callback fires at the end of each drag the explorer published AND at the
     * start of the next one, which is what keeps this flag from surviving into a
     * drag it was not raised for -- the first reading of it, "the one callback
     * that learns every drag has ended however it ended", was not true, and a
     * `dragend` lost to a replaced source row left this stuck on while a stale
     * record was still offering its paths.
     */
    this.spokenRefusals = /* @__PURE__ */ new Set();
    /**
     * The one popover this view has open, or null.
     *
     * Held because `AnchoredPopover` adds four listeners to `document` that only
     * its own `close()` removes — nothing in Obsidian's component tree owns
     * them. `destroy()` is on `onunload`'s path (and on `mount()`'s, which runs
     * again on every rebind), so this field is what makes the popovers reachable
     * at teardown at all.
     */
    this.popover = null;
    /**
     * The reveal controller, present only while the strip is hidden. Owns a
     * zone element and document listeners, so `syncHidden()` and `destroy()`
     * are the only places that create or drop it.
     */
    this.reveal = null;
    /** Set by `wireReorder`; torn down with the view. */
    this.stopDragScrolling = null;
  }
  /** The axis the strip's icons run along, for the current placement. */
  get axis() {
    return axisFor(this.placement);
  }
  /**
   * Builds the strip into `parent` and docks it at `placement`.
   *
   * The placement is a parameter and not `this.placement`, which is written
   * only by `applyPlacement` -- and the sole caller used to run that AFTER
   * mounting. So everything here that derives from the placement (the dock
   * class, `syncHidden`, and the axis `render()` draws for) ran against the
   * placement the strip was last in. It was benign only because that caller
   * re-applied straight afterwards, and `main.ts` documents the very same
   * ordering rule for the definitions subscription while this broke it
   * internally. The signature now asks for what the body needs, and the
   * caller no longer re-applies.
   */
  mount(parent, placement) {
    var _a, _b, _c;
    this.placement = placement;
    const wasRevealed = (_b = (_a = this.reveal) == null ? void 0 : _a.isOpen()) != null ? _b : false;
    this.destroy();
    this.host = parent;
    const el = parent.ownerDocument.win.createDiv();
    el.className = "spaces-switcher";
    parent.appendChild(el);
    this.el = el;
    applyDock(parent, placement);
    this.syncHidden();
    if (wasRevealed) (_c = this.reveal) == null ? void 0 : _c.reopen();
    this.render();
    const view = parent.ownerDocument.defaultView;
    if (view) {
      this.paneResize = new view.ResizeObserver(() => this.alignToPane());
      this.paneResize.observe(parent);
    }
  }
  destroy() {
    var _a, _b, _c, _d, _e;
    this.cancelDrag();
    this.dragFromId = null;
    this.dropTargetEl = null;
    (_a = this.stopDragScrolling) == null ? void 0 : _a.call(this);
    this.stopDragScrolling = null;
    (_b = this.popover) == null ? void 0 : _b.close();
    this.popover = null;
    (_c = this.paneResize) == null ? void 0 : _c.disconnect();
    this.paneResize = null;
    (_d = this.reveal) == null ? void 0 : _d.destroy();
    this.reveal = null;
    (_e = this.el) == null ? void 0 : _e.remove();
    this.el = null;
    clearDock(this.host);
    this.host = null;
  }
  /**
   * Re-paints for a new placement: one class swap and no re-render.
   *
   * NOT cheap in the sense that line used to claim. `syncHidden()` runs below,
   * and `main.ts` calls this on every definitions change, so for a left strip
   * with hiding on this can build a reveal controller, create the zone element
   * and bind six listeners. It does that once per controller -- the controller
   * is kept while the placement stays left -- but the first call after hiding
   * is switched on pays for all of it.
   */
  applyPlacement(placement) {
    this.placement = placement;
    if (this.host) {
      applyDock(this.host, placement);
      this.syncHidden();
    }
    this.alignToPane();
  }
  /**
   * Makes the hidden state match the setting and the placement. Hiding is
   * active only for a left strip with `hideStrip` on, and never while the
   * strip is unlocked: unlocking means rearranging, and a strip that slides
   * away under the grip drag fights that. The setting itself is untouched.
   *
   * Runs wherever `applyDock` does, because a rebuilt pane starts with neither
   * class and a pane docked anywhere but left has both taken off. No observer:
   * those two call sites already fire on every event that matters.
   *
   * Writes the hidden class and NOT the open one. The open class belongs to
   * the reveal controller, which is the only thing that adds it; all this does
   * is keep a controller alive, so an open strip that is re-docked left to
   * left keeps the class it already has.
   */
  syncHidden() {
    var _a;
    const pane = this.host;
    const strip = this.el;
    if (!pane || !strip) return;
    const active = placementCanHideStrip(this.placement) && !this.unlocked && this.defs.get().settings.hideStrip;
    if (!active) {
      (_a = this.reveal) == null ? void 0 : _a.destroy();
      this.reveal = null;
      applyHidden(pane, false);
      return;
    }
    applyHidden(pane, true);
    if (!this.reveal) {
      this.reveal = new StripReveal({
        pane,
        strip,
        lipRight: () => strip.getBoundingClientRect().right,
        // `offsetWidth` is a layout width and a `transform` does not change
        // it, so this answers with the settled edge however far through the
        // slide the strip currently is. The strip is `left: 0` against the
        // pane's padding box, so its settled left edge is the pane's left
        // edge plus whatever border the pane carries, which is what
        // `clientLeft` reads. Measured in the running app with no such
        // border: pane left 44, strip width 38, settled right edge 82.
        openRight: () => pane.getBoundingClientRect().left + pane.clientLeft + strip.offsetWidth
      });
      this.reveal.attach();
    }
  }
  isUnlocked() {
    return this.unlocked;
  }
  /** The pair of commands' shared setter. Re-renders so the grip appears or disappears immediately. */
  setUnlocked(on) {
    if (!on) this.cancelDrag();
    if (this.unlocked === on) return;
    this.unlocked = on;
    this.render();
    this.syncHidden();
  }
  /** The pane the strip is mounted in, in viewport coordinates -- null only while unmounted. */
  paneRect() {
    var _a, _b;
    return (_b = (_a = this.host) == null ? void 0 : _a.getBoundingClientRect()) != null ? _b : null;
  }
  /**
   * The strip's own cross-axis size, reused as the thickness of every
   * candidate preview band. Exact for the placement the strip is already in;
   * approximate for the other three, whose icons could measure differently
   * on the other axis -- but close enough to read as "the strip would go
   * here", which is all a preview needs to do.
   */
  stripThickness() {
    var _a;
    const rect = (_a = this.el) == null ? void 0 : _a.getBoundingClientRect();
    const measured = rect ? this.axis === "y" ? rect.width : rect.height : 0;
    return measured || 40;
  }
  /** The screen rectangle a candidate placement's preview band would cover. */
  zoneRect(placement, pane, thickness) {
    const width = pane.right - pane.left;
    const height = pane.bottom - pane.top;
    switch (placement) {
      case "top":
        return { left: pane.left, top: pane.top, width, height: thickness };
      case "bottom":
        return { left: pane.left, top: pane.bottom - thickness, width, height: thickness };
      case "left":
        return { left: pane.left, top: pane.top, width: thickness, height };
      case "right":
        return { left: pane.right - thickness, top: pane.top, width: thickness, height };
    }
  }
  /**
   * Paints the four candidate bands once a drag has passed the threshold.
   *
   * Not painted at `pointerdown`: a click that never moves must show nothing
   * at all, so nothing is built until `passedThreshold` says this is really
   * a drag.
   */
  paintPreview(drag) {
    const pane = this.paneRect();
    if (!pane) return;
    const doc = drag.grip.ownerDocument;
    const overlay = doc.win.createDiv({ cls: "spaces-strip-drop-overlay" });
    const thickness = this.stripThickness();
    for (const placement of PLACEMENTS2) {
      const zone = overlay.createDiv({ cls: "spaces-strip-drop-zone" });
      const rect = this.zoneRect(placement, pane, thickness);
      zone.style.left = `${rect.left}px`;
      zone.style.top = `${rect.top}px`;
      zone.style.width = `${rect.width}px`;
      zone.style.height = `${rect.height}px`;
      drag.zones[placement] = zone;
    }
    doc.body.appendChild(overlay);
    drag.overlay = overlay;
  }
  /** Moves the highlight to the nearest candidate; the other three stay dim. */
  markActive(drag, target) {
    var _a;
    drag.target = target;
    for (const placement of PLACEMENTS2) {
      (_a = drag.zones[placement]) == null ? void 0 : _a.classList.toggle("is-active", placement === target);
    }
  }
  pointOf(e) {
    return { x: e.clientX, y: e.clientY };
  }
  insidePane(point, pane) {
    return point.x >= pane.left && point.x <= pane.right && point.y >= pane.top && point.y <= pane.bottom;
  }
  /**
   * Starts tracking the grab handle.
   *
   * Primary pointer, left button only: a right-click must reach the grip's
   * own `contextmenu` handler below and start nothing here. A second pointer
   * arriving while the first is already down is ignored outright -- it does
   * not steal the gesture or restart it.
   */
  onGripPointerDown(e, grip) {
    if (!e.isPrimary || e.button !== 0) return;
    if (this.drag) return;
    const pointerId = e.pointerId;
    try {
      grip.setPointerCapture(pointerId);
    } catch (e2) {
    }
    const onMove = (ev) => this.onGripPointerMove(ev);
    const onUp = (ev) => this.onGripPointerUp(ev);
    const onCancel = (ev) => {
      if (ev.pointerId === pointerId) this.cancelDrag();
    };
    const onLostCapture = (ev) => {
      if (ev.pointerId === pointerId) this.cancelDrag();
    };
    const onKeydown = (ev) => {
      if (ev.key === "Escape") this.cancelDrag();
    };
    grip.addEventListener("pointermove", onMove);
    grip.addEventListener("pointerup", onUp);
    grip.addEventListener("pointercancel", onCancel);
    grip.addEventListener("lostpointercapture", onLostCapture);
    grip.ownerDocument.addEventListener("keydown", onKeydown);
    this.drag = {
      pointerId,
      origin: this.pointOf(e),
      started: false,
      target: null,
      grip,
      overlay: null,
      zones: {},
      onMove,
      onUp,
      onCancel,
      onLostCapture,
      onKeydown
    };
  }
  /** Below the threshold this is still a click; past it, paints and tracks the preview. */
  onGripPointerMove(e) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const point = this.pointOf(e);
    if (!drag.started) {
      if (!passedThreshold(drag.origin, point)) return;
      drag.started = true;
      this.paintPreview(drag);
    }
    const pane = this.paneRect();
    if (!pane) return;
    this.markActive(drag, nearestPlacement(point, pane));
  }
  /**
   * A release that never passed the threshold is a click, and a click on the
   * grip does nothing. A release past the threshold commits, but only when
   * it lands inside the pane the drag started in -- outside it, it cancels
   * the same as Escape does.
   */
  onGripPointerUp(e) {
    const drag = this.drag;
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (!drag.started || !drag.target) {
      this.endGripDrag();
      return;
    }
    const pane = this.paneRect();
    const point = this.pointOf(e);
    if (!pane || !this.insidePane(point, pane)) {
      this.cancelDrag();
      return;
    }
    const target = drag.target;
    this.endGripDrag();
    void setStripPlacement(this.defs, target, () => this.cancelDrag());
  }
  /** Right-click the grip: lock, without starting a drag. */
  onGripContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    const menu = new import_obsidian5.Menu();
    menu.addItem(
      (mi) => mi.setIcon("lock").setTitle("Lock the space strip").onClick(() => this.setUnlocked(false))
    );
    menu.showAtMouseEvent(e);
  }
  /**
   * The only early exit from a drag. Idle-safe, so every caller -- Escape,
   * a lost capture, a release outside the pane, `setUnlocked(false)`, a
   * re-render, `destroy()`, or a placement written from Settings or a
   * command while a drag is in flight -- can reach for it without first
   * checking whether one is even running. Never persists anything: that is
   * `setStripPlacement`'s job alone, reached only from a commit.
   */
  cancelDrag() {
    this.endGripDrag();
  }
  /**
   * The one teardown, run by both the cancel path and the commit path.
   * Removes the preview, detaches the temporary listeners, releases capture
   * and clears `this.drag` -- guarded so a second call, however it arrives,
   * neither commits nor cleans up twice.
   *
   * Named distinctly from the reorder feature's own `endDrag(rail, line)`
   * below: the two are unrelated gestures (this one moves the whole strip,
   * that one reorders icons within it) that happen to share a name for the
   * same idea.
   */
  endGripDrag() {
    var _a;
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    drag.grip.removeEventListener("pointermove", drag.onMove);
    drag.grip.removeEventListener("pointerup", drag.onUp);
    drag.grip.removeEventListener("pointercancel", drag.onCancel);
    drag.grip.removeEventListener("lostpointercapture", drag.onLostCapture);
    drag.grip.ownerDocument.removeEventListener("keydown", drag.onKeydown);
    if (drag.grip.hasPointerCapture(drag.pointerId)) {
      drag.grip.releasePointerCapture(drag.pointerId);
    }
    (_a = drag.overlay) == null ? void 0 : _a.remove();
  }
  /**
   * One popover at a time. The capture-phase `mousedown` in `AnchoredPopover`
   * already dismisses the open one on the click that opens the next, so this
   * mostly restates an existing guarantee — but it holds it without depending
   * on a pointer event, which the keyboard routes into these menus do not
   * produce.
   */
  show(popover) {
    var _a;
    (_a = this.popover) == null ? void 0 : _a.close();
    this.popover = popover;
  }
  render() {
    var _a;
    const el = this.el;
    if (!el) return;
    this.cancelDrag();
    const refocus = this.focusedKey();
    el.replaceChildren();
    (_a = this.popover) == null ? void 0 : _a.closeIfAnchorDetached();
    const entries = spaceEntries(
      this.defs.get().spaces,
      this.runtime.getSelection(),
      knownIconIds()
    );
    const { pinned, railed } = splitPinnedEntry(entries, this.defs.get().settings.pinAllSpace);
    if (pinned) {
      el.appendChild(this.buildItem(pinned));
      const divider = el.ownerDocument.win.createDiv();
      divider.className = "spaces-switcher-divider";
      el.appendChild(divider);
    }
    const rail = el.ownerDocument.win.createDiv();
    rail.className = "spaces-switcher-rail";
    el.appendChild(rail);
    for (const entry of railed) {
      rail.appendChild(this.buildItem(entry));
    }
    if (!import_obsidian5.Platform.isMobile) this.wireReorder(rail);
    this.wireWheel(rail);
    const add = el.ownerDocument.win.createDiv();
    add.className = "clickable-icon spaces-switcher-add";
    add.setAttribute("role", "button");
    add.setAttribute("tabindex", "0");
    add.setAttribute("aria-label", "Create a space");
    add.dataset.switcherKey = ADD_FOCUS_KEY;
    (0, import_obsidian5.setIcon)(add, "plus");
    add.addEventListener("click", () => this.onCreateClicked());
    add.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.onCreateClicked();
      }
    });
    el.appendChild(add);
    const grip = applyUnlockState(el, this.unlocked);
    if (grip) {
      grip.dataset.switcherKey = GRIP_FOCUS_KEY;
      (0, import_obsidian5.setIcon)(grip, this.axis === "y" ? "grip-horizontal" : "grip-vertical");
      grip.addEventListener("pointerdown", (e) => this.onGripPointerDown(e, grip));
      grip.addEventListener("contextmenu", (e) => this.onGripContextMenu(e));
    }
    this.revealActive(rail);
    const styleClass = activeStyleClass(this.defs.get().settings.activeSpaceStyle);
    el.classList.toggle(BOXED_CLASS, styleClass === BOXED_CLASS);
    el.classList.toggle(BOLDED_CLASS, styleClass === BOLDED_CLASS);
    this.alignToPane();
    this.restoreFocus(refocus);
  }
  /**
   * The key of the strip control holding focus, or null when focus is
   * elsewhere.
   *
   * Null is the ordinary answer: `document.activeElement` is the body when
   * nothing is focused, and the strip does not contain the body.
   */
  focusedKey() {
    var _a;
    const el = this.el;
    const active = el == null ? void 0 : el.ownerDocument.activeElement;
    if (!el || !active || !el.contains(active) || !active.instanceOf(HTMLElement)) {
      return null;
    }
    return (_a = active.dataset.switcherKey) != null ? _a : ADD_FOCUS_KEY;
  }
  /**
   * Put focus back on the control `focusedKey()` named, after the rebuild
   * that destroyed it.
   *
   * Does nothing for a null key, which is what keeps a render from STEALING
   * focus: the strip re-renders on every definitions change, including ones
   * the user caused from the settings tab or from another window, and pulling
   * the caret out of whatever they were typing in would be worse than the bug
   * this fixes.
   *
   * A space that has gone — deleted from the settings tab, or by a `data.json`
   * arriving from another device — falls back to the add button. It is the one
   * control the strip always has, and it is what the user is now nearest to
   * doing.
   */
  restoreFocus(key) {
    var _a;
    const el = this.el;
    if (!el || key === null) return;
    const match = el.querySelector(
      `[data-switcher-key="${CSS.escape(key)}"]`
    );
    const add = el.querySelector(
      `[data-switcher-key="${ADD_FOCUS_KEY}"]`
    );
    (_a = match != null ? match : add) == null ? void 0 : _a.focus();
  }
  /**
   * Line the strip's two fixed parts up with the rows of the pane beside it.
   * Measures; `stripAlign.ts` decides.
   *
   * Cheap enough to run on every render: four `getBoundingClientRect` calls
   * and two property writes, against a strip that has just been rebuilt.
   */
  alignToPane() {
    var _a;
    const el = this.el;
    const pane = this.host;
    if (!el || !pane) return;
    if (this.axis !== "y" || this.unlocked || !this.defs.get().settings.pinAllSpace) {
      writePx(el, PROP_PAD_TOP, null);
      writePx(el, PROP_RAIL_GAP, null);
      return;
    }
    const header = pane.querySelector(CLS_SPACE_HEADER);
    const rail = el.querySelector(".spaces-switcher-rail");
    const out = stripAlignment({
      toolbarCentre: centreOf(pane.querySelector(SEL.navHeader)),
      // The header when it is shown, the first tree row when it is not:
      // whichever row the pane actually puts below the toolbar.
      anchorCentre: centreOf(header != null ? header : pane.querySelector(`${SEL.container} ${SEL.treeRow}`)),
      // The pinned control is the strip's own child; the rail's icons are not.
      pinned: boxOf(el.querySelector(":scope > .spaces-switcher-item")),
      firstIcon: boxOf(el.querySelector(".spaces-switcher-rail > .spaces-switcher-item")),
      currentPadTop: readPx(el, PROP_PAD_TOP, DESIGN_PAD_TOP),
      currentRailGap: readPx(el, PROP_RAIL_GAP, DESIGN_RAIL_GAP),
      // The rail scrolls once the spaces outrun the pane, and the icon's rect
      // scrolls with it. Alignment is about the rail's origin, not its
      // current scroll position.
      railScroll: (_a = rail == null ? void 0 : rail.scrollTop) != null ? _a : 0
    });
    writePx(el, PROP_PAD_TOP, out.padTop);
    writePx(el, PROP_RAIL_GAP, out.railGap);
  }
  /**
   * Scroll the rail with the wheel when the rail runs horizontally.
   *
   * A mouse wheel reports `deltaY`, and Chromium will not hand that to a
   * scroller that only scrolls on X, so a docked-top or docked-bottom rail
   * overflowed with no way to reach the icons past the edge. `railWheelDelta`
   * holds the rule; this projects the event and applies the answer.
   *
   * Attached to the rail, which is rebuilt on every render, so the listener
   * dies with the element it was added to and nothing has to unwind it. The
   * axis is read per event rather than per wiring because `this.axis` tracks
   * the live placement, which can change without rebuilding the rail.
   */
  wireWheel(rail) {
    rail.addEventListener(
      "wheel",
      (e) => {
        const vertical = this.axis === "y";
        if (vertical) return;
        const delta = railWheelDelta({
          along: e.deltaX,
          across: e.deltaY,
          scroll: rail.scrollLeft,
          scrollSize: rail.scrollWidth,
          clientSize: rail.clientWidth
        });
        if (delta === 0) return;
        e.preventDefault();
        rail.scrollLeft += delta;
      },
      // Not passive: the whole point is to cancel the default so the wheel
      // does not scroll an ancestor at the same time.
      { passive: false }
    );
  }
  /**
   * Drag a space icon to reorder it.
   *
   * Every rule lives in `spaceReorder.ts`; this measures, renders and writes.
   *
   * Rebuilt with the rail on each render, and a render CAN land mid-drag:
   * `main.ts` calls it on every file open and every coalesced vault flush, not
   * only after a write of its own. Rebuilding is still safe for the listeners
   * themselves, which are discarded with the rail they were on while the drag
   * state lives on the view -- but it is exactly why that state holds the
   * dragged space by ID and re-derives its index per use. See `dragFromId`.
   */
  wireReorder(rail) {
    const line = rail.ownerDocument.win.createDiv();
    line.className = CLS_SPACE_DROP_LINE;
    line.hidden = true;
    rail.appendChild(line);
    const spaceEls = () => Array.from(rail.querySelectorAll("[data-space-id]"));
    const railScrollAlong = () => this.axis === "x" ? rail.scrollLeft : rail.scrollTop;
    const boxesOf = (els, railSpan) => els.map((e) => {
      const span = spanOf(e.getBoundingClientRect(), this.axis);
      return { start: span.start - railSpan.start + railScrollAlong(), size: span.size };
    });
    const update = () => {
      const from = this.draggedIndex();
      if (from === null) {
        line.hidden = true;
        return;
      }
      const vertical = this.axis === "y";
      const railSpan = spanOf(rail.getBoundingClientRect(), this.axis);
      const boxes = boxesOf(spaceEls(), railSpan);
      const contentPointer = this.dragPointerAlong - railSpan.start + railScrollAlong();
      const index = insertionIndexAt(contentPointer, boxes);
      if (isNoOpMove(from, index)) {
        line.hidden = true;
        return;
      }
      const pos = Math.round(gapCenterAt(index, boxes)) - 1;
      if (vertical) line.style.top = `${pos}px`;
      else line.style.left = `${pos}px`;
      line.hidden = false;
    };
    const stopScrolling = () => {
      var _a;
      if (this.dragRaf) (_a = rail.ownerDocument.defaultView) == null ? void 0 : _a.cancelAnimationFrame(this.dragRaf);
      this.dragRaf = 0;
    };
    const tick = () => {
      this.dragRaf = 0;
      const reordering = this.dragFromId !== null;
      if (!reordering && this.fileDrop.dragged().paths.length === 0) return;
      const vertical = this.axis === "y";
      const railSpan = spanOf(rail.getBoundingClientRect(), this.axis);
      const step = edgeScrollStep(this.dragPointerAlong, railSpan);
      if (step !== 0) {
        if (vertical) rail.scrollTop += step;
        else rail.scrollLeft += step;
      }
      if (reordering) update();
      if (step !== 0) startScrolling();
    };
    const startScrolling = () => {
      if (this.dragRaf) return;
      const view = rail.ownerDocument.defaultView;
      if (view) this.dragRaf = view.requestAnimationFrame(tick);
    };
    rail.addEventListener("dragover", (e) => {
      var _a, _b, _c;
      if (this.dragFromId === null) {
        const drag = this.fileDrop.dragged();
        if (drag.paths.length === 0) return;
        const over = this.spaceElAt(e.target);
        const target = dropTargetFor(null, this.spaceFor(over), drag);
        if (target !== null && target.kind === "refuse") {
          this.markDropTarget(null);
          const key = `${(_b = (_a = this.spaceFor(over)) == null ? void 0 : _a.id) != null ? _b : ""}::${target.reason}`;
          if (!this.spokenRefusals.has(key)) {
            this.spokenRefusals.add(key);
            this.fileDrop.onRefused(target.reason, (_c = target.spaceName) != null ? _c : null);
          }
          return;
        }
        this.markDropTarget(target === null ? null : over);
        this.dragPointerAlong = pointerAlong(e, this.axis);
        startScrolling();
        if (target === null) return;
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
        return;
      }
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      this.dragPointerAlong = pointerAlong(e, this.axis);
      update();
      startScrolling();
    });
    rail.addEventListener("drop", (e) => {
      var _a;
      if (this.dragFromId === null) {
        stopScrolling();
        const over = this.spaceElAt(e.target);
        const drag = this.fileDrop.dragged();
        if (drag.paths.length === 0) return;
        this.markDropTarget(null);
        if (over === null) return;
        const drop = spaceDropFor(this.spaceFor(over), drag);
        if (drop.kind === "refuse") {
          this.fileDrop.onRefused(drop.reason, (_a = drop.spaceName) != null ? _a : null);
          return;
        }
        e.preventDefault();
        this.fileDrop.onDropped(drop.spaceId, drag);
        return;
      }
      e.preventDefault();
      const railSpan = spanOf(rail.getBoundingClientRect(), this.axis);
      const boxes = boxesOf(spaceEls(), railSpan);
      const pointer = pointerAlong(e, this.axis) - railSpan.start + railScrollAlong();
      const index = insertionIndexAt(pointer, boxes);
      const from = this.draggedIndex();
      const id = this.dragFromId;
      this.endDrag(rail, line);
      if (from === null || id === null) return;
      if (isNoOpMove(from, index)) return;
      void this.defs.mutate((d) => {
        d.spaces = moveVisibleTo(d.spaces, id, index);
      }).catch((err) => {
        console.error("Spaces: reordering spaces failed", err);
      });
    });
    rail.addEventListener("dragend", () => this.endDrag(rail, line));
    rail.addEventListener("dragleave", (e) => {
      const into = this.asNode(e.relatedTarget);
      if (into && rail.contains(into)) return;
      this.markDropTarget(null);
      stopScrolling();
    });
    this.stopDragScrolling = stopScrolling;
  }
  /**
   * Where the dragged space sits among the VISIBLE spaces right now (the
   * index space `insertionIndexAt` measures in), or null when no drag
   * is running or the space is no longer in the definitions.
   *
   * Asked per use rather than cached, because the whole point is that the
   * answer can change between the dragstart that set `dragFromId` and the drop
   * that spends it.
   */
  draggedIndex() {
    const id = this.dragFromId;
    if (id === null) return null;
    return visibleIndexOf(this.defs.get().spaces, id);
  }
  /**
   * An event target as a `Node`, or null. Uses Obsidian's cross-window
   * `instanceOf`: the global `Node` is a different constructor in a popout
   * window, so `instanceof` would refuse every node there. The typeof test
   * is for targets that are not nodes at all (a `Window`), which lack it.
   */
  asNode(target) {
    const node = target;
    return node && typeof node.instanceOf === "function" && node.instanceOf(Node) ? node : null;
  }
  /** The icon under the pointer, or null when the pointer is between them. */
  spaceElAt(target) {
    var _a;
    const node = this.asNode(target);
    if (!node) return null;
    const el = node.instanceOf(HTMLElement) ? node : node.parentElement;
    const item = (_a = el == null ? void 0 : el.closest(".spaces-switcher-item")) != null ? _a : null;
    return (item == null ? void 0 : item.dataset.spaceId) === void 0 ? null : item;
  }
  spaceFor(el) {
    var _a;
    const id = el == null ? void 0 : el.dataset.spaceId;
    if (id === void 0) return null;
    return (_a = this.defs.get().spaces.find((s) => s.id === id)) != null ? _a : null;
  }
  /** At most one icon wears the mark, so a fast drag cannot leave two lit. */
  markDropTarget(el) {
    var _a;
    if (this.dropTargetEl === el) return;
    (_a = this.dropTargetEl) == null ? void 0 : _a.classList.remove("is-drop-target");
    el == null ? void 0 : el.classList.add("is-drop-target");
    this.dropTargetEl = el;
  }
  /**
   * Takes the drop mark off, for a drag that ended without the pointer ever
   * leaving the icon -- Escape, or a drop refused elsewhere. `dragend` fires on
   * the drag SOURCE, a row in the file tree, so the rail never hears it.
   *
   * `dragleave` is not a substitute. The HTML spec does fire one before
   * `dragend` when a drag is cancelled, so it covers the Escape case, but it
   * says nothing about a drop the browser delivered elsewhere and it is
   * `relatedTarget`-dependent (see the listener). `main.ts` calls this from
   * `DragOrdering`'s drag-done callback, which fires at the end of each drag
   * the explorer published and again at the start of the next one. The older
   * wording here, "the one callback that learns every drag has ended, however
   * it ended", claimed more than that callback could deliver: a `dragend` sent
   * to a source row the tree had already replaced reached nothing at all.
   */
  clearDropTarget() {
    var _a;
    this.markDropTarget(null);
    this.spokenRefusals.clear();
    (_a = this.stopDragScrolling) == null ? void 0 : _a.call(this);
  }
  endDrag(rail, line) {
    var _a;
    this.dragFromId = null;
    this.markDropTarget(null);
    line.hidden = true;
    (_a = this.stopDragScrolling) == null ? void 0 : _a.call(this);
    rail.querySelectorAll(`.${CLS_SPACE_DRAGGING}`).forEach((e) => e.classList.remove(CLS_SPACE_DRAGGING));
  }
  /**
   * One control, whether it ends up in the rail or pinned beside it.
   *
   * Shared deliberately. A second hand-rolled copy of the *All* item is exactly
   * how the strip and the dropdown drifted apart before `spaceEntries.ts`
   * existed, and a pinned control that quietly lost `is-active`, its
   * `aria-label` or its pending state would be that mistake again in miniature.
   * The rule that *All* has no context menu survives for free: the gate is
   * on `entry.key.kind`, not on where the element is mounted.
   */
  buildItem(entry) {
    const el = this.el;
    const item = el.ownerDocument.win.createDiv();
    item.className = "clickable-icon spaces-switcher-item";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", entry.label);
    item.dataset.switcherKey = focusKeyFor(entry.key);
    const painted = iconColorFor(
      entry.color,
      this.defs.get().settings.useThemeIconColor
    );
    if (painted) item.style.color = painted;
    if (entry.active) {
      item.classList.add("is-active");
      item.setAttribute("aria-current", "true");
    }
    (0, import_obsidian5.setIcon)(item, entry.icon);
    const activate = async () => {
      item.classList.add("is-pending");
      try {
        await this.controller.switchTo(entry.key);
      } catch (e) {
        console.error("Spaces: switching space failed", e);
      } finally {
        this.render();
      }
    };
    item.addEventListener("click", () => void activate());
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        void activate();
      }
    });
    if (entry.key.kind === "space") {
      const spaceId = entry.key.id;
      if (!import_obsidian5.Platform.isMobile) {
        item.dataset.spaceId = spaceId;
        item.draggable = true;
      }
      item.addEventListener("dragstart", (e) => {
        var _a;
        (_a = this.reveal) == null ? void 0 : _a.reopen();
        this.dragFromId = spaceId;
        this.dragPointerAlong = pointerAlong(e, this.axis);
        item.classList.add(CLS_SPACE_DRAGGING);
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", spaceId);
        }
      });
      const currentIcon = entry.icon;
      item.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        const menu = new import_obsidian5.Menu();
        menu.addItem(
          (mi) => mi.setIcon("pencil").setTitle("Rename space\u2026").onClick(() => {
            this.show(
              openRenamePopover({
                anchor: item,
                current: entry.label,
                apply: (name) => renameSpace(this.defs, spaceId, name)
              })
            );
          })
        );
        menu.addItem(
          (mi) => mi.setIcon("image").setTitle("Change space icon\u2026").onClick(() => {
            this.show(
              openIconPicker(
                item,
                currentIcon,
                (icon) => setSpaceIcon(this.defs, spaceId, icon)
              )
            );
          })
        );
        menu.addItem(
          (mi) => mi.setIcon("palette").setTitle("Change space color\u2026").onClick(() => {
            var _a;
            this.show(
              openColorPicker({
                anchor: item,
                current: (_a = entry.color) != null ? _a : "",
                customs: this.defs.get().settings.customColors,
                apply: (color) => setSpaceColor(this.defs, spaceId, color),
                saveCustoms: (customs) => this.defs.mutate((d) => {
                  d.settings.customColors = customs;
                })
              })
            );
          })
        );
        if (this.isSortOverridden(entry.key)) {
          menu.addItem(
            (mi) => mi.setIcon("rotate-ccw").setTitle("Restore saved ordering").onClick(() => this.onRestoreOrdering(entry.key))
          );
        }
        menu.showAtMouseEvent(e);
      });
    }
    return item;
  }
  /**
   * Brings the active control into view when the rail overflows.
   *
   * Without this, the promise that "a space is never unreachable because it
   * does not fit" held only for reaching a space by scrolling to it, and not
   * for the space you are already IN: switching by command, by the header's
   * dropdown, or by creating a space lit up a control outside the visible
   * range with nothing bringing it back.
   *
   * `railScrollOffset` returns the current offset unchanged when the control
   * is already wholly visible, so this is a no-op on the common path — which
   * matters, because `render()` runs on every switch and every definitions
   * change.
   */
  revealActive(rail) {
    const active = rail.querySelector(".spaces-switcher-item.is-active");
    if (!active) return;
    const vertical = this.axis === "y";
    const railRect = rail.getBoundingClientRect();
    const itemRect = active.getBoundingClientRect();
    const next = railScrollOffset({
      scroll: vertical ? rail.scrollTop : rail.scrollLeft,
      clientSize: vertical ? rail.clientHeight : rail.clientWidth,
      itemOffset: vertical ? itemRect.top - railRect.top + rail.scrollTop : itemRect.left - railRect.left + rail.scrollLeft,
      itemSize: vertical ? itemRect.height : itemRect.width
    });
    if (vertical) {
      if (next !== rail.scrollTop) rail.scrollTop = next;
    } else if (next !== rail.scrollLeft) {
      rail.scrollLeft = next;
    }
  }
};

// src/ui/SpaceHeaderView.ts
var import_obsidian7 = require("obsidian");

// src/ui/spaceHeader.ts
function pinnedLabelFor(space, exists) {
  const root = space == null ? void 0 : space.root;
  if (typeof root !== "string" || isVaultRoot(root)) return null;
  return exists(root) ? `Pinned to ${root}` : `Pinned to ${root} (missing)`;
}
function headerModel(selection, spaces, knownIcons, exists) {
  var _a;
  const entries = spaceEntries(spaces, selection, knownIcons);
  const active = (_a = entries.find((e) => e.active)) != null ? _a : entries[0];
  const activeId = active.key.kind === "space" ? active.key.id : null;
  return {
    icon: active.icon,
    label: active.label,
    color: active.color,
    spaceId: activeId,
    pinnedLabel: activeId === null ? null : pinnedLabelFor(spaces.find((s) => s.id === activeId), exists)
  };
}

// src/ui/headerPlacement.ts
function headerAnchor(parent, container) {
  if (!container) return null;
  return container.parentElement === parent ? container : null;
}

// src/ui/spaceRow.ts
var import_obsidian6 = require("obsidian");
function appendSpaceIcon(row, entry, useThemeColor) {
  const icon = row.ownerDocument.win.createDiv();
  icon.className = "spaces-spaces-row-icon";
  (0, import_obsidian6.setIcon)(icon, entry.icon);
  const painted = iconColorFor(entry.color, useThemeColor);
  if (painted) icon.style.color = painted;
  row.appendChild(icon);
  return icon;
}

// src/ui/SpaceSwitcherPopover.ts
function openSpaceSwitcher(deps) {
  const popover = new AnchoredPopover({
    anchor: deps.anchor,
    className: "spaces-spaces-popover",
    ariaLabel: "Switch space",
    build: (root, pop) => {
      var _a, _b;
      const doc = root.ownerDocument;
      const list = doc.win.createDiv();
      list.className = "spaces-spaces-list";
      list.setAttribute("role", "listbox");
      const rows = [];
      for (const entry of deps.entries) {
        const row = doc.win.createDiv();
        row.className = "spaces-spaces-row";
        row.setAttribute("role", "option");
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-selected", String(entry.active));
        if (entry.active) {
          row.classList.add("is-active");
          row.setAttribute("aria-current", "true");
        }
        appendSpaceIcon(row, entry, deps.useThemeIconColor);
        const name = doc.win.createDiv();
        name.className = "spaces-spaces-row-name";
        name.textContent = entry.label;
        row.appendChild(name);
        const pick = () => {
          pop.close();
          void deps.switchTo(entry.key).catch((e) => {
            console.error("Spaces: switching space failed", e);
          });
        };
        row.addEventListener("click", pick);
        row.addEventListener("keydown", (e) => {
          var _a2;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pick();
            return;
          }
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            const i = rows.indexOf(row);
            const next = (i + (e.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
            (_a2 = rows[next]) == null ? void 0 : _a2.focus();
          }
        });
        rows.push(row);
        list.appendChild(row);
      }
      root.appendChild(list);
      (_b = (_a = rows.find((r) => r.classList.contains("is-active"))) != null ? _a : rows[0]) == null ? void 0 : _b.focus();
    }
  });
  popover.open();
  return popover;
}

// src/ui/SpaceHeaderView.ts
var SpaceHeaderView = class {
  constructor(defs, runtime, rename, switchTo, folderExists) {
    this.defs = defs;
    this.runtime = runtime;
    this.rename = rename;
    this.switchTo = switchTo;
    this.folderExists = folderExists;
    this.el = null;
    /** Kept so `render()` can re-attach after `showSpaceHeader` comes back on. */
    this.parent = null;
    /**
     * True between opening the inline editor and committing or cancelling it.
     * `render()` bails while it is set: rebuilding the row mid-edit would
     * destroy the input out from under the caret, and both re-render triggers
     * (a definitions change, an apply) fire during an ordinary rename.
     */
    this.editing = false;
    /**
     * The dropdown, while it is open.
     *
     * Held for the same reason `SwitcherView` holds its pickers:
     * `AnchoredPopover` puts four listeners on `document` that only its own
     * `close()` removes, and `destroy()` — reached from `onunload` and from
     * every `mount()` — is the only thing guaranteed to run.
     */
    this.popover = null;
  }
  /**
   * Builds the row and hands off to `render()`, which decides whether it is
   * attached at all — so a mount with the setting off costs one
   * detached element and touches the pane not at all.
   */
  mount(parent) {
    this.destroy();
    this.parent = parent;
    const el = parent.ownerDocument.win.createDiv();
    el.className = "spaces-space-header";
    this.el = el;
    this.render();
  }
  /**
   * Directly ABOVE the file tree and BELOW Obsidian's own `.nav-header`
   * — so the host's buttons and search stay where every other vault has them,
   * and the space name reads as a heading for the list it labels rather than a
   * banner over the whole pane.
   *
   * Positioned by finding the tree container rather than by index; see
   * `headerAnchor` for why, and for why a container it cannot place against
   * falls back to appending rather than throwing.
   */
  attach() {
    const parent = this.parent;
    const el = this.el;
    if (!parent || !el) return;
    const anchor = headerAnchor(parent, parent.querySelector(SEL.container));
    if (anchor) parent.insertBefore(el, anchor);
    else parent.appendChild(el);
  }
  destroy() {
    var _a, _b;
    (_a = this.popover) == null ? void 0 : _a.close();
    this.popover = null;
    (_b = this.el) == null ? void 0 : _b.remove();
    this.el = null;
    this.parent = null;
    this.editing = false;
  }
  render() {
    var _a, _b;
    const el = this.el;
    if (!el || this.editing) return;
    if (!this.defs.get().settings.showSpaceHeader) {
      el.remove();
      el.replaceChildren();
      (_a = this.popover) == null ? void 0 : _a.closeIfAnchorDetached();
      return;
    }
    if (!el.isConnected) this.attach();
    el.replaceChildren();
    (_b = this.popover) == null ? void 0 : _b.closeIfAnchorDetached();
    const doc = el.ownerDocument;
    const model = headerModel(
      this.runtime.getSelection(),
      this.defs.get().spaces,
      knownIconIds(),
      this.folderExists
    );
    const icon = doc.win.createDiv();
    icon.className = "spaces-space-header-icon";
    (0, import_obsidian7.setIcon)(icon, model.icon);
    const painted = iconColorFor(model.color, this.defs.get().settings.useThemeIconColor);
    if (painted) icon.style.color = painted;
    else icon.style.removeProperty("color");
    el.appendChild(icon);
    icon.setAttribute("role", "button");
    icon.setAttribute("tabindex", "0");
    icon.setAttribute("aria-label", "Switch space");
    const openList = () => {
      var _a2;
      (_a2 = this.popover) == null ? void 0 : _a2.close();
      this.popover = openSpaceSwitcher({
        anchor: icon,
        entries: spaceEntries(
          this.defs.get().spaces,
          this.runtime.getSelection(),
          knownIconIds()
        ),
        useThemeIconColor: this.defs.get().settings.useThemeIconColor,
        switchTo: (key) => this.switchTo(key)
      });
    };
    icon.addEventListener("click", openList);
    icon.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openList();
      }
    });
    const label = doc.win.createDiv();
    label.className = "spaces-space-header-name";
    label.textContent = model.label;
    el.appendChild(label);
    if (this.defs.get().settings.showPinnedFolder && model.pinnedLabel !== null) {
      const pin = doc.win.createDiv();
      pin.className = "spaces-space-header-pin";
      (0, import_obsidian7.setIcon)(pin, "pin");
      pin.setAttribute("aria-label", model.pinnedLabel);
      el.appendChild(pin);
    }
    const spaceId = model.spaceId;
    if (spaceId === null) return;
    label.setAttribute("role", "button");
    label.setAttribute("tabindex", "0");
    label.setAttribute("aria-label", `Rename ${model.label}`);
    const begin = () => this.beginEdit(el, label, spaceId, model.label);
    label.addEventListener("click", begin);
    label.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        begin();
      }
    });
  }
  /**
   * Swaps the label for an input, in the manner of Obsidian's own inline
   * rename in the file explorer: Enter and blur commit, Escape cancels.
   */
  beginEdit(row, label, spaceId, current) {
    this.editing = true;
    const input = row.ownerDocument.win.createEl("input");
    input.type = "text";
    input.className = "spaces-space-header-input";
    input.setAttribute("aria-label", "Space name");
    input.maxLength = MAX_SPACE_NAME_LENGTH;
    input.value = current;
    label.replaceWith(input);
    input.focus();
    input.select();
    let settled = false;
    const finish = (commit) => {
      if (settled) return;
      settled = true;
      this.editing = false;
      const next = commit ? normalizeSpaceName(input.value) : null;
      if (next === null || next === current) {
        this.render();
        return;
      }
      void this.rename(spaceId, next).catch((e) => {
        new import_obsidian7.Notice(`Spaces: could not rename the space (${String(e)})`);
        this.render();
      });
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        finish(true);
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish(false);
      }
    });
    input.addEventListener("blur", () => finish(true));
  }
};

// src/ui/SpaceSuggestModal.ts
var import_obsidian8 = require("obsidian");

// src/ui/spaceSuggest.ts
var EMPTY_QUERY_SPACES = 5;
function spaceSuggestions(entries, query, score) {
  if (!query.trim()) {
    return entries.slice(0, EMPTY_QUERY_SPACES + 1).map((entry) => ({ entry, match: null }));
  }
  const hits = [];
  entries.forEach((entry, order) => {
    const match = score(entry.label);
    if (match) hits.push({ entry, match, order });
  });
  hits.sort((a, b) => b.match.score - a.match.score || a.order - b.order);
  return hits.map(({ entry, match }) => ({ entry, match }));
}

// src/ui/SpaceSuggestModal.ts
var SpaceSuggestModal = class extends import_obsidian8.SuggestModal {
  constructor(deps) {
    super(deps.app);
    this.deps = deps;
    this.setPlaceholder("Find a space");
  }
  getSuggestions(query) {
    return spaceSuggestions(this.deps.entries(), query, (0, import_obsidian8.prepareFuzzySearch)(query));
  }
  renderSuggestion(suggestion, el) {
    el.classList.add("spaces-spaces-row");
    const { entry, match } = suggestion;
    if (entry.active) el.classList.add("is-active");
    el.setAttribute("aria-current", String(entry.active));
    appendSpaceIcon(el, entry, this.deps.useThemeIconColor());
    const name = el.ownerDocument.win.createDiv();
    name.className = "spaces-spaces-row-name";
    if (match) (0, import_obsidian8.renderResults)(name, entry.label, match);
    else name.textContent = entry.label;
    el.appendChild(name);
  }
  onChooseSuggestion(suggestion) {
    void this.deps.switchTo(suggestion.entry.key).catch((e) => {
      console.error("Spaces: switching space failed", e);
    });
  }
};

// src/ui/CreateSpacePanel.ts
var import_obsidian9 = require("obsidian");

// src/ui/ribbonAlign.ts
function alignmentGap(input) {
  const { ribbonCentres, rowTop, rowHeight, currentGap, designGap, tolerance } = input;
  if (ribbonCentres.length === 0 || rowHeight <= 0) return null;
  if (!Number.isFinite(rowTop) || !Number.isFinite(currentGap)) return null;
  const rowCentre = rowTop + rowHeight / 2;
  const reachable = ribbonCentres.map((c) => Math.round(currentGap + (c - rowCentre))).filter((g) => Math.abs(g - designGap) <= tolerance);
  if (reachable.length === 0) return null;
  return reachable.reduce(
    (best, g) => Math.abs(g - designGap) < Math.abs(best - designGap) ? g : best
  );
}

// src/ui/vaultTree.ts
var DEFAULT_BRANCH_KIND = "folder";
var isBranchByKind = (node) => node.kind === DEFAULT_BRANCH_KIND;
var isBranchByChildren = (node) => node.children.length > 0;
function buildVaultTree(entries, branchKind = DEFAULT_BRANCH_KIND, isBranch = isBranchByKind) {
  const roots = [];
  const byPath = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const segments = entry.path.split("/").filter((s) => s !== "");
    let prefix = "";
    let siblings = roots;
    segments.forEach((segment, i) => {
      prefix = prefix === "" ? segment : `${prefix}/${segment}`;
      const leaf = i === segments.length - 1;
      let node = byPath.get(prefix);
      if (!node) {
        node = { path: prefix, name: segment, kind: leaf ? entry.kind : branchKind, children: [] };
        byPath.set(prefix, node);
        siblings.push(node);
      } else if (leaf) {
        node.kind = entry.kind;
      }
      siblings = node.children;
    });
  }
  const sort = (nodes) => {
    nodes.sort((a, b) => {
      const aBranch = isBranch(a);
      if (aBranch !== isBranch(b)) return aBranch ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) sort(n.children);
  };
  sort(roots);
  return roots;
}
function visibleRows(tree, opts) {
  var _a, _b;
  const query = opts.filter.trim().toLowerCase();
  const only = (_a = opts.onlyKind) != null ? _a : null;
  const budget = (_b = opts.budget) != null ? _b : Number.POSITIVE_INFINITY;
  const included = (node) => only === null || node.kind === only;
  const deep = query.includes("/");
  const matches = (node) => (deep ? node.path : node.name).toLowerCase().includes(query);
  const keep = (node) => included(node) && (query === "" || matches(node) || node.children.some(keep));
  const shownChildren = (nodes, insideMatch) => nodes.filter((node) => {
    if (!included(node)) return false;
    if (query === "" || insideMatch) return true;
    return matches(node) || node.children.some(keep);
  });
  const rows = [];
  let left = budget;
  const emitLevel = (nodes, depth, parent, insideMatch) => {
    for (let i = 0; i < nodes.length; i++) {
      const reserve = i < nodes.length - 1 ? 1 : 0;
      if (left - reserve < 1) {
        if (left >= 1) {
          rows.push({ kind: "overflow", parent, hidden: nodes.length - i, depth });
          left -= 1;
        }
        return;
      }
      const node = nodes[i];
      const kids = node.children.filter(included);
      const hasChildren = kids.length > 0;
      const selfMatches = query !== "" && matches(node);
      const wantsOpen = hasChildren && (query !== "" || opts.expanded.has(node.path));
      const shown = wantsOpen ? shownChildren(kids, insideMatch || selfMatches) : [];
      left -= 1 + reserve;
      const fits = shown.length > 0 && left >= (shown.length > 1 ? 2 : 1);
      const expanded = wantsOpen && fits;
      const budgetClosed = wantsOpen && shown.length > 0 && !fits;
      rows.push({
        path: node.path,
        name: node.name,
        kind: node.kind,
        depth,
        hasChildren,
        expanded,
        ...budgetClosed ? { budgetClosed: true } : {},
        selected: opts.selected.has(node.path)
      });
      if (expanded) emitLevel(shown, depth + 1, node.path, insideMatch || selfMatches);
      left += reserve;
    }
  };
  emitLevel(shownChildren(tree, false), 0, "", false);
  return rows;
}

// src/ui/pickerFilter.ts
var ITEMS_SIGIL = "/";
var TAG_SIGIL = "#";
var PROPERTY_SIGIL = "@";
var DEFAULT_PICKER_MODE = "items";
var MODE_SIGILS = /* @__PURE__ */ new Map([
  [ITEMS_SIGIL, "items"],
  [TAG_SIGIL, "tags"],
  [PROPERTY_SIGIL, "properties"]
]);
function readModeSigil(stroke) {
  var _a;
  if (stroke.box !== "") return null;
  if (stroke.modified === true || stroke.composing === true) return null;
  return (_a = MODE_SIGILS.get(stroke.key)) != null ? _a : null;
}

// src/ui/tagRowCounts.ts
function countTagRows(rows, countOf) {
  return rows.map((row) => ({ ...row, count: countOf(row.tag) }));
}
function tagCountLabel(count) {
  if (count <= 0) return "no notes";
  if (count === 1) return "1 note";
  return `${count.toLocaleString()} notes`;
}

// src/ui/pickerBody.ts
function readPickerBody(mode, folderMode) {
  return folderMode ? "items" : mode;
}
function countPicked(items) {
  const counts = { notes: 0, folders: 0, tags: 0, properties: 0 };
  for (const item of items) {
    if (item.kind === "tag") counts.tags += 1;
    else if (item.kind === "property") counts.properties += 1;
    else if (item.kind === "folder") counts.folders += 1;
    else if (item.kind === "file") counts.notes += 1;
    else {
      const unreached = item;
      return unreached;
    }
  }
  return counts;
}
function pickedSummary(picked, notes) {
  const selectors = [];
  const add = (n, one, many) => {
    if (n <= 0) return;
    selectors.push(n === 1 ? `1 ${one}` : `${n.toLocaleString()} ${many}`);
  };
  add(picked.folders, "folder", "folders");
  add(picked.tags, "tag", "tags");
  add(picked.properties, "property", "properties");
  if (picked.notes + picked.folders + picked.tags + picked.properties === 0) return "Nothing selected";
  return [tagCountLabel(notes), ...selectors].join(" \u2022 ");
}
var JOINED_ROW_CLASS = "is-joined-down";
function markJoinedRows(host) {
  const drawn = host.children;
  for (let i = 0; i < drawn.length; i++) {
    const el = drawn[i];
    const next = i + 1 < drawn.length ? drawn[i + 1] : null;
    const joins = (el.classList.contains("is-selected") || el.classList.contains("is-inherited")) && next !== null && next.classList.contains("is-inherited");
    el.classList.toggle(JOINED_ROW_CLASS, joins);
  }
}

// src/ui/tagCandidates.ts
var DEFAULT_LIMIT = 50;
function tagCandidates(src, query, limit = DEFAULT_LIMIT) {
  const unique = storedTags(src);
  if (unique === null) return null;
  const want = normalizeTag(query);
  if (want.length === 0) return unique.slice(0, limit);
  return unique.filter((t) => t.includes(want)).slice(0, limit);
}
function storedTags(src) {
  const known = src.knownTags();
  if (known === null) return null;
  return [...new Set(known.map(normalizeTag).filter((t) => t.length > 0))].sort();
}

// src/ui/propertyRows.ts
var TAG_ALIAS_KEYS = /* @__PURE__ */ new Set(["tags", "tag"]);
var NAME_ORDER = new Intl.Collator(void 0, { sensitivity: "base" });
function isPickableKey(key) {
  return isEligiblePropertyKey(key) && !TAG_ALIAS_KEYS.has(key.toLowerCase());
}
function pickableKeys(all, query, keepUnmatched = () => false) {
  const q = query.trim().toLowerCase();
  return all.filter(
    (k) => isPickableKey(k.key) && (q === "" || k.key.toLowerCase().includes(q) || keepUnmatched(k.key))
  ).sort(
    (a, b) => NAME_ORDER.compare(a.key, b.key) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0)
  );
}
function valueQuery(query) {
  return normalizeValue(query);
}
function valueMatches(value, query) {
  return query === "" || value.normalized.includes(query);
}
function valueLabel(value) {
  return value.trim() === "" ? "Empty string" : value;
}
function existsMember(key) {
  return { kind: "property", key };
}
function equalsMember(key, value) {
  return { kind: "property", key, value };
}
function holdsProperty(items, member) {
  const id = memberIdentity(member);
  return items.some((m) => memberIdentity(m) === id);
}
function addPropertyMember(space, member) {
  if (holdsProperty(space.members, member)) return space;
  return { ...space, members: [...space.members, member] };
}
function readPropertyAdd(members, keyText, valueText, knownKeys) {
  const key = keyText;
  const value = valueText.trim();
  if (!isEligiblePropertyKey(key)) return { outcome: "blank" };
  if (!isPickableKey(key)) return { outcome: "tags" };
  if (key !== key.trim()) {
    if (knownKeys === null) return { outcome: "unknown-keys" };
    if (!knownKeys.has(key)) return { outcome: "spaced" };
  }
  const member = value === "" ? existsMember(key) : equalsMember(key, value);
  if (holdsProperty(members, member)) {
    return { outcome: "held", label: value === "" ? key : `${key}: ${value}` };
  }
  return { outcome: "add", member };
}

// src/ui/rowWindow.ts
var DEFAULT_OVERSCAN = 3;
function positive(n) {
  return Number.isFinite(n) && n > 0;
}
function visibleRange(input) {
  const { scrollTop, viewportHeight, rowHeight } = input;
  const count = Number.isFinite(input.count) ? Math.floor(input.count) : 0;
  if (count <= 0) return { first: 0, last: 0 };
  if (!positive(viewportHeight) || !positive(rowHeight)) return { first: 0, last: count };
  const overscan = input.overscan === void 0 || !Number.isFinite(input.overscan) || input.overscan < 0 ? DEFAULT_OVERSCAN : Math.floor(input.overscan);
  const top = Math.min(
    Math.max(Number.isFinite(scrollTop) ? scrollTop : 0, 0),
    Math.max(count * rowHeight - viewportHeight, 0)
  );
  const first = Math.max(Math.floor(top / rowHeight) - overscan, 0);
  const last = Math.min(Math.ceil((top + viewportHeight) / rowHeight) + overscan, count);
  return { first, last: Math.max(last, first) };
}
function windowCovering(index, input) {
  const plain = visibleRange(input);
  if (!Number.isInteger(index) || index < 0 || index >= input.count) return plain;
  if (index >= plain.first && index < plain.last) return plain;
  const { rowHeight, viewportHeight } = input;
  if (!positive(rowHeight) || !positive(viewportHeight)) return plain;
  const scrollTop = index < plain.first ? index * rowHeight : (index + 1) * rowHeight - viewportHeight;
  return visibleRange({ ...input, scrollTop });
}
function spacerHeight(rows, rowHeight) {
  if (!Number.isFinite(rows) || rows <= 0 || !positive(rowHeight)) return 0;
  return rows * rowHeight;
}

// src/ui/panelMount.ts
function isStillCovering(el, mountedContainer, parent, container) {
  return el !== null && el.isConnected && el.parentElement === parent && mountedContainer !== null && container === mountedContainer;
}
function resyncInertSiblings(el, inertSiblings, parent) {
  if (!el) return;
  for (let i = inertSiblings.length - 1; i >= 0; i--) {
    const recorded = inertSiblings[i];
    if (recorded.parentElement === parent) continue;
    recorded.inert = false;
    inertSiblings.splice(i, 1);
  }
  for (const child of Array.from(parent.children)) {
    if (child === el || !child.instanceOf(HTMLElement)) continue;
    if (inertSiblings.includes(child) || child.inert) continue;
    child.inert = true;
    inertSiblings.push(child);
  }
}

// src/ui/CreateSpacePanel.ts
var MAX_PICKER_ROWS = 200;
var PICKER_OVERSCAN = 3;
var PROPERTY_ROW_PITCH_PX = 25;
function planOwnsControl(entry, control) {
  if (entry.kind === "key") {
    return control === `expand:${entry.id}` || control === `select:${entry.id}`;
  }
  if (entry.kind === "value") return control === `select:${entry.id}`;
  return false;
}
var SIGIL_FLASH_MS = 120;
var DESIGN_TITLE_GAP = 22;
var TITLE_GAP_TOLERANCE = 6;
function initialState(deps) {
  const empty = emptyForm(deps.defaultColor);
  if (deps.root === void 0) return empty;
  if (!isFolderForm(setRoot(empty, deps.root))) return empty;
  return setFolderMode(setRoot(empty, deps.root), true);
}
var PLACEHOLDER_PATHS = [
  // square-dashed: four rounded corners, then the eight edge dashes
  "M5 3a2 2 0 0 0-2 2",
  "M19 3a2 2 0 0 1 2 2",
  "M21 19a2 2 0 0 1-2 2",
  "M5 21a2 2 0 0 1-2-2",
  "M9 3h1",
  "M9 21h1",
  "M14 3h1",
  "M14 21h1",
  "M3 9v1",
  "M21 9v1",
  "M3 14v1",
  "M21 14v1",
  // square-plus's plus
  "M8 12h8",
  "M12 8v8"
];
var isOverflowRow = (row) => row.kind === "overflow";
var CreateSpacePanel = class {
  constructor(deps) {
    this.deps = deps;
    this.el = null;
    /**
     * Every sibling of `el` under `mount()`'s `parent` that we set `inert` on —
     * recorded so `destroy()` clears exactly these. Inerting only
     * `.nav-files-container` leaves the switcher strip and the native
     * `.nav-header` tabbable behind an opaque overlay, where Shift+Tab or Enter
     * could switch spaces or create a note from behind the panel. Every sibling
     * the panel covers must be inert, with a re-sync obligation on switcher
     * re-mount.
     */
    this.inertSiblings = [];
    /**
     * `.nav-files-container` as found under `mount()`'s `parent` at the most
     * recent successful mount, which `isStillCovering()` compares against the
     * container `bindExplorer()` finds NOW — otherwise a `changeLayout()`
     * rebuild leaves the freshly-built tree, never scanned into
     * `inertSiblings`, live and tabbable behind the overlay. Cleared in
     * `destroy()`.
     */
    this.mountedContainer = null;
    /**
     * The document the Escape listener is attached to. Kept separately
     * from `el` because it must still be reachable to
     * unbind in `destroy()` even after `el` itself has been torn down.
     */
    this.doc = null;
    this.nameInput = null;
    /**
     * The name row, kept so `alignToRibbon()` can measure where it landed.
     * Cleared in `destroy()` beside `nameInput`/`createBtn`.
     */
    this.nameRow = null;
    /** The folder tree's container, redrawn in place by `renderPickerBody()`. */
    this.treeEl = null;
    /**
     * Draws the Properties body's current plan into the window the scroller is
     * showing, or null while some other body is drawn.
     *
     * A closure rather than a method because it holds the plan and the row
     * builders of the draw that made it: a scroll changes WHICH rows are wanted
     * and nothing about what they are, so repainting must not re-ask the index,
     * re-filter, or rebuild the plan. Replaced on every draw of the body and
     * dropped when any other body draws, so a stale plan can never be painted.
     */
    this.propertyPaint = null;
    /** The row range currently in the host, so a scroll that moves the window a few px repaints nothing. */
    this.propertyRange = null;
    /** The row pitch the window is computed from. See `PROPERTY_ROW_PITCH_PX` and `repitch`. */
    this.propertyRowPitch = PROPERTY_ROW_PITCH_PX;
    /** Guards `repitch`'s repaint against measuring its way into a loop. */
    this.repitching = false;
    /**
     * The row pinned under the window's list, kept so `renderSummary()` can
     * redraw its words in place: picking must not rebuild the window under the
     * pointer that just clicked in it.
     */
    this.summaryEl = null;
    /** The filter box, kept so the sigil shortcut can retitle its placeholder. */
    this.filterEl = null;
    /**
     * The sigil now showing in the filter box but NOT part of the query, or
     * null when nothing is flashing.
     *
     * The box has to show the character for a moment, because a keystroke that
     * disappears at the instant it is pressed reads as a dropped key rather than
     * as the window snapping over. It must not be in the query while it shows.
     *
     * Held as state rather than stripped by the timer alone, and that is what
     * makes typing at speed safe: every character after it lands in the box
     * normally and in the order the keyboard produced it, `itemFilter` is taken
     * through `queryFrom` so the list never sees the sigil, and the flash ends
     * by removing exactly the one character it put there.
     */
    this.sigilFlash = null;
    /**
     * Cancels the pending flash, or null. A closure rather than a bare handle so
     * the `clearTimeout` runs against whatever set it, and so teardown has one
     * thing to call.
     */
    this.sigilFlashOff = null;
    /**
     * The Vault and Tags buttons, kept so a mode reached by the sigil can press
     * the right one without redrawing the pair.
     */
    this.pickerModeEls = /* @__PURE__ */ new Map();
    /**
     * Which body the explorer window is showing.
     *
     * Held here rather than read back out of the filter text: the buttons are
     * the thing that holds the mode now, and the sigil presses a button rather
     * than leaving a mark in the box. Folder mode overrules it, which is
     * `readPickerBody`'s job rather than this field's.
     */
    this.pickerMode = DEFAULT_PICKER_MODE;
    /**
     * The vault as a tree, kept while the picker stays open.
     *
     * Reading and rebuilding it is about 40 ms on a 20,000-note vault, and it
     * used to run on every keystroke, caret and row click. Rebuilt whenever the
     * panel re-renders — opening the picker, switching mode — so a filtering
     * session sees one snapshot and a newly created file appears the next time
     * the picker is opened rather than mid-keystroke. That is the trade: a few
     * seconds of staleness for a keystroke that does not stall.
     */
    this.vaultTree = null;
    /**
     * The picker's own state, deliberately NOT in `CreateFormState`: how the
     * user is looking for something is not part of the space being made. A
     * cancelled panel should forget it, and `toCreateOptions` never see it.
     */
    this.itemsOpen = false;
    /**
     * What the last failed Create pointed at, or `null`. Panel state: it is
     * about this attempt, not about the space being made.
     */
    this.fault = null;
    this.itemFilter = "";
    this.expandedFolders = /* @__PURE__ */ new Set();
    /**
     * The tag tree's own expansion, kept apart from `expandedFolders`.
     *
     * One set would collide on any tag that shares a spelling with a folder, and
     * would make a switch to Tags and back collapse whatever the user had opened
     * in the other body. The bodies are one picker to look at and
     * independent things to have browsed into.
     */
    this.expandedTags = /* @__PURE__ */ new Set();
    /**
     * The property keys the user has opened. Panel state like the two sets
     * beside it, and the only thing that causes a key's values to be listed:
     * the body asks the index for values of these keys and no others.
     */
    this.expandedProperties = /* @__PURE__ */ new Set();
    /**
     * The live metadata subscription, or null. One object per subscription so a
     * notification from a released one can recognize itself as stale and do
     * nothing, whatever the source does after being told to stop.
     */
    this.propertySub = null;
    /**
     * Re-aligns when the window changes size, because the panel's top edge moves
     * with the workspace layout above it. Raw `addEventListener` with an
     * explicit removal in `destroy()`: this class is not a `Component`, so it
     * has no `registerDomEvent`, and the target (`defaultView`) outlives it.
     */
    this.onViewResize = () => this.alignToRibbon();
    this.createBtn = null;
    /** Guards against double-submit while `onSubmit`'s promise is in flight. */
    this.submitting = false;
    /**
     * The icon picker, while it is open. This panel re-renders by replacing
     * every node, so `destroy()` must be able to take down a popover whose
     * anchor button no longer exists: without the retained handle it leaks its
     * suggester once the anchor is gone.
     */
    this.pickerPopover = null;
    /**
     * Escape closes. Bound once as an instance field so `destroy()` can remove
     * the exact listener `mount()` added, and attached to `mount()`'s document
     * rather than to `el`: every `render()` can destroy the element holding
     * focus, and a keydown at a now-detached target would never reach a
     * listener that only lived on `el`.
     *
     * Narrowed to three conditions, or Escape in the editor pane discards the
     * whole form. Never act twice on a `defaultPrevented` event. When one of our
     * own popovers is open, Escape closes ONLY that (`AnchoredPopover` handles
     * its own). Otherwise act only if the target is inside the panel or is
     * `body`/`documentElement` — once focus genuinely has nowhere to go
     * `target` lands there, and dropping that case makes Escape unreachable.
     */
    this.onDocKeydown = (e) => {
      var _a, _b, _c, _d, _e;
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if ((_a = this.pickerPopover) == null ? void 0 : _a.isOpen) return;
      const target = e.target;
      const inPanel = target instanceof Node && ((_c = (_b = this.el) == null ? void 0 : _b.contains(target)) != null ? _c : false);
      const isFallbackTarget = target === ((_d = this.doc) == null ? void 0 : _d.body) || target === ((_e = this.doc) == null ? void 0 : _e.documentElement);
      if (!inPanel && !isFallbackTarget) return;
      e.preventDefault();
      this.close();
    };
    this.state = initialState(deps);
    this.customColors = deps.customColors;
    this.resetPickerState();
  }
  /**
   * Puts the picker back to how a fresh open should find it.
   *
   * Shared by the constructor and `mount()` for the same reason `state` and
   * `submitting` are reset in both: a reused instance must not re-open showing
   * the last session's picker, filter text, expansion set or red mark over a
   * form that has just been emptied.
   */
  resetPickerState() {
    this.vaultTree = null;
    this.fault = null;
    this.itemFilter = "";
    this.expandedFolders = /* @__PURE__ */ new Set();
    this.expandedTags = /* @__PURE__ */ new Set();
    this.expandedProperties = /* @__PURE__ */ new Set();
    for (const ancestor of ancestorsOf(this.state.root)) this.expandedFolders.add(ancestor);
    this.itemsOpen = isFolderForm(this.state);
  }
  get isOpen() {
    return this.el !== null;
  }
  /**
   * Whether the panel is still covering the SAME container it inerted, not
   * merely still parented under the same ancestor: parent identity stays true
   * across a `changeLayout()` rebuild, which destroys and recreates
   * `.nav-files-container` while `containerEl` (`parent`) persists.
   * `container` is whatever `bindExplorer()` finds under `parent` right now —
   * no second query here.
   *
   * The comparison lives in `panelMount.ts`, a plain-DOM module, so it is
   * directly testable — see `tests/panelMount.test.ts`.
   */
  isStillCovering(parent, container) {
    return isStillCovering(this.el, this.mountedContainer, parent, container);
  }
  /**
   * Called by `bindExplorer()` after `switcher.mount()`, only when the panel
   * is KEPT open across a layout-change. `SwitcherView` destroys and recreates
   * its own element on every `mount()`, so the switcher strip is always
   * rebuilt underneath the panel and `mount()`'s one-time inert loop never
   * sees the new node. Reconciles `inertSiblings` against `parent`'s CURRENT
   * children: drops and un-inerts any recorded sibling no longer parented
   * there, and inerts and records any current sibling not already recorded
   * and not already `inert` for some unrelated reason (never take ownership
   * of an `inert` we did not set). Mutated in place.
   */
  resyncInertSiblings(parent) {
    resyncInertSiblings(this.el, this.inertSiblings, parent);
  }
  mount(parent) {
    var _a, _b;
    this.destroy();
    this.submitting = false;
    this.state = initialState(this.deps);
    this.resetPickerState();
    const container = parent.querySelector(SEL.container);
    if (!container || parent.closest(SEL.container)) {
      throw new Error(
        `Spaces: CreateSpacePanel.mount() expects the pane's containerEl (an ancestor of ${SEL.container}) as \`parent\` \u2014 got an element that is ${SEL.container} itself, nested inside it, or has no ${SEL.container} descendant at all.`
      );
    }
    this.mountedContainer = container;
    try {
      const el = parent.ownerDocument.win.createDiv();
      el.className = "spaces-create-panel";
      parent.appendChild(el);
      this.el = el;
      for (const child of Array.from(parent.children)) {
        if (child === el || !child.instanceOf(HTMLElement) || child.inert) continue;
        child.inert = true;
        this.inertSiblings.push(child);
      }
      this.doc = parent.ownerDocument;
      this.doc.addEventListener("keydown", this.onDocKeydown);
      (_a = this.doc.defaultView) == null ? void 0 : _a.addEventListener("resize", this.onViewResize);
      this.render();
      (_b = this.nameInput) == null ? void 0 : _b.focus();
    } catch (e) {
      this.destroy();
      throw e;
    }
  }
  destroy() {
    var _a, _b, _c, _d;
    while (this.inertSiblings.length > 0) {
      const sibling = this.inertSiblings.pop();
      sibling.inert = false;
    }
    this.mountedContainer = null;
    (_a = this.doc) == null ? void 0 : _a.removeEventListener("keydown", this.onDocKeydown);
    (_c = (_b = this.doc) == null ? void 0 : _b.defaultView) == null ? void 0 : _c.removeEventListener("resize", this.onViewResize);
    this.doc = null;
    (_d = this.el) == null ? void 0 : _d.remove();
    this.el = null;
    this.nameInput = null;
    this.nameRow = null;
    this.createBtn = null;
    this.cancelSigilFlash();
    this.propertyPaint = null;
    this.propertyRange = null;
    this.releasePropertySubscription();
    this.closePicker();
  }
  /**
   * Idempotent: `renderInner()` and `destroy()` both call it unconditionally.
   * ONE field serves both pickers, so chaining icon into color cannot leave
   * two popovers open or drop the handle to the first.
   */
  closePicker() {
    var _a;
    (_a = this.pickerPopover) == null ? void 0 : _a.close();
    this.pickerPopover = null;
  }
  /**
   * The icon picker, opened from the button beside the name.
   *
   * Deliberately NOT chained into the color picker: auto-opening a second
   * popover the moment the first closed reads as jarring — the content
   * changing under the cursor is itself the jolt, however the box behaves.
   */
  openIconPickerFor(anchor) {
    this.closePicker();
    this.pickerPopover = openIconPicker(
      anchor,
      this.state.icon,
      async (icon) => {
        this.state = { ...this.state, icon };
        this.closePicker();
        this.renderInner();
      },
      // Below, for the theme button's reason and more so: this one sits in the
      // name row, so `above` would put the grid over the panel's title.
      "below"
    );
  }
  /**
   * The theme picker — the same color popover the space strip uses.
   *
   * Offered, never required: `validateForm` ignores color exactly as it
   * ignores the icon, so dismissing this keeps the rotating default.
   */
  openThemePicker(anchor) {
    this.closePicker();
    this.pickerPopover = openColorPicker({
      anchor,
      // Below: this button sits near the top of the pane, and above would put
      // the popover between it and the panel's title.
      placement: "below",
      current: this.state.color,
      customs: this.customColors,
      // Form state, like the icon: no space exists yet to write a color to.
      apply: async (color) => {
        this.state = { ...this.state, color };
        this.closePicker();
        this.renderInner();
      },
      // A custom color IS persisted: it belongs to the user's settings, not
      // to the space being created, so minting one and losing it when this
      // panel closes would be the surprising behaviour.
      saveCustoms: (customs) => {
        this.customColors = [...customs];
        return this.deps.saveCustomColors(customs);
      }
    });
  }
  /**
   * Draws the icon button for the current state: the chosen icon, or — while
   * `state.icon` is `""` — a placeholder.
   *
   * The placeholder is our own SVG rather than a Lucide id: every real icon
   * reads as a choice already made. Drawn in `currentColor` so the stylesheet
   * owns the color (no hardcoded values — see `styles.css`).
   */
  paintIconButton(btn) {
    const chosen = this.state.icon !== "";
    btn.classList.toggle("is-empty", !chosen);
    btn.setAttribute(
      "aria-label",
      chosen ? `Space icon: ${this.state.icon}. Choose a different one` : "Choose an icon"
    );
    if (chosen) {
      (0, import_obsidian9.setIcon)(btn, this.state.icon);
      const painted = iconColorFor(this.state.color, this.deps.useThemeIconColor());
      if (painted) btn.style.color = painted;
      else btn.style.removeProperty("color");
      return;
    }
    btn.style.removeProperty("color");
    const doc = btn.ownerDocument;
    const NS = "http://www.w3.org/2000/svg";
    const svg = doc.createElementNS(NS, "svg");
    svg.setAttribute("class", "svg-icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    for (const d of PLACEHOLDER_PATHS) {
      const path = doc.createElementNS(NS, "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }
    btn.replaceChildren(svg);
  }
  /**
   * Escape / Cancel / a successful Create all converge here. Public
   * so a `layout-change` handler can close the panel
   * without reaching for `destroy()`, which skips `onClose()` and would
   * leave `main.ts`'s own reference stale.
   */
  close() {
    this.destroy();
    this.deps.onClose();
  }
  /**
   * Wrapped once here, so every call site is covered. `renderInner` opens
   * with `el.replaceChildren()`, so an unguarded throw partway through leaves
   * an empty absolutely-positioned box with `inert` never unwound and Escape
   * unreachable — a covered, unusable tree with no way out.
   */
  render() {
    const focus = this.captureFocus();
    try {
      this.renderInner();
      this.restoreFocus(focus);
    } catch (e) {
      console.error(
        "Spaces: create-space panel failed to render; closing rather than leaving a stuck pane",
        e
      );
      try {
        this.close();
      } catch (closeError) {
        console.error("Spaces: onClose threw while closing a failed render", closeError);
      }
    }
  }
  /**
   * Every state mutation re-renders (`el.replaceChildren()` + full rebuild),
   * which drops focus to `this.doc.body` and would break an otherwise fully
   * keyboard-operable form. Focus is identified by the `data-focus-key`
   * stamped on every focusable control in `renderInner()` below — stable
   * ACROSS a re-render because it is a value, never node identity, since
   * every node is replaced. Returns `null` when focus is not inside the panel.
   */
  captureFocus() {
    var _a, _b;
    const active = (_a = this.doc) == null ? void 0 : _a.activeElement;
    if (!(active instanceof HTMLElement) || !((_b = this.el) == null ? void 0 : _b.contains(active))) return null;
    const key = active.dataset.focusKey;
    if (!key) return null;
    const isText = active.instanceOf(HTMLInputElement) && active.type === "text";
    return {
      key,
      selStart: isText ? active.selectionStart : null,
      selEnd: isText ? active.selectionEnd : null
    };
  }
  /**
   * Counterpart to `captureFocus()`. Looks up the freshly-rendered control
   * carrying the same `data-focus-key` (not a saved node reference — the old
   * one is gone) and refocuses it, restoring caret position for a text input.
   * A `key` with no match after the render is left alone.
   */
  restoreFocus(captured) {
    var _a;
    if (!captured || !this.el) return;
    for (const el of Array.from(this.el.querySelectorAll("[data-focus-key]"))) {
      if (el.dataset.focusKey !== captured.key) continue;
      el.focus();
      if (el.instanceOf(HTMLInputElement) && captured.selStart !== null) {
        el.setSelectionRange(captured.selStart, (_a = captured.selEnd) != null ? _a : captured.selStart);
      }
      return;
    }
  }
  renderInner() {
    this.vaultTree = null;
    this.cancelSigilFlash();
    const el = this.el;
    if (!el) return;
    const doc = el.ownerDocument;
    this.closePicker();
    el.replaceChildren();
    const title = doc.win.createDiv();
    title.className = "spaces-create-title";
    title.textContent = "Create a space";
    el.appendChild(title);
    const nameRow = doc.win.createDiv();
    nameRow.className = "spaces-create-row";
    const iconBtn = doc.win.createDiv();
    iconBtn.className = "spaces-create-iconbtn";
    iconBtn.setAttribute("role", "button");
    iconBtn.tabIndex = 0;
    iconBtn.dataset.focusKey = "icon";
    this.paintIconButton(iconBtn);
    const openPicker = () => this.openIconPickerFor(iconBtn);
    iconBtn.addEventListener("click", openPicker);
    iconBtn.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter" && ev.key !== " ") return;
      ev.preventDefault();
      openPicker();
    });
    nameRow.appendChild(iconBtn);
    const nameInput = doc.win.createEl("input");
    nameInput.type = "text";
    nameInput.className = "text-input spaces-create-name";
    nameInput.placeholder = "Space name\u2026";
    nameInput.value = this.state.name;
    nameInput.maxLength = MAX_SPACE_NAME_LENGTH;
    nameInput.dataset.focusKey = "name";
    nameInput.addEventListener("input", () => {
      this.state = { ...this.state, name: nameInput.value };
      this.clearFault("name");
      this.refreshCreateButton();
    });
    nameRow.appendChild(nameInput);
    el.appendChild(nameRow);
    this.nameRow = nameRow;
    this.nameInput = nameInput;
    const themeBtn = doc.win.createEl("button");
    themeBtn.className = "spaces-create-theme";
    themeBtn.type = "button";
    themeBtn.dataset.focusKey = "theme";
    const themeIcon = doc.win.createSpan();
    themeIcon.className = "spaces-create-theme-icon";
    (0, import_obsidian9.setIcon)(themeIcon, "brush");
    const themeLabel = doc.win.createSpan();
    themeLabel.textContent = "Choose icon color";
    themeBtn.appendChild(themeIcon);
    themeBtn.appendChild(themeLabel);
    themeBtn.setAttribute(
      "aria-label",
      `Choose icon color. Currently ${paletteNameOf(this.state.color)}`
    );
    themeBtn.addEventListener("click", () => this.openThemePicker(themeBtn));
    el.appendChild(themeBtn);
    const modes = doc.win.createDiv();
    modes.className = "spaces-create-modes";
    modes.setAttribute("role", "group");
    modes.setAttribute("aria-label", "What goes in this space");
    const modeBtn = (folderMode, label, icon) => {
      const btn = doc.win.createEl("button");
      btn.type = "button";
      btn.className = "spaces-create-mode";
      const active = this.state.folderMode === folderMode && (this.itemsOpen || modeHoldsChoice(this.state, folderMode));
      if (active) btn.classList.add("is-active");
      btn.setAttribute("aria-pressed", String(active));
      btn.dataset.focusKey = folderMode ? "mode-folder" : "mode-curate";
      const ic = doc.win.createSpan();
      ic.className = "spaces-create-theme-icon";
      (0, import_obsidian9.setIcon)(ic, icon);
      const text = doc.win.createSpan();
      text.textContent = label;
      btn.appendChild(ic);
      btn.appendChild(text);
      btn.addEventListener("click", () => {
        this.clearFault("root");
        if (this.itemsOpen && this.state.folderMode === folderMode) {
          this.itemsOpen = false;
          this.state = collapseMode(this.state, folderMode);
        } else {
          this.state = setFolderMode(this.state, folderMode);
          this.itemsOpen = true;
        }
        this.pickerMode = DEFAULT_PICKER_MODE;
        this.render();
      });
      return btn;
    };
    modes.appendChild(modeBtn(false, "Curated", "list-plus"));
    modes.appendChild(modeBtn(true, "Folder pinned", "folder"));
    el.appendChild(modes);
    if (this.itemsOpen) {
      const view = doc.win.createDiv();
      view.className = "spaces-create-items";
      this.pickerModeEls.clear();
      let bodies = null;
      if (!this.state.folderMode) {
        bodies = doc.win.createDiv();
        bodies.className = "spaces-create-bodies";
        bodies.setAttribute("role", "group");
        bodies.setAttribute("aria-label", "What the window below shows");
        bodies.appendChild(this.bodyBtn(doc, "items", "Vault", "folder-tree", ITEMS_SIGIL));
        bodies.appendChild(this.bodyBtn(doc, "tags", "Tags", "tag", TAG_SIGIL));
        bodies.appendChild(
          this.bodyBtn(doc, "properties", "Properties", "list", PROPERTY_SIGIL)
        );
      }
      const windowEl = doc.win.createDiv();
      windowEl.className = "spaces-create-tree";
      windowEl.tabIndex = -1;
      const filter = doc.win.createEl("input");
      filter.type = "text";
      filter.className = "text-input";
      filter.value = this.itemFilter;
      filter.dataset.focusKey = "item-filter";
      filter.addEventListener("input", () => {
        this.itemFilter = this.queryFrom(filter.value);
        this.renderPickerBody();
      });
      filter.addEventListener("keydown", (e) => {
        if (this.state.folderMode) return;
        const mode = readModeSigil({
          box: filter.value,
          key: e.key,
          modified: e.ctrlKey || e.metaKey || e.altKey,
          composing: e.isComposing
        });
        if (mode === null) return;
        this.startSigilFlash(e.key);
        this.setPickerMode(mode);
      });
      this.filterEl = filter;
      view.appendChild(filter);
      if (bodies) view.appendChild(bodies);
      const rowsEl = doc.win.createDiv();
      const scroll = doc.win.createDiv();
      scroll.className = "spaces-create-tree-scroll";
      scroll.addEventListener("scroll", () => this.onPickerScroll(), { passive: true });
      scroll.appendChild(rowsEl);
      windowEl.appendChild(scroll);
      this.treeEl = rowsEl;
      const summary = doc.win.createDiv();
      summary.className = "spaces-create-summary";
      summary.setAttribute("role", "status");
      windowEl.appendChild(summary);
      this.summaryEl = summary;
      view.appendChild(windowEl);
      el.appendChild(view);
      this.renderPlaceholder();
      this.renderSummary();
      this.renderPickerBody(true);
    } else {
      this.treeEl = null;
      this.propertyPaint = null;
      this.propertyRange = null;
      this.summaryEl = null;
      this.filterEl = null;
      this.pickerModeEls.clear();
    }
    this.syncPropertySubscription();
    const actions = doc.win.createDiv();
    actions.className = "spaces-create-actions";
    const createBtn = doc.win.createEl("button");
    createBtn.className = "mod-cta";
    createBtn.textContent = this.submitting ? "Creating\u2026" : "Create space";
    createBtn.disabled = this.submitting;
    createBtn.dataset.focusKey = "create";
    createBtn.addEventListener("click", () => void this.handleSubmit());
    actions.appendChild(createBtn);
    this.createBtn = createBtn;
    const cancelBtn = doc.win.createEl("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.dataset.focusKey = "cancel";
    cancelBtn.addEventListener("click", () => this.close());
    actions.appendChild(cancelBtn);
    el.appendChild(actions);
    this.alignToRibbon();
    this.paintFault();
  }
  /**
   * Draws whichever body the buttons above the window ask for, in place.
   *
   * The sole redraw entry for all three bodies. Separate from `renderInner()`
   * because filtering, expanding and picking must not rebuild the whole panel:
   * a full re-render would drop focus out of the filter field on every
   * keystroke.
   *
   * Which body that is lives in `readPickerBody`, not here, so the rule can be
   * read and tested without a DOM rather than inferred from the panel that
   * happens to be this prototype's drawing.
   *
   * Folder mode never reaches the tag body: a folder space is a window onto
   * one root, and a tag is not one, so that mode draws neither button and the
   * sigils do nothing there.
   *
   * `revealSelection` is for the draw that builds the window and no other.
   * Every later draw (filtering, expanding, picking) redraws rows the user is
   * already looking at, and moving the box there throws away their place. The
   * tag body ignores it: only the notes-and-folders body is ever built around
   * a selection made before the window opened.
   */
  renderPickerBody(revealSelection = false) {
    const host = this.treeEl;
    if (!host) return;
    this.setEmptyMessage(host, null);
    this.propertyPaint = null;
    this.propertyRange = null;
    const body = readPickerBody(this.pickerMode, this.state.folderMode);
    if (body === "tags") {
      this.renderTagBody(host, this.itemFilter);
      return;
    }
    if (body === "properties") {
      this.renderPropertyBody(host);
      return;
    }
    this.renderItemBody(host, revealSelection);
  }
  /**
   * Shows, replaces or removes the picker's empty-state message.
   *
   * It is a sibling of `host`, not a child. `host` is the `role="tree"` box, and
   * a child of a tree that is not a treeitem is reported by assistive tech as a
   * stray node in a tree it does not belong to. The message sits right after the
   * tree, inside the same scrolling list, so it reads and scrolls where the
   * rows would have been. At most one exists: any earlier one is removed first.
   * Pass null to remove it.
   */
  setEmptyMessage(host, text) {
    var _a;
    (_a = host.parentElement) == null ? void 0 : _a.querySelectorAll(":scope > .spaces-create-tree-empty").forEach((el) => el.remove());
    if (text === null) return;
    const empty = host.ownerDocument.win.createDiv();
    empty.className = "spaces-create-tree-empty";
    empty.textContent = text;
    host.after(empty);
  }
  /**
   * Redraw the current body and put focus back on the row it was on.
   *
   * Every redraw calls `host.replaceChildren()`, which destroys the focused
   * element, so without this a keyboard pick dropped focus to `<body>` and
   * lost the user's place in a two-hundred-row tree. Expanding restored it and
   * picking did not, each body having written its own restore in one handler
   * and not the other; both now come through here.
   *
   * `focusKey` names the row to refocus. Left out, it is whichever row holds
   * focus now, which is what a caret click wants: a pointer gesture should not
   * move focus, and nothing is refocused when focus was not on a row.
   */
  redrawKeepingFocus(focusKey) {
    var _a, _b;
    const key = focusKey != null ? focusKey : this.focusedRowKey();
    this.renderPickerBody();
    if (key === void 0) return;
    const attr = readPickerBody(this.pickerMode, this.state.folderMode) === "tags" ? "tag" : "path";
    (_b = (_a = this.treeEl) == null ? void 0 : _a.querySelector(`[data-${attr}="${CSS.escape(key)}"]`)) == null ? void 0 : _b.focus();
  }
  /** The key of the picker row holding focus, or undefined when none does. */
  focusedRowKey() {
    var _a, _b, _c;
    const active = (_a = this.doc) == null ? void 0 : _a.activeElement;
    if (!active || !((_b = this.treeEl) == null ? void 0 : _b.contains(active)) || !active.instanceOf(HTMLElement)) return void 0;
    return (_c = active.dataset.path) != null ? _c : active.dataset.tag;
  }
  /**
   * The notes-and-folders body.
   *
   * Everything specific to it is here: the vault tree, what counts as
   * selected in each mode, what a covered row is covered by, and what picking
   * does. The rows themselves are `renderTreeRow`'s.
   */
  renderItemBody(host, revealSelection) {
    var _a;
    const doc = host.ownerDocument;
    host.setAttribute("role", "tree");
    if (this.state.folderMode) host.removeAttribute("aria-multiselectable");
    else host.setAttribute("aria-multiselectable", "true");
    host.setAttribute(
      "aria-label",
      this.state.folderMode ? "Choose a folder" : "Choose notes and folders"
    );
    const src = this.deps.folders;
    const tree = (_a = this.vaultTree) != null ? _a : this.vaultTree = buildVaultTree(
      src.allPaths().map((path) => ({ path, kind: src.kindOf(path) })).filter((e) => e.kind !== null),
      "folder",
      isBranchByKind
    );
    const selected = this.state.folderMode ? new Set(this.state.root === "" ? [] : [this.state.root]) : new Set(this.state.items.flatMap((i) => i.kind === "file" || i.kind === "folder" ? [i.path] : []));
    const rows = visibleRows(tree, {
      expanded: this.expandedFolders,
      filter: this.itemFilter,
      selected,
      onlyKind: this.state.folderMode ? "folder" : null,
      budget: MAX_PICKER_ROWS
    });
    const coveringFolders = this.state.folderMode ? null : memberFolderSet(this.state.items, this.deps.vaultIndex());
    host.replaceChildren();
    if (rows.length === 0) {
      this.setEmptyMessage(
        host,
        this.itemFilter.trim() === "" ? "Nothing in this vault yet" : "No match"
      );
      return;
    }
    this.renderTreeRow(host, rows, {
      datasetKey: "path",
      expanded: this.expandedFolders,
      markRow: (el, row) => {
        el.dataset.kind = row.kind;
      },
      // Everything under a selected folder is already in the space, at every
      // depth, and the folder is the row directly above its children, so the
      // mark states a fact about the tree on screen.
      //
      // Tags are deliberately not shown here. A tag is a rule that matches notes
      // scattered across the vault, not a position in the tree, so marking them
      // would mark a scattered majority of rows at a broad tag and leave no way to
      // tell why a given row was marked. Tags mode lists the selected tags with
      // their counts, and the summary row counts every note the selection
      // resolves to.
      coveredBy: (row) => coveringFolders === null ? null : coveringFolderIn(coveringFolders, row.path),
      coveredTitle: (by) => `Already included by the selected folder ${by}. Deselect that folder to pick notes and folders under it one at a time.`,
      filterActive: () => this.itemFilter.trim() !== "",
      budgetClosedTitle: () => "There is no room to show what is inside this folder. " + (this.itemFilter.trim() !== "" ? "Narrow the filter to make room." : "Type in the filter to find what is inside."),
      drawName: (el, row) => {
        const icon = doc.win.createSpan();
        icon.className = "spaces-create-tree-icon";
        (0, import_obsidian9.setIcon)(icon, row.kind === "folder" ? "folder" : "file");
        el.appendChild(icon);
        const label = doc.win.createSpan();
        label.className = "spaces-create-tree-name";
        label.textContent = row.name;
        el.appendChild(label);
      },
      choose: (row) => {
        if (this.state.folderMode) {
          this.state = setRoot(this.state, this.state.root === row.path ? "" : row.path);
        } else {
          this.state = toggleItem(this.state, { path: row.path, kind: row.kind });
        }
      }
    });
    if (revealSelection) {
      const selectedEl = host.querySelector(".is-selected");
      if (selectedEl instanceof HTMLElement) selectedEl.scrollIntoView({ block: "nearest" });
    }
  }
  /**
   * Draws one tree body's rows into `host` (Vault or Tags, not Properties).
   * The adapter is the only difference between those two bodies.
   *
   * Everything a row is lives here once: the overflow row, the mark classes,
   * the ARIA state, the caret, the keyboard split and the redraw after a pick,
   * so a fix to any of them is made in one place. What the adapter supplies is
   * what genuinely differs: the key a row is found by, what covers it, the
   * wording of its titles, the name cell, and what picking changes in state.
   * Each adapter closes over what its own draw built (the covering set, the tag
   * counts, the query). It also reaches panel state that outlives a draw:
   * `expanded`, which a caret and the arrow keys edit, and `this.state`, which
   * both bodies read and `choose` writes. The item body also reads
   * `this.itemFilter`.
   */
  renderTreeRow(host, rows, adapter) {
    var _a, _b;
    const doc = host.ownerDocument;
    const frag = doc.win.createFragment();
    for (const row of rows) {
      if (isOverflowRow(row)) {
        const el2 = doc.win.createDiv();
        el2.className = "spaces-create-tree-row is-overflow";
        el2.setAttribute("role", "treeitem");
        el2.setAttribute("aria-disabled", "true");
        el2.setAttribute("aria-selected", "false");
        el2.style.paddingLeft = `${row.depth * 14}px`;
        const count = row.hidden === 1 ? "1 more" : `${row.hidden.toLocaleString()} more`;
        const it = row.hidden === 1 ? "it" : "them";
        el2.textContent = adapter.filterActive() ? `${count}, narrow the filter to see ${it}` : `${count}, type in the filter to find ${it}`;
        frag.appendChild(el2);
        continue;
      }
      const el = doc.win.createDiv();
      el.className = `spaces-create-tree-row${adapter.rowClass === void 0 ? "" : ` ${adapter.rowClass}`}`;
      el.setAttribute("role", "treeitem");
      el.tabIndex = 0;
      el.dataset[adapter.datasetKey] = row.path;
      (_a = adapter.markRow) == null ? void 0 : _a.call(adapter, el, row);
      el.style.paddingLeft = `${row.depth * 14}px`;
      el.classList.toggle("is-selected", row.selected);
      el.setAttribute("aria-selected", String(row.selected));
      if (row.hasChildren && !row.budgetClosed) el.setAttribute("aria-expanded", String(row.expanded));
      const covered = row.selected ? null : adapter.coveredBy(row);
      el.classList.toggle("is-inherited", covered !== null);
      if (covered !== null) {
        el.setAttribute("aria-disabled", "true");
        el.setAttribute("title", adapter.coveredTitle(covered));
      } else if (row.selected && adapter.selectedTitle) {
        el.setAttribute("title", adapter.selectedTitle(row));
      }
      if (row.budgetClosed) {
        const why = adapter.budgetClosedTitle();
        el.title = el.title === "" ? why : `${el.title} ${why}`;
      }
      const setExpanded = (open, refocus) => {
        if (!row.hasChildren || row.budgetClosed) return;
        if (open) adapter.expanded.add(row.path);
        else adapter.expanded.delete(row.path);
        this.redrawKeepingFocus(refocus ? row.path : void 0);
      };
      const caret = doc.win.createSpan();
      caret.className = "spaces-create-tree-caret";
      if (row.hasChildren && !row.budgetClosed) {
        (0, import_obsidian9.setIcon)(caret, row.expanded ? "chevron-down" : "chevron-right");
        caret.setAttribute("aria-hidden", "true");
        caret.addEventListener("click", (e) => {
          e.stopPropagation();
          setExpanded(!adapter.expanded.has(row.path), false);
        });
      }
      el.appendChild(caret);
      adapter.drawName(el, row);
      (_b = adapter.decorate) == null ? void 0 : _b.call(adapter, el, row);
      const choose = () => {
        if (covered !== null) return;
        adapter.choose(row);
        this.clearFault("root");
        this.renderSummary();
        this.redrawKeepingFocus(row.path);
        this.refreshCreateButton();
      };
      el.addEventListener("click", choose);
      el.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          if (!row.hasChildren || row.budgetClosed) return;
          e.preventDefault();
          setExpanded(e.key === "ArrowRight", true);
          return;
        }
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        choose();
      });
      frag.appendChild(el);
    }
    host.appendChild(frag);
    markJoinedRows(host);
  }
  /**
   * The tags this space currently holds, folded to the spelling the tag tree's
   * rows are keyed on.
   *
   * Folder mode reports none. It keeps `items` so switching back costs nothing
   * (`setFolderMode`), but `toCreateOptions` submits the root alone, so
   * showing them would advertise members the space will not have.
   *
   * A set rather than the list it was: order said something when the tag body
   * was a list in the order they were chosen, and the tree draws them where
   * they belong instead.
   */
  chosenTags() {
    if (this.state.folderMode) return /* @__PURE__ */ new Set();
    return memberTagSet(this.state.items);
  }
  /**
   * One of the buttons that choose what the window below them shows.
   *
   * They are new furniture in a pane that was kept bare on purpose, and that
   * is the point: a corner icon and a typed sigil both ask the user to already
   * know the other bodies are there. Labelled buttons say it.
   *
   * `aria-pressed` rather than a radio group or a tablist: the pair beside
   * them, Curated and Folder pinned, is already a pressed-button pair in this
   * panel, and one idiom for two segmented pairs on one pane is what makes
   * them read as the same kind of control.
   *
   * The title names the shortcut, which is the only place the shortcut is
   * written down now that the placeholder is about filtering again.
   */
  bodyBtn(doc, mode, label, icon, sigil) {
    const btn = doc.win.createEl("button");
    btn.type = "button";
    btn.className = "spaces-create-body";
    btn.dataset.focusKey = `body-${mode}`;
    btn.title = `${label}. Type ${sigil} in an empty filter box.`;
    const ic = doc.win.createSpan();
    ic.className = "spaces-create-theme-icon";
    (0, import_obsidian9.setIcon)(ic, icon);
    const text = doc.win.createSpan();
    text.className = "spaces-create-body-label";
    text.textContent = label;
    btn.appendChild(ic);
    btn.appendChild(text);
    btn.addEventListener("click", () => {
      this.setPickerMode(mode);
    });
    this.pickerModeEls.set(mode, btn);
    this.paintPickerModes();
    return btn;
  }
  /**
   * What a box showing a flashing sigil is actually asking for.
   *
   * Stripping the sigil here rather than from the box is the whole trick: the
   * list narrows by the real query from the first character typed after the
   * sigil, while the box goes on showing the sigil until the flash ends.
   */
  queryFrom(value) {
    const sigil = this.sigilFlash;
    if (sigil === null || !value.startsWith(sigil)) return value;
    return value.slice(sigil.length);
  }
  /** Starts the sigil showing, and arms the one thing that takes it back. */
  startSigilFlash(sigil) {
    var _a, _b;
    this.cancelSigilFlash();
    this.sigilFlash = sigil;
    const win = (_b = (_a = this.doc) == null ? void 0 : _a.win) != null ? _b : window;
    const handle = win.setTimeout(() => this.endSigilFlash(), SIGIL_FLASH_MS);
    this.sigilFlashOff = () => win.clearTimeout(handle);
  }
  /**
   * Takes the sigil out of the box, and nothing else.
   *
   * Exactly one character, matched against the one that was put there, and
   * only while the box still starts with it. Someone who backspaced it, or
   * selected the lot and typed over it, has already dealt with it; removing a
   * character anyway would eat the first letter of what they typed instead.
   *
   * The caret moves back by what was removed, so a flash that ends mid-word
   * leaves the user typing where they were rather than one place to the right.
   * `itemFilter` is untouched: it has been sigil-free since the keystroke
   * landed, so only the box changes and the list does not redraw.
   */
  endSigilFlash() {
    const sigil = this.sigilFlash;
    this.cancelSigilFlash();
    const filter = this.filterEl;
    if (sigil === null || !filter || !filter.value.startsWith(sigil)) return;
    const caret = filter.selectionStart;
    filter.value = filter.value.slice(sigil.length);
    const at = caret === null ? filter.value.length : Math.max(0, caret - sigil.length);
    filter.setSelectionRange(at, at);
  }
  /** Drops a pending flash without touching the box. Idempotent. */
  cancelSigilFlash() {
    var _a;
    (_a = this.sigilFlashOff) == null ? void 0 : _a.call(this);
    this.sigilFlashOff = null;
    this.sigilFlash = null;
  }
  /**
   * Switches the window over, from either door.
   *
   * The filter text is left exactly as it is. The box narrows whichever body
   * is on screen, so text in it is a query the user wrote and not a thing the
   * old body owned; clearing it would make the buttons destructive, and a
   * button that loses work is a button people stop pressing.
   *
   * Redrawn in place rather than through `render()`, so switching does not
   * rebuild the pane under the pointer or take focus off the filter box the
   * sigil was typed into.
   */
  setPickerMode(mode) {
    this.pickerMode = mode;
    this.paintPickerModes();
    this.renderPlaceholder();
    this.renderPickerBody();
    this.syncPropertySubscription();
  }
  /** Marks the button whose body is on screen, for the eye and for ARIA. */
  paintPickerModes() {
    for (const [mode, btn] of this.pickerModeEls) {
      const active = mode === this.pickerMode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    }
  }
  /**
   * What the filter box says it will filter.
   *
   * It names the body on screen rather than the sigil, which the buttons now
   * teach by being visible. Folder mode gets its own words, as it always has.
   */
  renderPlaceholder() {
    const filter = this.filterEl;
    if (!filter) return;
    if (this.state.folderMode) {
      filter.placeholder = "Filter folders\u2026";
      return;
    }
    filter.placeholder = this.pickerMode === "tags" ? "Filter tags\u2026" : this.pickerMode === "properties" ? "Filter properties\u2026" : "Filter notes and folders\u2026";
  }
  /**
   * The row pinned under the window's list: what this space holds so far.
   *
   * It is what makes the bodies one picker. A tag chosen in Tags mode has
   * no row to mark in the tree, a note chosen in the tree has none in the
   * tag list, and a property has no row in either, so without this the window could only ever report half of what
   * was picked. Counting both in one line also keeps it to one line, which is
   * what the row of chips above the window failed at.
   *
   * Folder mode reports its root, by the same count. The mode holds one folder
   * or none, and `toCreateOptions` submits the root alone, so reporting the
   * curated items it is still carrying would advertise members the space will
   * not have.
   *
   * Redrawn in place rather than through `render()`, so picking does not
   * rebuild the window under the pointer that just clicked inside it.
   */
  renderSummary() {
    const host = this.summaryEl;
    if (!host) return;
    const picked = this.pickedMembers();
    const counts = countPicked(picked);
    const notes = this.deps.preview(picked).notes;
    const summary = pickedSummary(counts, notes);
    host.textContent = summary;
  }
  /**
   * What the summary row is reporting on: the curated members, or a folder
   * space's root alone.
   *
   * Expressed as members rather than as counts so the root is resolved by
   * exactly the rule a curated folder member is, and so both shapes reach
   * `deps.preview` as the one thing it takes.
   */
  pickedMembers() {
    if (!this.state.folderMode) return this.state.items;
    return this.state.root === "" ? [] : [{ kind: "folder", path: this.state.root }];
  }
  /**
   * Starts listening for property changes while the PROPERTIES body is
   * showing, and nothing is yet.
   *
   * The body, not the picker window. Subscribing for the whole window made
   * `metadataNotifyRoute` answer `"picker-flush"` rather than `"none"` for a
   * vault with no property member whose user happened to have the panel open
   * on Vault or Tags, so every save cost a coalescer submit and a flush whose
   * only action was a notify that this handler then threw away. Nothing goes
   * stale by waiting: switching bodies redraws, and the Properties body reads
   * the accessor on every draw.
   *
   * Called from `render` (after the window is built or dropped) and from
   * `setPickerMode`, which redraws in place without a render.
   */
  syncPropertySubscription() {
    if (!this.itemsOpen || readPickerBody(this.pickerMode, this.state.folderMode) !== "properties") {
      this.releasePropertySubscription();
      return;
    }
    if (this.propertySub !== null) return;
    const sub = { release: () => void 0 };
    this.propertySub = sub;
    sub.release = this.deps.subscribePropertyRefresh(() => {
      if (this.propertySub !== sub) return;
      this.onPropertiesChanged();
    });
  }
  /** Stops listening. Idempotent: `destroy()` and every closed-picker render call it. */
  releasePropertySubscription() {
    const sub = this.propertySub;
    this.propertySub = null;
    sub == null ? void 0 : sub.release();
  }
  /**
   * The snapshot was replaced. Only the Properties body reads it, so any
   * other body has nothing to redraw; the next draw of this one asks again.
   *
   * The SUMMARY ROW goes with it, FOR A SELECTION THIS SNAPSHOT CAN MOVE.
   * Redrawing the body alone left the per-key counts reading from the new
   * snapshot while the "… N notes" line pinned under them still showed the
   * figure computed at the last pick: two numbers on one screen from two
   * different pictures. But this handler runs at NOTIFICATION cadence, about
   * four times a second through a sync, and the summary costs a
   * `deps.preview`, which is the engine resolving the whole selection over the
   * vault: a price written for the once-per-pick it used to be paid at.
   *
   * A selection holding no property member is not part of the picture this
   * snapshot changes. Its figure comes from folders and tags, the rows beside
   * it carry no count drawn from it, and there is nothing for it to disagree
   * with, so it keeps the figure its pick computed — which is what it did
   * before — and pays the preview again at the next pick. A selection that
   * DOES hold one is the case the paragraph above is about, and is redrawn.
   */
  onPropertiesChanged() {
    if (this.el === null || this.treeEl === null) return;
    if (readPickerBody(this.pickerMode, this.state.folderMode) !== "properties") return;
    if (this.pickedMembers().some((m) => m.kind === "property")) this.renderSummary();
    this.redrawProperties();
  }
  /**
   * Redraws the Properties body and puts focus back on the control that held
   * it.
   *
   * WINDOWING MAKES THIS SHARPER: a control that is not drawn cannot be
   * focused, and a redraw draws only the rows the scroller is showing. The
   * control that held focus is almost always among them — it is the one the
   * user just clicked, or the one the keyboard is on, and the browser keeps a
   * focused control in view — but a redraw raised by the vault changing can
   * land while it is not. So when the first pass does not find it, the window
   * is moved to it and it is looked for again.
   *
   * THE THIRD CASE IS A CONTROL THAT NO LONGER EXISTS, which is the one this
   * method used to answer by returning silently and leaving focus on `<body>`:
   * `renderPickerBody` had already destroyed the row, and a key or value can
   * genuinely stop existing between two draws when the last note holding it is
   * deleted or edited during a sync. It falls back to the picker window, the
   * same place `onPickerScroll` uses and the same place `showFault` focuses,
   * so a keyboard user is left in the panel rather than at the top of the
   * document. Focus does not land on `<body>` in any of the three.
   */
  redrawProperties(focusControl) {
    var _a, _b;
    const host = this.treeEl;
    if (!host) return;
    const active = (_a = this.doc) == null ? void 0 : _a.activeElement;
    const control = focusControl != null ? focusControl : active && host.contains(active) && active.instanceOf(HTMLElement) ? active.dataset.control : void 0;
    this.renderPickerBody();
    if (control === void 0) return;
    if (this.focusControl(host, control)) return;
    (_b = this.propertyPaint) == null ? void 0 : _b.call(this, control);
    if (this.focusControl(host, control)) return;
    this.focusPickerWindow(host);
  }
  /**
   * Focus of last resort: the picker window itself.
   *
   * It is focusable for exactly this kind of reason — `showFault` marks it and
   * focuses it — so sequential Tab continues from the list rather than from
   * the top of the document. `preventScroll`, because every caller reaches
   * here after the row that was focused has gone, and scrolling the pane to
   * the box the user is already looking at is movement with nothing behind it.
   */
  focusPickerWindow(host) {
    const windowEl = host.closest(".spaces-create-tree");
    windowEl == null ? void 0 : windowEl.focus({ preventScroll: true });
  }
  /** The named control, if this draw built it. */
  findControl(host, control) {
    for (const el of Array.from(host.querySelectorAll("[data-control]"))) {
      if (el.dataset.control === control) return el;
    }
    return null;
  }
  /**
   * Focuses the named control if this draw built it, and says whether it did.
   */
  focusControl(host, control) {
    const el = this.findControl(host, control);
    if (el === null) return false;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "nearest" });
    return true;
  }
  /**
   * The properties body: every key the vault holds, each openable to its
   * values.
   *
   * Opening and choosing are different controls on purpose, and the OPENER is
   * the caret. A key row's disclosure button only expands, so a person can
   * look inside a key without choosing it; everywhere else on the row picks
   * the existence member, and a value row picks its value member anywhere on
   * itself. That is the Vault and Tags bodies' own contract: the row carries
   * `cursor: pointer` and a row-wide hover from `.spaces-create-tree-row`, so
   * a row that took a click on one button inside it was advertising a target
   * it did not have.
   *
   * The "Has property" button stays, as the explicitly labelled control a
   * screen reader and the keyboard reach, but it is now one way in rather than
   * the only one. Every control inside a row that means something other than
   * "pick this row" stops the click from reaching the row, which leaves the
   * caret as the one thing that can be clicked without choosing.
   *
   * Keys are listed from the index, which is cheap. A key's values are asked
   * for only while that key is open: drawing the body lists NO values, and the
   * filter does not read a CLOSED key's values for the same reason. Not split
   * on `/`, unlike the tag tree: keys and values do not nest, so a value with
   * a slash in it is one row.
   *
   * THE FILTER NARROWS AN OPEN KEY'S VALUES TOO, and an open key whose own
   * name does not match is kept as long as one of its values does. Without
   * that, a key with more values than `MAX_PICKER_ROWS` had no way to reach
   * value 201 at all: the cap decided which values existed for the user, and
   * on this branch's own 5,000-note fixture `created` holds about 4,035, so
   * roughly 95% of them could not be picked. Typing a value must reach the
   * value, not close the key it lives in. The cap stays as it is; 4,035 rows
   * is unusable at any number, and the overflow row now says what to do.
   *
   * The deferral argument holds for a CLOSED key, whose buckets would have to
   * be built to match a value, and not for an OPEN one, whose buckets are
   * already built and whose value list is memoized by the index. So the work
   * added per keystroke is one linear pass over an array that already exists,
   * per open key: no sort, no copy, no second list. `valueQuery` is computed
   * once per draw rather than once per row, and the draw loop counts the
   * matches it skips instead of materializing them.
   *
   * The counts on these rows are the raw bucket: distinct notes whose
   * frontmatter matches, before any space's exclusions and before the global
   * ignore. A row here is choosing a property, not previewing a space. The
   * member row in a space's contents counts after exclusions.
   *
   * THE TWO ORDERS IN THIS LIST ARE DIFFERENT ON PURPOSE. Key rows are in
   * name order (`pickableKeys`), because someone scanning for a property they
   * know by name is better served by a stable order than by counts that shift
   * as notes change, and the filter box narrows keys by name so the two agree.
   * Value rows are in count order (`listValues`), because a key's values are
   * unknown until it is opened and only the first `MAX_PICKER_ROWS` are drawn
   * — so busiest-first is what decides which values a person sees FIRST, and
   * name order would hide the common ones behind the rare. That order is the
   * index's memo and the filter does not disturb it: narrowing drops rows, it
   * never reorders them.
   *
   * **IT BUILDS ONLY THE ROWS ON SCREEN.** Measured in a real Obsidian on a
   * 5,000-note vault: opening `created`, which holds 4,035 distinct values,
   * built 206 rows and 836 elements for a 344 px viewport that shows about 14
   * of them, and cost 60 to 90 ms — four to six frames — of which 85% was the
   * browser's own style recalc and layout, strictly linear in the row count. A
   * keystroke in the filter box with that key open cost the same again, every
   * character, because this method begins by replacing every child. So the
   * draw is in two halves now: a PLAN of what every row would be, which is
   * cheap and complete, and a PAINT of the handful the scroller is showing,
   * with a spacer standing in for the height of the rest. Scrolling repaints;
   * nothing else about the body changes.
   *
   * What that costs elsewhere, said here rather than discovered later: only
   * rendered controls are in the tab order, the disclosure no longer
   * enumerates the rows it reveals, and a redraw has to move the window back
   * to a focused control that is off it (see `redrawProperties`).
   */
  renderPropertyBody(host) {
    const doc = host.ownerDocument;
    host.setAttribute("role", "list");
    host.removeAttribute("aria-multiselectable");
    host.setAttribute("aria-label", "Choose a property");
    host.replaceChildren();
    const message = (text) => this.setEmptyMessage(host, text);
    const index = this.deps.properties();
    if (index === null) {
      message("Loading this vault's properties\u2026");
      return;
    }
    const query = valueQuery(this.itemFilter);
    const keys = pickableKeys(
      index.listKeys(),
      this.itemFilter,
      (key) => this.expandedProperties.has(key) && index.listValues(key).some((v) => valueMatches(v, query))
    );
    if (keys.length === 0) {
      message(
        this.itemFilter.trim() === "" ? "No properties in this vault yet" : "No matching property"
      );
      return;
    }
    const held = this.state.folderMode ? [] : this.state.items;
    const heldIds = new Set(held.map(memberIdentity));
    const plan = [];
    for (const { key, count } of keys.slice(0, MAX_PICKER_ROWS)) {
      const keyMember = existsMember(key);
      const id = memberIdentity(keyMember);
      const open = this.expandedProperties.has(key);
      plan.push({ kind: "key", key, count, open, member: keyMember, id, held: heldIds.has(id) });
      if (!open) continue;
      const values = index.listValues(key);
      let matched = 0;
      let drawn = 0;
      for (const v of values) {
        if (!valueMatches(v, query)) continue;
        matched += 1;
        if (drawn >= MAX_PICKER_ROWS) continue;
        drawn += 1;
        const member = equalsMember(key, v.value);
        const valueId = memberIdentity(member);
        plan.push({
          kind: "value",
          key,
          value: v.value,
          count: v.count,
          member,
          id: valueId,
          held: heldIds.has(valueId)
        });
      }
      if (matched === 0) {
        plan.push({
          kind: "note",
          text: values.length === 0 ? "No values to pick" : "No matching value"
        });
      }
      if (matched > drawn) {
        plan.push({ kind: "overflow", depth: 1, hidden: matched - drawn });
      }
    }
    if (keys.length > MAX_PICKER_ROWS) {
      plan.push({ kind: "overflow", depth: 0, hidden: keys.length - MAX_PICKER_ROWS });
    }
    const row = (depth, extra) => {
      const el = doc.win.createDiv();
      el.className = `spaces-create-tree-row spaces-create-property-row ${extra}`.trim();
      el.setAttribute("role", "listitem");
      el.style.paddingLeft = `${depth * 14}px`;
      return el;
    };
    const countSpan = (n) => {
      const count = doc.win.createSpan();
      count.className = "spaces-create-tag-count";
      count.textContent = tagCountLabel(n);
      return count;
    };
    const pick = (member, focusControl) => {
      this.state = toggleItem(this.state, member);
      this.clearFault("root");
      this.renderSummary();
      this.redrawProperties(focusControl);
      this.refreshCreateButton();
    };
    const spacer = (height) => {
      const el = doc.win.createDiv();
      el.className = "spaces-create-tree-spacer";
      el.setAttribute("role", "presentation");
      el.setAttribute("aria-hidden", "true");
      el.style.height = `${height}px`;
      return el;
    };
    const keyRow = (entry) => {
      const el = row(0, entry.held ? "is-selected" : "");
      el.dataset.propertyKey = entry.key;
      el.addEventListener("click", () => pick(entry.member, `select:${entry.id}`));
      const disclose = doc.win.createEl("button");
      disclose.type = "button";
      disclose.className = "spaces-create-tree-caret spaces-create-property-disclose";
      disclose.dataset.control = `expand:${entry.id}`;
      disclose.setAttribute("aria-expanded", String(entry.open));
      disclose.setAttribute("aria-label", `${entry.open ? "Hide" : "Show"} values of ${entry.key}`);
      (0, import_obsidian9.setIcon)(disclose, entry.open ? "chevron-down" : "chevron-right");
      disclose.addEventListener("click", (e) => {
        e.stopPropagation();
        if (entry.open) this.expandedProperties.delete(entry.key);
        else this.expandedProperties.add(entry.key);
        this.redrawProperties(`expand:${entry.id}`);
      });
      el.appendChild(disclose);
      const name = doc.win.createSpan();
      name.className = "spaces-create-tree-name";
      name.textContent = entry.key;
      el.appendChild(name);
      el.appendChild(countSpan(entry.count));
      const select = doc.win.createEl("button");
      select.type = "button";
      select.className = "spaces-create-property-select";
      select.dataset.control = `select:${entry.id}`;
      select.textContent = "Has property";
      select.setAttribute("aria-label", `Has property ${entry.key}`);
      select.setAttribute("aria-pressed", String(entry.held));
      if (entry.held) el.title = `Remove ${entry.key}`;
      select.addEventListener("click", (e) => {
        e.stopPropagation();
        pick(entry.member, `select:${entry.id}`);
      });
      el.appendChild(select);
      return el;
    };
    const valueRow = (entry) => {
      const vr = row(1, entry.held ? "is-selected" : "");
      vr.addEventListener("click", () => pick(entry.member, `select:${entry.id}`));
      const btn = doc.win.createEl("button");
      btn.type = "button";
      btn.className = "spaces-create-property-value";
      btn.dataset.control = `select:${entry.id}`;
      btn.setAttribute("aria-pressed", String(entry.held));
      btn.setAttribute(
        "aria-label",
        `${entry.key} equals ${valueLabel(entry.value)}, ${tagCountLabel(entry.count)}`
      );
      if (entry.held) vr.title = `Remove ${entry.key}: ${valueLabel(entry.value)}`;
      const label = doc.win.createSpan();
      label.className = "spaces-create-tree-name";
      label.classList.toggle("is-empty-label", entry.value.trim() === "");
      label.textContent = valueLabel(entry.value);
      btn.appendChild(label);
      btn.appendChild(countSpan(entry.count));
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        pick(entry.member, `select:${entry.id}`);
      });
      vr.appendChild(btn);
      return vr;
    };
    const buildRow = (entry, at) => {
      const el = entry.kind === "key" ? keyRow(entry) : entry.kind === "value" ? valueRow(entry) : entry.kind === "note" ? (() => {
        const none = row(1, "is-note");
        none.textContent = entry.text;
        return none;
      })() : (() => {
        const more = row(entry.depth, "is-overflow");
        more.setAttribute("aria-disabled", "true");
        more.textContent = `${entry.hidden === 1 ? "1 more" : `${entry.hidden.toLocaleString()} more`}, narrow the filter to see them`;
        return more;
      })();
      el.setAttribute("aria-setsize", String(plan.length));
      el.setAttribute("aria-posinset", String(at + 1));
      return el;
    };
    const paint = (anchor, measure = false) => {
      const metrics = {
        ...this.pickerViewport(host),
        count: plan.length,
        overscan: PICKER_OVERSCAN
      };
      let range = visibleRange(metrics);
      if (anchor !== void 0) {
        const at = plan.findIndex((entry) => planOwnsControl(entry, anchor));
        if (at >= 0) range = windowCovering(at, metrics);
      }
      const drawn = this.propertyRange;
      if (drawn !== null && drawn.first === range.first && drawn.last === range.last) return;
      const frag = doc.win.createFragment();
      const above = spacerHeight(range.first, metrics.rowHeight);
      if (above > 0) frag.appendChild(spacer(above));
      for (let at = range.first; at < range.last; at += 1) frag.appendChild(buildRow(plan[at], at));
      const below = spacerHeight(plan.length - range.last, metrics.rowHeight);
      if (below > 0) frag.appendChild(spacer(below));
      host.replaceChildren(frag);
      this.propertyRange = range;
      if (!measure) return;
      this.repitch(host, () => {
        this.propertyRange = null;
        paint(anchor);
      });
    };
    this.propertyPaint = paint;
    paint(void 0, true);
  }
  /**
   * The scroller's geometry, in the numbers `visibleRange` takes.
   *
   * THE ONE SEAM between the window calculation and a laid-out browser. The
   * calculation itself is `rowWindow.ts`, which is pure and tested on numbers;
   * everything untestable about windowing is these three reads. jsdom answers
   * zero to all of them, which is exactly the "not laid out" case that renders
   * the whole list, so the existing suite keeps seeing every row.
   *
   * `deps.pickerViewport` replaces it wholesale, so a test can hand the panel
   * a viewport that jsdom could never produce.
   *
   * `closest`, not `parentElement`: a wrapper put between the host and the
   * scroller would otherwise make this read a height of zero, which the window
   * calculation reads as "not laid out" and answers by building every row —
   * windowing silently off, with nothing in the node suite able to see it. The
   * e2e probe is what would catch that (`B8 it builds only the rows that fit`
   * fails the moment this returns zero in a real browser), and naming the
   * scroller rather than counting parents is what keeps it from happening.
   */
  pickerViewport(host) {
    var _a, _b;
    const supplied = this.deps.pickerViewport;
    if (supplied !== void 0) return supplied();
    const scroll = host.closest(".spaces-create-tree-scroll");
    return {
      scrollTop: (_a = scroll == null ? void 0 : scroll.scrollTop) != null ? _a : 0,
      viewportHeight: (_b = scroll == null ? void 0 : scroll.clientHeight) != null ? _b : 0,
      rowHeight: this.propertyRowPitch
    };
  }
  /**
   * Reads the real row pitch off the rows just drawn, and asks for a repaint
   * when it is not the one they were windowed by.
   *
   * The pitch starts as this plugin's own stylesheet's (`PROPERTY_ROW_PITCH_PX`),
   * so the FIRST draw is already windowed rather than paying for the whole
   * list once to find out how tall a row is. A theme with a larger nav font
   * makes rows taller; measuring one corrects the estimate after a single
   * draw, and correcting it matters because the spacers that stand in for
   * unbuilt rows are sized by it.
   *
   * Two rows, not one: the pitch is a row's height PLUS the margin under it,
   * and the distance between two consecutive rows is the only place both are
   * visible. The slice is contiguous, so the first two drawn rows are always
   * adjacent.
   *
   * UNREACHABLE IN JSDOM, AND SO UNTESTED THERE. `offsetTop` is 0 for every
   * element, so `pitch <= 0` returns before anything happens, and no test in
   * the suite can observe the re-entrancy guard, the `propertyRange` reset or
   * the repaint. That is a property of the thing being measured, not a gap
   * that can be closed by a better test: this method IS the layout read that
   * the pure window calculation exists to keep out of itself. What stands in
   * for a test is the e2e walk, which reads back spacer heights that only
   * reconcile with the live list if the pitch this produced is right.
   *
   * Called from a plan rebuild's own paint and from nowhere else. A scroll
   * repaint must not call it: a forced synchronous layout dozens of times a
   * second is the kind of cost windowing was done to remove.
   */
  repitch(host, again) {
    if (this.repitching) return;
    const rows = host.querySelectorAll(".spaces-create-property-row");
    if (rows.length < 2) return;
    const pitch = rows[1].offsetTop - rows[0].offsetTop;
    if (pitch <= 0 || Math.abs(pitch - this.propertyRowPitch) < 0.5) return;
    this.propertyRowPitch = pitch;
    this.repitching = true;
    try {
      again();
    } finally {
      this.repitching = false;
    }
  }
  /**
   * Repaints the Properties body's window as the list is scrolled.
   *
   * It costs a draw of about twenty rows and only when the window has
   * actually moved, which `paint` decides. No `requestAnimationFrame`
   * anywhere: Obsidian throttles it to about a second in an unfocused window,
   * and a list that repaints a second after it is scrolled is worse than one
   * that repaints in the scroll handler.
   *
   * FOCUS. A repaint replaces every drawn row, so the focused control is
   * destroyed whether or not the new window still contains it. THE TWO CASES
   * ARE DIFFERENT AND MUST NOT BE CONFLATED, which is the defect this answers:
   * handing focus to the container whenever the active element went missing
   * meant that one wheel notch after any click — a click leaves focus on the
   * control it hit — collapsed the user's Tab position to the top of the drawn
   * window, on every scroll that moved the window by a single row.
   *
   * So the control is looked for by name in what was just built. Found, it is
   * focused again and the user has not moved. Genuinely off the list, focus
   * goes to the picker WINDOW, which is focusable for exactly this reason
   * (`showFault` focuses it too), so the next Tab continues from the list
   * rather than from the top of the document, and never from `<body>`.
   *
   * NO `scrollIntoView` on the way back, which is why this does not go through
   * `focusControl`. The window is three rows wider than the viewport at each
   * edge, so a restored control may legitimately be sitting just off screen in
   * the overscan — and scrolling it into view would drag the list back against
   * the gesture that is still in progress. The same call is also what made the
   * redraw's restore undo itself: `focusControl`'s `scrollIntoView` fires a
   * scroll event at the next rendering step, which lands here, and the 4 px of
   * padding on the scroller is enough to make that repaint a different window.
   * It now re-focuses the same control instead of dropping it.
   */
  onPickerScroll() {
    var _a, _b, _c;
    const paint = this.propertyPaint;
    const host = this.treeEl;
    if (paint === null || host === null) return;
    const before = (_b = (_a = this.doc) == null ? void 0 : _a.activeElement) != null ? _b : null;
    const control = before !== null && host.contains(before) && before.instanceOf(HTMLElement) ? before.dataset.control : void 0;
    paint();
    if (control === void 0) return;
    if (((_c = this.doc) == null ? void 0 : _c.activeElement) === before) return;
    const again = this.findControl(host, control);
    if (again !== null) {
      again.focus({ preventScroll: true });
      return;
    }
    this.focusPickerWindow(host);
  }
  /**
   * The tag body: the vault's tags as a tree, drawn into the same box the
   * vault tree uses.
   *
   * It holds all of them, with the ones this space already has marked — the
   * same job the item tree does for notes and folders, which is what makes the
   * buttons above the window mean the same kind of thing. An empty filter
   * box is the whole tree, collapsed; text narrows it.
   *
   * **A tree, where this used to be a flat list of 50.** Obsidian's tags nest
   * on `/` exactly as paths do, and a flat list threw that structure away
   * twice over: it said nothing about `area/health/active` belonging under
   * `area`, and on a real vault the cap hid most of it. Measured on the test
   * vault, 446 distinct tags are 6 top-level roots, so what was 50 rows of 446
   * is now six that open onto the rest. The old argument for flatness was that
   * a selected parent covers its children anyway, which is true, and is
   * answered below by SHOWING that coverage rather than by hiding the shape it
   * is a fact about.
   *
   * `buildVaultTree` and `visibleRows` are the item tree's own, generalised
   * over the kind rather than forked: expansion, carets, a filter that keeps a
   * node when a descendant matches, and the invented intermediates tags need
   * more than paths do, since `area/health/active` can exist with nothing ever
   * tagged `area` on its own.
   *
   * **Filtering is `visibleRows`, not `prepareFuzzySearch`.** A substring test
   * against a node's own name, which is its last segment, so typing `atlas`
   * finds `project/atlas` and brings its ancestors with it. The quick
   * switcher's scorer went with the flat list it ranked: a rank is an order,
   * and a tree already has one that the rows' indentation is drawing. Ranking
   * inside a tree would either reorder siblings under their parent for reasons
   * the indentation cannot show, or be computed and then thrown away. One
   * filter rule now serves the Vault and Tags bodies, and the Properties body
   * reads the same box against key names, which is also what the one filter box
   * above them implies.
   *
   * Each row reports how many notes its tag currently brings in, which is what
   * `pathsMatching` already answers and therefore exactly what the member
   * would resolve to. It is the row's confidence signal: the picker offers a
   * SELECTOR, so there is no list of notes to click through here, and without
   * the number a tag is a name and nothing else. Counted after the cap, never
   * before it (see `countTagRows`).
   */
  renderTagBody(host, query) {
    const doc = host.ownerDocument;
    host.setAttribute("role", "tree");
    host.setAttribute("aria-multiselectable", "true");
    host.setAttribute("aria-label", "Choose tags");
    host.replaceChildren();
    const message = (text) => this.setEmptyMessage(host, text);
    const chosen = this.chosenTags();
    const known = storedTags(this.deps.tags);
    if (known === null && chosen.size === 0) {
      message("Tags cannot be listed here. Add a tag from Settings, Contents.");
      return;
    }
    const all = [.../* @__PURE__ */ new Set([...known != null ? known : [], ...chosen])].sort();
    if (all.length === 0) {
      message(query.trim() === "" ? "No tags in this vault yet" : "No matching tag");
      return;
    }
    const tree = buildVaultTree(
      all.map((tag) => ({ path: tag, kind: "tag" })),
      "tag",
      isBranchByChildren
    );
    const rows = visibleRows(tree, {
      expanded: this.expandedTags,
      filter: query,
      selected: chosen,
      budget: MAX_PICKER_ROWS
    });
    if (rows.length === 0) {
      message("No matching tag");
      return;
    }
    const index = this.deps.tagIndex();
    const counts = new Map(
      countTagRows(
        rows.flatMap((row) => row.kind === "overflow" ? [] : [{ ...row, tag: row.path }]),
        (tag) => index.pathsMatching(tag).length
      ).map((row) => [row.path, row.count])
    );
    this.renderTreeRow(host, rows, {
      datasetKey: "tag",
      // Both classes: the tree's row rules are the layout, and the tag class
      // carries only what differs.
      rowClass: "spaces-create-tag-row",
      expanded: this.expandedTags,
      // A selected tag covers its children through `tagMatches`, and here the
      // parent is the row directly above them, so the mark states a fact about
      // the tree on screen. That is the whole difference from the item tree,
      // which deliberately does NOT mark the notes a tag covers: a tag's reach
      // over a NOTE is a rule matching files scattered anywhere, not a
      // position in the tree it would have been drawn in. Same principle,
      // opposite outcome, because the structure on screen is different.
      coveredBy: (row) => coveringTagIn(chosen, row.path),
      coveredTitle: (by) => `Already included by the selected tag ${TAG_SIGIL}${by}. Deselect that tag to pick tags under it one at a time.`,
      // The row toggles, so a selected one is offering to come off. Said in a
      // tooltip rather than in a second control: a real remove button inside
      // a clickable row gives two targets for one action.
      selectedTitle: (row) => `Remove ${TAG_SIGIL}${row.path}`,
      filterActive: () => query.trim() !== "",
      budgetClosedTitle: () => "There is no room to show what is inside this tag. " + (query.trim() !== "" ? "Narrow the filter to make room." : "Type in the filter to find what is inside."),
      drawName: (el, row) => {
        const label = doc.win.createSpan();
        label.className = "spaces-create-tree-name";
        const sigil = doc.win.createSpan();
        sigil.className = "spaces-create-tag-sigil";
        (0, import_obsidian9.setIcon)(sigil, "tag");
        label.appendChild(sigil);
        const name = doc.win.createSpan();
        name.textContent = row.name;
        label.appendChild(name);
        el.appendChild(label);
      },
      // Trailing the name and set in the muted type the rest of the picker
      // uses for anything that is not a name: a hint the eye picks up while it
      // is already deciding, rather than a second thing to read.
      //
      // A parent's count INCLUDES the notes under its children, because
      // `pathsMatching` resolves a tag the way a member would and the index
      // files a note under each of its tags' ancestors. So `project` reading
      // more than its own children add up to is correct rather than a double
      // count: a note tagged only `project/atlas` is in the figure for both.
      decorate: (el, row) => {
        var _a;
        const count = doc.win.createSpan();
        count.className = "spaces-create-tag-count";
        count.textContent = tagCountLabel((_a = counts.get(row.path)) != null ? _a : 0);
        el.appendChild(count);
      },
      // An invented intermediate is as selectable as any other row. Nobody
      // may have tagged a note `area`, but `area` matches everything beneath
      // it, which is exactly what picking it means.
      choose: (row) => {
        this.state = toggleItem(this.state, { kind: "tag", tag: row.path });
      }
    });
  }
  /**
   * Lines the name field up with a left-ribbon icon, by measuring both.
   *
   * A SNAP, not a subordination: `DESIGN_TITLE_GAP` is the layout, and an icon
   * within `TITLE_GAP_TOLERANCE` of it gets taken because the alignment is
   * then free. Anything further away is ignored — a theme can decline to line
   * up with us, it cannot drag us out of shape (see `ribbonAlign.ts`).
   *
   * Measured rather than hardcoded: a fixed number is wrong the moment a theme
   * changes the ribbon's pitch or phase, and Obsidian publishes neither, so
   * CSS `calc()` cannot express it either.
   */
  alignToRibbon() {
    const el = this.el;
    const doc = this.doc;
    const row = this.nameRow;
    if (!el || !doc || !row) return;
    const centres = Array.from(doc.querySelectorAll(SEL.ribbonIcon), (icon) => {
      const r = icon.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    const rect = row.getBoundingClientRect();
    const current = Number.parseFloat(
      el.style.getPropertyValue("--spaces-title-gap") || `${DESIGN_TITLE_GAP}`
    );
    const gap = alignmentGap({
      ribbonCentres: centres,
      rowTop: rect.top,
      rowHeight: rect.height,
      currentGap: Number.isFinite(current) ? current : DESIGN_TITLE_GAP,
      designGap: DESIGN_TITLE_GAP,
      tolerance: TITLE_GAP_TOLERANCE
    });
    el.style.setProperty("--spaces-title-gap", `${gap != null ? gap : DESIGN_TITLE_GAP}px`);
  }
  /**
   * Points at whatever stopped a Create, instead of a button that will not
   * click.
   *
   * Two halves, because a color alone is not a reason: the control is marked
   * so the eye lands on it, and the reason goes to a `Notice`. The panel keeps
   * no message row of its own — it had to be cleared by hand, which is how a
   * stale "choose a folder" once sat there after its mode was switched off.
   *
   * A fault on the root OPENS the picker first: a red border on a box that is
   * not on screen tells the user nothing. Focus follows the mark, so keyboard
   * users are taken where the color points sighted ones.
   */
  showFault(fault) {
    if (fault.field === "root" && !this.itemsOpen) {
      this.itemsOpen = true;
      this.render();
    }
    this.fault = fault;
    this.paintFault();
    new import_obsidian9.Notice(`Spaces: ${fault.message}`);
    const el = this.el;
    const target = el == null ? void 0 : el.querySelector(
      fault.field === "name" ? '[data-focus-key="name"]' : ".spaces-create-tree"
    );
    target == null ? void 0 : target.focus();
    if (target && fault.field === "root") target.scrollIntoView({ block: "nearest" });
  }
  /**
   * Applies or removes the invalid marking — the mark only; the words are the
   * Notice's job. Separate from `showFault` because a re-render rebuilds the
   * nodes it marked and the fault has to survive that: it is cleared by
   * EDITING the control, not by redrawing it.
   */
  paintFault() {
    var _a;
    const el = this.el;
    if (!el) return;
    const name = el.querySelector('[data-focus-key="name"]');
    const tree = el.querySelector(".spaces-create-tree");
    for (const [node, field] of [
      [name, "name"],
      [tree, "root"]
    ]) {
      if (!(node instanceof HTMLElement)) continue;
      const bad = ((_a = this.fault) == null ? void 0 : _a.field) === field;
      node.classList.toggle("is-invalid", bad);
      if (bad) node.setAttribute("aria-invalid", "true");
      else node.removeAttribute("aria-invalid");
    }
  }
  /** Clears the mark once the user has acted on the control it named. */
  clearFault(field) {
    var _a;
    if (((_a = this.fault) == null ? void 0 : _a.field) !== field) return;
    this.fault = null;
    this.paintFault();
  }
  /**
   * Keeps the Create button's disabled state in step without a full re-render
   * (which would drop focus out of the input whose `input` event called this).
   * Only an in-flight submit disables it — validation does not, since a
   * refused Create explains itself instead.
   */
  refreshCreateButton() {
    if (this.createBtn) this.createBtn.disabled = this.submitting;
  }
  async handleSubmit() {
    if (this.submitting) return;
    const fault = validateForm(this.state);
    if (fault) {
      this.showFault(fault);
      return;
    }
    this.submitting = true;
    this.render();
    let created = false;
    try {
      await this.deps.onSubmit(this.state.name, toCreateOptions(this.state));
      created = true;
    } catch (e) {
      new import_obsidian9.Notice(`Spaces: could not create the space (${String(e)})`);
      this.submitting = false;
      this.render();
    }
    if (created && this.isOpen) {
      try {
        this.close();
      } catch (e) {
        console.error("Spaces: onClose threw after a successful create", e);
      }
    }
  }
};
function paletteNameOf(color) {
  const i = PALETTE.indexOf(color);
  return i >= 0 ? PALETTE_NAMES[i] : color;
}

// src/ui/nativeTagCounts.ts
function nativeKnownTags(app) {
  if (typeof app !== "object" || app === null) return null;
  const cache2 = app.metadataCache;
  if (typeof cache2 !== "object" || cache2 === null) return null;
  const method = cache2.getTags;
  if (typeof method !== "function") return null;
  try {
    const counts = method.call(cache2);
    if (typeof counts !== "object" || counts === null) return null;
    return Object.keys(counts);
  } catch (e) {
    return null;
  }
}

// src/visibility/ObsidianVaultIndex.ts
var import_obsidian10 = require("obsidian");
function createObsidianVaultIndex(vault) {
  const kinds = /* @__PURE__ */ new Map();
  const walk = (f) => {
    if (f.path !== "/" && f.path !== "") {
      kinds.set(f.path, f instanceof import_obsidian10.TFolder ? "folder" : "file");
    }
    if (f instanceof import_obsidian10.TFolder) for (const c of f.children) walk(c);
  };
  walk(vault.getRoot());
  return createTreeVaultIndex(kinds);
}

// src/visibility/ObsidianTagIndex.ts
var import_obsidian11 = require("obsidian");

// src/visibility/TagIndex.ts
function createMapTagIndex(byTag) {
  return {
    pathsMatching(tag) {
      const want = normalizeTag(tag);
      if (want.length === 0) return [];
      const hit = byTag.get(want);
      return hit === void 0 ? [] : [...hit];
    }
  };
}
function tagChain(tag) {
  const out = [tag];
  for (let i = tag.indexOf("/"); i !== -1; i = tag.indexOf("/", i + 1)) {
    if (i > 0) out.push(tag.slice(0, i));
  }
  return out;
}
function pathsByTag(files, pathOf, tagsOf) {
  const byTag = /* @__PURE__ */ new Map();
  const chains = /* @__PURE__ */ new Map();
  for (const file of files) {
    const tags = tagsOf(file);
    if (tags === null || tags.length === 0) continue;
    const path = pathOf(file);
    for (const raw of tags) {
      const tag = normalizeTag(raw);
      if (tag.length === 0) continue;
      let chain = chains.get(tag);
      if (chain === void 0) {
        chain = tagChain(tag);
        chains.set(tag, chain);
      }
      for (const name of chain) {
        let arr = byTag.get(name);
        if (arr === void 0) {
          arr = [];
          byTag.set(name, arr);
        }
        if (arr[arr.length - 1] !== path) arr.push(path);
      }
    }
  }
  return byTag;
}
function createLazyTagIndex(build) {
  let built = null;
  return {
    pathsMatching(tag) {
      built != null ? built : built = build();
      return built.pathsMatching(tag);
    }
  };
}

// src/visibility/ObsidianTagIndex.ts
function createObsidianTagIndex(app) {
  return createMapTagIndex(
    pathsByTag(
      app.vault.getMarkdownFiles(),
      (file) => file.path,
      (file) => {
        const cache2 = app.metadataCache.getFileCache(file);
        return cache2 === null ? null : (0, import_obsidian11.getAllTags)(cache2);
      }
    )
  );
}

// src/visibility/PropertyIndex.ts
function createPropertyIndex(entries, generation) {
  const byKey = /* @__PURE__ */ new Map();
  const captured = /* @__PURE__ */ new Map();
  const sorted = [...entries].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  for (const { path, frontmatter } of sorted) {
    if (frontmatter === null || typeof frontmatter !== "object") continue;
    for (const key of Object.keys(frontmatter)) {
      if (!hasOwnKey(frontmatter, key)) continue;
      let paths = byKey.get(key);
      if (paths === void 0) {
        paths = [];
        byKey.set(key, paths);
        captured.set(key, []);
      }
      paths.push(path);
      const raw = frontmatter[key];
      captured.get(key).push({ path, raw: Array.isArray(raw) ? [...raw] : raw });
    }
  }
  const buckets = /* @__PURE__ */ new Map();
  const bucketsFor = (key) => {
    var _a;
    let found = buckets.get(key);
    if (found !== void 0) return found;
    found = /* @__PURE__ */ new Map();
    for (const { path, raw } of (_a = captured.get(key)) != null ? _a : []) {
      const spellings = Array.isArray(raw) ? raw : [raw];
      for (const one of spellings) {
        if (typeof one !== "string" && typeof one !== "number" && typeof one !== "boolean") continue;
        const spelling = String(one);
        const normalized = normalizeValue(spelling);
        let bucket = found.get(normalized);
        if (bucket === void 0) {
          bucket = { value: spelling, paths: [] };
          found.set(normalized, bucket);
        }
        if (bucket.paths[bucket.paths.length - 1] !== path) bucket.paths.push(path);
      }
    }
    buckets.set(key, found);
    captured.delete(key);
    return found;
  };
  const listed = /* @__PURE__ */ new Map();
  const listValues = (key) => {
    let found = listed.get(key);
    if (found !== void 0) return found;
    found = [...bucketsFor(key).entries()].map(([normalized, b]) => ({ value: b.value, normalized, count: b.paths.length })).sort((a, b) => b.count - a.count || (a.normalized < b.normalized ? -1 : 1));
    listed.set(key, found);
    return found;
  };
  let keysListed = null;
  const listKeys = () => {
    if (keysListed !== null) return keysListed;
    keysListed = [...byKey.entries()].map(([key, paths]) => ({ key, count: paths.length })).sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
    return keysListed;
  };
  return {
    generation,
    pathsWithKey: (key) => {
      var _a;
      return [...(_a = byKey.get(key)) != null ? _a : []];
    },
    pathsMatching: (key, value) => {
      var _a, _b;
      return [...(_b = (_a = bucketsFor(key).get(normalizeValue(value))) == null ? void 0 : _a.paths) != null ? _b : []];
    },
    listKeys,
    listValues
  };
}

// src/visibility/ObsidianPropertyIndex.ts
function walkPropertyCache(app) {
  const entries = [];
  const unparsed = [];
  for (const file of app.vault.getMarkdownFiles()) {
    const cache2 = app.metadataCache.getFileCache(file);
    if (cache2 === null) {
      unparsed.push(file.path);
      continue;
    }
    const frontmatter = cache2.frontmatter;
    if (frontmatter === void 0) continue;
    entries.push({ path: file.path, frontmatter });
  }
  return { entries, unparsed };
}
function snapshotFromWalk(walk, generation) {
  if (walk.unparsed.length > 0) return { status: "unavailable", unparsed: walk.unparsed };
  return { status: "ready", index: createPropertyIndex(walk.entries, generation) };
}
function createLazyPropertySnapshot(build) {
  let answered = null;
  return () => {
    if (answered === null) answered = build();
    return answered;
  };
}

// src/lifecycle/parseStall.ts
var PROPERTY_STALL_SAMPLE_MS = 5e3;
var PROPERTY_STALL_SAMPLES_AGREED = 7;
var PROPERTY_STALL_MAX_SAMPLES = 24;
function stallVerdict(samples) {
  const last = samples[samples.length - 1];
  if (last === void 0 || last === null) return "unknown";
  if (last === 0) return "drained";
  const window2 = samples.slice(-PROPERTY_STALL_SAMPLES_AGREED);
  if (window2.length < PROPERTY_STALL_SAMPLES_AGREED) return "working";
  if (window2.some((s) => s === null)) return "unknown";
  return window2.every((s) => s === last) ? "stalled" : "working";
}
function stallCleared(samples) {
  const last = samples[samples.length - 1];
  if (last === void 0 || last === null) return false;
  if (last === 0) return true;
  const previous = samples[samples.length - 2];
  if (previous === void 0 || previous === null) return false;
  return last < previous;
}
function createParseStallWatch(args) {
  var _a, _b;
  const sampleMs = (_a = args.sampleMs) != null ? _a : PROPERTY_STALL_SAMPLE_MS;
  const maxSamples = (_b = args.maxSamples) != null ? _b : PROPERTY_STALL_MAX_SAMPLES;
  let handle = null;
  let samples = [];
  let latched = false;
  let cancelled = false;
  const schedule = () => {
    if (cancelled) return;
    handle = args.timer.set(tick, sampleMs);
  };
  const tick = () => {
    handle = null;
    if (cancelled) return;
    samples.push(args.progress());
    if (latched && stallCleared(samples)) latched = false;
    const verdict = stallVerdict(samples);
    if (verdict === "drained") return;
    if (verdict === "stalled" && !latched) {
      latched = true;
      args.onStalled();
    }
    if (samples.length >= maxSamples) return;
    schedule();
  };
  return {
    arm() {
      if (cancelled || handle !== null) return;
      samples = [];
      schedule();
    },
    stalled: () => latched,
    cancel() {
      cancelled = true;
      if (handle !== null) args.timer.clear(handle);
      handle = null;
    }
  };
}

// src/lifecycle/parseStallNotice.ts
function parseStallMessage(count, culprit) {
  if (count <= 0 || culprit === "") return null;
  const tail = "If it stays that way, move that note out of the vault or split it into smaller notes.";
  if (count === 1) {
    return `Spaces: Obsidian is still reading "${culprit}", so spaces that collect notes by a property are incomplete. ${tail}`;
  }
  return `Spaces: Obsidian is still reading ${count} notes, so spaces that collect notes by a property are incomplete. The largest is "${culprit}". ${tail}`;
}

// src/visibility/nativeParseProgress.ts
function nativeParseProgress(app) {
  if (typeof app !== "object" || app === null) return null;
  const cache2 = app.metadataCache;
  if (typeof cache2 !== "object" || cache2 === null) return null;
  try {
    const count = cache2.inProgressTaskCount;
    if (typeof count !== "number" || !Number.isFinite(count) || count < 0) return null;
    return count;
  } catch (e) {
    return null;
  }
}

// src/ui/PropertyRefreshHub.ts
var PropertyRefreshHub = class {
  constructor() {
    this.watchers = /* @__PURE__ */ new Set();
  }
  /**
   * Registers a watcher and returns its own release. Each call gets its own
   * entry, so subscribing the same function twice and releasing one handle
   * leaves the other subscription live.
   */
  subscribe(onChange) {
    const entry = () => onChange();
    this.watchers.add(entry);
    return () => {
      this.watchers.delete(entry);
    };
  }
  /**
   * Calls every current watcher. Iterates a copy, so a watcher that releases
   * itself, or another, mid-notify neither skips nor re-enters. A throwing
   * watcher is logged and does not stop the rest.
   */
  notify() {
    for (const watcher of [...this.watchers]) {
      if (!this.watchers.has(watcher)) continue;
      try {
        watcher();
      } catch (e) {
        console.error("Spaces: a property picker refresh failed", e);
      }
    }
  }
  /** How many pickers are subscribed. Lets a caller skip work nobody awaits. */
  get size() {
    return this.watchers.size;
  }
  /** Drops every watcher. For unload, when no picker can still be open. */
  clear() {
    this.watchers.clear();
  }
};

// src/lifecycle/refreshFlush.ts
function installThenNotify(install, notify) {
  install();
  notify();
}
function metadataNotifyRoute(spaceWatchesMetadata, pickers) {
  if (spaceWatchesMetadata) return "vault-flush";
  return pickers > 0 ? "picker-flush" : "none";
}
var RefreshFlushState = class {
  constructor() {
    this.full = false;
    this.recompute = false;
    this.fresh = false;
  }
  /** A vault event has arrived. Clears `fresh` only; see `markFull`. */
  noteVaultEvent() {
    this.fresh = false;
  }
  /** The flush must re-index and refresh. Call from inside queued work. */
  markFull() {
    this.full = true;
  }
  /**
   * The active space's contents may have changed, but the vault did not: a
   * note's metadata changed. The flush recomputes and notifies and does NOT
   * re-index the vault tree. Call from inside queued work, for the reason
   * `markFull` gives.
   */
  markRecompute() {
    this.recompute = true;
  }
  noteSnapshotInstalled() {
    this.fresh = true;
  }
  /**
   * Reads and resets.
   *
   * - `full`: a vault event happened, so the vault tree is stale.
   * - `recompute`: the active space must be recomputed. True whenever `full`
   *   is, and also for a metadata burst in a space that watches metadata.
   * - `rebuild`: install a second property snapshot. Only ever true on a full
   *   flush; a metadata event installs its own.
   */
  take() {
    const result = {
      full: this.full,
      recompute: this.full || this.recompute,
      rebuild: this.full && !this.fresh
    };
    this.full = false;
    this.recompute = false;
    this.fresh = false;
    return result;
  }
};
function submitVaultWork(submit, state, fn) {
  state.noteVaultEvent();
  return submit(async () => {
    try {
      return await fn();
    } finally {
      state.markFull();
    }
  });
}
function submitMetadataWork(submit, state) {
  return submit(async () => {
    state.markRecompute();
  });
}
function runFlush(state, actions) {
  const { full, recompute, rebuild } = state.take();
  if (full) {
    actions.replaceVaultIndex();
    actions.replaceTagIndex();
  }
  installThenNotify(
    () => {
      if (rebuild) actions.installPropertySnapshot();
    },
    () => actions.notifyPickers()
  );
  if (recompute) actions.refresh();
}

// src/lifecycle/moveCorrelator.ts
var CORRELATION_WINDOW_MS = 4e3;
var MAX_CORRELATION_BUFFER = 256;
function prune(buffer, now, windowMs = CORRELATION_WINDOW_MS) {
  const fresh = buffer.filter((e) => now - e.at <= windowMs);
  return fresh.length > MAX_CORRELATION_BUFFER ? fresh.slice(fresh.length - MAX_CORRELATION_BUFFER) : fresh;
}
function sameStats(a, b) {
  if (a.size === null || a.ctime === null || a.mtime === null) return false;
  return a.size === b.size && a.ctime === b.ctime && a.mtime === b.mtime;
}
function inWindow(a, b, windowMs) {
  return Math.abs(a.at - b.at) <= windowMs;
}
function orient(a, b) {
  const del = a.kind === "delete" ? a : b;
  const add = a.kind === "create" ? a : b;
  return { oldPath: del.path, newPath: add.path };
}
function filePairs(buffer, windowMs) {
  const out = [];
  const scan = buffer.length > MAX_CORRELATION_BUFFER ? buffer.slice(buffer.length - MAX_CORRELATION_BUFFER) : buffer;
  for (let i = 0; i < scan.length; i++) {
    for (let j = i + 1; j < scan.length; j++) {
      const a = scan[i];
      const b = scan[j];
      if (a.isFolder || b.isFolder) continue;
      if (a.kind === b.kind) continue;
      if (a.path === b.path) continue;
      if (!sameStats(a, b) || !inWindow(a, b, windowMs)) continue;
      out.push(orient(a, b));
    }
  }
  return out;
}
function isUnder(path, base) {
  return path.startsWith(`${base}/`);
}
function correlate(args) {
  var _a;
  const { buffer, event } = args;
  const windowMs = (_a = args.windowMs) != null ? _a : CORRELATION_WINDOW_MS;
  if (event.isFolder) return correlateFolder(buffer, event, windowMs);
  const partners = buffer.filter(
    (c) => !c.isFolder && c.kind !== event.kind && c.path !== event.path && sameStats(event, c) && inWindow(event, c, windowMs)
  );
  if (partners.length !== 1) return null;
  return orient(event, partners[0]);
}
function correlateFolder(buffer, event, windowMs) {
  if (event.kind !== "delete") return null;
  const createdFolders = new Set(
    buffer.filter((e) => e.isFolder && e.kind === "create").map((e) => e.path)
  );
  const derived = /* @__PURE__ */ new Set();
  for (const pair of filePairs(buffer, windowMs)) {
    if (!isUnder(pair.oldPath, event.path)) continue;
    const rel = pair.oldPath.slice(event.path.length + 1);
    if (!pair.newPath.endsWith(`/${rel}`)) continue;
    const newFolder = pair.newPath.slice(0, pair.newPath.length - rel.length - 1);
    if (newFolder === event.path) continue;
    if (!createdFolders.has(newFolder)) continue;
    derived.add(newFolder);
  }
  if (derived.size !== 1) return null;
  return { oldPath: event.path, newPath: [...derived][0] };
}

// src/lifecycle/eventCoalescer.ts
var VAULT_COALESCE_WINDOW_MS = 50;
var VAULT_COALESCE_MAX_WAIT_MS = 250;
function createVaultChangeCoalescer(args) {
  var _a, _b;
  const { timer, flush } = args;
  const windowMs = (_a = args.windowMs) != null ? _a : VAULT_COALESCE_WINDOW_MS;
  const maxWaitMs = (_b = args.maxWaitMs) != null ? _b : VAULT_COALESCE_MAX_WAIT_MS;
  let handle = null;
  let burstStart = null;
  let cancelled = false;
  let chain = Promise.resolve();
  const fire = () => {
    handle = null;
    burstStart = null;
    flush();
  };
  const schedule = () => {
    if (cancelled) return;
    const now = timer.now();
    if (burstStart === null) burstStart = now;
    if (handle !== null) timer.clear(handle);
    const remaining = maxWaitMs - (now - burstStart);
    handle = timer.set(fire, Math.max(0, Math.min(windowMs, remaining)));
  };
  return {
    async submit(work) {
      const run = chain.then(work);
      chain = run.then(
        () => void 0,
        () => void 0
      );
      try {
        await run;
      } finally {
        schedule();
      }
    },
    isPending: () => handle !== null,
    cancel() {
      cancelled = true;
      if (handle !== null) timer.clear(handle);
      handle = null;
      burstStart = null;
    }
  };
}

// src/actions/membership.ts
var import_obsidian12 = require("obsidian");

// src/actions/spaceAddTargets.ts
function spaceAddTargets(spaces, paths, tags, properties, ignore) {
  return spaces.filter((s) => !isFolderSpace(s)).map((space) => {
    if (properties === null && holdsPropertyMember(space)) {
      return {
        id: space.id,
        name: space.name,
        icon: space.icon,
        color: space.color,
        label: `${space.name} (try again in a moment)`,
        disabled: true,
        addablePaths: []
      };
    }
    const resolved = resolvedPaths(space, tags, properties, ignore);
    const addablePaths = [];
    let sharedFolder = null;
    for (const path of paths) {
      const { held, viaFolder } = heldBy(space, resolved, path);
      if (!held) addablePaths.push(path);
      else if (viaFolder && sharedFolder === null) sharedFolder = viaFolder;
    }
    const disabled = addablePaths.length === 0;
    let label = space.name;
    if (disabled) {
      label = sharedFolder ? `${space.name} (already in ${sharedFolder})` : `${space.name} (already added)`;
    } else if (addablePaths.length < paths.length) {
      label = `${space.name} (${addablePaths.length})`;
    }
    return {
      id: space.id,
      name: space.name,
      icon: space.icon,
      color: space.color,
      label,
      disabled,
      addablePaths
    };
  });
}

// src/actions/nativeMenuSubmenu.ts
function submenuFor(item) {
  const candidate = item.setSubmenu;
  if (typeof candidate !== "function") return null;
  try {
    const sub = candidate.call(item);
    if (!sub || typeof sub !== "object") return null;
    if (typeof sub.addItem !== "function") return null;
    return sub;
  } catch (e) {
    return null;
  }
}

// src/actions/membershipMenu.ts
function decorate(menu, ctx, files, handlers) {
  const space = ctx.controller.activeSpace();
  if (!space) {
    addToSpaceEntries(menu, ctx, files, handlers);
    return;
  }
  const snap = ctx.controller.currentSnapshot();
  if (!snap) return;
  const visible = files.filter((f) => snap.decisionFor(f.path).visible);
  if (visible.length === 0) return;
  const decisions = visible.map((f) => snap.decisionFor(f.path));
  const allExact = decisions.every((d) => d.canRemoveMembership);
  const anyInherited = decisions.some((d) => d.reason === "inherited-member");
  if (allExact) {
    menu.addItem(
      (i) => i.setTitle(`Remove from ${space.name}`).setIcon("minus-circle").onClick(() => handlers.removeAll(visible))
    );
    return;
  }
  if (anyInherited) {
    const folder = visible.length === 1 ? inheritedFromFolder(space, visible[0].path) : null;
    const label = folder ? `Remove from ${space.name} (inherited from ${folder})` : `Remove from ${space.name} (inherited)`;
    menu.addItem((i) => i.setTitle(label).setIcon("minus-circle").setDisabled(true));
  }
  const addable = visible.filter(
    (_, n) => !decisions[n].canRemoveMembership && decisions[n].reason !== "inherited-member"
  );
  if (addable.length > 0) {
    menu.addItem(
      (i) => i.setTitle(
        addable.length === 1 ? `Add to ${space.name}` : `Add ${addable.length} to ${space.name}`
      ).setIcon("plus-circle").onClick(() => handlers.addAll(addable))
    );
  }
  const visitors = visible.filter(
    (f) => snap.decisionFor(f.path).reason === "visitor"
  );
  if (visitors.length > 0) {
    menu.addItem(
      (i) => i.setTitle("Stop showing here").setIcon("eye-off").onClick(() => handlers.dismissAll(visitors))
    );
  }
}
function addToSpaceEntries(menu, ctx, files, handlers) {
  const spaces = ctx.spaces();
  if (files.length === 0) return;
  const byPath = new Map(files.map((f) => [f.path, f]));
  const targets = spaceAddTargets(
    spaces,
    files.map((f) => f.path),
    ctx.tags(),
    ctx.properties(),
    ctx.ignore()
  );
  if (targets.length === 0) return;
  const build = (item, t) => {
    item.setTitle(t.label).setIcon(t.icon).setDisabled(t.disabled);
    if (!t.disabled) {
      const addable = t.addablePaths.map((p) => byPath.get(p)).filter((f) => f !== void 0);
      item.onClick(() => handlers.addToSpace(t.id, addable));
    }
    return item;
  };
  const held = { sub: null };
  menu.addItem((parent) => {
    parent.setTitle("Add to space").setIcon("plus-circle");
    held.sub = submenuFor(parent);
    return parent;
  });
  const submenu = held.sub;
  if (submenu) {
    for (const t of targets) submenu.addItem((item) => build(item, t));
    return;
  }
  for (const t of targets) {
    menu.addItem((item) => build(item, { ...t, label: `Add to ${t.label}` }));
  }
}

// src/actions/definitionWrites.ts
async function removeMembers(defs, spaceId, paths) {
  await defs.mutate((d) => {
    var _a;
    const target = d.spaces.find((s) => s.id === spaceId);
    if (!target) return;
    const drop = /* @__PURE__ */ new Set();
    const exclude = new Set((_a = target.exclude) != null ? _a : []);
    for (const wanted of paths) {
      const exact = target.members.find(
        (m) => (m.kind === "file" || m.kind === "folder") && m.path === wanted
      );
      if (exact && (exact.kind === "file" || exact.kind === "folder")) {
        drop.add(exact.path);
        continue;
      }
      const folded = canonicalPath(wanted);
      let matched = false;
      for (const m of target.members) {
        if (m.kind !== "file" && m.kind !== "folder") continue;
        if (canonicalPath(m.path) === folded) {
          drop.add(m.path);
          matched = true;
        }
      }
      if (!matched) {
        const already = [...exclude].some((e) => canonicalPath(e) === folded);
        if (!already) exclude.add(wanted);
      }
    }
    target.members = target.members.filter(
      (m) => m.kind !== "file" && m.kind !== "folder" || !drop.has(m.path)
    );
    if (exclude.size > 0) target.exclude = [...exclude];
  });
}

// src/actions/membership.ts
function samePath(a, b) {
  return a === b || canonicalPath(a) === canonicalPath(b);
}
function entryFor(f) {
  return { path: f.path, kind: f instanceof import_obsidian12.TFolder ? "folder" : "file" };
}
function subject(files) {
  return files.length === 1 ? files[0].name : `${files.length} notes and folders`;
}
function alreadyInMessage(files, spaceName) {
  const verb = files.length === 1 ? "is" : "are";
  return `${subject(files)} ${verb} already in ${spaceName}`;
}
function addOutcomeMessage(added, already, spaceName) {
  if (added.length > 0) return `Added ${subject(added)} to ${spaceName}`;
  if (already.length > 0) return alreadyInMessage(already, spaceName);
  return `Nothing to add to ${spaceName}`;
}
function splitBatch(files, space, tags, properties, ignore) {
  const resolved = space ? resolvedPaths(space, tags, properties, ignore) : /* @__PURE__ */ new Set();
  const seen = /* @__PURE__ */ new Set();
  const added = [];
  const already = [];
  for (const f of files) {
    const key = canonicalPath(f.path);
    if (seen.has(key)) continue;
    seen.add(key);
    const held = space !== void 0 && heldBy(space, resolved, f.path).held;
    (held ? already : added).push(f);
  }
  return { added, already };
}
var STILL_READING = "Spaces: this vault's properties are still loading. Try again in a moment.";
function propertiesFor(ctx, space) {
  var _a;
  if (space === void 0 || !holdsPropertyMember(space)) return null;
  return (_a = ctx.controller.drawnPropertyIndex()) != null ? _a : "unknown";
}
function ignoreFor(ctx) {
  return compileIgnore(ctx.defs.get().settings.globalIgnore);
}
async function addAll(ctx, files) {
  const space = ctx.controller.activeSpace();
  if (!space) return;
  const current = ctx.defs.get().spaces.find((s) => s.id === space.id);
  const props = propertiesFor(ctx, current);
  if (props === "unknown") {
    new import_obsidian12.Notice(STILL_READING);
    return;
  }
  const { added, already } = splitBatch(
    files,
    current,
    ctx.controller.tagIndex(),
    props,
    ignoreFor(ctx)
  );
  try {
    await ctx.defs.mutate((d) => {
      const target = d.spaces.find((s) => s.id === space.id);
      if (!target) return;
      for (const f of added) {
        if (!pathMembers(target).some((m) => samePath(m.path, f.path))) {
          target.members.push(entryFor(f));
        }
      }
    });
  } catch (e) {
    new import_obsidian12.Notice(`Spaces: could not add to ${space.name} (${String(e)})`);
    return;
  }
  new import_obsidian12.Notice(addOutcomeMessage(added, already, space.name));
}
async function addToSpace(ctx, spaceId, files) {
  var _a, _b;
  const name = (_b = (_a = ctx.defs.get().spaces.find((s) => s.id === spaceId)) == null ? void 0 : _a.name) != null ? _b : spaceId;
  if (files.length === 0) return;
  const current = ctx.defs.get().spaces.find((s) => s.id === spaceId);
  const props = propertiesFor(ctx, current);
  if (props === "unknown") {
    new import_obsidian12.Notice(STILL_READING);
    return;
  }
  const { added, already } = splitBatch(
    files,
    current,
    ctx.controller.tagIndex(),
    props,
    ignoreFor(ctx)
  );
  try {
    await ctx.defs.mutate((d) => {
      const target = d.spaces.find((s) => s.id === spaceId);
      if (!target) return;
      for (const f of added) {
        if (!pathMembers(target).some((m) => samePath(m.path, f.path))) {
          target.members.push(entryFor(f));
        }
      }
    });
  } catch (e) {
    new import_obsidian12.Notice(`Spaces: could not add to ${name} (${String(e)})`);
    return;
  }
  new import_obsidian12.Notice(addOutcomeMessage(added, already, name));
}
async function removeAll(ctx, files) {
  const space = ctx.controller.activeSpace();
  if (!space) return;
  try {
    await removeMembers(ctx.defs, space.id, files.map((f) => f.path));
  } catch (e) {
    new import_obsidian12.Notice(`Spaces: could not remove from ${space.name} (${String(e)})`);
    return;
  }
  new import_obsidian12.Notice(`Removed ${subject(files)} from ${space.name}`);
}
function decorate2(menu, ctx, files) {
  const decorateCtx = {
    controller: ctx.controller,
    spaces: () => activeSpaces(ctx.defs.get().spaces),
    // The controller's own snapshot, so *All*'s "Add to space" answers from
    // the same picture the tree was drawn from. Lazy behind
    // `createLazyTagIndex`, so a vault whose spaces hold no tag member pays
    // nothing for opening a context menu.
    tags: () => ctx.controller.tagIndex(),
    // Asked only when an ACTIVE space holds a property member, so a vault
    // with none pays no metadata walk for opening a context menu. Filtered
    // like `spaces` above, and for a sharper reason: the menu can only offer
    // an active space, so an index built for an archived one is work whose
    // result nothing reads. `main.ts` installs a fresh lazy snapshot on every
    // metadata `changed` event, so an unfiltered ask made the first
    // right-click after any note save pay a whole-vault `getFileCache` walk
    // for a space that appears nowhere.
    properties: () => activeSpaces(ctx.defs.get().spaces).some(holdsPropertyMember) ? ctx.controller.drawnPropertyIndex() : null,
    // Compiled at most once per menu. NOT "only if a space is offered": this
    // is an argument to `spaceAddTargets`, so it is evaluated before the
    // empty-targets guard can return, and an earlier version of this comment
    // claimed otherwise. `compileIgnore` builds a RegExp per pattern, which
    // is why it is a function at all rather than a value on the context.
    ignore: () => ignoreFor(ctx)
  };
  decorate(menu, decorateCtx, files, {
    addAll: (fs) => void addAll(ctx, fs),
    addToSpace: (spaceId, fs) => void addToSpace(ctx, spaceId, fs),
    removeAll: (fs) => void removeAll(ctx, fs),
    // Dismissing a visitor only clears its reveal, so it goes straight
    // to the controller and never touches DefinitionStore/membership.
    dismissAll: (fs) => {
      for (const f of fs) ctx.controller.dismissRevealed(f.path);
    }
  });
}
function registerMembershipMenus(plugin, ctx) {
  plugin.registerEvent(
    plugin.app.workspace.on("file-menu", (menu, file) => decorate2(menu, ctx, [file]))
  );
  plugin.registerEvent(
    plugin.app.workspace.on("files-menu", (menu, files) => decorate2(menu, ctx, files))
  );
}

// src/order/currentDrag.ts
var CurrentDrag = class {
  constructor() {
    this.current = [];
    this.clipped = false;
  }
  /** Copied, so the caller cannot edit the record through the array it passed. */
  begin(paths, truncated) {
    this.current = [...paths];
    this.clipped = truncated;
  }
  end() {
    this.current = [];
    this.clipped = false;
  }
  paths() {
    return this.current;
  }
  /**
   * The whole record. Read by anything that has to DECIDE something, because
   * deciding on `paths` alone is deciding without knowing whether the list is
   * complete.
   */
  dragged() {
    return { paths: this.current, truncated: this.clipped };
  }
};

// src/actions/creation.ts
var import_obsidian13 = require("obsidian");
function pinnedDestination(root, rootIsFolder2) {
  if (!root) return { path: null, missingRoot: false };
  if (rootIsFolder2) return { path: root, missingRoot: false };
  return { path: null, missingRoot: true };
}
function rootIsFolder(app, root) {
  return app.vault.getAbstractFileByPath(root) instanceof import_obsidian13.TFolder;
}
function noticeMissingRoot() {
  new import_obsidian13.Notice("Spaces: this space's folder is missing.");
}
function destinationFolder(app, root) {
  var _a;
  const out = pinnedDestination(root, root ? rootIsFolder(app, root) : false);
  if (out.missingRoot) noticeMissingRoot();
  return (_a = out.path) != null ? _a : app.fileManager.getNewFileParent("").path;
}
function spaceDestination(app, space) {
  var _a;
  return destinationFolder(app, (_a = rootOf(space)) != null ? _a : void 0);
}
async function ensureMember(ctx, spaceId, path, kind) {
  const snap = ctx.controller.currentSnapshot();
  if (snap == null ? void 0 : snap.decisionFor(path).visible) return;
  await ctx.defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === spaceId);
    if (s && !pathMembers(s).some((m) => canonicalPath(m.path) === canonicalPath(path))) {
      s.members.push({ path, kind });
    }
  });
}
async function newNoteInActiveSpace(app, ctx) {
  const space = ctx.controller.activeSpace();
  if (!space) {
    new import_obsidian13.Notice("Spaces: switch to a space first.");
    return;
  }
  const dir = spaceDestination(app, space);
  const base = dir === "/" || dir === "" ? "" : `${dir}/`;
  let path = (0, import_obsidian13.normalizePath)(`${base}Untitled.md`);
  let n = 1;
  while (app.vault.getAbstractFileByPath(path)) {
    path = (0, import_obsidian13.normalizePath)(`${base}Untitled ${++n}.md`);
  }
  let file;
  try {
    file = await app.vault.create(path, "");
  } catch (e) {
    new import_obsidian13.Notice(`Spaces: could not create note (${String(e)})`);
    return;
  }
  try {
    if (!isFolderSpace(space)) await ensureMember(ctx, space.id, file.path, "file");
  } catch (e) {
    new import_obsidian13.Notice(
      `Spaces: note created, but could not add it to the space (${String(e)})`
    );
  }
  await app.workspace.getLeaf(false).openFile(file);
}
async function newFolderInActiveSpace(app, ctx) {
  const space = ctx.controller.activeSpace();
  if (!space) {
    new import_obsidian13.Notice("Spaces: switch to a space first.");
    return;
  }
  const dir = spaceDestination(app, space);
  const base = dir === "/" || dir === "" ? "" : `${dir}/`;
  let path = (0, import_obsidian13.normalizePath)(`${base}New folder`);
  let n = 1;
  while (app.vault.getAbstractFileByPath(path)) {
    path = (0, import_obsidian13.normalizePath)(`${base}New folder ${++n}`);
  }
  try {
    await app.vault.createFolder(path);
  } catch (e) {
    new import_obsidian13.Notice(`Spaces: could not create folder (${String(e)})`);
    return;
  }
  try {
    if (!isFolderSpace(space)) await ensureMember(ctx, space.id, path, "folder");
  } catch (e) {
    new import_obsidian13.Notice(
      `Spaces: folder created, but could not add it to the space (${String(e)})`
    );
  }
}

// src/actions/newFileLocation.ts
var import_obsidian14 = require("obsidian");
function installNewFileRedirect(app, activeRoot) {
  const fm = app.fileManager;
  const existing = patched.get(fm);
  if (existing) return existing.restore;
  const original = fm.getNewFileParent;
  let live = true;
  const wrapper = (sourcePath, newFilePath) => {
    const fallback = original.call(fm, sourcePath, newFilePath);
    if (!live) return fallback;
    const root = activeRoot();
    if (root === null) return fallback;
    const out = pinnedDestination(root, rootIsFolder(app, root));
    if (out.missingRoot) noticeMissingRoot();
    if (out.path === null) return fallback;
    const folder = app.vault.getAbstractFileByPath(out.path);
    return folder instanceof import_obsidian14.TFolder ? folder : fallback;
  };
  const restore = () => {
    const record = patched.get(fm);
    if (!record) return;
    patched.delete(fm);
    live = false;
    if (fm.getNewFileParent === record.wrapper) fm.getNewFileParent = record.original;
  };
  fm.getNewFileParent = wrapper;
  patched.set(fm, { wrapper, original, restore });
  return restore;
}
var patched = /* @__PURE__ */ new WeakMap();

// src/actions/nativeNewFileParent.ts
var import_obsidian15 = require("obsidian");
var METHODS = ["createNewMarkdownFile", "createNewFolder"];
var patched2 = /* @__PURE__ */ new WeakMap();
function installNativeCreateRedirect(app, activeRoot) {
  const fm = app.fileManager;
  const existing = patched2.get(fm);
  if (existing) return existing.restore;
  const wrappers = /* @__PURE__ */ new Map();
  const originals = /* @__PURE__ */ new Map();
  let live = true;
  const restore = () => {
    const record = patched2.get(fm);
    if (!record) return;
    patched2.delete(fm);
    live = false;
    for (const name of METHODS) {
      const mine = record.wrappers.get(name);
      const original = record.originals.get(name);
      if (!mine || !original) continue;
      if (fm[name] === mine) fm[name] = original;
    }
  };
  for (const name of METHODS) {
    const original = fm[name];
    if (typeof original !== "function") continue;
    const wrapper = function(parent, ...rest) {
      if (!live) return original.call(this, parent, ...rest);
      const redirected = pinnedFolderFor(app, parent, activeRoot);
      return original.call(this, redirected != null ? redirected : parent, ...rest);
    };
    originals.set(name, original);
    wrappers.set(name, wrapper);
    fm[name] = wrapper;
  }
  patched2.set(fm, { wrappers, originals, restore });
  return restore;
}
function pinnedFolderFor(app, parent, activeRoot) {
  if (!(parent instanceof import_obsidian15.TFolder) || !isVaultRoot(parent.path)) return void 0;
  const root = activeRoot();
  if (root === null) return void 0;
  const out = pinnedDestination(root, rootIsFolder(app, root));
  if (out.missingRoot) noticeMissingRoot();
  if (out.path === null) return void 0;
  const folder = app.vault.getAbstractFileByPath(out.path);
  return folder instanceof import_obsidian15.TFolder ? folder : void 0;
}

// src/actions/creationIntent.ts
var INTENT_TTL_MS = 1e4;
function armIntent(args) {
  var _a;
  if (!args.target.isFolder) return null;
  if (args.activeSpaceId === null) return null;
  return {
    folderPath: args.target.path,
    spaceId: args.activeSpaceId,
    expiresAt: args.now + ((_a = args.ttlMs) != null ? _a : INTENT_TTL_MS)
  };
}
function matchIntent(args) {
  const intent = args.intent;
  if (!intent) return null;
  if (args.now > intent.expiresAt) return null;
  if (args.activeSpaceId === null || args.activeSpaceId !== intent.spaceId) return null;
  if (args.created.parentPath === null) return null;
  if (args.created.parentPath !== intent.folderPath) return null;
  return {
    spaceId: intent.spaceId,
    path: args.created.path,
    kind: args.created.isFolder ? "folder" : "file"
  };
}

// src/actions/createSpaceMenu.ts
function canOfferCreateSpaceFromFolder(target, activeSpaceId) {
  return target.isFolder && !isVaultRoot(target.path) && activeSpaceId === null;
}

// src/ui/previewSeam.ts
function buildPreview(vault, ignore, tags, properties, excluded = /* @__PURE__ */ new Set()) {
  return (members) => {
    const seeds = [];
    expandMembers(
      members,
      tags,
      properties,
      // Null rather than an empty Set for the common case, the same fast path
      // `resolveMembers` takes.
      excluded.size === 0 ? null : excluded,
      // The same matcher `includedPaths` is handed below. A tag or property
      // match the vault hides is dropped during the expansion, so the number
      // under the picker counts what the space will actually show.
      ignore,
      (m) => seeds.push(m.path)
    );
    const { included } = includedPaths(vault, seeds, ignore, excluded);
    let notes = 0;
    for (const p of included) if (vault.kindOf(p) === "file") notes += 1;
    return { paths: included, notes };
  };
}

// src/api/PublicApi.ts
var PublicApi = class {
  constructor(deps) {
    this.deps = deps;
    this.listeners = /* @__PURE__ */ new Set();
    /**
     * The id last announced, so the event fires once per actual change.
     * `undefined` means nothing has been announced yet, which is distinct from
     * `null` — All, announced.
     */
    this.announced = void 0;
    /**
     * The object handed to consumers.
     *
     * Arrow functions throughout, so it survives destructuring: a plain method
     * would lose `this` the moment anyone wrote `const { isMember } = api`, which
     * is exactly the breakage a declared surface exists to prevent.
     */
    this.surface = {
      getActiveSpace: () => {
        const space = this.markedSpace();
        return space ? summarise(space) : null;
      },
      listSpaces: () => activeSpaces(this.allSpaces()).map(summarise),
      listArchivedSpaces: () => archivedSpaces(this.allSpaces()).map(summarise),
      // The contract, and why it is narrow rather than wrong, is on
      // `SpacesApi.isMember` in `types.ts`. Three rules, in this order.
      isMember: (path, spaceId) => {
        var _a;
        const space = spaceId === void 0 ? this.activeSpace() : this.spaceById(spaceId);
        if (!space) return false;
        if (pathMembers(space).some((m) => canonicalPath(m.path) === canonicalPath(path))) return true;
        if (inheritedFromFolder(space, path) === null) return false;
        const excluded = (_a = space.exclude) != null ? _a : [];
        return !excluded.some((e) => canonicalPath(e) === canonicalPath(path));
      },
      // Tag and property members carry no path and are dropped by
      // `pathMembers`. Stated on the declared surface in `types.ts`, because
      // "the exact stored member paths" is honest but no longer complete on
      // its own.
      memberPaths: (spaceId) => {
        const space = spaceId === void 0 ? this.activeSpace() : this.spaceById(spaceId);
        return space ? pathMembers(space).map((m) => m.path) : [];
      },
      onSpaceChange: (listener) => {
        this.listeners.add(listener);
        let subscribed = true;
        return () => {
          if (!subscribed) return;
          subscribed = false;
          this.listeners.delete(listener);
        };
      }
    };
  }
  /** Every stored space, or none before the store has loaded. */
  allSpaces() {
    return this.deps.spaces();
  }
  spaceById(id) {
    var _a;
    return (_a = this.allSpaces().find((s) => s.id === id)) != null ? _a : null;
  }
  /** The space the user has selected, or null in All. */
  activeSpace() {
    const sel = this.deps.selection();
    if (!sel || sel.kind === "all") return null;
    const space = this.spaceById(sel.id);
    return space && !isArchived(space) ? space : null;
  }
  /**
   * The space the TREE is filtered to. Null while filtering is paused, even
   * though a space is still selected — the body marker and the API must agree
   * with what the user can actually see.
   */
  markedSpace() {
    return this.deps.filteringPaused() ? null : this.activeSpace();
  }
  /**
   * Fires `onSpaceChange` if the marked space has changed since the last call.
   *
   * Idempotent on purpose: the caller runs on every file open as well as every
   * switch, and the body marker it sets alongside is idempotent too — but an
   * event is not, so the comparison lives here.
   */
  announce() {
    var _a;
    const space = this.markedSpace();
    const id = (_a = space == null ? void 0 : space.id) != null ? _a : null;
    if (id === this.announced) return;
    this.announced = id;
    const summary = space ? summarise(space) : null;
    for (const listener of [...this.listeners]) {
      try {
        listener(summary);
      } catch (e) {
        console.error("Spaces: an onSpaceChange subscriber threw", e);
      }
    }
  }
  /** Drops every subscriber and forgets what was announced. */
  dispose() {
    this.listeners.clear();
    this.announced = void 0;
  }
};
function summarise(space) {
  return { id: space.id, name: space.name, icon: space.icon, color: space.color };
}

// src/ui/MissingRootNotice.ts
var import_obsidian18 = require("obsidian");

// src/ui/FolderPickerPopover.ts
var import_obsidian17 = require("obsidian");

// src/ui/FolderSuggest.ts
var import_obsidian16 = require("obsidian");
var FolderSuggest = class extends import_obsidian16.AbstractInputSuggest {
  constructor(app, textInputEl, folders, onPick, onError) {
    super(app, textInputEl);
    this.folders = folders;
    this.onPick = onPick;
    this.onError = onError;
    /**
     * Tracked so a caller's document-level
     * Escape listener can tell "the popover is open, Escape should close only
     * it" from "nothing is open, Escape should close something else" —
     * `PopoverSuggest` (the Obsidian base class) exposes no public getter for
     * this, only `open()`/`close()`, which it already calls as its actual
     * entry/exit points (they are the documented, overridable public API — not
     * a private implementation detail this reaches around). Overriding them to
     * track a flag stays inside that public surface, unlike reading an internal
     * DOM class name, which the quarantine keeps private API away from
     * this file entirely.
     */
    this.popoverOpen = false;
  }
  get isPopoverOpen() {
    return this.popoverOpen;
  }
  open() {
    this.popoverOpen = true;
    super.open();
  }
  close() {
    this.popoverOpen = false;
    super.close();
  }
  getSuggestions(query) {
    try {
      return folderCandidates(this.folders, query);
    } catch (e) {
      this.onError(e);
      return [];
    }
  }
  renderSuggestion(value, el) {
    el.setText(value);
  }
  selectSuggestion(value) {
    this.onPick(value);
    this.setValue("");
    this.close();
  }
};

// src/ui/FolderPickerPopover.ts
function openFolderPickerPopover(deps) {
  let suggest = null;
  const popover = new AnchoredPopover({
    anchor: deps.anchor,
    className: "spaces-folder-picker-popover",
    ariaLabel: "Choose a folder",
    // Escape while the suggester's OWN dropdown is open must close ONLY the
    // dropdown (Obsidian's `app.keymap` `Scope` system) — the same hazard
    // and the same guard `CreateSpacePanel.ts:187` uses, and for the same
    // reason: `isPopoverOpen`, not `defaultPrevented`, because there is no
    // guarantee the keymap's own handling runs first or marks the event.
    suppressEscape: () => {
      var _a;
      return (_a = suggest == null ? void 0 : suggest.isPopoverOpen) != null ? _a : false;
    },
    // The suggester's own document-level listeners come off the moment this
    // popover closes, for ANY reason — not only the ones this file itself
    // calls `pop.close()` for.
    onClose: () => {
      suggest == null ? void 0 : suggest.close();
      suggest = null;
    },
    build: (root, pop) => {
      const doc = root.ownerDocument;
      const commit = (path) => {
        void deps.apply(path).catch((e) => {
          new import_obsidian17.Notice(`Spaces: could not change the folder (${String(e)})`);
        });
        pop.close();
      };
      const input = doc.win.createEl("input");
      input.type = "text";
      input.className = "spaces-folder-picker-input";
      input.setAttribute("aria-label", "Folder path");
      input.placeholder = "Choose a folder\u2026";
      input.value = deps.current;
      let suggestBroken = false;
      const onSuggestError = (e) => {
        suggestBroken = true;
        console.error("Spaces: folder suggester failed, degrading to plain input", e);
      };
      try {
        suggest = new FolderSuggest(deps.app, input, deps.folders, commit, onSuggestError);
      } catch (e) {
        onSuggestError(e);
      }
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!suggestBroken) return;
          const p = input.value.trim();
          if (deps.folders.kindOf(p) !== "folder") return;
          commit(p);
        } else if (e.key === "Escape") {
          if (suggest == null ? void 0 : suggest.isPopoverOpen) return;
          e.preventDefault();
          e.stopPropagation();
          pop.close();
        }
      });
      root.appendChild(input);
      if (deps.offerClear !== false) {
        const clear = doc.win.createEl("button");
        clear.textContent = "Clear";
        clear.setAttribute(
          "aria-label",
          "Clear the folder. The space stays folder pinned, with no folder chosen."
        );
        clear.addEventListener("click", () => commit(""));
        root.appendChild(clear);
      }
      input.focus();
      input.select();
    }
  });
  popover.open();
  return popover;
}

// src/ui/MissingRootNotice.ts
var MissingRootNotice = class {
  constructor(deps) {
    this.deps = deps;
    this.notice = null;
    /**
     * Which space the notice is about. One value, not a set: only the active
     * space can be in this state, and only one space is active.
     */
    this.aboutSpaceId = null;
    /**
     * The message currently displayed, so a change WHILE the same space stays
     * active — renaming it, or picking a root that is also missing — rewrites
     * the existing notice instead of stacking a second one.
     */
    this.shownKey = null;
    this.popover = null;
  }
  /** Raises, updates or withdraws the notice to match the active space. */
  report() {
    var _a;
    const space = this.deps.activeSpace();
    const detail = space ? this.detailFor(space) : null;
    if (space === null || detail === null) {
      this.clear();
      return;
    }
    const key = `${space.name} ${detail}`;
    if (this.aboutSpaceId === space.id && ((_a = this.notice) == null ? void 0 : _a.messageEl.isConnected)) {
      if (this.shownKey !== key) {
        this.shownKey = key;
        this.notice.setMessage(this.message(space, detail));
      }
      return;
    }
    this.clear();
    this.aboutSpaceId = space.id;
    this.shownKey = key;
    this.notice = new import_obsidian18.Notice(this.message(space, detail), 0);
  }
  clear() {
    var _a, _b;
    (_a = this.notice) == null ? void 0 : _a.hide();
    this.notice = null;
    this.aboutSpaceId = null;
    this.shownKey = null;
    (_b = this.popover) == null ? void 0 : _b.close();
    this.popover = null;
  }
  /** Withdraws the notice only if it is about this space — used when one is deleted. */
  clearIfAbout(spaceId) {
    if (this.aboutSpaceId === spaceId) this.clear();
  }
  /**
   * What is wrong with this space's root, or null when nothing is.
   *
   * Two different faults, worth distinguishing: a root that was chosen and has
   * since gone, versus one that was never chosen. Both render the same empty
   * tree; only the first is a fault the user did not cause.
   */
  detailFor(space) {
    if (!isFolderSpace(space)) return null;
    const root = space.root;
    const declared = typeof root === "string" && !isVaultRoot(root);
    if (declared && this.rootExists(root)) return null;
    return declared ? `"${root}" no longer exists` : "no folder has been chosen for it yet";
  }
  rootExists(root) {
    return this.deps.app().vault.getAbstractFileByPath(root) instanceof import_obsidian18.TFolder;
  }
  message(space, detail) {
    const frag = document.win.createFragment();
    const text = document.win.createSpan();
    text.textContent = `Spaces: "${space.name}" is a folder pinned space, and ${detail}. `;
    frag.appendChild(text);
    const change = document.win.createEl("button");
    change.textContent = "Change folder\u2026";
    change.className = "mod-cta";
    change.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPicker(space, change);
    });
    frag.appendChild(change);
    return frag;
  }
  openPicker(space, anchor) {
    var _a;
    (_a = this.popover) == null ? void 0 : _a.close();
    const root = space.root;
    this.popover = openFolderPickerPopover({
      anchor,
      app: this.deps.app(),
      folders: this.deps.folders(),
      current: typeof root === "string" && !isVaultRoot(root) ? root : "",
      apply: (path) => this.deps.setRoot(space.id, path)
    });
  }
};

// src/ui/SettingsTab.ts
var import_obsidian23 = require("obsidian");

// src/actions/archiveSpace.ts
async function archiveSpace(defs, id) {
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (s && !isArchived(s)) s.archived = true;
  });
}
async function restoreSpace(defs, id) {
  await defs.mutate((d) => {
    const s = d.spaces.find((x) => x.id === id);
    if (s && isArchived(s)) delete s.archived;
  });
}

// src/ui/memberList.ts
var NO_TAGS = { pathsMatching: () => [] };
function propertyMemberCount(member, index, space, ignore) {
  if (index === null) return null;
  return resolveMembers({ ...space, members: [member] }, NO_TAGS, index, ignore).length;
}
function tagMemberCount(tag, tags, ignore) {
  let n = 0;
  for (const path of tags.pathsMatching(tag)) if (!ignore.matches(path)) n += 1;
  return n;
}
function memberRows(space, exists, matchCount, propertyCount) {
  return space.members.flatMap((m) => {
    if (m.kind === "property") {
      const count = propertyCount === void 0 ? null : propertyCount(m);
      return [
        {
          kind: "property",
          key: m.key,
          ...m.value === void 0 ? {} : { value: m.value },
          // Through `valueLabel`, which is why that function exists: a member
          // stored with the empty string — the picker's "Empty string" row is
          // the one thing that can make one — drew `status: ` with nothing
          // after the colon, next to the existence member `status`, and the
          // same for a value that is only blanks. The picker already named
          // them; the row, the Remove tooltip and the failure notice all read
          // this label, so naming them once here covers all three.
          label: m.value === void 0 ? m.key : `${m.key}: ${valueLabel(m.value)}`,
          status: count === 0 ? "matches-nothing" : "present",
          matchCount: count
        }
      ];
    }
    if (m.kind === "tag") {
      const count = matchCount === void 0 ? null : matchCount(m.tag);
      return [
        {
          kind: "tag",
          tag: m.tag,
          status: count === 0 ? "matches-nothing" : "present",
          matchCount: count
        }
      ];
    }
    if (!exists(m.path)) {
      return [{ path: m.path, kind: m.kind, status: "missing", coveredBy: null }];
    }
    const coveredBy = inheritedFromFolder(space, m.path);
    return [
      {
        path: m.path,
        kind: m.kind,
        status: coveredBy === null ? "present" : "redundant",
        coveredBy
      }
    ];
  });
}
function exclusionRows(space, exists) {
  var _a;
  return ((_a = space.exclude) != null ? _a : []).map((path) => ({
    path,
    status: exists(path) ? "present" : "missing"
  }));
}
function missingCount(rows) {
  return rows.filter((r) => r.status === "missing").length;
}
function withoutMember(members, path) {
  return members.filter((m) => m.kind !== "file" && m.kind !== "folder" || m.path !== path);
}
function withoutTagMember(members, tag) {
  return members.filter((m) => m.kind !== "tag" || m.tag !== tag);
}
function withoutPropertyMember(members, identity) {
  return members.filter((m) => m.kind !== "property" || memberIdentity(m) !== identity);
}
function memberSummary(rows) {
  if (rows.length === 0) return "No members";
  const total = `${rows.length} ${rows.length === 1 ? "member" : "members"}`;
  const attention = rows.filter((r) => r.status !== "present").length;
  if (attention === 0) return total;
  return `${total} \xB7 ${attention} ${attention === 1 ? "needs" : "need"} attention`;
}
function spaceRowSummary(space, exists, matchCount) {
  const root = space.root;
  if (typeof root === "string") {
    if (!isVaultRoot(root)) {
      return exists(root) ? `Folder pinned \xB7 ${root}` : `Folder pinned \xB7 ${root} (missing)`;
    }
    return "Folder pinned \xB7 no folder chosen yet";
  }
  return `Curated \xB7 ${memberSummary(memberRows(space, exists, matchCount))}`;
}

// src/ui/ConfirmModal.ts
var import_obsidian19 = require("obsidian");
var ConfirmModal = class extends import_obsidian19.Modal {
  constructor(app, prompt) {
    super(app);
    this.prompt = prompt;
    this.answered = false;
    this.settle = null;
  }
  /** Opens the modal and resolves once the user has answered, or dismissed. */
  ask() {
    return new Promise((resolve) => {
      this.settle = resolve;
      this.open();
    });
  }
  answer(confirmed) {
    var _a;
    if (this.answered) return;
    this.answered = true;
    (_a = this.settle) == null ? void 0 : _a.call(this, confirmed);
  }
  onOpen() {
    this.titleEl.setText(this.prompt.title);
    this.contentEl.createEl("p", { text: this.prompt.body });
    let cancelEl = null;
    new import_obsidian19.Setting(this.contentEl).addButton((b) => {
      cancelEl = b.buttonEl;
      return b.setButtonText("Cancel").setCta().onClick(() => {
        this.close();
      });
    }).addButton(
      (b) => b.setButtonText(this.prompt.confirmLabel).setDestructive().onClick(() => {
        this.answer(true);
        this.close();
      })
    );
    cancelEl == null ? void 0 : cancelEl.focus();
  }
  onClose() {
    this.answer(false);
    this.contentEl.empty();
  }
};

// src/ui/SpaceContentsModal.ts
var import_obsidian21 = require("obsidian");

// src/ui/TagSuggest.ts
var import_obsidian20 = require("obsidian");
var TagSuggest = class extends import_obsidian20.AbstractInputSuggest {
  constructor(app, textInputEl, tags, onPick, onError) {
    super(app, textInputEl);
    this.tags = tags;
    this.onPick = onPick;
    this.onError = onError;
    /**
     * Tracked exactly as `FolderSuggest` tracks it, and for the same class of
     * question: the caller's own Enter handler has to tell "the dropdown is
     * open, Obsidian's keymap is picking a suggestion" from "nothing is open,
     * commit what was typed". `PopoverSuggest` exposes no public getter for
     * this, only `open()`/`close()`, which are its documented, overridable
     * entry and exit points, so tracking a flag through them stays inside the
     * public surface.
     */
    this.popoverOpen = false;
  }
  get isPopoverOpen() {
    return this.popoverOpen;
  }
  open() {
    this.popoverOpen = true;
    super.open();
  }
  close() {
    this.popoverOpen = false;
    super.close();
  }
  getSuggestions(query) {
    try {
      const offered = tagCandidates(this.tags, query);
      if (offered === null) {
        this.onError(new Error("the tag source could not list the vault's tags"));
        return [];
      }
      return offered;
    } catch (e) {
      this.onError(e);
      return [];
    }
  }
  renderSuggestion(value, el) {
    el.setText("#" + value);
  }
  selectSuggestion(value) {
    this.onPick(value);
    this.setValue("");
    this.close();
  }
};

// src/ui/SpaceContentsModal.ts
function tagRowDescription(row) {
  if (row.matchCount === null) return "Tag. Nested tags included.";
  if (row.status === "matches-nothing") {
    return "Tag. No notes shown. Check Ignored paths if you expected some.";
  }
  const notes = row.matchCount === 1 ? "note" : "notes";
  return `Tag. ${row.matchCount} ${notes}, nested tags included.`;
}
function propertyRowDescription(row) {
  if (row.matchCount === null) return "Property.";
  if (row.status === "matches-nothing") {
    return "Property. No notes shown. Check Ignored paths if you expected some.";
  }
  const notes = row.matchCount === 1 ? "note" : "notes";
  return `Property. ${row.matchCount} ${notes}.`;
}
var propertyListSeq = 0;
var SpaceContentsModal = class extends import_obsidian21.Modal {
  constructor(app, defs, spaceId, tagIndex, propertyIndex) {
    super(app);
    this.defs = defs;
    this.spaceId = spaceId;
    this.tagIndex = tagIndex;
    this.propertyIndex = propertyIndex;
    /**
     * The live tag suggester, retained for the same reason
     * `openFolderPickerPopover` retains its `FolderSuggest`: it owns a popover
     * and document-level listeners that are NOT parented under `contentEl`, so
     * emptying the dialog on re-render or on close would strand them. Null when
     * nothing is mounted, and null when construction threw and the field
     * degraded to a plain input.
     */
    this.tagSuggest = null;
  }
  onOpen() {
    this.render();
  }
  onClose() {
    this.releaseTagSuggest();
    this.contentEl.empty();
  }
  /**
   * Re-read from the store on every render rather than closing over a
   * snapshot: removing a member mutates `defs`, and a stale copy would leave
   * the dialog showing a row that no longer exists.
   */
  render() {
    const { contentEl } = this;
    this.releaseTagSuggest();
    contentEl.empty();
    const space = this.defs.get().spaces.find((s) => s.id === this.spaceId);
    if (!space) {
      contentEl.createEl("p", { text: "This space no longer exists." });
      return;
    }
    this.titleEl.setText(`Contents of ${space.name}`);
    let tags = null;
    const ignore = compileIgnore(this.defs.get().settings.globalIgnore);
    const matchCount = (tag) => {
      tags != null ? tags : tags = this.tagIndex();
      return tagMemberCount(tag, tags, ignore);
    };
    const exists = (path) => this.app.vault.getAbstractFileByPath(path) !== null;
    let properties;
    const propertyIndexOnce = () => {
      if (properties === void 0) properties = this.propertyIndex();
      return properties;
    };
    const propertyCount = (m) => propertyMemberCount(m, propertyIndexOnce(), space, ignore);
    const rows = memberRows(space, exists, matchCount, propertyCount);
    this.renderTagAdder(contentEl, space);
    this.renderPropertyAdder(contentEl, space, propertyIndexOnce);
    if (rows.length === 0) {
      this.renderEmpty(contentEl);
    } else {
      for (const row of rows) {
        if (row.kind === "tag") this.renderTagRow(contentEl, space, row);
        else if (row.kind === "property") this.renderPropertyRow(contentEl, space, row);
        else this.renderMemberRow(contentEl, space, row);
      }
    }
    this.renderExclusions(contentEl, space, exists);
  }
  /**
   * A space with no members shows every file in the vault as a visitor and
   * nothing as its own, which looks broken rather than empty. Saying how to
   * fix it costs one sentence and is the only guidance this dialog can give.
   */
  renderEmpty(containerEl) {
    containerEl.createEl("p", {
      text: "This space is empty. Right-click a note or folder in the explorer and choose \u201CAdd to space\u201D, or add a tag or a property above."
    });
  }
  /**
   * The add-a-tag field, and the only way to add a tag member at all.
   *
   * Construction is wrapped and the throw reported, following
   * `openFolderPickerPopover`: `AbstractInputSuggest` needs a real `App` and
   * builds its own popover, and an uncaught throw here would take the whole
   * dialog down with it. On a failure the field stays a plain text input and
   * Enter still commits, so the feature degrades instead of dying silently.
   *
   * Enter is handled only while the suggester's own dropdown is CLOSED. With
   * it open, Obsidian's keymap is already picking the highlighted suggestion,
   * and committing the raw input text as well would add whatever prefix the
   * user had typed alongside the tag they actually chose. `isPopoverOpen`
   * rather than `defaultPrevented`, for the reason `FolderPickerPopover`
   * records: there is no guarantee the keymap's handling runs first or marks
   * the event.
   *
   * A tag no note carries yet is still a legitimate member, so the typed value
   * is committed as given rather than checked against the vault first. That is
   * the difference from the folder field, which rejects a path that is not a
   * folder.
   */
  renderTagAdder(containerEl, space) {
    new import_obsidian21.Setting(containerEl).setName("Add a tag").setDesc("Type a tag to add every note carrying it, or a tag nested under it.").addText((t) => {
      t.setPlaceholder("Tag name");
      t.inputEl.setAttribute("aria-label", `Add a tag to ${space.name}`);
      let told = false;
      const onSuggestError = (e) => {
        console.error("Spaces: tag suggester failed, degrading to plain input", e);
        if (told) return;
        told = true;
        new import_obsidian21.Notice("Spaces: tag suggestions are unavailable. Type the full tag to add it.");
      };
      try {
        this.tagSuggest = new TagSuggest(
          this.app,
          t.inputEl,
          // The private-API call stays behind its quarantine module; the
          // suggester is handed a source the same way FolderSuggest is.
          { knownTags: () => nativeKnownTags(this.app) },
          (tag) => {
            void this.addTag(tag);
          },
          onSuggestError
        );
      } catch (e) {
        onSuggestError(e);
        this.tagSuggest = null;
      }
      t.inputEl.addEventListener("keydown", (e) => {
        var _a;
        if (e.key !== "Enter") return;
        if (((_a = this.tagSuggest) == null ? void 0 : _a.isPopoverOpen) === true) return;
        e.preventDefault();
        void this.addTag(t.getValue());
      });
    });
  }
  /**
   * The add-a-property fields: a key, an optional value, and an Add button.
   *
   * An empty value adds "has this property"; a value adds "equals this value".
   * What the two fields mean, which keys are refused and what counts as
   * already held is all `readPropertyAdd`, so this method draws and does not
   * decide. The key field suggests the vault's pickable keys through a
   * `datalist`; typing a key the vault does not hold yet is allowed, as for
   * tags.
   *
   * THE SUGGESTIONS ARE FILLED ON FIRST TOUCH OF THE KEY FIELD, not at
   * render. Filling them at render asked for the property index on every
   * open, which is a full frontmatter walk of the vault — paid by a folder,
   * path or tag space that holds no property member at all, which is the one
   * case the budget says costs nothing. The gate is the user engaging the
   * control, NOT the space holding a property member: a space with none is
   * exactly the space whose adder is most needed.
   *
   * Focus AND input, because a key can arrive by typing into a field the
   * pointer never focused (a paste into an already-focused field after the
   * dialog re-rendered), and because the browser only consults a `datalist`
   * when the field is engaged. Either way the list is in place before a
   * suggestion could be shown.
   *
   * A null index is the only case that says the properties are still loading,
   * and it can only be known once asked, so that sentence is added on first
   * touch rather than drawn with the field. An index with no keys draws no
   * suggestions and says nothing, because the vault having no properties is
   * not the same as not knowing yet.
   */
  renderPropertyAdder(containerEl, space, takeIndex) {
    const instruction = "Type a property to add every note that has it. Add a value to add only the notes where the property equals it.";
    const setting = new import_obsidian21.Setting(containerEl).setName("Add a property").setDesc(instruction);
    const listId = `spaces-property-keys-${++propertyListSeq}`;
    const list = setting.controlEl.createEl("datalist", { attr: { id: listId } });
    let filled = false;
    const fillSuggestions = () => {
      if (filled) return;
      filled = true;
      const index = takeIndex();
      if (index === null) {
        setting.setDesc(
          "Suggestions appear once the vault's properties have loaded. " + instruction
        );
        return;
      }
      for (const { key } of pickableKeys(index.listKeys(), "")) {
        list.createEl("option", { attr: { value: key } });
      }
    };
    let keyEl;
    let valueEl;
    setting.addText((t) => {
      t.setPlaceholder("Property");
      t.inputEl.setAttribute("aria-label", `Property to add to ${space.name}`);
      t.inputEl.setAttribute("list", listId);
      t.inputEl.addEventListener("focus", fillSuggestions);
      t.inputEl.addEventListener("input", fillSuggestions);
      keyEl = t.inputEl;
    });
    setting.addText((t) => {
      t.setPlaceholder("Value (optional)");
      t.inputEl.setAttribute("aria-label", `Property value to add to ${space.name}`);
      valueEl = t.inputEl;
    });
    const commit = () => {
      void this.addProperty(keyEl.value, valueEl.value);
    };
    for (const el of [keyEl, valueEl]) {
      el.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        commit();
      });
    }
    setting.addButton(
      (b) => b.setButtonText("Add").setTooltip(`Add the property to ${space.name}`).onClick(commit)
    );
  }
  /**
   * One row per STORED path member — `members` holds only exact members,
   * inherited ones are computed and never stored, so every row here is
   * something the user added deliberately. The useful question per row is
   * whether it still does anything.
   *
   * Remove is offered on every row, including a healthy one. This is the
   * bulk-management surface, and a list where only broken rows were
   * actionable would be a worse tool than the explorer row's own menu.
   */
  renderMemberRow(containerEl, space, row) {
    const note = row.status === "missing" ? "Missing. Nothing at this path. Kept in case it comes back." : row.status === "redundant" ? `Redundant. Already covered by ${row.coveredBy}.` : row.kind === "folder" ? "Folder. Everything inside it is in the space too." : "Note.";
    const setting = new import_obsidian21.Setting(containerEl).setName(row.path).setDesc(note).addButton(
      (b) => b.setButtonText("Remove").setTooltip(`Remove ${row.path} from ${space.name}`).onClick(() => {
        void this.write((target) => {
          target.members = withoutMember(target.members, row.path);
        }, `could not remove ${row.path}`);
      })
    );
    setting.settingEl.addClass("spaces-member-row");
    if (row.status === "missing") setting.settingEl.addClass("is-missing");
  }
  /**
   * A tag member's row. Shown with the leading `#` it is stored without, so it
   * reads the way a tag reads everywhere else in Obsidian.
   *
   * The count is the point of the row. A tag member's contents are invisible
   * in the definition, and the number is the only way to see that a tag is
   * bringing in what the user thought it was. A tag reaching nothing says so
   * in words rather than being dimmed like a missing path: nothing has been
   * lost, the entry is fine, and no note carries it yet.
   *
   * Remove is a text button matching the path rows beside it, not an icon: one
   * list with two removal affordances reads as two lists.
   */
  renderTagRow(containerEl, space, row) {
    const setting = new import_obsidian21.Setting(containerEl).setName(`#${row.tag}`).setDesc(tagRowDescription(row)).addButton(
      (b) => b.setButtonText("Remove").setTooltip(`Remove #${row.tag} from ${space.name}`).onClick(() => {
        void this.write((target) => {
          target.members = withoutTagMember(target.members, row.tag);
        }, `could not remove #${row.tag}`);
      })
    );
    setting.settingEl.addClass("spaces-member-row");
  }
  /**
   * A property member's row, drawn as the key or `key: value` and removed by
   * its identity, which is how two spellings of one member are told apart from
   * two members. It names no path, so it is never dimmed as missing.
   */
  renderPropertyRow(containerEl, space, row) {
    const identity = memberIdentity(
      row.value === void 0 ? { kind: "property", key: row.key } : { kind: "property", key: row.key, value: row.value }
    );
    const setting = new import_obsidian21.Setting(containerEl).setName(row.label).setDesc(propertyRowDescription(row)).addButton(
      (b) => b.setButtonText("Remove").setTooltip(`Remove ${row.label} from ${space.name}`).onClick(() => {
        void this.write((target) => {
          target.members = withoutPropertyMember(target.members, identity);
        }, `could not remove ${row.label}`);
      })
    );
    setting.settingEl.addClass("spaces-member-row");
  }
  /**
   * The paths this space leaves out, drawn only when there is at least one.
   *
   * An exclusion is written when a note is removed from a space that no member
   * names directly, because it was there through a folder or a tag. It shows
   * up nowhere in the member list, so this section is the only place it can be
   * seen or undone.
   *
   * A row says something only when something is wrong with it, which is the
   * rule the member rows and `memberSummary` already follow. What can be
   * wrong is that nothing lives at the path any more: the entry is as dead as
   * a missing member and just as impossible to spot from the file tree, so it
   * gets the same word and the same dimmed styling.
   */
  renderExclusions(containerEl, space, exists) {
    const rows = exclusionRows(space, exists);
    if (rows.length === 0) return;
    new import_obsidian21.Setting(containerEl).setName("Left out").setHeading();
    for (const { path, status } of rows) {
      const setting = new import_obsidian21.Setting(containerEl).setName(path).addButton(
        (b) => b.setButtonText("Put back").setTooltip(`Put ${path} back in ${space.name}`).onClick(() => {
          void this.write((target) => {
            var _a;
            const kept = ((_a = target.exclude) != null ? _a : []).filter((e) => e !== path);
            if (kept.length > 0) target.exclude = kept;
            else delete target.exclude;
          }, `could not put ${path} back`);
        })
      );
      if (status === "missing") {
        setting.setDesc("Missing. Nothing at this path. Put it back to clear the entry.");
        setting.settingEl.addClass("is-missing");
      }
      setting.settingEl.addClass("spaces-member-row");
    }
  }
  /**
   * Adds a tag member in the stored form.
   *
   * An empty value is dropped rather than stored: `tagMatches` would treat a
   * member of `""` as the prefix of every tag and quietly pull in the vault.
   *
   * A tag already held is a no-op rather than a second identical row, which is
   * reachable by typing a tag that is already a member.
   */
  async addTag(tag) {
    const normalized = normalizeTag(tag);
    if (normalized.length === 0) return;
    await this.write((target) => {
      const held = target.members.some((m) => m.kind === "tag" && m.tag === normalized);
      if (!held) target.members.push({ kind: "tag", tag: normalized });
    }, `could not add #${normalized}`);
  }
  /**
   * Adds a property member to this space and touches nothing else.
   *
   * Read against the space as it is NOW, not as it was drawn, so a member
   * added in another window since the last render is still seen as held.
   * Nothing is written for a refusal or a held member: the person is told, and
   * what they typed stays in the fields.
   *
   * The index is asked for HERE and nowhere else on this path, which is a
   * walk of the vault's frontmatter the first time after a metadata event.
   * That is the user asking for it, which is the one thing allowed to pay.
   */
  async addProperty(keyText, valueText) {
    const space = this.defs.get().spaces.find((s) => s.id === this.spaceId);
    if (!space) return;
    const index = this.propertyIndex();
    const read = readPropertyAdd(
      space.members,
      keyText,
      valueText,
      // NULL, not an empty set: "nobody has read the vault" is not "the vault
      // holds no keys", and only the second one can refuse a padded key.
      index === null ? null : new Set(index.listKeys().map((k) => k.key))
    );
    if (read.outcome === "blank") {
      new import_obsidian21.Notice("Spaces: type a property name to add.");
      return;
    }
    if (read.outcome === "unknown-keys") {
      new import_obsidian21.Notice(STILL_READING);
      return;
    }
    if (read.outcome === "spaced") {
      new import_obsidian21.Notice(
        "Spaces: no property in this vault is spelled that way. Remove the spaces at the ends."
      );
      return;
    }
    if (read.outcome === "tags") {
      new import_obsidian21.Notice("Spaces: tags are added in the tag field above.");
      return;
    }
    if (read.outcome === "held") {
      new import_obsidian21.Notice(`${read.label} is already in ${space.name}.`);
      return;
    }
    const { member } = read;
    await this.write((target) => {
      target.members = addPropertyMember(target, member).members;
    }, "could not add the property");
  }
  /**
   * Every write this dialog makes goes through here.
   *
   * `mutate` can reject, because the store persists to disk, and a rejection
   * that only re-rendered would show the user an unchanged list with no
   * explanation. The space is re-found inside the callback rather than handed
   * in: it can be deleted between the render that drew the button and the
   * click on it, and a missing target is then simply no write.
   *
   * Re-renders in place rather than closing, because clearing several stale
   * entries in one sitting is the whole reason this surface exists.
   */
  async write(change, failure) {
    try {
      await this.defs.mutate((d) => {
        const target = d.spaces.find((s) => s.id === this.spaceId);
        if (target) change(target);
      });
    } catch (e) {
      new import_obsidian21.Notice(`Spaces: ${failure} (${String(e)})`);
      return;
    }
    this.render();
  }
  /**
   * Drops the suggester before the input it is attached to is destroyed.
   * `close()` takes down its own popover and its document-level listeners, and
   * nothing else will, because neither lives under `contentEl`.
   */
  releaseTagSuggest() {
    var _a;
    (_a = this.tagSuggest) == null ? void 0 : _a.close();
    this.tagSuggest = null;
  }
};

// src/ui/restoreCheck.ts
function restoreProblems(space, kindAt) {
  const problems = [];
  for (const m of pathMembers(space)) {
    if (kindAt(m.path) !== m.kind) {
      problems.push({ kind: "member", path: m.path, memberKind: m.kind });
    }
  }
  const root = space.root;
  if (typeof root === "string" && root !== "" && root !== "/" && kindAt(root) !== "folder") {
    problems.push({ kind: "root", path: root });
  }
  return problems;
}

// src/ui/RestoreSpaceModal.ts
var import_obsidian22 = require("obsidian");

// src/order/orderModel.ts
function applyOrder(order, live) {
  if (!order || order.length === 0) return live;
  const liveSet = new Set(live);
  const listed = order.filter((p) => liveSet.has(p));
  if (listed.length === 0) return live;
  const claimed = new Set(listed);
  const rest = live.filter((p) => !claimed.has(p));
  return [...listed, ...rest];
}
function clampIndex(i, len) {
  if (i < 0) return 0;
  if (i > len) return len;
  return i;
}
function moveWithin(order, path, toIndex) {
  const from = order.indexOf(path);
  if (from === -1) return order;
  const without = order.filter((p) => p !== path);
  const at = clampIndex(toIndex, without.length);
  return [...without.slice(0, at), path, ...without.slice(at)];
}
function insertAt(order, path, toIndex) {
  if (order.includes(path)) return moveWithin(order, path, toIndex);
  const at = clampIndex(toIndex, order.length);
  return [...order.slice(0, at), path, ...order.slice(at)];
}
function compact(order, live) {
  return order.filter((p) => live.has(p));
}

// src/ui/RestoreSpaceModal.ts
function checkedPaths(space) {
  if (hasRoot(space)) {
    const root = rootOf(space);
    return root === null ? [] : [root];
  }
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const m of space.members) {
    if (m.kind !== "file" && m.kind !== "folder") continue;
    if (seen.has(m.path)) continue;
    seen.add(m.path);
    out.push(m.path);
  }
  return out;
}
function restoreRows(space, problems) {
  const folderSpace = hasRoot(space);
  const rows = [];
  const seen = /* @__PURE__ */ new Set();
  for (const p of problems) {
    if (p.kind === "root") {
      rows.push({ kind: "root", path: p.path, memberKind: "folder" });
      continue;
    }
    if (folderSpace) continue;
    if (seen.has(p.path)) continue;
    seen.add(p.path);
    rows.push({ kind: "member", path: p.path, memberKind: p.memberKind });
  }
  return rows;
}
function actionsFor(row) {
  return row.kind === "root" ? ["point", "leave"] : ["point", "remove", "leave"];
}
function pointProblem(row, to, kindOf, source = "typed", taken = /* @__PURE__ */ new Set()) {
  const path = to.trim();
  if (path === "") return "Type a path first.";
  if (path === row.path) return "That is the path that is missing. Pick a different one.";
  if (isVaultRoot(path)) {
    return row.kind === "root" ? "A space cannot show the whole vault. Pick a folder inside it." : "The vault root is not a note or a folder a space can hold. Pick one inside it.";
  }
  if (!isSafeVaultPath(path)) {
    return "Not a vault path. Give a path inside the vault, 1000 characters or fewer, with forward slashes, no leading slash, no drive letter, and no . or .. steps.";
  }
  if (taken.has(path)) {
    return "That is already in this space. Pick a different path, or Remove from space.";
  }
  const kind = kindOf(path);
  if (kind === null) {
    return source === "folder-pick" ? "Nothing by that name in that folder. Edit the name, or choose another folder." : "No note or folder at that path. Check the spelling.";
  }
  if (kind !== row.memberKind) {
    return kind === "folder" ? "That is a folder. Pick a note." : "That is a note. Pick a folder.";
  }
  return null;
}
function restoreTitle(space) {
  return `Restore ${space.name}`;
}
function restoreLede(ok, bad, rootOnly = false) {
  if (rootOnly) return "The folder this space is pinned to is missing.";
  return `${bad} of ${ok + bad} missing`;
}
function rowSource(row) {
  if (row.kind === "root") return "Pinned folder";
  return row.memberKind === "folder" ? "Folder you added to this space" : "Note you added to this space";
}
function rowProblem(row) {
  return row.memberKind === "folder" ? "No folder at this path" : "No note at this path";
}
function stagedText(row, fix) {
  if (!fix) return rowProblem(row);
  if (fix.kind === "remove-member") return "Taking it out of the space";
  return `Pointing at ${fix.to}`;
}
function dirnameOf2(path) {
  const i = path.lastIndexOf("/");
  return i === -1 ? "" : path.slice(0, i);
}
function repointInOrder(map, from, to) {
  var _a;
  let at = -1;
  for (const [key2, list] of Object.entries(map)) {
    const i = list.indexOf(from);
    if (i === -1) continue;
    if (at === -1) at = i;
    const kept = list.filter((p) => p !== from);
    if (kept.length > 0) map[key2] = kept;
    else delete map[key2];
  }
  if (at === -1) return;
  const key = dirnameOf2(to);
  map[key] = insertAt((_a = map[key]) != null ? _a : [], to, at);
}
function dropFromOrder(map, path) {
  for (const [key, list] of Object.entries(map)) {
    if (!list.includes(path)) continue;
    const kept = list.filter((p) => p !== path);
    if (kept.length > 0) map[key] = kept;
    else delete map[key];
  }
}
function followExclusions(space, from, to) {
  const next = repairExclude(space.exclude, from, to);
  if (next) space.exclude = next;
  else delete space.exclude;
}
function sourceOf(fix) {
  return fix.kind === "remove-member" ? fix.path : fix.from;
}
function inApplyOrder(fixes) {
  return [...fixes].sort((a, b) => sourceOf(b).length - sourceOf(a).length);
}
function applyRestoreFixes(draft, spaceId, fixes) {
  var _a, _b;
  const space = draft.spaces.find((s) => s.id === spaceId);
  if (!space) return { missing: true, skipped: [...fixes] };
  const order = (_b = (_a = draft.orders) == null ? void 0 : _a.bySpaceId) == null ? void 0 : _b[spaceId];
  const skipped = [];
  for (const fix of inApplyOrder(fixes)) {
    if (fix.kind === "point-root") {
      if (space.root !== fix.from) {
        skipped.push(fix);
        continue;
      }
      followExclusions(space, fix.from, fix.to);
      space.root = fix.to;
      continue;
    }
    if (fix.kind === "point-member") {
      let hit = false;
      for (const m of space.members) {
        if ((m.kind === "file" || m.kind === "folder") && m.path === fix.from) {
          m.path = fix.to;
          hit = true;
        }
      }
      if (!hit) {
        skipped.push(fix);
        continue;
      }
      followExclusions(space, fix.from, fix.to);
      if (order) repointInOrder(order, fix.from, fix.to);
      continue;
    }
    const before = space.members.length;
    space.members = space.members.filter(
      (m) => !((m.kind === "file" || m.kind === "folder") && m.path === fix.path)
    );
    if (space.members.length === before) {
      skipped.push(fix);
      continue;
    }
    if (order) dropFromOrder(order, fix.path);
  }
  delete space.archived;
  skipped.sort((a, b) => fixes.indexOf(a) - fixes.indexOf(b));
  return { missing: false, skipped };
}
async function commitRestore(defs, spaceId, fixes) {
  let outcome = { missing: true, skipped: [...fixes] };
  await defs.mutate((d) => {
    outcome = applyRestoreFixes(d, spaceId, fixes);
  });
  return outcome;
}
function restoreReport(spaceName, outcome) {
  if (outcome.missing) {
    return `Spaces: "${spaceName}" was deleted somewhere else, so there was nothing to restore.`;
  }
  if (outcome.skipped.length === 0) return null;
  const paths = outcome.skipped.map(sourceOf);
  const named = paths.slice(0, 3).map((p) => `"${p}"`).join(", ");
  const more = paths.length > 3 ? `, and ${paths.length - 3} more` : "";
  if (paths.length === 1) {
    return `Spaces: restored "${spaceName}" without one of your changes. ${named} changed while the window was open. Check the space and set it again.`;
  }
  return `Spaces: restored "${spaceName}" without ${paths.length} of your changes. ${named}${more} changed while the window was open. Check the space and set them again.`;
}
var RestoreGate = class {
  constructor(rows, io) {
    this.rows = rows;
    this.io = io;
    this.staged = /* @__PURE__ */ new Map();
    /**
     * Set for the length of one write, so a second Restore click cannot start a
     * second one. Without the guard it would: `restore()` is async and the
     * button stays live while the write is in flight.
     */
    this.running = false;
  }
  /** Stage "this is that now". The caller validates with `pointProblem` first. */
  point(index, to) {
    const row = this.rows[index];
    if (!row) return;
    this.staged.set(
      index,
      row.kind === "root" ? { kind: "point-root", from: row.path, to } : { kind: "point-member", from: row.path, to }
    );
  }
  /** Stage a removal. Never offered for a root — see `actionsFor`. */
  remove(index) {
    const row = this.rows[index];
    if (!row || row.kind === "root") return;
    this.staged.set(index, { kind: "remove-member", path: row.path });
  }
  /** Back to the default: no fix for this row. */
  leave(index) {
    this.staged.delete(index);
  }
  stagedAt(index) {
    return this.staged.get(index);
  }
  /** In row order, so the write is in the order the user read. */
  fixes() {
    return this.rows.map((_, i) => this.staged.get(i)).filter((f) => f !== void 0);
  }
  /**
   * Write, then close. A failed write keeps the modal open with every
   * decision intact: the alternative is closing on a write that did not land
   * and losing work the user cannot see was lost.
   */
  async restore() {
    if (this.running) return false;
    this.running = true;
    let outcome;
    try {
      outcome = await this.io.apply(this.fixes());
    } catch (e) {
      this.io.onError(String(e));
      return false;
    } finally {
      this.running = false;
    }
    this.io.onReport(outcome);
    this.io.close();
    return true;
  }
  /** Writes nothing at all. Still archived, nothing re-pointed, nothing removed. */
  cancel() {
    this.io.close();
  }
};
function basenameOf(path) {
  const i = path.lastIndexOf("/");
  return i === -1 ? path : path.slice(i + 1);
}
var RestoreSpaceModal = class extends import_obsidian22.Modal {
  constructor(app, deps) {
    super(app);
    this.deps = deps;
    this.suggests = [];
    /**
     * The folder picker, held rather than discarded.
     *
     * `openFolderPickerPopover` returns it so its opener can close it:
     * `AnchoredPopover` does not own its own lifetime, and its four document
     * and window listeners come off only on `close()`. Its dismissal rules
     * close it for every ordinary gesture, so the gap is an unload with the
     * picker open, which is what `MissingRootNotice` keeps its own reference
     * for.
     */
    this.picker = null;
    this.gate = new RestoreGate(deps.rows, {
      apply: (fixes) => deps.apply(fixes),
      close: () => this.close(),
      onError: (message) => {
        new import_obsidian22.Notice(`Spaces: could not restore "${deps.space.name}" (${message})`);
      },
      onReport: (outcome) => {
        const message = restoreReport(deps.space.name, outcome);
        if (message !== null) new import_obsidian22.Notice(message);
      }
    });
  }
  onOpen() {
    const { space, rows } = this.deps;
    this.titleEl.setText(restoreTitle(space));
    const ok = checkedPaths(space).length - rows.length;
    const rootOnly = rows.length === 1 && rows[0].kind === "root";
    this.contentEl.createEl("p", { text: restoreLede(ok, rows.length, rootOnly) });
    rows.forEach((row, i) => this.renderRow(row, i));
    let cancelEl = null;
    new import_obsidian22.Setting(this.contentEl).addButton((b) => {
      cancelEl = b.buttonEl;
      return b.setButtonText("Cancel").onClick(() => {
        this.gate.cancel();
      });
    }).addButton(
      (b) => b.setButtonText("Restore").setCta().onClick(() => {
        void this.gate.restore().then((done) => {
          if (done) this.deps.onRestored();
        });
      })
    );
    cancelEl == null ? void 0 : cancelEl.focus();
  }
  /**
   * One broken path, as a row the person can answer.
   *
   * **The path is STATIC.** It used to be the value of a text field, which put
   * the one thing the row is about into a box the reader could edit and then
   * no longer recognise, and which duplicated the row name beside it. The
   * field now appears only when it is asked for, starts EMPTY, and sits on its
   * own line, so the broken path stays readable above whatever is typed.
   *
   * **At most three controls, and never more than one line of them.** Five
   * (field, Point here, Choose…, Remove from space, Leave as is) overflowed
   * the modal and squeezed the row name to nothing, which is why the path was
   * not visible at all. Leaving a row alone is the default and needs no
   * button; once something IS staged, the three collapse to a single Undo.
   */
  renderRow(row, index) {
    const setting = new import_obsidian22.Setting(this.contentEl).setName(row.path);
    const typedRow = new import_obsidian22.Setting(this.contentEl);
    typedRow.settingEl.hide();
    let input = null;
    const stage = (to, source = "typed") => {
      const problem = pointProblem(
        row,
        to,
        (p) => this.deps.source.kindOf(p),
        source,
        this.takenPaths(index)
      );
      if (problem !== null) {
        if (input) input.value = to;
        new import_obsidian22.Notice(`Spaces: ${problem}`);
        return;
      }
      this.gate.point(index, to.trim());
      redraw();
    };
    typedRow.addText((t) => {
      input = t.inputEl;
      t.setPlaceholder(
        row.memberKind === "folder" ? "New path of the folder" : "New path of the note"
      );
      t.inputEl.addEventListener("keydown", (e) => {
        if (e.key === "Enter") stage(t.inputEl.value);
      });
      if (row.memberKind !== "folder") return;
      try {
        this.suggests.push(
          new FolderSuggest(
            this.app,
            t.inputEl,
            this.deps.source,
            // `selectSuggestion` clears the input after this runs, so the pick
            // is staged rather than written back into the field.
            (path) => stage(path),
            (e) => console.error("Spaces: folder suggester failed in the restore gate", e)
          )
        );
      } catch (e) {
        console.error("Spaces: folder suggester failed in the restore gate", e);
      }
    });
    typedRow.addButton((b) => b.setButtonText("Apply").onClick(() => {
      var _a;
      return stage((_a = input == null ? void 0 : input.value) != null ? _a : "");
    }));
    const redraw = () => {
      const fix = this.gate.stagedAt(index);
      setting.setDesc(`${rowSource(row)} \xB7 ${stagedText(row, fix)}`);
      setting.controlEl.empty();
      if (fix !== void 0) {
        typedRow.settingEl.hide();
        setting.addButton(
          (b) => b.setButtonText("Undo").onClick(() => {
            this.gate.leave(index);
            if (input) input.value = "";
            redraw();
          })
        );
        return;
      }
      setting.addButton(
        (b) => b.setButtonText("Choose folder\u2026").onClick(() => {
          var _a;
          (_a = this.picker) == null ? void 0 : _a.close();
          this.picker = openFolderPickerPopover({
            anchor: b.buttonEl,
            app: this.app,
            folders: this.deps.source,
            current: dirnameOf2(row.path),
            // No "Clear" here: see `offerClear` in `FolderPickerPopover.ts`.
            // Its wording describes the missing-root dialog, and empty is not
            // one of the three answers this row offers.
            offerClear: false,
            apply: (folder) => {
              const to = row.memberKind === "folder" ? folder : folder === "" ? basenameOf(row.path) : `${folder}/${basenameOf(row.path)}`;
              stage(to, "folder-pick");
              return Promise.resolve();
            }
          });
        })
      );
      setting.addButton(
        (b) => b.setButtonText("Type path\u2026").onClick(() => {
          typedRow.settingEl.show();
          input == null ? void 0 : input.focus();
        })
      );
      if (actionsFor(row).includes("remove")) {
        setting.addButton(
          (b) => (
            // "Remove from space", not "Remove": the row names a note or folder
            // that is already missing from the vault, and the shorter label reads
            // on that row as though it deletes the file.
            b.setButtonText("Remove from space").onClick(() => {
              this.gate.remove(index);
              redraw();
            })
          )
        );
      }
    };
    redraw();
  }
  /**
   * The paths pointing row `index` somewhere would collide with.
   *
   * The space's own path members, minus whatever another row is removing or
   * pointing away, plus whatever another row is pointing AT. Both passes run
   * before the result is read, so two rows cannot be judged against each
   * other in the order they happen to sit in. See `pointProblem`'s `taken`.
   */
  takenPaths(index) {
    const row = this.deps.rows[index];
    const taken = /* @__PURE__ */ new Set();
    if (!row || row.kind === "root") return taken;
    for (const m of this.deps.space.members) {
      if (m.kind === "file" || m.kind === "folder") taken.add(m.path);
    }
    const staged = this.deps.rows.map((_, i) => this.gate.stagedAt(i));
    for (const fix of staged) {
      if ((fix == null ? void 0 : fix.kind) === "remove-member") taken.delete(fix.path);
      if ((fix == null ? void 0 : fix.kind) === "point-member") taken.delete(fix.from);
    }
    staged.forEach((fix, i) => {
      if (i !== index && (fix == null ? void 0 : fix.kind) === "point-member") taken.add(fix.to);
    });
    taken.delete(row.path);
    return taken;
  }
  onClose() {
    var _a;
    for (const s of this.suggests) s.close();
    this.suggests.length = 0;
    (_a = this.picker) == null ? void 0 : _a.close();
    this.picker = null;
    this.contentEl.empty();
  }
};

// src/ui/settingsEdits.ts
var BlurCommitLedger = class {
  constructor() {
    /** field → the value it is known to have persisted. */
    this.committed = /* @__PURE__ */ new Map();
  }
  /**
   * `initial` is what the store already holds, in the field's own canonical
   * form — not the empty string, or the first flush would rewrite every
   * untouched control on the tab.
   */
  track(field, initial) {
    this.committed.set(field, initial);
  }
  /** Called from the field's `blur` handler. Returns whether it wrote. */
  commit(field) {
    const last = this.committed.get(field);
    if (last === void 0) return false;
    const value = field.current();
    if (value === last) return false;
    if (field.accepts && !field.accepts(value)) return false;
    field.write(value);
    this.committed.set(field, value);
    return true;
  }
  /**
   * Called from `hide()` before the container is emptied. Returns how many
   * fields still had an uncommitted edit.
   */
  flush() {
    let written = 0;
    for (const field of this.committed.keys()) {
      try {
        if (this.commit(field)) written++;
      } catch (e) {
        console.error("Spaces: could not flush a settings edit", e);
      }
    }
    return written;
  }
  /** `display()` rebuilds every control, so the old ones must be forgotten. */
  clear() {
    this.committed.clear();
  }
};
function deleteConfirmPrompt(space) {
  const noun = space.memberCount === 1 ? "member" : "members";
  const missing = space.missingCount > 0 ? `, ${space.missingCount} missing` : "";
  return {
    title: `Delete "${space.name}"?`,
    body: `This space has ${space.memberCount} ${noun}${missing}. Deleting it also discards its saved order and layout. This cannot be undone.`,
    confirmLabel: "Delete"
  };
}
async function deleteWithConfirm(space, io) {
  if (!await io.confirm(deleteConfirmPrompt(space))) return false;
  try {
    await io.remove();
  } catch (e) {
    io.onError(`Spaces: could not delete "${space.name}" (${String(e)})`);
    return false;
  }
  io.onDeleted();
  return true;
}

// src/ui/SettingsTab.ts
function ignoreLines(raw) {
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}
function ignoreSkipMessage(reason) {
  switch (reason) {
    case "over-cap":
      return `Only the first ${MAX_PATTERNS} patterns are used, and this one is past that limit.`;
    case "blank":
      return "Blank, so there is nothing to match.";
    case "too-long":
      return `Longer than ${MAX_PATTERN_LENGTH} characters. Shorten it, or split it into separate rules.`;
    case "traversal":
      return 'Has a ".." segment, which patterns may not use. A folder whose name merely contains two dots is fine.';
    case "absolute":
      return 'Starts with "/". Patterns are vault-relative, so remove the leading slash.';
    case "uncompilable":
      return "Not a pattern this version can compile, so it hides nothing.";
  }
}
var SpacesSettingTab = class extends import_obsidian23.PluginSettingTab {
  constructor(app, plugin, defs, getTagIndex, hooks, getEffectiveRestore, getOrderingStatus, cancelStripDrag, getPropertyIndex, hasHover = deviceHasHover) {
    super(app, plugin);
    this.defs = defs;
    this.getTagIndex = getTagIndex;
    this.hooks = hooks;
    this.getEffectiveRestore = getEffectiveRestore;
    this.getOrderingStatus = getOrderingStatus;
    this.cancelStripDrag = cancelStripDrag;
    this.getPropertyIndex = getPropertyIndex;
    this.hasHover = hasHover;
    this.edits = new BlurCommitLedger();
    this.lastSignature = null;
  }
  /**
   * The tab, declared rather than drawn.
   *
   * Obsidian renders from this and indexes it for the settings search, which
   * is the point: built imperatively in `display()`, none of these settings
   * could be found by typing "reorder" into the Settings search box. Returning
   * a non-empty array also means `display()` is never called, so this is the
   * whole tab — there is no half-way arrangement.
   *
   * Re-run by `update()`, which is how anything derived from state is
   * refreshed: the `desc` fields below are values rather than callbacks, so a
   * description that depends on a setting is regenerated by re-asking this
   * method, not by mutating a node that has already been rendered.
   *
   * TWO pages, not one per section. The split is deliberate and predates the
   * declarative API, which only changed who draws the navigation. One page per
   * section would have put two settings behind three of them and ONE behind
   * another, so finding a toggle would mean guessing which page it lived
   * under — navigation added on top of a problem navigation does not solve.
   * What actually buried the toggles was the space list, which grows without
   * bound; separating that is the whole win, and the toggles stay on one
   * screen, grouped by heading and scannable at a glance.
   */
  getSettingDefinitions() {
    return [
      // First, and its own page rather than a group inside Preferences: it is
      // the half of the settings people go looking for. Preferences keeps the
      // behavioural groups behind it.
      { type: "page", name: "Appearance", items: this.appearanceItems() },
      { type: "page", name: "Preferences", items: this.preferenceItems() },
      { type: "page", name: "Spaces", items: this.spaceItems() }
    ];
  }
  /**
   * Reads a toggle's value out of this plugin's own store.
   *
   * Overridden because the default reads `app.vault.getConfig`, which knows
   * nothing about `data.json`. Only booleans arrive here: the two controls
   * with editing semantics worth keeping — ignored paths, and a space's name —
   * stay imperative below, so the store's write path, its validation and its
   * blur-commit behaviour are untouched by this migration.
   */
  getControlValue(key) {
    const settings = this.defs.get().settings;
    return settings[key];
  }
  /** The matching write. `save` reports failure exactly as it did before. */
  setControlValue(key, value) {
    if (key === "stripPlacement") {
      void setStripPlacement(
        this.defs,
        value,
        () => {
          var _a;
          return (_a = this.cancelStripDrag) == null ? void 0 : _a.call(this);
        }
      ).then(() => this.refreshIfSpacesChanged());
      return;
    }
    this.save(
      (d) => {
        d.settings[key] = value;
      },
      // One setting governs another's enabled state AND its description, and a
      // description is a value here rather than a callback. Re-asking for the
      // definitions is what redraws it.
      key === "allowReordering"
    );
  }
  /**
   * What the Spaces page is built from, as a string.
   *
   * Ids, names and the archived flag in order, because those are the things a change to
   * the space list can do that the rendered page must follow: add, remove,
   * rename, reorder, archive. Settings live on the other page and are read through
   * `getControlValue`, so a toggle changes no definition and must not cost a
   * redraw.
   */
  spaceSignature() {
    return this.defs.get().spaces.map((s) => `${s.id}\0${s.name}\0${isArchived(s) ? 1 : 0}`).join("") + // Whether the hide-strip row is offered is derived from the placement,
    // which any route can change (the dropdown, a command, a strip drag).
    // The answer is part of the signature, not the placement itself: moving
    // between two placements that both withhold the row redraws nothing.
    `${this.offersHideStrip() ? 1 : 0}`;
  }
  offersHideStrip() {
    return canHideStrip(this.defs.get().settings.stripPlacement, this.hasHover());
  }
  /**
   * Re-reads the definitions when, and only when, the space list has changed.
   *
   * Obsidian builds a declarative tab from `getSettingDefinitions()` once,
   * when the tab is registered, and then renders `settingItems`. It does NOT
   * re-ask on open: `display()` is what used to be called every time, and a
   * tab that returns definitions never gets `display()` at all. The typings
   * say as much from the other side — `update()` is "called by dynamic tabs
   * when their data changes", and this is a dynamic tab.
   *
   * Before this existed, a space created from the explorer's + button did not
   * appear in settings until Obsidian restarted and the tab was registered
   * again, because nothing here had any reason to look again.
   *
   * The signature also carries whether the hide-strip row is offered, so a
   * placement changed by a command or a strip drag, not only the dropdown,
   * adds or removes that row.
   *
   * Gated on the signature rather than refreshed on every definition change:
   * every toggle on the Preferences page writes to the same store, and
   * redrawing the whole tab under the user's cursor each time they flip a
   * switch is the cost `save()` has always deliberately avoided.
   *
   * **The buttons in this file redraw themselves as well, and that second
   * redraw is kept deliberately.** `mutate` notifies its subscribers before
   * it resolves, and the archived flag is part of the signature, so in the
   * plugin an Archive, Restore or Delete click reaches `update()` twice: once
   * from the subscription above this handler's `.then`, once from the handler
   * itself. The alternative is a tab whose own buttons redraw it only because
   * `main.ts` wired a subscriber to the store, which is the invisible coupling
   * this method exists to make up for, pointing the other way. The second pass
   * re-renders the same definitions on a settings page the user just clicked,
   * not in the tree or the strip; it has NOT been measured in a real Obsidian,
   * and if it ever shows, the handlers can call this method instead, where the
   * signature check makes the second pass a no-op.
   */
  refreshIfSpacesChanged() {
    const next = this.spaceSignature();
    if (next === this.lastSignature) return;
    this.lastSignature = next;
    this.update();
  }
  /**
   * Rebuild the rows once the vault can answer what exists.
   *
   * `addSettingTab` builds this tab's definitions inside `onload()`, one line
   * before `onLayoutReady`, and a row's `(missing)` marker is a plain string
   * computed right there. `desc` is `string | DocumentFragment` and never a
   * function, so nothing re-evaluates it per render; Obsidian does not re-ask
   * a declarative tab for its definitions when the window is opened; and the
   * only other refresh, `refreshIfSpacesChanged`, no-ops unless the SPACE LIST
   * moved. So every folder-existence answer on this page was sampled before
   * the vault was able to give one, and a folder space whose folder is
   * perfectly healthy read `Folder pinned - <path> (missing)` for the whole
   * session. Measured in a real Obsidian: the rendered row said `(missing)`
   * while `getSettingDefinitions()` recomputed at the same moment did not.
   *
   * Unconditional, unlike `refreshIfSpacesChanged`: the space list has NOT
   * changed here, the vault's answer has, and the signature cannot see that.
   * One redraw, once, after startup and off the path `onload` makes Obsidian
   * wait for.
   */
  resampleVault() {
    this.update();
  }
  hide() {
    this.edits.flush();
    this.edits.clear();
    super.hide();
  }
  /** A fragment belonging to the settings window rather than the main one. */
  frag() {
    return this.containerEl.doc.win.createFragment();
  }
  /** Body text, plus a warning block under it when there is one. */
  describe(text, warning) {
    if (!warning) return text;
    const frag = this.frag();
    frag.appendText(text);
    warning(frag);
    return frag;
  }
  /**
   * The Appearance page's items, flat rather than wrapped in a group: the
   * page is the heading, and a group repeating it would read as a stutter.
   */
  appearanceItems() {
    return [
      {
        name: "Show the space name above the file tree",
        desc: "Shows the active space's icon and name at the top of the file explorer. Turn it off if the icon strip along the bottom is orientation enough.",
        control: { type: "toggle", key: "showSpaceHeader" }
      },
      {
        name: "Mark folder pinned spaces with a pin",
        desc: "When the space name row above is shown, a folder pinned space gets a pin on the right. Hover it to see which folder.",
        control: { type: "toggle", key: "showPinnedFolder" }
      },
      {
        name: "Compact folder chains",
        desc: "Shows a chain of folders that leads to a single folder as one row. Affects spaces that gather notes from across your vault.",
        control: { type: "toggle", key: "compactFolderChains" }
      },
      {
        name: "Shorten long compacted paths",
        // States the dependency rather than gating on it, following
        // `showPinnedFolder` above. A greyed row invites the question "why
        // can I not change this"; a sentence answers it.
        desc: "When Compact folder chains is on, a compacted row whose path is too wide for the file explorer drops leading folders until it fits, with two dots in their place. Hover the row to see the whole path.",
        control: { type: "toggle", key: "abbreviateCompactedPaths" }
      },
      {
        // Led by "All" rather than "Pin All …": sentence case is linted,
        // and mid-sentence the view's own label is indistinguishable from
        // the quantifier — "Pin all …" would read as pinning every icon.
        name: "All stays at the left of the space strip",
        desc: "Keeps All in place while the other space icons scroll past it, the way the + button stays pinned to the right.",
        control: { type: "toggle", key: "pinAllSpace" }
      },
      {
        name: "Space strip position",
        desc: "Where the strip of space icons sits in the file explorer. Left and right show it as a vertical ribbon.",
        control: {
          type: "dropdown",
          key: "stripPlacement",
          options: {
            bottom: "Bottom",
            top: "Top",
            left: "Left",
            right: "Right"
          }
        }
      },
      ...this.offersHideStrip() ? [
        {
          name: "Hide the space strip",
          desc: "Show it when you move the pointer to the left edge of the file tree. Available when the strip is on the left.",
          control: { type: "toggle", key: "hideStrip" }
        }
      ] : [],
      {
        name: "Assign a color to new spaces",
        desc: "New spaces take the next color in the palette, so consecutive spaces are easy to tell apart. Turn this off to start every new space neutral and pick its color yourself.",
        control: { type: "toggle", key: "autoAssignColor" }
      },
      {
        name: "Use theme colors for space icons",
        desc: "Draws every space icon in your theme's icon color instead of the color you gave it. Your colors are kept and come back when you turn this off.",
        control: { type: "toggle", key: "useThemeIconColor" }
      },
      {
        name: "Active space style",
        desc: "How the strip marks the space you are in. Shaded shades it the way your theme shades a selected row. Boxed adds an outline in the space's color. Bolded draws the icon at a heavier weight and no shading.",
        control: {
          type: "dropdown",
          key: "activeSpaceStyle",
          options: {
            shaded: "Shaded",
            boxed: "Boxed",
            // Kept to one short word each. A native select sizes to its
            // selected option, so a long label makes the whole row jump when
            // the value changes, and the declarative settings API exposes
            // no class to scope a width rule to, only `name` and `desc`, so a
            // CSS fix would have to style every plugin's dropdowns.
            bolded: "Bolded"
          }
        }
      },
      {
        name: "Drag indicator",
        desc: "How the file pane shows where a dragged item will land. Box opens a gap between the rows and fills it. Line draws a thin rule at the boundary and moves nothing.",
        control: {
          type: "dropdown",
          key: "dropIndicatorStyle",
          options: {
            box: "Box",
            // One short word each, close to the same length. A native select
            // sizes to its selected option, so uneven labels make the settings
            // row jump on every change.
            line: "Line"
          }
        }
      }
    ];
  }
  preferenceItems() {
    var _a;
    const settings = this.defs.get().settings;
    const orderingUnavailable = this.getOrderingStatus ? !this.getOrderingStatus().available : false;
    const restoreBlocked = (_a = this.getEffectiveRestore) == null ? void 0 : _a.call(this).reason;
    return [
      {
        type: "group",
        heading: "File tree",
        items: [
          {
            name: "Show notes you open that are not in this space",
            desc: "A note you open appears dimmed and italic even when it is not in this space, so you can see it and add it. Turn this off to show only this space's own notes and folders.",
            control: { type: "toggle", key: "revealVisitors" }
          },
          {
            name: "Ignored paths",
            desc: this.describe(
              "One glob per line. Supports * within a segment and ** across segments. Hidden from every space, including notes collected by a tag or a property. A note you add to a space by hand is still shown, and so is a note you have open.",
              (host) => {
                this.renderIgnoreWarning(host);
              }
            ),
            // Imperative on purpose. A declarative `textarea` control persists
            // on change, and this field must persist on BLUR: one `mutate` per
            // keystroke would put a save, a recompile of every glob and a tree
            // repaint behind each character typed.
            render: (setting) => {
              this.renderIgnoreField(setting);
            }
          }
        ]
      },
      {
        type: "group",
        heading: "Reordering",
        items: [
          {
            name: "Allow reordering a space's notes and folders",
            desc: this.describe(
              "Drag rows in the file explorer to arrange them, remembered separately for each space and for All. Turn this off to sort the tree normally; any orders you have set are kept, not discarded.",
              orderingUnavailable ? (host) => {
                const warn = host.createDiv({ cls: "spaces-setting-warning" });
                warn.createEl("strong", { text: "Unavailable in this Obsidian version. " });
                warn.appendText(
                  "Spaces filters and orders the tree through the file explorer's own sort, and this version does not expose it. Spaces can no longer filter, so the whole vault shows; nothing you have set has been lost, and it will apply again when Obsidian restores it."
                );
              } : void 0
            ),
            control: { type: "toggle", key: "allowReordering" }
          },
          {
            // "outside spaces" for the same sentence-case reason as "All stays
            // at the left" above. All is the only thing outside a space, and
            // the description names it.
            name: "Allow reordering outside spaces",
            desc: settings.allowReordering ? "Drag rows to arrange them in All as well as in spaces. Turn this off to leave All sorted the way Obsidian sorts it; any order you have set for All is kept, not discarded." : "Reordering is off above, so this has no effect. Any order you have set for All is kept, and this applies again when you turn reordering back on.",
            control: {
              type: "toggle",
              key: "allowReorderingAll",
              // Asked fresh on every render and again by `refreshDomState()`,
              // so the greying follows the toggle above without this file
              // wiring the two together.
              disabled: () => !this.defs.get().settings.allowReordering
            }
          }
        ]
      },
      {
        type: "group",
        heading: "Switching",
        items: [
          {
            name: "Restore tabs when switching spaces",
            desc: this.describe(
              "Off, switching changes only the file tree. On, each space also remembers its own tabs, sidebars and active pane, and switching restores them.",
              restoreBlocked ? (host) => {
                const warn = host.createDiv({ cls: "spaces-restore-warning" });
                warn.createEl("strong", { text: "Restoration is unavailable:" });
                warn.appendText(` ${restoreBlocked}.`);
              } : void 0
            ),
            control: { type: "toggle", key: "restoreLayouts" }
          }
        ]
      }
    ];
  }
  /**
   * The ignored-paths textarea, kept on the blur-commit ledger.
   *
   * `tests/settingsBlurFlush.test.ts` covers what that protects: a value typed
   * and then abandoned by closing the dialog is still written, once, by
   * `hide()`.
   */
  renderIgnoreField(setting) {
    setting.addTextArea((t) => {
      const saved = () => this.defs.get().settings.globalIgnore.join("\n");
      t.setValue(saved());
      t.inputEl.rows = 6;
      const field = {
        current: () => ignoreLines(t.getValue()).join("\n"),
        write: (value) => {
          const lines = value ? value.split("\n") : [];
          this.defs.mutate((d) => {
            d.settings.globalIgnore = lines;
          }).then(
            // Redraws the warning by re-asking for the definitions, which is
            // the declarative equivalent of repainting the one node.
            () => {
              this.update();
            },
            (e) => {
              new import_obsidian23.Notice(`Spaces: could not save ignored paths (${String(e)})`);
            }
          );
        }
      };
      this.edits.track(field, saved());
      t.inputEl.addEventListener("blur", () => {
        this.edits.commit(field);
      });
    });
  }
  /**
   * The notice for patterns past the cap, and for an invalid pattern that is
   * reported and skipped. Same visual treatment as the ordering warning rather
   * than a third style, and no colors of its own — `.spaces-setting-warning`
   * is built from `--text-error` and `--background-modifier-error`.
   */
  renderIgnoreWarning(host) {
    const { skipped } = compileIgnore(this.defs.get().settings.globalIgnore);
    if (skipped.length === 0) return;
    const warn = host.createDiv({ cls: "spaces-setting-warning" });
    warn.createEl("strong", {
      text: skipped.length === 1 ? "1 pattern is not being applied. " : `${skipped.length} patterns are not being applied. `
    });
    warn.appendText("They are still saved, but they hide nothing:");
    for (const s of skipped) {
      const line = warn.createDiv();
      line.appendText(`Line ${s.index + 1}: `);
      line.createEl("code", { text: s.pattern.trim() || "(blank)" });
      line.appendText(`. ${ignoreSkipMessage(s.reason)}`);
    }
  }
  /**
   * One row per space, imperative for the same reason as the ignore field: the
   * name commits on blur, and the two buttons are actions rather than values.
   * The name and the summary stay declarative, so a space is still findable by
   * name in the settings search.
   */
  spaceItems() {
    const all = this.defs.get().spaces;
    const spaces = activeSpaces(all);
    const exists = (path) => this.app.vault.getAbstractFileByPath(path) !== null;
    const rowsFor = spaces.map((space) => {
      const rows = memberRows(space, exists, void 0, () => null);
      const missing = missingCount(rows);
      return {
        name: space.name,
        desc: spaceRowSummary(space, exists),
        render: (setting) => {
          setting.addText((t) => {
            t.setValue(space.name);
            const field = {
              current: () => t.getValue().trim(),
              accepts: (v) => v.length > 0,
              write: (v) => {
                void renameSpace(this.defs, space.id, v);
              }
            };
            this.edits.track(field, space.name);
            t.inputEl.addEventListener("blur", () => {
              this.edits.commit(field);
            });
          });
          if (!isFolderSpace(space)) {
            setting.addButton(
              (b) => b.setButtonText("Contents\u2026").setTooltip(`See and manage what is in ${space.name}`).onClick(() => {
                var _a;
                new SpaceContentsModal(
                  this.app,
                  this.defs,
                  space.id,
                  this.getTagIndex,
                  // Explicit rather than defaulted inside the dialog: a tab built
                  // without the accessor (the tests) draws counts as
                  // unavailable, and says so here.
                  (_a = this.getPropertyIndex) != null ? _a : () => null
                ).open();
              })
            );
          }
          setting.addButton(
            (b) => b.setButtonText("Archive").setTooltip(`Put ${space.name} away without deleting it`).onClick(() => {
              void archiveSpace(this.defs, space.id).then(() => {
                new import_obsidian23.Notice(`Archived "${space.name}". Find it under Archived below.`);
                this.update();
              }).catch((e) => {
                new import_obsidian23.Notice(`Spaces: could not archive "${space.name}" (${String(e)})`);
              });
            })
          );
          this.addDeleteButton(setting, space, rows.length, missing);
        }
      };
    });
    return [
      ...rowsFor.length > 0 ? rowsFor : [
        all.length === 0 ? {
          name: "No spaces yet",
          desc: "Use the + button at the bottom of the file explorer to make one."
        } : {
          name: "Every space is archived",
          desc: "Restore one below to put it back on the strip."
        }
      ],
      // A DELIBERATE NARROWING OF THE DESIGN, recorded here because it is one.
      // The design says the Archived section is "always visible, even when
      // empty", and it is: a vault with spaces and nothing archived still gets
      // the heading and "Nothing archived". The carve-out is only the vault
      // with NO SPACES AT ALL, where "No spaces yet" is the whole answer and a
      // heading plus an empty state under it describes a feature of a thing
      // the reader does not have one of.
      ...all.length === 0 ? [] : [
        {
          type: "list",
          heading: "Archived",
          emptyState: "Nothing archived. Click Archive beside a space to put it here.",
          items: archivedSpaces(all).map((space) => this.archivedRow(space, exists))
        }
      ]
    ];
  }
  /** An archived space: name and summary, Restore and Delete. No name field, no Contents…. */
  archivedRow(space, exists) {
    const rows = memberRows(space, exists, void 0, () => null);
    const missing = missingCount(rows);
    return {
      name: space.name,
      desc: spaceRowSummary(space, exists),
      render: (setting) => {
        setting.addButton(
          (b) => b.setButtonText("Restore").setTooltip(`Put ${space.name} back on the strip`).onClick(() => {
            this.restore(space);
          })
        );
        this.addDeleteButton(setting, space, rows.length, missing);
      }
    };
  }
  /**
   * Restore, gated on what no longer resolves.
   *
   * **Half of this is fresh and half of it is not, and the difference
   * matters.** `vaultSource().kindOf` is read at the click, so a path the
   * vault has since gained at the same spelling is seen as present, and one
   * whose kind changed is reported as the wrong kind rather than as missing.
   * `space` is the object `spaceItems()` captured the last time the page was
   * built, and `spaceSignature` covers id, name and the archived flag only,
   * so a member path rewritten by a rename does not redraw this tab: the gate
   * can open naming a path that has already been repaired to a new spelling.
   * What makes that safe is downstream rather than here. `applyRestoreFixes`
   * re-checks every staged fix against the live document, applies only what
   * still matches, and reports the rest.
   *
   * With nothing to stage this is `restoreSpace` and no modal at all — a gate
   * shown for a space that is whole would be a dialog in front of a one-click
   * action. With something to stage, nothing is written here:
   * `RestoreSpaceModal` applies the fixes and clears the flag together, in
   * one write.
   */
  restore(space) {
    const source = this.vaultSource();
    const rows = restoreRows(space, restoreProblems(space, (path) => source.kindOf(path)));
    if (rows.length === 0) {
      void restoreSpace(this.defs, space.id).then(() => {
        new import_obsidian23.Notice(`Restored "${space.name}". Click it on the strip to open it.`);
        this.update();
      }).catch((e) => {
        new import_obsidian23.Notice(`Spaces: could not restore "${space.name}" (${String(e)})`);
      });
      return;
    }
    new RestoreSpaceModal(this.app, {
      space,
      rows,
      source,
      apply: (fixes) => commitRestore(this.defs, space.id, fixes),
      onRestored: () => {
        this.update();
      }
    }).open();
  }
  /**
   * The Delete button, identical on an active row and an archived one.
   *
   * Shared rather than written twice: the confirmation carries the member and
   * missing counts, the lifecycle hooks and the error notice, and two copies
   * of that drift the first time one of them is edited. Archive and Restore
   * stay separate — they are different actions on different rows.
   */
  addDeleteButton(setting, space, memberCount, missing) {
    setting.addButton(
      (b) => b.setButtonText("Delete").setDestructive().onClick(async () => {
        await deleteWithConfirm(
          { name: space.name, memberCount, missingCount: missing },
          {
            confirm: (prompt) => new ConfirmModal(this.app, prompt).ask(),
            remove: () => deleteSpace(this.defs, space.id, this.hooks),
            // One fewer row is a change to the definitions themselves, not
            // to a rendered value, so this is `update()` and not
            // `refreshDomState()`.
            onDeleted: () => {
              this.update();
            },
            onError: (message) => {
              new import_obsidian23.Notice(message);
            }
          }
        );
      })
    );
  }
  /**
   * The vault, as the restore gate's suggester and kind check read it. Built
   * at the click, like `main.ts`'s `folderSource()`, so a folder created
   * since the settings page was drawn is offered.
   */
  vaultSource() {
    const vault = this.app.vault;
    return {
      allPaths: () => vault.getAllLoadedFiles().map((f) => f.path),
      kindOf: (path) => {
        const f = vault.getAbstractFileByPath(path);
        if (f instanceof import_obsidian23.TFolder) return "folder";
        if (f instanceof import_obsidian23.TFile) return "file";
        return null;
      }
    };
  }
  /**
   * Every toggle writes the same way and reports failure the same way, so the
   * shape lives here once rather than nine times.
   *
   * `rerender` exists for the one setting whose value changes another
   * setting's enabled state; everywhere else redrawing the tab under the
   * user's cursor would be a cost with no benefit.
   */
  save(fn, rerender = false) {
    this.defs.mutate(fn).then(() => {
      if (rerender) this.update();
    }).catch((e) => {
      new import_obsidian23.Notice(`Spaces: could not save setting (${String(e)})`);
    });
  }
};

// src/layout/ObsidianLayoutPort.ts
function createObsidianLayoutPort(app) {
  return {
    capture: () => app.workspace.getLayout(),
    restore: (layout) => app.workspace.changeLayout(layout),
    mainLeafCount: () => {
      let n = 0;
      app.workspace.iterateRootLeaves(() => {
        n++;
      });
      return n;
    }
  };
}

// src/layout/LayoutCoordinator.ts
var LayoutCoordinator = class {
  constructor(port, runtime) {
    this.port = port;
    this.runtime = runtime;
  }
  async transition(from, to, enabled) {
    if (!enabled) return { kind: "skipped" };
    if (sameSelection(from, to)) return { kind: "skipped" };
    const outgoing = this.port.capture();
    this.runtime.setLayoutFor(from, outgoing);
    const target = this.runtime.getLayoutFor(to);
    if (!target) {
      this.runtime.setLayoutFor(to, outgoing);
      return { kind: "adopted" };
    }
    const failure = await this.tryRestore(target);
    if (!failure) return { kind: "restored" };
    const rollbackFailure = await this.tryRestore(outgoing);
    if (!rollbackFailure) return { kind: "rolled-back", reason: failure };
    return { kind: "failed-open", reason: `${failure}; rollback: ${rollbackFailure}` };
  }
  /** Returns null on success, or a reason string on failure. */
  async tryRestore(layout) {
    try {
      await this.port.restore(layout);
    } catch (e) {
      return `restore threw: ${String(e)}`;
    }
    if (this.port.mainLeafCount() <= 0) return "restore produced an empty workspace";
    return null;
  }
};

// src/layout/nativeWorkspaces.ts
function detectNativeWorkspaces(app) {
  try {
    const ip = app == null ? void 0 : app.internalPlugins;
    if (!ip || typeof ip.getEnabledPluginById !== "function") return "unknown";
    return ip.getEnabledPluginById("workspaces") ? "enabled" : "disabled";
  } catch (e) {
    return "unknown";
  }
}
function effectiveRestoreLayouts(configured, status) {
  return configured && status === "disabled";
}

// src/layout/nativeExplorerSort.ts
var installed = /* @__PURE__ */ new WeakMap();
var SEAM = "getSortedFolderItems";
var requestResortWarned = false;
var shadowWarned = false;
function asObject(view) {
  if (!view || typeof view !== "object") return null;
  return view;
}
function probe(view) {
  try {
    const v = asObject(view);
    if (!v) return "unknown";
    if (typeof v.getSortedFolderItems !== "function") return "unknown";
    if (typeof v.sort !== "function") return "unknown";
    return "ok";
  } catch (e) {
    return "unknown";
  }
}
function itemsForPaths(view, paths) {
  var _a;
  const map = (_a = asObject(view)) == null ? void 0 : _a.fileItems;
  if (!map) return [];
  const out = [];
  for (const p of paths) {
    const item = Object.prototype.hasOwnProperty.call(map, p) ? map[p] : void 0;
    if (item) out.push(item);
  }
  return out;
}
function isPatched(view) {
  const v = asObject(view);
  return v !== null && installed.has(v);
}
function patch(view, transform, permits) {
  const v = asObject(view);
  if (!v || probe(v) !== "ok" || installed.has(v)) return false;
  const own = Object.getOwnPropertyDescriptor(v, SEAM);
  if (own && (typeof own.get === "function" || typeof own.set === "function")) return false;
  if (own && (own.configurable === false || own.writable === false)) return false;
  const original = v.getSortedFolderItems;
  const protoAtPatch = own ? null : Object.getPrototypeOf(v);
  let warned = false;
  let live = true;
  const resolveSource = () => {
    if (!protoAtPatch) return original;
    const now = protoAtPatch[SEAM];
    if (typeof now !== "function" || now === original) return original;
    if (!shadowWarned) {
      shadowWarned = true;
      console.warn(
        "Spaces: another plugin patched the file explorer's sort after us. Deferring to it rather than shadowing it; spaces still filter."
      );
    }
    return now;
  };
  const override = function(folder) {
    const source = resolveSource();
    const items = source.call(this, folder);
    if (!live) return items;
    try {
      const path = folder == null ? void 0 : folder.path;
      if (typeof path !== "string") return items;
      if (!Array.isArray(items)) return items;
      const out = transform(path, items);
      if (!Array.isArray(out) || !isAllowed(out, items, path, permits)) return items;
      return out;
    } catch (e) {
      if (!warned) {
        warned = true;
        console.error("Spaces: ordering failed; falling back to native sort", e);
      }
      return items;
    }
  };
  v[SEAM] = override;
  installed.set(v, {
    override,
    deactivate: () => {
      live = false;
    },
    native: (folder) => resolveSource().call(v, folder)
  });
  return true;
}
function isAllowed(out, items, folderPath, permits) {
  var _a;
  const allowed = new Set(items);
  const seen = /* @__PURE__ */ new Set();
  for (const item of out) {
    if (seen.has(item)) return false;
    if (!allowed.has(item) && !(permits == null ? void 0 : permits(folderPath, (_a = item.file) == null ? void 0 : _a.path))) return false;
    seen.add(item);
  }
  return true;
}
function unpatch(view) {
  const v = asObject(view);
  const entry = v ? installed.get(v) : void 0;
  if (!v || !entry) return;
  installed.delete(v);
  entry.deactivate();
  try {
    if (v.getSortedFolderItems === entry.override) {
      delete v.getSortedFolderItems;
    } else {
      console.warn(
        "Spaces: the file explorer's sort was re-patched by something else; leaving it in place rather than removing another plugin's override. Ours is now inert and passes rows through untouched."
      );
    }
  } catch (e) {
  }
  try {
    const sort = v.sort;
    if (typeof sort === "function") sort.call(v);
  } catch (e) {
  }
}
function nativeSortedItems(view, folder) {
  try {
    const v = asObject(view);
    const entry = v ? installed.get(v) : void 0;
    if (!entry) return null;
    const items = entry.native(folder);
    return Array.isArray(items) ? items : null;
  } catch (e) {
    return null;
  }
}
function displayedPaths(view, folder) {
  var _a;
  try {
    const v = asObject(view);
    if (!v || typeof v.getSortedFolderItems !== "function") return null;
    const items = v.getSortedFolderItems.call(v, folder);
    if (!Array.isArray(items)) return null;
    const out = [];
    for (const item of items) {
      const p = (_a = item == null ? void 0 : item.file) == null ? void 0 : _a.path;
      if (typeof p === "string") out.push(p);
    }
    return out;
  } catch (e) {
    return null;
  }
}
function requestResort(view) {
  try {
    const v = asObject(view);
    if (!v) return false;
    const sort = v.sort;
    if (typeof sort === "function") {
      sort.call(v);
      return true;
    }
    const req = v.requestSort;
    if (typeof req === "function") {
      req.call(v);
      return true;
    }
    return false;
  } catch (e) {
    if (!requestResortWarned) {
      requestResortWarned = true;
      console.error("Spaces: forced re-sort failed; the previous filter may be stale", e);
    }
    return false;
  }
}
function readSortOrder(view) {
  if (!view || typeof view !== "object") return null;
  const v = view.sortOrder;
  return typeof v === "string" ? v : null;
}

// src/visibility/visibleItems.ts
function filterVisibleItems(items, snapshot) {
  if (snapshot === null) return [...items];
  const isVisible = snapshot.isVisible;
  return items.filter((it) => {
    var _a;
    const path = (_a = it.file) == null ? void 0 : _a.path;
    if (typeof path !== "string") return true;
    return isVisible ? isVisible(path) !== false : snapshot.decisionFor(path).visible !== false;
  });
}

// src/visibility/compactChains.ts
function runFrom(start, tree) {
  if (!tree.isFolder(start) || !tree.isScaffold(start)) return null;
  const segments = [tree.nameOf(start)];
  let current = start;
  for (; ; ) {
    const kids = tree.visibleChildrenOf(current);
    if (kids.length !== 1) break;
    const only = kids[0];
    if (!tree.isFolder(only) || !tree.isScaffold(only)) break;
    current = only;
    segments.push(tree.nameOf(only));
  }
  return segments.length < 2 ? null : { tip: current, segments };
}
function isHead(path, tree) {
  const parent = tree.parentOf(path);
  if (parent === null) return true;
  if (!tree.isFolder(parent) || !tree.isScaffold(parent)) return true;
  const kids = tree.visibleChildrenOf(parent);
  return !(kids.length === 1 && kids[0] === path);
}
function hiddenSegmentsOf(run, tree) {
  const out = [];
  let current = run.tip;
  for (let i = run.segments.length - 1; i > 0; i--) {
    const parent = tree.parentOf(current);
    if (parent === null) break;
    out.push(parent);
    current = parent;
  }
  return out;
}
function buildChainIndex(folders, tree) {
  const runByHead = /* @__PURE__ */ new Map();
  const runByTip = /* @__PURE__ */ new Map();
  const hiddenSegments = /* @__PURE__ */ new Map();
  for (const path of folders) {
    if (!isHead(path, tree)) continue;
    const run = runFrom(path, tree);
    if (!run) continue;
    runByHead.set(path, run);
    runByTip.set(run.tip, run);
    for (const hidden of hiddenSegmentsOf(run, tree)) hiddenSegments.set(hidden, run);
  }
  return { runByHead, runByTip, hiddenSegments };
}
function sameChainIndex(a, b) {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a.runByHead.size !== b.runByHead.size) return false;
  for (const [head, runA] of a.runByHead) {
    const runB = b.runByHead.get(head);
    if (!runB || runA.tip !== runB.tip) return false;
    if (runA.segments.length !== runB.segments.length) return false;
    for (let i = 0; i < runA.segments.length; i++) {
      if (runA.segments[i] !== runB.segments[i]) return false;
    }
  }
  if (a.hiddenSegments.size !== b.hiddenSegments.size) return false;
  for (const hidden of a.hiddenSegments.keys()) {
    if (!b.hiddenSegments.has(hidden)) return false;
  }
  return true;
}

// src/visibility/compactCoords.ts
function headOfTip(ix, tip) {
  for (const [head, run] of ix.runByHead) {
    if (run.tip === tip) return head;
  }
  return null;
}
function isCompactedRow(ix, path) {
  return ix !== null && ix.runByTip.has(path);
}
function displayToStored(ix, path) {
  var _a;
  if (ix === null || !ix.runByTip.has(path)) return path;
  return (_a = headOfTip(ix, path)) != null ? _a : path;
}
function storedToDisplay(ix, path) {
  var _a, _b;
  return (_b = (_a = ix == null ? void 0 : ix.runByHead.get(path)) == null ? void 0 : _a.tip) != null ? _b : path;
}
function displayParentOf(ix, path, vaultParentOf) {
  var _a;
  const stored = displayToStored(ix, path);
  if (stored === path) return vaultParentOf(path);
  return (_a = vaultParentOf(stored)) != null ? _a : vaultParentOf(path);
}

// src/ui/nativeMenuInjection.ts
var SHOW_METHODS = ["showAtMouseEvent", "showAtPosition"];
var logged = { identity: false, decoration: false, row: false };
function logOnce(key, what, err) {
  if (logged[key]) return;
  logged[key] = true;
  console.error(`Spaces: ${what}`, err);
}
var activeArming = null;
function cancelMenuInjection() {
  const arming = activeArming;
  activeArming = null;
  if (!arming) return;
  arming.cancelTimer();
  arming.restore();
}
function armMenuInjection(args) {
  cancelMenuInjection();
  const { proto, isIntendedMenu, buildRow, decorateHostItem, onHostItemClick, defer } = args;
  const records = /* @__PURE__ */ new WeakMap();
  const original = {};
  const ours = {};
  let originalAddItem = null;
  let ourAddItem = null;
  let live = true;
  let cancelTimer;
  const restore = () => {
    if (!live) return;
    live = false;
    for (const name of SHOW_METHODS) {
      if (proto[name] === ours[name]) proto[name] = original[name];
    }
    if (originalAddItem && proto.addItem === ourAddItem) proto.addItem = originalAddItem;
  };
  const clickReportingProxy = (item, record, report) => {
    const proxy = new Proxy(item, {
      get(target, prop, receiver) {
        if (prop === "onClick") {
          return (handler) => {
            target.onClick(() => {
              try {
                handler();
              } finally {
                if (record.intended) report();
              }
            });
            return proxy;
          };
        }
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== "function") return value;
        return (...callArgs) => {
          const result = value.apply(target, callArgs);
          return result === item ? proxy : result;
        };
      }
    });
    return proxy;
  };
  if (decorateHostItem || onHostItemClick) {
    const originalAdd = proto.addItem;
    originalAddItem = originalAdd;
    const report = onHostItemClick;
    const wrapper = function(cb) {
      if (!live) return originalAdd.call(this, cb);
      let found = records.get(this);
      if (!found) {
        found = { items: [], intended: false };
        records.set(this, found);
      }
      const record = found;
      return originalAdd.call(this, (item) => {
        record.items.push(item);
        cb(report ? clickReportingProxy(item, record, report) : item);
      });
    };
    ourAddItem = wrapper;
    proto.addItem = wrapper;
  }
  const isIntended = (showArgs) => {
    try {
      return isIntendedMenu(showArgs);
    } catch (e) {
      logOnce("identity", "could not identify the sort menu; leaving this menu alone", e);
      return false;
    }
  };
  for (const name of SHOW_METHODS) {
    const target = proto[name];
    original[name] = target;
    const wrapper = function(...rest) {
      if (live && isIntended(rest)) {
        const record = records.get(this);
        if (record) {
          record.intended = true;
          for (const item of record.items) {
            try {
              decorateHostItem == null ? void 0 : decorateHostItem(item);
            } catch (e) {
              logOnce("decoration", "could not untick a native sort mode", e);
            }
          }
        }
        restore();
        try {
          buildRow(this);
        } catch (e) {
          logOnce("row", "could not add the saved-ordering row to the sort menu", e);
        }
      }
      return target.apply(this, rest);
    };
    ours[name] = wrapper;
    proto[name] = wrapper;
  }
  activeArming = {
    restore,
    cancelTimer: () => {
      if (typeof cancelTimer === "function") cancelTimer();
    }
  };
  cancelTimer = defer(restore);
}

// src/order/dropIntent.ts
var DEFAULT_EDGE_BAND = 0.25;
function intentFor(args) {
  var _a;
  const { offsetY, height, isFolder } = args;
  if (!(height > 0)) return { kind: "none" };
  if (!isFolder) {
    return { kind: "between", edge: offsetY < height / 2 ? "before" : "after" };
  }
  const band = height * ((_a = args.edgeBand) != null ? _a : DEFAULT_EDGE_BAND);
  if (offsetY < band) return { kind: "between", edge: "before" };
  if (offsetY >= height - band) return { kind: "between", edge: "after" };
  return { kind: "into" };
}
function sameSequence(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
function computeDrop(args) {
  const { displayed, dragged, targetPath, edge } = args;
  const current = applyOrder(args.order, displayed);
  const draggedSet = new Set(dragged);
  const without = current.filter((p) => !draggedSet.has(p));
  const at = without.indexOf(targetPath);
  if (at === -1) return null;
  const index = edge === "before" ? at : at + 1;
  const next = [...without.slice(0, index), ...dragged, ...without.slice(index)];
  return sameSequence(next, current) ? null : next;
}
function movesIntoOwnSubtree(dragged, targetFolder) {
  return dragged.some(
    (f) => targetFolder === f || targetFolder.startsWith(`${f}/`)
  );
}

// src/order/gapLayout.ts
function isLaidOut(row) {
  return row.height > 0;
}
function gapLayout(input) {
  const { rows, targetIndex, edge, boundaryTop } = input;
  if (targetIndex < 0 || targetIndex >= rows.length) return null;
  const target = rows[targetIndex];
  if (!(target.height > 0)) return null;
  const firstMoved = edge === "before" ? targetIndex : targetIndex + 1;
  const shift = rows.map((_, i) => i >= firstMoved ? target.height : 0);
  return {
    box: {
      top: boundaryTop,
      left: target.left,
      width: target.width,
      height: target.height
    },
    shift
  };
}

// src/order/DragOrdering.ts
var DragOrdering = class {
  constructor(deps) {
    this.deps = deps;
    this.container = null;
    this.doc = null;
    this.indicator = null;
    /**
     * Every strip this drag has ever displaced, and by how much.
     *
     * Never pruned while the drag runs, only emptied by `clearShifts`. An
     * earlier version replaced this wholesale on every frame, which meant a row
     * that carried a transform and then left the render window was untracked
     * from that moment and never put back by anything.
     */
    this.shiftOf = /* @__PURE__ */ new Map();
    /**
     * Where each strip sits when nothing has displaced it, in CONTAINER
     * coordinates so scrolling does not invalidate it.
     *
     * Every decision reads this instead of the live DOM. A transform changes
     * what `getBoundingClientRect` returns and what the browser hit-tests, so
     * measuring live meant each frame resolved the drop from rows the previous
     * frame had moved. Observed in a running vault: hovering 3px into a folder's
     * first child drew the box on that child, and the next frame resolved the
     * PARENT FOLDER at root level with the pointer untouched, so the drop would
     * have landed in the vault root. It also opened a hole under the pointer,
     * which made the indicator flicker on and off at the `dragover` rate.
     *
     * Subtracting the applied shift from a live measurement is NOT equivalent
     * and was rejected: the rows animate over 100ms, so a live rect read
     * mid-transition is only partway there and subtracting the full shift
     * overshoots by whatever is left of the animation.
     *
     * An entry is only ever recorded from a strip carrying no shift, which is
     * what keeps the stored value honest.
     */
    this.geo = /* @__PURE__ */ new Map();
    /** Where the box currently sits, so its fade replays only when it moves. */
    this.openAt = null;
    /** Its height, so the pointer can be tested against the open gap. */
    this.openHeight = 0;
    /**
     * The answer the open gap is holding, so a held frame can redraw it.
     *
     * Holding the gap has to freeze the DECISION, not the drawing. Rows appear
     * mid-drag whenever Obsidian expands a folder under the pointer, and they
     * arrive with no transform while their neighbours are displaced; a frame
     * that skips the write leaves the row above drawn on top of the first
     * newcomer.
     */
    this.held = null;
    /** The folder row currently marked as the destination, if any. */
    this.parentMark = null;
    /**
     * Pending removal of the row transition after a gap slides shut.
     *
     * Held so a drag starting inside the closing animation can cancel it. The
     * timer's only job is to take the transition off once the rows have
     * arrived, and doing that to a gap that has since reopened would make the
     * next one jump.
     */
    this.closing = null;
    /**
     * Watches for rows arriving while a gap is open, for the length of a drag.
     *
     * Obsidian expands a folder the pointer rests on, so the tree can gain rows
     * with no drag frame following. The newcomers have no transform while their
     * neighbours are displaced, and the row above is drawn on top of the first
     * of them. Redrawing on the next frame fixes it only if the pointer moves
     * again, and the whole point of an auto-expand is that it happens while you
     * hold still.
     *
     * Attributes are not observed, so the transforms this redraw writes cannot
     * feed it back into itself.
     */
    this.arrivals = null;
    this.dragged = [];
    /**
     * What this drag carries, whether or not this class is taking part in it.
     *
     * `dragged` is filled only on the enabled path, and that is correct for
     * everything it drives: with `enabled()` false no order may be written, so
     * no line is drawn, no drop is claimed, and the gesture belongs to Obsidian.
     *
     * That reasoning has exactly one hole, and it was measured in a real vault
     * rather than argued: `enabled()` is false when `allowReordering` is off,
     * when `allowReorderingAll` is off in *All*, under an Obsidian sort
     * override, and while filtering is paused -- while COMPACTION is governed by
     * a different setting entirely. In every one of those states a compacted row
     * could still be dragged into another folder, and Obsidian moved the chain's
     * deepest folder with nothing said. Turning reordering off disabled a
     * feature; it was never consent to that.
     *
     * So the refusal reads this instead of `dragged`, and this is filled on both
     * paths out of `onDragStart`. It is NOT a second copy of `dragged` for
     * general use: nothing else may read it, because everything else is
     * correctly gated.
     */
    this.carried = [];
    /**
     * Whether `dragged` may be only part of the user's selection, because
     * the rest of it is not rendered. Set once per `dragstart` and read on drop.
     */
    this.draggedTruncated = false;
    /** The row the drag started on, so its teardown can be triggered (see onDrop). */
    this.sourceEl = null;
    this.warned = false;
    this.onDragStart = (e) => this.guard(() => {
      var _a, _b, _c, _d, _e, _f;
      this.dragged = [];
      this.carried = [];
      this.draggedTruncated = false;
      (_b = (_a = this.deps).onDragDone) == null ? void 0 : _b.call(_a);
      if (!this.deps.enabled()) {
        (_d = (_c = this.deps).onBlockedDrag) == null ? void 0 : _d.call(_c);
        const blocked = this.rowFromTarget(e.target);
        if (blocked) this.armDragEnd(blocked.el);
        this.carried = this.publishDrag(blocked).paths;
        return;
      }
      this.geo.clear();
      this.syncGeometry();
      const row = this.rowAt(e.target, (_e = e.clientY) != null ? _e : 0);
      if (!row) {
        this.dragged = [];
        this.publishDrag(null);
        return;
      }
      this.armDragEnd(((_f = this.rowFromTarget(e.target)) != null ? _f : row).el);
      const collected = this.publishDrag(row);
      this.dragged = collected.paths;
      this.carried = collected.paths;
      this.draggedTruncated = collected.truncated;
    });
    this.onDragOver = (e) => this.guard(() => {
      var _a, _b, _c;
      if (this.dragged.length === 0) {
        this.markBlockedRefusal(e);
        return;
      }
      this.syncGeometry();
      const clientY = (_a = e.clientY) != null ? _a : 0;
      if (!this.pointerInside((_b = e.clientX) != null ? _b : 0, clientY)) {
        this.clearIndicator();
        return;
      }
      if (!this.targetIsOurs(e.target)) {
        this.clearIndicator();
        return;
      }
      if (this.draggedTruncated) {
        this.clearIndicator();
        return;
      }
      if (this.pointerInOpenGap(clientY) && ((_c = this.held) == null ? void 0 : _c.row.isConnected)) {
        this.setClaimingDrop(true);
        this.markDestination(this.held.parent);
        this.showIndicator(this.held.row, this.held.edge);
        return;
      }
      const row = this.rowAt(e.target, clientY);
      if (!row) {
        this.clearIndicator();
        return;
      }
      const info = this.deps.describeRow(row.path);
      if (!info) {
        this.clearIndicator();
        return;
      }
      const rect = this.rowBox(row.el);
      const intent = intentFor({
        offsetY: clientY - rect.top,
        height: rect.height,
        isFolder: info.isFolder
      });
      if (intent.kind !== "between") {
        this.clearIndicator();
        return;
      }
      if (this.illegalTarget(this.dragged, info.parent)) {
        this.clearIndicator();
        return;
      }
      if (this.refusesCompactedMove(this.dragged, info.parent, intent.kind)) {
        this.clearIndicator();
        this.setClaimingDrop(true);
        return;
      }
      if (this.isNoOpReorder(this.dragged, info.parent, row.path, intent.edge)) {
        this.clearIndicator();
        return;
      }
      this.setClaimingDrop(true);
      this.held = { row: row.el, path: row.path, edge: intent.edge, parent: info.parent };
      this.markDestination(info.parent);
      this.watchForArrivals();
      this.showIndicator(row.el, intent.edge);
    });
    this.onDragEnd = () => this.guard(() => {
      var _a, _b, _c;
      this.clearIndicator(true);
      this.dragged = [];
      this.carried = [];
      this.draggedTruncated = false;
      (_b = (_a = this.deps).onDragDone) == null ? void 0 : _b.call(_a);
      (_c = this.sourceEl) == null ? void 0 : _c.removeEventListener("dragend", this.onDragEnd);
      this.sourceEl = null;
      this.geo.clear();
    });
    this.onDrop = (e) => this.guard(() => {
      var _a, _b, _c;
      this.syncGeometry();
      const dragged = this.dragged;
      const truncated = this.draggedTruncated;
      const carried = this.carried;
      this.dragged = [];
      this.carried = [];
      this.draggedTruncated = false;
      if (dragged.length === 0) {
        this.refuseBlockedCompactedDrop(e, carried);
        return;
      }
      const clientY = (_a = e.clientY) != null ? _a : 0;
      const shown = ((_b = this.held) == null ? void 0 : _b.row.isConnected) ? this.held : null;
      this.clearIndicator();
      if (!this.pointerInside((_c = e.clientX) != null ? _c : 0, clientY)) return;
      if (!this.targetIsOurs(e.target)) return;
      const row = shown ? { el: shown.row, path: shown.path } : this.rowAt(e.target, clientY);
      if (!row) return;
      const info = this.deps.describeRow(row.path);
      if (!info) return;
      let intent;
      if (shown) {
        intent = { kind: "between", edge: shown.edge };
      } else {
        const rect = this.rowBox(row.el);
        intent = intentFor({
          offsetY: clientY - rect.top,
          height: rect.height,
          isFolder: info.isFolder
        });
      }
      if (this.refusesCompactedMove(dragged, info.parent, intent.kind)) {
        this.refuseDrop(e);
        return;
      }
      if (intent.kind !== "between") return;
      if (this.illegalTarget(dragged, info.parent)) return;
      if (truncated) {
        this.reportUnclaimableSelection();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      this.endNativeDrag();
      const targetFolder = info.parent;
      const targetStored = this.toStored(row.path);
      if (!this.reordersInPlace(dragged, targetFolder)) {
        void this.deps.moveInto(dragged, targetFolder, intent.edge, targetStored).catch((err) => this.reportFailure(err));
        return;
      }
      const next = computeDrop({
        order: this.deps.storedOrder(targetFolder),
        displayed: this.deps.displayedOrder(targetFolder),
        dragged: dragged.map((p) => this.toStored(p)),
        targetPath: targetStored,
        edge: intent.edge
      });
      if (!next) return;
      void this.deps.writeOrder(targetFolder, next).catch((err) => this.reportFailure(err));
    });
  }
  bind(container) {
    this.unbind();
    this.container = container;
    this.ensureIndicator(container);
    this.doc = container.ownerDocument;
    container.addEventListener("dragstart", this.onDragStart, true);
    this.doc.addEventListener("dragover", this.onDragOver, false);
    this.doc.addEventListener("drop", this.onDrop, true);
    this.doc.addEventListener("dragend", this.onDragEnd, true);
  }
  unbind() {
    var _a, _b, _c, _d;
    const c = this.container;
    if (!c) return;
    this.cancelClosing();
    this.clearShifts();
    this.markDestination("");
    this.geo.clear();
    this.stopWatchingArrivals();
    this.cancelClosing();
    this.setClaimingDrop(false);
    c.removeEventListener("dragstart", this.onDragStart, true);
    (_a = this.doc) == null ? void 0 : _a.removeEventListener("dragover", this.onDragOver, false);
    (_b = this.doc) == null ? void 0 : _b.removeEventListener("drop", this.onDrop, true);
    (_c = this.doc) == null ? void 0 : _c.removeEventListener("dragend", this.onDragEnd, true);
    this.doc = null;
    (_d = this.indicator) == null ? void 0 : _d.remove();
    this.indicator = null;
    this.dragged = [];
    this.draggedTruncated = false;
    this.container = null;
  }
  /** Wraps every handler: a broken drag must never leave a stray line. */
  guard(fn) {
    try {
      fn();
    } catch (e) {
      this.clearIndicator();
      if (!this.warned) {
        this.warned = true;
        console.error("Spaces: reordering drag failed; leaving the drag to Obsidian", e);
      }
    }
  }
  /**
   * The row under the pointer.
   *
   * NOT `target.closest(SEL.rowWrapper)`: the vertical gap between two rows
   * belongs to their parent's `.tree-item-children`, so from there `closest`
   * walks up to the ENCLOSING FOLDER's wrapper, whose rect spans its entire
   * subtree (measured: 133px tall against a 25px row). Offset arithmetic
   * against that is meaningless — "before" resolves to the folder's top edge,
   * so the line jumps to the folder heading above and alternates with the
   * correct position, reading as a flickering, thickening line.
   *
   * So: prefer the row box the pointer is genuinely inside, and otherwise hit
   * test `clientY` against the rendered rows. That removes the dead zones too —
   * the left-hand indent strip belongs to the children container, not any row.
   */
  /**
   * Is the pointer over the tree at all? Required because the listeners are on
   * the document: without it, a drag in the editor at a y that happened to line
   * up with a tree row would resolve a row and draw a line.
   */
  pointerInside(clientX, clientY) {
    const c = this.container;
    if (!c) return false;
    const r = c.getBoundingClientRect();
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  }
  /**
   * Is the event's target the tree itself, rather than something drawn
   * ON TOP of it?
   *
   * `pointerInside` is geometry alone, and geometry cannot tell the tree apart
   * from a surface covering the tree's rect. spaces draws one itself — the
   * create panel is `position: absolute; inset: 0` and a SIBLING of
   * `.nav-files-container` inside the explorer pane — and a capture-phase
   * `stopPropagation` on the document cuts every handler below it.
   *
   * The middle case is the whole reason this is not `container.contains()`:
   *
   *  - inside the container: the tree. Ours.
   *  - outside the explorer PANE altogether: Obsidian's drag ghost, which is
   *    `position: fixed` with no `pointer-events: none`, lives in `body`, and
   *    is usually the node under the pointer. A real tree drop, and the reason
   *    these listeners are on the document at all. Ours.
   *  - inside the pane but outside the tree: something the pane stacked over
   *    the tree. NOT ours; it owns its own drops.
   */
  targetIsOurs(target) {
    const c = this.container;
    if (!c) return false;
    const node = target instanceof Node ? target : null;
    if (!node) return true;
    if (c.contains(node)) return true;
    const pane = c.closest(SEL.fileExplorerPane);
    return pane === null || !pane.contains(node);
  }
  /**
   * The row an event FIRED ON, from the target alone. No measuring, no
   * snapshot, no container needed.
   *
   * Split out of `rowAt` because the two answer different questions. This one
   * asks "which row is this event about", which is the only question a
   * `dragstart` has: the browser fires it on the element carrying `draggable`,
   * so `closest()` is exact. `rowAt` asks "which row is this POINTER over",
   * which needs geometry and a nearest-row fallback, and is the mid-drag
   * question.
   *
   * Having it on its own is what lets `onDragStart` publish what a drag
   * carries without taking a geometry snapshot first.
   *
   * Every type test here is Obsidian's cross-window `instanceOf`, never the
   * global `instanceof`. A popped-out explorer lives in another window whose
   * `HTMLElement` is a different constructor, so the global test refuses every
   * node in it: this function would resolve no row, `publishDrag` would publish
   * an empty list, and the whole drop-on-a-space-icon gesture would be dead in
   * that window with nothing to show for it. That is the defect release 0.7.3
   * shipped and the one `asNode` in `SwitcherView` exists to prevent, and this
   * function is the one that feeds the feature, so it gets the same treatment.
   */
  rowFromTarget(target) {
    const node = this.asNode(target);
    if (!node || !node.instanceOf(HTMLElement)) return null;
    const direct = node.closest(SEL.titleWithPath);
    if (!direct || !direct.instanceOf(HTMLElement)) return null;
    const path = direct.getAttribute("data-path");
    const el = direct.closest(SEL.rowWrapper);
    return path && el && el.instanceOf(HTMLElement) ? { el, path } : null;
  }
  /**
   * An event target as a `Node`, or null.
   *
   * The same helper, for the same reason, as `SwitcherView.asNode`: the global
   * `Node` is a different constructor in a popout window, so `instanceof` would
   * refuse every node there. The `typeof` test is for targets that are not
   * nodes at all -- a `Window`, which a drag event can carry -- and which
   * therefore have no `instanceOf` method to call.
   */
  asNode(target) {
    const node = target;
    return node && typeof node.instanceOf === "function" && node.instanceOf(Node) ? node : null;
  }
  rowAt(target, clientY) {
    const c = this.container;
    if (!c) return null;
    const direct = this.rowFromTarget(target);
    if (direct) return direct;
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const titled of Array.from(c.querySelectorAll(SEL.titleWithPath))) {
      if (!titled.instanceOf(HTMLElement)) continue;
      const r = this.stableRect(titled);
      if (!r || r.height <= 0) continue;
      const path = titled.getAttribute("data-path");
      const el = titled.closest(SEL.rowWrapper);
      if (!path || !(el instanceof HTMLElement)) continue;
      if (clientY >= r.top && clientY < r.bottom) return { el, path };
      const dist = clientY < r.top ? r.top - clientY : clientY - r.bottom;
      if (dist < bestDist) {
        bestDist = dist;
        best = { el, path };
        if (bestDist > r.height / 2) best = null;
      }
    }
    return best;
  }
  /**
   * Hand `onDragBegin` what this drag carries, once.
   *
   * Reading the selection is DOM work only — `querySelectorAll` and a class
   * test — so it costs no geometry snapshot and both callers below can afford
   * it.
   */
  publishDrag(row) {
    var _a, _b;
    const collected = row ? this.collectDragged(row) : { paths: [], truncated: false };
    (_b = (_a = this.deps).onDragBegin) == null ? void 0 : _b.call(_a, collected.paths, collected.truncated);
    return collected;
  }
  /**
   * Make sure this drag's end reaches `onDragEnd`, whatever happens to the row.
   *
   * ALSO on the row itself, not only on the document where `bind` put it. The
   * explorer renders in blocks and drops them as the pane scrolls, so
   * autoscrolling far enough during a drag destroys the row the drag started
   * on. Measured in a running vault with a 240-child folder open: a 3000px
   * scroll mid-drag replaced 48 of the 49 rendered rows and left
   * `document.contains(sourceRow)` false. The browser still sends `dragend` to
   * that node, but an event dispatched at a detached node reaches no listener
   * on the document, so the teardown never ran and the tree kept every row
   * translated down until the next drag.
   *
   * A node runs its OWN listeners whether or not it is still in the document,
   * which is the whole point of putting one here. `once` so a row cannot
   * accumulate one per drag, and `onDragEnd` takes it off explicitly as well
   * for the ordinary case where the document listener got there first.
   *
   * Shared by both paths through `onDragStart` rather than written out on the
   * armed one, because it is the BLOCKED path where the consequence of
   * skipping it is worst: that path publishes paths it never arms a teardown
   * for, and a record that outlives its drag is an act on notes and folders the
   * user never dragged.
   */
  armDragEnd(el) {
    this.sourceEl = el;
    el.addEventListener("dragend", this.onDragEnd, { once: true });
  }
  /**
   * Multi-selection is OPPORTUNISTIC. The explorer tracks its selection in a
   * private field this file may not touch, and `SEL.selectedRow` matches a
   * class Obsidian also uses elsewhere (the name is deliberately not repeated
   * here, so `grep` for it keeps answering "selectors.ts only" — the same
   * hygiene the quarantined private-API names require), so it is not
   * authoritative: selected siblings are collected only when the dragged row
   * itself carries the class, and otherwise the drag is the one row. That
   * fallback is the correct single-row behaviour, so no guess here can produce
   * a wrong result, only a less capable one.
   *
   * **And the DOM does not necessarily hold all of it.** The explorer detaches
   * rows when they scroll out of view: a 400-row tree rendered SIX of one
   * folder's 153 children behind a virtual spacer. Because spaces claims the
   * drop and performs the move itself, rows it never saw were simply not moved,
   * silently. Collecting more is not available — the real selection lives in a
   * private field the quarantine forbids, with no public API — so this reports
   * whether the set might be SHORT and `onDrop` declines rather than
   * half-moving: declining leaves the gesture with Obsidian, so the whole
   * selection still moves and only spaces's ordering precision is lost.
   *
   * The tell is geometric and needs nothing private: a selection that reaches
   * the first or last RENDERED row may continue past it — unless the scroller
   * is already at that end of its range.
   *
   * **Three of the four returns below are `whole(...)`:** no container, the
   * dragged row is not selected, or the selected set came back empty. Every one
   * of them means "just this row, there is no selection to miss", and a one-row
   * list is never short, so `truncated` is false on all three by construction.
   * Only the last return reads a selection, and it is therefore the only one
   * where `truncated` has anything to be right or wrong about.
   */
  collectDragged(row) {
    const whole = (paths2) => ({ paths: paths2, truncated: false });
    const c = this.container;
    if (!c) return whole([row.path]);
    const self = row.el.querySelector(SEL.titleWithPath);
    if (!(self && self.instanceOf(HTMLElement)) || !self.matches(SEL.selectedRow)) {
      return whole([row.path]);
    }
    const rendered = Array.from(c.querySelectorAll(SEL.titleWithPath));
    const paths = [];
    for (const el of rendered) {
      if (!el.matches(SEL.selectedRow)) continue;
      const p = el.getAttribute("data-path");
      if (p) paths.push(p);
    }
    if (paths.length === 0) return whole([row.path]);
    return { paths, truncated: this.selectionMayBeClipped(rendered) };
  }
  /**
   * Could the selection continue past the rendered window?
   *
   * Only if it touches an end of that window AND the scroller has more tree in
   * that direction. One pixel of slack at each end, because a scroll offset can
   * be fractional on a HiDPI display.
   *
   * Known blind spot, recorded rather than papered over: a selected row inside
   * a folder the user has since COLLAPSED is not rendered and is not adjacent
   * to the window's edges either, so this cannot see it. Nothing in the public
   * DOM can.
   *
   * SECOND BLIND SPOT, AND A STRUCTURAL ONE: THE TOP-EDGE HALF OF THIS TEST
   * CANNOT FIRE FOR A SELECTION INSIDE AN EXPANDED FOLDER.
   *
   * `rendered[0]` is read to ask whether the selection runs off the TOP of the
   * render window. Obsidian's virtualiser keeps the ANCESTOR CHAIN of
   * everything it renders, and a folder's own row is a sibling of the container
   * holding its children, so an expanded folder's row stays in the DOM however
   * far its children have scrolled away above the window. `rendered[0]` is
   * therefore that folder's row and never one of the selected notes, so
   * `first.matches(SEL.selectedRow)` is false no matter how much of the
   * selection has detached above. Only the `last` half ever reports anything.
   *
   * Measured, not reasoned. It was driven against a running vault with a
   * 401-note folder expanded: every step of a downward scroll reported the
   * first rendered row as the folder's own and unselected, while the selected
   * block drained away above the window. That harness lives outside this
   * repository, so there is no path here to cite; the measurement is recorded
   * at the predicate because this is where the person fixing it will look.
   *
   * WHAT IT COSTS TODAY. A selection clipped only at the top reports
   * `truncated: false`, so every consumer acts on the visible fraction. An
   * earlier version of this paragraph called both outcomes recoverable. One of
   * them is not, and saying so was the thing stopping anyone sizing this
   * properly:
   *
   *  - The space strip adds the rows it can see as members and reports that
   *    count as the whole gesture. Recoverable: the members can be removed.
   *  - `onDrop` is NOT only a reorder. When the drop lands under a different
   *    parent it calls `moveInto`, which is a filesystem move. `truncated` is
   *    exactly the flag that makes `onDrop` stand down and hand the gesture
   *    back to Obsidian, which would then move the WHOLE selection; blind on
   *    the top edge, it does not stand down, and renames only the fraction it
   *    can see. Spaces turns a complete native move into a partial one, on
   *    disk, with nothing of its own to undo it.
   *
   * So this is a live partial-move defect, not a recorded annoyance, and the
   * second bullet is the one that sets the priority. It is PRE-EXISTING: it
   * belongs to the file-tree drag and predates the space strip, which only ever
   * writes members. Whoever fixes it should read it as data loss.
   *
   * A FIX HAS TO SEE PAST THE ANCESTOR ROWS. Asking whether the first rendered
   * row that is a LEAF of the selection's own folder is selected, or comparing
   * the scroller's offset against the selection's own extent, are the two
   * shapes worth trying. Neither has been attempted, and `.is-selected` is not
   * authoritative in the first place (see `collectDragged`), so anything built
   * here needs its own measurement against a real virtualised tree.
   */
  selectionMayBeClipped(rendered) {
    const c = this.container;
    const first = rendered[0];
    const last = rendered[rendered.length - 1];
    if (!c || !first || !last) return false;
    const atTop = c.scrollTop <= 1;
    const atBottom = c.scrollTop + c.clientHeight >= c.scrollHeight - 1;
    return !atTop && first.matches(SEL.selectedRow) || !atBottom && last.matches(SEL.selectedRow);
  }
  /**
   * Would this drop move one of the dragged paths inside itself?
   *
   * Dragging a folder over its own row opens it, and the rows inside are then
   * ordinary between-row targets — so without this the drop was claimed and
   * `Archive` was moved to `Archive/Archive`, which the filesystem rejects
   * with EINVAL.
   *
   * The dragged paths are passed WHOLE, not filtered to folders: such a filter
   * guards nothing. For a target to be under a dragged path that path must have
   * descendants, which only a folder has, and `targetFolder` always comes from
   * a row's `parent`, which is always a folder path — so a dragged file matches
   * neither branch of the rule.
   */
  illegalTarget(dragged, targetFolder) {
    return movesIntoOwnSubtree(dragged, targetFolder);
  }
  /**
   * Would this same-parent drop leave the order exactly as it is?
   *
   * Asks `computeDrop` the same question the drop handler asks, so the line and
   * the drop can never disagree about whether a position does anything.
   * Returns false for a cross-folder drop, which always changes something.
   */
  isNoOpReorder(dragged, targetFolder, targetPath, edge) {
    if (!this.reordersInPlace(dragged, targetFolder)) return false;
    return computeDrop({
      order: this.deps.storedOrder(targetFolder),
      displayed: this.deps.displayedOrder(targetFolder),
      dragged: dragged.map((p) => this.toStored(p)),
      targetPath: this.toStored(targetPath),
      edge
    }) === null;
  }
  /**
   * Whether every dragged path already lives in the folder this drop lands in,
   * so the drop is a reorder rather than a move.
   *
   * Asked in DISPLAY space on both sides. `describeRow` answers the folder a
   * row is drawn inside, and `targetFolder` is another row's answer to the
   * same question, so the comparison is between two positions on screen --
   * which is what the user's gesture was made in.
   */
  reordersInPlace(dragged, targetFolder) {
    return dragged.every((p) => {
      var _a;
      return ((_a = this.deps.describeRow(p)) == null ? void 0 : _a.parent) === targetFolder;
    });
  }
  /** The dependency's answer, or the identity when nothing is compacted. */
  toStored(path) {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.deps).storedPathFor) == null ? void 0 : _b.call(_a, path)) != null ? _c : path;
  }
  /** The dependency's answer, or the identity when nothing is compacted. */
  toDisplay(path) {
    var _a, _b, _c;
    return (_c = (_b = (_a = this.deps).displayPathFor) == null ? void 0 : _b.call(_a, path)) != null ? _c : path;
  }
  /**
   * Would this gesture move a row that stands for a whole chain of folders out
   * of the folder it is drawn in?
   *
   * A compacted row is drawn at one level and lives at another, so there is no
   * single destination "move it into that folder" could mean: the folder the
   * user is pointing at would receive the chain's deepest folder, which is not
   * the thing they see or the thing they grabbed. Reordering among the rows it
   * is drawn beside has one unambiguous meaning and is allowed; everything
   * else is refused.
   *
   * `intent` decides which question to ask, because the two kinds of drop have
   * different destinations. A "between" lands in the target row's PARENT, so
   * it is a move unless every dragged row already lives there. An "into" lands
   * in the target row itself, which is never where a compacted row already is
   * -- a row cannot be drawn inside itself -- so it is always a move.
   *
   * ANY compacted row in the selection refuses the whole drop, matching
   * `movesIntoOwnSubtree`: a multi-selection is one gesture, and moving the
   * possible half would leave a partial result the user did not ask for.
   */
  refusesCompactedMove(dragged, targetFolder, intent) {
    if (!this.carriesCompacted(dragged)) return false;
    if (intent !== "between") return true;
    return !this.reordersInPlace(dragged, targetFolder);
  }
  /** Whether any of these rows stands for a whole chain of folders. */
  carriesCompacted(paths) {
    return paths.some((p) => {
      var _a, _b, _c;
      return (_c = (_b = (_a = this.deps).isCompactedRow) == null ? void 0 : _b.call(_a, p)) != null ? _c : false;
    });
  }
  /**
   * Refuse this drop: nobody acts on it, and the user is told why.
   *
   * `stopPropagation` without `preventDefault`; see the three outcomes in this
   * class's header for why those two are split here and nowhere else.
   */
  refuseDrop(e) {
    var _a, _b;
    e.stopPropagation();
    this.endNativeDrag();
    (_b = (_a = this.deps).onCompactedRowRefused) == null ? void 0 : _b.call(_a);
  }
  /**
   * The same refusal, on the path where `enabled()` kept this class out of the
   * gesture entirely.
   *
   * `dragged` is empty here, so none of the machinery above has run: no
   * geometry snapshot, no indicator, no held answer. The question is therefore
   * the coarser one -- "is a compacted row being dropped inside the tree" --
   * and it is answered without resolving a row or a band at all.
   *
   * That deliberately over-refuses. With reordering off there is no reorder to
   * offer, so every in-tree drop of a compacted row is a move or nothing, and
   * the two are not told apart: dropping the chain back onto its own row,
   * which Obsidian would have ignored, raises the notice too. A spare notice
   * costs a sentence; the alternative is modelling Obsidian's own target
   * resolution from the outside, and being wrong about THAT costs a folder.
   *
   * The two guards are the ones every drop here passes. `pointerInside` keeps
   * this off a drag into the editor or onto a tab, which is a link gesture and
   * not a move; `targetIsOurs` keeps it off a surface stacked over the tree,
   * whose own drop handler `stopPropagation` would otherwise cut.
   */
  refuseBlockedCompactedDrop(e, carried) {
    var _a, _b;
    if (!this.carriesCompacted(carried)) return;
    const clientX = (_a = e.clientX) != null ? _a : 0;
    const clientY = (_b = e.clientY) != null ? _b : 0;
    if (!this.pointerInside(clientX, clientY)) return;
    if (!this.targetIsOurs(e.target)) return;
    this.refuseDrop(e);
  }
  /**
   * Hide Obsidian's destination caption for the length of a drag this class is
   * not taking part in but is going to refuse.
   *
   * Re-evaluated per frame rather than set once, so the caption comes back by
   * itself the moment the pointer leaves the tree -- where the drop will not
   * be refused and Obsidian's answer is correct again.
   */
  markBlockedRefusal(e) {
    var _a, _b;
    this.setClaimingDrop(
      this.carriesCompacted(this.carried) && this.pointerInside((_a = e.clientX) != null ? _a : 0, (_b = e.clientY) != null ? _b : 0) && this.targetIsOurs(e.target)
    );
  }
  /**
   * Ask Obsidian to end its own drag. Called on every drop this class claims
   * or REFUSES, because both stop propagation and Obsidian's drop handler --
   * which does this teardown -- is therefore the one that never runs.
   */
  endNativeDrag() {
    var _a, _b;
    const el = this.sourceEl;
    this.sourceEl = null;
    const target = (el == null ? void 0 : el.isConnected) ? el : this.doc;
    if (!target) return;
    const view = (_a = this.doc) == null ? void 0 : _a.defaultView;
    const Ctor = (_b = view == null ? void 0 : view.DragEvent) != null ? _b : view == null ? void 0 : view.Event;
    if (!Ctor) return;
    target.dispatchEvent(new Ctor("dragend", { bubbles: true }));
  }
  /**
   * A drop declined because the selection outruns the render window.
   *
   * The console line is unconditional so the decline is never invisible to a
   * support question; the Notice, if any, is the caller's — this file has no
   * `"obsidian"` import and is not going to grow one.
   */
  reportUnclaimableSelection() {
    var _a, _b;
    console.warn(
      "Spaces: part of this selection is scrolled out of the explorer's render window, so the drop was left to Obsidian rather than moving only the rows spaces can see"
    );
    (_b = (_a = this.deps).onSelectionOutsideWindow) == null ? void 0 : _b.call(_a);
  }
  reportFailure(err) {
    console.error("Spaces: could not save the new order", err);
  }
  ensureIndicator(container) {
    if (this.indicator) return;
    const el = container.ownerDocument.win.createDiv();
    el.className = CLS_DROP_LINE;
    el.hidden = true;
    container.appendChild(el);
    this.indicator = el;
  }
  /**
   * A row's own clickable box — `.tree-item-self` — falling back to the wrapper.
   *
   * **VERTICAL geometry only, and that restriction is load-bearing.** A FOLDER's
   * wrapper contains its entire subtree, so its box runs from the folder row to
   * the bottom of its last descendant; hit-testing and `boundaryY` both depend
   * on this being the row strip and nothing more. It is equally wrong to measure
   * HORIZONTALLY, in the opposite direction — see `showIndicator`, which is why that
   * one caller does not use this.
   */
  rowBox(row) {
    const box = row.querySelector(SEL.titleWithPath);
    const strip = box instanceof HTMLElement ? box : row;
    const stable = strip.instanceOf(HTMLElement) ? this.stableRect(strip) : null;
    if (stable) return stable;
    const r = strip.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, height: r.height, left: r.left, width: r.width };
  }
  /**
   * The y of the boundary between two rows, in container space.
   *
   * ONE boundary must have ONE position. Rows are separated by a real gap —
   * `.tree-item-self` carries `margin-bottom: 2px` — so "after A" (A's bottom)
   * and "before B" (B's top) are two values 2px apart for what the user sees as
   * a single line. The line is itself 2px tall, so crossing that boundary
   * alternated between two adjacent, non-overlapping bands: a 4px flicker that
   * reads as the line thickening, with subpixel offsets rendering one at half
   * intensity — the "thin" state in the report.
   *
   * Taking the midpoint of the gap collapses both into the same pixel, derived
   * from the neighbouring row's geometry rather than a hardcoded 2px, so a theme
   * with different spacing needs no constant kept in sync.
   */
  boundaryY(row, edge) {
    const rect = this.rowBox(row);
    const neighbour = edge === "after" ? row.nextElementSibling : row.previousElementSibling;
    const nRect = neighbour instanceof HTMLElement && neighbour.matches(SEL.rowWrapper) ? this.rowBox(neighbour) : null;
    if (!nRect || nRect.height <= 0) return edge === "after" ? rect.bottom : rect.top;
    const gap = edge === "after" ? nRect.top - rect.bottom : rect.top - nRect.bottom;
    if (!(gap >= 0) || gap > rect.height) {
      return edge === "after" ? rect.bottom : rect.top;
    }
    return edge === "after" ? (rect.bottom + nRect.top) / 2 : (nRect.bottom + rect.top) / 2;
  }
  /**
   * The rows on screen, in document order, measured for `gapLayout`.
   *
   * The unit of movement is the row's own strip (`[data-path]`), NOT the
   * `.tree-item` wrapper. A folder's wrapper contains its whole subtree, so
   * transforming wrappers would move a folder's children twice: once with the
   * folder and once on their own. Strips are never nested inside each other.
   *
   * Horizontal geometry still comes from the wrapper, which is what carries
   * the indent. `showIndicator` has always split its measurements this way.
   */
  /**
   * Bring `geo` up to date, then answer from it alone.
   *
   * Called at the top of every handler that decides anything, so a row that
   * the explorer rendered into view a moment ago is measured before it is
   * asked about. A strip that already carries a shift is skipped rather than
   * re-measured, because its live rect is displaced and would poison the
   * entry the rest of the drag depends on.
   */
  syncGeometry() {
    var _a;
    const c = this.container;
    if (!c) return;
    const cRect = c.getBoundingClientRect();
    for (const strip of Array.from(c.querySelectorAll(SEL.titleWithPath))) {
      if (!strip.instanceOf(HTMLElement)) continue;
      if (((_a = this.shiftOf.get(strip)) != null ? _a : 0) !== 0) continue;
      const wrapper = strip.closest(SEL.rowWrapper);
      if (!wrapper || !wrapper.instanceOf(HTMLElement)) continue;
      const sRect = strip.getBoundingClientRect();
      const wRect = wrapper.getBoundingClientRect();
      this.geo.set(strip, {
        top: sRect.top - cRect.top + c.scrollTop,
        // Rounded like the other three. A real row is not a whole number of
        // pixels tall, and the box takes both its height and every row's
        // shift from this, so leaving it fractional put the box's bottom edge
        // and every displaced row on a subpixel while its top sat on a whole
        // one. Rounding keeps the box and the gap exactly the same size.
        height: Math.round(sRect.height),
        left: Math.round(wRect.left - cRect.left + c.scrollLeft),
        width: Math.round(wRect.width)
      });
    }
  }
  /**
   * A strip's undisplaced box in VIEWPORT coordinates, for comparing against a
   * pointer's `clientY`. Derived from the container-relative snapshot, so it
   * is correct at any scroll position and during any animation.
   */
  stableRect(strip) {
    const c = this.container;
    const g = this.geo.get(strip);
    if (!c || !g) return null;
    const cRect = c.getBoundingClientRect();
    const top = g.top + cRect.top - c.scrollTop;
    return { top, bottom: top + g.height, height: g.height, left: g.left, width: g.width };
  }
  visibleRows(c) {
    const out = [];
    for (const strip of Array.from(c.querySelectorAll(SEL.titleWithPath))) {
      if (!strip.instanceOf(HTMLElement)) continue;
      const row = this.geo.get(strip);
      if (!row) continue;
      if (!isLaidOut(row)) continue;
      out.push({ el: strip, row });
    }
    return out;
  }
  showIndicator(row, edge) {
    const c = this.container;
    if (!c) return;
    this.ensureIndicator(c);
    const el = this.indicator;
    if (!el) return;
    const cRect = c.getBoundingClientRect();
    const boundaryTop = Math.round(this.boundaryY(row, edge) - cRect.top + c.scrollTop);
    if (this.deps.indicatorStyle() === "line") {
      this.clearShifts();
      el.className = CLS_DROP_LINE;
      const rowRect = row.getBoundingClientRect();
      el.style.top = boundaryTop + "px";
      el.style.left = Math.round(rowRect.left - cRect.left + c.scrollLeft) + "px";
      el.style.width = Math.round(rowRect.width) + "px";
      el.style.removeProperty("height");
      el.hidden = false;
      return;
    }
    const rows = this.visibleRows(c);
    const strip = row.querySelector(SEL.titleWithPath);
    const targetIndex = rows.findIndex((r) => r.el === strip);
    const layout = gapLayout({
      rows: rows.map((r) => r.row),
      targetIndex,
      edge,
      boundaryTop
    });
    if (!layout) {
      this.clearIndicator();
      return;
    }
    const opening = this.openAt === null;
    this.cancelClosing();
    c.classList.toggle(CLS_GAP_DRAG, opening);
    for (let i = 0; i < rows.length; i++) {
      const shift = layout.shift[i];
      const el2 = rows[i].el;
      if (shift) el2.style.transform = `translateY(${shift}px)`;
      else el2.style.removeProperty("transform");
      this.shiftOf.set(el2, shift);
    }
    this.openAt = layout.box.top;
    this.openHeight = layout.box.height;
    if (opening) el.classList.remove(CLS_BOX_OPEN);
    el.className = CLS_DROP_BOX;
    el.style.top = layout.box.top + "px";
    el.style.left = layout.box.left + "px";
    el.style.width = layout.box.width + "px";
    el.style.height = layout.box.height + "px";
    el.hidden = false;
    if (opening) {
      void el.offsetWidth;
    }
    el.classList.add(CLS_BOX_OPEN);
  }
  /**
   * Marks, on the body, whether spaces owns the drop this frame.
   *
   * The stylesheet reads it to neutralise Obsidian's into-the-folder tint and
   * its "Move into <folder>" caption for exactly the frames where spaces is
   * drawing its own insertion point instead. Obsidian's own state is left
   * untouched, so the moment spaces stops claiming, its feedback comes back
   * by itself.
   */
  /**
   * Light up the folder a drop is going to land inside.
   *
   * The vault root is not a folder anyone can see, so an empty parent marks
   * nothing. Re-marking the row that is already marked is a no-op, which
   * matters because this runs on every frame of a held gap.
   *
   * `parent` is `describeRow`'s answer: the folder this row is drawn INSIDE,
   * which is already display space (see `describeRow` in `main.ts`, which uses
   * the same words). For every folder that HAS a row, that folder's path is
   * also what its row's `data-path` says, so the query below is exact. The one
   * folder for which it is not is the topmost folder of a compacted chain,
   * whose row carries the chain's deepest folder instead -- and a query for it
   * untranslated finds nothing, leaving the destination silently unlit.
   *
   * No production tree is known to reach that. `isHead` refuses to start a run
   * below a single-child scaffold parent, so a run's topmost folder is never
   * another row's parent by that route, and Task 1's blanking leaves a run's
   * hidden folders with no rows at all, which closes the other. So this is the
   * same coordinate translation every other path lookup in this file does,
   * placed at the one boundary where the two spellings could ever part, rather
   * than a fix for a miss that was measured.
   */
  markDestination(parent) {
    var _a;
    const c = this.container;
    if (!c) return;
    const shown = this.toDisplay(parent);
    const strip = shown ? c.querySelector(`${SEL.titleWithPath}[data-path="${CSS.escape(shown)}"]`) : null;
    const next = strip instanceof HTMLElement ? strip : null;
    if (next === this.parentMark) return;
    (_a = this.parentMark) == null ? void 0 : _a.classList.remove(CLS_DROP_PARENT);
    next == null ? void 0 : next.classList.add(CLS_DROP_PARENT);
    this.parentMark = next;
  }
  /**
   * Redraw the held answer when the tree gains or loses rows.
   *
   * Only while a gap is open, and disconnected the moment it closes. The
   * redraw writes the same answer, so a pointer that has not moved sees no
   * change beyond the newcomers falling into line.
   */
  watchForArrivals() {
    const c = this.container;
    if (!c || this.arrivals) return;
    this.arrivals = new MutationObserver(() => {
      var _a;
      if (!((_a = this.held) == null ? void 0 : _a.row.isConnected)) return;
      this.guard(() => {
        this.syncGeometry();
        if (this.held) this.showIndicator(this.held.row, this.held.edge);
      });
    });
    this.arrivals.observe(c, { childList: true, subtree: true });
  }
  stopWatchingArrivals() {
    var _a;
    (_a = this.arrivals) == null ? void 0 : _a.disconnect();
    this.arrivals = null;
  }
  /** Abandons a pending close, so a new gap is not stripped of its transition. */
  cancelClosing() {
    if (this.closing === null) return;
    window.clearTimeout(this.closing);
    this.closing = null;
  }
  /**
   * Is the pointer inside the gap that is already open?
   *
   * Box style only. The line opens no gap, so there is nothing to be inside
   * and its behaviour is unchanged.
   */
  pointerInOpenGap(clientY) {
    const c = this.container;
    if (!c || this.openAt === null || this.openHeight <= 0) return false;
    if (this.deps.indicatorStyle() !== "box") return false;
    const top = this.openAt + c.getBoundingClientRect().top - c.scrollTop;
    return clientY >= top && clientY < top + this.openHeight;
  }
  setClaimingDrop(on) {
    var _a;
    const body = (_a = this.doc) == null ? void 0 : _a.body;
    if (!body) return;
    body.classList.toggle(CLS_CLAIMS_DROP, on);
  }
  /**
   * Puts every displaced row back.
   *
   * Separate from hiding the indicator because the two failures are not
   * equally bad. An indicator left showing is a stale hint that the next frame
   * corrects. A transform left behind is a tree sitting permanently out of
   * position, which survives the drag and reads as corruption.
   */
  clearShifts(animate = false) {
    const c = this.container;
    const worthAnimating = animate && this.shiftOf.size > 0;
    if (worthAnimating && c) {
      c.classList.add(CLS_GAP_DRAG);
      void c.offsetWidth;
    } else {
      c == null ? void 0 : c.classList.remove(CLS_GAP_DRAG);
    }
    for (const el of this.shiftOf.keys()) el.style.removeProperty("transform");
    this.shiftOf.clear();
    if (worthAnimating && c) {
      this.cancelClosing();
      this.closing = window.setTimeout(() => {
        var _a;
        this.closing = null;
        (_a = this.container) == null ? void 0 : _a.classList.remove(CLS_GAP_DRAG);
      }, 140);
    }
  }
  /** Hides, never removes: removal during a drag is what caused the flicker. */
  clearIndicator(animate = false) {
    if (this.indicator) {
      this.indicator.hidden = true;
      this.indicator.classList.remove(CLS_BOX_OPEN);
    }
    this.openAt = null;
    this.openHeight = 0;
    this.held = null;
    this.markDestination("");
    this.stopWatchingArrivals();
    this.setClaimingDrop(false);
    this.clearShifts(animate);
  }
};

// src/explorer/leafVisitors.ts
function livePathsFrom(leaves, probe2) {
  const out = /* @__PURE__ */ new Set();
  for (const leaf of leaves) {
    try {
      const loaded = probe2.fileViewPath(leaf);
      if (loaded !== null) {
        out.add(loaded);
        continue;
      }
      const stated = probe2.stateFilePath(leaf);
      if (stated === null || stated === "") continue;
      const resolved = probe2.resolveFilePath(stated);
      if (resolved !== null) out.add(resolved);
    } catch (e) {
      continue;
    }
  }
  return out;
}

// src/main.ts
var SORT_MENU_MODE = "User ordered";
function sameResortSignature(a, b) {
  if (a.selection !== b.selection || a.order !== b.order) return false;
  if (a.chainIndex !== b.chainIndex) return false;
  if (a.visible === b.visible) return true;
  if (!a.visible || !b.visible) return false;
  if (a.visible.size !== b.visible.size) return false;
  for (const p of a.visible) if (!b.visible.has(p)) return false;
  return true;
}
function sameDefs(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
var ATTR_SPACE = "data-spaces-space";
function renameTouchesDefs(defs, oldPath, newPath) {
  var _a, _b, _c;
  const under = `${oldPath}/`;
  const hit = (s) => s === oldPath || s === newPath || s.startsWith(under);
  for (const space of defs.spaces) {
    if (space.root !== void 0 && hit(space.root)) return true;
    for (const m of pathMembers(space)) if (hit(m.path)) return true;
    for (const p of (_a = space.exclude) != null ? _a : []) if (hit(p)) return true;
  }
  const maps = [];
  if ((_b = defs.orders) == null ? void 0 : _b.all) maps.push(defs.orders.all);
  if ((_c = defs.orders) == null ? void 0 : _c.bySpaceId) maps.push(...Object.values(defs.orders.bySpaceId));
  for (const map of maps) {
    for (const [folder, order] of Object.entries(map)) {
      if (hit(folder)) return true;
      for (const entry of order) if (hit(entry)) return true;
    }
  }
  return false;
}
var SpacesPlugin = class extends import_obsidian24.Plugin {
  constructor() {
    super(...arguments);
    /**
     * Whether Obsidian's metadata cache has finished its initial parse, which
     * is what lets the controller tell "no matches yet" from "no matches".
     *
     * `metadataCache.on("resolved")` is the only thing that sets it true, and
     * it is public. `onload()` seeds it from `workspace.layoutReady` because of
     * the one case the event cannot cover: a plugin ENABLED after startup has
     * already missed `resolved`, and would never see another until some file
     * changed, so a tag space would stay fallen open indefinitely. During app
     * startup `onload` runs before the layout is ready, so the seed is false
     * exactly when the cache really is cold, and true exactly when the plugin
     * was started into a running app whose cache is already warm.
     *
     * The listener is registered in `onload` too, and that placement is load
     * bearing: `resolved` fires before `onLayoutReady`, so registering any
     * later misses it. See the registration for the measurement.
     */
    this.metadataResolved = false;
    /**
     * Stamps each property snapshot so one can be told from the one it replaced.
     * Only ever incremented, and only by `newPropertySnapshot`. Nothing
     * compares the stamp yet; `PropertyIndex.generation` says what it is for.
     */
    this.propertyGeneration = 0;
    /** Open property pickers, each owned by the panel that opened it. */
    this.propertyRefresh = new PropertyRefreshHub();
    /**
     * Watches whether Obsidian is still getting through its parse queue.
     *
     * Armed on the first `resolved` and re-armed whenever a property consumer
     * asks and is told "unavailable". `lifecycle/parseStall.ts` carries the
     * measurements that rule out every cheaper trigger. Sampling costs one
     * scalar read and no vault walk, so it is free in the terms
     * `tests/propertyWorkBudget.test.ts` states the budget in.
     *
     * A FIELD INITIALIZER, like the coalescer, so it is alive from construction
     * and its `cancel` can be registered in `onload` before anything that may
     * throw.
     */
    this.parseStall = createParseStallWatch({
      timer: {
        set: (fn, ms) => window.setTimeout(fn, ms),
        clear: (handle) => window.clearTimeout(handle)
      },
      progress: () => nativeParseProgress(this.app),
      // The verdict changes nothing about what is on screen. It is the moment we
      // can finally tell "Obsidian is still starting up" from "Obsidian is
      // stuck", which is the only point at which saying something is useful
      // rather than alarming.
      onStalled: () => this.reportParseStall()
    });
    /**
     * The unparsed paths the most recent property walk found, for the notice.
     *
     * Written by the accessor in `newPropertySnapshot` and read only when the
     * stall latches. Empty when nothing has walked, which is why the notice is
     * keyed on this being non-empty rather than on the snapshot being
     * unavailable: an unavailable snapshot with no paths means nobody looked.
     */
    this.propertyUnparsed = [];
    // ONE notice per stall needs no flag of its own: `onStalled` fires on the
    // TRANSITION to a latched verdict, and the watcher only latches again after
    // the parse counter has moved or drained. See `lifecycle/parseStall.ts`.
    /**
     * Takes `fileManager.getNewFileParent` back off. Null until `start()`
     * installs it, and null again once teardown has run.
     */
    this.restoreNewFileParent = null;
    /** Takes the two quarantined creation patches back off. */
    this.restoreNativeCreate = null;
    this.nativeWorkspacesWarned = false;
    // A runtime-state write failure warns, but a Notice on every
    // failed write would be worse than the silence it replaces.
    this.runtimeWriteWarned = false;
    this.adapter = new ExplorerAdapter();
    this.switcher = null;
    /**
     * What the live drag carries, shared between the tree and the strip.
     *
     * Owned here rather than by either of them: `DragOrdering` publishes to it
     * and `SwitcherView` reads it, and neither should have to know the other
     * exists. Both reach it through callbacks for the same reason.
     */
    this.currentDrag = new CurrentDrag();
    this.header = null;
    /** The one-shot gesture a native create may be attributed to. */
    this.creationIntent = null;
    /** A few seconds of create/delete history, never persisted. */
    this.moveBuffer = [];
    /** The sort order last seen, so a change can be told from a re-sort. */
    this.lastSortOrder = null;
    /**
      * The deferred write's timer id, so it can be cancelled on unload rather
      * than firing for a plugin that is no longer loaded. Non-null also means a
      * gesture is already pending, which is what dedupes the write.
      */
    this.sortGestureTimer = null;
    /**
     * The live blocked-drag Notice, or null. Kept only so a repeat attempt
     * REUSES the toast rather than stacking a second identical one; every
     * blocked drag still gets feedback. Not a notify-once flag — the predicate
     * that decides whether to speak is stateless, deliberately.
     *
     * `Notice.hide()` is the obvious way to do this and does not work: measured
     * against 1.13.7, a notice is still connected at opacity 1 seconds after
     * `hide()` returns. Removing the element by hand means reaching for
     * `noticeEl.parentElement` (`noticeEl` is the inner `.notice-message`, not
     * the toast) — undocumented structure, and a selector outside
     * `selectors.ts`. So the live one is reused instead.
     */
    this.blockedDragNotice = null;
    // Built fresh per open (never cached/reused) so `defaultColor` — a
    // plain string captured at construction — reflects the rotation at the
    // moment the panel opens rather than whichever value was true the first
    // time this field was populated. Kept only for the open-check and
    // teardown; see openCreatePanel().
    this.createPanel = null;
    // Guards start() against a race with onunload: onLayoutReady can fire
    // after the plugin has already been unloaded (a toggle during startup, or
    // a fast reload cycle). Without this, start() would install a
    // MutationObserver, append the switcher, and register vault listeners on
    // a Component that will never unload again.
    this.loaded = false;
    this.unsubscribeDefs = null;
    /**
     * Held, rather than handed to `addSettingTab` and forgotten, because a
     * declarative settings tab does not re-read its own definitions: Obsidian
     * asks once at registration and renders that. The definition subscription
     * below is what tells it the space list moved.
     */
    this.settingTab = null;
    /**
     * The last probe result, kept so the fixture-vault verification and a
     * support question can both read it without reaching into the quarantine
     * module.
     *
     * `private` because it was one of the eight fields that formed the plugin's
     * accidental public API, and the deliberate surface is `api` below. The
     * fixture check reads it by bracket access, which keeps the intent visible at
     * the call site instead of implying support for it here.
     */
    this.sortProbe = null;
    /**
     * Every main-window explorer view we hold a patch on, in
     * workspace order. `sortedViews[0]` is the PRIMARY — the pane the chrome,
     * the drag gesture and the sort-order observation all read, because
     * each of those is one interaction with one pane. Filtering and ordering
     * are not: they are the selection, and the selection applies to
     * every leaf.
     */
    this.sortedViews = [];
    /**
     * The signature of the last re-sort that actually happened, or null
     * for "the next one must run". See `applyFilterAndOrdering`.
     */
    this.lastResort = null;
    this.sortProbeWarned = false;
    this.dragOrdering = null;
    // ExplorerAdapter.onHealthChange already fires only on a transition, but
    // this flag is a second guard against notifying more than once per break
    // — reset when health returns so a later break is reported again.
    this.explorerHealthWarned = false;
    /**
     * The manual fail-open escape hatch. Every other fail-open
     * path is automatic, and "Switch to All" is not the same thing —
     * *All* is still a managed mode that applies `orders.all`, the switch mask
     * and the sort patch. While this is set the seam is released entirely, so
     * the explorer is Obsidian's own unfiltered, natively sorted tree.
     */
    this.filteringPaused = false;
    /**
     * The declared extension surface, reachable the conventional way as
     * `app.plugins.plugins.spaces.api`. A field initialiser rather than
     * something built in `onload`, so a consumer that reaches the plugin object
     * at all reaches a complete API — the methods resolve their collaborators
     * when called, not when built.
     */
    /**
     * The declared surface, and the accessors behind it. Built here rather than
     * in `start()` because `api` must exist the moment the plugin object does;
     * every dependency is read per call for the same reason.
     */
    /**
     * Announces a folder pinned space whose folder is missing, and carries the
     * repair. Built here so it exists before `start()`; its dependencies are
     * read per call for the same reason.
     */
    this.missingRoot = new MissingRootNotice({
      app: () => this.app,
      activeSpace: () => this.publicApi.activeSpace(),
      folders: () => this.folderSource(),
      setRoot: (spaceId, path) => setSpaceRoot(this.defs, spaceId, path)
    });
    this.publicApi = new PublicApi({
      spaces: () => {
        var _a, _b;
        return (_b = (_a = this.defs) == null ? void 0 : _a.get().spaces) != null ? _b : [];
      },
      selection: () => {
        var _a, _b;
        return (_b = (_a = this.runtime) == null ? void 0 : _a.getSelection()) != null ? _b : null;
      },
      filteringPaused: () => this.filteringPaused
    });
    this.api = this.publicApi.surface;
    this.resampleHandle = null;
    /**
     * A full re-index, a full visibility snapshot and a forced full explorer
     * re-sort per vault event measures ~2-9 ms in *All* and up to ~1,630 ms for
     * a space of five real project folders, per event — and a sync, a `git
     * pull`, a restore or an importer pays that once per file.
     *
     * The membership work still runs immediately and in order; only the tail
     * behind it is coalesced. `eventCoalescer.ts` carries the correctness
     * argument and the choice of window.
     */
    this.vaultChanges = createVaultChangeCoalescer({
      timer: {
        set: (fn, ms) => window.setTimeout(fn, ms),
        clear: (handle) => window.clearTimeout(handle),
        now: () => Date.now()
      },
      // ONE coalescer, one timer, for vault events and metadata events alike.
      // A note creation emits both, and two timers flushed twice and notified
      // pickers twice. What the flush does depends on what the burst held, and
      // `runFlush` decides that, so the work-budget tests run the same code.
      //
      // The vault index replacement is O(vault) and is only for a burst that held
      // a VAULT event. A metadata burst recomputes and notifies and does not
      // re-index the tree: a note's metadata is not vault structure.
      flush: () => runFlush(this.flushState, {
        // A snapshot, replaced in place so every captured controller reference
        // stays valid. Built at flush time, so it is the burst's end state.
        replaceVaultIndex: () => this.controller.setVaultIndex(createObsidianVaultIndex(this.app.vault)),
        // LAZY: the metadata walk happens when `resolveMembers` expands a tag
        // member and at no other time. Replaced after the vault index, so it is
        // never older than the vault index it is read against.
        replaceTagIndex: () => this.controller.setTagIndex(createLazyTagIndex(() => createObsidianTagIndex(this.app))),
        // LAZY for the same reason: the walk happens when a property member
        // asks. Skipped only when one was installed after the burst's last
        // vault event, which `RefreshFlushState` explains.
        installPropertySnapshot: () => this.controller.setPropertySnapshot(this.newPropertySnapshot()),
        notifyPickers: () => this.propertyRefresh.notify(),
        refresh: () => this.controller.refresh()
      })
    });
    /** What the coming flush has to do. See `RefreshFlushState`. */
    this.flushState = new RefreshFlushState();
    /**
     * Filter, then order. Filtering first needs no special rule: a stored order
     * need not be total, so ordering a shrunken set is already well defined.
     *
     * EVERY exit from this function returns the FILTERED items, never the raw
     * ones. The ordering half has three legitimate reasons to decline (no stored
     * order, an item it cannot key, a duplicate path); handing Obsidian its own
     * array back for any of them silently stops filtering the tree - for a user
     * who has never reordered anything, on every folder.
     */
    // Typed explicitly rather than as `TransformItems`: the third, optional
    // `view` parameter is not part of the seam's contract - `patch()` only ever
    // calls a `transform` with two arguments - it is how the per-view closure in
    // `ensureOrderingPatched` tells this method which pane is asking. Three
    // things need to know: `hoistedRootItems` reads that pane's live tree items,
    // and both halves of compaction resolve a run's tip through
    // `compactedTipItem`, which answers nothing at all for a null view. A
    // plain `TransformItems` annotation would still be assignable to `patch()`'s
    // parameter, but would stop that closure passing `view` at all.
    this.filterAndOrderFolder = (folderPath, items, view) => {
      var _a, _b, _c, _d;
      this.admittedThisCall.clear();
      const hiddenRun = (_a = this.chainIndexNow) == null ? void 0 : _a.hiddenSegments.get(folderPath);
      if (hiddenRun && this.compactedTipItem(hiddenRun, view != null ? view : null)) return [];
      const root = this.activeSpaceRoot();
      if (root !== null && isVaultRoot(folderPath)) {
        this.permitsForThisCall = (_b = this.currentPermits()) != null ? _b : null;
        const hoisted = this.hoistedRootItems(root, (_c = view != null ? view : this.explorerViews()[0]) != null ? _c : null);
        if (hoisted !== null) return this.filterAndOrderFolder(root, hoisted, view);
      }
      this.observeSortOrder();
      const visible = filterVisibleItems(items, this.controller.currentSnapshot());
      const map = this.orderMapFor();
      if (!map) return this.substituteCompacted(visible, view != null ? view : null);
      const key = folderPath === "/" ? "" : folderPath;
      const order = Object.prototype.hasOwnProperty.call(map, key) ? map[key] : void 0;
      if (!order) return this.substituteCompacted(visible, view != null ? view : null);
      const byPath = /* @__PURE__ */ new Map();
      const live = [];
      for (const item of visible) {
        const p = (_d = item.file) == null ? void 0 : _d.path;
        if (typeof p !== "string" || byPath.has(p)) {
          return this.substituteCompacted(visible, view != null ? view : null);
        }
        byPath.set(p, item);
        live.push(p);
      }
      return this.substituteCompacted(
        applyOrder(order, live).map((p) => byPath.get(p)),
        view != null ? view : null
      );
    };
    /**
     * Tips this transform call substituted, for the seam's subset guard.
     *
     * Cleared at the top of every transform and read by `livePermits` straight
     * afterwards, because `isAllowed` runs on the array the transform just
     * returned. Not keyed by folder path: the hoist branch re-enters the
     * transform for a DIFFERENT folder than the one `isAllowed` will check,
     * so a folder-keyed record would miss. Per call is the same discipline
     * `permitsForThisCall` documents.
     */
    this.admittedThisCall = /* @__PURE__ */ new Set();
    /**
     * Every compacted run in the active space, or null when compaction is off.
     *
     * Built ONCE per snapshot, not per sort-seam call, because its consumers
     * read it on different schedules: the seam substitutes heads and blanks
     * hidden segments during a sort, `ExplorerAdapter` labels during a
     * MutationObserver pass that runs at a different time, and the drag
     * translation reads it whenever a pointer moves. A per-call record would be
     * empty by the time any of the others looked.
     *
     * ADMISSION IS NOT ONE OF THEM. The seam's permits predicate admits a
     * substituted tip from `admittedThisCall`, which this object never feeds —
     * see `buildChainIndex`'s own note on why the two lifetimes differ.
     *
     * Rebuilt rather than patched: the runs are a function of the snapshot, and
     * a snapshot is already the thing that changes when membership or visibility
     * does.
     *
     * NULL IS A REAL ANSWER, and not only when the setting is off. It also means
     * "nothing is going to re-sort this tree", which `seamIsPatchedEverywhere`
     * decides before the index is built and `applyFilterAndOrdering` decides
     * again after the re-sort is attempted. Both write null here, and the
     * adapter labels nothing from a null index, so the chain falls back to the
     * honest nested tree rather than being labelled as something it is not
     * drawn as.
     */
    this.chainIndexNow = null;
    /**
     * `patch()`'s `permits` argument must NOT be computed once, at whatever
     * moment a view was first patched, and captured in the closure handed to
     * `patch()` — for the same reason `transform` is never captured that way:
     * the explorer VIEW persists across a space switch, and
     * `ensureOrderingPatched` skips a view already in `sortedViews`. Start in
     * All (permits `undefined`), switch into a folder space, sort: the captured
     * closure still answers `undefined`, `isAllowed` rejects every hoisted row
     * as unrecognised, and the seam falls back to the RAW vault-root items —
     * every note the space excludes, rendered.
     *
     * So this is a STABLE closure, passed once at patch time like `transform`,
     * resolving `currentPermits()` fresh per SORT CALL; answering `false` with
     * no folder space active is equivalent to supplying no predicate, so a
     * switch needs no unpatch/re-patch dance. Recomputing `currentPermits()` for
     * each of `isAllowed`'s out-of-input items would be O(rows x leaves) for one
     * vault-root sort, so `permitsForThisCall` resolves it once per call and
     * this reads that. Caching WITHIN one call is the optimisation; caching
     * ACROSS calls is the bug above.
     */
    this.livePermits = (folderPath, itemPath) => {
      var _a, _b;
      if ((_b = (_a = this.permitsForThisCall) == null ? void 0 : _a.call(this, folderPath, itemPath)) != null ? _b : false) return true;
      return typeof itemPath === "string" && this.admittedThisCall.has(itemPath);
    };
    /**
     * This call's resolved permits, or `null` when none applies — set exactly
     * once per `filterAndOrderFolder` call, at the hoist branch, and read by
     * `livePermits` for every item `isAllowed` asks about during that call.
     * Never read stale: the per-item check is only ever reached synchronously
     * after `transform` returns, within the SAME sort invocation.
     *
     * Deliberately NOT cleared after the call. Clearing on entry to
     * `filterAndOrderFolder` would wipe it during the hoist branch's own
     * recursive call, and `isAllowed` reads it AFTER `transform` returns, so the
     * value must outlive the function that set it.
     *
     * WHY A LEFTOVER IS STILL HARMLESS, restated for compaction. This used to
     * rest on "outside the hoist branch every folder's `out` is an identity
     * subset of `items`, so `isAllowed` short-circuits and never consults the
     * predicate". That is no longer true: `substituteCompacted` can return a
     * run's tip for ANY folder, so `isAllowed` now does consult `livePermits`
     * for ordinary folders, and `livePermits` reads this field first — possibly
     * a value left behind by an earlier call for a space that is no longer
     * active.
     *
     * TWO OF THE THREE CASES are closed by a fact about `makePermits`: it
     * answers false for every folder but the vault root (`folderSpace.ts:113`,
     * `if (!isVaultRoot(folderPath)) return false`). So a stale predicate cannot
     * admit anything at the ordinary folders compaction newly brings here, and
     * at the vault root of an ACTIVE folder space the hoist branch has already
     * overwritten this field earlier in the same call.
     *
     * THE THIRD CASE IS NOT CLOSED BY IT, and the first draft of this note
     * claimed it was. Switch from a folder space to a CURATED one and sort the
     * vault root: `activeSpaceRoot()` is null, the hoist branch is skipped,
     * this field still holds the previous space's `makePermits(oldRoot, …)`,
     * and `isVaultRoot` is true, so the stale predicate IS consulted and CAN
     * answer true -- for any path whose parent was the old root, or that was in
     * the old elsewhere set.
     *
     * It is still harmless, for a reason that covers all three: admitting an
     * extra path only stops `isAllowed` REJECTING. It cannot put a row in `out`,
     * and `out` is built from filtered items, resolved tips, and -- in the hoist
     * case -- `hoistedRootItems`, every one of them a real item of this pane.
     * Admission widens, it never fabricates. That is the sentence to weigh against before
     * giving this field a real lifetime, not the `folderSpace.ts:113` one.
     */
    this.permitsForThisCall = null;
  }
  async onload() {
    this.loaded = true;
    this.metadataResolved = this.app.workspace.layoutReady;
    this.registerEvent(
      this.app.metadataCache.on("resolved", () => {
        this.metadataResolved = true;
        this.parseStall.arm();
        this.onMetadataEvent();
      })
    );
    this.register(() => this.vaultChanges.cancel());
    this.register(() => this.propertyRefresh.clear());
    this.register(() => this.parseStall.cancel());
    this.register(() => {
      if (this.resampleHandle !== null) window.clearTimeout(this.resampleHandle);
      this.resampleHandle = null;
    });
    this.defs = new DefinitionStore(
      {
        read: () => this.loadData(),
        write: (d) => this.saveData(d),
        // Data.json is the only copy of a user's curation. Obsidian's
        // File Recovery core plugin snapshots Markdown only, so nothing else
        // in the app holds a previous version of it.
        //
        // A sidecar `.bak` rather than write-temp-then-rename because
        // `Plugin.saveData` must stay the writer of data.json itself: it is
        // what stamps the mtime Obsidian compares in `_onConfigFileChange`,
        // so a rename that bypassed it would make every local save look like
        // an external change and re-enter external-wins arbitration against
        // ourselves.
        // The sidecar sits beside it and is never read by Obsidian.
        backup: (d) => this.app.vault.adapter.write(
          `${this.app.vault.configDir}/plugins/${this.manifest.id}/data.json.bak`,
          JSON.stringify(d, null, 2)
        )
      },
      (message) => new import_obsidian24.Notice(message)
    );
    const outcome = await this.defs.load();
    if (!outcome.ok) {
      new import_obsidian24.Notice(
        outcome.futureSchema ? "Spaces: settings are from a newer version. Showing all notes and folders, and not saving changes." : `Spaces: settings could not be read (${outcome.error}). Showing all notes and folders, and not saving changes.`
      );
    }
    this.runtime = new RuntimeStateStore(
      {
        get: (k) => this.app.loadLocalStorage(k),
        set: (k, v) => this.app.saveLocalStorage(k, v)
      },
      (e) => {
        if (this.runtimeWriteWarned) return;
        this.runtimeWriteWarned = true;
        new import_obsidian24.Notice(
          `Spaces: could not save layout/selection state (${String(e)}).`
        );
      }
    );
    this.runtime.load();
    if (outcome.ok) {
      this.runtime.reconcileLayouts(this.defs.get().spaces.map((s) => s.id));
    }
    this.settingTab = new SpacesSettingTab(
      this.app,
      this,
      this.defs,
      // THE tag index, reached rather than built. Deferred like the three
      // accessors further down, and for a sharper reason than they have:
      // the controller that owns the index is built in `start()` and this
      // runs in `onload()`, and the index itself is a snapshot that every
      // flush and every metadata change replaces.
      () => this.controller.tagIndex(),
      {
        onDeleted: (id) => {
          this.runtime.dropLayoutFor(id);
          this.missingRoot.clearIfAbout(id);
          this.runtime.dropSortOverrideFor(id);
        }
      },
      () => this.effectiveRestoreState(),
      // "unknown" means the seam is gone, so the toggle says so
      // rather than silently doing nothing. Null means we have not probed
      // yet (no explorer bound), which is not a failure to report.
      () => ({ available: this.sortProbe !== "unknown" }),
      // The switcher does not exist yet at this point in `onload()`; deferred
      // the same way the two accessors above are, so it is read when a
      // placement change actually happens rather than now.
      () => {
        var _a;
        return (_a = this.switcher) == null ? void 0 : _a.cancelDrag();
      },
      () => this.controller.drawnPropertyIndex()
    );
    this.addSettingTab(this.settingTab);
    this.app.workspace.onLayoutReady(() => this.start());
  }
  /** Plugin.onExternalSettingsChange — the external-wins policy. */
  async onExternalSettingsChange() {
    try {
      const token = this.defs.writeToken();
      const snapshot = await this.loadData();
      await this.defs.onExternalChange(snapshot, token);
    } catch (e) {
      console.error("Spaces: could not apply an external data.json change", e);
      return;
    }
    this.repaintStep("controller.refresh", () => {
      var _a;
      return (_a = this.controller) == null ? void 0 : _a.refresh();
    });
    this.repaintStep("switcher.render", () => {
      var _a;
      return (_a = this.switcher) == null ? void 0 : _a.render();
    });
    this.repaintStep("header.render", () => {
      var _a;
      return (_a = this.header) == null ? void 0 : _a.render();
    });
  }
  /**
   * One chrome repaint, isolated. The switcher, the header and the
   * controller all read the same store and none depends on another having
   * drawn, so a throw from one must not leave the others showing state that
   * has already been replaced — the same reasoning as `bindExplorer` steps 3
   * and 3b, which are guarded separately from each other for this reason.
   */
  repaintStep(what, step) {
    try {
      step();
    } catch (e) {
      console.error(`Spaces: ${what} failed after an external change`, e);
    }
  }
  /**
   * `onload` ends at `workspace.onLayoutReady(() => this.start())` — a bare
   * callback Obsidian invokes with no catch of its own, so an unguarded throw
   * is reported against Obsidian rather than spaces, and the user is told
   * nothing at all while the file tree quietly never filters.
   *
   * A TOP-LEVEL guard, unlike the per-step guarding teardown uses: `onunload`'s
   * steps are independent removals, whereas `startSteps()` builds a chain, so
   * continuing past a failed step would install half a plugin that reports
   * itself as working. Stop, say so where the user can see it, and leave the
   * tree unfiltered: filtering fails open.
   */
  start() {
    if (!this.loaded) return;
    try {
      this.startSteps();
    } catch (e) {
      console.error("Spaces: failed to start; the file tree is unfiltered", e);
      new import_obsidian24.Notice(
        "Spaces: failed to start. The file tree is showing every note, unfiltered. Your spaces are untouched. See the developer console for the error, then reload the plugin."
      );
    }
  }
  startSteps() {
    if (armsParseStall(this.defs.get().spaces)) this.parseStall.arm();
    this.adapter.onHealthChange((healthy) => {
      if (healthy) {
        this.explorerHealthWarned = false;
        return;
      }
      if (this.explorerHealthWarned) return;
      this.explorerHealthWarned = true;
      new import_obsidian24.Notice(
        "Spaces: dimming is off. Parent folders, and notes you open from outside this space, now look the same as the space's own notes and folders. Filtering is unaffected. Reload Obsidian to try again, and check for a Spaces update if the dimming stays off."
      );
    });
    this.layout = new LayoutCoordinator(
      createObsidianLayoutPort(this.app),
      this.runtime
    );
    this.controller = new SpaceController(
      this.defs,
      this.runtime,
      // LAZY, for the same reason the tag index below is. The walk costs
      // 6.6 ms on a 10,000 note vault and `recompute` returns before touching
      // the vault index at all while All is active — which is the majority
      // case, and the only case for a user who has never made a space. It ran
      // here inside `onload()`, which Obsidian awaits. The ordering invariant
      // survives: the flush installs the vault index before the tag index,
      // and a wrapper can only build at or after the moment it was installed.
      createLazyVaultIndex(() => createObsidianVaultIndex(this.app.vault)),
      {
        apply: (snap) => this.onSnapshotApplied(snap),
        livePaths: () => this.liveLeafPaths(),
        metadataReady: () => this.metadataResolved
      },
      createLazyTagIndex(() => createObsidianTagIndex(this.app)),
      this.newPropertySnapshot(),
      {
        transition: (from, to) => this.runMaskedTransition(from, to),
        // ChangeLayout() tears down and rebuilds the explorer
        // view DOM, and the layout-change event it fires is not a reliable
        // signal to rebind — it can arrive before the new container exists,
        // leaving the adapter bound to a detached node with no notice. Rebind
        // explicitly here instead. onOutcome runs after transition resolves
        // and before the selection commits and recompute() runs (see the
        // controller.test.ts test asserting that ordering), so bind always
        // happens before the tree is re-classed. "skipped" means restoration
        // never touched the DOM, so there is nothing to rebind.
        onOutcome: (outcome) => {
          if (outcome.kind !== "skipped") this.bindExplorer();
          this.reportLayoutOutcome(outcome);
        },
        onSelectionDropped: (from) => {
          void this.controller.runQueuedLayoutJob(() => this.settleLayoutAfterDrop(from));
        }
      }
    );
    this.restoreNewFileParent = installNewFileRedirect(this.app, () => this.activeSpaceRoot());
    this.restoreNativeCreate = installNativeCreateRedirect(
      this.app,
      () => this.activeSpaceRoot()
    );
    this.bindExplorer();
    this.controller.refresh();
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (!isVaultRoot(file.path)) return;
        menu.addItem(
          (i) => i.setTitle("New space").setIcon("layers").onClick(() => this.openCreatePanel())
        );
      })
    );
    registerMembershipMenus(this, { defs: this.defs, controller: this.controller });
    this.registerEvent(
      this.app.workspace.on(
        "file-open",
        (file) => this.controller.onActiveFileChanged(file instanceof import_obsidian24.TFile ? file.path : null)
      )
    );
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.bindExplorer();
        this.controller.refresh();
      })
    );
    this.registerEvent(
      this.app.vault.on("rename", (file, oldPath) => {
        void this.onVaultChange(async () => {
          const current = this.defs.get();
          if (!renameTouchesDefs(current, oldPath, file.path)) return;
          if (!sameDefs(current, repairOnRename(current, oldPath, file.path))) {
            try {
              await this.defs.mutate((d) => repairRenameIn(d, oldPath, file.path));
            } catch (e) {
              console.error("Spaces: could not repair paths after a rename", e);
            }
          }
          this.resampleSettingsRows();
        });
      })
    );
    this.registerEvent(
      this.app.vault.on("delete", (file) => {
        void this.onVaultChange(async () => {
          await this.repairIfMoved(file, "delete");
          if (renameTouchesDefs(this.defs.get(), file.path, file.path)) {
            this.resampleSettingsRows();
          }
        });
      })
    );
    this.registerEvent(
      this.app.vault.on("create", (file) => {
        void this.onVaultChange(async () => {
          await this.joinOnCreate(file);
          await this.repairIfMoved(file, "create");
        });
      })
    );
    this.registerEvent(this.app.metadataCache.on("changed", () => this.onMetadataEvent()));
    this.register(() => this.releaseSpaceSurface());
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        var _a, _b, _c, _d;
        this.creationIntent = armIntent({
          target: { path: file.path, isFolder: file instanceof import_obsidian24.TFolder },
          activeSpaceId: (_b = (_a = this.controller.activeSpace()) == null ? void 0 : _a.id) != null ? _b : null,
          now: Date.now()
        });
        if (canOfferCreateSpaceFromFolder(
          { path: file.path, isFolder: file instanceof import_obsidian24.TFolder },
          (_d = (_c = this.controller.activeSpace()) == null ? void 0 : _c.id) != null ? _d : null
        )) {
          menu.addItem(
            (i) => i.setTitle("Create folder pinned space").setIcon("folder-plus").onClick(() => this.openCreatePanel({ root: file.path }))
          );
        }
      })
    );
    this.registerDomEvent(
      document,
      "click",
      (e) => {
        var _a, _b, _c, _d;
        const target = e.target;
        if (!(target instanceof Element)) return;
        const btn = target.closest(SEL.navActionButton);
        if (!btn || !btn.closest(SEL.fileExplorerPane)) return;
        if (btn.querySelector(SEL.newFolderButtonIcon) && this.activeSpaceRoot() !== null) {
          e.preventDefault();
          e.stopPropagation();
          void newFolderInActiveSpace(this.app, {
            defs: this.defs,
            controller: this.controller
          });
          return;
        }
        const source = (_b = (_a = this.app.workspace.getActiveFile()) == null ? void 0 : _a.path) != null ? _b : "";
        this.creationIntent = armIntent({
          target: { path: this.app.fileManager.getNewFileParent(source).path, isFolder: true },
          activeSpaceId: (_d = (_c = this.controller.activeSpace()) == null ? void 0 : _c.id) != null ? _d : null,
          now: Date.now()
        });
        if (btn.querySelector(SEL.sortButtonIcon)) this.armSortMenuRow(btn, e);
      },
      true
    );
    this.unsubscribeDefs = this.defs.subscribe(() => {
      var _a, _b, _c, _d;
      try {
        this.ensureOrderingPatched();
      } catch (e) {
        console.error(
          "Spaces: defs-subscription ensureOrderingPatched failed",
          e
        );
      }
      this.controller.refresh();
      (_a = this.switcher) == null ? void 0 : _a.applyPlacement(this.defs.get().settings.stripPlacement);
      (_b = this.switcher) == null ? void 0 : _b.render();
      (_c = this.header) == null ? void 0 : _c.render();
      try {
        (_d = this.settingTab) == null ? void 0 : _d.refreshIfSpacesChanged();
      } catch (e) {
        console.error("Spaces: defs-subscription settings refresh failed", e);
      }
    });
    for (const spec of this.commandSpecs()) this.addCommand(spec);
    this.resampleSettingsRows();
  }
  /**
   * Ask the settings page to look at the vault again, if it exists.
   *
   * COALESCED, because one user gesture is a BURST of vault events: a folder
   * delete arrives as the folder plus every child, a rename likewise, and each
   * one that names a space answers the gate. Measured in a real Obsidian on
   * this build: deleting one pinned folder asked twice, renaming a folder a
   * space holds notes in asked three more times. `resampleVault` rebuilds
   * every row and `memberRows` is O(M^2) per space (issue #54), so letting a
   * burst through would be a stack of quadratic redraws for one keystroke,
   * which is the shape of hitch this plugin treats as a defect.
   *
   * Guarded like the defs-subscription refresh: a settings redraw must never
   * take down a started plugin or a vault-event handler. The page being
   * briefly wrong is not worth that.
   */
  resampleSettingsRows() {
    if (this.resampleHandle !== null) return;
    this.resampleHandle = window.setTimeout(() => {
      var _a;
      this.resampleHandle = null;
      try {
        (_a = this.settingTab) == null ? void 0 : _a.resampleVault();
      } catch (e) {
        console.error("Spaces: settings resample failed", e);
      }
    }, 0);
  }
  /**
   * The commands, as data.
   *
   * Built per call rather than held as a field: `creationCtx` captures `defs`
   * and `controller`, and the controller does not exist until `start()` has
   * run.
   */
  commandSpecs() {
    const creationCtx = { defs: this.defs, controller: this.controller };
    return [
      {
        id: "switch-to-all",
        name: "Switch to All",
        callback: () => void this.controller.switchTo({ kind: "all" })
      },
      {
        id: "next-space",
        name: "Next space",
        callback: () => void this.cycle(1)
      },
      {
        id: "previous-space",
        name: "Previous space",
        callback: () => void this.cycle(-1)
      },
      {
        id: "switch-to-space",
        name: "Switch to space",
        callback: () => {
          new SpaceSuggestModal({
            app: this.app,
            // Built at open time, not at registration: the list has to
            // reflect a space created, renamed or deleted since Obsidian
            // started, and commands are registered exactly once.
            entries: () => spaceEntries(
              this.defs.get().spaces,
              this.runtime.getSelection(),
              knownIconIds()
            ),
            useThemeIconColor: () => this.defs.get().settings.useThemeIconColor,
            switchTo: (key) => this.controller.switchTo(key)
          }).open();
        }
      },
      {
        id: "create-space",
        name: "Create space",
        callback: () => {
          void (async () => {
            const leaf = this.explorerLeaf();
            if (!leaf) return;
            await this.app.workspace.revealLeaf(leaf);
            this.openCreatePanel();
          })();
        }
      },
      {
        id: "new-note-in-active-space",
        name: "New note in active space",
        checkCallback: (checking) => {
          const ok = this.controller.activeSpace() !== null;
          if (ok && !checking) void newNoteInActiveSpace(this.app, creationCtx);
          return ok;
        }
      },
      {
        id: "new-folder-in-active-space",
        name: "New folder in active space",
        checkCallback: (checking) => {
          const ok = this.controller.activeSpace() !== null;
          if (ok && !checking) void newFolderInActiveSpace(this.app, creationCtx);
          return ok;
        }
      },
      {
        // The answer to the cold-start problem: a new space's tree is empty,
        // so without this the only route to its first member is to open a
        // file, let it appear as a visitor, and right-click a scaffold
        // ancestor.
        id: "add-active-file-to-space",
        name: "Add active file to space",
        checkCallback: (checking) => {
          if (!this.activeFileToAdd()) return false;
          if (!checking) void this.addActiveFileToSpace();
          return true;
        }
      },
      {
        // The manual fail-open hatch. Every fail-open path today is
        // automatic, and "Switch to All" is not one — *All* is still a
        // managed mode that applies `orders.all`, the switch mask and the sort
        // patch. A plugin that patches the explorer's sort should ship a way to
        // see the raw tree.
        //
        // One toggling command rather than a pause/resume pair: a command's
        // name is fixed at registration, so a palette holding both would always
        // show the one that does nothing.
        id: "pause-filtering",
        name: "Pause or resume space filtering",
        callback: () => this.setFilteringPaused(!this.filteringPaused)
      },
      {
        id: "restore-saved-ordering",
        name: "Restore saved ordering",
        checkCallback: (checking) => {
          const ok = isOverrideActionable(
            this.runtime.getSelection(),
            this.runtime.getSortOverrides(),
            this.defs.get().settings
          );
          if (ok && !checking) this.restoreSavedOrdering();
          return ok;
        }
      },
      // Same setter the Settings dropdown and a completed drag use, so a
      // hotkey can never disagree with either about where the strip is.
      ...["top", "bottom", "left", "right"].map((where) => ({
        id: `move-strip-${where}`,
        name: `Move the space strip to the ${where}`,
        callback: () => {
          void setStripPlacement(this.defs, where, () => {
            var _a;
            return (_a = this.switcher) == null ? void 0 : _a.cancelDrag();
          });
        }
      })),
      // A pair gated on `checkCallback`, not one command named "lock or
      // unlock the strip": a command's name is fixed at registration, so a
      // single toggle would either lie about which way it is about to go or
      // sit unhelpfully vague. Offering exactly one at a time, worded as the
      // action about to happen, is the point — unlike `pause-filtering`
      // above, which genuinely has only one name because it has no visible
      // "which way" to word.
      {
        id: "unlock-strip",
        name: "Unlock the space strip",
        checkCallback: (checking) => {
          if (!this.switcher || this.switcher.isUnlocked()) return false;
          if (!checking) this.switcher.setUnlocked(true);
          return true;
        }
      },
      {
        id: "lock-strip",
        name: "Lock the space strip",
        checkCallback: (checking) => {
          var _a;
          if (!((_a = this.switcher) == null ? void 0 : _a.isUnlocked())) return false;
          if (!checking) this.switcher.setUnlocked(false);
          return true;
        }
      }
    ];
  }
  /**
   * The active file and space, when adding one to the other would
   * change something — and `null` otherwise, which is what makes the command
   * grey out rather than run to no effect.
   */
  activeFileToAdd() {
    var _a;
    const space = this.publicApi.activeSpace();
    if (!space) return null;
    const file = this.app.workspace.getActiveFile();
    if (!file) return null;
    const controller = this.controller;
    const reason = (_a = controller == null ? void 0 : controller.currentSnapshot()) == null ? void 0 : _a.decisionFor(file.path).reason;
    if (reason === "exact-member" || reason === "inherited-member") return null;
    if (pathMembers(space).some((m) => canonicalPath(m.path) === canonicalPath(file.path))) {
      return null;
    }
    if (inheritedFromFolder(space, file.path) !== null) return null;
    return { spaceId: space.id, path: file.path };
  }
  /**
   * The body of the `add-active-file-to-space` command.
   *
   * Re-reads the target inside, rather than trusting what `checkCallback`
   * saw: the palette can check and invoke on separate ticks, and the active
   * file can move between them.
   */
  async addActiveFileToSpace() {
    const target = this.activeFileToAdd();
    if (!target) return;
    try {
      await this.defs.mutate((d) => {
        const space = d.spaces.find((s) => s.id === target.spaceId);
        if (space && !pathMembers(space).some((m) => canonicalPath(m.path) === canonicalPath(target.path))) {
          space.members.push({ path: target.path, kind: "file" });
        }
      });
    } catch (e) {
      new import_obsidian24.Notice(`Spaces: could not add it to the space (${String(e)})`);
    }
  }
  /**
   * the fail-open escape hatch.
   *
   * Pausing RELEASES the sort seam rather than short-circuiting the transform:
   * `unpatch` deletes the override and forces `sort()`, so the explorer is
   * Obsidian's own unfiltered, natively sorted tree in the same tick — which is
   * what "show me the raw tree" has to mean if it is to be trusted when
   * something else has gone wrong.
   *
   * The active space is NOT changed. Nothing is written, no layout moves, and
   * resuming puts the same space back; the pause is a view state, not a switch.
   */
  setFilteringPaused(paused) {
    var _a, _b, _c, _d;
    if (this.filteringPaused === paused) return;
    this.filteringPaused = paused;
    if (paused) {
      this.teardownOrdering();
      this.chainIndexNow = null;
      this.applyAdapterSnapshot(null);
    } else {
      this.ensureOrderingPatched();
      this.rebuildChainIndex((_b = (_a = this.controller) == null ? void 0 : _a.currentSnapshot()) != null ? _b : null);
      this.applyFilterAndOrdering();
      this.applyAdapterSnapshot((_d = (_c = this.controller) == null ? void 0 : _c.currentSnapshot()) != null ? _d : null);
    }
    this.syncSpaceSurface();
    new import_obsidian24.Notice(
      paused ? "Spaces: filtering paused. The file explorer is showing the whole vault. Run the command again to resume." : "Spaces: filtering resumed."
    );
  }
  /**
   * Grants membership for a create that a gesture accounts for, and
   * does nothing otherwise.
   *
   * Coverage is deliberately partial: a right-click in the
   * explorer (including the empty body) and the explorer's own action buttons
   * are attributable; Ctrl+N, Templater, QuickAdd, importers and sync are not,
   * and keep the behaviour.
   */
  async joinOnCreate(file) {
    var _a, _b;
    const intent = this.creationIntent;
    if (!intent) return;
    const parentPath = "parent" in file && file.parent ? file.parent.path : null;
    const match = matchIntent({
      intent,
      created: { path: file.path, parentPath, isFolder: file instanceof import_obsidian24.TFolder },
      activeSpaceId: (_b = (_a = this.controller.activeSpace()) == null ? void 0 : _a.id) != null ? _b : null,
      now: Date.now()
    });
    if (!match) return;
    this.creationIntent = null;
    const space = this.defs.get().spaces.find((s) => s.id === match.spaceId);
    if (!space) return;
    if (inheritedFromFolder(space, match.path) !== null) return;
    try {
      await this.defs.mutate((d) => {
        const s = d.spaces.find((x) => x.id === match.spaceId);
        if (s && !pathMembers(s).some((m) => canonicalPath(m.path) === canonicalPath(match.path))) {
          s.members.push({ path: match.path, kind: match.kind });
        }
      });
    } catch (e) {
      new import_obsidian24.Notice(`Spaces: created it, but could not add it to the space (${String(e)})`);
    }
  }
  /**
   * Recognises an external move and repairs the paths it broke.
   *
   * Obsidian reports such a move as `create` then `delete` with nothing linking
   * them. `correlate` joins the pair on `size`+`ctime`+`mtime` — the
   * filesystem's own stamps, identical on both sides of a move and of an
   * in-place rename — and hands back the `(oldPath, newPath)` that
   * `repairOnRename` already consumes.
   *
   * Declining is the default: no partner, an ambiguous partner, an empty folder,
   * a cross-volume move whose `ctime` changed, a file that left the vault
   * altogether — all fall through to the keep-the-entry. This can only ever
   * upgrade a delete to a move on positive evidence.
   */
  async repairIfMoved(file, kind) {
    const now = Date.now();
    const record = {
      kind,
      path: file.path,
      isFolder: file instanceof import_obsidian24.TFolder,
      size: "stat" in file && file.stat ? file.stat.size : null,
      ctime: "stat" in file && file.stat ? file.stat.ctime : null,
      mtime: "stat" in file && file.stat ? file.stat.mtime : null,
      at: now
    };
    this.moveBuffer = prune(this.moveBuffer, now);
    const match = correlate({ buffer: this.moveBuffer, event: record });
    this.moveBuffer.push(record);
    if (!match) return;
    const current = this.defs.get();
    if (!renameTouchesDefs(current, match.oldPath, match.newPath)) return;
    if (sameDefs(current, repairOnRename(current, match.oldPath, match.newPath))) return;
    try {
      await this.defs.mutate((d) => repairRenameIn(d, match.oldPath, match.newPath));
    } catch (e) {
      console.error("Spaces: could not repair paths after an external move", e);
      return;
    }
    new import_obsidian24.Notice(`Spaces: followed ${match.oldPath} \u2192 ${match.newPath}`);
  }
  /**
   * An open property picker is a metadata consumer in its own right.
   *
   * The space gate (`watchesMetadata`) asks whether a SPACE holds a tag or
   * property member, which is the wrong question while someone is still
   * choosing one: a picker opened in a files-and-folders space would never
   * refresh, because nothing in the vault watches metadata yet. The panel
   * that opens the picker owns this subscription and must call the returned
   * function when it closes; a `register` callback clears any still held when
   * the plugin unloads. `CreateSpacePanel` is the only subscriber: the
   * contents dialog reads the index through a thunk and redraws from its own
   * writes, so its counts are a point-in-time reading of the moment it opened
   * and it is not told when a newer snapshot arrives.
   *
   * It fires when the snapshot has been REPLACED, which happens on a metadata
   * change, on the readiness transition (`resolved`), and on the coalesced
   * flush after a file is created, deleted or renamed. It does not fire when a
   * space's `exclude` or the global ignore changes: those leave the
   * frontmatter, and so the raw snapshot, untouched, though they do change
   * filtered member counts.
   *
   * Both paths are coalesced, so a subscriber need not debounce: one
   * notification per coalesced flush, arriving up to the coalescing window
   * after the event. NOT once per burst, for a burst that does not end. The
   * coalescer's `VAULT_COALESCE_MAX_WAIT_MS` forces a flush every 250 ms
   * while events keep arriving, so a sync or a `git pull` notifies about four
   * times a second for as long as it runs. That cadence is the coalescer's
   * and belongs there if it ever needs changing.
   */
  subscribePropertyRefresh(onChange) {
    return this.propertyRefresh.subscribe(onChange);
  }
  /**
   * A fresh LAZY property snapshot: nothing walks the vault until a property
   * member asks, and a ready answer is kept until the next replacement.
   *
   * The walk is kept beside the snapshot it produced, because the repair needs
   * the entries it already collected as well as the paths it could not read.
   * Re-walking after the async read instead would merge two different pictures
   * of the vault.
   *
   * THE WALK IS DEMAND-DRIVEN, and that is what keeps it free. It runs only
   * when a property member or an open picker actually asks a question, so a
   * vault with neither pays nothing, exactly as budget 2 in
   * `tests/propertyWorkBudget.test.ts` states.
   *
   * Which is also why `reportParseStall` asks for itself rather than relying
   * on this: demand-driven means there may be no demand, and on a jammed
   * vault there often is not.
   */
  newPropertySnapshot() {
    const generation = ++this.propertyGeneration;
    let walked = null;
    const lazy = createLazyPropertySnapshot(() => {
      const walk = walkPropertyCache(this.app);
      walked = walk;
      return snapshotFromWalk(walk, generation);
    });
    return () => {
      const snapshot = lazy();
      if (walked !== null) {
        this.propertyUnparsed = walked.unparsed;
        if (walked.unparsed.length > 0) {
          this.parseStall.arm();
        }
      }
      return snapshot;
    };
  }
  /**
   * Say which note is holding up Obsidian's parse queue.
   *
   * The whole response to a stall, and deliberately all of it. Spaces does not
   * read those files itself: see `lifecycle/parseStallNotice.ts` for why that
   * trade was taken out again.
   *
   * Nothing on screen changes here, so there is no refresh and no recompute.
   * A stalled vault's property spaces are incomplete and stay that way until
   * Obsidian parses the file, which is the honest answer and the one every
   * other part of the app is already giving.
   */
  reportParseStall() {
    if (this.controller === void 0) return;
    const space = this.controller.activeSpace();
    const resolvesProperties = space !== null && !hasRoot(space) && holdsPropertyMember(space);
    if (!resolvesProperties && this.propertyRefresh.size === 0) return;
    if (this.propertyUnparsed.length === 0) this.controller.drawnPropertyIndex();
    let culprit = "";
    let biggest = -1;
    for (const path of this.propertyUnparsed) {
      const file = this.app.vault.getAbstractFileByPath(path);
      const size = file instanceof import_obsidian24.TFile ? file.stat.size : 0;
      if (size > biggest) {
        biggest = size;
        culprit = path;
      }
    }
    const message = parseStallMessage(this.propertyUnparsed.length, culprit);
    if (message !== null) new import_obsidian24.Notice(message, 15e3);
  }
  async onVaultChange(fn) {
    await submitVaultWork((work) => this.vaultChanges.submit(work), this.flushState, fn);
  }
  /**
   * A note's metadata changed, or the cache finished resolving.
   *
   * TWO decisions, which used to be one early return and were wrong for it.
   *
   * 1. INVALIDATE, unconditionally. The flush was the only other
   *    `setTagIndex` caller, so gating this on the active space meant that
   *    tagging a note while *All* or a folder space was active never replaced
   *    the index: `pathsMatching` went on answering from a picture taken
   *    before the tag existed, for the rest of the session, and the note came
   *    back `hidden-nonmember` after switching into the tag space. That same
   *    stale index feeds `spaceAddTargets`, so it also re-opened the bug
   *    `910bc6b` closed — "Add to space" offering a note the tag already
   *    held. `createLazyTagIndex` is what makes this free: a replacement is
   *    one closure until something asks it a question.
   *
   *    The vault index is deliberately NOT replaced here. A note's tags are
   *    not vault structure, so nothing about the tree has changed; and the
   *    ordering hazard runs the other way — `TagIndex.ts` documents that a
   *    FRESH vault read against a STALE tag index is what shows a note the
   *    vault has and the tags do not. The reverse is benign FOR THE TREE,
   *    because `resolveLivePath` simply finds nothing for a path the vault
   *    index has not seen yet, and the create's own coalesced flush replaces
   *    both. The member COUNTS are not insulated by that: `propertyMemberCount`
   *    and the contents dialog's tag count resolve members with no
   *    vault-existence filter, so a dialog opened inside this window reports
   *    one more note than the tree is drawing, until the flush lands. Both
   *    counts are documented as a point-in-time reading, and the window is
   *    the coalescing window.
   *
   * 2. REQUEST A RECOMPUTE only when the active space's contents can actually
   *    have changed, which is what `watchesMetadata` has always been for. A
   *    space of files and folders cannot change because someone typed, and
   *    this fires on every save.
   */
  onMetadataEvent() {
    if (this.controller === void 0) return;
    this.controller.setTagIndex(createLazyTagIndex(() => createObsidianTagIndex(this.app)));
    this.controller.setPropertySnapshot(this.newPropertySnapshot());
    this.flushState.noteSnapshotInstalled();
    const route = metadataNotifyRoute(
      watchesMetadata(this.controller.activeSpace()),
      this.propertyRefresh.size
    );
    if (route === "none") return;
    if (route === "picker-flush") {
      void this.vaultChanges.submit(async () => void 0);
    } else {
      void submitMetadataWork((work) => this.vaultChanges.submit(work), this.flushState);
    }
  }
  async cycle(delta) {
    const spaces = activeSpaces(this.defs.get().spaces);
    if (spaces.length === 0) return;
    const order = [
      { kind: "all" },
      ...spaces.map((s) => ({ kind: "space", id: s.id }))
    ];
    await this.controller.switchTo((current) => {
      const at = order.findIndex((o) => sameSelection(o, current));
      const i = at < 0 ? 0 : at;
      return order[(i + delta + order.length) % order.length];
    });
  }
  /**
   * The layout half of a selection that fell back to All on its own.
   *
   * `recompute` resets the selection synchronously, so the tabs of the space
   * that went away are still on screen under a selection that now says All.
   * This runs the transition a deliberate switch would have run: the
   * workspace on screen is captured into the departed space's slot, and All's
   * own saved workspace comes back. Without it the next switch captures those
   * tabs into All's slot instead, and the workspace the user had saved for
   * All is overwritten with no gesture of theirs.
   *
   * Right for all three ways the arm is reached:
   *
   *  - **Archived.** The space is still in the definitions, so the capture
   *    lands where the README says it does: an archived space keeps the tabs
   *    Spaces saved for it.
   *  - **Deleted.** `transition` captures SYNCHRONOUSLY, before its first
   *    await, and `deleteSpace` calls its `onDeleted` hook (and so
   *    `dropLayoutFor`) after the mutate that brought us here, so the blob is
   *    reaped a moment later. The check below covers the ordering anyway.
   *  - **Gone from a sync.** Nothing will ever ask about that id again, so
   *    the captured blob is dropped rather than left for `reconcileLayouts`
   *    to find at the next load.
   *
   * Deliberately NOT routed through `switchTo`: the selection is already All
   * by the time this runs, so `switchTo` would see `from === to` and skip,
   * and a failed transition would leave the fallback to be retried on every
   * subsequent refresh.
   *
   * It IS routed through `controller.runQueuedLayoutJob`, which gives it the
   * switch queue and the `switching` guard without the idempotence check.
   * Calling it bare let a strip click start a second, concurrent transition
   * that captured a half-restored workspace, and let an ordinary recompute
   * release the switch mask mid-transition. See that method for both.
   */
  async settleLayoutAfterDrop(from) {
    if (from.kind !== "space") return;
    try {
      const outcome = await this.runMaskedTransition(from, { kind: "all" });
      if (outcome.kind !== "skipped") this.bindExplorer();
      this.reportLayoutOutcome(outcome);
    } catch (e) {
      console.error("[spaces] layout transition after a dropped selection failed", e);
    }
    this.controller.refresh();
    if (!this.defs.get().spaces.some((s) => s.id === from.id)) {
      this.runtime.dropLayoutFor(from.id);
    }
  }
  /** Derived every time; the persisted preference is never rewritten. */
  effectiveRestore() {
    const status = detectNativeWorkspaces(this.app);
    const configured = this.defs.get().settings.restoreLayouts;
    const effective = effectiveRestoreLayouts(configured, status);
    if (configured && !effective && status !== "disabled" && !this.nativeWorkspacesWarned) {
      this.nativeWorkspacesWarned = true;
      new import_obsidian24.Notice(
        status === "enabled" ? "Spaces: the core Workspaces plugin is enabled, so spaces is not restoring layouts." : "Spaces: could not determine whether the core Workspaces plugin is active, so layout restoration is off."
      );
    }
    if (status === "disabled") this.nativeWorkspacesWarned = false;
    return effective;
  }
  /**
   * Side-effect-free counterpart of effectiveRestore(), for the Settings tab:
   * rendering settings must never fire a Notice or touch the warned flag —
   * only an actual switch attempt does that.
   *
   * Gated on the detected status alone, NOT on whether it currently changes
   * the toggle's effect: a user who reads the toggle ON has already read
   * "restoring", so if core Workspaces is enabled or undetectable the warning
   * must show whatever the toggle says. Gating on `effective !== configured`
   * would hide it exactly when it matters most, and `SettingsTab`'s `onChange`
   * does not re-render, so the pane would sit on "ON" with no warning until
   * the next real switch.
   */
  effectiveRestoreState() {
    const status = detectNativeWorkspaces(this.app);
    if (status === "disabled") return {};
    const reason = status === "enabled" ? "the core Workspaces plugin is enabled" : "spaces could not determine whether the core Workspaces plugin is active";
    return { reason };
  }
  /**
   * `aborted` is SpaceController's own kind, not the coordinator's, so it is
   * spelled structurally here rather than imported (see `TransitionAborted` in
   * src/controller/SpaceController.ts). It means the transition REJECTED:
   * nothing was applied, and the selection does not commit either,
   * so the switch simply did not happen. Without this branch that path is a
   * completely silent no-op — the user clicks a space and nothing at all
   * occurs. Deliberately not the `failed-open` wording: the workspace was not
   * left half-applied.
   */
  reportLayoutOutcome(outcome) {
    if (outcome.kind === "aborted") {
      new import_obsidian24.Notice("Spaces: could not switch space. The layout change failed, so you are still in the previous space.");
    } else if (outcome.kind === "rolled-back") {
      new import_obsidian24.Notice("Spaces: that space's saved layout could not be restored; kept the previous one.");
    } else if (outcome.kind === "failed-open") {
      new import_obsidian24.Notice("Spaces: layout restore failed. Your tabs may not match this space.");
    }
  }
  /**
   * The three Obsidian-specific facts `livePathsFrom` needs. Kept as
   * thin as possible: this file has no tests, so every line of judgement
   * belongs in `leafVisitors.ts` instead.
   */
  leafProbe() {
    return {
      fileViewPath: (leaf) => {
        const view = leaf.view;
        if (!(view instanceof import_obsidian24.FileView)) return null;
        const file = view.file;
        return file instanceof import_obsidian24.TFile ? file.path : null;
      },
      stateFilePath: (leaf) => {
        const state = leaf.getViewState().state;
        return typeof (state == null ? void 0 : state.file) === "string" ? state.file : null;
      },
      resolveFilePath: (path) => {
        const f = this.app.vault.getAbstractFileByPath(path);
        return f instanceof import_obsidian24.TFile ? f.path : null;
      }
    };
  }
  /**
   * Main-window leaves only. `iterateRootLeaves` walks the main
   * workspace root, so sidebar tool panes (backlink, outline, outgoing-link)
   * are excluded — each of those tracks whichever file it is describing and
   * carries that path in its view state, and they were previously revealing
   * three unrelated notes in every space.
   */
  liveLeafPaths() {
    const leaves = [];
    this.app.workspace.iterateRootLeaves((leaf) => {
      leaves.push(leaf);
    });
    return livePathsFrom(leaves, this.leafProbe());
  }
  bindExplorer() {
    var _a, _b, _c, _d, _e, _f, _g;
    const leaves = this.explorerLeaves();
    const containers = [];
    let container = null;
    for (let i = 0; i < leaves.length; i++) {
      const c = (_c = (_b = (_a = leaves[i].view) == null ? void 0 : _a.containerEl) == null ? void 0 : _b.querySelector(SEL.container)) != null ? _c : null;
      if (i === 0) container = c;
      if (c) containers.push(c);
    }
    const leaf = leaves[0];
    try {
      if (containers.length > 0) this.adapter.bindAll(containers);
      else this.adapter.unbind();
    } catch (e) {
      console.error("Spaces: bindExplorer step 1 (adapter bind/unbind) failed", e);
    }
    const leafRoot = (_d = leaf == null ? void 0 : leaf.view) == null ? void 0 : _d.containerEl;
    if (this.createPanel && !(leafRoot && this.createPanel.isStillCovering(leafRoot, container))) {
      try {
        this.createPanel.close();
      } catch (e) {
        console.error("Spaces: create-space panel failed to close", e);
        this.createPanel = null;
      }
    }
    if (leafRoot) {
      try {
        (_e = this.switcher) != null ? _e : this.switcher = new SwitcherView(
          this.defs,
          this.runtime,
          this.controller,
          () => this.openCreatePanel(),
          // The same composition as the command and the Notice —
          // `isOverridden` alone would offer this row even when ordering is
          // blocked for the selection, where clicking it does nothing visible.
          (key) => isOverrideActionable(key, this.runtime.getSortOverrides(), this.defs.get().settings),
          (key) => {
            if (!sameSelection(key, this.runtime.getSelection())) {
              void this.controller.switchTo(key).then(() => this.restoreSavedOrdering()).catch((e) => {
                console.error("Spaces: switching space failed", e);
              });
              return;
            }
            this.restoreSavedOrdering();
          },
          {
            dragged: () => this.currentDrag.dragged(),
            onDropped: (spaceId, drag) => void this.filesDroppedOnSpace(spaceId, drag),
            onRefused: (reason, spaceName) => this.reportRefusedDrop(reason, spaceName)
          }
        );
        this.switcher.mount(leafRoot, this.defs.get().settings.stripPlacement);
      } catch (e) {
        console.error("Spaces: bindExplorer step 3 (switcher.mount) failed", e);
      }
      try {
        (_f = this.header) != null ? _f : this.header = new SpaceHeaderView(
          this.defs,
          this.runtime,
          (id, name) => renameSpace(this.defs, id, name),
          (key) => this.controller.switchTo(key),
          // The same vault question `destinationFolder` asks, so the
          // header's "(missing)" and the creation path agree about what a
          // usable root is.
          (path) => rootIsFolder(this.app, path)
        );
        this.header.mount(leafRoot);
      } catch (e) {
        console.error("Spaces: bindExplorer step 3b (header.mount) failed", e);
      }
      if ((_g = this.createPanel) == null ? void 0 : _g.isOpen) {
        try {
          this.createPanel.resyncInertSiblings(leafRoot);
        } catch (e) {
          console.error("Spaces: bindExplorer step 4 (resyncInertSiblings) failed", e);
        }
      }
    }
    try {
      this.ensureOrderingPatched();
    } catch (e) {
      console.error(
        "Spaces: bindExplorer step 5 (ensureOrderingPatched) failed",
        e
      );
    }
  }
  /**
   * Builds a fresh `CreateSpacePanel` per open, mounted into the file-explorer
   * leaf's `containerEl` - the same element `bindExplorer()` passes to
   * `this.switcher.mount()` - so the panel lands as a sibling of
   * `.nav-files-container` rather than a child of it.
   *
   * Deliberately NOT cached across opens: `defaultColor` is a plain string
   * captured once at construction, so a reused instance would keep offering
   * whichever rotation color was true the first time this ran. Reading `defs`
   * here, before any push, is what makes a create right after open get the
   * swatch the panel actually offered. `this.createPanel` exists only for the
   * open-check below and for `layout-change`/`onunload` teardown to reach the
   * current instance.
   *
   * `opts.root`: the folder context menu's "Create space from this folder" is
   * the one caller that supplies it, pre-filling the form as a folder space
   * rooted there; every other caller gets the ordinary curated form.
   */
  openCreatePanel(opts) {
    var _a, _b;
    if ((_a = this.createPanel) == null ? void 0 : _a.isOpen) return;
    const leaf = this.explorerLeaf();
    const leafRoot = (_b = leaf == null ? void 0 : leaf.view) == null ? void 0 : _b.containerEl;
    if (!leafRoot) return;
    const panel = new CreateSpacePanel({
      folders: this.folderSource(),
      // The one private call behind the picker's `#` list, kept behind its
      // quarantine module (`nativeTagCounts.ts`) exactly as the add-a-tag
      // field in Settings keeps it. A build without `getTags` returns null,
      // and the picker says so rather than showing an empty list.
      tags: { knownTags: () => nativeKnownTags(this.app) },
      // THE tag index, reached rather than built, exactly as `SpacesSettingTab`
      // and `SpaceContentsModal` reach it. The picker asks it how many notes
      // each offered tag brings in. Deferred because the index is a snapshot
      // that every flush and every metadata change replaces, so a panel open
      // for a while would otherwise count against the vault as it was when it
      // opened.
      tagIndex: () => this.controller.tagIndex(),
      // The property snapshot, reached rather than built, as `tagIndex` is.
      properties: () => this.controller.drawnPropertyIndex(),
      // Released by the panel when its picker closes, so nothing here outlives it.
      subscribePropertyRefresh: (onChange) => this.subscribePropertyRefresh(onChange),
      // What the space would hold, from the engine rather than from the panel.
      // Rebuilt per call so the vault, the ignore rules and the tag index are
      // all read fresh; the panel can stay open across any of them changing.
      preview: (members) => buildPreview(
        this.controller.vaultIndex(),
        compileIgnore(this.defs.get().settings.globalIgnore),
        // Reached per lookup, so a selection with no tag member never asks
        // the controller for the index at all.
        { pathsMatching: (tag) => this.controller.tagIndex().pathsMatching(tag) },
        // Called at most once per preview, and only for a property member.
        () => this.controller.drawnPropertyIndex()
      )(members),
      // The engine's own index, for resolving a stored member to a live path.
      vaultIndex: () => this.controller.vaultIndex(),
      // The rotation, or the neutral swatch, per the user's setting.
      // Read here rather than captured, so flipping the toggle takes effect on
      // the next open of this panel without a reload.
      defaultColor: startingSpaceColor(
        this.defs.get().settings.autoAssignColor,
        this.defs.get().spaces.length
      ),
      // Read at construction, like `defaultColor`: the panel is built fresh
      // per open, so this is the list as of the moment it opened.
      customColors: this.defs.get().settings.customColors,
      useThemeIconColor: () => this.defs.get().settings.useThemeIconColor,
      saveCustomColors: (customs) => this.defs.mutate((d) => {
        d.settings.customColors = customs;
      }),
      root: opts == null ? void 0 : opts.root,
      onSubmit: async (name, opts2) => {
        const id = await createSpace(this.defs, name, opts2);
        try {
          await this.controller.switchTo({ kind: "space", id });
        } catch (e) {
          console.error("Spaces: created the space but could not switch to it", e);
          new import_obsidian24.Notice(
            `Spaces: created the space, but could not switch to it (${String(e)}).`
          );
        }
      },
      onClose: () => {
        this.createPanel = null;
      }
    });
    this.createPanel = panel;
    try {
      panel.mount(leafRoot);
    } catch (e) {
      console.error("Spaces: failed to mount create-space panel", e);
      new import_obsidian24.Notice("Spaces: could not open the create-space panel.");
      this.createPanel = null;
    }
  }
  /**
   * The file-explorer leaf lookup and its "open the
   * file explorer" Notice, shared by the create-space
   * command and `openCreatePanel()`. Returns `null` (after showing the
   * Notice) when no file-explorer leaf exists at all.
   */
  explorerLeaf() {
    const leaf = this.explorerLeaves()[0];
    if (!leaf) {
      new import_obsidian24.Notice("Spaces: open the file explorer to create a space.");
      return null;
    }
    return leaf;
  }
  /**
   * The `VaultSource` the create panel's picker reads
   * (createSpaceForm.ts). Built fresh on every open (rather than
   * cached) so it reflects folders created since the plugin loaded.
   *
   * `getAllLoadedFiles()` includes the root `TFolder`, so excluding the vault
   * root is `folderCandidates`' job, where it is explicit.
   */
  folderSource() {
    const vault = this.app.vault;
    return {
      // Files as well as folders: the create panel's picker offers both, and
      // every folder-only consumer filters with `kindOf` anyway.
      allPaths: () => vault.getAllLoadedFiles().map((f) => f.path),
      kindOf: (path) => {
        const f = vault.getAbstractFileByPath(path);
        if (f instanceof import_obsidian24.TFolder) return "folder";
        if (f instanceof import_obsidian24.TFile) return "file";
        return null;
      }
    };
  }
  /**
   * The order map for whatever is active now. All's map and the
   * per-space maps are structurally separate so no space id can collide with
   * All, exactly as RuntimeStateV1 already splits its layouts.
   */
  orderMapFor() {
    const orders = this.defs.get().orders;
    if (!orders) return void 0;
    const sel = this.runtime.getSelection();
    if (!orderingEnabledFor(sel, this.defs.get().settings)) return void 0;
    if (isOverridden(sel, this.runtime.getSortOverrides())) return void 0;
    if (sel.kind === "all") return orders.all;
    const by = orders.bySpaceId;
    if (!by || !Object.prototype.hasOwnProperty.call(by, sel.id)) return void 0;
    return by[sel.id];
  }
  /**
   * Swap each compacted run's head for its tip, in place.
   *
   * IN PLACE and LAST, after filtering and ordering. A stored order is keyed by
   * the real child path, so substituting first would leave `applyOrder`
   * searching for a path that is no longer live; it would be skipped as
   * unlisted and the user's arrangement would silently fall back to native
   * sort. Substituting in place also means a run keeps the position its FIRST
   * segment had, which is where the reader expects it and is why this feature
   * needs no comparator of its own.
   *
   * Each tip is recorded as admitted for this call. The tip is an out-of-input
   * item, and `isAllowed` rejects those unless `livePermits` says otherwise -
   * and a rejection makes `patch` return the RAW items, which renders the
   * folder unfiltered and puts the whole vault inside the space.
   */
  substituteCompacted(out, view) {
    const ix = this.chainIndexNow;
    if (!ix || ix.runByHead.size === 0) return out;
    let swapped = false;
    const next = out.map((item) => {
      var _a;
      const p = (_a = item.file) == null ? void 0 : _a.path;
      if (typeof p !== "string") return item;
      const run = ix.runByHead.get(p);
      if (!run) return item;
      const tipItem = this.compactedTipItem(run, view);
      if (!tipItem) return item;
      this.admittedThisCall.add(run.tip);
      swapped = true;
      return tipItem;
    });
    return swapped ? next : out;
  }
  /**
   * This pane's tree item for a run's tip, or undefined when the pane has
   * none.
   *
   * ONE definition of "this run is live in this pane", read by both halves of
   * compaction: `substituteCompacted` swaps the head for the tip only if this
   * answers, and `filterAndOrderFolder` blanks the run's hidden folders only
   * if this answers. They used to decide separately — the substitution on the
   * lookup, the blanking on the index alone — and the disagreement cost rows:
   * the head survived uncompacted, then answered its own sort with `[]` and
   * drew as an empty folder with the whole chain gone from under it.
   *
   * A LOOKUP, never a construction: the items are live tree nodes carrying
   * their own DOM, and a fabricated one renders as a row with no behaviour.
   * `itemsForPaths` returns nothing for a pane that has no item and nothing
   * for a null view, which is the same answer and wants the same fail-open.
   */
  compactedTipItem(run, view) {
    const [tipItem] = itemsForPaths(view, [run.tip]);
    return tipItem;
  }
  /**
   * The active space's USABLE root (`rootOf`), or null when it is curated,
   * All, or the root is one of the two vault-root spellings (`""`/`"/"`).
   * Not "unresolvable": a root naming a folder gone from the vault is NOT
   * null here. `rootOf` does no filesystem check, only
   * `folderSpaceRootUsable` does.
   */
  activeSpaceRoot() {
    return rootOf(this.publicApi.activeSpace());
  }
  /**
   * The tree items for a folder space's root children, or null when the root
   * does not resolve to a folder in this vault, or when the lookup FAILED
   * rather than legitimately finding nothing.
   *
   * Reads the explorer's own item for each child rather than constructing one:
   * the items are live tree nodes carrying their own DOM, and Obsidian keeps
   * one for every path whether or not it is currently rendered (measured).
   * Fabricating one would produce a row with no behaviour. That DOM belongs to
   * a specific pane (`el`, `selfEl`, `childrenEl`, a `parent` pointer), which
   * is why `view` is passed in rather than read here: handing pane 1 the items
   * looked up against pane 0 would put the same nodes in two trees.
   */
  hoistedRootItems(root, view) {
    const folder = this.app.vault.getAbstractFileByPath(root);
    if (!(folder instanceof import_obsidian24.TFolder)) return null;
    const sorted = nativeSortedItems(view, folder);
    const paths = sorted ? sorted.flatMap((i) => {
      var _a;
      return typeof ((_a = i.file) == null ? void 0 : _a.path) === "string" ? [i.file.path] : [];
    }) : folder.children.map((c) => c.path);
    const items = itemsForPaths(view, paths);
    if (folder.children.length > 0 && items.length === 0) return null;
    const elsewhere = elsewhereOf(root, this.liveLeafPaths());
    const extra = itemsForPaths(view, elsewhere);
    return [...items, ...extra];
  }
  /**
   * The active folder space's permits function, or undefined
   * when none applies — a curated space, All, or a root that does not
   * resolve. Has no caching of its own: every call recomputes from scratch,
   * including the `liveLeafPaths()` walk and sort inside `elsewhereOf`. Its
   * one caller (`filterAndOrderFolder`'s hoist branch) is what bounds how
   * often that happens to once per relevant sort-seam call — see
   * `permitsForThisCall` and `livePermits` for why that boundary is where
   * the resolution belongs, not in here.
   */
  currentPermits() {
    const root = this.activeSpaceRoot();
    return root === null ? void 0 : makePermits(root, new Set(elsewhereOf(root, this.liveLeafPaths())));
  }
  /**
   * The FULL BODY of the `apply` callback `onload()` hands `SpaceController`'s
   * host, given a name so a test can call it directly. An inline closure would
   * have no seam of its own: `Plugin.onload()` is stubbed to throw under
   * Vitest, so deleting either call below (the `applyAdapterSnapshot` line, or
   * the final `repaintStep`) would leave the whole suite green.
   * `tests/filterAndOrderFolder.test.ts`'s "SpacesPlugin.onSnapshotApplied"
   * block calls this the way `onload()` does, and pins both halves.
   */
  onSnapshotApplied(snap) {
    var _a, _b;
    this.setSwitchMask(false);
    this.rebuildChainIndex(snap);
    this.applyFilterAndOrdering();
    this.applyAdapterSnapshot(snap);
    (_a = this.header) == null ? void 0 : _a.render();
    (_b = this.switcher) == null ? void 0 : _b.render();
    this.syncSpaceSurface();
    this.repaintStep("reportMissingRootIfNeeded", () => this.missingRoot.report());
  }
  /**
   * EVERY main-window explorer pane that is not DEFERRED is running our sort
   * override.
   *
   * The deferred exclusion is `explorerViews()`'s, not this method's: a
   * collapsed sidebar at startup has none of the seam's methods yet, so
   * probing it would report "unknown" for a build that is perfectly capable.
   * It is enough here because a deferred leaf's `containerEl` holds no
   * `.nav-files-container`, so `bindExplorer` binds nothing from it and the
   * adapter has no row in it to label -- the pane this gate would be
   * protecting does not exist yet. It becomes an ordinary pane, and an
   * ordinary input to this gate, on the `layout-change` that materialises it.
   *
   * THE GATE THE INDEX HANGS OFF, and the reason it exists: compaction is two
   * mechanisms that have to agree. The sort seam substitutes a run's TIP for
   * its HEAD, so the chain draws as one row; `ExplorerAdapter` writes the
   * joined label onto whatever row that substitution produced. Only the first
   * needs a patch. So whenever the patch is not on, the adapter labels a tree
   * nothing re-sorted: the chain is still drawn NESTED and the joined path is
   * stamped onto the head's row anyway, which reads as `Design/Decisions/2026`
   * on a folder that is visibly `Design` with `Decisions` underneath it. Worse
   * than doing nothing, so the index is null and nothing is labelled instead —
   * the honest nested tree, which is what every other failure in this
   * transform falls open to.
   *
   * EVERY pane, not one, and not `sortProbe`. `sortProbe` takes the BEST
   * answer across the panes deliberately (one odd view must not spend the
   * one-shot Notice and turn filtering off everywhere), so it answers "ok" for
   * a split explorer with one pane patched and one not — which is the same bug
   * seen from the unpatched pane, since the adapter labels every bound
   * container from the one index. `isPatched` is the module's own record that
   * `patch` SUCCEEDED on a view -- not that the override is still in that
   * view's call chain, which `unpatch` itself contemplates it may not be: it
   * restores by `delete` only when `getSortedFolderItems === entry.override`
   * still holds (`nativeExplorerSort.ts`), and warns instead when it does
   * not. It is the right question anyway: "absent from the build", "`patch`
   * declined because another plugin holds the property" and "the patch step
   * threw before it got there" all answer the same way without this method
   * having to tell them apart, and a plugin that WRAPS our override and calls
   * through is still live -- a stricter identity test would silently turn
   * compaction off for that user.
   *
   * THAT LOOSENESS IS ONLY SAFE BECAUSE OF THE LABEL PASS, and the two are
   * one decision. A plugin that REPLACES the property rather than wrapping it
   * leaves this gate answering "live" over a tree nothing of ours sorted.
   * `applyCompactLabels` catches it where it matters, by asking the DOM
   * whether the chain actually compacted rather than taking this record's
   * word for it (`drawnWhereTheHeadWas`). Loosen or tighten one of the two
   * and the other has to move with it;
   * `tests/compactSeamGate.test.ts` drives the pair end to end.
   *
   * NOT `sortedViews`, although on this gate's domain the two cannot differ.
   * They are equal BY CONSTRUCTION, and three places keep them so:
   * `installed.set` happens only inside `patch`, whose one caller pushes to
   * `sortedViews` on the same `if`; `installed.delete` happens
   * unconditionally at the top of `unpatch`, whose only two callers
   * (`ensureOrderingPatched`'s release loop and `teardownOrdering`) drop the
   * same view from `sortedViews`; and a view neither has seen is absent from
   * both. So this is not a behavioural choice but a question of WHO IS ASKED:
   * `isPatched` asks the module that owns the fact, rather than this file's
   * bookkeeping about it. A future reader who simplifies one of those three
   * invariant-keepers has been warned here.
   *
   * THROWING IS ANSWERED WITH FALSE. `bindExplorer` already guards step 5, so
   * `ensureOrderingPatched` throwing is a state the plugin carries on from
   * with nothing patched — and whatever made it throw is still there when
   * `rebuildChainIndex` reaches this on the very next apply. Letting it
   * propagate here would take that apply down — the switch mask, the re-sort,
   * the header, the strip — over a question whose safe answer is already "do
   * not compact".
   */
  seamIsPatchedEverywhere() {
    try {
      const views = this.explorerViews();
      if (views.length === 0) return false;
      for (const view of views) {
        if (!isPatched(view)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  rebuildChainIndex(snap) {
    if (snap === null || this.filteringPaused || !this.defs.get().settings.compactFolderChains) {
      this.chainIndexNow = null;
      return;
    }
    if (!this.seamIsPatchedEverywhere()) {
      this.chainIndexNow = null;
      return;
    }
    const visible = snap.visiblePaths();
    const isFolder = (p) => this.app.vault.getAbstractFileByPath(p) instanceof import_obsidian24.TFolder;
    const tree = {
      visibleChildrenOf: (folderPath) => {
        const f = this.app.vault.getAbstractFileByPath(folderPath);
        if (!(f instanceof import_obsidian24.TFolder)) return [];
        return f.children.map((c) => c.path).filter((p) => visible.has(p));
      },
      isFolder,
      // Scaffold is the reason, not merely "a folder that is visible": a
      // folder the user added as a member reports `exact-member` and must keep
      // its own row.
      isScaffold: (p) => isFolder(p) && snap.decisionFor(p).reason === "scaffold",
      parentOf: (p) => p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : null,
      nameOf: (p) => p.includes("/") ? p.slice(p.lastIndexOf("/") + 1) : p
    };
    const folders = [...visible].filter(isFolder);
    const next = buildChainIndex(folders, tree);
    if (!sameChainIndex(this.chainIndexNow, next)) this.chainIndexNow = next;
  }
  /**
   * Extracted out of `onSnapshotApplied` so this line has a name a test can
   * call directly: dropping the second argument back to a bare
   * `this.adapter.apply(snap)` otherwise passes the whole suite, because
   * nothing reaches it. `elsewhereFirstPath()` is read fresh
   * here, same as everywhere else it is read, rather than at whatever
   * earlier moment this method might have been created.
   */
  applyAdapterSnapshot(snap) {
    this.adapter.setChainIndex(this.chainIndexNow, this.compactLabelOptions());
    this.adapter.apply(this.filteringPaused ? null : snap, this.elsewhereFirstPath());
  }
  /**
   * The label setting, read fresh and shaped for the adapter.
   *
   * Read HERE rather than held, for the same reason `elsewhereFirstPath` is:
   * the setting changes without this method being re-created, and the
   * definitions subscriber reaches this through `controller.refresh()` on
   * every write. It does not move the chain index — shortening changes how a
   * run READS, not which folders form one — so `rebuildChainIndex` keeps the
   * previous object, the re-sort memo correctly declines to re-sort, and the
   * adapter's own pass redraws the labels on its own.
   *
   * A POLICY, not a decision. Which rows actually shorten is settled in
   * `ExplorerAdapter`, which can measure them against the pane; this says only
   * whether it is allowed to.
   */
  compactLabelOptions() {
    return {
      abbreviateWhenOverflowing: this.defs.get().settings.abbreviateCompactedPaths
    };
  }
  /**
   * The elsewhere group's first SURVIVING path, for `adapter.apply`'s second
   * argument — or null when no folder space is active, or nothing in its
   * elsewhere group actually renders.
   *
   * Computed here rather than inside `ExplorerAdapter` because a
   * `VisibilitySnapshot` carries no order: `hoistedRootItems` already decides
   * where the elsewhere group sits. Recomputed per call for the same reason
   * `currentPermits`/`livePermits` are — the active space and the live-leaf
   * set both change without this closure being re-created.
   *
   * `elsewhereOf`'s SORTED order is not what actually renders: `itemsForPaths`
   * can fail to resolve a path, and the snapshot can refuse one (a dismissed
   * visitor leaves `revealed.paths()` while the file is still open). Marking a
   * path that never becomes a row would draw no separator at all, so walk the
   * sorted list for the first candidate clearing both gates. `explorerViews()
   * [0]` is the hoist branch's "no pane of its own to name" fallback, safe
   * here because this only asks whether a PATH resolves to *some* item.
   */
  elsewhereFirstPath() {
    var _a;
    const root = this.activeSpaceRoot();
    if (root === null) return null;
    const elsewhere = elsewhereOf(root, this.liveLeafPaths());
    if (elsewhere.length === 0) return null;
    const snapshot = this.controller.currentSnapshot();
    const view = (_a = this.explorerViews()[0]) != null ? _a : null;
    for (const p of elsewhere) {
      if (itemsForPaths(view, [p]).length === 0) continue;
      if (snapshot !== null && snapshot.decisionFor(p).visible === false) continue;
      return p;
    }
    return null;
  }
  /**
   * Installs or refreshes the sort-seam patch. Safe
   * to call repeatedly — `patch` refuses an already-patched view — which is
   * why it can simply hang off bindExplorer() and the defs subscription
   * rather than needing a switch-specific hook. Does not itself force a
   * re-sort; callers that need one rely on `host.apply` reaching
   * `applyFilterAndOrdering()` afterwards (see the defs-subscription comment
   * below for the one place that ordering is not free).
   */
  ensureOrderingPatched() {
    var _a, _b, _c;
    if (this.filteringPaused) return;
    const views = this.explorerViews();
    const previousPrimary = this.sortedViews[0];
    if (this.sortedViews.length > 0) {
      const kept = [];
      for (const held of this.sortedViews) {
        if (views.includes(held)) {
          kept.push(held);
          continue;
        }
        unpatch(held);
      }
      this.sortedViews = kept;
    }
    if (views.length === 0) return;
    this.sortProbe = views.some((v) => probe(v) === "ok") ? "ok" : "unknown";
    if (this.sortProbe !== "ok") {
      if (!this.sortProbeWarned) {
        this.sortProbeWarned = true;
        new import_obsidian24.Notice(
          "Spaces: this Obsidian version does not expose the file explorer's sort, so spaces can no longer filter the tree. The whole vault will show until Obsidian is updated."
        );
      }
      (_a = this.dragOrdering) == null ? void 0 : _a.unbind();
      return;
    }
    const container = (_b = views[0].containerEl) == null ? void 0 : _b.querySelector(
      SEL.container
    );
    if (container) {
      (_c = this.dragOrdering) != null ? _c : this.dragOrdering = new DragOrdering(this.dragDeps());
      this.dragOrdering.bind(container);
    }
    for (const view of views) {
      if (this.sortedViews.includes(view)) continue;
      if (patch(
        view,
        (folderPath, items) => this.filterAndOrderFolder(folderPath, items, view),
        this.livePermits
      )) {
        this.sortedViews.push(view);
        this.lastResort = null;
      }
    }
    if (this.sortedViews[0] !== previousPrimary) this.lastSortOrder = null;
  }
  /**
   * Ask Obsidian to rebuild the tree, because what belongs in it may have
   * changed. Called from `host.apply` — the lifecycle-hook site, running after
   * the selection commits — plus `recordSortOverride` and
   * `restoreSavedOrdering`, which ride direct user gestures. The
   * single-convergence rule constrains what a re-sort may HANG OFF, not how
   * many places may call it.
   *
   * Two tempting guards are wrong here. Memoising on `{selection, orders
   * identity}` was sound while a re-sort only served ORDERING; filtering moved
   * into the same seam, and a membership change — or a `file-open` revealing a
   * VISITOR — moves neither key. Returning early when no order is stored
   * anywhere assumed the patch was a pass-through; it filters now, so that
   * leaves the tree unfiltered for every user who never reordered a thing.
   *
   * The memo key is therefore the transform's own inputs, read back:
   * `visiblePaths()` off the controller's snapshot (which IS the filter half
   * of the transform — `filterVisibleItems` asks `decisionFor(p).visible`, and
   * `buildVisibilitySnapshot` answers that with `visible.has(p)` and nothing
   * else); the resolved order map by identity (`DefinitionStore.mutate` clones
   * on every write, so it over-invalidates, never under); the selection, so
   * two spaces showing the same rows are told apart; and the chain index
   * (`chainIndexNow`) by identity, because compaction changes what the seam
   * RETURNS without changing visibility, so flipping `compactFolderChains`
   * moves none of the other three and the tree would keep its old shape.
   * That is only affordable because `rebuildChainIndex` reuses the previous
   * index object while the runs are unchanged; a fresh object per snapshot
   * would defeat the memo on every `file-open`.
   *
   * Outside the key are only Obsidian's own triggers — a vault mutation
   * re-sorts that folder anyway, a native sort-mode pick calls `sort()`
   * itself — plus a freshly patched view, which `ensureOrderingPatched`
   * invalidates explicitly. If `requestResort` fails the memo is dropped, so
   * the next event retries rather than leaving the previous filter on screen.
   *
   * A FAILED RE-SORT COSTS THREE MORE THINGS this method owns and its name
   * does not say: it drops the chain index, drops the ADAPTER's copy of it,
   * and re-sorts every pane a second time. See the comments on those lines.
   * The index is a promise that the substitution happened, this is the one
   * place that finds out it did not, and the adapter's copy is what would
   * otherwise go on drawing the promise.
   */
  applyFilterAndOrdering() {
    if (this.sortedViews.length === 0) return;
    const signature = this.currentResortSignature();
    if (this.lastResort && sameResortSignature(this.lastResort, signature)) return;
    const hadIndex = this.chainIndexNow !== null;
    let every = true;
    for (const view of this.sortedViews) {
      if (!requestResort(view)) every = false;
    }
    this.lastResort = every ? signature : null;
    if (!every) {
      this.chainIndexNow = null;
      this.adapter.setChainIndex(null, this.compactLabelOptions());
      if (hadIndex) for (const view of this.sortedViews) requestResort(view);
      this.adapter.applyNow();
    }
  }
  /** See `applyFilterAndOrdering` for why these four fields and no others. */
  currentResortSignature() {
    const selection = this.runtime.getSelection();
    const snapshot = this.controller.currentSnapshot();
    return {
      selection: selection.kind === "all" ? "all" : `space:${selection.id}`,
      order: this.orderMapFor(),
      visible: snapshot ? snapshot.visiblePaths() : null,
      chainIndex: this.chainIndexNow
    };
  }
  /**
   * Compares Obsidian's sort order against the last value seen. The
   * first observation after a bind SEEDS rather than counting as a gesture —
   * otherwise loading the explorer would override every space.
   */
  observeSortOrder() {
    var _a;
    const current = readSortOrder((_a = this.sortedViews[0]) != null ? _a : null);
    const verdict = sortGestureFrom(this.lastSortOrder, current);
    if (verdict === "none") return;
    this.lastSortOrder = current;
    if (verdict === "seed") return;
    if (this.sortGestureTimer !== null) return;
    this.sortGestureTimer = window.setTimeout(() => {
      this.sortGestureTimer = null;
      this.recordSortOverride();
    }, 0);
  }
  /**
   * Records that the user is now looking at one of Obsidian's own sort
   * modes rather than their saved order.
   *
   * Reached two ways, and both are needed. `observeSortOrder` notices the value
   * CHANGING, which covers a sort chosen anywhere — including Obsidian's own
   * command palette. The menu reports the CLICK, which covers the case the
   * first cannot see at all: choosing the mode already in effect changes no
   * value, so before this existed that click did nothing whatsoever. Whichever
   * arrives first does the work; the other finds the override already set and
   * returns here.
   */
  recordSortOverride() {
    var _a;
    const sel = this.runtime.getSelection();
    const overridden = isOverridden(sel, this.runtime.getSortOverrides());
    const orderingEnabled = orderingEnabledFor(sel, this.defs.get().settings);
    if (!shouldRecordSortOverride(overridden, orderingEnabled)) return;
    this.runtime.setSortOverride(sel, true);
    this.applyFilterAndOrdering();
    (_a = this.switcher) == null ? void 0 : _a.render();
  }
  /** Clears the override and re-applies the saved order. */
  restoreSavedOrdering() {
    var _a;
    const sel = this.runtime.getSelection();
    if (!isOverridden(sel, this.runtime.getSortOverrides())) return;
    this.runtime.setSortOverride(sel, false);
    this.applyFilterAndOrdering();
    (_a = this.switcher) == null ? void 0 : _a.render();
  }
  /**
   * Puts "Restore saved ordering" into Obsidian's OWN sort menu, for the
   * single menu the click now in flight is about to open.
   *
   * Gated at ARM time rather than at show time. The two are one tick apart, and
   * arming here buys the property worth having: when the row would not appear,
   * the prototype is never patched at all.
   */
  armSortMenuRow(button, gesture) {
    const defs = this.defs.get();
    const state = sortMenuRowState(
      this.runtime.getSelection(),
      this.runtime.getSortOverrides(),
      defs.settings,
      defs.orders
    );
    if (!state.show) return;
    armMenuInjection({
      proto: import_obsidian24.Menu.prototype,
      // Identity on ENTRY, not only ownership on
      // exit: the arm is live for a whole macrotask, and without this check
      // ANY menu another plugin opens inside that window is treated as the
      // sort menu — it gets our row, and its own items are unticked. The
      // explorer shows this menu with `showAtMouseEvent(evt)` for the very
      // click being handled here, so the gesture is recognised two ways: the
      // same event object, or — should a future Obsidian re-dispatch — an
      // event that started inside the same button. Neither is true of a menu
      // opened from anywhere else, and `showAtPosition` carries no anchor at
      // all, so it never matches.
      isIntendedMenu: (showArgs) => {
        const first = showArgs[0];
        if (first === gesture) return true;
        const from = first == null ? void 0 : first.target;
        return from instanceof Node && button.contains(from);
      },
      buildRow: (menu) => {
        menu.addItem((i) => {
          i.setTitle(SORT_MENU_MODE).setIcon("list-ordered").setChecked(state.checked);
          i.onClick(() => this.restoreSavedOrdering());
        });
      },
      // Only while OUR mode is the one in effect. Obsidian ticks whichever mode
      // `sortOrder` names whether or not it is what renders, and that tick is
      // the whole defect: it says "File name (A to Z)" while a custom order is
      // on screen. When the override IS in effect, its tick is honest and stays.
      decorateHostItem: state.checked ? (i) => void i.setChecked(false) : void 0,
      // Picking a native mode is a sort gesture even when it changes no value,
      // which is the one case `observeSortOrder` is structurally blind to.
      //
      // Conditional for the same reason `decorateHostItem` is, and on the same
      // condition: supplying this is what wraps every host item in a
      // proxy, and a proxy is not identical to the item it wraps. `checked` is
      // `!isOverridden`, which is exactly `shouldRecordSortOverride`'s first
      // gate — with the override already set there is nothing for a report to
      // do, so the identity cost would buy nothing.
      onHostItemClick: state.checked ? () => this.recordSortOverride() : void 0,
      // The canceller comes back so `onunload` can stop it. A pending
      // restore that outlives an unload puts the prototype BACK, which is the
      // safe direction — but the wrapper sitting on `Menu.prototype` until it
      // fires is not, so unload takes it down now instead.
      defer: (fn) => {
        const id = window.setTimeout(fn, 0);
        return () => window.clearTimeout(id);
      }
    });
  }
  /**
   * The PRIMARY explorer view, or null. Every ordering READ goes through this.
   *
   * Deliberately singular where `explorerViews()` is plural: a read
   * asks "what is displayed", and every patched view displays the same thing —
   * `filterAndOrderFolder` is one function over one selection, so any of them
   * answers for all of them. The drag gesture that consumes these reads is
   * also one gesture in one pane, and that pane is the primary.
   */
  explorerView() {
    var _a;
    return (_a = this.explorerViews()[0]) != null ? _a : null;
  }
  /**
   * Every file-explorer leaf in the MAIN window, in workspace
   * order, which is the order Obsidian hands them back.
   *
   * Pop-out windows are excluded here rather than anywhere else, so the
   * exclusion is stated once. It is README's documented non-goal ("Pop-out
   * windows are not filtered") and it is decided by the leaf's own document
   * rather than by `WorkspaceWindow` identity: `containerEl.ownerDocument` is
   * public on both sides of the comparison (`View.containerEl`,
   * `Workspace.containerEl`), needs no `instanceof` against a class the seam
   * would then have to import, and a pop-out's leaves genuinely live in
   * another document.
   */
  explorerLeaves() {
    const mainDoc = this.app.workspace.containerEl.ownerDocument;
    return this.app.workspace.getLeavesOfType("file-explorer").filter((leaf) => {
      var _a, _b;
      return ((_b = (_a = leaf.view) == null ? void 0 : _a.containerEl) == null ? void 0 : _b.ownerDocument) === mainDoc;
    });
  }
  /**
   * The views behind `explorerLeaves()` that are ready to be patched.
   *
   * A DEFERRED leaf — a collapsed sidebar at startup — has none of the seam's
   * methods yet, so it is skipped rather than probed: probing it reports
   * "unknown" for a build that is perfectly capable, and the one-shot
   * Notice would be spent on a false alarm while a genuine seam loss later
   * would go unreported.
   */
  explorerViews() {
    const out = [];
    for (const leaf of this.explorerLeaves()) {
      if (leaf.isDeferred) continue;
      const view = leaf.view;
      if (view) out.push(view);
    }
    return out;
  }
  /**
   * Why a drop on a space icon was refused.
   *
   * Said at HOVER for the two refusals the strip can see coming, and at the
   * DROP for a space that stopped existing while the button was held. Every
   * other refusal is a pointer somewhere that was never a target, and the "no
   * drop" cursor says so for free. Logged rather than shown if it is anything
   * else, because a refusal nobody has worded would otherwise surface a raw
   * internal string.
   *
   * TENSE FOLLOWS THE MOMENT, which is why the three do not match. The two
   * hover messages are PRESENT and CONDITIONAL: the user is mid-gesture with
   * the button still down, and "nothing was dropped" would describe an event
   * that has not occurred. `SPACE_GONE` is the opposite, reachable only after
   * the release, so it is past tense. The two hover messages name the space,
   * because the strip is a row of icons and "the space" identifies none of
   * them; `SPACE_GONE` cannot, because the space it would name is gone.
   *
   * The clipped-selection wording used to tell the user to "scroll the whole
   * selection into view and drag again", which they often cannot. The tell is
   * geometric, so it fires for any selection whose end sits at the edge of the
   * explorer's render window with more tree beyond it, from two rows upward,
   * and a selection big enough to be genuinely clipped will not fit on screen
   * at all. Selecting fewer works in both cases.
   */
  reportRefusedDrop(reason, spaceName) {
    const where = spaceName != null ? spaceName : "that space";
    if (reason === CLIPPED_SELECTION) {
      new import_obsidian24.Notice(
        `Spaces: this selection may be too large to drop on ${where}. If you release now, nothing will be added. Select fewer notes and folders, then drag again.`
      );
      return;
    }
    if (reason === FOLDER_PINNED_SPACE) {
      new import_obsidian24.Notice(
        `Spaces: ${where} is pinned to a folder, so it shows that folder's contents and has no member list to add to. To put a note or folder inside ${where}, use Obsidian's "Move file to..." instead.`
      );
      return;
    }
    if (reason === SPACE_GONE) {
      new import_obsidian24.Notice("Spaces: nothing was added. That space no longer exists.");
      return;
    }
    console.warn("Spaces: a drop on a space icon was refused:", reason);
  }
  /**
   * The same question at RELEASE.
   *
   * UNREACHABLE TODAY, and kept deliberately rather than deleted. That is worth
   * stating plainly, because the version of this comment that described it as a
   * live safety net was false and stayed false through several reviews.
   *
   * There are TWO gaps here and only one of them is closed, which is what the
   * earlier wording ran together:
   *
   *  - HOVER to RELEASE is a real gap, as long as the user holds the button.
   *    A space can be deleted or newly pinned in it, by sync or a second
   *    window or another plugin. That gap is NOT closed by anything below; it
   *    is caught in the rail's own drop listener, which re-asks `spaceDropFor`
   *    and speaks the refusal through `reportRefusedDrop`. The earlier wording
   *    claimed this gap did not exist, and a drop that fell into it was
   *    swallowed in silence.
   *  - RELEASE to THIS RE-ASK is not a gap. `onDropped` is called
   *    synchronously from that listener and `filesDroppedOnSpace` reads `defs`
   *    before its first `await`, so the space really is resolved from one
   *    snapshot in one tick. The only input that moves is the path list, which
   *    can only shrink as stale paths are filtered out, and an empty list has
   *    its own notice above.
   *
   * What it buys is that the drop path narrows `SpaceDrop` by ASKING the seam
   * rather than by assuming the answer, so a rule added to `spaceDropFor` that
   * genuinely can flip between hover and release arrives here with words
   * already written for it instead of landing in a silent `return`.
   */
  reportDropDidNothing(reason, spaceName) {
    console.warn("Spaces: a drop on a space icon was refused at release:", reason);
    const where = spaceName != null ? spaceName : "that space";
    new import_obsidian24.Notice(`Spaces: nothing was added. ${where} cannot take this drop now.`);
  }
  /**
   * A note or folder was dropped on a space icon.
   *
   * The drop callback hands over a `spaceId` and the drag record, not a
   * decision: the strip deliberately does not carry one across the seam. So
   * this resolves the space and asks `spaceDropFor` again.
   *
   * It is re-asked with the SURVIVING subset, not with the paths the icon was
   * lit for: a path can go stale between the dragstart and the drop, and those
   * are filtered out just below. Removing paths CAN flip a rule from refuse to
   * act -- a rule that refuses when ANY path is illegal does exactly that, and
   * one lived here until the move was removed. What matters is the other
   * direction: removing paths can never flip a rule from act to a DIFFERENT
   * act. `truncated`, the one flag that chooses anything, is carried across
   * untouched, so the subset can only agree with what the icon showed or
   * refuse, and refusing is the safe direction.
   *
   * What must not happen is deciding by some OTHER rule than the one the icon
   * used, which is what made the drag indicator a lie once before, where it
   * read `destination=Travel` while the file landed at the vault root.
   */
  async filesDroppedOnSpace(spaceId, drag) {
    var _a;
    const space = this.defs.get().spaces.find((s) => s.id === spaceId);
    if (!space) {
      new import_obsidian24.Notice("Spaces: that space no longer exists");
      return;
    }
    const files = drag.paths.map((p) => this.app.vault.getAbstractFileByPath(p)).filter((f) => f !== null);
    if (files.length === 0) {
      new import_obsidian24.Notice(
        drag.paths.length === 1 ? "Spaces: that note or folder no longer exists" : "Spaces: those notes and folders no longer exist"
      );
      return;
    }
    const drop = spaceDropFor(space, { paths: files.map((f) => f.path), truncated: drag.truncated });
    if (drop.kind === "refuse") {
      this.reportDropDidNothing(drop.reason, (_a = drop.spaceName) != null ? _a : space.name);
      return;
    }
    await addToSpace({ defs: this.defs, controller: this.controller }, spaceId, files);
  }
  /**
   * The dependencies. Every one of them is a lookup or a write — the drag's
   * decisions live in `dropIntent.ts`, and none of them belong here.
   */
  dragDeps() {
    return {
      describeRow: (path) => {
        const f = this.app.vault.getAbstractFileByPath(path);
        if (!f) return null;
        const parent = displayParentOf(this.chainIndexNow, path, (p) => this.vaultParentOf(p));
        return { parent: parent != null ? parent : "", isFolder: f instanceof import_obsidian24.TFolder };
      },
      /**
       * The folder's children as they are on screen, SPELLED THE WAY STORAGE
       * SPELLS THEM.
       *
       * `displayedPaths` reads through the patched seam, which is the right
       * source -- "displayed" has to mean what is on screen -- but it hands
       * back a compacted chain as its TIP, because that is the row. A stored
       * order holds the HEAD, because an order lists a folder's own children
       * and the head is the child.
       *
       * `computeDrop` merges this list with `storedOrder`'s, so handing it two
       * spellings of the same chain loses both: the head falls out of the
       * baseline for not being displayed, and `writeOrderFor`'s
       * `compact(order, live)` then strikes the tip for not being a child of
       * this folder. A drag elsewhere in that folder -- one that never went
       * near the chain -- is enough to delete the arrangement from
       * `data.json`, and nothing on screen says so. Mapping
       * here, at the single point where the two lists meet, is what keeps the
       * merge in one coordinate system.
       */
      displayedOrder: (folderPath) => {
        var _a;
        const view = this.explorerView();
        const folder = this.folderFor(folderPath);
        if (!view || !folder) return [];
        const shown = (_a = displayedPaths(view, folder)) != null ? _a : [];
        return shown.map((p) => displayToStored(this.chainIndexNow, p));
      },
      storedOrder: (folderPath) => {
        const map = this.orderMapFor();
        if (!map) return void 0;
        return Object.prototype.hasOwnProperty.call(map, folderPath) ? map[folderPath] : void 0;
      },
      writeOrder: (folderPath, order) => this.writeOrderFor(folderPath, order),
      indicatorStyle: () => this.defs.get().settings.dropIndicatorStyle,
      onDragBegin: (paths, truncated) => this.currentDrag.begin(paths, truncated),
      // The one place that clears what a drag published. The strip never hears
      // `dragend` for a file drag (its source is a tree row), so an icon lit
      // under an Escaped drag is cleared from here, and the switcher is created
      // lazily so it may not exist yet.
      //
      // NOT "learns every drag has ended, however it ended", which is what this
      // said while the defect was live. `DragOrdering` calls it at each drag's
      // end and again at the next drag's `dragstart`, and the second half is
      // what the record's safety actually rests on: a `dragend` dispatched at a
      // source row the explorer has since replaced reaches no document
      // listener, so "every" was never on offer. See `onDragDone` in
      // `DragOrdering.ts` for the full chain.
      onDragDone: () => {
        var _a;
        this.currentDrag.end();
        (_a = this.switcher) == null ? void 0 : _a.clearDropTarget();
      },
      // `DragOrdering` declines the drop on its own — this hook only
      // voices it. Without it the user sees Obsidian complete the move (which
      // is the right outcome: the whole selection travels) while the ordering
      // they were arranging silently does not apply, and the only trace is a
      // console line. Wired by the merge arbiter; x3 left it as a
      // cross-boundary note because `dragDeps` sits outside its region.
      onSelectionOutsideWindow: () => {
        new import_obsidian24.Notice(
          "Spaces: some of that selection was scrolled out of view, so the move was left to Obsidian and no new order was saved."
        );
      },
      moveInto: (paths, targetFolder, edge, targetPath) => this.moveAndOrder(paths, targetFolder, edge, targetPath),
      // The three translation questions `DragOrdering` asks, answered from the
      // one chain index the sort seam and the explorer adapter also read.
      // Wired unconditionally: with no index every one of them is the
      // identity, and `compactCoords.ts` records why that is load bearing
      // rather than defensive.
      storedPathFor: (path) => displayToStored(this.chainIndexNow, path),
      displayPathFor: (path) => storedToDisplay(this.chainIndexNow, path),
      isCompactedRow: (path) => isCompactedRow(this.chainIndexNow, path),
      // `DragOrdering` refuses the drop on its own -- this hook only voices
      // it, exactly as `onSelectionOutsideWindow` above voices its decline.
      //
      // A compacted row is drawn where its chain's topmost folder was and
      // carries the chain's deepest folder as its path, so "move it into that
      // folder" has no single destination the user could have meant. The
      // decision taken for this feature is that such a row reorders among the
      // rows it is drawn beside and does nothing else, and that the way out is
      // to stop compacting rather than to guess.
      //
      // Fired for a drag whether or not reordering is enabled, because
      // compaction is a different setting and a user who turned reordering off
      // did not thereby agree to have chain folders moved. See `carried` in
      // `DragOrdering.ts`.
      //
      // Singular, and it stays singular for a selection of several rows. One
      // compacted row refuses the whole gesture, so the sentence names the
      // obstacle rather than counting the selection, and the instruction is
      // the same either way. A count would be the kind of explanation the copy
      // rules for this feature exclude.
      onCompactedRowRefused: () => {
        new import_obsidian24.Notice(
          "Spaces: that folder is part of a compacted chain. Turn off compact folder chains to move it."
        );
      },
      // The same rule the renderer reads, evaluated per event, so a space
      // switch changes the answer with no rebind - gating the gesture
      // alongside the rendering is what stops a drag in All writing an order
      // that nothing would apply.
      //
      // An overridden space is inert here too, for the same coherence reason
      // `orderMapFor` renders it with Obsidian's own sort: a drop names a
      // position against the rows on screen, and while overridden those rows
      // are the native sort, not the saved order a drop would edit.
      // `DragOrdering` re-asks this per `dragstart` (see its `bind()`), so an
      // override that flips without a rebind is still honoured.
      //
      // Mobile has no HTML5 drag: `dragstart` never fires from touch, so the
      // gesture does not exist there rather than merely degrading. Gated here
      // rather than inside `DragOrdering`, which imports nothing from
      // `"obsidian"` on purpose - the platform question belongs in the file
      // that already knows the platform. `manifest` says `isDesktopOnly`
      // today, so this is unreachable in practice; it is here so correctness
      // stops depending on that flag.
      // Paused is inert too, and for the same coherence reason as an
      // overridden space directly above: `setFilteringPaused` releases the
      // sort seam but leaves `DragOrdering` bound, so a same-parent drag was
      // still claimed and still wrote a new order through `writeOrderFor`
      // while nothing on screen moved. `orderingScope.ts`'s header names that
      // exact failure -- data quietly accumulating with no visible effect --
      // and it is why this predicate, not the renderer alone, is where the
      // gate belongs.
      enabled: () => !import_obsidian24.Platform.isMobile && !this.filteringPaused && orderingEnabledFor(this.runtime.getSelection(), this.defs.get().settings) && !isOverridden(this.runtime.getSelection(), this.runtime.getSortOverrides()),
      // Only the override earns an explanation. A drag blocked because
      // `allowReordering`/`allowReorderingAll` is off stays silent —
      // the user turned that off in settings and does not need reminding.
      // The decision itself is `shouldExplainBlockedDrag`
      // (src/order/sortOverride.ts), pure and Layer-1 tested; this closure
      // owns only the side effects.
      //
      // `overridden` alone is not enough.
      // A reachable trap state — override *All*, then turn
      // `allowReorderingAll` off — leaves `overridden` true while ordering is
      // ALSO blocked by the setting, and a two-input check fires the Notice
      // anyway, telling the user to restore saved ordering when doing so
      // changes nothing visible. `orderingEnabled` is `orderingEnabledFor`'s own
      // answer, passed as the third input so the "is this actually the
      // reason" check is real rather than assumed.
      onBlockedDrag: () => {
        if (this.filteringPaused) return;
        const sel = this.runtime.getSelection();
        const overridden = isOverridden(sel, this.runtime.getSortOverrides());
        const orderingEnabled = orderingEnabledFor(sel, this.defs.get().settings);
        if (!shouldExplainBlockedDrag(overridden, orderingEnabled)) return;
        const live = this.blockedDragNotice;
        const reusable = live !== null && live.messageEl.isConnected;
        const message = `Spaces: reordering is paused while the tree shows Obsidian's sort order. Dropping onto a folder still moves the file. Pick "${SORT_MENU_MODE}" in the sort menu to resume.`;
        if (reusable && live) {
          live.setMessage(message);
        } else {
          this.blockedDragNotice = new import_obsidian24.Notice(message);
        }
      }
    };
  }
  /**
   * The folder a path lives in, in STORAGE's spelling, or null when the path
   * is not in the vault.
   *
   * Obsidian's root folder has path `"/"`; every order map, membership list
   * and stored path in this plugin spells the root `""`. Named rather than
   * inlined so `describeRow` and the lookup it hands `displayParentOf` are the
   * same answer -- a translation layer that resolved the head through a
   * second, differently normalised lookup would answer `"/"` for a top-level
   * chain and match nothing in storage.
   */
  vaultParentOf(path) {
    var _a, _b;
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!f) return null;
    const parent = (_b = (_a = f.parent) == null ? void 0 : _a.path) != null ? _b : "";
    return parent === "/" ? "" : parent;
  }
  /** "" is the vault root, which Obsidian addresses as "/". */
  folderFor(folderPath) {
    return this.app.vault.getAbstractFileByPath(folderPath === "" ? "/" : folderPath);
  }
  /**
   * Compacted against the folder's live children on write, so a stale
   * entry cannot accumulate. Reads already skip what does not resolve; this is
   * where storage is actually tidied.
   */
  async writeOrderFor(folderPath, order) {
    var _a;
    const folder = this.folderFor(folderPath);
    const live = new Set(((_a = folder == null ? void 0 : folder.children) != null ? _a : []).map((c) => c.path));
    const tidy = live.size > 0 ? compact(order, live) : order;
    const sel = this.runtime.getSelection();
    try {
      await this.defs.mutate((d) => {
        var _a2, _b, _c, _d, _e;
        (_a2 = d.orders) != null ? _a2 : d.orders = {};
        if (sel.kind === "all") {
          (_c = (_b = d.orders).all) != null ? _c : _b.all = /* @__PURE__ */ Object.create(null);
          d.orders.all[folderPath] = tidy;
        } else {
          const by = (_e = (_d = d.orders).bySpaceId) != null ? _e : _d.bySpaceId = /* @__PURE__ */ Object.create(null);
          if (!Object.prototype.hasOwnProperty.call(by, sel.id)) {
            by[sel.id] = /* @__PURE__ */ Object.create(null);
          }
          by[sel.id][folderPath] = tidy;
        }
      });
    } catch (e) {
      new import_obsidian24.Notice(`Spaces: could not save the new order (${String(e)})`);
      throw e;
    }
  }
  /**
   * A cross-folder drop is a filesystem move AND a position in the
   * new parent — and the move must land FIRST. Ordering a file into a folder it
   * never reached would leave a permanent phantom entry.
   *
   * Note what is deliberately NOT done here: nothing touches membership. If the
   * target folder is a member, the moved file becomes an inherited member and
   * stays visible with no help. If it was only on screen as scaffolding, the
   * file is now outside the space and the space stops showing it — which is
   * what a move means. Adding membership behind the user's back, or revealing
   * the file through `RevealedSet`, would both be inventing intent; the reveal
   * would not even survive, since a moved file has no live leaf to back it.
   *
   * `targetPath` arrives in STORAGE's spelling, which is the only spelling
   * that can work here: it is handed straight to `computeDrop` beside
   * `dragDeps().displayedOrder`, and that list already names a compacted
   * chain by its topmost folder. A row's own `data-path` would name the
   * chain's deepest folder, which is not a child of `targetFolder` at all, so
   * the position would be computed against nothing and silently dropped.
   * `DragOrdering` does the translation before calling this; see `moveInto`
   * in `DragOrdering.ts`.
   */
  async moveAndOrder(paths, targetFolder, edge, targetPath) {
    const moved = [];
    let failures = 0;
    for (const p of paths) {
      const file = this.app.vault.getAbstractFileByPath(p);
      if (!file) continue;
      const base = p.split("/").pop();
      if (!base) continue;
      const dest = targetFolder === "" ? base : `${targetFolder}/${base}`;
      if (dest === p) continue;
      try {
        await this.app.fileManager.renameFile(file, dest);
        moved.push(dest);
      } catch (e) {
        failures++;
        console.error(`Spaces: could not move ${p} to ${dest}`, e);
      }
    }
    if (failures > 0) {
      new import_obsidian24.Notice(
        `Spaces: moved ${moved.length} of ${paths.length}. ${failures} could not move. See the console for details.`
      );
    }
    if (moved.length === 0) return;
    const deps = this.dragDeps();
    const next = computeDrop({
      order: deps.storedOrder(targetFolder),
      displayed: deps.displayedOrder(targetFolder),
      dragged: moved,
      targetPath,
      edge
    });
    if (next) await this.writeOrderFor(targetFolder, next);
  }
  /** The override comes off, and `unpatch` forces the re-sort that reverts it. */
  teardownOrdering() {
    if (this.sortedViews.length === 0) return;
    for (const view of this.sortedViews) unpatch(view);
    this.sortedViews = [];
    this.lastResort = null;
  }
  /**
   * The switch flicker, and what measurement showed it actually is.
   *
   * Across a space switch, `changeLayout()` destroys the explorer and Obsidian
   * rebuilds it. Measured in the fixture vault: the old container is gone by
   * ~2ms, a NEW container appears at ~24ms and holds the COMPLETE UNFILTERED
   * tree by ~35ms, and spaces's first apply does not land until ~78ms — so
   * roughly 43ms, two to four frames, of fully painted wrong content. The
   * adapter cannot prevent it: it does not know the new container exists until
   * `bindExplorer()` runs, which is after the transition resolves.
   *
   * So the tree is hidden for the duration instead. Only while a real restore
   * is happening: with restoration off there is no rebuild, no flicker, and
   * masking would add a blank for nothing.
   */
  async runMaskedTransition(from, to) {
    const restoring = this.effectiveRestore();
    if (restoring) this.setSwitchMask(true);
    try {
      return await this.layout.transition(from, to, restoring);
    } catch (e) {
      this.setSwitchMask(false);
      throw e;
    }
  }
  /* ---------------------------------------------------------------- *
   * The declared extension surface.
   * ---------------------------------------------------------------- */
  /**
   * Publishes which space the tree is filtered to: the body marker, and
   * one `onSpaceChange` event per actual change.
   *
   * Called from `host.apply`, the one point every path converges on AFTER
   * `runtime.setSelection` commits — the same argument the header repaint
   * and the strip repaint are hung off, and for the same reason. That runs
   * on every file open as well as every switch, hence `announcedSpaceId`: the
   * marker is idempotent, the event must not be.
   */
  syncSpaceSurface() {
    const space = this.publicApi.markedSpace();
    const body = this.app.workspace.containerEl.ownerDocument.body;
    if (space) body.setAttribute(ATTR_SPACE, space.id);
    else body.removeAttribute(ATTR_SPACE);
    this.publicApi.announce();
  }
  /**
   * Teardown, and the leak answer for `onSpaceChange`: a consumer that never calls
   * its unsubscribe still leaks nothing of ours, because the set is dropped
   * here. Registered from `start()` via `Component.register`, so it runs on
   * unload beside the rest of the teardown.
   */
  releaseSpaceSurface() {
    this.publicApi.dispose();
    this.app.workspace.containerEl.ownerDocument.body.removeAttribute(ATTR_SPACE);
  }
  /**
   * The mask lives on `document.body` because every element inside the
   * explorate pane is replaced during a switch — measured, twice, while
   * instrumenting this. A class on the body cannot go stale.
   */
  setSwitchMask(on) {
    const body = this.app.workspace.containerEl.ownerDocument.body;
    if (on) body.classList.add(CLS_SWITCHING);
    else body.classList.remove(CLS_SWITCHING);
  }
  /**
   * One teardown step, isolated — the per-step guarding discipline
   * `bindExplorer()` already applies, brought to `onunload`.
   *
   * Teardown steps are INDEPENDENT in a way `start()`'s are not: each takes a
   * different thing back off the app, so a failure to remove the drag binding
   * is no reason to leave the header, the mask and the definitions subscriber
   * behind as well. The worst of those: an early throw skips
   * `unsubscribeDefs()`, and the subscriber it leaves holds this instance and
   * keeps repainting a switcher that is no longer on screen, for the life of
   * the app. Obsidian calls `onunload` once and does not retry.
   *
   * The guard's own `console.error` is wrapped too: a throw from the reporter
   * would reintroduce exactly the skip this method exists to prevent.
   */
  unloadStep(what, step) {
    try {
      step();
    } catch (e) {
      try {
        console.error(`Spaces: ${what} failed during unload`, e);
      } catch (e2) {
      }
    }
  }
  onunload() {
    var _a;
    this.loaded = false;
    (_a = this.controller) == null ? void 0 : _a.dispose();
    this.unloadStep("cancelling the deferred sort-gesture write", () => {
      if (this.sortGestureTimer !== null) {
        window.clearTimeout(this.sortGestureTimer);
        this.sortGestureTimer = null;
      }
    });
    this.unloadStep(
      "cancelling the sort-menu injection",
      () => cancelMenuInjection()
    );
    this.unloadStep("clearing the switch mask", () => this.setSwitchMask(false));
    this.unloadStep("unbinding drag ordering", () => {
      var _a2;
      (_a2 = this.dragOrdering) == null ? void 0 : _a2.unbind();
      this.dragOrdering = null;
    });
    this.unloadStep("restoring the new-file location", () => {
      var _a2;
      (_a2 = this.restoreNewFileParent) == null ? void 0 : _a2.call(this);
      this.restoreNewFileParent = null;
    });
    this.unloadStep("restoring the context menu's creation targets", () => {
      var _a2;
      (_a2 = this.restoreNativeCreate) == null ? void 0 : _a2.call(this);
      this.restoreNativeCreate = null;
    });
    this.unloadStep("unpatching the sort seam", () => this.teardownOrdering());
    this.unloadStep("unbinding the explorer adapter", () => this.adapter.unbind());
    this.unloadStep("destroying the switcher", () => {
      var _a2;
      return (_a2 = this.switcher) == null ? void 0 : _a2.destroy();
    });
    this.unloadStep("destroying the space header", () => {
      var _a2;
      return (_a2 = this.header) == null ? void 0 : _a2.destroy();
    });
    this.unloadStep("destroying the create-space panel", () => {
      var _a2;
      (_a2 = this.createPanel) == null ? void 0 : _a2.destroy();
      this.createPanel = null;
    });
    this.unloadStep(
      "closing the missing-root Notice and picker",
      () => this.missingRoot.clear()
    );
    this.unloadStep("unsubscribing from definitions", () => {
      var _a2;
      (_a2 = this.unsubscribeDefs) == null ? void 0 : _a2.call(this);
      this.unsubscribeDefs = null;
      this.settingTab = null;
    });
  }
};

/* nosourcemap */