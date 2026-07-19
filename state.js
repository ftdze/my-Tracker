// ============================================================
// ПОЛНАЯ ЛОГИКА
// ============================================================

// ВАЖНО: этот ключ больше никогда не должен меняться между обновлениями —
// раньше он был вида 'tracker_data_final_v35' и рос с каждой правкой файла,
// из-за чего приложение при каждом обновлении начинало читать localStorage
// по новому имени и «теряло» все сохранения. Если когда-нибудь понадобится
// поменять структуру данных — делай это через migrateData() ниже, а не
// через смену этого ключа.
const STORAGE_KEY = 'tracker_data';
const LEGACY_KEY_PATTERN = /^tracker_data_final_v(\d+)$/;
const CURRENT_SCHEMA_VERSION = 1;

let data = {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    habits: [],
    sports: [],
    achievements: [],
    notes: [],
    todoTemplates: [],
    todoDays: {},
    sportMode: 'easy',
    strictHealth: 0,
    strictMaxHealth: 0,
    strictRestDays: 1,
    strictStartDate: null,
    strictLastProcessedDate: null,
    strictStreak: 0,
    strictBestStreak: 0,
    strictDaysCount: 0,
    strictHealthLog: [],
    strictHabitFailPenalized: {},
    exp: 0,
    level: 1,
    expSources: { sport: 0, habits: 0, achievements: 0, notes: 0, todos: 0, streak: 0 },
    restDaysUsed: 0,
    restDaysReset: null,
    deathShown: false,
    totalHealth: 10,
    totalHealthCapBonus: 0,
    strictMaxHpCapBonus: 0,
    strictRestDaysBonus: 0,
    ownedThemes: ['default'],
    equippedTheme: 'default',
    shownLevels: [],
    enabledTabs: { habits: true, sport: true, achievements: true, notes: true, todo: true, shop: true },
    onboardingDone: false,
    strictThemeEnabled: true
};

// Ищет сохранение под одним из старых версионных ключей (tracker_data_final_vNN),
// если под текущим постоянным ключом ещё ничего нет — берёт самое новое из них.
function findLegacySave() {
    let bestKey = null, bestVersion = -1;
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const m = key && key.match(LEGACY_KEY_PATTERN);
            if (m) {
                const v = parseInt(m[1], 10);
                if (v > bestVersion) { bestVersion = v; bestKey = key; }
            }
        }
    } catch (e) {}
    return bestKey;
}

// Место для будущих миграций структуры данных между версиями схемы.
// Пример на будущее:
// if (loaded.schemaVersion < 2) { loaded.someNewField = defaultValue; }
function migrateData(loaded) {
    if (!loaded.schemaVersion) loaded.schemaVersion = 0;
    loaded.schemaVersion = CURRENT_SCHEMA_VERSION;
    return loaded;
}

try {
    let raw = localStorage.getItem(STORAGE_KEY);
    let recoveredFromLegacy = false;

    if (!raw) {
        const legacyKey = findLegacySave();
        if (legacyKey) {
            raw = localStorage.getItem(legacyKey);
            recoveredFromLegacy = true;
        }
    }

    if (raw) {
        const parsed = JSON.parse(raw);
        data = { ...data, ...migrateData(parsed) };
        if (!data.expSources) data.expSources = { sport: 0, habits: 0, achievements: 0, notes: 0, todos: 0, streak: 0 };
        if (data.totalHealth === undefined || data.totalHealth === null) data.totalHealth = 10;
        if (!data.shownLevels) data.shownLevels = [];
        if (!data.strictHealth) data.strictHealth = 0;
        if (!data.strictMaxHealth) data.strictMaxHealth = 0;
        if (!data.strictHealthLog) data.strictHealthLog = [];
        if (!data.strictHabitFailPenalized) data.strictHabitFailPenalized = {};
        if (data.totalHealthCapBonus === undefined || data.totalHealthCapBonus === null) data.totalHealthCapBonus = 0;
        if (data.strictMaxHpCapBonus === undefined || data.strictMaxHpCapBonus === null) data.strictMaxHpCapBonus = 0;
        if (data.strictRestDaysBonus === undefined || data.strictRestDaysBonus === null) data.strictRestDaysBonus = 0;
        if (!data.ownedThemes) data.ownedThemes = ['default'];
        if (!data.equippedTheme) data.equippedTheme = 'default';
        if (!data.enabledTabs) data.enabledTabs = { habits: true, sport: true, achievements: true, notes: true, todo: true, shop: true };
        if (data.enabledTabs.shop === undefined) data.enabledTabs.shop = true;
        if (data.strictThemeEnabled === undefined) data.strictThemeEnabled = true;
        // Это существующее сохранение (было ещё до появления онбординга) —
        // не показываем выбор режима при первом запуске уже знакомым пользователям.
        if (typeof parsed.onboardingDone === 'undefined') data.onboardingDone = true;

        if (recoveredFromLegacy) {
            // Переносим найденное старое сохранение под постоянный ключ,
            // чтобы больше никогда не приходилось искать его заново.
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        }
    }
} catch(e) {}

let timerInterval = null;
let selectedHabitId = null;
let selectedSportId = null;
let selectedSportIds = new Set();
let selectedHabitIds = new Set();
let selectedAchievementIds = new Set();
let hMonth = new Date().getMonth();
let hYear = new Date().getFullYear();
let sMonth = new Date().getMonth();
let sYear = new Date().getFullYear();
let aMonth = new Date().getMonth();
let aYear = new Date().getFullYear();
let nMonth = new Date().getMonth();
let nYear = new Date().getFullYear();
let todoMonth = new Date().getMonth();
let todoYear = new Date().getFullYear();
let selectedTodoDate = null;
let sCommentSportId = null;
let sortMode = 'date';
let editingNoteId = null;
let currentStatTab = 'all';
let habitSearchTerm = '';
let sportSearchTerm = '';

