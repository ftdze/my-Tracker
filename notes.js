// ============================================================
// ЗАМЕТКИ
// ============================================================

function renderNotes() {
    const container = document.getElementById('notesList');
    let notes = [...(data.notes || [])];
    if (sortMode === 'date') notes.sort((a, b) => b.date.localeCompare(a.date));
    else if (sortMode === 'name') notes.sort((a, b) => a.title.localeCompare(b.title));
    if (!notes.length) { container.innerHTML = '<div class="empty-state">Нет заметок</div>'; }
    else {
        let html = '';
        for (const note of notes) {
            const preview = note.text.length > 100 ? note.text.substring(0, 100) + '...' : note.text;
            html += `<div class="list-item" onclick="openNoteModal(${note.id})">
                <div style="flex:1;min-width:0;">
                    <div class="name">${note.title}</div>
                    <div class="meta">${formatDate(note.date)}</div>
                    <div style="font-size:13px;color:#8a94a6;margin-top:4px;word-wrap:break-word;white-space:pre-wrap;max-height:40px;overflow:hidden;text-overflow:ellipsis;">${preview}</div>
                </div>
                <div class="actions"><button class="btn-sm blue" onclick="event.stopPropagation(); openNoteModal(${note.id})">✏️ Редактировать</button></div>
            </div>`;
        }
        container.innerHTML = html;
    }
    renderNCalendar();
}

function openNoteModal(id) {
    const note = data.notes.find(n => n.id === id);
    if (!note) return;
    editingNoteId = id;
    document.getElementById('noteModalTitle').textContent = note.title;
    document.getElementById('noteModalDate').textContent = formatDate(note.date);
    document.getElementById('noteModalText').value = note.text;
    document.getElementById('noteModalDeleteBtn').onclick = function() {
        if (confirm('Удалить заметку?')) {
            data.notes = data.notes.filter(n => n.id !== id);
            save();
            closeNoteModal();
            renderNotes();
        }
    };
    document.getElementById('noteModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeNoteModal() {
    document.getElementById('noteModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    editingNoteId = null;
}

function saveNoteModal() {
    if (editingNoteId === null) return;
    const note = data.notes.find(n => n.id === editingNoteId);
    if (!note) return;
    const newText = document.getElementById('noteModalText').value.trim();
    if (!newText) { alert('Текст не может быть пустым!'); return; }
    note.text = newText;
    save();
    closeNoteModal();
    renderNotes();
}

function addNote() {
    const date = document.getElementById('noteDate').value;
    const title = document.getElementById('noteTitle').value.trim();
    const text = document.getElementById('noteText').value.trim();
    if (!date || !title) { alert('Заполни дату и заголовок!'); return; }
    if (!text) { alert('Заполни текст!'); return; }
    data.notes.push({ id: Date.now() + Math.random(), date, title, text });
    addExp(getExpForActivity('note', 1), 'notes');
    save();
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteText').value = '';
    document.getElementById('noteDate').value = getToday();
    renderNotes();
}

function renderNCalendar() {
    const grid = document.getElementById('nCalendar');
    const label = document.getElementById('nMonthLabel');
    label.textContent = getMonthName(nMonth) + ' ' + nYear;
    grid.innerHTML = '';
    const daysInMonth = getDaysInMonth(nYear, nMonth);
    const offset = getFirstDayOffset(nYear, nMonth);
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
        const dateStr = nYear + '-' + String(nMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
        const el = document.createElement('div');
        el.className = 'calendar-day';
        el.textContent = d;
        if (dateStr === today) el.classList.add('today');
        const hasNote = data.notes ? data.notes.some(n => n.date === dateStr) : false;
        if (hasNote) {
            el.classList.add('has-note');
            el.style.cursor = 'pointer';
            el.addEventListener('click', () => {
                const notes = data.notes.filter(n => n.date === dateStr);
                if (notes.length === 1) openNoteModal(notes[0].id);
                else {
                    let msg = '📝 Заметки на ' + formatDate(dateStr) + ':\n\n';
                    notes.forEach(n => { msg += '📌 ' + n.title + '\n' + n.text.substring(0, 100) + (n.text.length > 100 ? '...' : '') + '\n\n'; });
                    alert(msg);
                }
            });
        }
        grid.appendChild(el);
    }
}

document.getElementById('noteAddBtn').addEventListener('click', addNote);
document.getElementById('sortDate').addEventListener('click', () => { sortMode = 'date'; renderNotes(); });
document.getElementById('sortName').addEventListener('click', () => { sortMode = 'name'; renderNotes(); });
document.getElementById('nPrevMonth').addEventListener('click', () => { nMonth--; if (nMonth < 0) { nMonth = 11; nYear--; } renderNCalendar(); });
document.getElementById('nNextMonth').addEventListener('click', () => { nMonth++; if (nMonth > 11) { nMonth = 0; nYear++; } renderNCalendar(); });

