// ============================================================
// СПОРТ
// ============================================================

function getSportMode() { return data.sportMode || 'easy'; }

function getSportStatusForDate(sport, dateStr) {
    const isDone = sport.log && sport.log[dateStr];
    const isRest = sport.rest && sport.rest[dateStr];
    if (isDone) return 'done';
    if (isRest) return 'rest';
    if (data.sportMode === 'strict' && data.strictStartDate) {
        if (dateStr >= data.strictStartDate && dateStr < getToday()) return 'missed';
        if (dateStr < data.strictStartDate) return 'before_strict';
    }
    return 'waiting';
}

function renderSportList() {
    const container = document.getElementById('sportList');
    if (!data.sports.length) { container.innerHTML = '<div class="empty-state">Добавь упражнения</div>'; updateSelectedCount(); return; }
    const term = (sportSearchTerm || '').trim().toLowerCase();
    const list = term ? data.sports.filter(s => s.name.toLowerCase().includes(term)) : data.sports;
    if (list.length === 0) { container.innerHTML = '<div class="empty-state">Ничего не найдено по запросу</div>'; updateSelectedCount(); return; }
    const today = getToday();
    let html = '';
    for (const sport of list) {
        const isSelected = selectedSportIds.has(sport.id);
        const status = getSportStatusForDate(sport, today);
        const statusIcons = { done: '✅', rest: '🛌', missed: '❌', waiting: '⏳', before_strict: '⏳' };
        const statusClasses = { done: 'done', rest: 'rest', missed: 'missed', waiting: 'waiting', before_strict: 'waiting' };
        const statusTexts = { done: 'Сделано', rest: 'Отдых', missed: 'Пропущено', waiting: 'Ожидает', before_strict: 'До строгого' };
        html += `<div class="list-item ${isSelected ? 'selected' : ''}" onclick="toggleSportSelection(${sport.id})">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                <div class="todo-check ${isSelected ? 'done' : ''}" onclick="event.stopPropagation(); toggleSportSelection(${sport.id})" style="width:20px;height:20px;font-size:10px;flex-shrink:0;">${isSelected ? '✓' : ''}</div>
                <span class="sport-status-icon ${statusClasses[status]}">${statusIcons[status]}</span>
                <span class="name">${sport.name}</span>
            </div>
            <div class="actions" onclick="event.stopPropagation();">
                <span class="meta">${statusTexts[status]}</span>
                <button class="btn-sm blue" onclick="openSportDetail(${sport.id})">📋 Детали</button>
            </div>
        </div>`;
    }
    container.innerHTML = html;
    updateSelectedCount();
}

function toggleSportSelection(id) {
    if (selectedSportIds.has(id)) selectedSportIds.delete(id);
    else selectedSportIds.add(id);
    renderSportList();
}

function selectAllSports() { data.sports.forEach(s => selectedSportIds.add(s.id)); renderSportList(); }
function deselectAllSports() { selectedSportIds.clear(); renderSportList(); }
function updateSelectedCount() { document.getElementById('sSelectedCount').textContent = `Выбрано: ${selectedSportIds.size}`; }

function openSportDetail(id) {
    const sport = data.sports.find(s => s.id === id);
    if (!sport) return;
    selectedSportId = id;
    document.getElementById('sportDetail').style.display = 'block';
    document.getElementById('sportDetailTitle').textContent = `💪 ${sport.name}`;
    updateSportDetailStatus(sport);
    const today = getToday();
    const stats = sport.stats && sport.stats[today] ? sport.stats[today] : {};
    document.getElementById('sportSets').value = stats.sets || 0;
    document.getElementById('sportReps').value = stats.reps || 0;
    document.getElementById('sportWeight').value = stats.weight || 0;
    document.getElementById('sportTime').value = stats.time || 0;
    document.getElementById('sportDistance').value = stats.distance || 0;
    sCommentSportId = id;
    document.getElementById('sCommentDate').value = today;
    loadCommentForDate(id, today);
    updateCommentDateLabel(today);
    renderSportRecords(sport);
    renderSportList();
    renderSCalendar();
}

