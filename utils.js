// ============================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================

function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('Не удалось сохранить данные трекера:', e);
        alert('⚠️ Не удалось сохранить данные (возможно, закончилось место в хранилище).');
    }
}

function getToday() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function getNowTime() {
    const d = new Date();
    return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getMonthName(m) {
    return ['Январь','Февраль','Март','Апрель','Май','Июнь',
            'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][m];
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOffset(year, month) {
    const day = new Date(year, month, 1).getDay();
    return (day === 0) ? 6 : day - 1;
}

function isFutureDate(dateStr) {
    return dateStr > getToday();
}

function isTodayOrFuture(dateStr) {
    return dateStr >= getToday();
}

// Полный сброс приложения — стирает сохранение (включая старые версионные
// ключи вида tracker_data_final_vNN, из-за которых сброс раньше "откатывался"
// к старому прогрессу вместо чистого листа) и перезапускает трекер с нуля.
function resetAllData() {
    if (!confirm('⚠️ Это удалит АБСОЛЮТНО ВСЁ: привычки, спорт, дела, заметки, достижения, весь прогресс и покупки в магазине.\n\nОтменить это действие будет нельзя. Продолжить?')) return;
    if (!confirm('Точно-точно? Последнее предупреждение — данные будут потеряны навсегда.')) return;
    try {
        localStorage.removeItem(STORAGE_KEY);
        // Стираем и все старые версионные ключи, иначе findLegacySave()
        // при следующей загрузке подхватит один из них вместо чистого состояния.
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && LEGACY_KEY_PATTERN.test(key)) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (e) {
        console.error('Не удалось стереть данные трекера:', e);
    }
    location.reload();
}

