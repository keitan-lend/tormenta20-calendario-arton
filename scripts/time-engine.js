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

  /**
   * O ponto de referência entre worldTime (segundos reais do Foundry)
   * e a data artoniana. Calibrado automaticamente na primeira vez que
   * o módulo roda neste mundo (tratando o worldTime atual como o dia 1
   * de Caravana do ano configurado em "defaultStartingYear") — isso
   * evita o bug de mundos com campanha já em andamento assumirem que
   * worldTime=0 é "hoje". Pode ser recalibrado a qualquer momento via
   * calibrateEpoch().
   */
  static getEpoch() {
    let epoch = game.settings.get(MODULE_ID, "epoch");
    if (epoch) return epoch;

    const year = game.settings.get(MODULE_ID, "defaultStartingYear") ?? DEFAULT_STARTING_YEAR;
    epoch = { worldTime: game.time.worldTime, year, month: 1, day: 1 };

    if (game.user?.isGM) {
      game.settings.set(MODULE_ID, "epoch", epoch).catch((err) =>
        console.error(`${MODULE_ID} | Falha ao calibrar a época inicial`, err)
      );
    }

    return epoch;
  }

  /**
   * Recalibra a época: define que, agora mesmo (worldTime atual), é o
   * dia/mês/ano informado. Só o mestre pode chamar isso.
   */
  static async calibrateEpoch(year, month, day) {
    if (!game.user.isGM) return;
    const dayStart = floorDiv(game.time.worldTime, SECONDS_PER_DAY) * SECONDS_PER_DAY;
    const epoch = { worldTime: dayStart, year, month, day };
    await game.settings.set(MODULE_ID, "epoch", epoch);
  }

  static getYearLength(year) {
    return BASE_DAYS_PER_YEAR + NimbManager.getNimbInfo(year).count;
  }

  /** Índice absoluto (mesma escala de _resolveYear) do dia da época. */
  static _epochDayIndex() {
    const epoch = this.getEpoch();
    return this._dayIndexForYearStart(epoch.year) + this._dayOffsetWithinYear(epoch.year, epoch.month, epoch.day);
  }

  /**
   * Índice absoluto (0-based) do dia 1 de Caravana do ano `year`,
   * usando o ano da época como referência (ano da época = índice 0).
   */
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

  /**
   * Converte um índice absoluto de dia (relativo ao ano da época) em
   * {year, dayOfYear (0-based), nonNimbBeforeYear}.
   */
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

  /**
   * Converte um worldTime (segundos) em componentes de data artoniana.
   */
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
    const nimb = NimbManager.getNimbInfo(year);
    const insertionIndex = nimb.afterMonth * 30;

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
      nimbDayIndex = dayOfYear - insertionIndex + 1;
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
      moon: game.settings.get(MODULE_ID, "showMoon") ? this.getMoonPhase(totalDaysAbs) : null
    };
  }

  static getCurrentDate() {
    return this.getDateFromWorldTime(game.time.worldTime);
  }

  /**
   * Dias de Nimb que já foram sorteados/serão sorteados para o ano
   * atualmente exibido — usado para mostrar "N Dias de Nimb este ano"
   * de forma sempre visível, não só quando se navega até o mês certo.
   */
  static getNimbInfoForYear(year) {
    return NimbManager.getNimbInfo(year);
  }

  /**
   * A lua (Vitália) segue seu próprio ciclo de 29 dias corridos,
   * independente dos Dias de Nimb do calendário artoniano.
   */
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

  /**
   * Converte uma data artoniana (ano, mês 1-12, dia 1-30, hora, minuto)
   * para o worldTime correspondente.
   */
  static getWorldTimeForDate(year, month, day, hour = 0, minute = 0) {
    const epoch = this.getEpoch();
    const epochDayAbs = floorDiv(epoch.worldTime, SECONDS_PER_DAY);

    const targetDayIndex = this._dayIndexForYearStart(year) + this._dayOffsetWithinYear(year, month, day);
    const totalDaysAbs = targetDayIndex - this._epochDayIndex() + epochDayAbs;

    return totalDaysAbs * SECONDS_PER_DAY + hour * SECONDS_PER_HOUR + minute * SECONDS_PER_MINUTE;
  }

  static _dayOffsetWithinYear(year, month, day) {
    const nimb = NimbManager.getNimbInfo(year);
    const insertionIndex = nimb.afterMonth * 30;
    let dayOfYear = (month - 1) * 30 + (day - 1);
    if (dayOfYear >= insertionIndex) dayOfYear += nimb.count;
    return dayOfYear;
  }

  /** Ajusta só a hora/minuto do dia atual, sem mudar a data. */
  static async setTimeOfDay(hour, minute) {
    if (!game.user.isGM) return;
    const dayStart = floorDiv(game.time.worldTime, SECONDS_PER_DAY) * SECONDS_PER_DAY;
    const target = dayStart + hour * SECONDS_PER_HOUR + minute * SECONDS_PER_MINUTE;
    await game.time.advance(target - game.time.worldTime);
  }

  /** Avança (ou retrocede, com N negativo) o worldTime em horas, dias ou anos. */
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
