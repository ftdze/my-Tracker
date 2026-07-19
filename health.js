// ============================================================
// ОБНОВЛЕНИЕ ЗДОРОВЬЯ В СТРОГОМ РЕЖИМЕ
// ============================================================

// Пока это true, модалку выбора при "смерти" в строгом режиме нельзя
// закрыть, не сделав выбор — любая попытка отмены (кнопка "Отмена" или
// клик мимо модалки повторного старта) возвращает пользователя обратно
// к экрану смерти, а не оставляет его в подвешенном состоянии.
let deathFlowActive = false;

function dateToStr(d) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// Оценка спортивной части дня: возвращает { hasAny, pass, allRestDay }
// pass = true, если по спорту нет провала (либо всё сделано, либо весь день выходной)
function evaluateSportDay(dateStr) {
    let allDone = true, hasAny = false, restCount = 0, totalActive = 0;
    for (const sport of data.sports) {
        const isDone = sport.log && sport.log[dateStr];
        const isRest = sport.rest && sport.rest[dateStr];
        if (isDone) { hasAny = true; }
        else if (isRest) { restCount++; hasAny = true; }
        else { allDone = false; }
        totalActive++;
    }
    const allRestDay = totalActive > 0 && restCount === totalActive && hasAny;
    return { hasAny, pass: allRestDay || (allDone && hasAny) };
}

// Оценка привычек за день: привычка считается проваленной, только если
// пользователь явно нажал «Сорвался» в этот день — иначе она пассивно «выполнена».
// failedCount — сколько срывов ЕЩЁ не были оштрафованы мгновенно (кнопкой «Сорвался»),
// anyFailed — был ли вообще срыв в этот день (даже уже оштрафованный) — нужно,
// чтобы день не засчитался как «идеальный» только из-за того, что штраф уже списан раньше.
function evaluateHabitsDay(dateStr) {
    let hasAny = false, failedCount = 0, anyFailed = false;
    for (const habit of data.habits) {
        if (!habit.startDate || habit.startDate > dateStr) continue;
        hasAny = true;
        const status = getHabitStatusForDate(habit, dateStr);
        if (status === 'failed') {
            anyFailed = true;
            const penaltyKey = habit.id + '_' + dateStr;
            const alreadyPenalized = data.strictHabitFailPenalized && data.strictHabitFailPenalized[penaltyKey];
            if (!alreadyPenalized) failedCount++;
        }
    }
    return { hasAny, failedCount, anyFailed };
}

// Оценка дел за день: возвращает количество выполненных/всего —
// штраф в updateStrictHealth зависит от процента невыполненного.
function evaluateTodosDay(dateStr) {
    const items = data.todoDays && data.todoDays[dateStr] ? data.todoDays[dateStr] : [];
    const totalCount = items.length;
    const doneCount = items.filter(t => t.done).length;
    return { hasAny: totalCount > 0, totalCount, doneCount };
}

// Собирает конкретные пункты (спорт/привычки/дела), которые не были выполнены
// в указанный день — чтобы можно было показать в истории, за что именно
// было потеряно сердце.
function getMissedDetails(dateStr) {
    const missedSports = [];
    for (const sport of data.sports) {
        const isDone = sport.log && sport.log[dateStr];
        const isRest = sport.rest && sport.rest[dateStr];
        if (!isDone && !isRest) missedSports.push(sport.name);
    }
    const missedHabits = [];
    for (const habit of data.habits) {
        if (!habit.startDate || habit.startDate > dateStr) continue;
        if (getHabitStatusForDate(habit, dateStr) === 'failed') missedHabits.push(habit.name);
    }
    const missedTodos = [];
    const items = data.todoDays && data.todoDays[dateStr] ? data.todoDays[dateStr] : [];
    for (const t of items) {
        if (!t.done) missedTodos.push(t.text);
    }
    return { missedSports, missedHabits, missedTodos };
}

