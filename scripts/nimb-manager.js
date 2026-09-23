import { MODULE_ID, NIMB_MIN_DAYS, NIMB_MAX_DAYS, MONTHS_PER_YEAR } from "./constants.js";

/**
 * Os Dias de Nimb variam de 2 a 8 por ano, e a posição (depois de
 * qual mês) também varia — no livro, ninguém consegue prever. Aqui,
 * isso é resolvido sorteando na primeira vez que um ano é consultado,
 * e o resultado é guardado (mundo) para todo mundo ver o mesmo valor
 * dali em diante.
 */
export class NimbManager {
  static _cache = null;

  static init() {
    this._cache = foundry.utils.deepClone(game.settings.get(MODULE_ID, "nimbData")) ?? {};
  }

  /**
   * @param {number} year
   * @returns {{count: number, afterMonth: number}}
   */
  static getNimbInfo(year) {
    if (!this._cache) this.init();
    const key = String(year);

    if (key in this._cache) return this._cache[key];

    const info = {
      count: NIMB_MIN_DAYS + Math.floor(Math.random() * (NIMB_MAX_DAYS - NIMB_MIN_DAYS + 1)),
      afterMonth: 1 + Math.floor(Math.random() * MONTHS_PER_YEAR)
    };

    // Guarda localmente sempre, para a sessão atual ficar consistente.
    this._cache[key] = info;

    // Só o GM persiste no mundo (permissão de settings "world").
    // Jogadores que consultarem um ano ainda não gerado veem um valor
    // válido nesta sessão, mas ele só "gruda" de vez quando o GM
    // também passar por esse ano (o que normalmente acontece primeiro,
    // já que só o GM avança o tempo do mundo).
    if (game.user?.isGM) {
      game.settings.set(MODULE_ID, "nimbData", this._cache).catch((err) =>
        console.error(`${MODULE_ID} | Falha ao salvar Dias de Nimb de ${year}`, err)
      );
    }

    return info;
  }
}
