import { MODULE_ID } from "./constants.js";
import { registerSettings } from "./settings.js";
import { NimbManager } from "./nimb-manager.js";
import { NotesManager } from "./notes-manager.js";
import { registerAPI } from "./api.js";
import { MiniWidget } from "./widgets/mini-widget.js";
import { CalendarApp } from "./widgets/calendar-app.js";
import { TimeEngine } from "./time-engine.js";

Hooks.once("init", () => {
  registerSettings();
  console.log(`${MODULE_ID} | Inicializado`);
});

Hooks.once("ready", async () => {
  NimbManager.init();
  NotesManager.init();
  registerAPI();

  // Registra o comando /t20cal cobrindo as APIs conhecidas (v13/v14).
  try {
    const def = {
      name: "t20cal",
      module: MODULE_ID,
      aliases: ["calendarioarton", "calarton"],
      icon: "fa-solid fa-calendar-days",
      description: "Abre/fecha o calendário de Arton.",
      callback: async (args) => {
        const sub = (args || "").trim().toLowerCase();
        if (sub === "reset") { await window.t20cal.show(); return; }
        await MiniWidget.toggle();
      }
    };
    if (game.chat?.registerCommand) game.chat.registerCommand(def);
    else if (CONFIG?.ChatMessage?.commands?.register) CONFIG.ChatMessage.commands.register(def.name, def);
    else if (CONFIG?.ChatMessage?.commands) CONFIG.ChatMessage.commands[def.name] = def;
  } catch (err) {
    console.warn(`${MODULE_ID} | Falha ao registrar /t20cal`, err);
  }

  if (game.user.isGM && !game.settings.get(MODULE_ID, "epoch")) {
    const year = game.settings.get(MODULE_ID, "defaultStartingYear");
    const hour = game.settings.get(MODULE_ID, "defaultHour");
    const minute = game.settings.get(MODULE_ID, "defaultMinute");
    const dayStart = Math.floor(game.time.worldTime / 86400) * 86400;
    try {
      await game.settings.set(MODULE_ID, "epoch", { worldTime: dayStart, year, month: 1, day: 1 });
      await TimeEngine.setTimeOfDay(hour, minute);
    } catch (err) {
      console.error(`${MODULE_ID} | Falha na calibração inicial`, err);
    }
  }

  if (game.settings.get(MODULE_ID, "widgetVisible")) {
    const widget = new MiniWidget();
    widget.render({ force: true });
  }

  console.log(`${MODULE_ID} | Pronto`);
});

Hooks.on("updateWorldTime", () => {
  MiniWidget.refresh();
  CalendarApp.refresh();
});

/**
 * Botão nos scene controls (barra lateral de ícones) pra abrir/fechar o
 * mini calendário. Compatível com v13/v14 (controls como objeto).
 */
Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControl = Array.isArray(controls)
    ? controls.find((c) => c.name === "token")
    : (controls.token ?? controls.tokens);
  if (!tokenControl) return;

  if (Array.isArray(tokenControl.tools)) {
    const toolsObj = {};
    for (const t of tokenControl.tools) toolsObj[t.name] = t;
    tokenControl.tools = toolsObj;
  }
  if (!tokenControl.tools) return;

  tokenControl.tools["tormenta20-calendario"] = {
    name: "tormenta20-calendario",
    title: "Mostrar/ocultar Calendário de Arton",
    icon: "fa-solid fa-calendar-days",
    button: true,
    visible: true,
    onChange: () => MiniWidget.toggle()
  };
});

// Plano B universal: função no escopo global pra abrir/reposicionar via console (F12).
window.t20cal = {
  show: async () => {
    await game.settings.set(MODULE_ID, "widgetVisible", true);
    await game.settings.set(MODULE_ID, "widgetCollapsed", false);
    await game.settings.set(MODULE_ID, "widgetPosition", {
      left: Math.max(20, window.innerWidth - 260),
      top: 70
    });
    if (MiniWidget._instance) {
      MiniWidget._instance.close();
      MiniWidget._instance = null;
    }
    const w = new MiniWidget();
    await w.render({ force: true });
    console.log("[t20cal] Widget exibido.");
  },
  hide: () => {
    MiniWidget._instance?.close();
    MiniWidget._instance = null;
    console.log("[t20cal] Widget fechado.");
  },
  openCalendar: () => CalendarApp.open(),
  widget: () => MiniWidget._instance
};