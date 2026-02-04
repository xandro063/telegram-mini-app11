const AppState = {
    tg: null,
    user: null,
    balance: null,
    investments: null,
    referrals: null,
    history: [],
    calculator: {
        selectedDays: 30,
        currentAmount: 1000
    },
    career: {
        levels: [
            { name: "Новичок", required: 0, bonus: 0, className: 'level-novice' },
            { name: "Латунный", required: 1000, bonus: 50, className: 'level-brass' },
            { name: "Бронзовый", required: 3000, bonus: 100, className: 'level-bronze' },
            { name: "Серебряный", required: 5000, bonus: 250, className: 'level-silver' },
            { name: "Золотой", required: 10000, bonus: 500, className: 'level-gold' }
        ],
        receivedBonuses: ["Латунный"]
    },
    initialized: {
        calculator: false,
        careerAccordion: false
    }
};

const NavigationHistory = {
    history: ['home'],
    
    push(page) {
        if (this.getCurrent() !== page) {
            this.history.push(page);
        }
    },
    
    pop() {
        if (this.history.length > 1) {
            this.history.pop();
            return this.history[this.history.length - 1];
        }
        return 'home';
    },
    
    getCurrent() {
        return this.history[this.history.length - 1];
    },
    
    clear() {
        this.history = ['home'];
    }
};

function initApp() {
    if (typeof Telegram !== 'undefined' && Telegram.WebApp) {
        setupTelegramApp();
    } else {
        setupDevMode();
    }
    
    loadInitialData();
    setupEventListeners();
    initCalculator();
    initPaymentSystem();
    startNotificationSimulation();
    
    setTimeout(() => {
        const loader = document.getElementById('appLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
                showWelcomeAnimation();
                
                setTimeout(() => {
                    showNotification('💰 Добро пожаловать!', 
                        'Ваш инвестиционный портфель готов к работе. Начинайте зарабатывать уже сегодня!', 
                        'money');
                }, 1000);
                
            }, 500);
        }
    }, 800);
}

function showWelcomeAnimation() {
    document.querySelectorAll('.balance-card, .quick-actions').forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 100 + (index * 100));
    });
}

function setupTelegramApp() {
    const tg = Telegram.WebApp;
    AppState.tg = tg;
    
    tg.expand();
    tg.ready();
    
    if (tg.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
    
    const telegramUser = tg.initDataUnsafe?.user;
    if (telegramUser) {
        if (!AppState.user) AppState.user = {};
        AppState.user.telegramId = telegramUser.id;
        AppState.user.name = `${telegramUser.first_name || ''} ${telegramUser.last_name || ''}`.trim();
        AppState.user.username = telegramUser.username;
        
        const referralCode = btoa(telegramUser.id.toString()).slice(0, 10);
        if (!AppState.referrals) AppState.referrals = {};
        AppState.referrals.link = `https://t.me/your_invest_bot?start=ref_${referralCode}`;
    }
    
    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam && startParam.startsWith('ref_')) {
        showNotification('👋 Реферальный переход', 
            `Вы перешли по ссылке реферала. Начинайте инвестировать!`, 
            'info');
    }
}

function setupDevMode() {
    AppState.tg = {
        WebApp: {
            initDataUnsafe: {
                user: {
                    id: Date.now(),
                    first_name: "Александр",
                    last_name: "Иванов",
                    username: "investor_pro"
                }
            }
        }
    };
    
    const referralCode = btoa(Date.now().toString()).slice(0, 10);
    if (!AppState.referrals) AppState.referrals = {};
    AppState.referrals.link = `https://t.me/your_invest_bot?start=ref_${referralCode}`;
}

function loadInitialData() {
    AppState.user = {
        id: "#" + Math.floor(100000 + Math.random() * 900000),
        name: "Александр Иванов",
        telegramId: AppState.tg?.WebApp?.initDataUnsafe?.user?.id || Date.now(),
        joinDate: "2024-01-15",
        lastLogin: new Date().toISOString()
    };
    
    AppState.balance = {
        total: 12450.75,
        available: 8745.30,
        invested: 3705.45,
        dailyProfit: 128.75,
        dailyPercent: 2.5,
        referralsCount: 24,
        activeDays: 18,
        successRate: 87,
        totalDeposits: 5000,
        totalWithdrawals: 1000
    };
    
    AppState.investments = {
        totalInvested: 3705.45,
        dailyPercent: 2.5,
        daysInvested: 18,
        maxDays: 25,
        canWithdrawDate: "2024-03-12",
        lastProfitDate: new Date().toISOString()
    };
    
    AppState.referrals = {
        link: AppState.referrals?.link || "https://t.me/your_invest_bot?start=ref_" + btoa(Date.now().toString()).slice(0, 10),
        level1Percent: 10,
        level2Percent: 5,
        stats: {
            level1Count: 3,
            level2Count: 2,
            totalEarnings: 190,
            todayEarnings: 15.50,
            totalReferrals: 5,
            totalDeposits: 1500,
            todayReferrals: 1
        }
    };
    
    AppState.history = generateSampleHistory();
    updateAllUI();
}

