import { MODULE_ID } from "./constants.js";
import { RECURRING_EVENTS, YEAR_NOTES } from "./calendar-data.js";

function makeId() {
  return foundry.utils.randomID();
}

export class NotesManager {
  static init() {
    // nada a inicializar por enquanto; os settings já têm defaults.
  }

  // ---------- Eventos recorrentes (mesmo dia/mês todo ano) ----------

  static getRecurringEvents() {
    const overrides = game.settings.get(MODULE_ID, "eventOverrides") ?? {};
    const hidden = game.settings.get(MODULE_ID, "hiddenEvents") ?? [];
    const custom = game.settings.get(MODULE_ID, "customEvents") ?? [];
    const visibility = game.settings.get(MODULE_ID, "eventVisibility") ?? {};

    const builtins = RECURRING_EVENTS.filter((e) => !hidden.includes(e.id)).map((e) => ({
      ...e,
      ...(overrides[e.id] ?? {}),
      builtin: true,
      hiddenFromPlayers: visibility[e.id] === false
    }));

    const customMapped = custom.map((e) => ({
      ...e,
      builtin: false,
      hiddenFromPlayers: visibility[e.id] === false
    }));

    return [...builtins, ...customMapped];
  }

  /** @param {{forPlayers?: boolean}} opts - forPlayers=true tira os ocultos dos jogadores. */
  static getRecurringEventsForDay(month, day, { forPlayers = false } = {}) {
    return this.getRecurringEvents().filter((e) => {
      if (forPlayers && e.hiddenFromPlayers) return false;
      const span = e.durationDays ?? 1;
      if (e.month !== month) return false;
      return day >= e.day && day < e.day + span;
    });
  }

  static async saveRecurringEvent(data) {
    if (data.id && RECURRING_EVENTS.some((e) => e.id === data.id)) {
      const overrides = foundry.utils.deepClone(game.settings.get(MODULE_ID, "eventOverrides") ?? {});
      overrides[data.id] = data;
      await game.settings.set(MODULE_ID, "eventOverrides", overrides);
      return;
    }

    const custom = foundry.utils.deepClone(game.settings.get(MODULE_ID, "customEvents") ?? []);
    if (data.id) {
      const idx = custom.findIndex((e) => e.id === data.id);
      if (idx >= 0) {
        custom[idx] = data;
        await game.settings.set(MODULE_ID, "customEvents", custom);
        return;
      }
    }
    custom.push({ ...data, id: makeId() });
    await game.settings.set(MODULE_ID, "customEvents", custom);
  }

  static async deleteRecurringEvent(id) {
    if (RECURRING_EVENTS.some((e) => e.id === id)) {
      const hidden = foundry.utils.deepClone(game.settings.get(MODULE_ID, "hiddenEvents") ?? []);
      if (!hidden.includes(id)) hidden.push(id);
      await game.settings.set(MODULE_ID, "hiddenEvents", hidden);
      return;
    }
    const custom = foundry.utils.deepClone(game.settings.get(MODULE_ID, "customEvents") ?? []);
    await game.settings.set(
      MODULE_ID,
      "customEvents",
      custom.filter((e) => e.id !== id)
    );
  }

  static async toggleEventVisibility(id) {
    const visibility = foundry.utils.deepClone(game.settings.get(MODULE_ID, "eventVisibility") ?? {});
    const currentlyHidden = visibility[id] === false;
    if (currentlyHidden) delete visibility[id];
    else visibility[id] = false;
    await game.settings.set(MODULE_ID, "eventVisibility", visibility);
  }

  // ---------- Notas históricas (ancoradas a um ano) ----------

  static getYearNotes() {
    const overrides = game.settings.get(MODULE_ID, "yearNoteOverrides") ?? {};
    const hidden = game.settings.get(MODULE_ID, "hiddenYearNotes") ?? [];
    const custom = game.settings.get(MODULE_ID, "customYearNotes") ?? [];
    const visibility = game.settings.get(MODULE_ID, "yearNoteVisibility") ?? {};

    const builtins = YEAR_NOTES.filter((n) => !hidden.includes(n.id)).map((n) => ({
      ...n,
      ...(overrides[n.id] ?? {}),
      builtin: true,
      hiddenFromPlayers: visibility[n.id] === false
    }));

    const customMapped = custom.map((n) => ({
      ...n,
      builtin: false,
      hiddenFromPlayers: visibility[n.id] === false
    }));

    return [...builtins, ...customMapped];
  }

  static getYearNotesForYear(year, { forPlayers = false } = {}) {
    return this.getYearNotes().filter((n) => n.year === year && !(forPlayers && n.hiddenFromPlayers));
  }

  static async saveYearNote(data) {
    if (data.id && YEAR_NOTES.some((n) => n.id === data.id)) {
      const overrides = foundry.utils.deepClone(game.settings.get(MODULE_ID, "yearNoteOverrides") ?? {});
      overrides[data.id] = data;
      await game.settings.set(MODULE_ID, "yearNoteOverrides", overrides);
      return;
    }

    const custom = foundry.utils.deepClone(game.settings.get(MODULE_ID, "customYearNotes") ?? []);
    if (data.id) {
      const idx = custom.findIndex((n) => n.id === data.id);
      if (idx >= 0) {
        custom[idx] = data;
        await game.settings.set(MODULE_ID, "customYearNotes", custom);
        return;
      }
    }
    custom.push({ ...data, id: makeId() });
    await game.settings.set(MODULE_ID, "customYearNotes", custom);
  }

  static async deleteYearNote(id) {
    if (YEAR_NOTES.some((n) => n.id === id)) {
      const hidden = foundry.utils.deepClone(game.settings.get(MODULE_ID, "hiddenYearNotes") ?? []);
      if (!hidden.includes(id)) hidden.push(id);
      await game.settings.set(MODULE_ID, "hiddenYearNotes", hidden);
      return;
    }
    const custom = foundry.utils.deepClone(game.settings.get(MODULE_ID, "customYearNotes") ?? []);
    await game.settings.set(
      MODULE_ID,
      "customYearNotes",
      custom.filter((n) => n.id !== id)
    );
  }

  static async toggleYearNoteVisibility(id) {
    const visibility = foundry.utils.deepClone(game.settings.get(MODULE_ID, "yearNoteVisibility") ?? {});
    const currentlyHidden = visibility[id] === false;
    if (currentlyHidden) delete visibility[id];
    else visibility[id] = false;
    await game.settings.set(MODULE_ID, "yearNoteVisibility", visibility);
  }

  /**
   * Desfaz edições/ocultações feitas em cima dos eventos e crônicas
   * canônicos (Livro Básico / Atlas de Arton), sem tocar nas datas e
   * crônicas personalizadas do mestre, nem na visibilidade pros jogadores.
   */
  static async restoreCanonical() {
    await game.settings.set(MODULE_ID, "eventOverrides", {});
    await game.settings.set(MODULE_ID, "hiddenEvents", []);
    await game.settings.set(MODULE_ID, "yearNoteOverrides", {});
    await game.settings.set(MODULE_ID, "hiddenYearNotes", []);
  }
}
