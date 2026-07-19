// ============================================================
// ПРИВЫЧКИ
// ============================================================

document.getElementById('hStartDate').max = getToday();

function getHabitStatusForDate(habit, dateStr) {
    if (habit.log && habit.log[dateStr] === false) return 'failed';
    if (habit.log && habit.log[dateStr] === true) return 'success';
    const today = getToday();
    if (dateStr === today) return 'pending';
    if (dateStr < today && habit.startDate <= dateStr) return 'completed';
    return 'empty';
}

function calcHabitStreak(habit) {
    let streak = 0;
    const today = getToday();
    let current = new Date(today);
    while (true) {
        const dateStr = current.getFullYear() + '-' + String(current.getMonth()+1).padStart(2,'0') + '-' + String(current.getDate()).padStart(2,'0');
        const status = getHabitStatusForDate(habit, dateStr);
        if (status === 'completed' || status === 'success' || status === 'pending') { streak++; current.setDate(current.getDate() - 1); }
        else if (status === 'failed') break;
        else break;
        if (current < new Date(2020, 0, 1)) break;
    }
    return streak;
}

function calcBestStreak(habit) {
    let currentStreak = 0, bestStreak = 0;
    const today = getToday();
    let current = new Date(habit.startDate);
    const end = new Date(today);
    while (current <= end) {
        const dateStr = current.getFullYear() + '-' + String(current.getMonth()+1).padStart(2,'0') + '-' + String(current.getDate()).padStart(2,'0');
        const status = getHabitStatusForDate(habit, dateStr);
        if (status === 'completed' || status === 'success' || status === 'pending') { currentStreak++; if (currentStreak > bestStreak) bestStreak = currentStreak; }
        else currentStreak = 0;
        current.setDate(current.getDate() + 1);
    }
    return bestStreak;
}

function calculateHabitStats(habit) {
    const today = getToday();
    let total = 0, failed = 0;
    const start = new Date(habit.startDate);
    const end = new Date(today);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
        const status = getHabitStatusForDate(habit, dateStr);
        if (status === 'completed' || status === 'success' || status === 'pending') total++;
        else if (status === 'failed') { total++; failed++; }
    }
    return { total, failed };
}

function toggleHabitSelection(id) {
    if (selectedHabitIds.has(id)) selectedHabitIds.delete(id);
    else selectedHabitIds.add(id);
    renderHabits();
}

function selectAllHabits() { data.habits.forEach(h => selectedHabitIds.add(h.id)); renderHabits(); }
function deselectAllHabits() { selectedHabitIds.clear(); renderHabits(); }
function updateHabitSelectedCount() { document.getElementById('hSelectedCount').textContent = `Выбрано: ${selectedHabitIds.size}`; }

function deleteSelectedHabits() {
    const ids = Array.from(selectedHabitIds);
    if (ids.length === 0) { alert('Выберите привычки!'); return; }
    if (!confirm(`Удалить ${ids.length} привычек?`)) return;
    data.habits = data.habits.filter(h => !selectedHabitIds.has(h.id));
    if (selectedHabitId && !data.habits.find(h => h.id === selectedHabitId)) {
        selectedHabitId = null;
        document.getElementById('hDetail').style.display = 'none';
    }
    selectedHabitIds.clear();
    save();
    renderHabits();
    renderHabitDetail();
}

