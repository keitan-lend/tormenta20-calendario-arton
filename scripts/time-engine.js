import {
  MODULE_ID,
  SECONDS_PER_DAY,
  SECONDS_PER_HOUR,
  SECONDS_PER_MINUTE,
  BASE_DAYS_PER_YEAR
} from "./constants.js";
import { MONTHS, WEEKDAYS, MOON } from "./calendar-data.js";
import { NimbManager } from "./nimb-manager.js";

function floorDiv(a, b) {
  return Math.floor(a / b);
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

export class TimeEngine {
  static getStartingYear() {
    return game.settings.get(MODULE_ID, "startingYear");
  }

  static getAnchorWeekday() {
    return game.settings.get(MODULE_ID, "anchorWeekday") ?? 0;
  }

  static getYearLength(year) {
    return BASE_DAYS_PER_YEAR + NimbManager.getNimbInfo(year).count;
  }

  /**
   * Resolve um índice absoluto de dia (0 = dia 1 de Caravana do ano
   * inicial) para {year, dayOfYear (0-based), nonNimbDaysBefore}.
   * nonNimbDaysBefore é o total de dias "normais" (fora de Dias de
   * Nimb) que já se passaram antes do início deste dia — usado para
   * calcular o dia da semana.
   */
  static _resolveYear(totalDays) {
    const anchorYear = this.getStartingYear();
    let year = anchorYear;
    let remaining = totalDays;
    let nonNimbBefore = 0;

    if (remaining >= 0) {
      while (true) {
        const yearLen = this.getYearLength(year);
        if (remaining < yearLen) break;
        remaining -= yearLen;
        nonNimbBefore += BASE_DAYS_PER_YEAR; // todo ano "normal" tem sempre 360 dias fora de Nimb
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

  /**
   * Converte um worldTime (segundos) em componentes de data artoniana.
   */
  static getDateFromWorldTime(worldTime) {
    const totalDays = floorDiv(worldTime, SECONDS_PER_DAY);
    const secondsOfDay = worldTime - totalDays * SECONDS_PER_DAY;

    const hour = floorDiv(secondsOfDay, SECONDS_PER_HOUR);
    const minute = floorDiv(secondsOfDay - hour * SECONDS_PER_HOUR, SECONDS_PER_MINUTE);
    const second = secondsOfDay - hour * SECONDS_PER_HOUR - minute * SECONDS_PER_MINUTE;

    const { year, dayOfYear, nonNimbBeforeYear } = this._resolveYear(totalDays);
    const nimb = NimbManager.getNimbInfo(year);
    const insertionIndex = nimb.afterMonth * 30; // dias completos até o fim do mês de inserção

    let month = null;
    let day = null;
    let isNimbDay = false;
    let nimbDayIndex = null;
    let nonNimbSoFarThisYear;

    if (dayOfYear < insertionIndex) {
      month = floorDiv(dayOfYear, 30) + 1;
      day = mod(dayOfYear, 30) + 1;
      nonNimbSoFarThisYear = dayOfYear;
    } else if (dayOfYear < insertionIndex + nimb.count) {
      isNimbDay = true;
      nimbDayIndex = dayOfYear - insertionIndex + 1; // 1-based
      nonNimbSoFarThisYear = insertionIndex;
    } else {
      const shifted = dayOfYear - nimb.count;
      month = floorDiv(shifted, 30) + 1;
      day = mod(shifted, 30) + 1;
      nonNimbSoFarThisYear = shifted;
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
      nimbTotalThisYear: nimb.count,
      hour,
      minute,
      second,
      moon: game.settings.get(MODULE_ID, "showMoon") ? this.getMoonPhase(totalDays) : null
    };
  }

  static getCurrentDate() {
    return this.getDateFromWorldTime(game.time.worldTime);
  }

  /**
   * A lua (Vitália) segue seu próprio ciclo de 29 dias corridos,
   * independente dos Dias de Nimb do calendário artoniano.
   */
  static getMoonPhase(totalDays) {
    const dayInCycle = mod(totalDays, MOON.cycleLength);
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

  /**
   * Converte uma data artoniana (ano, mês 1-12, dia 1-30) para o
   * worldTime correspondente à meia-noite daquele dia. Não aceita
   * Dias de Nimb como alvo direto (não têm mês/dia).
   */
  static getWorldTimeForDate(year, month, day) {
    const anchorYear = this.getStartingYear();
    let totalDays = 0;

    if (year >= anchorYear) {
      for (let y = anchorYear; y < year; y++) totalDays += this.getYearLength(y);
    } else {
      for (let y = anchorYear - 1; y >= year; y--) totalDays -= this.getYearLength(y);
    }

    const nimb = NimbManager.getNimbInfo(year);
    const insertionIndex = nimb.afterMonth * 30;
    let dayOfYear = (month - 1) * 30 + (day - 1);
    if (dayOfYear >= insertionIndex) dayOfYear += nimb.count;

    totalDays += dayOfYear;
    return totalDays * SECONDS_PER_DAY;
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
