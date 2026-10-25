// Все предметы и сроки редактируются здесь. id сохраняйте при изменении названия:
// к нему привязаны отметки localStorage. Даты: YYYY-MM-DD.
// weeks — занятие в последней неделе; window — включительное окно дат;
// weekWindow — окно учебных недель; date — точная дата; semester — дата неизвестна.
window.DEADLINE_DATA = {
  group: 'ИКБО-16-25',
  // Понедельник календарной недели, в которой началось обучение 01.09.2026.
  weekAnchor: '2026-08-31',
  studyStart: '2026-09-01',
  lessonEnds: { 1: '10:30', 2: '12:10', 3: '14:10', 4: '15:50', 5: '17:50', 6: '19:30' },
  subjects: [
    {
      id: 'architecture', title: 'Архитектура вычислительных машин', short: 'Архитектура',
      schedule: { weekday: 4, lesson: 3 },
      tasks: [
        { id: 'arch-block-1', title: 'Практические · блок 1', type: 'practice', deadline: { kind: 'weeks', start: 3, end: 6 } },
        { id: 'arch-block-2', title: 'Практические · блок 2', type: 'practice', deadline: { kind: 'weeks', start: 7, end: 9 } },
        { id: 'arch-block-3', title: 'Практические · блок 3', type: 'practice', deadline: { kind: 'weeks', start: 9, end: 12 } },
        { id: 'arch-block-4', title: 'Практические · блок 4', type: 'practice', deadline: { kind: 'weeks', start: 13, end: 16 } }
      ]
    },
    { id: 'configuration', title: 'Конфигурационное управление', short: 'Конфигурационное управление', tasks: [] },
    {
      id: 'administration', title: 'Настройка и администрирование сервисного программного обеспечения', short: 'Администрирование',
      schedule: { weekday: 1, lesson: 1 },
      tasks: [
        { id: 'admin-practice-1', title: 'Практическая работа 1', type: 'practice', deadline: { kind: 'weeks', start: 3, end: 6 } },
        { id: 'admin-practice-2', title: 'Практическая работа 2', type: 'practice', deadline: { kind: 'weeks', start: 7, end: 9 } },
        { id: 'admin-practice-3', title: 'Практическая работа 3', type: 'practice', deadline: { kind: 'weeks', start: 10, end: 12 } },
        { id: 'admin-practice-4', title: 'Практическая работа 4', type: 'practice', deadline: { kind: 'weeks', start: 13, end: 15 } },
        { id: 'admin-test', title: 'Тестирование', type: 'test', note: 'Тест откроют в один из дней примерно на 15–16-й неделях. Это ориентир, а не подтверждённые даты доступа.', deadline: { kind: 'weekWindow', start: 15, end: 16, tentative: true } },
        { id: 'admin-coursework', title: 'Курсовая работа', type: 'coursework', deadline: { kind: 'semester' } }
      ]
    },
    {
      id: 'java', title: 'Программирование на языке Java', short: 'Java',
      schedule: { weekday: 2, lesson: 2 },
      tasks: [
        ...Array.from({ length: 7 }, (_, i) => ({
          id: `java-practice-${i + 1}`, title: `Практическая работа ${i + 1}`, type: 'practice',
          deadline: { kind: 'weeks', start: 3 + i * 2, end: 4 + i * 2 }
        })),
        { id: 'java-test', title: 'Аудиторное контрольное тестирование', type: 'test', note: 'СДО · 13–14-я учебные недели.', deadline: { kind: 'weekWindow', start: 13, end: 14 } }
      ]
    },
    {
      id: 'ai', title: 'Системы искусственного интеллекта и большие данные', short: 'ИИ и большие данные',
      schedule: { weekday: 5, lesson: 5 },
      tasks: [
        { id: 'ai-block-1', title: 'Блок заданий 1', type: 'practice', deadline: { kind: 'date', date: '2026-10-30' } },
        { id: 'ai-block-2', title: 'Блок заданий 2', type: 'practice', deadline: { kind: 'date', date: '2026-10-30' } },
        { id: 'ai-block-3', title: 'Блок заданий 3', type: 'practice', deadline: { kind: 'semester' } },
        { id: 'ai-block-4', title: 'Блок заданий 4', type: 'practice', deadline: { kind: 'semester' } },
        { id: 'ai-test-1', title: 'Контрольный тест 1', type: 'test', deadline: { kind: 'window', start: '2026-11-09', end: '2026-11-21' } },
        { id: 'ai-test-2', title: 'Контрольный тест 2', type: 'test', deadline: { kind: 'window', start: '2026-12-07', end: '2026-12-19' } }
      ]
    },
    {
      id: 'algorithms', title: 'Структуры и алгоритмы обработки данных', short: 'Структуры и алгоритмы',
      schedule: { weekday: 4, lesson: 4 },
      tasks: [
        { id: 'alg-practice-1', title: 'Практическая работа 1 (5)', type: 'practice', deadline: { kind: 'window', start: '2026-09-14', end: '2026-09-27' } },
        { id: 'alg-practice-2', title: 'Практическая работа 2 (6)', type: 'practice', deadline: { kind: 'window', start: '2026-09-28', end: '2026-10-25' } },
        { id: 'alg-practice-3', title: 'Практическая работа 3 (7)', type: 'practice', deadline: { kind: 'window', start: '2026-10-26', end: '2026-11-22' } },
        { id: 'alg-practice-4', title: 'Практическая работа 4 (8)', type: 'practice', deadline: { kind: 'window', start: '2026-11-23', end: '2026-12-20' } }
      ]
    },
    {
      id: 'frontend', title: 'Фронтенд-разработка', short: 'Фронтенд',
      schedule: { weekday: 4, lesson: 6 },
      tasks: [
        { id: 'front-test-1', title: 'Тест 1', type: 'test', deadline: { kind: 'date', date: '2026-10-08' } },
        { id: 'front-practice-1', title: 'Практика 1 · Оно тебе надо', type: 'practice', deadline: { kind: 'date', date: '2026-10-22' } },
        { id: 'front-test-2', title: 'Тест 2', type: 'test', deadline: { kind: 'date', date: '2026-10-29' } },
        { id: 'front-practice-2', title: 'Практика 2 · Посмотри в окно', type: 'practice', deadline: { kind: 'date', date: '2026-11-12' } },
        { id: 'front-test-3', title: 'Тест 3', type: 'test', deadline: { kind: 'date', date: '2026-11-19' } },
        { id: 'front-practice-3', title: 'Практика 3 · Сложно сосредоточиться', type: 'practice', deadline: { kind: 'date', date: '2026-12-03' } },
        { id: 'front-test-4', title: 'Тест 4', type: 'test', deadline: { kind: 'date', date: '2026-12-03' } },
        { id: 'front-test-5', title: 'Тест 5', type: 'test', deadline: { kind: 'date', date: '2026-12-17' } },
        { id: 'front-practice-4', title: 'Практика 4 · Закрывающий тег', type: 'practice', deadline: { kind: 'date', date: '2026-12-17' } }
      ]
    }
  ]
};