function updateSportDetailStatus(sport) {
    const today = getToday();
    const status = getSportStatusForDate(sport, today);
    const badge = document.getElementById('sDetailStatusBadge');
    const toggleBtn = document.getElementById('sDetailToggleBtn');
    const restToggleBtn = document.getElementById('sDetailRestToggleBtn');
    const statusTexts = { done: '✅ Сделано', rest: '🛌 Отдых', missed: '❌ Пропущено', waiting: '⬜ Ожидает', before_strict: '⏳ До строгого' };
    const statusClasses = { done: 'done', rest: 'rest', missed: 'missed', waiting: 'waiting', before_strict: 'before_strict' };
    badge.className = `sport-status-badge ${statusClasses[status]}`;
    badge.textContent = statusTexts[status] || '⬜ Ожидает';
    
    if (status === 'done') {
        toggleBtn.textContent = '↩️ Снять'; toggleBtn.className = 'btn-sm danger';
        restToggleBtn.textContent = '🛌 Отдых'; restToggleBtn.className = 'btn-sm blue';
    } else if (status === 'rest') {
        toggleBtn.textContent = '✅ Сделать'; toggleBtn.className = 'btn-sm green';
        restToggleBtn.textContent = '↩️ Снять отдых'; restToggleBtn.className = 'btn-sm danger';
    } else {
        toggleBtn.textContent = '✅ Сделать'; toggleBtn.className = 'btn-sm green';
        restToggleBtn.textContent = '🛌 Отдых'; restToggleBtn.className = 'btn-sm blue';
    }
}

function closeSportDetail() {
    document.getElementById('sportDetail').style.display = 'none';
    selectedSportId = null;
    renderSportList();
}

function toggleSportDoneById(id) {
    const sport = data.sports.find(s => s.id === id);
    if (!sport) return;
    const today = getToday();
    if (sport.log && sport.log[today]) {
        delete sport.log[today];
    } else {
        if (!sport.log) sport.log = {};
        sport.log[today] = true;
        if (sport.rest) delete sport.rest[today];
        // Опыт за упражнение начисляется только один раз в день,
        // даже если пользователь снимает и снова ставит отметку "выполнено".
        if (!sport.expClaimed) sport.expClaimed = {};
        if (!sport.expClaimed[today]) {
            sport.expClaimed[today] = true;
            addExp(getExpForActivity('sport', 1), 'sport');
            const streak = calculateSportStreak();
            if (streak > 0 && streak % 5 === 0) addExp(getExpForActivity('streak', streak), 'streak');
        }
    }
    save();
}

function toggleSportDetailStatus() {
    if (!selectedSportId) return;
    toggleSportDoneById(selectedSportId);
    openSportDetail(selectedSportId);
    renderSportList();
    renderSCalendar();
}

function toggleSportDetailRest() {
    if (!selectedSportId) return;
    const sport = data.sports.find(s => s.id === selectedSportId);
    if (!sport) return;
    const today = getToday();
    if (sport.rest && sport.rest[today]) {
        delete sport.rest[today];
    } else {
        if (!sport.rest) sport.rest = {};
        if (data.sportMode === 'strict') {
            const left = getRestDaysLeft();
            if (left !== null && left <= 0) { alert('⚠️ У тебя закончились выходные дни!'); return; }
            if (left !== null && left <= 2) alert(`⚠️ Осталось всего ${left} выходных дней!`);
            useRestDay();
        }
        sport.rest[today] = true;
        if (sport.log) delete sport.log[today];
    }
    save();
    openSportDetail(selectedSportId);
    renderSportList();
    renderSCalendar();
}

