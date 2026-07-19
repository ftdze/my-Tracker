// ============================================================
// УВЕДОМЛЕНИЕ О ПОВЫШЕНИИ УРОВНЯ
// ============================================================

function showLevelUp(level, reward, rankUp) {
    const notification = document.getElementById('levelUpNotification');
    document.getElementById('levelUpNumber').textContent = level;
    document.getElementById('levelUpText').innerHTML = `Ты достиг уровня <strong id="levelUpNumber">${level}</strong>!`;
    let rewardText = reward || '❤️ +2 к здоровью';
    if (rankUp) rewardText += `<br>🎖️ Новый ранг: <strong>${rankUp}</strong>`;
    document.getElementById('levelUpReward').innerHTML = rewardText;
    notification.classList.add('show');
    createCelebration();
    if (!data.shownLevels.includes(level)) {
        data.shownLevels.push(level);
        save();
    }
}

function closeLevelUp() {
    document.getElementById('levelUpNotification').classList.remove('show');
}

function createCelebration() {
    const emojis = ['⭐', '🎉', '🔥', '💪', '🏆', '👑', '✨'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const el = document.createElement('div');
            el.style.cssText = `position:fixed;left:${Math.random()*100}%;top:-20px;font-size:${20+Math.random()*30}px;pointer-events:none;z-index:3001;animation:confettiFall ${2+Math.random()*2}s linear forwards;opacity:0;`;
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            document.body.appendChild(el);
            setTimeout(() => el.remove(), 4000);
        }, i * 100);
    }
}

