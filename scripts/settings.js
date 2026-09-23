import { MODULE_ID } from "./constants.js";
import { DEFAULT_STARTING_YEAR } from "./calendar-data.js";

export function registerSettings() {
  game.settings.register(MODULE_ID, "startingYear", {
    name: "Ano inicial da campanha",
    hint: "Ano artoniano correspondente ao instante em que o mundo do Foundry foi criado (worldTime = 0). Novas campanhas usam 1425 por padrão.",
    scope: "world",
    config: true,
    type: Number,
    default: DEFAULT_STARTING_YEAR,
    requiresReload: true
  });

  game.settings.register(MODULE_ID, "anchorWeekday", {
    name: "Dia da semana do dia 1 de Caravana do ano inicial",
    hint: "0 = Valk, 1 = Hedryl, 2 = Luna, 3 = Astar, 4 = Dallia, 5 = Haya, 6 = Leen.",
    scope: "world",
    config: true,
    type: Number,
    default: 0,
    requiresReload: true
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
}