function markSelectedAsDone() {
    const ids = Array.from(selectedSportIds);
    if (ids.length === 0) { alert('Выберите упражнения!'); return; }
    const today = getToday();
    let doneCount = 0;
    ids.forEach(id => {
        const sport = data.sports.find(s => s.id === id);
        if (sport) {
            if (!sport.log) sport.log = {};
            sport.log[today] = true;
            if (sport.rest) delete sport.rest[today];
            // Опыт за упражнение начисляется только один раз в день —
            // повторное "выполнено" после снятия отметки опыт не даёт.
            if (!sport.expClaimed) sport.expClaimed = {};
            if (!sport.expClaimed[today]) {
                sport.expClaimed[today] = true;
                doneCount++;
            }
        }
    });
    if (doneCount > 0) {
        addExp(getExpForActivity('sport', doneCount), 'sport');
        const streak = calculateSportStreak();
        if (streak > 0 && streak % 5 === 0) addExp(getExpForActivity('streak', streak), 'streak');
    }
    save();
    selectedSportIds.clear();
    renderSportList();
    renderSCalendar();
}

function markSelectedAsUndone() {
    const ids = Array.from(selectedSportIds);
    if (ids.length === 0) { alert('Выберите упражнения!'); return; }
    const today = getToday();
    ids.forEach(id => {
        const sport = data.sports.find(s => s.id === id);
        if (sport && sport.log) delete sport.log[today];
    });
    save();
    selectedSportIds.clear();
    renderSportList();
    renderSCalendar();
}

function markSelectedAsRest() {
    const ids = Array.from(selectedSportIds);
    if (ids.length === 0) { alert('Выберите упражнения!'); return; }
    const today = getToday();

    if (data.sportMode === 'strict') {
        const left = getRestDaysLeft();
        if (left !== null && left <= 0) { alert('⚠️ У тебя закончились выходные дни на этой неделе!'); return; }
        if (left !== null && left <= 2) alert(`⚠️ Осталось всего ${left} выходных дней!`);
        // Один календарный день = один выходной день, независимо от того,
        // сколько упражнений отмечено выходными в этот день.
        useRestDay();
    }

    ids.forEach(id => {
        const sport = data.sports.find(s => s.id === id);
        if (sport) {
            if (!sport.rest) sport.rest = {};
            sport.rest[today] = true;
            if (sport.log) delete sport.log[today];
        }
    });
    save();
    selectedSportIds.clear();
    renderSportList();
    renderSCalendar();
}

function deleteSelectedSports() {
    const ids = Array.from(selectedSportIds);
    if (ids.length === 0) { alert('Выберите упражнения!'); return; }
    if (!confirm(`Удалить ${ids.length} упражнений?`)) return;
    data.sports = data.sports.filter(s => !selectedSportIds.has(s.id));
    selectedSportIds.clear();
    if (selectedSportId && !data.sports.find(s => s.id === selectedSportId)) {
        selectedSportId = null;
        document.getElementById('sportDetail').style.display = 'none';
    }
    save();
    renderSportList();
    renderSCalendar();
}

function addSport() {
    const input = document.getElementById('sportInput');
    const name = input.value.trim();
    if (!name) { alert('Введите название!'); return; }
    if (data.sports.some(s => s.name.toLowerCase() === name.toLowerCase())) { alert('❌ Такое упражнение уже есть!'); return; }
    data.sports.push({ id: Date.now() + Math.random(), name, log: {}, rest: {}, stats: {}, comments: {} });
    save();
    input.value = '';
    renderSportList();
    renderSCalendar();
}

