// ============================================================
// СИСТЕМА ОПЫТА И УРОВНЕЙ
// ============================================================

function getExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.15, level - 1));
}

function getLevel(exp) {
    let level = 1;
    let needed = getExpForLevel(level);
    while (exp >= needed) {
        exp -= needed;
        level++;
        needed = getExpForLevel(level);
    }
    return { level, currentExp: exp, needed };
}

function getLevelUpReward(level) {
    const baseHp = 2;
    const bonusHp = Math.floor(level / 3);
    const hpReward = baseHp + bonusHp;
    let rewardText = `❤️ +${hpReward} HP`;
    let extraExp = 0;
    if (level % 5 === 0) {
        extraExp = level * 2;
        rewardText += ` + ${extraExp} XP бонус`;
    }
    if (level % 10 === 0) {
        const bonusHp2 = 3;
        rewardText += ` + ${bonusHp2} HP (юбилей!)`;
        return { hp: hpReward + bonusHp2, text: rewardText, extraExp: extraExp };
    }
    return { hp: hpReward, text: rewardText, extraExp: extraExp };
}

// ============================================================
// РАНГИ (для мотивации — уровень сам по себе просто число)
// ============================================================

const RANK_TITLES = [
    { min: 1,  title: '🌱 Новичок' },
    { min: 5,  title: '🔧 Практик' },
    { min: 10, title: '📐 Дисциплинированный' },
    { min: 15, title: '🔥 Упорный' },
    { min: 20, title: '🎯 Мастер привычек' },
    { min: 30, title: '🛡️ Ветеран' },
    { min: 40, title: '💎 Элита' },
    { min: 50, title: '👑 Легенда' }
];

function getRankTitle(level) {
    let title = RANK_TITLES[0].title;
    for (const r of RANK_TITLES) {
        if (level >= r.min) title = r.title;
        else break;
    }
    return title;
}

function getRankUpMessage(oldLevel, newLevel) {
    const oldRank = getRankTitle(oldLevel);
    const newRank = getRankTitle(newLevel);
    return oldRank !== newRank ? newRank : null;
}

// ============================================================
// СИСТЕМА ОПЫТА И УРОВНЕЙ (ГЛАВНАЯ ФУНКЦИЯ - ИСПРАВЛЕННАЯ)
// ============================================================

function addExp(amount, source) {
    if (amount <= 0) return;
    
    // Сохраняем старый уровень до добавления опыта
    const oldLevel = data.level;
    
    // Добавляем опыт
    data.exp += amount;
    if (!data.expSources) data.expSources = { sport: 0, habits: 0, achievements: 0, notes: 0, todos: 0, streak: 0 };
    if (data.expSources[source] !== undefined) data.expSources[source] += amount;
    
    // Проверяем, повысился ли уровень
    const levelInfo = getLevel(data.exp);
    const newLevel = levelInfo.level;
    
    // Если уровень повысился
    if (newLevel > oldLevel) {
        // Начисляем награду ТОЛЬКО ОДИН РАЗ за все повышения
        let totalHpReward = 0;
        let totalExpReward = 0;
        let highestLevel = oldLevel;
        
        // Собираем все награды за каждый повышенный уровень
        for (let lv = oldLevel + 1; lv <= newLevel; lv++) {
            const reward = getLevelUpReward(lv);
            totalHpReward += reward.hp;
            totalExpReward += reward.extraExp || 0;
            highestLevel = lv;
            
            // Отмечаем уровень как показанный
            if (!data.shownLevels.includes(lv)) {
                data.shownLevels.push(lv);
            }
        }
        
        // Применяем все награды ОДНИМ РАЗОМ
        if (totalHpReward > 0) {
            data.totalHealth = Math.min(getTotalHealthCap(), (data.totalHealth || 0) + totalHpReward);
        }
        if (totalExpReward > 0) {
            data.exp += totalExpReward;
        }
        
        // Обновляем уровень (может измениться после добавления бонусного опыта)
        const finalLevelInfo = getLevel(data.exp);
        data.level = finalLevelInfo.level;
        
        // Проверяем, не повысился ли уровень ещё раз от бонусного опыта
        if (data.level > highestLevel) {
            // Если повысился - начисляем ещё одну награду
            const extraReward = getLevelUpReward(data.level);
            data.totalHealth = Math.min(getTotalHealthCap(), (data.totalHealth || 0) + extraReward.hp);
            if (extraReward.extraExp > 0) {
                data.exp += extraReward.extraExp;
            }
            if (!data.shownLevels.includes(data.level)) {
                data.shownLevels.push(data.level);
            }
        }
        
        // Показываем уведомление для самого высокого достигнутого уровня
        const finalLevel = getLevel(data.exp).level;
        const finalReward = getLevelUpReward(finalLevel);
        const rankUp = getRankUpMessage(oldLevel, finalLevel);
        setTimeout(() => showLevelUp(finalLevel, finalReward.text, rankUp), 300);
    }
    
    save();
}

