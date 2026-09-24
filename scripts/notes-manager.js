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

    const builtins = RECURRING_EVENTS.filter((e) => !hidden.includes(e.id)).map((e) => ({
      ...e,
      ...(overrides[e.id] ?? {}),
      builtin: true
    }));

    return [...builtins, ...custom.map((e) => ({ ...e, builtin: false }))];
  }

  static getRecurringEventsForDay(month, day) {
    return this.getRecurringEvents().filter((e) => {
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

  // ---------- Notas históricas (ancoradas a um ano) ----------

  static getYearNotes() {
    const overrides = game.settings.get(MODULE_ID, "yearNoteOverrides") ?? {};
    const hidden = game.settings.get(MODULE_ID, "hiddenYearNotes") ?? [];
    const custom = game.settings.get(MODULE_ID, "customYearNotes") ?? [];

    const builtins = YEAR_NOTES.filter((n) => !hidden.includes(n.id)).map((n) => ({
      ...n,
      ...(overrides[n.id] ?? {}),
      builtin: true
    }));

    return [...builtins, ...custom.map((n) => ({ ...n, builtin: false }))];
  }

  static getYearNotesForYear(year) {
    return this.getYearNotes().filter((n) => n.year === year);
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
}
