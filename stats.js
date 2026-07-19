// ============================================================
// СТАТИСТИКА - ОТОБРАЖЕНИЕ ЗДОРОВЬЯ
// ============================================================

function renderProfileHealth() {
    const totalHealth = data.totalHealth || 0;
    const totalHealthCap = getTotalHealthCap();
    const isStrict = data.sportMode === 'strict';
    
    document.getElementById('profileHealthStatus').textContent = isStrict ? '🔥 Строгий режим' : '😊 Лёгкий режим';
    document.getElementById('profileTotalHealthNum').textContent = totalHealth;
    
    // Круговой индикатор всегда показывает общий банк HP (валюту на балансе) —
    // это НЕ меняется в строгом режиме, т.к. строгий HP тратится отдельно
    // и уже виден в углу экрана / на вкладке "Спорт".
    const gauge = document.getElementById('healthGauge');
    const gaugeValue = document.getElementById('healthGaugeValue');
    const gaugeLabel = document.getElementById('healthGaugeLabel');
    const percent = totalHealthCap > 0 ? Math.max(0, Math.min(100, (totalHealth / totalHealthCap) * 100)) : 0;
    gauge.style.setProperty('--gauge-deg', (percent * 3.6) + 'deg');
    gauge.style.setProperty('--gauge-color', '#82b1ff');
    gaugeValue.textContent = `${totalHealth}`;
    gaugeLabel.textContent = `из ${totalHealthCap} HP`;
    
    if (isStrict && data.strictHealth <= 0) {
        document.getElementById('healthWarning').style.display = 'block';
    } else {
        document.getElementById('healthWarning').style.display = 'none';
    }
    
    renderHeartHistory();
}

// История и статистика потерянных/полученных сердец строгого режима.
// Живёт в отдельной модалке (открывается по кнопке), а не как всегда
// растущий список в профиле — иначе при долгой игре экран растягивался бы.
function renderHeartHistory() {
    const log = data.strictHealthLog || [];
    
    if (log.length === 0) {
        document.getElementById('heartHistoryStats').innerHTML = '';
        document.getElementById('heartHistoryHighlight').style.display = 'none';
        document.getElementById('heartHistoryList').innerHTML = '<div class="empty-state">Пока пусто — история появится, как только ты войдёшь в строгий режим и пройдёт хотя бы один день.</div>';
        return;
    }
    
    let totalLost = 0, totalGained = 0, lossDays = 0, bonusCount = 0;
    let biggestLoss = null;
    const reasonCategoryCounts = {};
    const reasonCategoryLabels = { '💪': 'спорт', '🔄': 'привычки', '✅': 'дела' };
    
    log.forEach(e => {
        if (e.type === 'loss') {
            totalLost += e.amount; lossDays++;
            if (!biggestLoss || e.amount > biggestLoss.amount) biggestLoss = e;
            (e.reasons || []).forEach(r => {
                const key = r.split(' ')[0];
                reasonCategoryCounts[key] = (reasonCategoryCounts[key] || 0) + 1;
            });
        }
        else if (e.type === 'gain') { totalGained += e.amount; }
        else if (e.type === 'bonus') { totalGained += e.amount; bonusCount++; }
    });
    
    let topReasonKey = null, topReasonCount = 0;
    for (const key in reasonCategoryCounts) {
        if (reasonCategoryCounts[key] > topReasonCount) { topReasonCount = reasonCategoryCounts[key]; topReasonKey = key; }
    }
    
    document.getElementById('heartHistoryStats').innerHTML = `
        <div class="heart-stat-item"><div class="num red">-${totalLost.toFixed(1)}</div><div class="lbl">💔 Потеряно всего</div></div>
        <div class="heart-stat-item"><div class="num green">+${totalGained.toFixed(1)}</div><div class="lbl">❤️ Получено всего</div></div>
        <div class="heart-stat-item"><div class="num red">${lossDays}</div><div class="lbl">📉 Дней с провалом</div></div>
        <div class="heart-stat-item"><div class="num gold">${bonusCount}</div><div class="lbl">🏆 Бонусов за серию</div></div>
    `;
    
    const highlightEl = document.getElementById('heartHistoryHighlight');
    const highlightParts = [];
    if (biggestLoss) highlightParts.push(`📉 Худший день: ${formatDate(biggestLoss.date)} (-${biggestLoss.amount.toFixed(1)} HP)`);
    if (topReasonKey) highlightParts.push(`🎯 Чаще всего теряешь из-за: ${reasonCategoryLabels[topReasonKey] || topReasonKey} (${topReasonCount}×)`);
    if (highlightParts.length) {
        highlightEl.style.display = 'block';
        highlightEl.textContent = highlightParts.join('   ·   ');
    } else {
        highlightEl.style.display = 'none';
    }
    
    renderHeartHistoryList(currentHeartHistoryFilter);
}

let currentHeartHistoryFilter = 'all';