// Списывает опыт за срыв привычки (или другой штраф). В отличие от addExp,
// не начисляет наград и не показывает уведомлений — просто отражает потерю.
function removeExp(amount, source) {
    if (amount <= 0) return;
    data.exp = Math.max(0, (data.exp || 0) - amount);
    if (!data.expSources) data.expSources = { sport: 0, habits: 0, achievements: 0, notes: 0, todos: 0, streak: 0 };
    if (data.expSources[source] !== undefined) {
        data.expSources[source] = Math.max(0, data.expSources[source] - amount);
    }
    data.level = getLevel(data.exp).level;
    save();
}

function getExpForActivity(type, count) {
    const multipliers = { sport: 15, habit: 10, achievement: 25, note: 5, todo: 3, streak: 20 };
    return (multipliers[type] || 10) * count;
}

function getHabitExpMultiplier(startDate) {
    const today = getToday();
    const daysDiff = Math.floor((new Date(today) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    if (daysDiff <= 0) return 1.0;
    if (daysDiff <= 3) return 0.8;
    if (daysDiff <= 7) return 0.5;
    if (daysDiff <= 14) return 0.3;
    if (daysDiff <= 30) return 0.15;
    return 0.05;
}

function calculateSportStreak() {
    if (!data.sports || data.sports.length === 0) return 0;
    const today = getToday();
    let streak = 0;
    let currentDate = new Date(today);
    while (true) {
        const dateStr = currentDate.getFullYear() + '-' + String(currentDate.getMonth()+1).padStart(2,'0') + '-' + String(currentDate.getDate()).padStart(2,'0');
        let allDone = true, hasAny = false, restCount = 0, totalActive = 0;
        for (const sport of data.sports) {
            const isDone = sport.log && sport.log[dateStr];
            const isRest = sport.rest && sport.rest[dateStr];
            if (isDone) { hasAny = true; }
            else if (isRest) { restCount++; hasAny = true; }
            else { allDone = false; }
            totalActive++;
        }
        if (restCount === totalActive && hasAny) { streak++; currentDate.setDate(currentDate.getDate() - 1); continue; }
        if (allDone && hasAny) { streak++; currentDate.setDate(currentDate.getDate() - 1); }
        else break;
        if (currentDate < new Date(2020, 0, 1)) break;
    }
    return streak;
}

function getRestDaysLeft() {
    if (data.sportMode !== 'strict' || !data.strictStartDate) return null;
    const today = getToday();
    const currentDate = new Date(today);
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekStartStr = weekStart.getFullYear() + '-' + String(weekStart.getMonth()+1).padStart(2,'0') + '-' + String(weekStart.getDate()).padStart(2,'0');
    if (data.restDaysReset !== weekStartStr) {
        data.restDaysUsed = 0;
        data.restDaysReset = weekStartStr;
    }
    return (data.strictRestDays || 1) - (data.restDaysUsed || 0);
}

function useRestDay() {
    const left = getRestDaysLeft();
    if (left === null) return false;
    if (left <= 0) { alert('⚠️ У тебя закончились выходные дни на этой неделе!'); return false; }
    data.restDaysUsed = (data.restDaysUsed || 0) + 1;
    const today = getToday();
    const currentDate = new Date(today);
    const weekStart = new Date(currentDate);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    data.restDaysReset = weekStart.getFullYear() + '-' + String(weekStart.getMonth()+1).padStart(2,'0') + '-' + String(weekStart.getDate()).padStart(2,'0');
    save();
    return true;
}

