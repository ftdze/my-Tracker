// ============================================================
// УСПЕХИ
// ============================================================

function toggleAchievementSelection(id) {
    if (selectedAchievementIds.has(id)) selectedAchievementIds.delete(id);
    else selectedAchievementIds.add(id);
    renderAchievements();
}

function selectAllAchievements() { (data.achievements || []).forEach(a => selectedAchievementIds.add(a.id)); renderAchievements(); }
function deselectAllAchievements() { selectedAchievementIds.clear(); renderAchievements(); }
function updateAchievementSelectedCount() {
    const el = document.getElementById('achSelectedCount');
    if (el) el.textContent = `Выбрано: ${selectedAchievementIds.size}`;
}

function deleteSelectedAchievements() {
    const ids = Array.from(selectedAchievementIds);
    if (ids.length === 0) { alert('Выберите успехи!'); return; }
    if (!confirm(`Удалить ${ids.length} успех(ов)?`)) return;
    data.achievements = data.achievements.filter(a => !selectedAchievementIds.has(a.id));
    selectedAchievementIds.clear();
    save();
    renderAchievements();
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!data.achievements || !data.achievements.length) {
        container.innerHTML = '<div class="empty-state">Добавь свои достижения</div>';
    } else {
        let html = '';
        for (const ach of data.achievements) {
            const isSelected = selectedAchievementIds.has(ach.id);
            html += `<div class="list-item" onclick="toggleAchievementSelection(${ach.id})">
                <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                    <div class="todo-check ${isSelected ? 'done' : ''}" onclick="event.stopPropagation(); toggleAchievementSelection(${ach.id})" style="width:20px;height:20px;font-size:10px;flex-shrink:0;">${isSelected ? '✓' : ''}</div>
                    <span class="name" onclick="event.stopPropagation(); showAchievementNote(${ach.id})">✅ ${ach.name}</span>
                </div>
                <div class="actions" onclick="event.stopPropagation();">
                    <span class="meta">${formatDate(ach.date)}</span>
                    <button class="btn-sm danger" onclick="deleteAchievement(${ach.id})">✕</button>
                </div>
            </div>`;
        }
        container.innerHTML = html;
    }
    updateAchievementSelectedCount();
    renderACalendar();
}

function addAchievement() {
    const input = document.getElementById('achInput');
    const name = input.value.trim();
    const date = document.getElementById('achDate').value || getToday();
    if (!name) { alert('Введите название!'); return; }
    const note = prompt('Комментарий (необязательно):');
    data.achievements.push({ id: Date.now() + Math.random(), name, date, note: note || '' });

    // Опыт за успехи начисляется не больше одного раза в реальный день
    // (по дате добавления, а не по дате самого успеха) — иначе можно
    // бесконечно добавлять случайные достижения и качать опыт без ограничений.
    const today = getToday();
    if (data.lastAchievementExpDate !== today) {
        addExp(getExpForActivity('achievement', 1), 'achievements');
        data.lastAchievementExpDate = today;
    } else {
        alert('🏆 Успех добавлен! Опыт за успехи сегодня уже получен — следующий будет доступен завтра.');
    }

    save();
    input.value = '';
    renderAchievements();
}

function showAchievementNote(id) {
    const ach = data.achievements.find(a => a.id === id);
    if (!ach) return;
    alert(`🏆 ${ach.name}\n📅 ${formatDate(ach.date)}${ach.note ? '\n📝 ' + ach.note : ''}`);
}

function deleteAchievement(id) {
    if (!confirm('Удалить успех?')) return;
    data.achievements = data.achievements.filter(a => a.id !== id);
    selectedAchievementIds.delete(id);
    save();
    renderAchievements();
}

function renderACalendar() {
    const grid = document.getElementById('aCalendar');
    const label = document.getElementById('aMonthLabel');
    label.textContent = getMonthName(aMonth) + ' ' + aYear;
    grid.innerHTML = '';
    const daysInMonth = getDaysInMonth(aYear, aMonth);
    const offset = getFirstDayOffset(aYear, aMonth);
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
        const dateStr = aYear + '-' + String(aMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const el = document.createElement('div');
        el.className = 'calendar-day';
        const dayAchievements = data.achievements ? data.achievements.filter(a => a.date === dateStr) : [];
        if (dayAchievements.length > 0) {
            el.classList.add('ach-has');
            el.style.cursor = 'pointer';
            const numEl = document.createElement('span');
            numEl.className = 'day-number';
            numEl.textContent = d;
            el.appendChild(numEl);
            const countEl = document.createElement('span');
            countEl.className = 'ach-icon';
            countEl.textContent = '🏆×' + dayAchievements.length;
            el.appendChild(countEl);
            el.addEventListener('click', () => {
                const list = dayAchievements.map(a => '✅ ' + a.name + (a.note ? ' — ' + a.note : '')).join('\n');
                alert('🏆 Достижения за ' + formatDate(dateStr) + ':\n\n' + list);
            });
        } else {
            el.classList.add('ach-empty');
            const numEl = document.createElement('span');
            numEl.className = 'day-number';
            numEl.textContent = d;
            el.appendChild(numEl);
        }
        if (dateStr === today) el.classList.add('today');
        grid.appendChild(el);
    }
}

document.getElementById('achAddBtn').addEventListener('click', addAchievement);
document.getElementById('achInput').addEventListener('keydown', e => { if (e.key === 'Enter') addAchievement(); });
document.getElementById('aPrevMonth').addEventListener('click', () => { aMonth--; if (aMonth < 0) { aMonth = 11; aYear--; } renderACalendar(); });
document.getElementById('aNextMonth').addEventListener('click', () => { aMonth++; if (aMonth > 11) { aMonth = 0; aYear++; } renderACalendar(); });
document.getElementById('achSelectAllBtn').addEventListener('click', selectAllAchievements);
document.getElementById('achDeselectAllBtn').addEventListener('click', deselectAllAchievements);
document.getElementById('achDeleteSelectedBtn').addEventListener('click', deleteSelectedAchievements);

