// ============================================================
// НАСТРОЙКИ — ВКЛЮЧЕНИЕ/ОТКЛЮЧЕНИЕ ВКЛАДОК
// ============================================================

function renderSettingsModal() {
    const container = document.getElementById('settingsTabList');
    if (!container) return;
    container.innerHTML = TOGGLEABLE_TABS.map(t => {
        const checked = isTabEnabled(t.key) ? 'checked' : '';
        return `
            <label class="settings-tab-row">
                <span>${t.label}</span>
                <input type="checkbox" data-tabkey="${t.key}" ${checked}>
            </label>`;
    }).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', function() {
            if (!data.enabledTabs) data.enabledTabs = {};
            data.enabledTabs[this.dataset.tabkey] = this.checked;
            save();
            applyTabVisibility();
        });
    });

    document.getElementById('strictThemeToggle').checked = data.strictThemeEnabled !== false;
}

function openSettingsModal() {
    renderSettingsModal();
    document.getElementById('settingsModal').classList.add('active');
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

document.getElementById('settingsOpenBtn').addEventListener('click', openSettingsModal);
document.getElementById('settingsCloseBtn').addEventListener('click', closeSettingsModal);

document.getElementById('strictThemeToggle').addEventListener('change', function() {
    data.strictThemeEnabled = this.checked;
    save();
    renderAll();
});

document.getElementById('settingsAboutModesBtn').addEventListener('click', function() {
    openOnboardingModal();
});

document.getElementById('settingsResetBtn').addEventListener('click', resetAllData);
