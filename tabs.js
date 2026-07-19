// ============================================================
// ВКЛАДКИ
// ============================================================

const TOGGLEABLE_TABS = [
    { key: 'habits', label: '🔄 Привычки' },
    { key: 'sport', label: '💪 Спорт' },
    { key: 'achievements', label: '🏆 Успехи' },
    { key: 'notes', label: '📝 Заметки' },
    { key: 'todo', label: '✅ Дела' },
    { key: 'shop', label: '🛒 Магазин' }
];

function isTabEnabled(key) {
    if (!data.enabledTabs) return true;
    return data.enabledTabs[key] !== false;
}

function renderForTab(tabKey) {
    if (tabKey === 'sport') { renderSportList(); renderSCalendar(); }
    else if (tabKey === 'habits') { renderHabits(); renderHabitDetail(); }
    else if (tabKey === 'achievements') { renderAchievements(); }
    else if (tabKey === 'notes') { renderNotes(); }
    else if (tabKey === 'todo') { renderTodos(); }
    else if (tabKey === 'shop') { renderShop(); }
    else if (tabKey === 'profile') { renderProfile(); }
}

function switchToTab(tabKey) {
    document.querySelectorAll('.tab-btn, .tab-btn-profile').forEach(b => b.classList.remove('active'));
    const btn = document.querySelector(`[data-tab="${tabKey}"]`);
    if (btn) btn.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(tabKey);
    if (target) target.classList.add('active');
    renderForTab(tabKey);
}

// Скрывает/показывает кнопки вкладок согласно настройкам. Если отключённая
// вкладка была активной — переключает на «Профиль» (её отключить нельзя).
function applyTabVisibility() {
    let activeKey = null;
    const activeBtn = document.querySelector('.tab-btn.active, .tab-btn-profile.active');
    if (activeBtn) activeKey = activeBtn.dataset.tab;

    TOGGLEABLE_TABS.forEach(t => {
        const btn = document.querySelector(`.tab-btn[data-tab="${t.key}"]`);
        if (!btn) return;
        btn.style.display = isTabEnabled(t.key) ? '' : 'none';
    });

    if (activeKey && activeKey !== 'profile' && !isTabEnabled(activeKey)) {
        switchToTab('profile');
    }
}

document.querySelectorAll('.tab-btn, .tab-btn-profile').forEach(btn => {
    btn.addEventListener('click', function() {
        switchToTab(this.dataset.tab);
    });
});

applyTabVisibility();
