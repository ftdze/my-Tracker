// ============================================================
// СПИСОК ДЕЛ
// ============================================================

function renderTodos() {
    renderTodoTemplates();
    renderTodoCalendar();
    renderTodoDay();
}

function renderTodoTemplates() {
    const container = document.getElementById('todoTemplates');
    if (!data.todoTemplates || data.todoTemplates.length === 0) {
        container.innerHTML = '<div class="empty-state">Шаблон пуст</div>';
        return;
    }
    let html = '';
    for (const t of data.todoTemplates) {
        html += `<span class="template-tag clickable" onclick="addSingleTemplateToDay(${t.id})" title="Добавить это дело на выбранный день">➕ ${t.text} <span class="remove" onclick="event.stopPropagation(); removeTemplate(${t.id})">✕</span></span>`;
    }
    container.innerHTML = html;
}

// Добавляет ОДНО конкретное дело из шаблона в текущий выбранный день
// (в отличие от "Применить шаблон", который добавляет сразу все дела списком).
function addSingleTemplateToDay(templateId) {
    const template = data.todoTemplates && data.todoTemplates.find(t => t.id === templateId);
    if (!template) return;
    if (!selectedTodoDate) { alert('Сначала выбери день в календаре снизу!'); return; }
    if (!data.todoDays) data.todoDays = {};
    if (!data.todoDays[selectedTodoDate]) data.todoDays[selectedTodoDate] = [];
    if (data.todoDays[selectedTodoDate].some(t => t.text === template.text)) {
        alert('Это дело уже есть в этом дне!');
        return;
    }
    data.todoDays[selectedTodoDate].push({ id: Date.now() + Math.random(), text: template.text, done: false });
    addExp(2, 'todos');
    save();
    renderTodoDay();
    renderTodoCalendar();
}

function addTemplate() {
    const input = document.getElementById('todoTemplateInput');
    const text = input.value.trim();
    if (!text) return;
    if (!data.todoTemplates) data.todoTemplates = [];
    if (data.todoTemplates.some(t => t.text.toLowerCase() === text.toLowerCase())) {
        alert('❌ Такое дело уже есть в шаблоне!');
        return;
    }
    data.todoTemplates.push({ id: Date.now() + Math.random(), text });
    input.value = '';
    save();
    renderTodoTemplates();
}

function removeTemplate(id) {
    data.todoTemplates = data.todoTemplates.filter(t => t.id !== id);
    save();
    renderTodoTemplates();
}

function renderTodoCalendar() {
    const grid = document.getElementById('todoCalendar');
    const label = document.getElementById('todoMonthLabel');
    label.textContent = getMonthName(todoMonth) + ' ' + todoYear;
    grid.innerHTML = '';
    const daysInMonth = getDaysInMonth(todoYear, todoMonth);
    const offset = getFirstDayOffset(todoYear, todoMonth);
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
        const dateStr = todoYear + '-' + String(todoMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const el = document.createElement('div');
        el.className = 'calendar-day';
        const numSpan = document.createElement('span');
        numSpan.className = 'day-number';
        numSpan.textContent = d;
        el.appendChild(numSpan);
        
        if (dateStr === today) el.classList.add('todo-today');
        if (selectedTodoDate === dateStr) el.classList.add('todo-selected');
        
        const todos = data.todoDays && data.todoDays[dateStr] ? data.todoDays[dateStr] : [];
        const totalTodos = todos.length;
        const doneTodos = todos.filter(t => t.done).length;
        
        if (totalTodos > 0) {
            const percent = (doneTodos / totalTodos) * 100;
            if (percent === 100) {
                el.classList.add('todo-perfect');
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = '⭐';
                el.appendChild(badge);
            } else if (percent >= 75) {
                el.classList.add('todo-full');
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = `${doneTodos}/${totalTodos}`;
                el.appendChild(badge);
            } else if (percent >= 50) {
                el.classList.add('todo-high');
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = `${doneTodos}/${totalTodos}`;
                el.appendChild(badge);
            } else if (percent >= 25) {
                el.classList.add('todo-medium');
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = `${doneTodos}/${totalTodos}`;
                el.appendChild(badge);
            } else {
                el.classList.add('todo-low');
                const badge = document.createElement('span');
                badge.className = 'badge';
                badge.textContent = `${doneTodos}/${totalTodos}`;
                el.appendChild(badge);
            }
            el.classList.add('clickable');
        } else {
            el.classList.add('todo-none');
        }
        
        el.addEventListener('click', () => {
            selectedTodoDate = dateStr;
            document.getElementById('todoDayCard').style.display = 'block';
            document.getElementById('todoDayTitle').textContent = `📋 Дела на ${formatDate(dateStr)}`;
            renderTodoDay();
            renderTodoCalendar();
        });
        
        grid.appendChild(el);
    }
}