function generateSampleHistory() {
    const now = new Date();
    const history = [];
    
    for (let i = 0; i < 7; i++) {
        history.push({
            id: 'profit_' + i,
            type: 'profit',
            amount: 85 + Math.random() * 50,
            date: new Date(now.getTime() - i * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ежедневная прибыль',
            status: 'completed'
        });
    }
    
    for (let i = 0; i < 3; i++) {
        history.push({
            id: 'referral_' + i,
            type: 'referral',
            amount: 5 + Math.random() * 15,
            date: new Date(now.getTime() - i * 3 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Начисление от реферала',
            referrerName: i === 0 ? 'Иван Петров' : 'Мария Сидорова',
            status: 'completed'
        });
    }
    
    history.push({
        id: 'bonus_1',
        type: 'bonus',
        amount: 50,
        date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Бонус за Латунный уровень',
        status: 'completed'
    });
    
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function updateAllUI() {
    updateUserUI();
    updateReferralsUI();
    updateHistoryUI();
    updateCareerUI();
    updateEarningsStatsUI();
}

function updateUserUI() {
    if (!AppState.user || !AppState.balance) return;
    
    setText('.user-name', AppState.user.name);
    setText('.user-tag.id', AppState.user.id);
    setText('#totalBalance', `$${AppState.balance.total.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
    
    setText('#dailyChange', `+$${AppState.balance.dailyProfit.toFixed(2)} сегодня`);
    setText('#availableBalance', `$${AppState.balance.available.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
    setText('#investedBalance', `$${AppState.balance.invested.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
    setText('#dailyIncome', `+$${AppState.balance.dailyProfit.toFixed(2)}`);
    
    setText('#referralsCount', AppState.balance.referralsCount);
    setText('#investmentProgress', `${AppState.balance.activeDays}/25`);
    setText('#profitPercent', `${AppState.balance.dailyPercent}%`);
    setText('#successRate', `${AppState.balance.successRate}%`);
    
    const progressPercent = (AppState.balance.activeDays / 25) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    // Обновляем текущий уровень в user tag
    const currentLevel = getCurrentCareerLevel();
    const levelElement = document.querySelector('.user-tag.level');
    if (levelElement) {
        levelElement.textContent = currentLevel.name + " инвестор";
        levelElement.className = 'user-tag level ' + currentLevel.className;
    }
}

function updateCareerUI() {
    if (!AppState.user || !AppState.referrals) return;
    
    const currentLevel = getCurrentCareerLevel();
    const nextLevel = getNextCareerLevel();
    const progress = calculateCareerProgress();
    const referralDeposits = AppState.referrals?.stats?.totalDeposits || 0;
    
    // Обновляем информацию в лестнице успеха
    setText('.level-indicator .indicator-label', 'Вы здесь');
    
    // Обновляем прогресс для Бронзового уровня
    const bronzeProgress = document.querySelector('.ladder-level[data-level="bronze"] .progress-percent');
    const bronzeProgressFill = document.querySelector('.ladder-level[data-level="bronze"] .progress-fill');
    if (bronzeProgress && bronzeProgressFill) {
        bronzeProgress.textContent = `${Math.round(progress)}%`;
        bronzeProgressFill.style.width = `${progress}%`;
    }
    
    // Обновляем текущую информацию
    const currentLevelCard = document.querySelector('.current-level-card .level-name');
    const currentDescription = document.querySelector('.current-level-card .level-description');
    const nextLevelAmount = document.querySelector('.next-level-card .level-amount');
    const nextLevelDescription = document.querySelector('.next-level-card .level-description');
    
    if (currentLevelCard) currentLevelCard.textContent = currentLevel.name + " инвестор";
    if (currentDescription) currentDescription.textContent = `Сумма депозитов рефералов: $${referralDeposits.toLocaleString('ru-RU')}`;
    if (nextLevelAmount) nextLevelAmount.textContent = `$${(nextLevel.required - referralDeposits).toLocaleString('ru-RU')}`;
    if (nextLevelDescription) nextLevelDescription.textContent = `Нужно привлечь ещё 3-4 активных реферала`;
    
    // Обновляем кнопки получения бонусов
    updateCareerBonusesUI();
}

function updateCareerBonusesUI() {
    const currentLevel = getCurrentCareerLevel();
    const nextLevel = getNextCareerLevel();
    const currentDeposits = AppState.referrals?.stats?.totalDeposits || 0;
    
    // Находим элемент бонуса Бронзового уровня
    const bronzeReward = document.querySelector('.ladder-level[data-level="bronze"] .level-reward');
    const bronzeButton = document.querySelector('.ladder-level[data-level="bronze"] .reward-claim-btn');
    
    if (bronzeReward && bronzeButton) {
        if (currentDeposits >= nextLevel.required && !AppState.career.receivedBonuses.includes(nextLevel.name)) {
            bronzeReward.className = 'level-reward available';
            bronzeButton.innerHTML = '<i class="fas fa-gift"></i> Получить';
            bronzeButton.disabled = false;
            bronzeButton.style.opacity = '1';
            bronzeButton.setAttribute('data-level', nextLevel.name);
        } else if (AppState.career.receivedBonuses.includes(nextLevel.name)) {
            bronzeReward.className = 'level-reward earned';
            bronzeReward.innerHTML = '<i class="fas fa-check-circle"></i><span>Получено: $' + nextLevel.bonus + '</span>';
            if (bronzeButton) bronzeButton.style.display = 'none';
        } else {
            bronzeReward.className = 'level-reward';
            bronzeReward.innerHTML = '<i class="fas fa-gift"></i><span>Бонус: $' + nextLevel.bonus + '</span>';
            if (bronzeButton) bronzeButton.style.display = 'none';
        }
    }
}

function updateEarningsStatsUI() {
    if (!AppState.balance || !AppState.referrals || !AppState.career) return;
    
    // Рассчитываем общую прибыль от инвестиций (приблизительно)
    const totalInvestmentProfit = AppState.balance.dailyProfit * AppState.balance.activeDays;
    
    // Обновляем статистику заработка
    setText('#totalInvestmentProfit', `$${totalInvestmentProfit.toFixed(2)}`);
    setText('#totalReferralEarnings', `$${AppState.referrals.stats.totalEarnings.toFixed(2)}`);
    
    // Рассчитываем сумму полученных бонусов карьеры
    const totalCareerBonuses = AppState.career.receivedBonuses.reduce((sum, levelName) => {
        const level = AppState.career.levels.find(l => l.name === levelName);
        return sum + (level?.bonus || 0);
    }, 0);
    
    setText('#totalCareerBonuses', `$${totalCareerBonuses.toFixed(2)}`);
    
    // Обновляем общий доход
    const totalAllEarnings = totalInvestmentProfit + AppState.referrals.stats.totalEarnings + totalCareerBonuses;
    setText('#totalAllEarnings', `$${totalAllEarnings.toFixed(2)}`);
    
    // Обновляем график
    const investmentPercent = Math.round((totalInvestmentProfit / totalAllEarnings) * 100) || 90;
    const referralPercent = Math.round((AppState.referrals.stats.totalEarnings / totalAllEarnings) * 100) || 7;
    const careerPercent = Math.round((totalCareerBonuses / totalAllEarnings) * 100) || 3;
    
    const investmentBar = document.querySelector('.chart-bar.investment');
    const referralBar = document.querySelector('.chart-bar.referral');
    const careerBar = document.querySelector('.chart-bar.career');
    
    if (investmentBar) {
        investmentBar.style.width = `${investmentPercent}%`;
        investmentBar.querySelector('.bar-percent').textContent = `${investmentPercent}%`;
    }
    if (referralBar) {
        referralBar.style.width = `${referralPercent}%`;
        referralBar.querySelector('.bar-percent').textContent = `${referralPercent}%`;
    }
    if (careerBar) {
        careerBar.style.width = `${careerPercent}%`;
        careerBar.querySelector('.bar-percent').textContent = `${careerPercent}%`;
    }
}

function getCurrentCareerLevel() {
    const depositSum = AppState.referrals?.stats?.totalDeposits || 0;
    let currentLevel = AppState.career.levels[0];
    
    for (let i = 0; i < AppState.career.levels.length; i++) {
        if (depositSum >= AppState.career.levels[i].required) {
            currentLevel = AppState.career.levels[i];
        } else {
            break;
        }
    }
    return currentLevel;
}

function getNextCareerLevel() {
    const current = getCurrentCareerLevel();
    const currentIndex = AppState.career.levels.findIndex(level => level.name === current.name);
    return AppState.career.levels[currentIndex + 1] || current;
}

function calculateCareerProgress() {
    const current = getCurrentCareerLevel();
    const next = getNextCareerLevel();
    
    if (current.required === next.required) return 100;
    
    const depositSum = AppState.referrals?.stats?.totalDeposits || 0;
    const progress = ((depositSum - current.required) / (next.required - current.required)) * 100;
    return Math.min(100, Math.max(0, progress));
}

function claimCareerBonus(event) {
    const button = event?.target?.closest('[data-action="claim-bonus"]');
    if (!button) return;
    
    const levelName = button.getAttribute('data-level');
    const level = AppState.career.levels.find(l => l.name === levelName);
    const currentDeposits = AppState.referrals?.stats?.totalDeposits || 0;
    
    if (level && currentDeposits >= level.required && 
        !AppState.career.receivedBonuses.includes(level.name)) {
        
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        button.disabled = true;
        
        setTimeout(() => {
            AppState.balance.available += level.bonus;
            AppState.balance.total += level.bonus;
            AppState.career.receivedBonuses.push(level.name);
            
            AppState.history.unshift({
                id: 'bonus_' + Date.now(),
                type: 'bonus',
                amount: level.bonus,
                date: new Date().toISOString(),
                description: `Бонус за ${level.name} уровень`,
                status: 'completed'
            });
            
            updateAllUI();
            showConfetti();
            
            showNotification(
                '🎉 Бонус получен!', 
                `Начислено $${level.bonus} за ${level.name} уровень`, 
                'success'
            );
            
            showMoneyRain();
        }, 800);
    } else {
        showNotification('Информация', 'Нет доступных бонусов для получения', 'info');
    }
}

function initCareerAccordion() {
    if (AppState.initialized.careerAccordion) return;
    
    const accordionItems = document.querySelectorAll('.accordion-item');
    
    accordionItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        const content = item.querySelector('.accordion-content');
        const icon = item.querySelector('.accordion-icon i');
        
        header.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Закрываем все элементы
            accordionItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    const otherContent = otherItem.querySelector('.accordion-content');
                    const otherIcon = otherItem.querySelector('.accordion-icon i');
                    if (otherContent) otherContent.style.maxHeight = null;
                    if (otherIcon) {
                        otherIcon.className = 'fas fa-chevron-right';
                        otherIcon.style.transform = 'rotate(0deg)';
                    }
                }
            });
            
            // Переключаем текущий элемент
            if (!isActive) {
                item.classList.add('active');
                if (content) content.style.maxHeight = content.scrollHeight + 'px';
                if (icon) {
                    icon.className = 'fas fa-chevron-down';
                    icon.style.transform = 'rotate(0deg)';
                }
            } else {
                item.classList.remove('active');
                if (content) content.style.maxHeight = null;
                if (icon) {
                    icon.className = 'fas fa-chevron-right';
                    icon.style.transform = 'rotate(0deg)';
                }
            }
        });
    });
    
    // Открываем первый элемент по умолчанию
    const firstItem = document.querySelector('.accordion-item');
    const firstContent = firstItem?.querySelector('.accordion-content');
    if (firstItem && firstContent) {
        firstItem.classList.add('active');
        firstContent.style.maxHeight = firstContent.scrollHeight + 'px';
    }
    
    AppState.initialized.careerAccordion = true;
}

function showExitProjectModal() {
    updateExitModalBalances();
    const modal = document.getElementById('exitProjectModal');
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            modal.style.transition = 'opacity 0.3s, transform 0.3s';
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        }, 10);
        
        document.body.style.overflow = 'hidden';
        
        // Сбрасываем чекбокс подтверждения
        const confirmationCheckbox = document.getElementById('exitConfirmation');
        const confirmButton = document.getElementById('confirmExitBtn');
        if (confirmationCheckbox) confirmationCheckbox.checked = false;
        if (confirmButton) confirmButton.disabled = true;
        
        // Добавляем обработчик изменения чекбокса
        if (confirmationCheckbox) {
            confirmationCheckbox.onchange = function() {
                if (confirmButton) {
                    confirmButton.disabled = !this.checked;
                }
            };
        }
    }
}

function updateExitModalBalances() {
    if (!AppState.balance) return;
    
    setText('#exitAvailableBalance', `$${AppState.balance.available.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
    setText('#exitInvestedBalance', `$${AppState.balance.invested.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
    setText('#exitTotalBalance', `$${AppState.balance.total.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`);
}

function confirmExitProject() {
    const button = document.getElementById('confirmExitBtn');
    if (!button || button.disabled) return;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка...';
    button.disabled = true;
    
    // Симуляция обработки выхода
    setTimeout(() => {
        // Снимаем все средства
        const totalWithdraw = AppState.balance.total;
        
        // Добавляем запись в историю
        AppState.history.unshift({
            id: 'exit_project_' + Date.now(),
            type: 'withdraw',
            amount: totalWithdraw,
            date: new Date().toISOString(),
            description: 'Полный вывод при выходе с проекта',
            status: 'completed',
            method: 'project_exit'
        });
        
        // Обнуляем балансы
        AppState.balance.total = 0;
        AppState.balance.available = 0;
        AppState.balance.invested = 0;
        AppState.balance.dailyProfit = 0;
        
        // Обновляем UI
        updateAllUI();
        updateHistoryUI();
        
        // Закрываем модальное окно
        closeAllModals();
        
        // Показываем уведомление
        showNotification(
            '📤 Выход выполнен', 
            `Все средства ($${totalWithdraw.toLocaleString('ru-RU', {minimumFractionDigits: 2})}) успешно выведены.`, 
            'success'
        );
        
        // Через 2 секунды показываем финальное сообщение
        setTimeout(() => {
            showNotification(
                '👋 До свидания!', 
                'Вы успешно вышли из проекта. Надеемся увидеть вас снова!', 
                'info'
            );
        }, 2000);
        
    }, 3000);
}

function updateReferralsUI() {
    if (!AppState.referrals) return;
    
    const linkInput = document.getElementById('referralLink');
    if (linkInput) linkInput.value = AppState.referrals.link;
    
    setText('#level1Percent', `${AppState.referrals.level1Percent}%`);
    setText('#level2Percent', `${AppState.referrals.level2Percent}%`);
    setText('#level1Count', AppState.referrals.stats.level1Count);
    setText('#level2Count', AppState.referrals.stats.level2Count);
    setText('#totalReferralProfit', `$${AppState.referrals.stats.totalEarnings.toFixed(2)}`);
    setText('#todayReferralProfit', `$${AppState.referrals.stats.todayEarnings.toFixed(2)}`);
    setText('#totalReferralDeposits', `$${AppState.referrals.stats.totalDeposits.toFixed(2)}`);
}

function copyReferralLink() {
    const input = document.getElementById('referralLink');
    const button = document.querySelector('[data-action="copy-link"]');
    
    if (!input || !button) return;
    
    input.select();
    input.setSelectionRange(0, 99999);
    
    navigator.clipboard.writeText(input.value).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('copy-success');
        button.style.animation = 'pulse 0.5s';
        
        showNotification('✅ Скопировано!', 'Реферальная ссылка скопирована в буфер обмена', 'success');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove('copy-success');
            button.style.animation = '';
        }, 2000);
    });
}

function updateHistoryUI() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    const activeFilter = document.querySelector('.filter-btn.active')?.getAttribute('data-filter') || 'all';
    
    let filteredHistory = AppState.history;
    if (activeFilter !== 'all') {
        filteredHistory = AppState.history.filter(item => item.type === activeFilter);
    }
    
    historyList.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
                <i class="fas fa-history" style="font-size: 48px; margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 8px;">История пуста</h3>
                <p>Здесь будут отображаться ваши операции</p>
            </div>
        `;
        return;
    }
    
    filteredHistory.forEach((item, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item slide-up';
        historyItem.style.animationDelay = `${index * 0.05}s`;
        
        let icon = 'fa-coins';
        let iconClass = 'profit';
        let amountClass = '';
        
        switch(item.type) {
            case 'deposit':
                icon = 'fa-plus-circle';
                iconClass = 'deposit';
                amountClass = '';
                break;
            case 'withdraw':
                icon = 'fa-download';
                iconClass = 'withdraw';
                amountClass = 'negative';
                break;
            case 'profit':
                icon = 'fa-chart-line';
                iconClass = 'profit';
                amountClass = '';
                break;
            case 'referral':
                icon = 'fa-users';
                iconClass = 'referral';
                amountClass = '';
                break;
            case 'bonus':
                icon = 'fa-gift';
                iconClass = 'referral';
                amountClass = '';
                break;
        }
        
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        historyItem.innerHTML = `
            <div class="history-icon ${iconClass}">
                <i class="fas ${icon}"></i>
            </div>
            <div class="history-content">
                <div class="history-title">${item.description}</div>
                <div class="history-date">${formattedDate}</div>
            </div>
            <div class="history-amount ${amountClass}">
                ${item.type === 'withdraw' ? '-' : '+'}$${item.amount.toFixed(2)}
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function initCalculator() {
    if (AppState.initialized.calculator) {
        calculateProfit();
        return;
    }
    
    setupCalculator();
    AppState.initialized.calculator = true;
}

function setupCalculator() {
    const amountInput = document.getElementById('calcSimpleAmount');
    if (!amountInput) return;
    
    amountInput.addEventListener('input', function() {
        AppState.calculator.currentAmount = parseFloat(this.value) || 1000;
        calculateProfit();
        highlightActivePreset('.amount-preset', this.value);
    });
    
    document.querySelectorAll('.amount-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            const amount = parseFloat(this.getAttribute('data-amount'));
            amountInput.value = amount;
            AppState.calculator.currentAmount = amount;
            highlightActivePreset('.amount-preset', amount);
            calculateProfit();
        });
    });
    
    document.querySelectorAll('.day-preset').forEach(btn => {
        btn.addEventListener('click', function() {
            const days = parseInt(this.getAttribute('data-days'));
            AppState.calculator.selectedDays = days;
            highlightActivePreset('.day-preset', days.toString());
            calculateProfit();
        });
    });
    
    AppState.calculator.selectedDays = 30;
    highlightActivePreset('.day-preset', '30');
    calculateProfit();
}

function highlightActivePreset(selector, value) {
    document.querySelectorAll(selector).forEach(b => {
        const isActive = b.getAttribute('data-amount') === value || 
                        b.getAttribute('data-days') === value;
        
        if (isActive) {
            b.classList.add('active');
            b.style.transform = 'scale(0.95)';
            setTimeout(() => {
                b.style.transform = 'scale(1)';
            }, 150);
        } else {
            b.classList.remove('active');
        }
    });
}

function calculateProfit() {
    const calculatorPage = document.getElementById('calculatorPage');
    if (!calculatorPage) return;
    
    const style = window.getComputedStyle(calculatorPage);
    if (style.display === 'none') return;
    
    const amountInput = document.getElementById('calcSimpleAmount');
    if (!amountInput) return;
    
    const amount = AppState.calculator.currentAmount || 1000;
    const days = AppState.calculator.selectedDays || 30;
    const percent = 2.5;
    
    const dailyProfit = (amount * percent) / 100;
    const totalProfit = dailyProfit * days;
    const totalAmount = amount + totalProfit;
    
    let title = "Доход в день";
    let periodProfit = dailyProfit;
    
    if (days === 7) {
        title = "Доход в неделю";
        periodProfit = dailyProfit * 7;
    } else if (days === 30) {
        title = "Доход в месяц";
        periodProfit = dailyProfit * 30;
    } else if (days === 90) {
        title = "Доход за 90 дней";
        periodProfit = dailyProfit * 90;
    } else if (days > 1) {
        title = `Доход за ${days} дней`;
        periodProfit = dailyProfit * days;
    }
    
    const formatCurrency = (num) => `$${num.toFixed(2)}`;
    const formatCurrencyLarge = (num) => `$${num.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`;
    
    animateNumber(document.getElementById('dynamicIncomeAmount'), formatCurrency(periodProfit));
    animateNumber(document.getElementById('dynamicInvestedAmount'), formatCurrencyLarge(amount));
    animateNumber(document.getElementById('dynamicTotalProfit'), formatCurrency(totalProfit));
    animateNumber(document.getElementById('dynamicTotalAmount'), formatCurrencyLarge(totalAmount));
    
    const incomeTitle = document.getElementById('incomeTitle');
    const incomeNote = document.getElementById('incomeNote');
    
    if (incomeTitle) incomeTitle.textContent = title;
    if (incomeNote) incomeNote.textContent = `На основе процента из админки: ${percent}% в день`;
}

function animateNumber(element, newValue) {
    if (!element) return;
    
    const oldValue = element.textContent;
    if (oldValue === newValue) return;
    
    element.style.opacity = '0.5';
    element.style.transform = 'translateY(5px)';
    
    setTimeout(() => {
        element.textContent = newValue;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        element.style.transition = 'opacity 0.3s, transform 0.3s';
    }, 150);
}

function smoothPageTransition(toPageFunction) {
    const currentPage = NavigationHistory.getCurrent();
    const transition = document.getElementById('pageTransition');
    
    if (transition) {
        transition.classList.add('active');
        
        setTimeout(() => {
            hideAllPages();
            toPageFunction();
            
            setTimeout(() => {
                transition.classList.remove('active');
                
                setTimeout(() => {
                    const newPages = document.querySelectorAll('.page[style*="display: block"], .main-content[style*="display: block"]');
                    newPages.forEach(page => {
                        page.style.opacity = '0';
                        page.style.transform = 'translateY(20px)';
                        
                        setTimeout(() => {
                            page.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                            page.style.opacity = '1';
                            page.style.transform = 'translateY(0)';
                        }, 10);
                    });
                }, 10);
            }, 300);
        }, 10);
    }
}

function showHomePage() {
    hideAllPages();
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.display = 'block';
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            mainContent.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'translateY(0)';
        }, 10);
    }
    setActiveNav('#home');
    NavigationHistory.push('home');
}

function showCalculatorPage() {
    hideAllPages();
    const page = document.getElementById('calculatorPage');
    if (page) {
        page.style.display = 'block';
        page.style.opacity = '0';
        page.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            page.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            page.style.opacity = '1';
            page.style.transform = 'translateY(0)';
        }, 10);
    }
    setActiveNav('#calculator');
    NavigationHistory.push('calculator');
    
    if (!AppState.initialized.calculator) {
        initCalculator();
    } else {
        calculateProfit();
    }
}

function showReferralsPage() {
    showPage('referralsPage', '#referrals', 'referrals');
}

function showCareerPage() {
    showPage('careerPage', '#career', 'career');
    updateCareerUI();
    updateEarningsStatsUI();
    
    // Инициализируем аккордеон при первом показе
    if (!AppState.initialized.careerAccordion) {
        setTimeout(() => {
            initCareerAccordion();
        }, 100);
    }
}

function showHistoryPage() {
    showPage('historyPage', '#history', 'history');
    updateHistoryUI();
}

function showPage(pageId, navId, historyKey) {
    hideAllPages();
    const page = document.getElementById(pageId);
    if (page) {
        page.style.display = 'block';
        page.style.opacity = '0';
        page.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            page.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            page.style.opacity = '1';
            page.style.transform = 'translateY(0)';
        }, 10);
    }
    setActiveNav(navId);
    NavigationHistory.push(historyKey);
}

function hideAllPages() {
    document.querySelectorAll('.page, .main-content').forEach(page => {
        page.style.display = 'none';
        page.style.opacity = '1';
        page.style.transform = 'translateX(0)';
    });
}

function setActiveNav(href) {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        item.style.transform = '';
    });
    
    const activeItem = document.querySelector(`.nav-item[href="${href}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        activeItem.style.transform = 'scale(0.95)';
        setTimeout(() => {
            activeItem.style.transform = 'scale(1)';
        }, 150);
    }
}

function goBack() {
    const currentPage = NavigationHistory.getCurrent();
    
    if (currentPage === 'home') {
        if (AppState.tg?.close && confirm('Закрыть приложение?')) {
            AppState.tg.close();
        }
        return;
    }
    
    NavigationHistory.pop();
    const previousPage = NavigationHistory.getCurrent();
    
    smoothPageTransition(() => {
        switch(previousPage) {
            case 'home': showHomePage(); break;
            case 'calculator': showCalculatorPage(); break;
            case 'referrals': showReferralsPage(); break;
            case 'career': showCareerPage(); break;
            case 'history': showHistoryPage(); break;
            default: showHomePage();
        }
    });
}

function setupEventListeners() {
    document.addEventListener('click', function(e) {
        const target = e.target.closest('[data-action]');
        if (!target) return;
        
        const action = target.getAttribute('data-action');
        const message = target.getAttribute('data-message');
        const filter = target.getAttribute('data-filter');
        e.preventDefault();
        
        switch(action) {
            case 'back': goBack(); break;
            case 'home': smoothPageTransition(showHomePage); break;
            case 'calculator': smoothPageTransition(showCalculatorPage); break;
            case 'referrals': smoothPageTransition(showReferralsPage); break;
            case 'career': smoothPageTransition(showCareerPage); break;
            case 'history': smoothPageTransition(showHistoryPage); break;
            case 'copy-link': copyReferralLink(); break;
            case 'claim-bonus': claimCareerBonus(e); break;
            case 'show-exit-modal': showExitProjectModal(); break;
            case 'show-info':
                if (message) showNotification('ℹ️ Информация', message, 'info');
                break;
            case 'filter':
                if (filter) {
                    document.querySelectorAll('.filter-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    target.classList.add('active');
                    updateHistoryUI();
                }
                break;
        }
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            
            smoothPageTransition(() => {
                switch(href) {
                    case '#home': showHomePage(); break;
                    case '#calculator': showCalculatorPage(); break;
                    case '#referrals': showReferralsPage(); break;
                    case '#career': showCareerPage(); break;
                    case '#history': showHistoryPage(); break;
                }
            });
        });
    });
    
    document.getElementById('refreshBalance')?.addEventListener('click', refreshBalance);
    document.getElementById('notificationsBtn')?.addEventListener('click', showNotificationsModal);
    document.getElementById('confirmExitBtn')?.addEventListener('click', confirmExitProject);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active');
            });
            this.classList.add('active');
            updateHistoryUI();
        });
    });
    
    let touchStartX = 0;
    document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    
    document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;
        
        if (diff > 100) goBack();
    });
}

function startNotificationSimulation() {
    setInterval(() => {
        const notifications = [
            {
                title: '💰 Начислена прибыль',
                message: `Начислено $${(Math.random() * 50 + 50).toFixed(2)} ежедневной прибыли`,
                type: 'money'
            },
            {
                title: '👥 Новый реферал',
                message: 'К вам присоединился новый реферал!',
                type: 'success'
            },
            {
                title: '🎯 Достижение',
                message: 'Вы выполнили условие для получения бонуса!',
                type: 'warning'
            },
            {
                title: '📈 Рост портфеля',
                message: `Ваш портфель вырос на ${(Math.random() * 2 + 0.5).toFixed(1)}%`,
                type: 'info'
            }
        ];
        
        const notification = notifications[Math.floor(Math.random() * notifications.length)];
        if (Math.random() > 0.5) {
            showNotification(notification.title, notification.message, notification.type);
            
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                const currentCount = parseInt(badge.textContent) || 0;
                badge.textContent = currentCount + 1;
            }
        }
        
        if (Math.random() > 0.8) simulateProfitAccrual();
    }, 30000);
}

function simulateProfitAccrual() {
    const profit = AppState.balance.dailyProfit / 24;
    AppState.balance.total += profit;
    AppState.balance.available += profit;
    
    AppState.history.unshift({
        id: 'profit_' + Date.now(),
        type: 'profit',
        amount: profit,
        date: new Date().toISOString(),
        description: 'Начисление прибыли',
        status: 'completed'
    });
    
    updateAllUI();
    
    if (Math.random() > 0.9) {
        showNotification('💸 Прибыль начислена', 
            `На ваш баланс поступило $${profit.toFixed(2)}`, 
            'money');
    }
}

function showNotificationsModal() {
    const notifications = [
        { title: '💰 Начислена прибыль', message: 'Начислено $128.75 ежедневной прибыли', time: '5 минут назад', type: 'money' },
        { title: '👥 Новый реферал', message: 'К вам присоединился новый реферал Иван Петров', time: '2 часа назад', type: 'success' },
        { title: '🎯 Достижение', message: 'Вы выполнили условие для получения бонуса за Латунный уровень', time: 'Вчера', type: 'warning' },
        { title: '📈 Рост портфеля', message: 'Ваш портфель вырос на 2.3% за неделю', time: '3 дня назад', type: 'info' }
    ];
    
    let modalHTML = `
        <div class="notification-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            padding: 20px;
        ">
            <div style="
                background: var(--bg-glass);
                border-radius: 32px;
                flex: 1;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            ">
                <div style="
                    padding: 28px 24px;
                    border-bottom: 1px solid var(--border);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="
                        font-size: 22px;
                        font-weight: 900;
                        color: var(--text-primary);
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    ">
                        <i class="fas fa-bell"></i>
                        Уведомления
                    </h2>
                    <button id="closeNotifications" style="
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                        background: rgba(148, 163, 184, 0.1);
                        border: 1px solid var(--border);
                        color: var(--text-secondary);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 20px;
                    ">
                        &times;
                    </button>
                </div>
                
                <div style="flex: 1; overflow-y: auto; padding: 20px;">
    `;
    
    notifications.forEach(notification => {
        modalHTML += `
            <div style="
                background: rgba(148, 163, 184, 0.05);
                border: 1px solid var(--border);
                border-radius: 24px;
                padding: 20px;
                margin-bottom: 16px;
                transition: all 0.3s;
            ">
                <div style="display: flex; align-items: flex-start; gap: 16px;">
                    <div style="
                        width: 44px;
                        height: 44px;
                        border-radius: 14px;
                        background: ${notification.type === 'money' ? 'var(--money-green)' : 
                                    notification.type === 'success' ? 'var(--primary)' : 
                                    notification.type === 'warning' ? 'var(--money-gold)' : 'var(--secondary)'};
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 18px;
                    ">
                        <i class="fas ${notification.type === 'money' ? 'fa-coins' : 
                                      notification.type === 'success' ? 'fa-users' : 
                                      notification.type === 'warning' ? 'fa-trophy' : 'fa-chart-line'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <h3 style="
                            font-size: 16px;
                            font-weight: 800;
                            color: var(--text-primary);
                            margin-bottom: 4px;
                        ">${notification.title}</h3>
                        <p style="
                            font-size: 14px;
                            color: var(--text-secondary);
                            margin-bottom: 8px;
                            line-height: 1.4;
                        ">${notification.message}</p>
                        <span style="
                            font-size: 12px;
                            color: var(--text-tertiary);
                            font-weight: 600;
                        ">${notification.time}</span>
                    </div>
                </div>
            </div>
        `;
    });
    
    modalHTML += `
                </div>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.innerHTML = modalHTML;
    document.body.appendChild(modal);
    
    document.getElementById('closeNotifications')?.addEventListener('click', () => {
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        setTimeout(() => {
            document.body.removeChild(modal);
            
            const badge = document.getElementById('notificationBadge');
            if (badge) badge.textContent = '0';
        }, 300);
    });
    
    setTimeout(() => {
        modal.style.opacity = '0';
        modal.style.transform = 'translateY(20px)';
        modal.style.transition = 'opacity 0.3s, transform 0.3s';
        
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translateY(0)';
        }, 10);
    }, 10);
}

function setText(selector, text) {
    const element = document.querySelector(selector);
    if (element) {
        if (element.tagName === 'INPUT') {
            element.value = text;
        } else {
            element.textContent = text;
        }
    }
}

function refreshBalance() {
    const refreshIcon = document.querySelector('#refreshBalance i');
    if (refreshIcon) {
        refreshIcon.style.transform = 'rotate(0deg)';
        refreshIcon.style.transition = 'transform 0.5s ease';
        
        setTimeout(() => {
            refreshIcon.style.transform = 'rotate(360deg)';
        }, 10);
        
        setTimeout(() => {
            refreshIcon.style.transform = 'rotate(0deg)';
        }, 510);
    }
    
    if (AppState.balance) {
        const dailyProfit = AppState.balance.dailyProfit;
        AppState.balance.total += dailyProfit;
        AppState.balance.available += dailyProfit;
        
        AppState.history.unshift({
            id: 'profit_' + Date.now(),
            type: 'profit',
            amount: dailyProfit,
            date: new Date().toISOString(),
            description: 'Ежедневная прибыль',
            status: 'completed'
        });
        
        const balanceCard = document.querySelector('.balance-card');
        if (balanceCard) {
            balanceCard.style.boxShadow = '0 0 40px rgba(16, 185, 129, 0.4)';
            setTimeout(() => {
                balanceCard.style.boxShadow = '';
            }, 1000);
        }
        
        updateAllUI();
        showNotification('💰 Баланс обновлен!', `+$${dailyProfit.toFixed(2)} начислено`, 'money');
        showMoneyRain();
    }
}

function showNotification(title, message, type = 'info') {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6',
        money: '#fbbf24'
    };
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
        money: '💰'
    };
    
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.setAttribute('data-type', type);
    
    notification.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 16px;
        z-index: 10000;
        max-width: 320px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(20px);
        transform: translateX(400px);
        opacity: 0;
        transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
            <div style="font-size: 20px;">${icons[type]}</div>
            <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 6px; font-size: 16px;">${title}</strong>
                <div style="font-size: 14px; opacity: 0.9; line-height: 1.4; white-space: pre-line;">${message}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 300);
    }, 5000);
}

function showConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(confettiContainer);
    
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.cssText = `
            position: absolute;
            width: ${8 + Math.random() * 8}px;
            height: ${8 + Math.random() * 8}px;
            background: ${i % 4 === 0 ? '#FFD700' : i % 4 === 1 ? '#FF6B6B' : i % 4 === 2 ? '#4ECDC4' : '#7C3AED'};
            top: -20px;
            left: ${Math.random() * 100}%;
            border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
            opacity: 0.9;
        `;
        
        confettiContainer.appendChild(confetti);
        
        const animation = confetti.animate([
            { transform: `translateY(0) rotate(0deg)`, opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) rotate(${360 + Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: 1500 + Math.random() * 1500,
            easing: 'cubic-bezier(0.215, 0.61, 0.355, 1)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
    
    setTimeout(() => confettiContainer.remove(), 3000);
}

function showMoneyRain() {
    const moneyRain = document.getElementById('moneyRain');
    if (!moneyRain) return;
    
    moneyRain.innerHTML = '';
    
    for (let i = 0; i < 30; i++) {
        const money = document.createElement('div');
        money.className = 'money-particle';
        money.innerHTML = '💰';
        money.style.cssText = `
            position: absolute;
            left: ${Math.random() * 100}%;
            font-size: ${24 + Math.random() * 16}px;
            animation-delay: ${Math.random() * 1}s;
        `;
        
        moneyRain.appendChild(money);
        
        setTimeout(() => money.remove(), 3000);
    }
}

const PaymentState = {
    currentMethod: 'crypto',
    cryptoAddress: 'TNS1XmRDPD5zq7cGiE8RvKz9e3y4pAoF8Yq',
    cryptoFeePercent: 0,
    cardFeePercent: 3,
    withdrawCryptoFee: 1,
    withdrawCardFee: 2,
    minDepositCrypto: 10,
    minDepositCard: 10,
    minWithdrawCrypto: 20,
    minWithdrawCard: 50
};

function initPaymentSystem() {
    document.addEventListener('click', function(e) {
        const action = e.target.closest('[data-action]')?.getAttribute('data-action');
        
        switch(action) {
            case 'show-deposit-modal': showDepositModal(); break;
            case 'show-withdraw-modal': showWithdrawModal(); break;
            case 'close-modal': closeAllModals(); break;
        }
    });
    
    document.addEventListener('click', function(e) {
        const methodOption = e.target.closest('.method-option');
        if (methodOption) {
            const method = methodOption.getAttribute('data-method');
            selectPaymentMethod(method);
        }
    });
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('[data-copy="cryptoAddress"]')) copyCryptoAddress();
    });
    
    document.addEventListener('click', function(e) {
        const presetBtn = e.target.closest('.amount-preset-small');
        if (presetBtn && presetBtn.hasAttribute('data-amount')) {
            const amount = parseFloat(presetBtn.getAttribute('data-amount'));
            setDepositAmount(amount);
        }
    });
    
    document.addEventListener('input', function(e) {
        if (e.target.id === 'cryptoAmount' || e.target.id === 'cardAmount') updateDepositFee();
        if (e.target.id === 'withdrawCryptoAmount' || e.target.id === 'withdrawCardAmount') updateWithdrawFee();
    });
    
    document.getElementById('confirmDepositBtn')?.addEventListener('click', confirmDeposit);
    document.getElementById('confirmWithdrawBtn')?.addEventListener('click', confirmWithdraw);
}

function showDepositModal() {
    updateDepositAmounts();
    const modal = document.getElementById('depositModal');
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            modal.style.transition = 'opacity 0.3s, transform 0.3s';
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        }, 10);
        
        document.body.style.overflow = 'hidden';
    }
}

function showWithdrawModal() {
    updateWithdrawBalance();
    const modal = document.getElementById('withdrawModal');
    if (modal) {
        modal.style.display = 'flex';
        
        setTimeout(() => {
            modal.style.opacity = '0';
            modal.style.transform = 'scale(0.95)';
            modal.style.transition = 'opacity 0.3s, transform 0.3s';
            
            setTimeout(() => {
                modal.style.opacity = '1';
                modal.style.transform = 'scale(1)';
            }, 10);
        }, 10);
        
        document.body.style.overflow = 'hidden';
        updateWithdrawFee();
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(modal => {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => modal.style.display = 'none', 300);
    });
    
    document.body.style.overflow = '';
}

function selectPaymentMethod(method) {
    PaymentState.currentMethod = method;
    
    document.querySelectorAll('.method-option').forEach(option => {
        option.classList.remove('active');
        const checkIcon = option.querySelector('.method-check i');
        if (checkIcon) checkIcon.className = 'fas fa-circle';
    });
    
    const activeOption = document.querySelector(`.method-option[data-method="${method}"]`);
    if (activeOption) {
        activeOption.classList.add('active');
        const checkIcon = activeOption.querySelector('.method-check i');
        if (checkIcon) checkIcon.className = 'fas fa-check-circle';
    }
    
    if (document.getElementById('depositModal')?.style.display === 'flex') {
        document.getElementById('cryptoSection').style.display = method === 'crypto' ? 'block' : 'none';
        document.getElementById('cardSection').style.display = method === 'card' ? 'block' : 'none';
    } else if (document.getElementById('withdrawModal')?.style.display === 'flex') {
        document.getElementById('withdrawCryptoSection').style.display = method === 'crypto' ? 'block' : 'none';
        document.getElementById('withdrawCardSection').style.display = method === 'card' ? 'block' : 'none';
    }
    
    updateMinAmount();
    updateDepositFee();
    updateWithdrawFee();
}

function copyCryptoAddress() {
    const address = PaymentState.cryptoAddress;
    const button = document.querySelector('[data-copy="cryptoAddress"]');
    
    navigator.clipboard.writeText(address).then(() => {
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = 'var(--money-green)';
        
        showNotification('✅ Скопировано!', 'Адрес кошелька скопирован в буфер обмена', 'success');
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.background = '';
        }, 2000);
    });
}

function setDepositAmount(amount) {
    const isDepositModal = document.getElementById('depositModal')?.style.display === 'flex';
    const isWithdrawModal = document.getElementById('withdrawModal')?.style.display === 'flex';
    
    if (isDepositModal) {
        if (PaymentState.currentMethod === 'crypto') {
            document.getElementById('cryptoAmount').value = amount;
        } else {
            document.getElementById('cardAmount').value = amount;
        }
        updateDepositFee();
    } else if (isWithdrawModal) {
        if (PaymentState.currentMethod === 'crypto') {
            document.getElementById('withdrawCryptoAmount').value = amount;
        } else {
            document.getElementById('withdrawCardAmount').value = amount;
        }
        updateWithdrawFee();
    }
    
    document.querySelectorAll('.amount-preset-small').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.amount-preset-small[data-amount="${amount}"]`);
    if (activeBtn) activeBtn.classList.add('active');
}