function renderHeartHistoryList(filter) {
    currentHeartHistoryFilter = filter;
    const log = data.strictHealthLog || [];
    const filtered = filter === 'all' ? log : log.filter(e => filter === 'loss' ? e.type === 'loss' : e.type !== 'loss');
    
    if (filtered.length === 0) {
        document.getElementById('heartHistoryList').innerHTML = '<div class="empty-state">Ничего нет в этой категории</div>';
        return;
    }
    
    const historyHtml = filtered.slice(0, 60).map(e => {
        const isLoss = e.type === 'loss';
        const icon = isLoss ? '💔' : (e.type === 'bonus' ? '🏆' : '❤️');
        const cls = isLoss ? 'loss' : 'gain';
        const sign = isLoss ? '-' : '+';
        const reasonsHtml = e.reasons && e.reasons.length
            ? e.reasons.map(r => `<div class="heart-history-reason">${r}</div>`).join('')
            : '<div class="heart-history-reason">—</div>';
        return `
            <div class="heart-history-item ${cls}">
                <div class="heart-history-top">
                    <span class="heart-history-date">${formatDate(e.date)}</span>
                    <span class="heart-history-amount ${cls}">${icon} ${sign}${e.amount.toFixed(1)} HP</span>
                </div>
                ${reasonsHtml}
            </div>
        `;
    }).join('');
    document.getElementById('heartHistoryList').innerHTML = historyHtml;
}

function openHeartHistoryModal() {
    currentHeartHistoryFilter = 'all';
    document.querySelectorAll('.hh-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.hhfilter === 'all'));
    renderHeartHistory();
    document.getElementById('heartHistoryModal').classList.add('active');
}
function closeHeartHistoryModal() { document.getElementById('heartHistoryModal').classList.remove('active'); }
function openHeartsInfoModal() { document.getElementById('heartsInfoModal').classList.add('active'); }
function closeHeartsInfoModal() { document.getElementById('heartsInfoModal').classList.remove('active'); }

document.getElementById('openHeartHistoryBtn').addEventListener('click', openHeartHistoryModal);
document.getElementById('heartHistoryCloseBtn').addEventListener('click', closeHeartHistoryModal);
document.querySelectorAll('.hh-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.hh-filter-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        renderHeartHistoryList(this.dataset.hhfilter);
    });
});
document.getElementById('openHeartsInfoBtn').addEventListener('click', openHeartsInfoModal);
document.getElementById('healthGauge').addEventListener('click', openHeartsInfoModal);
document.getElementById('heartsInfoCloseBtn').addEventListener('click', closeHeartsInfoModal);

// ============================================================
// СТАТИСТИКА - ОБЩАЯ
// ============================================================

function renderProfile() {
    renderTodayWidget();
    const levelInfo = getLevel(data.exp);
    const needed = levelInfo.needed;
    const currentExp = levelInfo.currentExp;
    const percent = needed > 0 ? (currentExp / needed) * 100 : 0;
    document.getElementById('profileLevel').textContent = levelInfo.level;
    const rankEl = document.getElementById('profileRank');
    if (rankEl) rankEl.textContent = getRankTitle(levelInfo.level);
    document.getElementById('profileExpBar').style.width = Math.min(percent, 100) + '%';
    document.getElementById('profileExpText').textContent = `${Math.floor(currentExp)} / ${needed} XP`;
    document.getElementById('profileTotalExp').textContent = Math.floor(data.exp);
    document.getElementById('profileExpToNext').textContent = needed - Math.floor(currentExp);
    
    const totalAchievements = data.achievements ? data.achievements.length : 0;
    const totalNotes = data.notes ? data.notes.length : 0;
    let totalTodos = 0;
    if (data.todoDays) {
        for (const date in data.todoDays) {
            if (data.todoDays[date]) totalTodos += data.todoDays[date].filter(t => t.done).length;
        }
    }
    const sportStreak = calculateSportStreak();
    let habitStreak = 0;
    for (const habit of data.habits) {
        const s = calcHabitStreak(habit);
        if (s > habitStreak) habitStreak = s;
    }
    document.getElementById('profileStreak').textContent = sportStreak + habitStreak;
    document.getElementById('profileSportStreak').textContent = sportStreak;
    document.getElementById('profileHabitStreak').textContent = habitStreak;
    document.getElementById('profileAchievements').textContent = totalAchievements;
    document.getElementById('profileNotes').textContent = totalNotes;
    document.getElementById('profileTodos').textContent = totalTodos;
    
    renderProfileHealth();
    
    document.getElementById('profileBestStreak').textContent = data.strictBestStreak || 0;
    document.getElementById('profileStrictDays').textContent = data.strictDaysCount || 0;
    const left = getRestDaysLeft();
    document.getElementById('profileRestDaysLeft').textContent = left !== null ? left : '-';
    
    const sources = data.expSources || { sport: 0, habits: 0, achievements: 0, notes: 0, todos: 0, streak: 0 };
    const maxSource = Math.max(
        sources.sport || 0,
        sources.habits || 0,
        sources.achievements || 0,
        sources.notes || 0,
        sources.todos || 0,
        sources.streak || 0,
        1
    );
    
    const expSourcesHtml = `
        <div class="exp-sources-chart">
            <div class="exp-source-row">
                <span class="label">💪 Спорт</span>
                <div class="bar-bg"><div class="bar-fill sport" style="width:${((sources.sport || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.sport || 0)}</span>
            </div>
            <div class="exp-source-row">
                <span class="label">🔄 Привычки</span>
                <div class="bar-bg"><div class="bar-fill habits" style="width:${((sources.habits || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.habits || 0)}</span>
            </div>
            <div class="exp-source-row">
                <span class="label">🏆 Успехи</span>
                <div class="bar-bg"><div class="bar-fill achievements" style="width:${((sources.achievements || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.achievements || 0)}</span>
            </div>
            <div class="exp-source-row">
                <span class="label">📝 Рефлексия</span>
                <div class="bar-bg"><div class="bar-fill notes" style="width:${((sources.notes || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.notes || 0)}</span>
            </div>
            <div class="exp-source-row">
                <span class="label">✅ Дела</span>
                <div class="bar-bg"><div class="bar-fill todos" style="width:${((sources.todos || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.todos || 0)}</span>
            </div>
            <div class="exp-source-row">
                <span class="label">🔥 Бонус серий</span>
                <div class="bar-bg"><div class="bar-fill streak" style="width:${((sources.streak || 0) / maxSource) * 100}%;"></div></div>
                <span class="bar-value">${Math.floor(sources.streak || 0)}</span>
            </div>
        </div>
    `;
    document.getElementById('profileExpSources').innerHTML = expSourcesHtml;
    
    renderStatsChart();
    renderHeatmap();
}

