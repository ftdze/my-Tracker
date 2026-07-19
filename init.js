// ============================================================
// ПРОВЕРКА УРОВНЕЙ ПРИ ЗАГРУЗКЕ - ТОЛЬКО СИНХРОНИЗАЦИЯ
// ============================================================

function checkLevelUpOnLoad() {
    const levelInfo = getLevel(data.exp);
    if (levelInfo.level > data.level) {
        data.level = levelInfo.level;
        save();
    }
    if (!data.shownLevels.includes(levelInfo.level) && levelInfo.level > 1) {
        const reward = getLevelUpReward(levelInfo.level);
        data.shownLevels.push(levelInfo.level);
        save();
        setTimeout(() => showLevelUp(levelInfo.level, reward.text), 500);
    }
}

// ============================================================
// ОБЩИЙ РЕНДЕР
// ============================================================

function renderAll() {
    document.getElementById('headerDate').textContent = formatDate(getToday());
    if (data.sportMode === 'strict' && data.strictStartDate) {
        updateStrictHealth();
    }
    renderHabits();
    renderSportList();
    renderSCalendar();
    renderAchievements();
    renderNotes();
    renderTodos();
    renderShop();
    renderProfile();
    applyEquippedTheme();
    updateStrictInfo();
    
    const mode = getSportMode();
    document.getElementById('sModeEasy').classList.toggle('active', mode === 'easy');
    document.getElementById('sModeStrict').classList.toggle('active', mode === 'strict');
    document.getElementById('sModeHint').textContent = mode === 'easy' ? '😊 Лёгкий режим: пропущенные дни не отмечаются' : '🔥 Строгий режим: пропущенные дни отмечаются красным';
    
    const indicator = document.getElementById('headerModeIndicator');
    if (mode === 'strict') {
        indicator.className = 'mode-indicator strict header-mode-indicator';
        indicator.textContent = '🔥 Строгий';
    } else {
        indicator.className = 'mode-indicator easy header-mode-indicator';
        indicator.textContent = '😊 Лёгкий';
    }

    document.body.classList.toggle('theme-strict', mode === 'strict' && data.strictThemeEnabled !== false);
    
    updateStrictInfo();
}

function updateStrictInfo() {
    const isStrict = data.sportMode === 'strict' && !!data.strictStartDate;
    if (isStrict) {
        document.getElementById('ghpStartDate').textContent = formatDate(data.strictStartDate);
        document.getElementById('ghpStreak').textContent = data.strictStreak || 0;
        const left = getRestDaysLeft();
        const restEl = document.getElementById('ghpRestLeft');
        restEl.textContent = left !== null ? left : '-';
        restEl.className = (left !== null && left <= 2) ? 'highlight danger' : 'highlight';
    } else {
        document.getElementById('globalHpPopover').style.display = 'none';
    }
    renderStrictHpWidgets();
}

// ============================================================
// ОБРАБОТКА РАЗМЕРА ДЛЯ HTML2EXE
// ============================================================

let resizeTimeout = null;

function forceResize() {
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        const current = viewport.content;
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.5';
        setTimeout(() => {
            viewport.content = current || 'width=device-width, initial-scale=1.0';
        }, 100);
    }
    renderAll();
}

window.addEventListener('resize', function() {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
        forceResize();
        resizeTimeout = null;
    }, 300);
});

document.getElementById('globalHpBadge').addEventListener('click', function(e) {
    e.stopPropagation();
    const popover = document.getElementById('globalHpPopover');
    popover.style.display = popover.style.display === 'block' ? 'none' : 'block';
});
document.getElementById('ghpGoToSportBtn').addEventListener('click', function() {
    document.getElementById('globalHpPopover').style.display = 'none';
    switchToTab('sport');
});
document.getElementById('ghpHeartsInfoBtn').addEventListener('click', function() {
    document.getElementById('globalHpPopover').style.display = 'none';
    openHeartsInfoModal();
});
document.addEventListener('click', function(e) {
    const popover = document.getElementById('globalHpPopover');
    const badge = document.getElementById('globalHpBadge');
    if (popover.style.display === 'block' && !popover.contains(e.target) && !badge.contains(e.target)) {
        popover.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(forceResize, 500);
});

document.addEventListener('wheel', function(e) {
    if (e.ctrlKey || e.metaKey) e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', function(e) {
    e.preventDefault();
});

// ============================================================
// ЗАПУСК
// ============================================================

if (data.habits && data.habits.length > 0 && !selectedHabitId) {
    selectedHabitId = data.habits[0].id;
}
if (data.sports && data.sports.length > 0 && !selectedSportId) {
    selectedSportId = data.sports[0].id;
}

document.getElementById('noteDate').value = getToday();
document.getElementById('hStartDate').value = getToday();
document.getElementById('hStartTime').value = getNowTime();
document.getElementById('achDate').value = getToday();
document.getElementById('strictStartDateInput').min = getToday();
document.getElementById('strictStartDateInput').value = getToday();

checkLevelUpOnLoad();
applyEquippedTheme();
renderAll();

console.log('✅ Трекер запущен!');
console.log('📊 Уровень:', data.level, 'Опыт:', data.exp);
console.log('❤️ Здоровье на балансе:', data.totalHealth);
if (data.sportMode === 'strict') {
    console.log('🔥 Строгий режим: HP', data.strictHealth, '/', data.strictMaxHealth);
}