function updateMinAmount() {
    let minAmount = 10;
    
    if (document.getElementById('depositModal')?.style.display === 'flex') {
        minAmount = PaymentState.currentMethod === 'crypto' 
            ? PaymentState.minDepositCrypto 
            : PaymentState.minDepositCard;
    } else if (document.getElementById('withdrawModal')?.style.display === 'flex') {
        minAmount = PaymentState.currentMethod === 'crypto'
            ? PaymentState.minWithdrawCrypto
            : PaymentState.minWithdrawCard;
    }
    
    const cryptoInput = document.getElementById('cryptoAmount');
    const cardInput = document.getElementById('cardAmount');
    const withdrawCryptoInput = document.getElementById('withdrawCryptoAmount');
    const withdrawCardInput = document.getElementById('withdrawCardAmount');
    
    if (cryptoInput) cryptoInput.min = PaymentState.minDepositCrypto;
    if (cardInput) cardInput.min = PaymentState.minDepositCard;
    if (withdrawCryptoInput) withdrawCryptoInput.min = PaymentState.minWithdrawCrypto;
    if (withdrawCardInput) withdrawCardInput.min = PaymentState.minWithdrawCard;
}

function updateDepositFee() {
    if (document.getElementById('depositModal')?.style.display !== 'flex') return;
    
    let amount = 0;
    let feePercent = 0;
    
    if (PaymentState.currentMethod === 'crypto') {
        amount = parseFloat(document.getElementById('cryptoAmount').value) || 0;
        feePercent = PaymentState.cryptoFeePercent;
    } else {
        amount = parseFloat(document.getElementById('cardAmount').value) || 0;
        feePercent = PaymentState.cardFeePercent;
    }
    
    const fee = (amount * feePercent) / 100;
    const total = amount + fee;
}