function renderHabits() {
    const container = document.getElementById('hList');
    if (!data.habits.length) { container.innerHTML = '<div class="empty-state">Добавь первую привычку</div>'; updateHabitSelectedCount(); return; }
    const term = (habitSearchTerm || '').trim().toLowerCase();
    const list = term ? data.habits.filter(h => h.name.toLowerCase().includes(term)) : data.habits;
    if (list.length === 0) { container.innerHTML = '<div class="empty-state">Ничего не найдено по запросу</div>'; updateHabitSelectedCount(); return; }
    let html = '';
    for (const habit of list) {
        const isActive = (selectedHabitId === habit.id);
        const isSelected = selectedHabitIds.has(habit.id);
        const streak = calcHabitStreak(habit);
        const bestStreak = calcBestStreak(habit);
        const today = getToday();
        const status = getHabitStatusForDate(habit, today);
        let statusIcon = '⏳', statusColor = 'waiting';
        if (status === 'success' || status === 'completed') { statusIcon = '✅'; statusColor = 'success'; }
        else if (status === 'failed') { statusIcon = '❌'; statusColor = 'failed'; }
        else if (status === 'pending') { statusIcon = '🟡'; statusColor = 'pending'; }
        html += `<div class="list-item ${isActive ? 'selected' : ''}" onclick="toggleHabitSelection(${habit.id})">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                <div class="todo-check ${isSelected ? 'done' : ''}" onclick="event.stopPropagation(); toggleHabitSelection(${habit.id})" style="width:20px;height:20px;font-size:10px;flex-shrink:0;">${isSelected ? '✓' : ''}</div>
                <span class="habit-status-icon ${statusColor}">${statusIcon}</span>
                <span class="name" onclick="event.stopPropagation(); selectHabit(${habit.id})">${habit.name}</span>
            </div>
            <div class="actions" onclick="event.stopPropagation();">
                <span class="meta">🔥 ${streak}</span>
                <span class="meta">🏆 ${bestStreak}</span>
                <span class="meta">с ${formatDate(habit.startDate)}</span>
                <button class="btn-sm ${isActive ? 'active-btn' : ''}" onclick="selectHabit(${habit.id})">${isActive ? '✓' : '📋'}</button>
            </div>
        </div>`;
    }
    container.innerHTML = html;
    updateHabitSelectedCount();
}

function selectHabit(id) {
    selectedHabitId = id;
    hMonth = new Date().getMonth();
    hYear = new Date().getFullYear();
    renderHabits();
    renderHabitDetail();
}

function addHabit() {
    const input = document.getElementById('hInput');
    const name = input.value.trim();
    const startDate = document.getElementById('hStartDate').value || getToday();
    const startTime = document.getElementById('hStartTime').value || '00:00';
    if (!name) { alert('Введите название!'); return; }
    if (isFutureDate(startDate)) { alert('❌ Нельзя выбрать будущую дату!'); return; }
    if (data.habits.some(h => h.name.toLowerCase() === name.toLowerCase())) { alert('❌ Такая привычка уже есть!'); return; }
    const newHabit = { id: Date.now() + Math.random(), name, startDate, startTime, log: {}, fails: [] };
    data.habits.push(newHabit);
    selectedHabitId = newHabit.id;
    save();
    input.value = '';
    renderHabits();
    renderHabitDetail();
    const multiplier = getHabitExpMultiplier(startDate);
    const expAmount = Math.floor(getExpForActivity('habit', 1) * multiplier);
    if (expAmount > 0) addExp(expAmount, 'habits');
    const streak = calcHabitStreak(newHabit);
    if (streak > 0) {
        const streakExp = Math.floor(getExpForActivity('streak', streak) * multiplier * 0.5);
        if (streakExp > 0) addExp(streakExp, 'streak');
    }
}

function habitFail() {
    if (!selectedHabitId) { alert('Выбери привычку!'); return; }
    const habit = data.habits.find(h => h.id === selectedHabitId);
    if (!habit) return;
    const today = getToday();
    if (!confirm('⚠️ Ты уверен? Это сбросит серию и ты потеряешь опыт!')) return;
    if (!habit.log) habit.log = {};
    if (!habit.fails) habit.fails = [];
    delete habit.log[today];
    const streakBefore = calcHabitStreak(habit);
    const reason = prompt('📝 Почему сорвался?');
    habit.log[today] = false;
    habit.fails.push({ date: today, reason: reason || 'Без причины', streakBefore: streakBefore });
    habit.startDate = today;
    habit.startTime = getNowTime();
    const expLoss = Math.floor(getExpForActivity('habit', 1) * 0.7);
    removeExp(expLoss, 'habits');
    applyStrictHabitFailPenalty(habit, today);
    save();
    renderAll();
    showFails();
}

function showFails() {
    const container = document.getElementById('hFailList');
    const content = document.getElementById('hFailListContent');
    if (!selectedHabitId) return;
    const habit = data.habits.find(h => h.id === selectedHabitId);
    if (!habit) return;
    container.style.display = 'block';
    if (!habit.fails || habit.fails.length === 0) { content.innerHTML = '<div class="empty-state">🎉 Нет срывов!</div>'; return; }
    let html = '';
    for (let i = habit.fails.length - 1; i >= 0; i--) {
        const fail = habit.fails[i];
        html += `<div class="fail-item"><div class="fail-header"><span class="fail-date">${formatDate(fail.date)}</span><span class="fail-streak-label">🔥 ${fail.streakBefore || 0} дней</span></div>${fail.reason ? `<div class="fail-reason show">${fail.reason}</div>` : ''}</div>`;
    }
    content.innerHTML = html;
}

