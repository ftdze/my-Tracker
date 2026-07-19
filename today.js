// ============================================================
// ВИДЖЕТ «СЕГОДНЯ» — быстрые действия прямо с главного экрана
// ============================================================

function renderTodayWidget() {
    const container = document.getElementById('todayWidget');
    if (!container) return;

    const today = getToday();

    const pendingSports = (data.sports || []).filter(s => {
        const status = getSportStatusForDate(s, today);
        return status === 'waiting' || status === 'missed';
    });

    const todayTodos = (data.todoDays && data.todoDays[today]) || [];
    const pendingTodos = todayTodos.filter(t => !t.done);

    const hasAnyTracked = (data.sports && data.sports.length > 0) || todayTodos.length > 0;

    if (!hasAnyTracked) {
        container.innerHTML = '<div class="hint">Пока нечего показать — добавь упражнения на вкладке «Спорт» или дела на вкладке «Дела», и они появятся здесь.</div>';
        return;
    }

    if (pendingSports.length === 0 && pendingTodos.length === 0) {
        container.innerHTML = '<div class="today-done">🎉 На сегодня всё сделано!</div>';
        return;
    }

    let html = '';
    if (pendingSports.length > 0) {
        html += '<div class="today-group-label">💪 Спорт</div>';
        pendingSports.forEach(s => {
            html += `
                <div class="today-item">
                    <span class="today-item-name">${s.name}</span>
                    <button class="btn-sm green" onclick="quickMarkSportDone(${s.id})">✅ Готово</button>
                </div>`;
        });
    }
    if (pendingTodos.length > 0) {
        html += '<div class="today-group-label">✅ Дела</div>';
        pendingTodos.forEach(t => {
            html += `
                <div class="today-item">
                    <span class="today-item-name">${t.text}</span>
                    <div class="todo-check" onclick="quickToggleTodayTodo(${t.id})"></div>
                </div>`;
        });
    }
    container.innerHTML = html;
}

function quickMarkSportDone(id) {
    toggleSportDoneById(id);
    renderSportList();
    renderSCalendar();
    renderProfile();
}

function quickToggleTodayTodo(id) {
    toggleTodoItem(id, getToday());
    renderTodayWidget();
}
