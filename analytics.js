// ============================================================
// ГРАФИК ПРОГРЕССА ПО НЕДЕЛЯМ
// ============================================================

const TREND_MAX_WEEKS = 12; // если истории больше — показываем только последние N недель

function getDayStatusForTab(dateStr, tab) {
    let status = 'empty';

    if (tab === 'all' || tab === 'sport') {
        for (const sport of data.sports) {
            const s = getSportStatusForDate(sport, dateStr);
            if (s === 'done') { status = 'done'; break; }
            else if (s === 'missed') status = 'failed';
        }
    }
    if ((tab === 'all' || tab === 'habits') && status !== 'done') {
        for (const habit of data.habits) {
            const s = getHabitStatusForDate(habit, dateStr);
            if (s === 'success' || s === 'completed') { status = 'done'; break; }
            else if (s === 'failed') status = 'failed';
        }
    }
    if ((tab === 'all' || tab === 'todo') && status === 'empty') {
        if (data.todoDays && data.todoDays[dateStr] && data.todoDays[dateStr].some(t => t.done)) status = 'done';
    }
    if ((tab === 'all' || tab === 'notes') && status === 'empty') {
        if (data.notes && data.notes.some(n => n.date === dateStr)) status = 'done';
    }
    if ((tab === 'all' || tab === 'achievements') && status === 'empty') {
        if (data.achievements && data.achievements.some(a => a.date === dateStr)) status = 'done';
    }
    return status;
}

// Находит самую раннюю дату, для которой вообще есть какие-то данные
// (лог привычки/спорта, дело, заметка, ачивка) — с учётом выбранного фильтра.
function getEarliestTrackedDate(tab) {
    let earliest = null;
    const consider = (dateStr) => {
        if (!dateStr) return;
        if (!earliest || dateStr < earliest) earliest = dateStr;
    };

    if (tab === 'all' || tab === 'sport') {
        (data.sports || []).forEach(s => {
            if (s.log) Object.keys(s.log).forEach(consider);
            if (s.rest) Object.keys(s.rest).forEach(consider);
        });
    }
    if (tab === 'all' || tab === 'habits') {
        (data.habits || []).forEach(h => {
            consider(h.startDate);
            if (h.log) Object.keys(h.log).forEach(consider);
        });
    }
    if (tab === 'all' || tab === 'todo') {
        if (data.todoDays) Object.keys(data.todoDays).forEach(consider);
    }
    if (tab === 'all' || tab === 'notes') {
        (data.notes || []).forEach(n => consider(n.date));
    }
    if (tab === 'all' || tab === 'achievements') {
        (data.achievements || []).forEach(a => consider(a.date));
    }
    return earliest;
}