function renderTodoDay() {
    const container = document.getElementById('todoDayList');
    if (!selectedTodoDate) { container.innerHTML = '<div class="empty-state">Выбери день</div>'; return; }
    if (!data.todoDays) data.todoDays = {};
    if (!data.todoDays[selectedTodoDate]) data.todoDays[selectedTodoDate] = [];
    const items = data.todoDays[selectedTodoDate];
    if (items.length === 0) { container.innerHTML = '<div class="empty-state">Нет дел</div>'; return; }
    let html = '';
    for (const todo of items) {
        const isDone = todo.done || false;
        html += `<div class="list-item" onclick="toggleTodoItem(${todo.id}, '${selectedTodoDate}')">
            <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                <div class="todo-check ${isDone ? 'done' : ''}" onclick="event.stopPropagation(); toggleTodoItem(${todo.id}, '${selectedTodoDate}')" style="width:20px;height:20px;font-size:10px;flex-shrink:0;">${isDone ? '✓' : ''}</div>
                <span class="name ${isDone ? 'done' : ''}">${todo.text}</span>
            </div>
            <div class="actions" onclick="event.stopPropagation();">
                <button class="btn-sm danger" onclick="event.stopPropagation(); deleteTodoItem(${todo.id}, '${selectedTodoDate}')">✕</button>
            </div>
        </div>`;
    }
    container.innerHTML = html;
}

function toggleTodoItem(id, date) {
    if (!data.todoDays[date]) return;
    const todo = data.todoDays[date].find(t => t.id === id);
    if (!todo) return;
    const wasDone = todo.done;
    todo.done = !todo.done;
    // Опыт за конкретное дело начисляется только один раз за всё время,
    // а не при каждом переключении галочки — иначе можно было бесконечно
    // фармить опыт, кликая по одному и тому же чекбоксу туда-обратно.
    if (!wasDone && todo.done && !todo.expAwarded) {
        todo.expAwarded = true;
        addExp(getExpForActivity('todo', 1), 'todos');
        const todos = data.todoDays[date] || [];
        const doneTodos = todos.filter(t => t.done).length;
        const totalTodos = todos.length;
        if (totalTodos > 0) {
            const percent = (doneTodos / totalTodos) * 100;
            let bonusExp = 0;
            if (percent === 100) {
                bonusExp = 10;
            } else if (percent >= 75) {
                bonusExp = 5;
            } else if (percent >= 50) {
                bonusExp = 3;
            } else if (percent >= 25) {
                bonusExp = 1;
            }
            if (bonusExp > 0) addExp(bonusExp, 'todos');
        }
    }
    save();
    renderTodoDay();
    renderTodoCalendar();
}

function deleteTodoItem(id, date) {
    if (!confirm('Удалить дело?')) return;
    if (!data.todoDays[date]) return;
    data.todoDays[date] = data.todoDays[date].filter(t => t.id !== id);
    if (data.todoDays[date].length === 0) delete data.todoDays[date];
    save();
    renderTodoDay();
    renderTodoCalendar();
}

function closeTodoDay() {
    document.getElementById('todoDayCard').style.display = 'none';
    selectedTodoDate = null;
    renderTodoCalendar();
}

document.getElementById('todoTemplateAddBtn').addEventListener('click', addTemplate);
document.getElementById('todoTemplateInput').addEventListener('keydown', e => { if (e.key === 'Enter') addTemplate(); });
document.getElementById('todoDayAddBtn').addEventListener('click', function() {
    if (!selectedTodoDate) { alert('Выбери день!'); return; }
    const input = document.getElementById('todoDayInput');
    const text = input.value.trim();
    if (!text) return;
    if (!data.todoDays) data.todoDays = {};
    if (!data.todoDays[selectedTodoDate]) data.todoDays[selectedTodoDate] = [];
    data.todoDays[selectedTodoDate].push({ id: Date.now() + Math.random(), text, done: false });
    input.value = '';
    save();
    renderTodoDay();
    renderTodoCalendar();
});
document.getElementById('todoDayInput').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('todoDayAddBtn').click(); });
document.getElementById('todoCloseDayBtn').addEventListener('click', closeTodoDay);
document.getElementById('todoPrevMonth').addEventListener('click', () => { todoMonth--; if (todoMonth < 0) { todoMonth = 11; todoYear--; } closeTodoDay(); renderTodos(); });
document.getElementById('todoNextMonth').addEventListener('click', () => { todoMonth++; if (todoMonth > 11) { todoMonth = 0; todoYear++; } closeTodoDay(); renderTodos(); });

