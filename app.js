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
    return { start, end, dateKey: isoDate(end), label: `${format(start)} — ${format(end)}`, detail: d.tentative ? `Ориентировочно · ${d.start}–${d.end}-я недели` : d.kind === 'weekWindow' ? `Окно · ${d.start}–${d.end}-я недели` : 'Окно сдачи', window: true };
  }

  const tasks = data.subjects.flatMap((subject) => subject.tasks.map((task) => ({ ...task, subject, resolved: resolveDeadline(task, subject) })));
  const knownIds = new Set(tasks.map((task) => task.id));
  let completed = new Set();
  let storageUsable = true;
  let selectedSubjectId = null;
  const dialog = $('subject-dialog');
  $('subject-select').innerHTML += data.subjects.map((subject) => `<option value="${escape(subject.id)}">${escape(subject.title)}</option>`).join('');
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

  function getState(now, sourceTasks = tasks) {
    const pending = sourceTasks.filter((task) => !completed.has(task.id));
    const upcoming = pending.filter((task) => task.resolved.end && task.resolved.end >= now).sort((a, b) => a.resolved.end - b.resolved.end);
    const dates = [...new Set(upcoming.map((task) => task.resolved.dateKey))];
    return {
      pending,
      overdue: pending.filter((task) => task.resolved.end && task.resolved.end < now && !task.deadline.tentative),
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
      <ul class="card-tasks">${list.map((task) => `<li><a href="#task-${escape(task.id)}" data-open-task="${escape(task.id)}"><span>${escape(task.subject.short)}</span><strong>${escape(task.title)}</strong>${task.deadline.tentative ? '<small>Ориентировочный период · даты уточняются</small>' : task.resolved.window ? '<small>Конец периода сдачи</small>' : ''}</a></li>`).join('')}</ul>`;
  }

  function subjectHTML(subject, index, now, state, inDialog = false) {
    const list = tasks.filter((task) => task.subject.id === subject.id);
    const doneCount = list.filter((task) => completed.has(task.id)).length;
    const nearestIds = new Set(state.nearest.map((task) => task.id));
    const nextIds = new Set(state.next.map((task) => task.id));
    return `<article class="subject"><header class="subject-heading"><span class="subject-number">${String(index + 1).padStart(2, '0')}</span><h3 ${inDialog ? 'id="dialog-subject-title"' : ''}>${inDialog ? escape(subject.title) : `<button type="button" class="subject-open" data-open-subject="${escape(subject.id)}" aria-label="Открыть предмет: ${escape(subject.title)}">${escape(subject.title)}<span class="open-arrow" aria-hidden="true">↗&#xfe0e;</span></button>`}</h3><span class="subject-count">${list.length ? `${doneCount}/${list.length}` : '—'}</span></header>
      ${list.length ? `<ul class="task-list">${list.map((task) => {
        const done = completed.has(task.id);
        const highlight = nearestIds.has(task.id) ? 'nearest' : nextIds.has(task.id) ? 'next' : '';
        const overdue = !done && task.resolved.end && task.resolved.end < now;
        const status = done ? 'Сдано' : highlight === 'nearest' ? 'Ближайший срок' : highlight === 'next' ? 'Следующий срок' : overdue ? (task.deadline.tentative ? 'Ориентировочный период прошёл · даты уточняются' : 'Срок прошёл') : '';
        return `<li class="task ${highlight} ${done ? 'completed' : ''}" id="${inDialog ? 'dialog-' : ''}task-${escape(task.id)}"><label class="task-label">
          <input type="checkbox" data-task-id="${escape(task.id)}" ${done ? 'checked' : ''} aria-label="Сдано: ${escape(subject.short)} — ${escape(task.title)}">
          <span class="task-content"><span class="task-title">${escape(task.title)}</span><span class="task-date">${task.resolved.window ? `<span class="window-mark">${task.deadline.tentative ? 'Ориентир' : 'Период'}</span> ` : ''}${escape(task.resolved.label)}</span><span class="task-detail">${escape(task.resolved.detail)}</span>${task.note ? `<span class="task-note">${escape(task.note)}</span>` : ''}${status ? `<span class="task-status">${status}</span>` : ''}</span>
        </label></li>`;
      }).join('')}</ul>` : '<p class="subject-empty">Работы и сроки пока не добавлены.</p>'}</article>`;
  }

  function renderDialog(now) {
    if (!selectedSubjectId) return;
    const subject = data.subjects.find((item) => item.id === selectedSubjectId);
    const list = tasks.filter((task) => task.subject.id === subject.id);
    const scrollTop = dialog.scrollTop;
    $('dialog-subject-content').innerHTML = subjectHTML(subject, data.subjects.indexOf(subject), now, getState(now, list), true);
    dialog.scrollTop = scrollTop;
  }

  function openSubject(id, taskId) {
    if (!data.subjects.some((subject) => subject.id === id)) return;
    selectedSubjectId = id;
    $('subject-select').value = id;
    renderDialog(new Date());
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('dialog-open');
    dialog.scrollTop = 0;
    if (taskId) dialog.querySelector(`[data-task-id="${taskId}"]`)?.focus();
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
    const focused = document.activeElement?.dataset?.taskId;
    $('subjects').innerHTML = data.subjects.map((subject, index) => subjectHTML(subject, index, now, state)).join('');
    renderDialog(now);
    if (focused) (dialog.open ? dialog : $('subjects')).querySelector(`[data-task-id="${focused}"]`)?.focus({ preventScroll: true });
    storageNotice();
  }

  function changeProgress(event) {
    const id = event.target.dataset.taskId;
    if (!knownIds.has(id)) return;
    if (event.target.checked) completed.add(id); else completed.delete(id);
    try { localStorage.setItem(storageKey, JSON.stringify([...completed])); storageUsable = true; }
    catch { storageUsable = false; }
    const task = tasks.find((item) => item.id === id);
    render();
    $('announcement').textContent = `${task.title}: ${completed.has(id) ? 'сдано' : 'отметка снята'}. Ближайшие сроки обновлены.`;
  }
  $('subjects').addEventListener('change', changeProgress);
  $('dialog-subject-content').addEventListener('change', changeProgress);
  $('subject-select').addEventListener('change', (event) => openSubject(event.target.value));
  $('close-subject').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    // Событие close может прийти уже после открытия следующего предмета.
    if (dialog.open) return;
    selectedSubjectId = null;
    $('subject-select').value = '';
    $('dialog-subject-content').innerHTML = '';
    document.body.classList.remove('dialog-open');
  });
  document.addEventListener('click', (event) => {
    const subjectButton = event.target.closest('[data-open-subject]');
    if (subjectButton) openSubject(subjectButton.dataset.openSubject);
    const taskLink = event.target.closest('[data-open-task]');
    if (taskLink) {
      event.preventDefault();
      const task = tasks.find((item) => item.id === taskLink.dataset.openTask);
      if (task) openSubject(task.subject.id, task.id);
    }
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) { completed = new Set(); readProgress(); render(); }
  });
  // Обновляет переход суток и окончание пары, пока вкладка открыта.
  setInterval(render, 30000);
  window.addEventListener('focus', render);
  render();
})();
