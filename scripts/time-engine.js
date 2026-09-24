import {
  MODULE_ID,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  BASE_DAYS_PER_YEAR
} from "./constants.js";
import { MONTHS, WEEKDAYS, MOON, DEFAULT_STARTING_YEAR } from "./calendar-data.js";
import { NimbManager } from "./nimb-manager.js";

function floorDiv(a, b) {
  return Math.floor(a / b);
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

export class TimeEngine {
  static getAnchorWeekday() {
    return game.settings.get(MODULE_ID, "anchorWeekday") ?? 0;
  }

  static getEpoch() {
    return game.settings.get(MODULE_ID, "epoch") ?? {
      worldTime: 0,
      year: game.settings.get(MODULE_ID, "defaultStartingYear") ?? DEFAULT_STARTING_YEAR,
      month: 1,
      day: 1
    };
  }

  static async calibrateEpoch(year, month, day) {
    if (!game.user.isGM) return;
    const dayStart = floorDiv(game.time.worldTime, SECONDS_PER_DAY) * SECONDS_PER_DAY;
    const epoch = { worldTime: dayStart, year, month, day };
    await game.settings.set(MODULE_ID, "epoch", epoch);
  }

  static getYearLength(year) {
    return BASE_DAYS_PER_YEAR + NimbManager.getNimbInfo(year).count;
  }

  /**
   * Layout do ano em ordem cronológica:
   *   [mês 1 (30d)] [nimb do mês 1...] [mês 2 (30d)] [nimb do mês 2...] ...
   */
  static _buildLayout(year) {
    const nimb = NimbManager.getNimbInfo(year);
    const byMonth = {};
    nimb.afterMonths.forEach((m, i) => {
      (byMonth[m] ??= []).push(i + 1); // índice global 1-based
    });

    const layout = [];
    for (let m = 1; m <= 12; m++) {
      layout.push({ type: "month", month: m, length: 30 });
      if (byMonth[m]) {
        for (const globalIdx of byMonth[m]) {
          layout.push({ type: "nimb", month: m, nimbIndex: globalIdx, length: 1 });
        }
      }
    }
    return layout;
  }

  static _epochDayIndex() {
    const epoch = this.getEpoch();
    return this._dayIndexForYearStart(epoch.year) + this._dayOffsetWithinYear(epoch.year, epoch.month, epoch.day);
  }

  static _dayIndexForYearStart(year) {
    const epoch = this.getEpoch();
    let index = 0;
    if (year >= epoch.year) {
      for (let y = epoch.year; y < year; y++) index += this.getYearLength(y);
    } else {
      for (let y = epoch.year - 1; y >= year; y--) index -= this.getYearLength(y);
    }
    return index;
  }

  static _resolveYear(totalDays) {
    const epoch = this.getEpoch();
    let year = epoch.year;
    let remaining = totalDays;
    let nonNimbBefore = 0;

    if (remaining >= 0) {
      while (true) {
        const yearLen = this.getYearLength(year);
        if (remaining < yearLen) break;
        remaining -= yearLen;
        nonNimbBefore += BASE_DAYS_PER_YEAR;
        year += 1;
      }
    } else {
      while (remaining < 0) {
        year -= 1;
        const yearLen = this.getYearLength(year);
        remaining += yearLen;
        nonNimbBefore -= BASE_DAYS_PER_YEAR;
      }
    }
    return { year, dayOfYear: remaining, nonNimbBeforeYear: nonNimbBefore };
  }

  static getDateFromWorldTime(worldTime) {
    const epoch = this.getEpoch();

    const totalDaysAbs = floorDiv(worldTime, SECONDS_PER_DAY);
    const secondsOfDay = worldTime - totalDaysAbs * SECONDS_PER_DAY;

    const epochDayAbs = floorDiv(epoch.worldTime, SECONDS_PER_DAY);
    const totalDays = totalDaysAbs - epochDayAbs + this._epochDayIndex();

    const hour = floorDiv(secondsOfDay, SECONDS_PER_HOUR);
    const minute = floorDiv(secondsOfDay - hour * SECONDS_PER_HOUR, SECONDS_PER_MINUTE);
    const second = secondsOfDay - hour * SECONDS_PER_HOUR - minute * SECONDS_PER_MINUTE;

    const { year, dayOfYear, nonNimbBeforeYear } = this._resolveYear(totalDays);
    const layout = this._buildLayout(year);

    let month = null, day = null, isNimbDay = false, nimbDayIndex = null, nonNimbSoFarThisYear = 0;
    let cursor = 0;
    let nonNimbCursor = 0;
    for (const piece of layout) {
      if (dayOfYear < cursor + piece.length) {
        if (piece.type === "month") {
          month = piece.month;
          day = dayOfYear - cursor + 1;
          // Dias não-Nimb antes deste dia = todos os meses anteriores + (dia - 1)
          nonNimbSoFarThisYear = nonNimbCursor + (day - 1);
        } else {
          isNimbDay = true;
          nimbDayIndex = piece.nimbIndex;
        }
        break;
      }
      cursor += piece.length;
      if (piece.type === "month") nonNimbCursor += piece.length;
    }

    let weekday = null;
    if (!isNimbDay) {
      const nonNimbTotal = nonNimbBeforeYear + nonNimbSoFarThisYear;
      const weekdayIndex = mod(nonNimbTotal + this.getAnchorWeekday(), WEEKDAYS.length);
      weekday = WEEKDAYS[weekdayIndex];
    }

    const monthData = month ? MONTHS.find((m) => m.id === month) : null;

    return {
      year,
      month,
      day,
      monthName: monthData?.name ?? null,
      season: monthData?.season ?? null,
      weekday,
      isNimbDay,
      nimbDayIndex,
      nimbTotalThisYear: NimbManager.getNimbInfo(year).count,
      hour,
      minute,
      second,
      moon: game.settings.get(MODULE_ID, "showMoon") ? this.getMoonPhase(totalDaysAbs) : null
    };
  }

  static getCurrentDate() {
    return this.getDateFromWorldTime(game.time.worldTime);
  }

  static getNimbInfoForYear(year) {
    return NimbManager.getNimbInfo(year);
  }

  static getMoonPhase(totalDaysAbs) {
    const dayInCycle = mod(totalDaysAbs, MOON.cycleLength);
    let acc = 0;
    for (const phase of MOON.phases) {
      if (dayInCycle < acc + phase.length) {
        return {
          name: phase.name,
          icon: phase.icon,
          dayInPhase: dayInCycle - acc + 1,
          phaseLength: phase.length
        };
      }
      acc += phase.length;
    }
    return null;
  }

  static getWorldTimeForDate(year, month, day, hour = 0, minute = 0) {
    const epoch = this.getEpoch();
    const epochDayAbs = floorDiv(epoch.worldTime, SECONDS_PER_DAY);

    const targetDayIndex = this._dayIndexForYearStart(year) + this._dayOffsetWithinYear(year, month, day);
    const totalDaysAbs = targetDayIndex - this._epochDayIndex() + epochDayAbs;

    return totalDaysAbs * SECONDS_PER_DAY + hour * SECONDS_PER_HOUR + minute * SECONDS_PER_MINUTE;
  }

  /** WorldTime do início de um Nimb dia pelo seu índice global (1-based). */
  static getWorldTimeForNimbDay(year, globalIndex) {
    const dayOfYear = this.getNimbDayOfYear(year, globalIndex);
    if (dayOfYear == null) return null;
    return this.getWorldTimeForDayOfYear(year, dayOfYear);
  }

  /** Índice absoluto (0-based) do dia do ano em que começa o Nimb dia. */
  static getNimbDayOfYear(year, globalIndex) {
    const layout = this._buildLayout(year);
    let cursor = 0;
    for (const piece of layout) {
      if (piece.type === "nimb" && piece.nimbIndex === globalIndex) return cursor;
      cursor += piece.length;
    }
    return null;
  }

  static getWorldTimeForDayOfYear(year, dayOfYear) {
    const epoch = this.getEpoch();
    const epochDayAbs = floorDiv(epoch.worldTime, SECONDS_PER_DAY);
    const targetDayIndex = this._dayIndexForYearStart(year) + dayOfYear;
    const totalDaysAbs = targetDayIndex - this._epochDayIndex() + epochDayAbs;
    return totalDaysAbs * SECONDS_PER_DAY;
  }

  static _dayOffsetWithinYear(year, month, day) {
    const layout = this._buildLayout(year);
    let cursor = 0;
    for (const piece of layout) {
      if (piece.type === "month" && piece.month === month) return cursor + (day - 1);
      cursor += piece.length;
    }
    return cursor;
  }

  static async setTimeOfDay(hour, minute) {
    if (!game.user.isGM) return;
    const dayStart = floorDiv(game.time.worldTime, SECONDS_PER_DAY) * SECONDS_PER_DAY;
    const target = dayStart + hour * SECONDS_PER_HOUR + minute * SECONDS_PER_MINUTE;
    await game.time.advance(target - game.time.worldTime);
  }

  static async advanceBy(amount, unit) {
    if (!game.user.isGM || !amount) return;

    if (unit === "hours") {
      await game.time.advance(amount * SECONDS_PER_HOUR);
      return;
    }
    if (unit === "days") {
      await game.time.advance(amount * SECONDS_PER_DAY);
      return;
    }
    if (unit === "years") {
      const current = this.getCurrentDate();
      const month = current.month ?? 1;
      const day = current.day ?? 1;
      const secondsOfDay = current.hour * SECONDS_PER_HOUR + current.minute * SECONDS_PER_MINUTE + current.second;
      const target = this.getWorldTimeForDate(current.year + amount, month, day) + secondsOfDay;
      await game.time.advance(target - game.time.worldTime);
    }
  }

  static formatDate(dateInfo, { includeWeekday = true } = {}) {
    if (dateInfo.isNimbDay) {
      return `Dia de Nimb (${dateInfo.nimbDayIndex}/${dateInfo.nimbTotalThisYear}), ${dateInfo.year}`;
    }
    const weekdayPart = includeWeekday && dateInfo.weekday ? `${dateInfo.weekday.name}, ` : "";
    return `${weekdayPart}${dateInfo.day} de ${dateInfo.monthName} de ${dateInfo.year}`;
  }

  static formatTime(dateInfo) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(dateInfo.hour)}:${pad(dateInfo.minute)}`;
  }
}