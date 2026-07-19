// ============================================================
// МАГАЗИН — ПРОКАЧКА И КОСМЕТИКА
// ============================================================

const BASE_TOTAL_HEALTH_CAP = 150;
const TOTAL_HEALTH_CAP_STEP = 10;
const TOTAL_HEALTH_CAP_BONUS_LIMIT = 150; // максимум +150 к базовым 150 (итого до 300)

const BASE_STRICT_MAX_HP_CAP = 10;
const STRICT_MAX_HP_CAP_STEP = 2;
const STRICT_MAX_HP_CAP_BONUS_LIMIT = 20; // максимум +20 к базовым 10 (итого до 30)

const BASE_STRICT_REST_DAYS_CAP = 3;
const STRICT_REST_DAYS_STEP = 1;
const STRICT_REST_DAYS_BONUS_LIMIT = 4; // максимум +4 к базовым 3 (итого до 7 в неделю)

function getStrictRestDaysCap() {
    return BASE_STRICT_REST_DAYS_CAP + (data.strictRestDaysBonus || 0);
}

function getStrictRestDaysUpgradeCost() {
    const level = (data.strictRestDaysBonus || 0) / STRICT_REST_DAYS_STEP;
    return Math.round(15 * Math.pow(1.5, level));
}

function buyStrictRestDaysUpgrade() {
    if ((data.strictRestDaysBonus || 0) >= STRICT_REST_DAYS_BONUS_LIMIT) return;
    const cost = getStrictRestDaysUpgradeCost();
    if ((data.totalHealth || 0) < cost) { alert('⚠️ Не хватает HP для покупки!'); return; }
    data.totalHealth -= cost;
    data.strictRestDaysBonus = (data.strictRestDaysBonus || 0) + STRICT_REST_DAYS_STEP;
    save();
    renderAll();
}

function getTotalHealthCap() {
    return BASE_TOTAL_HEALTH_CAP + (data.totalHealthCapBonus || 0);
}

function getStrictMaxHpCap() {
    return BASE_STRICT_MAX_HP_CAP + (data.strictMaxHpCapBonus || 0);
}

function getTotalHealthCapUpgradeCost() {
    const level = (data.totalHealthCapBonus || 0) / TOTAL_HEALTH_CAP_STEP;
    return Math.round(20 * Math.pow(1.35, level));
}

function getStrictMaxHpCapUpgradeCost() {
    const level = (data.strictMaxHpCapBonus || 0) / STRICT_MAX_HP_CAP_STEP;
    return Math.round(25 * Math.pow(1.4, level));
}

function buyTotalHealthCapUpgrade() {
    if ((data.totalHealthCapBonus || 0) >= TOTAL_HEALTH_CAP_BONUS_LIMIT) return;
    const cost = getTotalHealthCapUpgradeCost();
    if ((data.totalHealth || 0) < cost) { alert('⚠️ Не хватает HP для покупки!'); return; }
    data.totalHealth -= cost;
    data.totalHealthCapBonus = (data.totalHealthCapBonus || 0) + TOTAL_HEALTH_CAP_STEP;
    save();
    renderAll();
}

function buyStrictMaxHpCapUpgrade() {
    if ((data.strictMaxHpCapBonus || 0) >= STRICT_MAX_HP_CAP_BONUS_LIMIT) return;
    const cost = getStrictMaxHpCapUpgradeCost();
    if ((data.totalHealth || 0) < cost) { alert('⚠️ Не хватает HP для покупки!'); return; }
    data.totalHealth -= cost;
    data.strictMaxHpCapBonus = (data.strictMaxHpCapBonus || 0) + STRICT_MAX_HP_CAP_STEP;
    save();
    renderAll();
}

// ============================================================
// КОСМЕТИКА — ВИЗУАЛЬНЫЕ ТЕМЫ ОФОРМЛЕНИЯ
// ============================================================

const SHOP_THEMES = [
    { id: 'default', name: 'Классика', emoji: '🌌', cost: 0, colors: ['#82b1ff', '#b388ff'] },
    { id: 'sunset',  name: 'Закат',    emoji: '🌇', cost: 20, colors: ['#ff9d42', '#ff6b6b'] },
    { id: 'forest',  name: 'Лес',      emoji: '🌲', cost: 20, colors: ['#4caf50', '#81c784'] },
    { id: 'ocean',   name: 'Океан',    emoji: '🌊', cost: 25, colors: ['#26c6da', '#4dd0e1'] },
    { id: 'rose',    name: 'Роза',     emoji: '🌹', cost: 30, colors: ['#f06292', '#ec407a'] },
    { id: 'gold',    name: 'Золото',   emoji: '👑', cost: 40, colors: ['#ffd54f', '#ffb300'] }
];

