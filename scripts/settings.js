import { MODULE_ID } from "./constants.js";
import { DEFAULT_STARTING_YEAR } from "./calendar-data.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "defaultStartingYear", {
    name: "Ano artoniano padrão",
    hint: "Usado só na primeira vez que o módulo roda neste mundo, para calibrar a data atual automaticamente. Depois disso, use \"Calibrar data atual\" na janela do calendário para corrigir.",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_STARTING_YEAR
  });

  game.settings.register(MODULE_ID, "anchorWeekday", {
    name: "Dia da semana do dia 1 de Caravana do ano de calibração",
    hint: "0 = Valk, 1 = Hedryl, 2 = Luna, 3 = Astar, 4 = Dallia, 5 = Haya, 6 = Leen.",
    scope: "world",
    config: true,
    type: Number,
    default: 0
  });

  // Ponto de referência real: qual worldTime corresponde a qual data
  // artoniana. Calibrado automaticamente na primeira vez que o mundo
  // carrega o módulo (usando "defaultStartingYear"), e recalibrável a
  // qualquer momento pelo mestre em "Calibrar data atual".
  game.settings.register(MODULE_ID, "epoch", {
    scope: "world",
    config: false,
    type: Object,
    default: null
  });

  game.settings.register(MODULE_ID, "showMoon", {
    name: "Mostrar fase da lua (Vitália)",
    scope: "world",
    config: true,
    type: Boolean,
    default: true
  });

  // Dados gerados/persistidos, não expostos na tela de configurações.
  game.settings.register(MODULE_ID, "nimbData", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, "customEvents", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "eventOverrides", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, "hiddenEvents", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "customYearNotes", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "yearNoteOverrides", {
    scope: "world",
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, "hiddenYearNotes", {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, "widgetCollapsed", {
    scope: "client",
    config: false,
    type: Boolean,
    default: false
  });
}