function updateWithdrawFee() {
    if (document.getElementById('withdrawModal')?.style.display !== 'flex') return;
    
    let amount = 0;
    let feePercent = 0;
    let feeElement = null;
    let receiveElement = null;
    
    if (PaymentState.currentMethod === 'crypto') {
        amount = parseFloat(document.getElementById('withdrawCryptoAmount').value) || 0;
        feePercent = PaymentState.withdrawCryptoFee;
        feeElement = document.getElementById('cryptoFee');
        receiveElement = document.getElementById('cryptoReceive');
    } else {
        amount = parseFloat(document.getElementById('withdrawCardAmount').value) || 0;
        feePercent = PaymentState.withdrawCardFee;
        feeElement = document.getElementById('cardWithdrawFee');
        receiveElement = document.getElementById('cardReceive');
    }
    
    const fee = (amount * feePercent) / 100;
    const receive = amount - fee;
    
    if (feeElement) feeElement.textContent = `$${fee.toFixed(2)}`;
    if (receiveElement) receiveElement.textContent = `$${receive.toFixed(2)}`;
}

function updateDepositAmounts() {
    const availableBalance = AppState.balance?.available || 0;
    
    document.querySelectorAll('.amount-preset-small').forEach(btn => {
        const amount = parseFloat(btn.getAttribute('data-amount'));
        if (amount > availableBalance) {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        } else {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
        }
    });
}