function hideFails() { document.getElementById('hFailList').style.display = 'none'; }

function updateDayTimer() {
    const timerEl = document.getElementById('hDayTimer');
    if (!timerEl || !selectedHabitId) return;
    const habit = data.habits.find(h => h.id === selectedHabitId);
    if (!habit) return;
    const start = new Date(habit.startDate + 'T' + (habit.startTime || '00:00:00'));
    const now = new Date();
    const diffMs = now - start;
    const periodMs = 24 * 60 * 60 * 1000;
    const elapsed = diffMs % periodMs;
    const remaining = periodMs - elapsed;
    if (remaining <= 1000) { timerEl.textContent = '00:00:00'; return; }
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    timerEl.textContent = String(hours).padStart(2,'0') + ':' + String(minutes).padStart(2,'0') + ':' + String(seconds).padStart(2,'0');
}

function renderHabitDetail() {
    const container = document.getElementById('hDetail');
    if (!selectedHabitId || !data.habits.find(h => h.id === selectedHabitId)) {
        container.style.display = 'none';
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        document.getElementById('hFailList').style.display = 'none';
        return;
    }
    container.style.display = 'block';
    const habit = data.habits.find(h => h.id === selectedHabitId);
    document.getElementById('hDetailTitle').textContent = `📅 ${habit.name}`;
    const stats = calculateHabitStats(habit);
    const streak = calcHabitStreak(habit);
    const bestStreak = calcBestStreak(habit);
    const daysFromStart = Math.ceil((new Date() - new Date(habit.startDate)) / (1000 * 60 * 60 * 24));
    document.getElementById('hStreak').textContent = streak;
    document.getElementById('hBestStreak').textContent = bestStreak;
    document.getElementById('hFailed').textContent = habit.fails ? habit.fails.length : 0;
    document.getElementById('hTotal').textContent = stats.total;
    document.getElementById('hTimer').textContent = daysFromStart;
    if (timerInterval) clearInterval(timerInterval);
    updateDayTimer();
    timerInterval = setInterval(updateDayTimer, 1000);
    renderHCalendar(habit);
}

function renderHCalendar(habit) {
    const grid = document.getElementById('hCalendar');
    const label = document.getElementById('hMonthLabel');
    label.textContent = getMonthName(hMonth) + ' ' + hYear;
    grid.innerHTML = '';
    const daysInMonth = getDaysInMonth(hYear, hMonth);
    const offset = getFirstDayOffset(hYear, hMonth);
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
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = hYear + '-' + String(hMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const el = document.createElement('div');
        el.className = 'calendar-day';
        const numSpan = document.createElement('span');
        numSpan.className = 'day-number';
        numSpan.textContent = d;
        el.appendChild(numSpan);
        if (dateStr === today) el.classList.add('today');
        const status = getHabitStatusForDate(habit, dateStr);
        if (status === 'failed') el.classList.add('habit-failed');
        else if (status === 'pending') el.classList.add('habit-pending');
        else if (status === 'completed' || status === 'success') el.classList.add('habit-success');
        else el.classList.add('habit-empty');
        grid.appendChild(el);
    }
}

document.getElementById('hAddBtn').addEventListener('click', addHabit);
document.getElementById('hInput').addEventListener('keydown', e => { if (e.key === 'Enter') addHabit(); });
document.getElementById('hFailBtn').addEventListener('click', habitFail);
document.getElementById('hShowFailsBtn').addEventListener('click', showFails);
document.getElementById('hHideFailsBtn').addEventListener('click', hideFails);
document.getElementById('hPrevMonth').addEventListener('click', () => { hMonth--; if (hMonth < 0) { hMonth = 11; hYear--; } renderHabitDetail(); });
document.getElementById('hNextMonth').addEventListener('click', () => { hMonth++; if (hMonth > 11) { hMonth = 0; hYear++; } renderHabitDetail(); });
document.getElementById('hSelectAllBtn').addEventListener('click', selectAllHabits);
document.getElementById('hDeselectAllBtn').addEventListener('click', deselectAllHabits);
document.getElementById('hDeleteSelectedBtn').addEventListener('click', deleteSelectedHabits);
document.getElementById('hSearchInput').addEventListener('input', function() {
    habitSearchTerm = this.value;
    renderHabits();
});