function renderStatsChart() {
    const container = document.getElementById('profileStatsChart');
    const tab = currentStatTab;
    
    const today = new Date();
    let doneCount = 0, missedCount = 0, pendingCount = 0;
    let totalDays = 0;
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
        let status = 'empty';
        
        if (tab === 'all' || tab === 'sport') {
            for (const sport of data.sports) {
                const s = getSportStatusForDate(sport, dateStr);
                if (s === 'done') { status = 'done'; break; }
                else if (s === 'missed') status = 'failed';
            }
        }
        if ((tab === 'all' || tab === 'habits') && status === 'empty') {
            for (const habit of data.habits) {
                const s = getHabitStatusForDate(habit, dateStr);
                if (s === 'success' || s === 'completed') { status = 'done'; break; }
                else if (s === 'failed') status = 'failed';
                else if (s === 'pending') status = 'pending';
            }
        }
        if ((tab === 'all' || tab === 'todo') && status === 'empty') {
            if (data.todoDays && data.todoDays[dateStr]) {
                if (data.todoDays[dateStr].some(t => t.done)) status = 'done';
            }
        }
        if ((tab === 'all' || tab === 'notes') && status === 'empty') {
            if (data.notes && data.notes.some(n => n.date === dateStr)) {
                status = 'done';
            }
        }
        if ((tab === 'all' || tab === 'achievements') && status === 'empty') {
            if (data.achievements && data.achievements.some(a => a.date === dateStr)) {
                status = 'done';
            }
        }
        
        totalDays++;
        if (status === 'done') doneCount++;
        else if (status === 'failed') missedCount++;
        else if (status === 'pending') pendingCount++;
    }
    
    const doneDeg = (doneCount / totalDays) * 360;
    const missedDeg = (missedCount / totalDays) * 360 + doneDeg;
    const pendingDeg = (pendingCount / totalDays) * 360 + missedDeg;
    
    const chartHtml = `
        <div class="stats-pie-container">
            <div class="pie-chart" style="--done-deg: ${doneDeg}deg; --missed-deg: ${missedDeg}deg; --pending-deg: ${pendingDeg}deg;"></div>
            <div class="pie-legend">
                <div class="item"><span class="color green"></span> Выполнено: <span class="value">${doneCount}</span></div>
                <div class="item"><span class="color red"></span> Пропущено: <span class="value">${missedCount}</span></div>
                <div class="item"><span class="color yellow"></span> В процессе: <span class="value">${pendingCount}</span></div>
                <div class="item"><span class="color gray"></span> Неактивно: <span class="value">${totalDays - doneCount - missedCount - pendingCount}</span></div>
            </div>
        </div>
        <div class="stats-numbers">
            <div class="num-item"><div class="num green">${doneCount}</div><div class="lbl">✅ Выполнено</div></div>
            <div class="num-item"><div class="num red">${missedCount}</div><div class="lbl">❌ Пропущено</div></div>
            <div class="num-item"><div class="num gold">${pendingCount}</div><div class="lbl">🟡 В процессе</div></div>
            <div class="num-item"><div class="num blue">${totalDays}</div><div class="lbl">📅 Всего дней</div></div>
        </div>
    `;
    
    container.innerHTML = chartHtml;
}

document.querySelectorAll('.st-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.st-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentStatTab = this.dataset.stat;
        renderStatsChart();
        renderHeatmap();
    });
});