function updateWithdrawBalance() {
    const availableBalance = AppState.balance?.available || 0;
    const availableWithdrawElement = document.getElementById('availableWithdraw');
    
    if (availableWithdrawElement) {
        availableWithdrawElement.textContent = `$${availableBalance.toLocaleString('ru-RU', {minimumFractionDigits: 2})}`;
    }
    
    const withdrawCryptoInput = document.getElementById('withdrawCryptoAmount');
    const withdrawCardInput = document.getElementById('withdrawCardAmount');
    
    if (withdrawCryptoInput) {
        withdrawCryptoInput.max = availableBalance;
        if (parseFloat(withdrawCryptoInput.value) > availableBalance) {
            withdrawCryptoInput.value = availableBalance;
        }
    }
    
    if (withdrawCardInput) {
        withdrawCardInput.max = availableBalance;
        if (parseFloat(withdrawCardInput.value) > availableBalance) {
            withdrawCardInput.value = availableBalance;
        }
    }
}

function confirmDeposit() {
    let amount = 0;
    let method = PaymentState.currentMethod;
    
    if (method === 'crypto') {
        amount = parseFloat(document.getElementById('cryptoAmount').value) || 0;
        
        if (amount < PaymentState.minDepositCrypto) {
            showNotification('Ошибка', `Минимальная сумма для USDT: $${PaymentState.minDepositCrypto}`, 'error');
            return;
        }
        
        showNotification(
            '💎 Пополнение USDT',
            `Отправьте $${amount} USDT (TRC20) на адрес:\n${PaymentState.cryptoAddress}\n\nБаланс обновится после подтверждения сети.`,
            'info'
        );
        
        AppState.history.unshift({
            id: 'deposit_crypto_' + Date.now(),
            type: 'deposit',
            amount: amount,
            date: new Date().toISOString(),
            description: 'Запрос на пополнение USDT',
            status: 'pending',
            method: 'crypto'
        });
        
    } else {
        amount = parseFloat(document.getElementById('cardAmount').value) || 0;
        
        if (amount < PaymentState.minDepositCard) {
            showNotification('Ошибка', `Минимальная сумма для карты: $${PaymentState.minDepositCard}`, 'error');
            return;
        }
        
        simulateCardPayment(amount);
        return;
    }
    
    updateHistoryUI();
    showNotification(
        '✅ Запрос принят!',
        `Запрос на пополнение $${amount} ${method === 'crypto' ? 'USDT' : 'по карте'} принят в обработку.`,
        'success'
    );
    
    closeAllModals();
}

