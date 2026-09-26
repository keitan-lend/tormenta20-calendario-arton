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

  /**
   * Hook do ApplicationV2 chamado só na primeira renderização.
   * Aqui definimos a posição: usa a salva nas settings (client scope) ou,
   * se não houver / estiver fora da tela, vai para o canto superior direito.
   */
  /** Borda esquerda da sidebar do Foundry (nunca deixa o widget passar dela). */
  static _sidebarLeftEdge() {
    const el = document.querySelector("#sidebar") ?? document.querySelector("#ui-right");
    if (!el) return window.innerWidth;
    return el.getBoundingClientRect().left;
  }

  _onFirstRender(context, options) {
    super._onFirstRender?.(context, options);

    const widgetWidth = 260;
    const margin = 12;
    const sidebarLeft = MiniWidget._sidebarLeftEdge();

    const defaultPos = {
      left: Math.max(20, sidebarLeft - widgetWidth - margin),
      top: 70
    };

    const saved = game.settings.get(MODULE_ID, "widgetPosition");
    let pos = saved;
    let needsSave = false;

    const invalid = !pos
      || typeof pos.left !== "number"
      || typeof pos.top !== "number"
      || pos.left < 0 || pos.left > sidebarLeft - 40
      || pos.top < 0 || pos.top > window.innerHeight - 40;

    if (invalid) {
      pos = defaultPos;
      needsSave = true;
    }

    this.setPosition({ left: pos.left, top: pos.top });

    if (needsSave) {
      game.settings.set(MODULE_ID, "widgetPosition", pos).catch(() => {});
    }
  }

  async _prepareContext() {
    const isGM = game.user.isGM;
    const collapsed = game.settings.get(MODULE_ID, "widgetCollapsed");

    if (!isGM && CalendarApp._isHiddenFromMe()) {
      return { isGM: false, collapsed, blinded: true };
    }

    const date = TimeEngine.getCurrentDate();
    const nimb = TimeEngine.getNimbInfoForYear(date.year);
    return {
      date,
      dateLabel: TimeEngine.formatDate(date),
      timeLabel: TimeEngine.formatTime(date),
      nimbCount: nimb.count,
      isGM,
      collapsed
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);

    const root = this.element;
    if (!root) return;
    const handle = root.querySelector(".t20cal-mini__header") ?? root.querySelector(".t20cal-mini__tab");
    if (!handle) return;
    if (handle.dataset.t20calDragBound === "1") return;
    handle.dataset.t20calDragBound = "1";

    handle.style.cursor = "grab";

    handle.addEventListener("pointerdown", (ev) => {
      if (ev.button !== 0) return;
      // Só arrasta pelo cabeçalho (a área de título) e pelo botão-tab
      // (estado recolhido). Se o clique foi num botão/ação dentro do
      // header (ex: X de fechar), NÃO inicia drag — deixa o clique passar.
      if (handle.classList.contains("t20cal-mini__header")
          && ev.target.closest("[data-action]")) {
        return;
      }

      const startX = ev.clientX;
      const startY = ev.clientY;
      const startLeft = this.position.left ?? 0;
      const startTop = this.position.top ?? 0;
      const maxLeft = MiniWidget._sidebarLeftEdge() - 40;
      let dragging = false;

      const onMove = (mv) => {
        const dx = mv.clientX - startX;
        const dy = mv.clientY - startY;

        // Threshold de 5px: só considera "drag" depois disso, para não
        // interferir com cliques simples no botão-tab recolhido.
        if (!dragging && Math.hypot(dx, dy) < 5) return;
        if (!dragging) {
          dragging = true;
          handle.style.cursor = "grabbing";
        }

        // Nunca deixa arrastar pra trás/embaixo da sidebar do Foundry.
        const left = Math.max(0, Math.min(maxLeft, startLeft + dx));
        const top = Math.max(0, Math.min(window.innerHeight - 40, startTop + dy));
        this.setPosition({ left, top });
      };

      const onUp = async () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        handle.style.cursor = "grab";
        if (!dragging) return;
        try {
          await game.settings.set(MODULE_ID, "widgetPosition", {
            left: this.position.left,
            top: this.position.top
          });
        } catch (err) {
          console.error(`${MODULE_ID} | Falha ao salvar posição do widget`, err);
        }
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    });
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

  /** Alterna exibição (chamado pelo botão dos scene controls e pelo /t20cal). */
  static async toggle() {
    const visible = game.settings.get(MODULE_ID, "widgetVisible");
    const next = !visible;
    await game.settings.set(MODULE_ID, "widgetVisible", next);
    if (next) {
      if (!this._instance) this._instance = new MiniWidget();
      this._instance.render({ force: true });
    } else {
      this._instance?.close();
      this._instance = null;
    }
  }
}