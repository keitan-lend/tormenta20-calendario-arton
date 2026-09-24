import { MODULE_ID, NIMB_MIN_DAYS, NIMB_MAX_DAYS, MONTHS_PER_YEAR } from "./constants.js";

/**
 * Dias de Nimb: quantidade (2 a 8) e posição variam a cada ano.
 * Cada Dia de Nimb é colocado no fim de UM mês sorteado individualmente —
 * a "graça" da regra é o caos, então eles podem se concentrar no mesmo mês
 * ou se espalhar por vários.
 *
 * Formato armazenado:
 *   { count: N, afterMonths: [m1, m2, ..., mN] }  // m em 1..12, ordenado
 */
export class NimbManager {
  static _cache = null;

  static init() {
    this._cache = foundry.utils.deepClone(game.settings.get(MODULE_ID, "nimbData")) ?? {};
  }

  static getNimbInfo(year) {
    if (!this._cache) this.init();
    const key = String(year);

    if (key in this._cache) return this._migrate(this._cache[key]);

    const count = NIMB_MIN_DAYS + Math.floor(Math.random() * (NIMB_MAX_DAYS - NIMB_MIN_DAYS + 1));
    const afterMonths = [];
    for (let i = 0; i < count; i++) {
      afterMonths.push(1 + Math.floor(Math.random() * MONTHS_PER_YEAR));
    }
    afterMonths.sort((a, b) => a - b);

    const info = { count, afterMonths };
    this._cache[key] = info;

    if (game.user?.isGM) {
      game.settings.set(MODULE_ID, "nimbData", this._cache).catch((err) =>
        console.error(`${MODULE_ID} | Falha ao salvar Dias de Nimb de ${year}`, err)
      );
    }

    return info;
  }

  /** Migra do formato antigo {count, afterMonth} para {count, afterMonths}. */
  static _migrate(info) {
    if (info && info.count && !info.afterMonths) {
      return {
        count: info.count,
        afterMonths: Array(info.count).fill(info.afterMonth)
      };
    }
    return info;
  }

  /** Quantos Nimb dias existem no fim de um mês específico. */
  static getCountForMonth(year, month) {
    return this.getNimbInfo(year).afterMonths.filter((m) => m === month).length;
  }

  /** Índice global (1-based) do 1º Nimb dia de um mês, ou null se não houver. */
  static getFirstGlobalIndexForMonth(year, month) {
    const { afterMonths } = this.getNimbInfo(year);
    const before = afterMonths.filter((m) => m < month).length;
    const here = afterMonths.filter((m) => m === month).length;
    return here > 0 ? before + 1 : null;
  }

  /** GM: re-sorteia os Dias de Nimb de um ano. */
  static async regenerate(year) {
    if (!game.user?.isGM) return null;
    if (!this._cache) this.init();
    delete this._cache[String(year)];
    const info = this.getNimbInfo(year);
    return info;
  }
}