function simulateCardPayment(amount) {
    const button = document.getElementById('confirmDepositBtn');
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обработка платежа...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = '<i class="fas fa-check"></i> Платеж успешен!';
        button.style.background = 'var(--money-green)';
        
        AppState.history.unshift({
            id: 'deposit_card_' + Date.now(),
            type: 'deposit',
            amount: amount,
            date: new Date().toISOString(),
            description: 'Пополнение по карте',
            status: 'completed',
            method: 'card'
        });
        
        AppState.balance.total += amount;
        AppState.balance.available += amount;
        
        updateAllUI();
        updateHistoryUI();
        
        showNotification(
            '💰 Баланс пополнен!',
            `На ваш баланс зачислено $${amount}.`,
            'money'
        );
        
        showMoneyRain();
        
        setTimeout(() => {
            closeAllModals();
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 500);
        }, 2000);
    }, 3000);
}

function confirmWithdraw() {
    let amount = 0;
    let method = PaymentState.currentMethod;
    let address = '';
    
    if (method === 'crypto') {
        amount = parseFloat(document.getElementById('withdrawCryptoAmount').value) || 0;
        address = document.getElementById('withdrawCryptoAddress').value.trim();
        
        if (amount < PaymentState.minWithdrawCrypto) {
            showNotification('Ошибка', `Минимальная сумма вывода USDT: $${PaymentState.minWithdrawCrypto}`, 'error');
            return;
        }
        
        if (!address || address.length < 20) {
            showNotification('Ошибка', 'Введите корректный адрес кошелька USDT', 'error');
            return;
        }
        
        if (amount > (AppState.balance?.available || 0)) {
            showNotification('Ошибка', 'Недостаточно средств на балансе', 'error');
            return;
        }
        
    } else {
        amount = parseFloat(document.getElementById('withdrawCardAmount').value) || 0;
        const cardNumber = document.getElementById('withdrawCardNumber').value.trim();
        const cardName = document.getElementById('withdrawCardName').value.trim();
        
        if (amount < PaymentState.minWithdrawCard) {
            showNotification('Ошибка', `Минимальная сумма вывода на карту: $${PaymentState.minWithdrawCard}`, 'error');
            return;
        }
        
        if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
            showNotification('Ошибка', 'Введите корректный номер карты (16 цифр)', 'error');
            return;
        }
        
        if (!cardName) {
            showNotification('Ошибка', 'Введите имя владельца карты', 'error');
            return;
        }
        
        if (amount > (AppState.balance?.available || 0)) {
            showNotification('Ошибка', 'Недостаточно средств на балансе', 'error');
            return;
        }
        
        address = `Карта ${cardNumber.slice(-4)}`;
    }
    
    const feePercent = method === 'crypto' ? PaymentState.withdrawCryptoFee : PaymentState.withdrawCardFee;
    const fee = (amount * feePercent) / 100;
    const receive = amount - fee;
    
    AppState.balance.available -= amount;
    AppState.balance.total -= amount;
    
    AppState.history.unshift({
        id: 'withdraw_' + method + '_' + Date.now(),
        type: 'withdraw',
        amount: amount,
        date: new Date().toISOString(),
        description: `Вывод ${method === 'crypto' ? 'USDT' : 'на карту'}`,
        status: 'pending',
        method: method,
        address: address,
        fee: fee,
        receive: receive
    });
    
    updateAllUI();
    updateHistoryUI();
    
    showNotification(
        '✅ Заявка на вывод принята!',
        `Вывод $${amount} ${method === 'crypto' ? 'USDT' : 'на карту'} обрабатывается.\nКомиссия: $${fee.toFixed(2)}\nК получению: $${receive.toFixed(2)}`,
        'success'
    );
    
    closeAllModals();
    
    setTimeout(() => {
        const withdrawRecord = AppState.history.find(item => 
            item.type === 'withdraw' && item.status === 'pending');
        
        if (withdrawRecord) {
            withdrawRecord.status = 'completed';
            updateHistoryUI();
            
            showNotification(
                '💰 Вывод завершен!',
                `Средства отправлены ${method === 'crypto' ? 'на указанный кошелек' : 'на вашу карту'}.`,
                'money'
            );
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', initApp);