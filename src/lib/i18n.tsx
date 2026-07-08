import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ru";

const DICT = {
  en: {
    // Auth
    welcomeBack: "Welcome back",
    createFamily: "Create your family",
    loginAsKidTitle: "Login as Kid",
    enterPin: "Enter your 6-digit PIN.",
    signInToManage: "Sign in to manage Kids Day.",
    parentAccount: "Parent account — kids get their own PIN inside.",
    parent: "Parent",
    myself: "Me",
    myselfHint: "My own habits",
    assignToSelf: "Myself",
    loginAsKid: "Login as Kid",
    continueWithGoogle: "Continue with Google",
    or: "or",
    yourName: "Your name",
    parentName: "Parent name",
    email: "Email",
    password: "Password",
    pin: "PIN",
    enter: "Enter",
    signIn: "Sign in",
    createAccount: "Create account",
    pleaseWait: "Please wait…",
    newHere: "New here?",
    alreadyHaveAccount: "Already have an account?",
    createAccountLink: "Create an account",
    // Common
    switch: "Switch",
    signOut: "Sign out",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    new: "New",
    all: "All",
    loading: "Loading…",
    // Home
    whosPlaying: "Who's playing?",
    dailyQuestsTagline: "Daily quests, streaks, and rewards.",
    pickProfile: "Pick a profile",
    manageTasksApprove: "Manage tasks & approve rewards",
    dayStreak: "day streak",
    // Kid
    questsTab: "🎯 Quests",
    rewardsTab: "🎁 Rewards",
    streak: "streak",
    coins: "coins",
    allDone: "🎉 All quests complete! Amazing!",
    keepGoing: (name: string, n: number) => `Keep going, ${name}! ${n} quests left today.`,
    noQuests: "No quests yet",
    noQuestsHint: "Ask a parent to add quests for you.",
    rewardStore: "Reward Store",
    myPurchases: "My purchases",
    nothingYet: "Nothing yet — start saving!",
    delivered: "Delivered",
    pending: "Pending",
    needMoreCoins: (n: number) => `Need ${n} more coins!`,
    rewardUnlocked: "Reward unlocked",
    backToProfiles: "← Back to profiles",
    loadingQuests: "Loading quests…",
    // Parent
    parentDashboard: "Parent Dashboard",
    tabTasks: "Tasks",
    tabFamily: "Family",
    tabReview: "Review",
    tabRewards: "Rewards",
    newQuest: "New quest",
    editQuest: "Edit quest",
    title: "Title",
    category: "Category",
    assignee: "Assignee",
    frequency: "Frequency",
    coinReward: "Coin reward",
    activeDays: "Active days",
    scheduleType: "Schedule type",
    daily: "daily",
    weekly: "weekly",
    createQuest: "Create quest",
    saveChanges: "Save changes",
    saving: "Saving…",
    noQuestsCreate: 'No quests. Tap "New" to create one.',
    pendingCount: (n: number) => `Pending (${n})`,
    deliver: "Deliver",
    noPending: "No pending rewards. 🎉",
    deliveredHeader: "Delivered",
    familyCount: (n: number) => `Family (${n})`,
    addChild: "Add child",
    addChildTitle: "Add a child",
    noChildren: 'No children yet. Tap "Add child" to create their profile and PIN.',
    name: "Name",
    avatarEmoji: "Avatar (emoji)",
    sixDigitPin: "6-digit PIN (kid uses this to sign in)",
    sharePinHint: 'Share this PIN with your child. They tap "Login as Kid" on the sign-in screen.',
    creating: "Creating…",
    createChildAccount: "Create child account",
    recentCompletions: "Recent completions",
    noCompletionsYet: "No completions yet. They'll appear here in real-time. ⚡",
    dispute: "Dispute",
    manageRewards: "Manage rewards",
    addReward: "Add reward",
    newReward: "New reward",
    editReward: "Edit reward",
    rewardName: "Reward name",
    rewardEmoji: "Emoji",
    cost: "Cost (coins)",
    active: "Active",
    inactive: "Inactive",
    titleRequired: "Please enter a title (English or Russian)",
    nameRequired: "Please enter a name (English or Russian)",
    moneyPreset: "💵 Money (exchange all coins)",
    moneyPresetHint: "Any purchase converts ALL current coins into real money.",
    showMore: "Show more",
    showLess: "Show less",
    allCoins: "All",
    confirmExchange: (n: number) => `Exchange all ${n} coins for money?`,
    // Categories
    cat_Hygiene: "Hygiene",
    cat_Chores: "Chores",
    "cat_Self-Education": "Self-Education",
    cat_Reading: "Reading",
    cat_Piano: "Piano",
    cat_Chess: "Chess",
    cat_Sports: "Sports",
    cat_Creative: "Creative",
    // Schedule
    sched_always: "Always",
    sched_school_days: "School days",
    sched_holidays: "Holidays",
    // Language
    language: "Language",
  },
  ru: {
    welcomeBack: "С возвращением",
    createFamily: "Создайте семью",
    loginAsKidTitle: "Вход для ребёнка",
    enterPin: "Введите 6-значный PIN.",
    signInToManage: "Войдите, чтобы управлять Kids Day.",
    parentAccount: "Аккаунт родителя — у детей будет свой PIN.",
    parent: "Родитель",
    myself: "Я",
    myselfHint: "Мои привычки",
    assignToSelf: "Себе",
    loginAsKid: "Вход ребёнка",
    continueWithGoogle: "Войти через Google",
    or: "или",
    yourName: "Ваше имя",
    parentName: "Имя родителя",
    email: "Email",
    password: "Пароль",
    pin: "PIN",
    enter: "Войти",
    signIn: "Войти",
    createAccount: "Создать аккаунт",
    pleaseWait: "Пожалуйста, подождите…",
    newHere: "Впервые здесь?",
    alreadyHaveAccount: "Уже есть аккаунт?",
    createAccountLink: "Создать аккаунт",
    switch: "Сменить",
    signOut: "Выйти",
    save: "Сохранить",
    delete: "Удалить",
    cancel: "Отмена",
    new: "Новое",
    all: "Все",
    loading: "Загрузка…",
    whosPlaying: "Кто играет?",
    dailyQuestsTagline: "Ежедневные задания, стрики и награды.",
    pickProfile: "Выберите профиль",
    manageTasksApprove: "Управление задачами и наградами",
    dayStreak: "дней подряд",
    questsTab: "🎯 Задания",
    rewardsTab: "🎁 Награды",
    streak: "стрик",
    coins: "монеты",
    allDone: "🎉 Все задания выполнены! Отлично!",
    keepGoing: (name: string, n: number) => `Продолжай, ${name}! Осталось ${n} заданий сегодня.`,
    noQuests: "Заданий пока нет",
    noQuestsHint: "Попроси родителя добавить задания.",
    rewardStore: "Магазин наград",
    myPurchases: "Мои покупки",
    nothingYet: "Пока пусто — копи монеты!",
    delivered: "Выдано",
    pending: "Ожидает",
    needMoreCoins: (n: number) => `Нужно ещё ${n} монет!`,
    rewardUnlocked: "Награда получена",
    backToProfiles: "← К профилям",
    loadingQuests: "Загрузка заданий…",
    parentDashboard: "Панель родителя",
    tabTasks: "Задания",
    tabFamily: "Семья",
    tabReview: "Проверка",
    tabRewards: "Награды",
    newQuest: "Новое задание",
    editQuest: "Изменить задание",
    title: "Название",
    category: "Категория",
    assignee: "Исполнитель",
    frequency: "Частота",
    coinReward: "Награда в монетах",
    activeDays: "Активные дни",
    scheduleType: "Расписание",
    daily: "ежедневно",
    weekly: "еженедельно",
    createQuest: "Создать задание",
    saveChanges: "Сохранить",
    saving: "Сохранение…",
    noQuestsCreate: 'Нет заданий. Нажмите "Новое".',
    pendingCount: (n: number) => `Ожидают (${n})`,
    deliver: "Выдать",
    noPending: "Нет ожидающих наград. 🎉",
    deliveredHeader: "Выданные",
    familyCount: (n: number) => `Семья (${n})`,
    addChild: "Добавить ребёнка",
    addChildTitle: "Добавить ребёнка",
    noChildren: 'Детей пока нет. Нажмите "Добавить ребёнка".',
    name: "Имя",
    avatarEmoji: "Аватар (эмодзи)",
    sixDigitPin: "6-значный PIN (для входа ребёнка)",
    sharePinHint: 'Сообщите PIN ребёнку. На экране входа он выбирает "Вход ребёнка".',
    creating: "Создание…",
    createChildAccount: "Создать аккаунт",
    recentCompletions: "Недавние выполнения",
    noCompletionsYet: "Пока нет выполнений. Они появятся в реальном времени. ⚡",
    dispute: "Отменить",
    manageRewards: "Управление наградами",
    addReward: "Добавить награду",
    newReward: "Новая награда",
    editReward: "Изменить награду",
    rewardName: "Название награды",
    rewardEmoji: "Эмодзи",
    cost: "Стоимость (монеты)",
    active: "Активна",
    inactive: "Неактивна",
    titleRequired: "Введите название (на английском или русском)",
    nameRequired: "Введите название (на английском или русском)",
    moneyPreset: "💵 Деньги (обменять все монеты)",
    moneyPresetHint: "Любая покупка обменивает ВСЕ текущие монеты на реальные деньги.",
    showMore: "Показать ещё",
    showLess: "Свернуть",
    allCoins: "Все",
    confirmExchange: (n: number) => `Обменять все ${n} монет на деньги?`,
    cat_Hygiene: "Гигиена",
    cat_Chores: "Домашние дела",
    "cat_Self-Education": "Саморазвитие",
    cat_Reading: "Чтение",
    cat_Piano: "Пианино",
    cat_Chess: "Шахматы",
    cat_Sports: "Спорт",
    cat_Creative: "Творчество",
    sched_always: "Всегда",
    sched_school_days: "Учебные дни",
    sched_holidays: "Выходные",
    language: "Язык",
  },
} as const;

type Dict = typeof DICT.en;
type Key = keyof Dict;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      localStorage.getItem("kidsday.lang")) as Lang | null;
    if (saved === "en" || saved === "ru") {
      setLangState(saved);
      return;
    }
    if (typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ru")) {
      setLangState("ru");
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("kidsday.lang", l);
    } catch {
      // ignore
    }
  };

  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang outside LanguageProvider");
  return c;
}

export function useT() {
  const { lang } = useLang();
  const d = DICT[lang];
  function t<K extends Key>(key: K): Dict[K];
  function t(key: string): string;
  function t(key: string): unknown {
    return (d as Record<string, unknown>)[key] ?? key;
  }
  return t;
}

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`inline-flex overflow-hidden rounded-full border border-border bg-card text-xs font-extrabold ${className}`}
      role="group"
      aria-label="Language"
    >
      {(["en", "ru"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 uppercase transition ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