function renderSCalendar() {
    const grid = document.getElementById('sCalendar');
    const label = document.getElementById('sMonthLabel');
    label.textContent = getMonthName(sMonth) + ' ' + sYear;
    grid.innerHTML = '';
    const daysInMonth = getDaysInMonth(sYear, sMonth);
    const offset = getFirstDayOffset(sYear, sMonth);
    const today = getToday();
    const weekdays = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
    for (const wd of weekdays) {
        const el = document.createElement('div');
        el.className = 'calendar-weekday';
        el.textContent = wd;
        grid.appendChild(el);
    }
    for (let i = 0; i < offset; i++) {
        const el = document.createElement('div');
        el.className = 'calendar-day empty';
        grid.appendChild(el);
    }
    const totalSports = data.sports.length;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = sYear + '-' + String(sMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const el = document.createElement('div');
        el.className = 'calendar-day';
        const numSpan = document.createElement('span');
        numSpan.className = 'day-number';
        numSpan.textContent = d;
        el.appendChild(numSpan);
        if (dateStr === today) el.classList.add('today');
        if (data.sportMode === 'strict' && data.strictStartDate && dateStr === data.strictStartDate) {
            el.classList.add('sport-strict-start');
        }
        if (totalSports > 0) {
            let doneCount = 0, restCount = 0, missedCount = 0;
            for (const sport of data.sports) {
                const status = getSportStatusForDate(sport, dateStr);
                if (status === 'done') doneCount++;
                else if (status === 'rest') restCount++;
                else if (status === 'missed') missedCount++;
            }
            const activeSports = totalSports - restCount;
            const percent = activeSports > 0 ? (doneCount / activeSports) * 100 : 0;
            let colorClass = 'sport-empty';
            if (missedCount > 0 && data.sportMode === 'strict' && data.strictStartDate && dateStr >= data.strictStartDate) {
                colorClass = 'sport-missed';
            } else if (percent === 0) colorClass = 'sport-empty';
            else if (percent < 33) colorClass = 'sport-low';
            else if (percent < 66) colorClass = 'sport-medium';
            else if (percent < 100) colorClass = 'sport-high';
            else colorClass = 'sport-done';
            el.classList.add(colorClass);
            const badge = document.createElement('span');
            badge.className = 'badge';
            badge.textContent = `${doneCount}/${activeSports}`;
            el.appendChild(badge);
            el.classList.add('clickable');
            el.addEventListener('click', () => showDayStats(dateStr));
        }
        grid.appendChild(el);
    }
    if (data.sportMode === 'strict' && data.strictStartDate) {
        document.getElementById('sCalendarHint').textContent = `🔥 Строгий режим с ${formatDate(data.strictStartDate)}. 🛌 Отдых не учитывается. 🔴 Пропуски отмечены красным.`;
    } else {
        document.getElementById('sCalendarHint').textContent = '💡 Чем зеленее день — тем больше выполнено. 🛌 Отдых не учитывается.';
    }
}

function showDayStats(dateStr) {
    if (data.sports.length === 0) return;
    let msg = `📊 Статистика за ${formatDate(dateStr)}:\n\n`;
    for (const sport of data.sports) {
        const status = getSportStatusForDate(sport, dateStr);
        const stats = sport.stats && sport.stats[dateStr] ? sport.stats[dateStr] : {};
        let statusText = '⬜';
        if (status === 'done') statusText = '✅';
        else if (status === 'rest') statusText = '🛌';
        else if (status === 'missed') statusText = '❌';
        let statsStr = '';
        if (stats.sets) statsStr += ` Подходы:${stats.sets}`;
        if (stats.reps) statsStr += ` Повт:${stats.reps}`;
        if (stats.weight) statsStr += ` Вес:${stats.weight}кг`;
        if (stats.time) statsStr += ` Время:${stats.time}мин`;
        if (stats.distance) statsStr += ` Дист:${stats.distance}км`;
        msg += `${statusText} ${sport.name}`;
        if (statsStr) msg += ` —${statsStr}`;
        if (sport.comments && sport.comments[dateStr]) msg += `\n   📝 ${sport.comments[dateStr]}`;
        msg += '\n';
    }
    alert(msg);
}

const SPORT_STAT_METRICS = [
    { key: 'weight', label: 'Вес', unit: 'кг', icon: '⚖️' },
    { key: 'distance', label: 'Дистанция', unit: 'км', icon: '📏' },
    { key: 'time', label: 'Время', unit: 'мин', icon: '⏱️' },
    { key: 'reps', label: 'Повторения', unit: '', icon: '🔁' }
];

