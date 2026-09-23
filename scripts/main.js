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

// Botão de acesso rápido no controle de Anotações da cena.
Hooks.on("getSceneControlButtons", (controls) => {
  const notesControl = Array.isArray(controls)
    ? controls.find((c) => c.name === "notes")
    : controls?.notes;
  if (!notesControl) return;

  const tool = {
    name: "t20-calendario-arton",
    title: "Calendário de Arton",
    icon: "fa-solid fa-calendar-days",
    button: true,
    onClick: () => CalendarApp.open(),
    onChange: () => CalendarApp.open()
  };

  if (Array.isArray(notesControl.tools)) {
    notesControl.tools.push(tool);
  } else if (notesControl.tools && typeof notesControl.tools === "object") {
    notesControl.tools[tool.name] = tool;
  }
});
