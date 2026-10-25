(() => {
  'use strict';
  const data = window.DEADLINE_DATA;
  const storageKey = 'ikbo-16-25.deadlines.completed.v1';
  const $ = (id) => document.getElementById(id);
  const dateFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
  const weekdays = ['', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
  const localDate = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
  const weekStart = (week) => addDays(localDate(data.weekAnchor), (week - 1) * 7);
  const endOfDay = (date) => { const result = new Date(date); result.setHours(23, 59, 59, 999); return result; };
  const plural = (n, words) => words[n % 100 >= 11 && n % 100 <= 14 ? 2 : n % 10 === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 ? 1 : 2];
  const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const format = (date) => dateFormat.format(date);

  function resolveDeadline(task, subject) {
    const d = task.deadline;
    if (d.kind === 'semester') return { end: null, dateKey: null, label: 'До конца семестра', detail: 'Точная дата уточняется', window: false };
    if (d.kind === 'weeks') {
      const end = addDays(weekStart(d.end), subject.schedule.weekday - 1);
      const [hours, minutes] = data.lessonEnds[subject.schedule.lesson].split(':').map(Number);
      end.setHours(hours, minutes, 0, 0);
      return { end, dateKey: isoDate(end), label: format(end), detail: `${d.start}–${d.end}-я недели · ${weekdays[subject.schedule.weekday]}, ${subject.schedule.lesson}-я пара, до ${data.lessonEnds[subject.schedule.lesson]}`, window: false };
    }
    if (d.kind === 'date') {
      const end = endOfDay(localDate(d.date));
      return { end, dateKey: d.date, label: format(end), detail: 'Точная дата', window: false };
    }
    const start = d.kind === 'weekWindow' ? weekStart(d.start) : localDate(d.start);
    const end = endOfDay(d.kind === 'weekWindow' ? addDays(weekStart(d.end), 6) : localDate(d.end));
    return { start, end, dateKey: isoDate(end), label: `${format(start)} — ${format(end)}`, detail: d.kind === 'weekWindow' ? `Окно · ${d.start}–${d.end}-я недели` : 'Окно сдачи', window: true };
  }

  const tasks = data.subjects.flatMap((subject) => subject.tasks.map((task) => ({ ...task, subject, resolved: resolveDeadline(task, subject) })));
  const knownIds = new Set(tasks.map((task) => task.id));
  let completed = new Set();
  let storageUsable = true;
  function readProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      completed = new Set(Array.isArray(saved) ? saved.filter((id) => knownIds.has(id)) : []);
    } catch { storageUsable = false; }
  }
  function storageNotice() {
    $('storage-warning').hidden = storageUsable;
    $('storage-warning').textContent = 'Браузер не разрешает сохранять отметки. Сейчас они действуют только до закрытия страницы.';
  }
  readProgress();

  function getState(now) {
    const pending = tasks.filter((task) => !completed.has(task.id));
    const upcoming = pending.filter((task) => task.resolved.end && task.resolved.end >= now).sort((a, b) => a.resolved.end - b.resolved.end);
    const dates = [...new Set(upcoming.map((task) => task.resolved.dateKey))];
    return {
      pending,
      overdue: pending.filter((task) => task.resolved.end && task.resolved.end < now),
      undated: pending.filter((task) => !task.resolved.end),
      nearest: upcoming.filter((task) => task.resolved.dateKey === dates[0]),
      next: upcoming.filter((task) => task.resolved.dateKey === dates[1])
    };
  }

  function remainingLabel(date, now) {
    // Календарные сутки через UTC-компоненты: устойчиво к переходам часового пояса.
    const days = Math.round((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000);
    return days === 0 ? 'Сегодня' : days === 1 ? 'Завтра' : `Через ${days} ${plural(days, ['день', 'дня', 'дней'])}`;
  }

  function renderCard(id, label, list, now, state) {
    const card = $(id);
    if (!list.length) {
      let message = 'Следующий срок пока не указан.';
      if (id === 'nearest') message = state.pending.length === 0 ? 'Все работы сданы' : 'Предстоящих дедлайнов нет';
      const details = id === 'nearest' && state.pending.length ? 'Проверь работы с прошедшим сроком и задания без точной даты ниже.' : 'Новые сроки появятся после обновления данных.';
      card.innerHTML = `<span class="card-label">${label}</span><h2 class="empty-title">${message}</h2><p class="empty-description">${details}</p>`;
      return;
    }
    card.innerHTML = `<div class="card-top"><span class="card-label">${label}</span><span class="countdown">${remainingLabel(list[0].resolved.end, now)}</span></div>
      <h2 class="deadline-date">${format(list[0].resolved.end)}</h2><p class="deadline-weekday">${weekdayFormat.format(list[0].resolved.end)}</p>
      <ul class="card-tasks">${list.map((task) => `<li><a href="#task-${escape(task.id)}"><span>${escape(task.subject.short)}</span><strong>${escape(task.title)}</strong>${task.resolved.window ? '<small>Закрывается окно сдачи</small>' : ''}</a></li>`).join('')}</ul>`;
  }

  function render() {
    const now = new Date();
    const state = getState(now);
    $('today').dateTime = isoDate(now);
    $('today').textContent = format(now);
    const anchor = localDate(data.weekAnchor);
    const week = Math.floor((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate())) / (7 * 86400000)) + 1;
    $('week').textContent = now < localDate(data.studyStart) ? 'До начала семестра' : week <= 16 ? `${week}-я учебная неделя` : 'После 16-й учебной недели';
    $('progress-count').textContent = `${completed.size} / ${tasks.length}`;
    $('progress-caption').textContent = 'работ сдано';
    $('remaining').textContent = `Осталось ${state.pending.length}`;
    const percent = Math.round(completed.size / tasks.length * 100);
    $('progress-fill').style.width = `${percent}%`;
    document.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', percent);
    renderCard('nearest', 'Ближайший срок', state.nearest, now, state);
    renderCard('next', 'После него', state.next, now, state);
    $('overdue-note').hidden = state.overdue.length === 0;
    $('overdue-note').textContent = `У ${state.overdue.length} ${plural(state.overdue.length, ['несданной работы', 'несданных работ', 'несданных работ'])} срок уже прошёл. Они остаются в списке предметов ниже.`;
    const nearestIds = new Set(state.nearest.map((task) => task.id));
    const nextIds = new Set(state.next.map((task) => task.id));
    const focused = document.activeElement?.dataset?.taskId;
    $('subjects').innerHTML = data.subjects.map((subject, index) => {
      const list = tasks.filter((task) => task.subject.id === subject.id);
      const doneCount = list.filter((task) => completed.has(task.id)).length;
      return `<article class="subject"><header class="subject-heading"><span class="subject-number">${String(index + 1).padStart(2, '0')}</span><h3>${escape(subject.title)}</h3><span class="subject-count">${list.length ? `${doneCount}/${list.length}` : '—'}</span></header>
        ${list.length ? `<ul class="task-list">${list.map((task) => {
          const done = completed.has(task.id);
          const highlight = nearestIds.has(task.id) ? 'nearest' : nextIds.has(task.id) ? 'next' : '';
          const overdue = !done && task.resolved.end && task.resolved.end < now;
          const status = done ? 'Сдано' : highlight === 'nearest' ? 'Ближайший срок' : highlight === 'next' ? 'Следующий срок' : overdue ? 'Срок прошёл' : '';
          return `<li class="task ${highlight} ${done ? 'completed' : ''}" id="task-${escape(task.id)}"><label class="task-label">
            <input type="checkbox" data-task-id="${escape(task.id)}" ${done ? 'checked' : ''} aria-label="Сдано: ${escape(subject.short)} — ${escape(task.title)}">
            <span class="task-content"><span class="task-title">${escape(task.title)}</span><span class="task-date">${task.resolved.window ? '<span class="window-mark">Период</span> ' : ''}${escape(task.resolved.label)}</span><span class="task-detail">${escape(task.resolved.detail)}</span>${task.note ? `<span class="task-note">${escape(task.note)}</span>` : ''}${status ? `<span class="task-status">${status}</span>` : ''}</span>
          </label></li>`;
        }).join('')}</ul>` : '<p class="subject-empty">Работы и сроки пока не добавлены.</p>'}</article>`;
    }).join('');
    if (focused) document.querySelector(`[data-task-id="${focused}"]`)?.focus({ preventScroll: true });
    storageNotice();
  }

  $('subjects').addEventListener('change', (event) => {
    const id = event.target.dataset.taskId;
    if (!knownIds.has(id)) return;
    if (event.target.checked) completed.add(id); else completed.delete(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...completed])); storageUsable = true; }
    catch { storageUsable = false; }
    const task = tasks.find((item) => item.id === id);
    render();
    $('announcement').textContent = `${task.title}: ${completed.has(id) ? 'сдано' : 'отметка снята'}. Ближайшие сроки обновлены.`;
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) { completed = new Set(); readProgress(); render(); }
  });
  // Обновляет переход суток и окончание пары, пока вкладка открыта.
  setInterval(render, 30000);
  window.addEventListener('focus', render);
  render();
})();