// Личные рекорды и прогресс по силовым/кардио-показателям — построено
// поверх уже существующих данных sport.stats (подходы/повторы/вес/время/дистанция),
// которые раньше нигде не отображались, кроме грубого alert() по клику на календарь.
function renderSportRecords(sport) {
    const container = document.getElementById('sportRecords');
    if (!container) return;

    const entries = Object.entries(sport.stats || {}).sort((a, b) => a[0].localeCompare(b[0]));
    if (entries.length === 0) { container.innerHTML = ''; return; }

    const usedMetrics = SPORT_STAT_METRICS.filter(m => entries.some(([, v]) => v[m.key] > 0));
    if (usedMetrics.length === 0) { container.innerHTML = ''; return; }

    let html = '<div class="stats-section-divider">🏆 Личные рекорды</div>';
    html += '<div class="sport-records-row">';
    usedMetrics.forEach(m => {
        const max = Math.max(...entries.map(([, v]) => v[m.key] || 0));
        html += `<div class="sport-record-badge"><span>${m.icon} ${max}${m.unit}</span><span class="sport-record-label">${m.label}</span></div>`;
    });
    html += '</div>';

    const chartMetric = usedMetrics[0];
    const recentEntries = entries.filter(([, v]) => v[chartMetric.key] > 0).slice(-10);
    if (recentEntries.length >= 2) {
        const maxVal = Math.max(...recentEntries.map(([, v]) => v[chartMetric.key]));
        html += `<div class="stats-section-divider">📈 Прогресс: ${chartMetric.label}</div>`;
        html += '<div class="trend-chart">';
        recentEntries.forEach(([dateStr, v]) => {
            const val = v[chartMetric.key];
            const pct = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
            const d = new Date(dateStr);
            const label = `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
            html += `
                <div class="trend-bar">
                    <span class="trend-bar-pct">${val}${chartMetric.unit}</span>
                    <div class="trend-bar-track"><div class="trend-fill" style="height:${pct}%"></div></div>
                    <span class="trend-bar-label">${label}</span>
                </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html;
}

function saveSportStats() {
    if (!selectedSportId) { alert('Откройте упражнение!'); return; }
    const sport = data.sports.find(s => s.id === selectedSportId);
    if (!sport) return;
    const today = getToday();
    if (!sport.stats) sport.stats = {};
    sport.stats[today] = {
        sets: parseInt(document.getElementById('sportSets').value) || 0,
        reps: parseInt(document.getElementById('sportReps').value) || 0,
        weight: parseFloat(document.getElementById('sportWeight').value) || 0,
        time: parseFloat(document.getElementById('sportTime').value) || 0,
        distance: parseFloat(document.getElementById('sportDistance').value) || 0
    };
    save();
    openSportDetail(selectedSportId);
}

function toggleCommentContainer() {
    const container = document.getElementById('sCommentContainer');
    container.style.display = container.style.display === 'none' || container.style.display === '' ? 'block' : 'none';
}

function updateCommentDateLabel(dateStr) {
    document.getElementById('sCommentDateLabel').textContent = dateStr === getToday() ? 'Сегодня' : formatDate(dateStr);
}

function changeCommentDate(delta) {
    const dateInput = document.getElementById('sCommentDate');
    let currentDate = new Date(dateInput.value);
    if (isNaN(currentDate.getTime())) currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + delta);
    const newDate = currentDate.getFullYear() + '-' + String(currentDate.getMonth()+1).padStart(2,'0') + '-' + String(currentDate.getDate()).padStart(2,'0');
    dateInput.value = newDate;
    updateCommentDateLabel(newDate);
    if (sCommentSportId) loadCommentForDate(sCommentSportId, newDate);
}

function loadCommentForDate(sportId, date) {
    const sport = data.sports.find(s => s.id === sportId);
    if (!sport) return;
    if (!sport.comments) sport.comments = {};
    const comment = sport.comments[date] || '';
    document.getElementById('sCommentText').value = comment;
    updateCommentCounter(comment);
    const display = document.getElementById('sCommentDisplay');
    if (comment && comment.trim()) {
        display.textContent = `📝 ${date}: ${comment}`;
        display.style.display = 'block';
    } else display.style.display = 'none';
}

function updateCommentCounter(text) {
    const count = text ? text.length : 0;
    const max = 500;
    const counter = document.getElementById('sCommentCounter');
    counter.textContent = `${count} / ${max}`;
    counter.className = 'comment-char-counter';
    if (count > max * 0.8) counter.classList.add('warning');
    if (count >= max) counter.classList.add('danger');
}

function saveSportComment() {
    if (!sCommentSportId) { alert('Откройте упражнение!'); return; }
    const date = document.getElementById('sCommentDate').value;
    const text = document.getElementById('sCommentText').value.trim();
    if (text.length > 500) { alert('Максимум 500 символов!'); return; }
    const sport = data.sports.find(s => s.id === sCommentSportId);
    if (!sport) return;
    if (!sport.comments) sport.comments = {};
    if (text) sport.comments[date] = text;
    else delete sport.comments[date];
    save();
    loadCommentForDate(sCommentSportId, date);
    renderSportList();
    document.getElementById('sCommentContainer').style.display = 'none';
}

function deleteSportComment() {
    if (!sCommentSportId) { alert('Откройте упражнение!'); return; }
    const date = document.getElementById('sCommentDate').value;
    if (!confirm(`Удалить комментарий за ${formatDate(date)}?`)) return;
    const sport = data.sports.find(s => s.id === sCommentSportId);
    if (!sport) return;
    if (sport.comments) {
        delete sport.comments[date];
        if (Object.keys(sport.comments).length === 0) delete sport.comments;
    }
    save();
    loadCommentForDate(sCommentSportId, date);
    renderSportList();
    document.getElementById('sCommentContainer').style.display = 'none';
}

function showStrictModal() {
    const available = data.totalHealth || 0;
    document.getElementById('strictAvailableHp').textContent = available;
    const maxHp = Math.min(getStrictMaxHpCap(), available);
    document.getElementById('strictHealthInput').value = Math.min(5, maxHp);
    document.getElementById('strictHealthInput').max = maxHp;
    document.getElementById('strictRestDaysInput').value = data.strictRestDays || 1;
    document.getElementById('strictRestDaysInput').max = getStrictRestDaysCap();
    document.getElementById('strictStartDateInput').value = getToday();
    document.getElementById('strictStartDateInput').min = getToday();
    
    if (available < 1) {
        document.getElementById('strictHealthWarning').style.display = 'block';
        document.getElementById('strictHealthWarning').textContent = `⚠️ У тебя нет очков здоровья! Зарабатывай HP через повышение уровня!`;
        document.getElementById('strictConfirmBtn').disabled = true;
        document.getElementById('strictConfirmBtn').style.opacity = '0.5';
        document.getElementById('strictConfirmBtn').style.cursor = 'not-allowed';
    } else {
        document.getElementById('strictHealthWarning').style.display = 'none';
        document.getElementById('strictConfirmBtn').disabled = false;
        document.getElementById('strictConfirmBtn').style.opacity = '1';
        document.getElementById('strictConfirmBtn').style.cursor = 'pointer';
    }
    document.getElementById('strictModal').classList.add('active');
}

function hideStrictModal() {
    document.getElementById('strictModal').classList.remove('active');
    // Если это была попытка "заново войти в строгий" из экрана смерти и
    // пользователь отменил/закрыл модалку — не оставляем его без HP и без
    // выбора, а возвращаем к экрану смерти, где нужно явно выбрать вариант.
    if (deathFlowActive) {
        document.getElementById('deathModal').classList.add('active');
    }
}

document.getElementById('strictHpMinus').addEventListener('click', function() {
    const input = document.getElementById('strictHealthInput');
    let val = parseInt(input.value) || 5;
    if (val > 1) { val--; input.value = val; }
});
document.getElementById('strictHpPlus').addEventListener('click', function() {
    const input = document.getElementById('strictHealthInput');
    let val = parseInt(input.value) || 1;
    const max = parseInt(input.max) || 12;
    if (val < max) { val++; input.value = val; }
});

document.getElementById('strictStartDateInput').addEventListener('change', function() {
    const val = this.value;
    if (val && !isTodayOrFuture(val)) {
        alert('❌ Нельзя выбрать прошлую дату! Установлено сегодня.');
        this.value = getToday();
    }
});

document.getElementById('deathEasyBtn').addEventListener('click', function() {
    exitStrictMode();
});

document.getElementById('deathRestartBtn').addEventListener('click', function() {
    document.getElementById('deathModal').classList.remove('active');
    deathFlowActive = true;
    showStrictModal();
});

document.getElementById('sportAddBtn').addEventListener('click', addSport);
document.getElementById('sportInput').addEventListener('keydown', e => { if (e.key === 'Enter') addSport(); });
document.getElementById('sSelectAllBtn').addEventListener('click', selectAllSports);
document.getElementById('sDeselectAllBtn').addEventListener('click', deselectAllSports);
document.getElementById('sSearchInput').addEventListener('input', function() {
    sportSearchTerm = this.value;
    renderSportList();
});
document.getElementById('sMarkDoneBtn').addEventListener('click', markSelectedAsDone);
document.getElementById('sMarkUndoneBtn').addEventListener('click', markSelectedAsUndone);
document.getElementById('sMarkRestBtn').addEventListener('click', markSelectedAsRest);
document.getElementById('sDeleteSelectedBtn').addEventListener('click', deleteSelectedSports);
document.getElementById('sCloseDetailBtn').addEventListener('click', closeSportDetail);
document.getElementById('sDetailToggleBtn').addEventListener('click', toggleSportDetailStatus);
document.getElementById('sDetailRestToggleBtn').addEventListener('click', toggleSportDetailRest);
document.getElementById('sportStatsBtn').addEventListener('click', saveSportStats);
document.getElementById('sCommentToggleBtn').addEventListener('click', toggleCommentContainer);
document.getElementById('sCommentSaveBtn').addEventListener('click', saveSportComment);
document.getElementById('sCommentDeleteBtn').addEventListener('click', deleteSportComment);
document.getElementById('sCommentPrevDay').addEventListener('click', () => changeCommentDate(-1));
document.getElementById('sCommentNextDay').addEventListener('click', () => changeCommentDate(1));
document.getElementById('sCommentText').addEventListener('input', function() { updateCommentCounter(this.value); });
document.getElementById('sCommentDate').addEventListener('change', function() {
    if (this.value && sCommentSportId) {
        updateCommentDateLabel(this.value);
        loadCommentForDate(sCommentSportId, this.value);
    }
});
document.getElementById('sModeEasy').addEventListener('click', function() {
    if (data.sportMode === 'strict') {
        exitStrictMode();
    }
});
document.getElementById('sModeStrict').addEventListener('click', function() {
    if (data.sportMode === 'strict') {
        alert('⚠️ Строгий режим уже активен!');
        return;
    }
    showStrictModal();
});
document.getElementById('strictCancelBtn').addEventListener('click', hideStrictModal);
document.getElementById('strictConfirmBtn').addEventListener('click', confirmStrictMode);
document.getElementById('strictModal').addEventListener('click', function(e) { if (e.target === this) hideStrictModal(); });
document.getElementById('sPrevMonth').addEventListener('click', () => { sMonth--; if (sMonth < 0) { sMonth = 11; sYear--; } renderSCalendar(); });
document.getElementById('sNextMonth').addEventListener('click', () => { sMonth++; if (sMonth > 11) { sMonth = 0; sYear++; } renderSCalendar(); });

