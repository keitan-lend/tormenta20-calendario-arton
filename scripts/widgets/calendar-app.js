import { MODULE_ID, MONTHS_PER_YEAR } from "../constants.js";
import { MONTHS, SEASONS } from "../calendar-data.js";
import { TimeEngine } from "../time-engine.js";
import { NotesManager } from "../notes-manager.js";
import { NimbManager } from "../nimb-manager.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export class CalendarApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static _instance = null;

  static DEFAULT_OPTIONS = {
    id: "t20-calendario-arton-app",
    tag: "div",
    window: {
      title: "Calendário de Arton",
      icon: "fa-solid fa-calendar-days",
      resizable: true,
      minimizable: true
    },
    position: { width: 640, height: 720 },
    actions: {
      prevMonth: CalendarApp._onPrevMonth,
      nextMonth: CalendarApp._onNextMonth,
      today: CalendarApp._onToday,
      selectDay: CalendarApp._onSelectDay,
      selectNimbDay: CalendarApp._onSelectNimbDay,
      addEvent: CalendarApp._onAddEvent,
      editEvent: CalendarApp._onEditEvent,
      deleteEvent: CalendarApp._onDeleteEvent,
      addYearNote: CalendarApp._onAddYearNote,
      editYearNote: CalendarApp._onEditYearNote,
      deleteYearNote: CalendarApp._onDeleteYearNote,
      calibrateDate: CalendarApp._onCalibrateDate,
      setTimeOfDay: CalendarApp._onSetTimeOfDay,
      advanceForward: CalendarApp._onAdvanceForward,
      advanceBackward: CalendarApp._onAdvanceBackward,
      rerollNimb: CalendarApp._onRerollNimb
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
    this._instance.render({ force: true });
    this._instance.bringToFront?.();
  }

  static refresh() {
    this._instance?.render();
  }

  async _prepareContext() {
    const isGM = game.user.isGM;
    const monthData = MONTHS.find((m) => m.id === this._viewMonth);
    const current = TimeEngine.getCurrentDate();

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

    const firstDayInfo = TimeEngine.getDateFromWorldTime(
      TimeEngine.getWorldTimeForDate(this._viewYear, this._viewMonth, 1)
    );
    const firstWeekdayIndex = firstDayInfo.weekday?.id ?? 0;
    const leadingBlanks = Array.from({ length: firstWeekdayIndex }, () => null);
    const grid = [...leadingBlanks, ...days];
    const weeks = [];
    for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7));
    while (weeks.length && weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

    // Nimb dias deste mês (só exibe se o ano já foi revelado).
    const nimbRevealed = this._viewYear <= current.year;
    const nimb = NimbManager.getNimbInfo(this._viewYear);
    const beforeCount = nimb.afterMonths.filter((m) => m < this._viewMonth).length;
    const thisMonthCount = nimb.afterMonths.filter((m) => m === this._viewMonth).length;
    const monthNimbDays = nimbRevealed
      ? Array.from({ length: thisMonthCount }, (_, i) => ({ index: beforeCount + i + 1 }))
      : [];

    const months = MONTHS.map((m) => ({
      ...m,
      numberedName: `${m.id} - ${m.name}`,
      selected: m.id === this._viewMonth
    }));

    return {
      isGM,
      months,
      year: this._viewYear,
      monthName: monthData?.name,
      monthNumberedName: monthData ? `${monthData.id} - ${monthData.name}` : null,
      season: SEASONS[monthData?.season],
      weeks,
      nimbRevealed,
      nimbCount: nimb.count,
      monthNimbDays,
      currentMoon: current.moon,
      showMoon: game.settings.get(MODULE_ID, "showMoon"),
      currentLabel: TimeEngine.formatDate(current),
      currentTime: TimeEngine.formatTime(current),
      currentYear: current.year,
      currentYearNimbCount: TimeEngine.getNimbInfoForYear(current.year).count,
      currentHour: current.hour,
      currentMinute: current.minute,
      yearNotes: NotesManager.getYearNotesForYear(this._viewYear),
      monthEvents: NotesManager.getRecurringEvents().filter((e) => e.month === this._viewMonth)
    };
  }

  static _onPrevMonth() {
    this._viewMonth -= 1;
    if (this._viewMonth < 1) { this._viewMonth = MONTHS_PER_YEAR; this._viewYear -= 1; }
    this.render();
  }

  static _onNextMonth() {
    this._viewMonth += 1;
    if (this._viewMonth > MONTHS_PER_YEAR) { this._viewMonth = 1; this._viewYear += 1; }
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

  static _onSelectNimbDay(event, target) {
    if (!game.user.isGM) return;
    const index = Number(target.dataset.index);
    if (!index) return;
    const base = TimeEngine.getWorldTimeForNimbDay(this._viewYear, index);
    if (base == null) return;
    const current = TimeEngine.getCurrentDate();
    const secondsOfDay = current.hour * 3600 + current.minute * 60 + current.second;
    game.time.advance(base + secondsOfDay - game.time.worldTime);
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
    event?.preventDefault?.(); event?.stopPropagation?.();
    const id = target.dataset.id;
    const existing = NotesManager.getRecurringEvents().find((e) => e.id === id);
    if (!existing) return;
    if (existing.builtin) {
      ui.notifications?.info("Datas padrão do Livro Básico não podem ser excluídas (podem ser editadas).");
      return;
    }
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Excluir evento" },
      content: `<p>Excluir o evento <strong>${esc(existing.title)}</strong>? Esta ação não pode ser desfeita.</p>`
    });
    if (!confirmed) return;
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
    event?.preventDefault?.(); event?.stopPropagation?.();
    const id = target.dataset.id;
    const existing = NotesManager.getYearNotes().find((n) => n.id === id);
    if (!existing) return;
    if (existing.builtin) {
      ui.notifications?.info("Crônicas oficiais não podem ser excluídas (podem ser editadas).");
      return;
    }
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Excluir crônica" },
      content: `<p>Excluir a crônica <strong>${esc(existing.title)}</strong>? Esta ação não pode ser desfeita.</p>`
    });
    if (!confirmed) return;
    await NotesManager.deleteYearNote(id);
    this.render();
  }

  static async _onRerollNimb() {
    if (!game.user.isGM) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Rerrolar Dias de Nimb" },
      content: `<p>Sortear novamente os Dias de Nimb do ano <strong>${this._viewYear}</strong>? Isso muda a duração e a posição deles.</p>`
    });
    if (!confirmed) return;
    await NimbManager.regenerate(this._viewYear);
    this.render();
  }

  static async _onCalibrateDate(event, target) {
    if (!game.user.isGM) return;
    const row = target.closest(".t20cal-tool-row");
    const year = Number(row.querySelector('[name="calYear"]').value);
    const month = Number(row.querySelector('[name="calMonth"]').value);
    const day = Number(row.querySelector('[name="calDay"]').value);
    if (!year || !month || !day) return;
    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Calibrar data atual" },
      content: `<p>Isso vai definir que <strong>agora</strong> é ${day} de ${MONTHS.find((m) => m.id === month)?.name} de ${year}. Todo o resto do calendário (passado e futuro) se ajusta a partir disso. Confirmar?</p>`
    });
    if (!confirmed) return;
    await TimeEngine.calibrateEpoch(year, month, day);
    this._viewYear = year;
    this._viewMonth = month;
    this.render();
  }

  static async _onSetTimeOfDay(event, target) {
    if (!game.user.isGM) return;
    const row = target.closest(".t20cal-tool-row");
    const hour = Number(row.querySelector('[name="setHour"]').value);
    const minute = Number(row.querySelector('[name="setMinute"]').value);
    if (Number.isNaN(hour) || Number.isNaN(minute)) return;
    await TimeEngine.setTimeOfDay(hour, minute);
    this.render();
  }

  static async _onAdvanceForward(event, target) { await CalendarApp._advanceFromRow(target, 1); this.render(); }
  static async _onAdvanceBackward(event, target) { await CalendarApp._advanceFromRow(target, -1); this.render(); }

  static async _advanceFromRow(target, sign) {
    if (!game.user.isGM) return;
    const row = target.closest(".t20cal-tool-row");
    const amount = Number(row.querySelector('[name="advanceAmount"]').value);
    const unit = row.querySelector('[name="advanceUnit"]').value;
    if (!amount) return;
    await TimeEngine.advanceBy(amount * sign, unit);
  }

  static _readFormData(button) {
    const form = button.form
      ?? button.closest("dialog")?.querySelector("form")
      ?? document.querySelector("dialog[open] form");
    if (!form) return null;
    return new foundry.applications.ux.FormDataExtended(form).object;
  }

  static async _promptEventForm(existing = {}) {
    const content = `
      <form class="t20cal-form">
        <div class="form-group">
          <label>Título</label>
          <input type="text" name="title" value="${esc(existing.title ?? "")}" required />
        </div>
        <div class="form-group">
          <label>Dia do mês (1-30)</label>
          <input type="number" name="day" min="1" max="30" value="${esc(existing.day ?? 1)}" required />
        </div>
        <div class="form-group">
          <label>Duração em dias (opcional)</label>
          <input type="number" name="durationDays" min="1" max="30" value="${esc(existing.durationDays ?? 1)}" />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="description" rows="4">${esc(existing.description ?? "")}</textarea>
        </div>
      </form>`;

    return foundry.applications.api.DialogV2.wait({
      window: { title: existing.id ? "Editar evento" : "Novo evento" },
      content,
      buttons: [
        {
          action: "save", label: "Salvar", default: true,
          callback: (ev, button) => {
            const fd = CalendarApp._readFormData(button);
            if (!fd) return null;
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
    }).then((r) => (r === "cancel" || !r ? null : r));
  }

  static async _promptYearNoteForm(existing = {}) {
    const content = `
      <form class="t20cal-form">
        <div class="form-group">
          <label>Ano</label>
          <input type="number" name="year" value="${esc(existing.year ?? "")}" required />
        </div>
        <div class="form-group">
          <label>Título</label>
          <input type="text" name="title" value="${esc(existing.title ?? "")}" required />
        </div>
        <div class="form-group">
          <label>Descrição</label>
          <textarea name="description" rows="5">${esc(existing.description ?? "")}</textarea>
        </div>
        <div class="form-group">
          <label>Fonte (opcional)</label>
          <input type="text" name="source" value="${esc(existing.source ?? "")}" />
        </div>
      </form>`;

    return foundry.applications.api.DialogV2.wait({
      window: { title: existing.id ? "Editar nota histórica" : "Nova nota histórica" },
      content,
      buttons: [
        {
          action: "save", label: "Salvar", default: true,
          callback: (ev, button) => {
            const fd = CalendarApp._readFormData(button);
            if (!fd) return null;
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
    }).then((r) => (r === "cancel" || !r ? null : r));
  }
}