function renderTrendChart() {
    const container = document.getElementById('profileTrendChart');
    if (!container) return;

    const tab = currentStatTab;
    const earliestStr = getEarliestTrackedDate(tab);

    if (!earliestStr) {
        container.innerHTML = '<div class="hint">Пока нет данных для графика — начни что-нибудь отмечать, и здесь появится динамика.</div>';
        return;
    }

    const today = new Date();
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(todayWeekStart.getDate() - todayWeekStart.getDay());

    const earliestWeekStart = new Date(earliestStr);
    earliestWeekStart.setDate(earliestWeekStart.getDate() - earliestWeekStart.getDay());

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let weeksToShow = Math.round((todayWeekStart - earliestWeekStart) / msPerWeek) + 1;
    if (weeksToShow > TREND_MAX_WEEKS) weeksToShow = TREND_MAX_WEEKS;
    if (weeksToShow < 1) weeksToShow = 1;

    let html = '<div class="trend-chart">';
    for (let w = weeksToShow - 1; w >= 0; w--) {
        let done = 0, tracked = 0;
        for (let d = 6; d >= 0; d--) {
            const date = new Date(today);
            date.setDate(date.getDate() - (w * 7 + d));
            const dateStr = dateToStr(date);
            if (dateStr < earliestStr) continue; // до начала истории — не считаем
            const status = getDayStatusForTab(dateStr, tab);
            if (status !== 'empty') {
                tracked++;
                if (status === 'done') done++;
            }
        }
        const pct = tracked > 0 ? Math.round((done / tracked) * 100) : 0;
        const weekStart = new Date(today);
        weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
        const label = `${weekStart.getDate()}.${String(weekStart.getMonth() + 1).padStart(2, '0')}`;

        html += `
            <div class="trend-bar">
                <span class="trend-bar-pct">${tracked > 0 ? pct + '%' : '—'}</span>
                <div class="trend-bar-track"><div class="trend-fill" style="height:${tracked > 0 ? pct : 0}%"></div></div>
                <span class="trend-bar-label">${label}</span>
            </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
// ТЕПЛОВАЯ КАРТА АКТИВНОСТИ
// ============================================================

const HEATMAP_MAX_WEEKS = 10; // компактно для мобильного экрана

// Доля выполненного за конкретный день (0..1) с учётом фильтра вкладки.
// null — по этому дню вообще нет отслеживаемых пунктов (не путать с 0% — это когда всё было пропущено).
function getDayIntensity(dateStr, tab) {
    let done = 0, tracked = 0;

    if (tab === 'all' || tab === 'sport') {
        (data.sports || []).forEach(s => {
            const st = getSportStatusForDate(s, dateStr);
            if (st === 'done' || st === 'missed') { tracked++; if (st === 'done') done++; }
        });
    }
    if (tab === 'all' || tab === 'habits') {
        (data.habits || []).forEach(h => {
            const st = getHabitStatusForDate(h, dateStr);
            if (st === 'success' || st === 'completed' || st === 'failed') { tracked++; if (st !== 'failed') done++; }
        });
    }
    if (tab === 'all' || tab === 'todo') {
        const todos = (data.todoDays && data.todoDays[dateStr]) || [];
        if (todos.length) { tracked += todos.length; done += todos.filter(t => t.done).length; }
    }
    if (tab === 'all' || tab === 'notes') {
        if (data.notes && data.notes.some(n => n.date === dateStr)) { tracked++; done++; }
    }
    if (tab === 'all' || tab === 'achievements') {
        if (data.achievements && data.achievements.some(a => a.date === dateStr)) { tracked++; done++; }
    }

    if (tracked === 0) return null;
    return done / tracked;
}

function intensityToLevel(intensity) {
    if (intensity === null) return 0; // в этот день среди выбранных категорий вообще нечего было отслеживать
    if (intensity === 0) return 1;    // отслеживалось, но не выполнено ни одного пункта
    if (intensity < 0.5) return 2;
    if (intensity < 1) return 3;
    return 4;
}

function renderHeatmap() {
    const container = document.getElementById('profileHeatmap');
    if (!container) return;

    const tab = currentStatTab;
    const earliestStr = getEarliestTrackedDate(tab);
    if (!earliestStr) { container.innerHTML = ''; return; }

    const today = new Date();
    const todayStr = getToday();
    // понедельник текущей недели
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(todayWeekStart.getDate() - ((todayWeekStart.getDay() + 6) % 7));

    const earliestDate = new Date(earliestStr);
    const earliestWeekStart = new Date(earliestDate);
    earliestWeekStart.setDate(earliestWeekStart.getDate() - ((earliestWeekStart.getDay() + 6) % 7));

    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    let weeks = Math.round((todayWeekStart - earliestWeekStart) / msPerWeek) + 1;
    if (weeks > HEATMAP_MAX_WEEKS) weeks = HEATMAP_MAX_WEEKS;
    if (weeks < 1) weeks = 1;

    let html = '<div class="heatmap-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>';
    html += '<div class="heatmap-grid">';
    // самая свежая неделя сверху — удобнее видеть текущий прогресс без скролла
    for (let w = 0; w < weeks; w++) {
        const weekStart = new Date(todayWeekStart);
        weekStart.setDate(weekStart.getDate() - w * 7);
        for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + d);
            const dateStr = dateToStr(date);
            let level = -1;
            let title = formatDate(dateStr);
            if (dateStr >= earliestStr && dateStr <= todayStr) {
                const intensity = getDayIntensity(dateStr, tab);
                level = intensityToLevel(intensity);
                title += intensity !== null ? `: ${Math.round(intensity * 100)}%` : ': нет данных';
            } else {
                title = '';
            }
            html += `<div class="heatmap-cell level-${level}" title="${title}"></div>`;
        }
    }
    html += '</div>';
    container.innerHTML = html;
}