function buyTheme(id) {
    const theme = SHOP_THEMES.find(t => t.id === id);
    if (!theme) return;
    if (!data.ownedThemes) data.ownedThemes = ['default'];
    if (data.ownedThemes.includes(id)) return;
    if ((data.totalHealth || 0) < theme.cost) { alert('⚠️ Не хватает HP для покупки!'); return; }
    data.totalHealth -= theme.cost;
    data.ownedThemes.push(id);
    data.equippedTheme = id;
    save();
    applyEquippedTheme();
    renderShop();
    renderProfile();
}

function equipTheme(id) {
    if (!data.ownedThemes || !data.ownedThemes.includes(id)) return;
    data.equippedTheme = id;
    save();
    applyEquippedTheme();
    renderShop();
}

function applyEquippedTheme() {
    document.body.classList.forEach(c => {
        if (c.indexOf('theme-shop-') === 0) document.body.classList.remove(c);
    });
    // Пока активна тема строгого режима — она важнее косметики (это тревожное
    // состояние и должно быть узнаваемо с первого взгляда).
    if (data.sportMode === 'strict' && data.strictThemeEnabled !== false) return;
    const id = data.equippedTheme || 'default';
    if (id !== 'default') document.body.classList.add('theme-shop-' + id);
}

// ============================================================
// РЕНДЕР ВКЛАДКИ МАГАЗИНА
// ============================================================

function renderShopUpgrades() {
    const container = document.getElementById('shopUpgrades');
    if (!container) return;
    const balance = data.totalHealth || 0;

    const hpCap = getTotalHealthCap();
    const hpCapMaxed = (data.totalHealthCapBonus || 0) >= TOTAL_HEALTH_CAP_BONUS_LIMIT;
    const hpCapCost = getTotalHealthCapUpgradeCost();

    const strictCap = getStrictMaxHpCap();
    const strictCapMaxed = (data.strictMaxHpCapBonus || 0) >= STRICT_MAX_HP_CAP_BONUS_LIMIT;
    const strictCapCost = getStrictMaxHpCapUpgradeCost();

    const restDaysCap = getStrictRestDaysCap();
    const restDaysMaxed = (data.strictRestDaysBonus || 0) >= STRICT_REST_DAYS_BONUS_LIMIT;
    const restDaysCost = getStrictRestDaysUpgradeCost();

    // Наглядная сводка текущих атрибутов — обновляется сразу же после любой покупки,
    // чтобы было видно, что именно и насколько прокачано прямо сейчас.
    container.innerHTML = `
        <div class="shop-attrs-overview">
            <div class="shop-attr-card">
                <div class="shop-attr-icon">💗</div>
                <div class="shop-attr-value">${balance}<span class="shop-attr-cap">/${hpCap}</span></div>
                <div class="shop-attr-label">HP на балансе</div>
                <div class="shop-attr-bar"><div class="shop-attr-bar-fill" style="width:${hpCap > 0 ? Math.min(100, (balance / hpCap) * 100) : 0}%"></div></div>
            </div>
            <div class="shop-attr-card">
                <div class="shop-attr-icon">🛡️</div>
                <div class="shop-attr-value">${strictCap}</div>
                <div class="shop-attr-label">Потолок HP строгого режима</div>
                <div class="shop-attr-bar"><div class="shop-attr-bar-fill purple" style="width:${Math.min(100, (strictCap / (BASE_STRICT_MAX_HP_CAP + STRICT_MAX_HP_CAP_BONUS_LIMIT)) * 100)}%"></div></div>
            </div>
            <div class="shop-attr-card">
                <div class="shop-attr-icon">🗓️</div>
                <div class="shop-attr-value">${restDaysCap}</div>
                <div class="shop-attr-label">Выходных в неделю</div>
                <div class="shop-attr-bar"><div class="shop-attr-bar-fill orange" style="width:${Math.min(100, (restDaysCap / (BASE_STRICT_REST_DAYS_CAP + STRICT_REST_DAYS_BONUS_LIMIT)) * 100)}%"></div></div>
            </div>
        </div>
        <div class="shop-item">
            <div class="shop-item-icon">💗</div>
            <div class="shop-item-info">
                <div class="shop-item-title">Максимум HP на балансе</div>
                <div class="shop-item-desc">${hpCapMaxed ? `Прокачано до максимума: ${hpCap} HP.` : `<span class="shop-preview">${hpCap} → <strong>${hpCap + TOTAL_HEALTH_CAP_STEP}</strong> HP</span> — позволит копить больше очков здоровья про запас.`}</div>
            </div>
            <button class="btn-sm ${!hpCapMaxed && balance >= hpCapCost ? 'success' : ''}" id="shopBuyHpCap" ${hpCapMaxed || balance < hpCapCost ? 'disabled' : ''}>
                ${hpCapMaxed ? '✅ Максимум' : `+${TOTAL_HEALTH_CAP_STEP} за ${hpCapCost}❤️`}
            </button>
        </div>
        <div class="shop-item">
            <div class="shop-item-icon">🛡️</div>
            <div class="shop-item-info">
                <div class="shop-item-title">Максимум HP строгого режима</div>
                <div class="shop-item-desc">${strictCapMaxed ? `Прокачано до максимума: ${strictCap} HP.` : `<span class="shop-preview">${strictCap} → <strong>${strictCap + STRICT_MAX_HP_CAP_STEP}</strong> HP</span> — столько сможет вырасти здоровье за серии идеальных дней.`}</div>
            </div>
            <button class="btn-sm ${!strictCapMaxed && balance >= strictCapCost ? 'success' : ''}" id="shopBuyStrictCap" ${strictCapMaxed || balance < strictCapCost ? 'disabled' : ''}>
                ${strictCapMaxed ? '✅ Максимум' : `+${STRICT_MAX_HP_CAP_STEP} за ${strictCapCost}❤️`}
            </button>
        </div>
        <div class="shop-item">
            <div class="shop-item-icon">🗓️</div>
            <div class="shop-item-info">
                <div class="shop-item-title">Дополнительные выходные</div>
                <div class="shop-item-desc">${restDaysMaxed ? `Прокачано до максимума: ${restDaysCap} в неделю.` : `<span class="shop-preview">${restDaysCap} → <strong>${restDaysCap + STRICT_REST_DAYS_STEP}</strong> в неделю</span> — задаётся при активации строгого режима.`}</div>
            </div>
            <button class="btn-sm ${!restDaysMaxed && balance >= restDaysCost ? 'success' : ''}" id="shopBuyRestDays" ${restDaysMaxed || balance < restDaysCost ? 'disabled' : ''}>
                ${restDaysMaxed ? '✅ Максимум' : `+${STRICT_REST_DAYS_STEP} за ${restDaysCost}❤️`}
            </button>
        </div>
    `;

    const hpBtn = document.getElementById('shopBuyHpCap');
    if (hpBtn && !hpCapMaxed) hpBtn.addEventListener('click', buyTotalHealthCapUpgrade);
    const strictBtn = document.getElementById('shopBuyStrictCap');
    if (strictBtn && !strictCapMaxed) strictBtn.addEventListener('click', buyStrictMaxHpCapUpgrade);
    const restBtn = document.getElementById('shopBuyRestDays');
    if (restBtn && !restDaysMaxed) restBtn.addEventListener('click', buyStrictRestDaysUpgrade);
}