// Добавляет запись в историю сердец строгого режима (потеря/получение/бонус).
function logHeartEvent(dateStr, type, amount, reasons) {
    if (!data.strictHealthLog) data.strictHealthLog = [];
    if (amount <= 0) return;
    data.strictHealthLog.unshift({
        date: dateStr,
        type: type,
        amount: amount,
        reasons: reasons || [],
        hpAfter: data.strictHealth,
        maxAfter: data.strictMaxHealth
    });
    if (data.strictHealthLog.length > 300) data.strictHealthLog.length = 300;
}

// Мгновенный штраф здоровья за явный срыв привычки (кнопка «Сорвался»).
// В отличие от прочих провалов (спорт/дела), которые оцениваются только
// после окончания дня, срыв — это осознанное действие пользователя прямо
// сейчас, поэтому HP списывается сразу же, а не завтра при пересчёте.
function applyStrictHabitFailPenalty(habit, dateStr) {
    if (data.sportMode !== 'strict' || !data.strictStartDate) return;
    if (dateStr < data.strictStartDate) return;
    if (!data.strictHabitFailPenalized) data.strictHabitFailPenalized = {};
    const penaltyKey = habit.id + '_' + dateStr;
    if (data.strictHabitFailPenalized[penaltyKey]) return; // уже оштрафован
    data.strictHabitFailPenalized[penaltyKey] = true;

    const hpBefore = data.strictHealth;
    data.strictHealth = Math.max(0, data.strictHealth - 2);
    logHeartEvent(dateStr, 'loss', hpBefore - data.strictHealth, [`🔄 Привычка «${habit.name}» сорвана (-2 HP)`]);

    if (data.strictHealth <= 0 && !data.deathShown) {
        data.deathShown = true;
        document.getElementById('deathModal').classList.add('active');
    }
}

