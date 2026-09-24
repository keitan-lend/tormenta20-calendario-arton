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
      const target = TimeEngine.getWorldTimeForDate(year, month, day, hour, minute);
      return game.time.advance(target - game.time.worldTime);
    },
    calibrateEpoch: (year, month, day) => {
      if (!game.user.isGM) {
        ui.notifications?.warn("Só o mestre pode calibrar a data do mundo.");
        return;
      }
      return TimeEngine.calibrateEpoch(year, month, day);
    },
    setTimeOfDay: (hour, minute) => {
      if (!game.user.isGM) {
        ui.notifications?.warn("Só o mestre pode alterar a hora do mundo.");
        return;
      }
      return TimeEngine.setTimeOfDay(hour, minute);
    },
    advanceBy: (amount, unit) => {
      if (!game.user.isGM) {
        ui.notifications?.warn("Só o mestre pode avançar o tempo do mundo.");
        return;
      }
      return TimeEngine.advanceBy(amount, unit);
    },
    getRecurringEvents: () => NotesManager.getRecurringEvents(),
    getYearNotes: (year) => (year ? NotesManager.getYearNotesForYear(year) : NotesManager.getYearNotes())
  };
}
