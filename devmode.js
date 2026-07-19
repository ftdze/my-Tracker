// ============================================================
// РЕЖИМ РАЗРАБОТЧИКА — скрытая панель для тестирования
// Открывается последовательным вводом "ftdze" в любом месте приложения.
// Не сохраняется между перезагрузками — это просто инструмент для отладки.
// ============================================================

const DEV_CODE = 'ftdze';
let devCodeBuffer = '';
let devPanelOpen = false;

document.addEventListener('keydown', function(e) {
    if (e.key.length !== 1) return; // игнорируем стрелки, Tab, Enter и т.п.
    devCodeBuffer = (devCodeBuffer + e.key).toLowerCase().slice(-DEV_CODE.length);
    if (devCodeBuffer === DEV_CODE) {
        toggleDevPanel();
        devCodeBuffer = '';
    }
});

function toggleDevPanel() {
    devPanelOpen = !devPanelOpen;
    document.getElementById('devPanel').style.display = devPanelOpen ? 'block' : 'none';
}

document.getElementById('devPanelCloseBtn').addEventListener('click', toggleDevPanel);

document.getElementById('devAddBankHp').addEventListener('click', function() {
    data.totalHealth = Math.min(getTotalHealthCap(), (data.totalHealth || 0) + 50);
    save();
    renderAll();
});

document.getElementById('devAddExp').addEventListener('click', function() {
    addExp(500, 'dev');
    save();
    renderAll();
});

// Сдвигает "последний обработанный день" строгого режима на день назад,
// чтобы при следующем renderAll() пересчитался ещё один прошедший день —
// не нужно ждать реальные сутки, чтобы проверить начисление/списание HP.
document.getElementById('devSkipDay').addEventListener('click', function() {
    if (data.sportMode !== 'strict' || !data.strictLastProcessedDate) {
        alert('Строгий режим не активен — нечего "прожить".');
        return;
    }
    const d = new Date(data.strictLastProcessedDate);
    d.setDate(d.getDate() - 1);
    data.strictLastProcessedDate = dateToStr(d);
    save();
    renderAll();
});

document.getElementById('devTriggerDeath').addEventListener('click', function() {
    if (data.sportMode !== 'strict') {
        alert('Строгий режим не активен.');
        return;
    }
    data.strictHealth = 0;
    data.deathShown = true;
    save();
    document.getElementById('deathModal').classList.add('active');
});

document.getElementById('devResetOnboarding').addEventListener('click', function() {
    data.onboardingDone = false;
    save();
    alert('Онбординг сброшен — появится при следующей перезагрузке страницы.');
});
