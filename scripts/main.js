import { MODULE_ID } from "./constants.js";
import { registerSettings } from "./settings.js";
import { NimbManager } from "./nimb-manager.js";
import { NotesManager } from "./notes-manager.js";
import { registerAPI } from "./api.js";
import { MiniWidget } from "./widgets/mini-widget.js";
import { CalendarApp } from "./widgets/calendar-app.js";

Hooks.once("init", () => {
  registerSettings();
  console.log(`${MODULE_ID} | Inicializado`);
});

Hooks.once("ready", () => {
  NimbManager.init();
  NotesManager.init();
  registerAPI();

  const widget = new MiniWidget();
  widget.render(true);

  console.log(`${MODULE_ID} | Pronto`);
});

Hooks.on("updateWorldTime", () => {
  MiniWidget.refresh();
  CalendarApp.refresh();
});
