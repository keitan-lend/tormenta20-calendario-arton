import { MODULE_ID, MONTHS_PER_YEAR } from "../constants.js";
import { MONTHS, SEASONS } from "../calendar-data.js";
import { TimeEngine } from "../time-engine.js";
import { NotesManager } from "../notes-manager.js";
import { NimbManager } from "../nimb-manager.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class CalendarApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instance = null;

  static DEFAULT_OPTIONS = {
    id: "t20-calendario-arton-app",
    tag: "div",
    window: {
      title: "Calendário de Arton",
      icon: "fa-solid fa-calendar-days",
      resizable: true
    },
    position: {
      width: 620,
      height: 640
    },
    actions: {
      prevMonth: CalendarApp._onPrevMonth,
      nextMonth: CalendarApp._onNextMonth,
      today: CalendarApp._onToday,
      selectDay: CalendarApp._onSelectDay,
      addEvent: CalendarApp._onAddEvent,
      editEvent: CalendarApp._onEditEvent,
      deleteEvent: CalendarApp._onDeleteEvent,
      addYearNote: CalendarApp._onAddYearNote,
      editYearNote: CalendarApp._onEditYearNote,
      deleteYearNote: CalendarApp._onDeleteYearNote
    }
  };

  static PARTS = {
    body: { template: `modules/${MODULE_ID}/templates/calendar-app.hbs` }
  };

  constructor(options = {}) {
    super(options);
    const current = TimeEngine.getCurrentDate();
    this._viewYear = current.year;
    this._viewMonth = current.month ?? 1;
    CalendarApp._instance = this;
  }

  static open() {
    if (!this._instance) this._instance = new CalendarApp();
    this._instance.render(true);
    this._instance.bringToFront?.();
  }

  static refresh() {
    this._instance?.render();
  }

  async _prepareContext() {
    const isGM = game.user.isGM;
    const monthData = MONTHS.find((m) => m.id === this._viewMonth);
    const current = TimeEngine.getCurrentDate();

    // Monta a grade de dias do mês visualizado.
    const days = [];
    for (let day = 1; day <= 30; day++) {
      const wt = TimeEngine.getWorldTimeForDate(this._viewYear, this._viewMonth, day);
      const info = TimeEngine.getDateFromWorldTime(wt);
      days.push({
        day,
        weekdayName: info.weekday?.name ?? "",
        isToday: !current.isNimbDay && current.year === this._viewYear && current.month === this._viewMonth && current.day === day,
        events: NotesManager.getRecurringEventsForDay(this._viewMonth, day)
      });
    }

    // Preenche células vazias antes do dia 1, conforme o dia da semana dele.
    const firstDayInfo = TimeEngine.getDateFromWorldTime(
      TimeEngine.getWorldTimeForDate(this._viewYear, this._viewMonth, 1)
    );
    const firstWeekdayIndex = firstDayInfo.weekday?.id ?? 0;
    const leadingBlanks = Array.from({ length: firstWeekdayIndex }, () => null);

    const grid = [...leadingBlanks, ...days];
    const weeks = [];
    for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
    while (weeks.length && weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

    // Dias de Nimb: mostra a faixa se este mês for o mês de inserção.
    const nimbInfo = NimbManager.getNimbInfo(this._viewYear);
    const showNimbBanner = nimbInfo.afterMonth === this._viewMonth;

    return {
      isGM,
      year: this._viewYear,
      monthName: monthData?.name,
      season: SEASONS[monthData?.season],
      weeks,
      showNimbBanner,
      nimbCount: nimbInfo.count,
      currentMoon: current.moon,
      showMoon: game.settings.get(MODULE_ID, "showMoon"),
      currentLabel: TimeEngine.formatDate(current),
      currentTime: TimeEngine.formatTime(current),
      yearNotes: NotesManager.getYearNotesForYear(this._viewYear),
      monthEvents: NotesManager.getRecurringEvents().filter((e) => e.month === this._viewMonth)
    };
  }

  static _onPrevMonth() {
    this._viewMonth -= 1;
    if (this._viewMonth < 1) {
      this._viewMonth = MONTHS_PER_YEAR;
      this._viewYear -= 1;
    }
    this.render();
  }

  static _onNextMonth() {
    this._viewMonth += 1;
    if (this._viewMonth > MONTHS_PER_YEAR) {
      this._viewMonth = 1;
      this._viewYear += 1;
    }
    this.render();
  }

  static _onToday() {
    const current = TimeEngine.getCurrentDate();
    this._viewYear = current.year;
    this._viewMonth = current.month ?? this._viewMonth;
    this.render();
  }

  static _onSelectDay(event, target) {
    if (!game.user.isGM) return;
    const day = Number(target.dataset.day);
    if (!day) return;
    const current = TimeEngine.getCurrentDate();
    const secondsOfDay = current.hour * 3600 + current.minute * 60 + current.second;
    const newWorldTime = TimeEngine.getWorldTimeForDate(this._viewYear, this._viewMonth, day) + secondsOfDay;
    game.time.advance(newWorldTime - game.time.worldTime);
  }

  static async _onAddEvent() {
    if (!game.user.isGM) return;
    const data = await CalendarApp._promptEventForm();
    if (!data) return;
    data.month = this._viewMonth;
    await NotesManager.saveRecurringEvent(data);
    this.render();
  }

  static async _onEditEvent(event, target) {
    if (!game.user.isGM) return;
    const id = target.dataset.id;
    const existing = NotesManager.getRecurringEvents().find((e) => e.id === id);
    if (!existing) return;
    const data = await CalendarApp._promptEventForm(existing);
    if (!data) return;
    await NotesManager.saveRecurringEvent({ ...existing, ...data, id: existing.id });
    this.render();
  }

  static async _onDeleteEvent(event, target) {
    if (!game.user.isGM) return;
    const id = target.dataset.id;
    await NotesManager.deleteRecurringEvent(id);
    this.render();
  }

  static async _onAddYearNote() {
    if (!game.user.isGM) return;
    const data = await CalendarApp._promptYearNoteForm({ year: this._viewYear });
    if (!data) return;
    await NotesManager.saveYearNote(data);
    this.render();
  }

  static async _onEditYearNote(event, target) {
    if (!game.user.isGM) return;
    const id = target.dataset.id;
    const existing = NotesManager.getYearNotes().find((n) => n.id === id);
    if (!existing) return;
    const data = await CalendarApp._promptYearNoteForm(existing);
    if (!data) return;
    await NotesManager.saveYearNote({ ...existing, ...data, id: existing.id });
    this.render();
  }

  static async _onDeleteYearNote(event, target) {
    if (!game.user.isGM) return;
    const id = target.dataset.id;
    await NotesManager.deleteYearNote(id);
    this.render();
  }

  static async _promptEventForm(existing = {}) {
    const content = `
      <form class="t20cal-form">
        <div class="form-group">
          <label>Título</label>
          <input type="text" name="title" value="${existing.title ?? ""}" required />
        </div>
        <div class="form-group">
          <label>Dia do mês (1-30)</label>
          <input type="number" name="day" min="1" max="30" value="${existing.day ?? 1}" required />
        </div>
        <div class="form-group">
          <label>Duração em dias (opcional)</label>
          <input type="number" name="durationDays" min="1" max="30" value="${existing.durationDays ?? 1}" />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="description" rows="4">${existing.description ?? ""}</textarea>
        </div>
      </form>`;

    return foundry.applications.api.DialogV2.wait({
      window: { title: existing.id ? "Editar evento" : "Novo evento" },
      content,
      buttons: [
        {
          action: "save",
          label: "Salvar",
          default: true,
          callback: (ev, button) => {
            const fd = new foundry.applications.ux.FormDataExtended(button.form).object;
            return {
              title: fd.title,
              day: Number(fd.day),
              durationDays: Number(fd.durationDays) || 1,
              description: fd.description
            };
          }
        },
        { action: "cancel", label: "Cancelar" }
      ],
      rejectClose: false
    }).then((result) => (result === "cancel" ? null : result));
  }

  static async _promptYearNoteForm(existing = {}) {
    const content = `
      <form class="t20cal-form">
        <div class="form-group">
          <label>Ano</label>
          <input type="number" name="year" value="${existing.year ?? ""}" required />
        </div>
        <div class="form-group">
          <label>Título</label>
          <input type="text" name="title" value="${existing.title ?? ""}" required />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="description" rows="5">${existing.description ?? ""}</textarea>
        </div>
        <div class="form-group">
          <label>Fonte (opcional)</label>
          <input type="text" name="source" value="${existing.source ?? ""}" />
        </div>
      </form>`;

    return foundry.applications.api.DialogV2.wait({
      window: { title: existing.id ? "Editar nota histórica" : "Nova nota histórica" },
      content,
      buttons: [
        {
          action: "save",
          label: "Salvar",
          default: true,
          callback: (ev, button) => {
            const fd = new foundry.applications.ux.FormDataExtended(button.form).object;
            return {
              year: Number(fd.year),
              title: fd.title,
              description: fd.description,
              source: fd.source
            };
          }
        },
        { action: "cancel", label: "Cancelar" }
      ],
      rejectClose: false
    }).then((result) => (result === "cancel" ? null : result));
  }
}
