import { MODULE_ID } from "../constants.js";
import { TimeEngine } from "../time-engine.js";
import { CalendarApp } from "./calendar-app.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class MiniWidget extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instance = null;

  static DEFAULT_OPTIONS = {
    id: "t20-calendario-mini",
    tag: "div",
    window: {
      frame: false,
      positioned: true
    },
    position: {
      width: 240,
      height: "auto"
    },
    actions: {
      toggleCollapse: MiniWidget._onToggleCollapse,
      openCalendar: MiniWidget._onOpenCalendar,
      advance: MiniWidget._onAdvance
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/mini-widget.hbs` }
  };

  constructor(options = {}) {
    super(options);
    MiniWidget._instance = this;
  }

  async _prepareContext() {
    const date = TimeEngine.getCurrentDate();
    const nimb = TimeEngine.getNimbInfoForYear(date.year);
    return {
      date,
      dateLabel: TimeEngine.formatDate(date),
      timeLabel: TimeEngine.formatTime(date),
      nimbCount: nimb.count,
      isGM: game.user.isGM,
      collapsed: game.settings.get(MODULE_ID, "widgetCollapsed")
    };
  }

  static _onToggleCollapse() {
    const collapsed = game.settings.get(MODULE_ID, "widgetCollapsed");
    game.settings.set(MODULE_ID, "widgetCollapsed", !collapsed);
    this.render();
  }

  static _onOpenCalendar(event) {
    event.preventDefault();
    CalendarApp.open();
  }

  static _onAdvance(event, target) {
    event.preventDefault();
    if (!game.user.isGM) return;
    const amount = Number(target?.dataset.amount ?? 0);
    if (amount) game.time.advance(amount);
  }

  static refresh() {
    this._instance?.render();
  }
}
