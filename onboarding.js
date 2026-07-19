// ============================================================
// ОНБОРДИНГ — ВЫБОР РЕЖИМА ПРИ ПЕРВОМ ЗАПУСКЕ
// ============================================================

const ONBOARDING_INFO = {
    easy: {
        pros: [
            'Никакого давления — тренируешься в своём темпе',
            'Пропущенные дни ни на что не влияют',
            'Нет риска потерять очки здоровья'
        ],
        cons: [
            'Нет системы штрафов и наград за дисциплину',
            'Меньше повода не пропускать дни'
        ]
    },
    strict: {
        pros: [
            'Спорт, привычки и дела на конкретный день реально влияют на результат',
            'За серию идеальных дней подряд растёт максимум HP и здоровье полностью восстанавливается',
            'Больше азарта — ощущение настоящей ставки'
        ],
        cons: [
            'Провал по спорту, привычке или делу списывает здоровье',
            'Если HP закончится — "смерть": придётся выбрать рестарт или переход в лёгкий режим',
            'Требует реальной регулярности'
        ]
    }
};

let onboardingSelectedMode = 'easy';

function selectOnboardingMode(mode) {
    onboardingSelectedMode = mode;
    document.getElementById('obEasyCard').classList.toggle('selected', mode === 'easy');
    document.getElementById('obStrictCard').classList.toggle('selected', mode === 'strict');
}

function showOnboardingInfo(mode) {
    const panel = document.getElementById('onboardingInfoPanel');
    const info = ONBOARDING_INFO[mode];
    document.getElementById('onboardingInfoTitle').textContent = mode === 'strict' ? '🔥 Строгий режим' : '😊 Лёгкий режим';
    document.getElementById('onboardingProsList').innerHTML = info.pros.map(p => `<li>${p}</li>`).join('');
    document.getElementById('onboardingConsList').innerHTML = info.cons.map(c => `<li>${c}</li>`).join('');
    panel.style.display = 'block';
}

function openOnboardingModal() {
    onboardingSelectedMode = data.sportMode === 'strict' ? 'strict' : 'easy';
    selectOnboardingMode(onboardingSelectedMode);
    document.getElementById('onboardingInfoPanel').style.display = 'none';
    document.getElementById('onboardingModal').classList.add('active');
}

function closeOnboardingModal() {
    document.getElementById('onboardingModal').classList.remove('active');
}

document.querySelectorAll('.onboarding-mode-card').forEach(card => {
    card.addEventListener('click', function(e) {
        if (e.target.classList.contains('onboarding-info-btn')) return;
        selectOnboardingMode(this.dataset.mode);
    });
});

document.querySelectorAll('.onboarding-info-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        showOnboardingInfo(this.dataset.mode);
    });
});

document.getElementById('onboardingInfoClose').addEventListener('click', function() {
    document.getElementById('onboardingInfoPanel').style.display = 'none';
});

document.getElementById('onboardingConfirmBtn').addEventListener('click', function() {
    data.onboardingDone = true;
    if (onboardingSelectedMode === 'strict' && data.sportMode !== 'strict') {
        save();
        closeOnboardingModal();
        // Открываем настройку строгого режима (ставка HP, выходные, дата начала)
        showStrictModal();
        return;
    }
    if (onboardingSelectedMode === 'easy' && data.sportMode === 'strict') {
        closeOnboardingModal();
        exitStrictMode();
        return;
    }
    save();
    closeOnboardingModal();
    renderAll();
});

// Показываем онбординг только тем, кто ещё не выбирал режим
// (для существующих сохранений onboardingDone выставляется в true при миграции).
if (!data.onboardingDone) {
    setTimeout(openOnboardingModal, 600);
}
