import { MODULE_ID } from "./constants.js";
import { TimeEngine } from "./time-engine.js";
import { NotesManager } from "./notes-manager.js";

export function registerAPI() {
  const module = game.modules.get(MODULE_ID);
  module.api = {
    getCurrentDate: () => TimeEngine.getCurrentDate(),
    getDateFromWorldTime: (worldTime) => TimeEngine.getDateFromWorldTime(worldTime),
    formatDate: (dateInfo, opts) => TimeEngine.formatDate(dateInfo, opts),
    formatTime: (dateInfo) => TimeEngine.formatTime(dateInfo),
    setDate: (year, month, day, hour = 0, minute = 0) => {
      if (!game.user.isGM) {
        ui.notifications?.warn("Só o mestre pode alterar a data do mundo.");
        return;
      }
      const base = TimeEngine.getWorldTimeForDate(year, month, day);
      return game.time.advance(base + hour * 3600 + minute * 60 - game.time.worldTime);
    },
    getRecurringEvents: () => NotesManager.getRecurringEvents(),
    getYearNotes: (year) => (year ? NotesManager.getYearNotesForYear(year) : NotesManager.getYearNotes())
  };
}