function renderShopCosmetics() {
    const container = document.getElementById('shopCosmetics');
    if (!container) return;
    const owned = data.ownedThemes || ['default'];
    const equipped = data.equippedTheme || 'default';
    const balance = data.totalHealth || 0;

    container.innerHTML = SHOP_THEMES.map(t => {
        const isOwned = owned.includes(t.id);
        const isEquipped = equipped === t.id;
        let btnHtml;
        if (isEquipped) btnHtml = `<button class="btn-sm" disabled>✅ Надето</button>`;
        else if (isOwned) btnHtml = `<button class="btn-sm blue" data-equip="${t.id}">Надеть</button>`;
        else btnHtml = `<button class="btn-sm ${balance >= t.cost ? 'success' : ''}" data-buy="${t.id}" ${balance < t.cost ? 'disabled' : ''}>Купить за ${t.cost}❤️</button>`;
        return `
            <div class="shop-item">
                <div class="shop-item-icon theme-swatch" style="background:linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]});">${t.emoji}</div>
                <div class="shop-item-info">
                    <div class="shop-item-title">${t.name}</div>
                    <div class="shop-item-desc">${t.cost === 0 ? 'Стандартная тема оформления' : 'Косметика · меняет цвета интерфейса'}</div>
                </div>
                ${btnHtml}
            </div>`;
    }).join('');

    container.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => buyTheme(btn.dataset.buy)));
    container.querySelectorAll('[data-equip]').forEach(btn => btn.addEventListener('click', () => equipTheme(btn.dataset.equip)));
}

function renderShop() {
    const balanceEl = document.getElementById('shopBalance');
    if (balanceEl) balanceEl.textContent = data.totalHealth || 0;
    renderShopUpgrades();
    renderShopCosmetics();
}

document.querySelectorAll('.shop-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.shop-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const tab = this.dataset.shoptab;
        document.getElementById('shopUpgrades').style.display = tab === 'upgrades' ? 'flex' : 'none';
        document.getElementById('shopCosmetics').style.display = tab === 'cosmetics' ? 'flex' : 'none';
    });
});