function updateStrictHealth() {
    if (data.sportMode !== 'strict' || !data.strictStartDate) return;
    if (data.strictHealth <= 0) return;

    const today = getToday();

    // Миграция для сохранений без strictLastProcessedDate (до этого исправления):
    // не пересчитываем всю историю задним числом — считаем, что всё
    // до вчерашнего дня уже было учтено раньше.
    if (!data.strictLastProcessedDate) {
        const y = new Date(today);
        y.setDate(y.getDate() - 1);
        data.strictLastProcessedDate = dateToStr(y);
    }

    let currentDate = new Date(data.strictLastProcessedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const boundary = new Date(today); // сегодняшний день ещё не закончился — не оцениваем его

    while (currentDate < boundary) {
        const dateStr = dateToStr(currentDate);

        if (dateStr < data.strictStartDate) {
            data.strictLastProcessedDate = dateStr;
            currentDate.setDate(currentDate.getDate() + 1);
            continue;
        }

        const sportDay = evaluateSportDay(dateStr);
        const habitsDay = evaluateHabitsDay(dateStr);
        const todosDay = evaluateTodosDay(dateStr);

        const hasAny = sportDay.hasAny || habitsDay.hasAny || todosDay.hasAny;
        const sportFail = sportDay.hasAny && !sportDay.pass;
        const todosFail = todosDay.totalCount > 0 && todosDay.doneCount < todosDay.totalCount;
        const dayOk = !sportFail && !habitsDay.anyFailed && !todosFail;

        if (!hasAny) {
            // В этот день не было вообще никаких обязательств (ни спорт, ни привычки, ни дела) —
            // день нейтральный, здоровье не трогаем и серию не сбрасываем.
        } else if (dayOk) {
            const hpBeforeGain = data.strictHealth;
            if (data.strictHealth < data.strictMaxHealth) {
                data.strictHealth = Math.min(data.strictMaxHealth, data.strictHealth + 0.5);
            }
            if (data.strictHealth > hpBeforeGain) {
                logHeartEvent(dateStr, 'gain', data.strictHealth - hpBeforeGain, ['✅ Идеальный день']);
            }
            data.strictStreak = (data.strictStreak || 0) + 1;
            if (data.strictStreak > data.strictBestStreak) data.strictBestStreak = data.strictStreak;
            if (data.strictStreak % 5 === 0) {
                addExp(getExpForActivity('streak', data.strictStreak), 'streak');
                // Награда за дисциплину: серия из 5 идеальных дней подряд
                // увеличивает максимум HP и полностью восстанавливает здоровье,
                // чтобы валюта строгого режима не иссякала навсегда.
                const hpBeforeBonus = data.strictHealth;
                const STRICT_MAX_HP_CAP = getStrictMaxHpCap();
                if (data.strictMaxHealth < STRICT_MAX_HP_CAP) {
                    data.strictMaxHealth = Math.min(STRICT_MAX_HP_CAP, data.strictMaxHealth + 1);
                }
                data.strictHealth = data.strictMaxHealth;
                logHeartEvent(dateStr, 'bonus', data.strictHealth - hpBeforeBonus, [`🏆 Серия ${data.strictStreak} идеальных дней подряд`]);
            }
            data.strictDaysCount = (data.strictDaysCount || 0) + 1;
        } else {
            // Штраф считается отдельно по каждой категории — провал в одной
            // не наказывает так же жёстко, как раньше плоские -4 за любой провал:
            //   💪 спорт — провал дня тренировок: -1 HP (одна отметка за день, не за упражнение)
            //   🔄 привычки — за каждый срыв: -2 HP (уже оштрафованные кнопкой «Сорвался» не считаются повторно)
            //   ✅ дела — по проценту невыполненного: <50% сделано — это очень плохо (-3 HP), иначе -1 HP
            const missed = getMissedDetails(dateStr);
            const reasons = [];
            let penalty = 0;

            if (sportFail) {
                penalty += 1;
                reasons.push(`💪 Провален день тренировок (-1 HP)${missed.missedSports.length ? ': ' + missed.missedSports.join(', ') : ''}`);
            }
            if (habitsDay.failedCount > 0) {
                const habitPenalty = habitsDay.failedCount * 2;
                penalty += habitPenalty;
                reasons.push(`🔄 Сорвано привычек: ${habitsDay.failedCount} (-${habitPenalty} HP)${missed.missedHabits.length ? ': ' + missed.missedHabits.join(', ') : ''}`);
            }
            if (todosFail) {
                const percent = todosDay.doneCount / todosDay.totalCount;
                const todoPenalty = percent < 0.5 ? 3 : 1;
                penalty += todoPenalty;
                const badge = percent < 0.5 ? ' — очень плохо' : '';
                reasons.push(`✅ Дела выполнены на ${Math.round(percent * 100)}% (-${todoPenalty} HP)${badge}`);
            }

            if (penalty > 0) {
                const hpBeforeLoss = data.strictHealth;
                data.strictHealth = Math.max(0, data.strictHealth - penalty);
                logHeartEvent(dateStr, 'loss', hpBeforeLoss - data.strictHealth, reasons);
            }
            data.strictStreak = 0;
            data.strictDaysCount = (data.strictDaysCount || 0) + 1;
        }

        data.strictLastProcessedDate = dateStr;
        currentDate.setDate(currentDate.getDate() + 1);

        if (data.strictHealth <= 0 && !data.deathShown) {
            data.deathShown = true;
            document.getElementById('deathModal').classList.add('active');
            save();
            return;
        }
    }
    save();
}

// ============================================================
// СИСТЕМА ЗДОРОВЬЯ
// ============================================================

function confirmStrictMode() {
    const available = data.totalHealth || 0;
    if (available < 1) {
        alert('⚠️ У тебя нет очков здоровья! Зарабатывай HP через повышение уровня.');
        return;
    }
    
    const health = parseInt(document.getElementById('strictHealthInput').value) || 5;
    const restDays = parseInt(document.getElementById('strictRestDaysInput').value) || 1;
    const startDate = document.getElementById('strictStartDateInput').value || getToday();
    
    if (health < 1) { alert('Очков здоровья должно быть не меньше 1!'); return; }
    if (health > getStrictMaxHpCap()) { alert(`Максимум ${getStrictMaxHpCap()} очков здоровья для вызова!`); return; }
    if (health > available) { alert(`У тебя только ${available} HP доступно!`); return; }
    const restDaysCap = getStrictRestDaysCap();
    if (restDays < 0 || restDays > restDaysCap) { alert(`Выходных от 0 до ${restDaysCap}!`); return; }
    if (!isTodayOrFuture(startDate)) {
        alert('❌ Дата начала должна быть сегодня или в будущем!');
        return;
    }
    
    // Списываем HP с баланса
    data.totalHealth = Math.max(0, data.totalHealth - health);
    
    // В строгом режиме ровно столько HP, сколько заплатил пользователь
    data.strictHealth = health;
    data.strictMaxHealth = health;
    
    data.strictRestDays = restDays;
    data.strictStartDate = startDate;
    data.strictStreak = 0;
    data.strictBestStreak = 0;
    data.strictDaysCount = 0;
    data.strictHealthLog = [];
    data.strictHabitFailPenalized = {};
    data.restDaysUsed = 0;
    data.restDaysReset = null;
    data.deathShown = false;
    data.sportMode = 'strict';
    const dayBeforeStart = new Date(startDate);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    data.strictLastProcessedDate = dateToStr(dayBeforeStart);
    deathFlowActive = false;
    hideStrictModal();
    save();
    renderAll();
    alert(`🔥 Строгий режим активирован!\n❤️ Потрачено HP: ${health}\n❤️ Здоровье в строгом режиме: ${health}/${health}\n🗓️ Выходных: ${restDays}\n📅 Начало: ${formatDate(startDate)}\n\n📋 Штрафы по категориям:\n🔄 Срыв привычки: -2 HP за каждую\n💪 Провален день тренировок: -1 HP\n✅ Дела не выполнены: -1 HP (если сделано ≥50%) или -3 HP (если меньше 50% — это очень плохо)\n\n🏆 Каждые 5 идеальных дней подряд — максимум HP растёт на 1 (до ${getStrictMaxHpCap()}) и здоровье восстанавливается полностью!\n\n💪 Удачи!`);
}

// ============================================================
// ГЛОБАЛЬНЫЙ HP-БЕЙДЖ + HP-БАР ВО ВКЛАДКЕ СПОРТА
// ============================================================

function renderStrictHpWidgets() {
    const isStrict = data.sportMode === 'strict' && !!data.strictStartDate;
    const badge = document.getElementById('globalHpBadge');

    if (!isStrict) {
        if (badge) badge.style.display = 'none';
        const popover = document.getElementById('globalHpPopover');
        if (popover) popover.style.display = 'none';
        return;
    }

    const hp = data.strictHealth || 0;
    const maxHp = data.strictMaxHealth || 0;
    const percent = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
    const colorClass = percent > 50 ? 'green' : percent > 25 ? 'yellow' : 'red';

    // Плавающий бейдж в углу — виден на любой вкладке. Подробности (дата начала,
    // серия, выходные) скрыты в попапе и разворачиваются только по клику —
    // чтобы не занимать интерфейс текстом, который нужен не постоянно.
    if (badge) {
        badge.style.display = 'flex';
        badge.className = 'global-hp-badge ' + colorClass;
        const text = document.getElementById('globalHpBadgeText');
        if (text) text.textContent = `${Math.floor(hp)}/${maxHp}`;
        const fill = document.getElementById('globalHpBadgeFill');
        if (fill) fill.style.width = percent + '%';
    }
}

function exitStrictMode() {
    if (data.sportMode !== 'strict') return;
    if (!confirm('⚠️ Ты уверен, что хочешь выйти из строгого режима?\n\nОчки здоровья НЕ вернутся и будут утрачены навсегда!')) return;
    
    deathFlowActive = false;
    data.strictHealth = 0;
    data.strictMaxHealth = 0;
    data.strictRestDays = 1;
    data.strictStartDate = null;
    data.strictStreak = 0;
    data.strictBestStreak = 0;
    data.strictDaysCount = 0;
    data.strictHealthLog = [];
    data.strictHabitFailPenalized = {};
    data.restDaysUsed = 0;
    data.restDaysReset = null;
    data.deathShown = false;
    data.strictLastProcessedDate = null;
    data.sportMode = 'easy';
    save();
    renderAll();
    document.getElementById('deathModal').classList.remove('active');
    alert('😊 Ты вышел из строгого режима. Очки здоровья потеряны навсегда.');
}

