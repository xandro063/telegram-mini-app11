// Конфигурация
const AdminConfig = {
    adminId: 'admin',
    sessionTimeout: 1800000,
    itemsPerPage: 20
};

const AdminState = {
    isLoggedIn: false,
    currentUser: null,
    currentPage: 'dashboard',
    sidebarOpen: false,
    filters: {
        users: { 
            search: '', 
            status: 'all', 
            level: 'all',
            page: 1,
            sortBy: 'joinDate',
            sortOrder: 'desc'
        },
        transactions: { 
            type: 'all', 
            status: 'all',
            date: '',
            page: 1,
            sortBy: 'date',
            sortOrder: 'desc'
        }
    },
    lastActivity: Date.now()
};

// Хранилище
const AdminStorage = {
    KEYS: { 
        USERS: 'admin_users', 
        TRANSACTIONS: 'admin_transactions', 
        SETTINGS: 'admin_settings', 
        LEVELS: 'admin_levels', 
        LOGS: 'admin_logs',
        PERCENT_OPERATIONS: 'admin_percent_ops',
        BROADCASTS: 'admin_broadcasts',
        BROADCAST_DRAFT: 'admin_broadcast_draft'
    },
    
    init() {
        if (!this.getUsers().length) this.saveUsers(this.getDemoUsers());
        if (!this.getTransactions().length) this.saveTransactions(this.getDemoTransactions());
        if (!this.getSettings()) this.saveSettings(this.getDefaultSettings());
        if (!this.getLevels().length) this.saveLevels(this.getDemoLevels());
        if (!this.getPercentOperations().length) this.savePercentOperations([]);
        if (!this.getBroadcasts().length) this.saveBroadcasts([]);
        
        AdminState.lastActivity = Date.now();
    },

    getDemoUsers() {
        const now = new Date();
        return [
            { 
                id: "#000001", 
                telegramId: 123456789, 
                name: "Александр Иванов", 
                username: "@alex_ivanov", 
                level: "Латунный", 
                levelId: 2, 
                balance: 12450.75, 
                available: 8745.30, 
                invested: 3705.45, 
                referrals: 5, 
                status: "active", 
                joinDate: "2024-01-15T10:30:00",
                lastActivity: now.toISOString(),
                email: "alex@example.com",
                phone: "+79001234567"
            },
            { 
                id: "#000002", 
                telegramId: 987654321, 
                name: "Мария Сидорова", 
                username: "@maria_sidorova", 
                level: "Новичок", 
                levelId: 1, 
                balance: 2500.00, 
                available: 2500.00, 
                invested: 0, 
                referrals: 0, 
                status: "active", 
                joinDate: "2024-02-10T14:20:00",
                lastActivity: now.toISOString(),
                email: "maria@example.com",
                phone: "+79007654321"
            }
        ];
    },

    getDemoTransactions() {
        const now = new Date();
        return [
            { 
                id: "TX001", 
                userId: "#000001", 
                userName: "Александр Иванов", 
                type: "deposit", 
                amount: 5000, 
                method: "crypto", 
                status: "completed", 
                date: new Date(now.getTime() - 86400000).toISOString(),
                details: "Пополнение через BTC"
            },
            { 
                id: "TX002", 
                userId: "#000001", 
                userName: "Александр Иванов", 
                type: "profit", 
                amount: 128.75, 
                method: "system", 
                status: "completed", 
                date: now.toISOString(),
                details: "Ежедневный процент"
            }
        ];
    },

    getDemoLevels() {
        return [
            { id: 1, name: "Новичок", required: 0, bonus: 0, color: "#94A3B8" },
            { id: 2, name: "Латунный", required: 1000, bonus: 50, color: "#D4A574" },
            { id: 3, name: "Серебряный", required: 5000, bonus: 200, color: "#C0C0C0" },
            { id: 4, name: "Золотой", required: 20000, bonus: 500, color: "#FFD700" }
        ];
    },

    getDefaultSettings() {
        return {
            investmentPercent: 2.5,
            referralLevel1: 10,
            referralLevel2: 5,
            minDepositCrypto: 10,
            minDepositCard: 10,
            minWithdrawCrypto: 20,
            minWithdrawCard: 50
        };
    },

    // Пользователи
    getUsers() { 
        return JSON.parse(localStorage.getItem(this.KEYS.USERS) || '[]'); 
    },
    
    saveUsers(users) { 
        localStorage.setItem(this.KEYS.USERS, JSON.stringify(users)); 
        return users; 
    },
    
    getUserById(id) { 
        return this.getUsers().find(u => u.id === id); 
    },
    
    getUsersByPage(page, filters = {}) {
        let users = this.getUsers();
        
        if (filters.search) {
            const q = filters.search.toLowerCase();
            users = users.filter(u => 
                u.id.toLowerCase().includes(q) || 
                u.name.toLowerCase().includes(q) ||
                u.username?.toLowerCase().includes(q) ||
                u.email?.toLowerCase().includes(q)
            );
        }
        
        if (filters.status !== 'all') {
            users = users.filter(u => u.status === filters.status);
        }
        
        if (filters.level !== 'all') {
            users = users.filter(u => u.levelId == filters.level);
        }
        
        if (filters.sortBy) {
            users.sort((a, b) => {
                const aVal = a[filters.sortBy] || '';
                const bVal = b[filters.sortBy] || '';
                if (filters.sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }
        
        const start = (page - 1) * AdminConfig.itemsPerPage;
        const end = start + AdminConfig.itemsPerPage;
        
        return {
            items: users.slice(start, end),
            total: users.length,
            page: page,
            pages: Math.ceil(users.length / AdminConfig.itemsPerPage)
        };
    },
    
    addUser(user) {
        const users = this.getUsers();
        if (!user.id) {
            user.id = `#${(users.length + 1).toString().padStart(6, '0')}`;
        }
        if (!user.joinDate) user.joinDate = new Date().toISOString();
        if (!user.lastActivity) user.lastActivity = new Date().toISOString();
        if (!user.status) user.status = 'active';
        if (!user.levelId) user.levelId = 1;
        if (!user.level) user.level = 'Новичок';
        if (!user.balance) user.balance = 0;
        if (!user.available) user.available = 0;
        if (!user.invested) user.invested = 0;
        if (!user.referrals) user.referrals = 0;
        
        users.push(user);
        this.saveUsers(users);
        this.addLog('user_create', `Создан пользователь ${user.id} - ${user.name}`);
        return user;
    },
    
    updateUser(id, updates) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            const oldUser = users[index];
            users[index] = { ...users[index], ...updates, lastActivity: new Date().toISOString() };
            this.saveUsers(users);
            
            const changes = [];
            Object.keys(updates).forEach(key => {
                if (oldUser[key] !== updates[key]) {
                    changes.push(`${key}: ${oldUser[key]} → ${updates[key]}`);
                }
            });
            
            if (changes.length > 0) {
                this.addLog('user_update', `Обновлен ${id}: ${changes.join(', ')}`);
            }
            
            return users[index];
        }
        return null;
    },
    
    deleteUser(id) {
        const users = this.getUsers();
        const index = users.findIndex(u => u.id === id);
        if (index !== -1) {
            const user = users[index];
            users.splice(index, 1);
            this.saveUsers(users);
            this.addLog('user_delete', `Удален ${id} - ${user.name}`);
            return true;
        }
        return false;
    },
    
    // Транзакции
    getTransactions() { 
        return JSON.parse(localStorage.getItem(this.KEYS.TRANSACTIONS) || '[]'); 
    },
    
    getTransactionsByPage(page, filters = {}) {
        let transactions = this.getTransactions();
        
        if (filters.type !== 'all') {
            transactions = transactions.filter(t => t.type === filters.type);
        }
        
        if (filters.status !== 'all') {
            transactions = transactions.filter(t => t.status === filters.status);
        }
        
        if (filters.date) {
            const date = new Date(filters.date);
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            transactions = transactions.filter(t => {
                const txDate = new Date(t.date);
                return txDate >= start && txDate <= end;
            });
        }
        
        if (filters.sortBy) {
            transactions.sort((a, b) => {
                const aVal = a[filters.sortBy] || '';
                const bVal = b[filters.sortBy] || '';
                if (filters.sortOrder === 'asc') {
                    return aVal > bVal ? 1 : -1;
                } else {
                    return aVal < bVal ? 1 : -1;
                }
            });
        }
        
        const start = (page - 1) * AdminConfig.itemsPerPage;
        const end = start + AdminConfig.itemsPerPage;
        
        return {
            items: transactions.slice(start, end),
            total: transactions.length,
            page: page,
            pages: Math.ceil(transactions.length / AdminConfig.itemsPerPage)
        };
    },
    
    saveTransactions(tx) { 
        localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(tx)); 
        return tx; 
    },
    
    addTransaction(tx) {
        const transactions = this.getTransactions();
        if (!tx.id) {
            const nextId = transactions.length + 1;
            tx.id = `TX${nextId.toString().padStart(6, '0')}`;
        }
        if (!tx.date) tx.date = new Date().toISOString();
        if (!tx.status) tx.status = 'completed';
        if (!tx.details) tx.details = '';
        
        transactions.push(tx);
        this.saveTransactions(transactions);
        this.addLog('tx_create', `Транзакция ${tx.id}: ${tx.type} $${tx.amount} для ${tx.userName}`);
        return tx;
    },
    
    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldTx = transactions[index];
            transactions[index] = { ...transactions[index], ...updates };
            this.saveTransactions(transactions);
            
            if (oldTx.status !== updates.status) {
                this.addLog('tx_update', `Транзакция ${id}: статус ${oldTx.status} → ${updates.status}`);
            }
            
            return transactions[index];
        }
        return null;
    },
    
    // Настройки
    getSettings() { 
        const settings = JSON.parse(localStorage.getItem(this.KEYS.SETTINGS));
        return settings ? settings : this.getDefaultSettings();
    },
    
    saveSettings(s) { 
        localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(s)); 
        return s; 
    },
    
    // Уровни
    getLevels() { 
        return JSON.parse(localStorage.getItem(this.KEYS.LEVELS) || '[]'); 
    },
    
    saveLevels(l) { 
        localStorage.setItem(this.KEYS.LEVELS, JSON.stringify(l)); 
        return l; 
    },
    
    addLevel(level) {
        const levels = this.getLevels();
        if (!level.id) {
            level.id = levels.length ? Math.max(...levels.map(l => l.id)) + 1 : 1;
        }
        levels.push(level);
        this.saveLevels(levels);
        this.addLog('level_add', `Добавлен уровень: ${level.name}`);
        return level;
    },
    
    updateLevel(id, updates) {
        const levels = this.getLevels();
        const index = levels.findIndex(l => l.id === id);
        if (index !== -1) {
            levels[index] = { ...levels[index], ...updates };
            this.saveLevels(levels);
            this.addLog('level_update', `Обновлен уровень ${id}: ${levels[index].name}`);
            return levels[index];
        }
        return null;
    },
    
    deleteLevel(id) {
        const levels = this.getLevels();
        const index = levels.findIndex(l => l.id === id);
        if (index !== -1) {
            const level = levels[index];
            levels.splice(index, 1);
            this.saveLevels(levels);
            this.addLog('level_delete', `Удален уровень: ${level.name}`);
            return true;
        }
        return false;
    },
    
    // Операции с процентами
    getPercentOperations() {
        return JSON.parse(localStorage.getItem(this.KEYS.PERCENT_OPERATIONS) || '[]');
    },
    
    savePercentOperations(ops) {
        localStorage.setItem(this.KEYS.PERCENT_OPERATIONS, JSON.stringify(ops));
        return ops;
    },
    
    addPercentOperation(percent, usersCount, totalAmount) {
        const ops = this.getPercentOperations();
        ops.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            admin: AdminState.currentUser?.username || 'Система',
            percent: percent,
            usersCount: usersCount,
            totalAmount: totalAmount
        });
        
        this.savePercentOperations(ops.slice(0, 100));
        return ops[0];
    },
    
    // Рассылки
    getBroadcasts() {
        return JSON.parse(localStorage.getItem(this.KEYS.BROADCASTS) || '[]');
    },
    
    saveBroadcasts(broadcasts) {
        localStorage.setItem(this.KEYS.BROADCASTS, JSON.stringify(broadcasts));
        return broadcasts;
    },
    
    addBroadcast(broadcast) {
        const broadcasts = this.getBroadcasts();
        broadcast.id = Date.now();
        broadcast.timestamp = new Date().toISOString();
        broadcast.admin = AdminState.currentUser?.username || 'Админ';
        
        broadcasts.unshift(broadcast);
        this.saveBroadcasts(broadcasts.slice(0, 50));
        return broadcast;
    },
    
    getBroadcastDraft() {
        return JSON.parse(localStorage.getItem(this.KEYS.BROADCAST_DRAFT));
    },
    
    saveBroadcastDraft(draft) {
        localStorage.setItem(this.KEYS.BROADCAST_DRAFT, JSON.stringify(draft));
        return draft;
    },
    
    // Логи
    getLogs() { 
        return JSON.parse(localStorage.getItem(this.KEYS.LOGS) || '[]'); 
    },
    
    addLog(action, details) {
        const logs = this.getLogs();
        logs.unshift({
            id: Date.now(),
            timestamp: new Date().toISOString(),
            admin: AdminState.currentUser?.username || 'Система',
            action: action,
            details: details,
            ip: '127.0.0.1'
        });
        
        localStorage.setItem(this.KEYS.LOGS, JSON.stringify(logs.slice(0, 1000)));
    },
    
    // Экспорт данных
    exportUsersToCSV() {
        const users = this.getUsers();
        const headers = ['ID', 'Name', 'Username', 'Email', 'Phone', 'Level', 'Balance', 'Status', 'Join Date'];
        const rows = users.map(user => [
            user.id,
            user.name,
            user.username || '',
            user.email || '',
            user.phone || '',
            user.level,
            user.balance,
            user.status,
            new Date(user.joinDate).toLocaleDateString()
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    },
    
    exportTransactionsToCSV() {
        const transactions = this.getTransactions();
        const headers = ['ID', 'User', 'Type', 'Amount', 'Status', 'Method', 'Date', 'Details'];
        const rows = transactions.map(tx => [
            tx.id,
            tx.userName,
            tx.type,
            tx.amount,
            tx.status,
            tx.method,
            new Date(tx.date).toLocaleString(),
            tx.details || ''
        ]);
        
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');
        
        return csvContent;
    },
    
    // Бэкап данных
    backupData() {
        const backup = {
            timestamp: new Date().toISOString(),
            users: this.getUsers(),
            transactions: this.getTransactions(),
            settings: this.getSettings(),
            levels: this.getLevels(),
            logs: this.getLogs().slice(0, 100)
        };
        
        return JSON.stringify(backup, null, 2);
    },
    
    restoreData(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (backup.users) this.saveUsers(backup.users);
            if (backup.transactions) this.saveTransactions(backup.transactions);
            if (backup.settings) this.saveSettings(backup.settings);
            if (backup.levels) this.saveLevels(backup.levels);
            if (backup.logs) {
                const currentLogs = this.getLogs();
                const mergedLogs = [...backup.logs, ...currentLogs];
                localStorage.setItem(this.KEYS.LOGS, JSON.stringify(mergedLogs.slice(0, 1000)));
            }
            
            this.addLog('system_restore', `Восстановлен бэкап от ${backup.timestamp}`);
            return true;
        } catch (error) {
            console.error('Ошибка восстановления:', error);
            return false;
        }
    }
};

// Основные функции
function initAdminApp() {
    checkAuth();
    AdminStorage.init();
    setupAdminEvents();
    showPage(AdminState.currentPage);
    updateMainLayout();
    
    setInterval(checkSession, 60000);
    
    document.addEventListener('mousemove', () => AdminState.lastActivity = Date.now());
    document.addEventListener('keypress', () => AdminState.lastActivity = Date.now());
    document.addEventListener('click', () => AdminState.lastActivity = Date.now());
}

function checkAuth() {
    const loggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const sessionTime = parseInt(localStorage.getItem('adminSession') || '0');
    
    if (loggedIn && (Date.now() - sessionTime) < AdminConfig.sessionTimeout) {
        AdminState.isLoggedIn = true;
        AdminState.currentUser = {
            username: localStorage.getItem('adminUsername') || 'Админ',
            role: localStorage.getItem('adminRole') || 'Администратор',
            loginTime: new Date(sessionTime).toLocaleString()
        };
        
        localStorage.setItem('adminSession', Date.now().toString());
    } else {
        logoutAdmin();
    }
}

function checkSession() {
    if (!AdminState.isLoggedIn) return;
    
    const inactiveTime = Date.now() - AdminState.lastActivity;
    if (inactiveTime > AdminConfig.sessionTimeout) {
        showNotification('Сессия истекла из-за неактивности', 'error');
        logoutAdmin();
    }
}

function setupAdminEvents() {
    // Меню
    document.getElementById('menuToggle')?.addEventListener('click', toggleSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', logoutAdmin);
    
    // Навигация
    document.addEventListener('click', (e) => {
        const navLink = e.target.closest('[data-page]');
        if (navLink) {
            e.preventDefault();
            const page = navLink.getAttribute('data-page');
            showPage(page);
            
            if (AdminState.sidebarOpen && window.innerWidth < 768) {
                toggleSidebar();
            }
        }
    });
    
    // Фильтры пользователей
    const userSearch = document.getElementById('searchUsers');
    const userStatusFilter = document.getElementById('filterUserStatus');
    const userLevelFilter = document.getElementById('filterUserLevel');
    
    if (userSearch) {
        let searchTimeout;
        userSearch.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                AdminState.filters.users.search = e.target.value;
                AdminState.filters.users.page = 1;
                loadUsersData();
            }, 300);
        });
    }
    
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', function(e) {
            AdminState.filters.users.status = e.target.value;
            AdminState.filters.users.page = 1;
            loadUsersData();
        });
    }
    
    if (userLevelFilter) {
        userLevelFilter.addEventListener('change', function(e) {
            AdminState.filters.users.level = e.target.value;
            AdminState.filters.users.page = 1;
            loadUsersData();
        });
    }
    
    // Фильтры транзакций
    const txTypeFilter = document.getElementById('filterTransactionType');
    const txStatusFilter = document.getElementById('filterTransactionStatus');
    const txDateFilter = document.getElementById('filterTransactionDate');
    
    if (txTypeFilter) {
        txTypeFilter.addEventListener('change', function(e) {
            AdminState.filters.transactions.type = e.target.value;
            AdminState.filters.transactions.page = 1;
            loadFinanceData();
        });
    }
    
    if (txStatusFilter) {
        txStatusFilter.addEventListener('change', function(e) {
            AdminState.filters.transactions.status = e.target.value;
            AdminState.filters.transactions.page = 1;
            loadFinanceData();
        });
    }
    
    if (txDateFilter) {
        txDateFilter.addEventListener('change', function(e) {
            AdminState.filters.transactions.date = e.target.value;
            AdminState.filters.transactions.page = 1;
            loadFinanceData();
        });
    }
    
    // Рассылка
    const broadcastMessage = document.getElementById('broadcastMessage');
    if (broadcastMessage) {
        broadcastMessage.addEventListener('input', function(e) {
            document.getElementById('messageLength').textContent = e.target.value.length;
        });
    }
    
    // Закрытие сайдбара
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('adminSidebar');
        const menuToggle = document.getElementById('menuToggle');
        
        if (AdminState.sidebarOpen && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target) &&
            window.innerWidth < 768) {
            toggleSidebar();
        }
    });
}

function toggleSidebar() {
    AdminState.sidebarOpen = !AdminState.sidebarOpen;
    const sidebar = document.getElementById('adminSidebar');
    const main = document.getElementById('adminMain');
    
    if (sidebar) {
        sidebar.classList.toggle('active', AdminState.sidebarOpen);
    }
    
    if (main) {
        main.classList.toggle('with-sidebar', AdminState.sidebarOpen);
    }
}

function updateMainLayout() {
    const sidebar = document.getElementById('adminSidebar');
    const main = document.getElementById('adminMain');
    
    if (window.innerWidth >= 768) {
        AdminState.sidebarOpen = true;
        if (sidebar) sidebar.classList.add('active');
        if (main) main.classList.add('with-sidebar');
    } else {
        AdminState.sidebarOpen = false;
        if (sidebar) sidebar.classList.remove('active');
        if (main) main.classList.remove('with-sidebar');
    }
}

window.addEventListener('resize', updateMainLayout);

function logoutAdmin() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        AdminStorage.addLog('admin_logout', `Выход из системы`);
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminSession');
        window.location.href = 'admin-login.html';
    }
}

function showPage(page) {
    AdminState.currentPage = page;
    
    document.querySelectorAll('.page-content').forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });
    
    document.querySelectorAll('.nav-link').forEach(l => {
        l.classList.remove('active');
    });
    
    const target = document.getElementById(`${page}Page`);
    const navLink = document.querySelector(`[data-page="${page}"]`);
    
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        
        if (navLink) {
            navLink.classList.add('active');
        }
        
        loadPageData(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showPage('dashboard');
    }
}

function loadPageData(page) {
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'finance':
            loadFinanceData();
            break;
        case 'operations':
            loadOperationsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
        case 'logs':
            loadLogsData();
            break;
        case 'analytics':
            document.getElementById('analyticsPage').innerHTML = `
                <div class="admin-card">
                    <h2>📈 Аналитика</h2>
                    <div style="text-align: center; padding: 60px 20px; color: var(--admin-text-tertiary);">
                        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
                        <h3>Раздел в разработке</h3>
                        <p>Графики и статистика появятся в ближайшем обновлении</p>
                    </div>
                </div>
            `;
            break;
        case 'broadcast':
            loadBroadcastPage();
            break;
        default:
            showPage('dashboard');
    }
}

// Дашборд
function loadDashboardData() {
    const users = AdminStorage.getUsers();
    const transactions = AdminStorage.getTransactions();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.status === 'active').length,
        blockedUsers: users.filter(u => u.status === 'blocked').length,
        totalBalance: users.reduce((s, u) => s + u.balance, 0),
        totalInvested: users.reduce((s, u) => s + u.invested, 0),
        todayProfit: transactions
            .filter(t => t.type === 'profit' && new Date(t.date) >= today)
            .reduce((s, t) => s + t.amount, 0),
        pendingWithdrawals: transactions
            .filter(t => t.type === 'withdraw' && t.status === 'pending')
            .reduce((s, t) => s + t.amount, 0),
        todayDeposits: transactions
            .filter(t => t.type === 'deposit' && t.status === 'completed' && new Date(t.date) >= today)
            .reduce((s, t) => s + t.amount, 0)
    };
    
    const yesterdayStats = {
        users: users.filter(u => new Date(u.joinDate) < today && new Date(u.joinDate) >= yesterday).length,
        profit: transactions
            .filter(t => t.type === 'profit' && new Date(t.date) >= yesterday && new Date(t.date) < today)
            .reduce((s, t) => s + t.amount, 0),
        deposits: transactions
            .filter(t => t.type === 'deposit' && t.status === 'completed' && new Date(t.date) >= yesterday && new Date(t.date) < today)
            .reduce((s, t) => s + t.amount, 0)
    };
    
    document.getElementById('totalUsers').textContent = stats.totalUsers.toLocaleString();
    document.getElementById('activeUsers').textContent = stats.activeUsers.toLocaleString();
    document.getElementById('totalBalance').textContent = `$${stats.totalBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('todayProfit').textContent = `$${stats.todayProfit.toFixed(2)}`;
    document.getElementById('pendingWithdrawals').textContent = `$${stats.pendingWithdrawals.toFixed(2)}`;
    
    document.getElementById('usersChange').textContent = `+${stats.totalUsers - yesterdayStats.users}`;
    document.getElementById('balanceChange').textContent = `+${((stats.totalBalance - stats.totalInvested) / stats.totalInvested * 100 || 0).toFixed(1)}%`;
    document.getElementById('withdrawChange').textContent = `-${stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals.toFixed(0) : 0}`;
    document.getElementById('profitChange').textContent = stats.todayProfit > yesterdayStats.profit ? 
        `+${(stats.todayProfit - yesterdayStats.profit).toFixed(1)}%` : 
        `-${(yesterdayStats.profit - stats.todayProfit).toFixed(1)}%`;
    
    loadRecentTransactions();
}

function loadRecentTransactions() {
    const tbody = document.getElementById('recentTransactionsBody');
    if (!tbody) return;
    
    const transactions = AdminStorage.getTransactions()
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">💳</div>
                    <h4>Нет транзакций</h4>
                    <p>Транзакции появятся здесь</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = transactions.map(tx => `
        <tr>
            <td>
                <div style="font-weight: 700;">${tx.id}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">${tx.userName}</div>
            </td>
            <td>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; background: ${getTxTypeColor(tx.type)}20; color: ${getTxTypeColor(tx.type)}; font-size: 12px; font-weight: 600;">
                    ${getTxTypeText(tx.type)}
                </span>
            </td>
            <td>
                <div style="font-weight: 800; color: ${tx.type === 'withdraw' ? 'var(--admin-danger)' : 'var(--admin-success)'}">
                    ${tx.type === 'withdraw' ? '-' : '+'}$${tx.amount.toFixed(2)}
                </div>
            </td>
            <td>
                <span class="status-badge status-${tx.status}">
                    ${getTxStatusText(tx.status)}
                </span>
            </td>
            <td>
                <div style="font-size: 14px;">${formatDate(tx.date)}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">${formatTime(tx.date)}</div>
            </td>
            <td>
                <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="viewTransaction('${tx.id}')" title="Просмотр">
                    👁️
                </button>
                ${tx.status === 'pending' ? `
                    <button class="admin-btn admin-btn-sm admin-btn-success" onclick="approveTx('${tx.id}')" title="Одобрить">
                        ✓
                    </button>
                    <button class="admin-btn admin-btn-sm admin-btn-danger" onclick="rejectTx('${tx.id}')" title="Отклонить">
                        ✗
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

// Пользователи
function loadUsersData() {
    const filter = AdminState.filters.users;
    const result = AdminStorage.getUsersByPage(filter.page, filter);
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (result.items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 60px 20px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                    <h4>Пользователи не найдены</h4>
                    <p>Попробуйте изменить критерии поиска</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = result.items.map(user => {
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        const joinDate = new Date(user.joinDate);
        const lastActivity = new Date(user.lastActivity);
        const now = new Date();
        const daysSinceJoin = Math.floor((now - joinDate) / (1000 * 60 * 60 * 24));
        const hoursSinceActivity = Math.floor((now - lastActivity) / (1000 * 60 * 60));
        
        let activityStatus = '';
        if (hoursSinceActivity < 1) {
            activityStatus = '<span style="color: var(--admin-success);">●</span> онлайн';
        } else if (hoursSinceActivity < 24) {
            activityStatus = '<span style="color: var(--admin-warning);">●</span> недавно';
        } else {
            activityStatus = `<span style="color: var(--admin-text-tertiary);">●</span> ${daysSinceJoin} д.`;
        }
        
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="user-avatar">${initials}</div>
                        <div>
                            <div style="font-weight: 700;">${user.name}</div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                                ${user.id} ${activityStatus}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600;">${user.username || '—'}</div>
                    <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                        ${user.phone || user.email || '—'}
                    </div>
                </td>
                <td>
                    <span class="status-badge status-${user.status}">
                        ${user.status === 'active' ? 'Активен' : 'Заблокирован'}
                    </span>
                </td>
                <td>
                    <div style="font-weight: 800; color: var(--admin-success);">$${user.balance.toFixed(2)}</div>
                    <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                        доступно: $${user.available.toFixed(2)}
                    </div>
                </td>
                <td>
                    <div style="font-weight: 600;">$${user.invested.toFixed(2)}</div>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span>${user.referrals}</span>
                        ${user.referrals > 0 ? `
                            <button class="admin-btn admin-btn-sm admin-btn-secondary" 
                                    onclick="removeReferrals('${user.id}')"
                                    style="padding: 2px 6px; font-size: 10px;"
                                    title="Удалить рефералов">
                                ✗
                            </button>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <div style="font-size: 14px;">${joinDate.toLocaleDateString()}</div>
                    <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                        ${joinDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        <button class="admin-btn admin-btn-sm admin-btn-primary" 
                                onclick="editUserModal('${user.id}')"
                                title="Редактировать">
                            ✏️
                        </button>
                        <button class="admin-btn admin-btn-sm ${user.status === 'active' ? 'admin-btn-danger' : 'admin-btn-success'}" 
                                onclick="toggleUserStatus('${user.id}')"
                                title="${user.status === 'active' ? 'Заблокировать' : 'Разблокировать'}">
                            ${user.status === 'active' ? '🔒' : '🔓'}
                        </button>
                        <button class="admin-btn admin-btn-sm admin-btn-secondary" 
                                onclick="showBalanceModal('${user.id}')"
                                title="Изменить баланс">
                            💰
                        </button>
                        <button class="admin-btn admin-btn-sm admin-btn-secondary" 
                                onclick="sendMessageToUser('${user.id}')"
                                title="Отправить сообщение">
                            📨
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    updatePagination('usersPagination', result);
}

// Финансы
function loadFinanceData() {
    const filter = AdminState.filters.transactions;
    const result = AdminStorage.getTransactionsByPage(filter.page, filter);
    
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    if (result.items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 60px 20px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">💳</div>
                    <h4>Транзакции не найдены</h4>
                    <p>Попробуйте изменить критерии фильтрации</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = result.items.map(tx => `
        <tr>
            <td>
                <div style="font-weight: 700;">${tx.id}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">${tx.userName}</div>
            </td>
            <td>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; background: ${getTxTypeColor(tx.type)}20; color: ${getTxTypeColor(tx.type)}; font-size: 12px; font-weight: 600;">
                    ${getTxTypeText(tx.type)}
                </span>
            </td>
            <td style="font-weight: 800; color: ${tx.type === 'withdraw' ? 'var(--admin-danger)' : 'var(--admin-success)'}">
                ${tx.type === 'withdraw' ? '-' : '+'}$${tx.amount.toFixed(2)}
            </td>
            <td>
                <span class="status-badge status-${tx.status}">
                    ${getTxStatusText(tx.status)}
                </span>
            </td>
            <td>
                <span style="text-transform: capitalize;">${tx.method}</span>
            </td>
            <td>
                <div style="font-size: 14px;">${formatDate(tx.date)}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">${formatTime(tx.date)}</div>
            </td>
            <td>
                <div style="display: flex; gap: 4px;">
                    <button class="admin-btn admin-btn-sm admin-btn-secondary" 
                            onclick="viewTransaction('${tx.id}')"
                            title="Просмотр">
                        👁️
                    </button>
                    ${tx.status === 'pending' ? `
                        <button class="admin-btn admin-btn-sm admin-btn-success" 
                                onclick="approveTx('${tx.id}')"
                                title="Одобрить">
                            ✓
                        </button>
                        <button class="admin-btn admin-btn-sm admin-btn-danger" 
                                onclick="rejectTx('${tx.id}')"
                                title="Отклонить">
                            ✗
                        </button>
                    ` : ''}
                    ${tx.status === 'completed' && tx.type === 'withdraw' ? `
                        <button class="admin-btn admin-btn-sm admin-btn-danger" 
                                onclick="refundTransaction('${tx.id}')"
                                title="Вернуть средства">
                            ↩️
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    updatePagination('transactionsPagination', result);
}

// Операции с процентами
function loadOperationsData() {
    const operations = AdminStorage.getPercentOperations();
    const tbody = document.getElementById('percentOperationsBody');
    
    if (!tbody) return;
    
    if (operations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
                    <h4>Нет операций с процентами</h4>
                    <p>Операции появятся после применения процентов</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = operations.map(op => `
        <tr>
            <td>
                <div style="font-weight: 600;">${formatDate(op.timestamp)}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                    ${formatTime(op.timestamp)}
                </div>
            </td>
            <td>${op.admin}</td>
            <td>
                <span style="display: inline-block; padding: 4px 10px; border-radius: 20px; background: rgba(67, 97, 238, 0.15); color: var(--admin-primary); font-weight: 700;">
                    +${op.percent}%
                </span>
            </td>
            <td>
                <span style="font-weight: 700;">${op.usersCount}</span> пользователей
            </td>
            <td>
                <span style="font-weight: 800; color: var(--admin-success);">
                    +$${op.totalAmount.toFixed(2)}
                </span>
            </td>
        </tr>
    `).join('');
}

// Настройки
function loadSettingsData() {
    const settings = AdminStorage.getSettings();
    
    document.getElementById('investmentPercent').value = settings.investmentPercent;
    document.getElementById('referralLevel1').value = settings.referralLevel1;
    document.getElementById('referralLevel2').value = settings.referralLevel2;
    document.getElementById('minDepositCrypto').value = settings.minDepositCrypto;
    document.getElementById('minDepositCard').value = settings.minDepositCard;
    document.getElementById('minWithdrawCrypto').value = settings.minWithdrawCrypto;
    document.getElementById('minWithdrawCard').value = settings.minWithdrawCard;
    document.getElementById('currentPercent').textContent = `${settings.investmentPercent}%`;
    
    const levels = AdminStorage.getLevels();
    const levelsList = document.getElementById('careerLevelsList');
    
    if (levelsList) {
        levelsList.innerHTML = levels.map(level => `
            <div style="background: rgba(148, 163, 184, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 12px; border: 1px solid var(--admin-border);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 8px; height: 32px; border-radius: 4px; background: ${level.color};"></div>
                        <div>
                            <div style="font-weight: 800; font-size: 16px;">${level.name}</div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                                Бонус: $${level.bonus} | Порог: $${level.required}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="admin-btn admin-btn-sm admin-btn-secondary" 
                                onclick="editLevelModal(${level.id})">
                            ✏️
                        </button>
                        ${level.id > 2 ? `
                            <button class="admin-btn admin-btn-sm admin-btn-danger" 
                                    onclick="deleteLevel(${level.id})">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <label style="font-size: 12px; color: var(--admin-text-tertiary); display: block; margin-bottom: 4px;">Порог ($)</label>
                        <input type="number" 
                               value="${level.required}" 
                               onchange="updateLevel(${level.id}, 'required', this.value)"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--admin-border); background: var(--admin-bg-dark); color: var(--admin-text-primary);">
                    </div>
                    <div>
                        <label style="font-size: 12px; color: var(--admin-text-tertiary); display: block; margin-bottom: 4px;">Бонус ($)</label>
                        <input type="number" 
                               value="${level.bonus}" 
                               onchange="updateLevel(${level.id}, 'bonus', this.value)"
                               style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--admin-border); background: var(--admin-bg-dark); color: var(--admin-text-primary);">
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Логи
function loadLogsData() {
    const logs = AdminStorage.getLogs();
    const tbody = document.getElementById('logsTableBody');
    
    if (!tbody) return;
    
    if (logs.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 40px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📝</div>
                    <h4>Нет логов</h4>
                    <p>Логи действий появятся здесь</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = logs.slice(0, 50).map(log => `
        <tr>
            <td>
                <div style="font-weight: 600;">${formatDate(log.timestamp)}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                    ${formatTime(log.timestamp)}
                </div>
            </td>
            <td>${log.admin}</td>
            <td>
                <span style="display: inline-block; padding: 4px 8px; border-radius: 6px; background: rgba(148, 163, 184, 0.1); color: var(--admin-text-secondary); font-size: 12px; font-weight: 600;">
                    ${log.action.replace('_', ' ')}
                </span>
            </td>
            <td>
                <div style="font-size: 14px;">${log.details}</div>
            </td>
        </tr>
    `).join('');
}

// Рассылка
function loadBroadcastPage() {
    loadBroadcastHistory();
    updateRecipientsCount();
    setupBroadcastFilters();
    
    const draft = AdminStorage.getBroadcastDraft();
    if (draft) {
        loadDraftData(draft);
    }
}

function setupBroadcastFilters() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('broadcastDateTo').max = today;
    document.getElementById('broadcastDateTo').value = today;
    
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    document.getElementById('broadcastDateFrom').min = monthAgo.toISOString().split('T')[0];
}

function loadBroadcastHistory() {
    const broadcasts = AdminStorage.getBroadcasts();
    const tbody = document.getElementById('broadcastHistoryBody');
    
    if (!tbody) return;
    
    if (broadcasts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--admin-text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📨</div>
                    <h4>Нет истории рассылок</h4>
                    <p>Отправленные рассылки появятся здесь</p>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = broadcasts.map(broadcast => `
        <tr>
            <td>
                <div style="font-weight: 600;">${formatDate(broadcast.timestamp)}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                    ${formatTime(broadcast.timestamp)}
                </div>
            </td>
            <td>
                <div style="font-weight: 700;">${broadcast.subject || 'Без темы'}</div>
                <div style="font-size: 12px; color: var(--admin-text-tertiary);">
                    ${broadcast.message.substring(0, 50)}${broadcast.message.length > 50 ? '...' : ''}
                </div>
            </td>
            <td>
                <div style="font-weight: 800;">${broadcast.recipientsCount}</div>
            </td>
            <td>
                <span class="status-badge status-${broadcast.status === 'sent' ? 'completed' : 'pending'}">
                    ${broadcast.status === 'sent' ? 'Отправлено' : 'В процессе'}
                </span>
            </td>
            <td>
                <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="viewBroadcastDetails(${broadcast.id})">
                    👁️
                </button>
                <button class="admin-btn admin-btn-sm admin-btn-secondary" onclick="resendBroadcast(${broadcast.id})">
                    🔄
                </button>
            </td>
        </tr>
    `).join('');
}

function updateRecipientsCount() {
    const filters = getBroadcastFilters();
    const users = AdminStorage.getFilteredUsers(filters);
    
    document.getElementById('recipientsNumber').textContent = `${users.length} пользователей`;
    
    const activeUsers = users.filter(u => u.status === 'active').length;
    const blockedUsers = users.filter(u => u.status === 'blocked').length;
    const totalBalance = users.reduce((sum, u) => sum + u.balance, 0);
    
    document.getElementById('recipientsDetails').innerHTML = `
        <div>Активные: ${activeUsers} | Заблокированные: ${blockedUsers}</div>
        <div>Общий баланс: $${totalBalance.toFixed(2)}</div>
    `;
}

function getBroadcastFilters() {
    return {
        status: document.getElementById('broadcastStatus').value,
        level: document.getElementById('broadcastLevel').value,
        minBalance: document.getElementById('broadcastMinBalance').value,
        maxBalance: document.getElementById('broadcastMaxBalance').value,
        dateFrom: document.getElementById('broadcastDateFrom').value,
        dateTo: document.getElementById('broadcastDateTo').value,
        minInvested: document.getElementById('broadcastMinInvested').value,
        minReferrals: document.getElementById('broadcastMinReferrals').value
    };
}

function insertBroadcastVariable(variable) {
    const textarea = document.getElementById('broadcastMessage');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    textarea.value = text.substring(0, start) + variable + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + variable.length;
    
    document.getElementById('messageLength').textContent = textarea.value.length;
    updateBroadcastPreview();
}

function updateBroadcastPreview() {
    const subject = document.getElementById('broadcastSubject').value;
    const message = document.getElementById('broadcastMessage').value;
    const buttonText = document.getElementById('broadcastButtonText').value;
    const buttonUrl = document.getElementById('broadcastButtonUrl').value;
    
    if (!message.trim()) {
        document.getElementById('broadcastPreview').innerHTML = `
            <div style="text-align: center; color: var(--admin-text-tertiary); padding: 40px;">
                <div style="font-size: 48px; margin-bottom: 16px;">📨</div>
                <h4>Предпросмотр сообщения</h4>
                <p>Введите текст сообщения, чтобы увидеть предпросмотр</p>
            </div>
        `;
        return;
    }
    
    const testUser = {
        name: "Иван Иванов",
        balance: 1250.50,
        level: "Латунный",
        referrals: 3
    };
    
    let previewMessage = message;
    previewMessage = previewMessage.replace(/{name}/g, testUser.name);
    previewMessage = previewMessage.replace(/{balance}/g, `$${testUser.balance.toFixed(2)}`);
    previewMessage = previewMessage.replace(/{level}/g, testUser.level);
    previewMessage = previewMessage.replace(/{referrals}/g, testUser.referrals);
    
    const previewHTML = `
        <div style="max-width: 400px; margin: 0 auto;">
            ${subject ? `<div style="font-weight: 700; font-size: 18px; margin-bottom: 16px; color: var(--admin-primary);">${subject}</div>` : ''}
            <div style="background: var(--admin-bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--admin-border); margin-bottom: 16px;">
                <div style="white-space: pre-wrap; line-height: 1.6;">${previewMessage}</div>
            </div>
            ${buttonText && buttonUrl ? `
                <div style="text-align: center;">
                    <a href="${buttonUrl}" style="display: inline-block; padding: 12px 24px; background: var(--admin-primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        ${buttonText}
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('broadcastPreview').innerHTML = previewHTML;
}

function saveBroadcastDraft() {
    const draft = {
        subject: document.getElementById('broadcastSubject').value,
        message: document.getElementById('broadcastMessage').value,
        buttonText: document.getElementById('broadcastButtonText').value,
        buttonUrl: document.getElementById('broadcastButtonUrl').value,
        filters: getBroadcastFilters(),
        timestamp: new Date().toISOString()
    };
    
    AdminStorage.saveBroadcastDraft(draft);
    showNotification('Черновик сохранен', 'success');
}

function loadBroadcastDraft() {
    const draft = AdminStorage.getBroadcastDraft();
    if (!draft) {
        showNotification('Нет сохраненных черновиков', 'info');
        return;
    }
    
    if (confirm('Загрузить сохраненный черновик? Текущие данные будут перезаписаны.')) {
        loadDraftData(draft);
        showNotification('Черновик загружен', 'success');
    }
}

function loadDraftData(draft) {
    document.getElementById('broadcastSubject').value = draft.subject || '';
    document.getElementById('broadcastMessage').value = draft.message || '';
    document.getElementById('broadcastButtonText').value = draft.buttonText || '';
    document.getElementById('broadcastButtonUrl').value = draft.buttonUrl || '';
    
    if (draft.filters) {
        document.getElementById('broadcastStatus').value = draft.filters.status || 'all';
        document.getElementById('broadcastLevel').value = draft.filters.level || 'all';
        document.getElementById('broadcastMinBalance').value = draft.filters.minBalance || '';
        document.getElementById('broadcastMaxBalance').value = draft.filters.maxBalance || '';
        document.getElementById('broadcastDateFrom').value = draft.filters.dateFrom || '';
        document.getElementById('broadcastDateTo').value = draft.filters.dateTo || '';
        document.getElementById('broadcastMinInvested').value = draft.filters.minInvested || '';
        document.getElementById('broadcastMinReferrals').value = draft.filters.minReferrals || '';
    }
    
    document.getElementById('messageLength').textContent = draft.message?.length || 0;
    updateRecipientsCount();
    updateBroadcastPreview();
}

function testBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    const subject = document.getElementById('broadcastSubject').value;
    
    if (!message.trim()) {
        showNotification('Введите текст сообщения', 'error');
        return;
    }
    
    const testUser = {
        name: "Тестовый Пользователь",
        balance: 1000,
        level: "Латунный",
        referrals: 2
    };
    
    let testMessage = message;
    testMessage = testMessage.replace(/{name}/g, testUser.name);
    testMessage = testMessage.replace(/{balance}/g, `$${testUser.balance}`);
    testMessage = testMessage.replace(/{level}/g, testUser.level);
    testMessage = testMessage.replace(/{referrals}/g, testUser.referrals);
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">🧪 Тестовая отправка</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div style="font-size: 48px; color: var(--admin-primary);">📨</div>
                        <div style="font-size: 14px; color: var(--admin-text-tertiary);">Сообщение будет отправлено вам в Telegram</div>
                    </div>
                    
                    <div style="background: var(--admin-bg-dark); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
                        <div style="font-weight: 700; margin-bottom: 12px; color: var(--admin-text-primary);">
                            ${subject || 'Тестовое сообщение'}
                        </div>
                        <div style="white-space: pre-wrap; line-height: 1.6; color: var(--admin-text-secondary);">
                            ${testMessage}
                        </div>
                    </div>
                    
                    <div style="text-align: center;">
                        <button class="admin-btn admin-btn-primary" onclick="sendTestToTelegram()">
                            Отправить тест в Telegram
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function sendTestToTelegram() {
    showNotification('Тестовое сообщение отправлено в Telegram', 'success');
    document.querySelector('.modal-overlay').remove();
}

function sendBroadcast() {
    const message = document.getElementById('broadcastMessage').value;
    const subject = document.getElementById('broadcastSubject').value;
    const buttonText = document.getElementById('broadcastButtonText').value;
    const buttonUrl = document.getElementById('broadcastButtonUrl').value;
    const filters = getBroadcastFilters();
    
    if (!message.trim()) {
        showNotification('Введите текст сообщения', 'error');
        return;
    }
    
    const recipients = AdminStorage.getFilteredUsers(filters);
    
    if (recipients.length === 0) {
        showNotification('Нет пользователей, соответствующих фильтрам', 'error');
        return;
    }
    
    const recipientsCount = recipients.length;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">🚀 Подтверждение рассылки</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 48px; color: var(--admin-success);">📤</div>
                        <div style="font-size: 18px; font-weight: 700; margin: 12px 0;">Отправить рассылку?</div>
                    </div>
                    
                    <div style="background: rgba(239, 71, 111, 0.1); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: var(--admin-danger); font-weight: 600; margin-bottom: 8px;">⚠️ Внимание!</div>
                        <div style="font-size: 14px; color: var(--admin-text-secondary);">
                            Сообщение будет отправлено ${recipientsCount} пользователям. Это действие нельзя отменить.
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">Получателей</div>
                            <div style="font-weight: 800; font-size: 24px;">${recipientsCount}</div>
                        </div>
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">Длина</div>
                            <div style="font-weight: 800; font-size: 24px;">${message.length} симв.</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-success" onclick="confirmBroadcast(${recipientsCount})">
                        Отправить рассылку
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function confirmBroadcast(recipientsCount) {
    const message = document.getElementById('broadcastMessage').value;
    const subject = document.getElementById('broadcastSubject').value;
    const buttonText = document.getElementById('broadcastButtonText').value;
    const buttonUrl = document.getElementById('broadcastButtonUrl').value;
    const filters = getBroadcastFilters();
    
    const broadcast = {
        subject: subject,
        message: message,
        buttonText: buttonText,
        buttonUrl: buttonUrl,
        filters: filters,
        recipientsCount: recipientsCount,
        status: 'sent',
        sentAt: new Date().toISOString()
    };
    
    AdminStorage.addBroadcast(broadcast);
    
    const sendBtn = document.getElementById('sendBroadcastBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<span>⏳</span><span>Отправка...</span>';
    sendBtn.disabled = true;
    
    setTimeout(() => {
        document.querySelector('.modal-overlay').remove();
        
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
        
        showNotification(`Рассылка отправлена ${recipientsCount} пользователям`, 'success');
        
        loadBroadcastHistory();
        
        if (confirm('Рассылка отправлена. Очистить форму?')) {
            document.getElementById('broadcastSubject').value = '';
            document.getElementById('broadcastMessage').value = '';
            document.getElementById('broadcastButtonText').value = '';
            document.getElementById('broadcastButtonUrl').value = '';
            document.getElementById('messageLength').textContent = '0';
            updateBroadcastPreview();
        }
    }, 2000);
}

function viewBroadcastDetails(broadcastId) {
    const broadcasts = AdminStorage.getBroadcasts();
    const broadcast = broadcasts.find(b => b.id === broadcastId);
    
    if (!broadcast) return;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3 class="modal-title">📋 Детали рассылки</h3>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">Дата отправки</div>
                            <div style="font-weight: 700;">${formatDate(broadcast.timestamp)}</div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">${formatTime(broadcast.timestamp)}</div>
                        </div>
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary);">Получателей</div>
                            <div style="font-weight: 700; font-size: 24px;">${broadcast.recipientsCount}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; color: var(--admin-text-tertiary); margin-bottom: 8px;">Тема</div>
                        <div style="font-weight: 700; font-size: 18px; color: var(--admin-primary);">${broadcast.subject || 'Без темы'}</div>
                    </div>
                    
                    <div style="margin-bottom: 20px;">
                        <div style="font-size: 14px; color: var(--admin-text-tertiary); margin-bottom: 8px;">Сообщение</div>
                        <div style="background: var(--admin-bg-dark); border-radius: 12px; padding: 20px; white-space: pre-wrap; line-height: 1.6;">
                            ${broadcast.message}
                        </div>
                    </div>
                    
                    ${broadcast.buttonText ? `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 14px; color: var(--admin-text-tertiary); margin-bottom: 8px;">Кнопка</div>
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div style="padding: 8px 16px; background: var(--admin-primary); color: white; border-radius: 8px; font-weight: 600;">
                                    ${broadcast.buttonText}
                                </div>
                                <div style="font-size: 14px; color: var(--admin-text-tertiary);">
                                    → ${broadcast.buttonUrl}
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Закрыть
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="useBroadcastAsTemplate(${broadcastId})">
                        Использовать как шаблон
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function useBroadcastAsTemplate(broadcastId) {
    const broadcasts = AdminStorage.getBroadcasts();
    const broadcast = broadcasts.find(b => b.id === broadcastId);
    
    if (!broadcast) return;
    
    document.getElementById('broadcastSubject').value = broadcast.subject || '';
    document.getElementById('broadcastMessage').value = broadcast.message || '';
    document.getElementById('broadcastButtonText').value = broadcast.buttonText || '';
    document.getElementById('broadcastButtonUrl').value = broadcast.buttonUrl || '';
    
    if (broadcast.filters) {
        document.getElementById('broadcastStatus').value = broadcast.filters.status || 'all';
        document.getElementById('broadcastLevel').value = broadcast.filters.level || 'all';
        document.getElementById('broadcastMinBalance').value = broadcast.filters.minBalance || '';
        document.getElementById('broadcastMaxBalance').value = broadcast.filters.maxBalance || '';
        document.getElementById('broadcastDateFrom').value = broadcast.filters.dateFrom || '';
        document.getElementById('broadcastDateTo').value = broadcast.filters.dateTo || '';
        document.getElementById('broadcastMinInvested').value = broadcast.filters.minInvested || '';
        document.getElementById('broadcastMinReferrals').value = broadcast.filters.minReferrals || '';
    }
    
    document.getElementById('messageLength').textContent = broadcast.message?.length || 0;
    updateRecipientsCount();
    updateBroadcastPreview();
    
    document.querySelector('.modal-overlay').remove();
    showNotification('Шаблон загружен в форму', 'success');
}

function resendBroadcast(broadcastId) {
    if (confirm('Повторить эту рассылку с теми же параметрами?')) {
        const broadcasts = AdminStorage.getBroadcasts();
        const broadcast = broadcasts.find(b => b.id === broadcastId);
        
        if (broadcast) {
            useBroadcastAsTemplate(broadcastId);
            showNotification('Рассылка загружена для повторной отправки', 'info');
        }
    }
}

// Пагинация
function updatePagination(elementId, data) {
    const pagination = document.getElementById(elementId);
    if (!pagination) return;
    
    const { page, pages } = data;
    
    let html = '';
    
    html += `
        <button class="pagination-btn" ${page <= 1 ? 'disabled' : ''} 
                onclick="changePage('${elementId}', ${page - 1})">
            ←
        </button>
    `;
    
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(pages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
        startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === page ? 'active' : ''}" 
                    onclick="changePage('${elementId}', ${i})">
                ${i}
            </button>
        `;
    }
    
    html += `
        <button class="pagination-btn" ${page >= pages ? 'disabled' : ''} 
                onclick="changePage('${elementId}', ${page + 1})">
            →
        </button>
    `;
    
    html += `
        <div style="margin-left: 12px; font-size: 14px; color: var(--admin-text-tertiary);">
            Страница ${page} из ${pages} | Всего: ${data.total}
        </div>
    `;
    
    pagination.innerHTML = html;
}

function changePage(elementId, newPage) {
    if (elementId === 'usersPagination') {
        AdminState.filters.users.page = newPage;
        loadUsersData();
    } else if (elementId === 'transactionsPagination') {
        AdminState.filters.transactions.page = newPage;
        loadFinanceData();
    }
}

function filterUsersByStatus(status) {
    AdminState.filters.users.status = status;
    AdminState.filters.users.page = 1;
    showPage('users');
}

function filterTransactionsByType(type) {
    AdminState.filters.transactions.type = type;
    AdminState.filters.transactions.page = 1;
    showPage('finance');
}

function resetUserFilters() {
    AdminState.filters.users = {
        search: '',
        status: 'all',
        level: 'all',
        page: 1,
        sortBy: 'joinDate',
        sortOrder: 'desc'
    };
    
    document.getElementById('searchUsers').value = '';
    document.getElementById('filterUserStatus').value = 'all';
    document.getElementById('filterUserLevel').value = 'all';
    
    loadUsersData();
}

function resetTransactionFilters() {
    AdminState.filters.transactions = {
        type: 'all',
        status: 'all',
        date: '',
        page: 1,
        sortBy: 'date',
        sortOrder: 'desc'
    };
    
    document.getElementById('filterTransactionType').value = 'all';
    document.getElementById('filterTransactionStatus').value = 'all';
    document.getElementById('filterTransactionDate').value = '';
    
    loadFinanceData();
}

// Модальное окно редактирования пользователя
function editUserModal(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Редактировать пользователя</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">ID пользователя</label>
                        <input type="text" class="form-control" value="${user.id}" disabled>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Имя</label>
                        <input type="text" id="editUserName" class="form-control" value="${user.name}">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Telegram username</label>
                        <input type="text" id="editUserUsername" class="form-control" value="${user.username || ''}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="editUserEmail" class="form-control" value="${user.email || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Телефон</label>
                            <input type="tel" id="editUserPhone" class="form-control" value="${user.phone || ''}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Баланс</label>
                            <input type="number" id="editUserBalance" class="form-control" value="${user.balance}" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Доступно</label>
                            <input type="number" id="editUserAvailable" class="form-control" value="${user.available}" step="0.01">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Инвестировано</label>
                            <input type="number" id="editUserInvested" class="form-control" value="${user.invested}" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Рефералы</label>
                            <input type="number" id="editUserReferrals" class="form-control" value="${user.referrals}">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Статус</label>
                            <select id="editUserStatus" class="form-control">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>Активен</option>
                                <option value="blocked" ${user.status === 'blocked' ? 'selected' : ''}>Заблокирован</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Уровень</label>
                            <select id="editUserLevel" class="form-control">
                                ${AdminStorage.getLevels().map(l => `
                                    <option value="${l.id}" ${user.levelId == l.id ? 'selected' : ''}>
                                        ${l.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="saveUserChanges('${userId}')">
                        💾 Сохранить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function saveUserChanges(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const updates = {
        name: document.getElementById('editUserName').value.trim(),
        username: document.getElementById('editUserUsername').value.trim() || null,
        email: document.getElementById('editUserEmail').value.trim() || null,
        phone: document.getElementById('editUserPhone').value.trim() || null,
        balance: parseFloat(document.getElementById('editUserBalance').value) || 0,
        available: parseFloat(document.getElementById('editUserAvailable').value) || 0,
        invested: parseFloat(document.getElementById('editUserInvested').value) || 0,
        referrals: parseInt(document.getElementById('editUserReferrals').value) || 0,
        status: document.getElementById('editUserStatus').value,
        levelId: parseInt(document.getElementById('editUserLevel').value)
    };
    
    const level = AdminStorage.getLevels().find(l => l.id == updates.levelId);
    if (level) {
        updates.level = level.name;
    }
    
    AdminStorage.updateUser(userId, updates);
    document.querySelector('.modal-overlay').remove();
    loadUsersData();
    showNotification('Пользователь обновлен', 'success');
}

function showBalanceModal(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">💰 Изменить баланс</h3>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <div class="user-avatar" style="margin: 0 auto 10px;">
                            ${user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <h4 style="margin-bottom: 4px;">${user.name}</h4>
                        <div style="color: var(--admin-text-tertiary); font-size: 14px;">${user.id}</div>
                    </div>
                    
                    <div style="background: rgba(148, 163, 184, 0.1); border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span>Текущий баланс:</span>
                            <span style="font-weight: 800; color: var(--admin-success);">$${user.balance.toFixed(2)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Доступно:</span>
                            <span style="font-weight: 600;">$${user.available.toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Тип операции</label>
                        <select id="balanceOperationType" class="form-control">
                            <option value="deposit">Пополнение</option>
                            <option value="withdraw">Списание</option>
                            <option value="bonus">Бонус</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Сумма ($)</label>
                        <input type="number" id="balanceAmount" class="form-control" placeholder="0.00" step="0.01" min="0.01">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Комментарий</label>
                        <textarea id="balanceComment" class="form-control" rows="2" placeholder="Причина операции..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="applyBalanceChange('${userId}')">
                        Применить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function applyBalanceChange(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const type = document.getElementById('balanceOperationType').value;
    const amount = parseFloat(document.getElementById('balanceAmount').value);
    const comment = document.getElementById('balanceComment').value.trim();
    
    if (!amount || amount <= 0) {
        showNotification('Введите корректную сумму', 'error');
        return;
    }
    
    let newBalance = user.balance;
    let newAvailable = user.available;
    
    if (type === 'deposit' || type === 'bonus') {
        newBalance += amount;
        newAvailable += amount;
    } else if (type === 'withdraw') {
        if (amount > user.available) {
            showNotification('Недостаточно доступных средств', 'error');
            return;
        }
        newBalance -= amount;
        newAvailable -= amount;
    }
    
    const tx = {
        userId: user.id,
        userName: user.name,
        type: type,
        amount: amount,
        method: 'manual',
        status: 'completed',
        details: comment || `Ручная операция: ${type === 'deposit' ? 'пополнение' : type === 'withdraw' ? 'списание' : 'бонус'}`,
        date: new Date().toISOString()
    };
    
    AdminStorage.addTransaction(tx);
    
    AdminStorage.updateUser(userId, {
        balance: newBalance,
        available: newAvailable
    });
    
    document.querySelector('.modal-overlay').remove();
    
    loadDashboardData();
    loadUsersData();
    loadFinanceData();
    
    showNotification(`Баланс изменен: ${type === 'deposit' ? '+' : '-'}$${amount.toFixed(2)}`, 'success');
}

function toggleUserStatus(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const action = newStatus === 'active' ? 'разблокирован' : 'заблокирован';
    
    if (confirm(`${newStatus === 'active' ? 'Разблокировать' : 'Заблокировать'} пользователя ${user.name}?`)) {
        AdminStorage.updateUser(userId, { status: newStatus });
        loadUsersData();
        showNotification(`Пользователь ${action}`, 'info');
    }
}

function removeReferrals(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user || user.referrals <= 0) return;
    
    if (confirm(`Удалить рефералов у пользователя ${user.name}?`)) {
        AdminStorage.updateUser(userId, { referrals: 0 });
        loadUsersData();
        showNotification('Рефералы удалены', 'info');
    }
}

function showManualTransactionModal() {
    const users = AdminStorage.getUsers();
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">⚡ Быстрая операция</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Пользователь</label>
                        <select id="manualUser" class="form-control">
                            <option value="">Выберите пользователя</option>
                            ${users.map(u => `
                                <option value="${u.id}">
                                    ${u.name} (${u.id}) - $${u.balance.toFixed(2)}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Тип операции</label>
                        <select id="manualType" class="form-control">
                            <option value="deposit">Пополнение</option>
                            <option value="withdraw">Вывод</option>
                            <option value="profit">Прибыль</option>
                            <option value="bonus">Бонус</option>
                            <option value="referral">Реферальное</option>
                        </select>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Сумма ($)</label>
                            <input type="number" id="manualAmount" class="form-control" placeholder="0.00" step="0.01" min="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Метод</label>
                            <select id="manualMethod" class="form-control">
                                <option value="crypto">Криптовалюта</option>
                                <option value="card">Карта</option>
                                <option value="manual">Ручной</option>
                                <option value="system">Система</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Статус</label>
                        <select id="manualStatus" class="form-control">
                            <option value="completed">Завершено</option>
                            <option value="pending">Ожидание</option>
                            <option value="cancelled">Отменено</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Комментарий</label>
                        <textarea id="manualComment" class="form-control" rows="3" placeholder="Детали операции..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="createManualTx()">
                        Создать операцию
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function createManualTx() {
    const userId = document.getElementById('manualUser').value;
    const type = document.getElementById('manualType').value;
    const amount = parseFloat(document.getElementById('manualAmount').value);
    const method = document.getElementById('manualMethod').value;
    const status = document.getElementById('manualStatus').value;
    const comment = document.getElementById('manualComment').value.trim();
    
    if (!userId) {
        showNotification('Выберите пользователя', 'error');
        return;
    }
    
    if (!amount || amount <= 0) {
        showNotification('Введите корректную сумму', 'error');
        return;
    }
    
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const tx = {
        userId: userId,
        userName: user.name,
        type: type,
        amount: amount,
        method: method,
        status: status,
        details: comment || `Ручная операция: ${getTxTypeText(type)}`,
        date: new Date().toISOString()
    };
    
    AdminStorage.addTransaction(tx);
    
    if (status === 'completed') {
        let newBalance = user.balance;
        let newAvailable = user.available;
        
        if (type === 'deposit' || type === 'profit' || type === 'bonus' || type === 'referral') {
            newBalance += amount;
            newAvailable += amount;
        } else if (type === 'withdraw') {
            newBalance -= amount;
            newAvailable -= amount;
        }
        
        AdminStorage.updateUser(userId, {
            balance: newBalance,
            available: newAvailable
        });
    }
    
    document.querySelector('.modal-overlay').remove();
    
    loadDashboardData();
    loadUsersData();
    loadFinanceData();
    
    showNotification('Операция создана', 'success');
}

function exportUsers() {
    const csv = AdminStorage.exportUsersToCSV();
    downloadCSV(csv, 'users_export.csv');
    showNotification('Экспорт пользователей завершен', 'success');
}

function exportTransactions() {
    const csv = AdminStorage.exportTransactionsToCSV();
    downloadCSV(csv, 'transactions_export.csv');
    showNotification('Экспорт транзакций завершен', 'success');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function backupData() {
    const backup = AdminStorage.backupData();
    const blob = new Blob([backup], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `admin_backup_${timestamp}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Бэкап данных создан', 'success');
}

function showImportModal() {
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">📤 Импорт данных</h3>
                </div>
                <div class="modal-body">
                    <div style="background: rgba(239, 71, 111, 0.1); border: 1px solid rgba(239, 71, 111, 0.3); border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                        <div style="color: var(--admin-danger); font-weight: 600; margin-bottom: 8px;">⚠️ Внимание!</div>
                        <div style="font-size: 14px; color: var(--admin-text-secondary);">
                            Импорт данных перезапишет текущие данные. Рекомендуется сделать бэкап перед импортом.
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Выберите файл бэкапа (.json)</label>
                        <input type="file" id="backupFile" class="form-control" accept=".json">
                    </div>
                    
                    <div id="backupPreview" style="display: none; margin-top: 20px;">
                        <h4 style="margin-bottom: 12px;">Предпросмотр данных:</h4>
                        <div id="backupInfo" style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;"></div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" id="importBtn" disabled onclick="importBackup()">
                        Импортировать
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    document.getElementById('backupFile').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const importBtn = document.getElementById('importBtn');
        const preview = document.getElementById('backupPreview');
        const info = document.getElementById('backupInfo');
        
        if (!file) {
            importBtn.disabled = true;
            preview.style.display = 'none';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const backup = JSON.parse(event.target.result);
                const date = new Date(backup.timestamp).toLocaleString();
                
                info.innerHTML = `
                    <div style="margin-bottom: 8px;"><strong>Дата бэкапа:</strong> ${date}</div>
                    <div style="margin-bottom: 8px;"><strong>Пользователей:</strong> ${backup.users?.length || 0}</div>
                    <div style="margin-bottom: 8px;"><strong>Транзакций:</strong> ${backup.transactions?.length || 0}</div>
                    <div><strong>Настроек:</strong> ${backup.settings ? 'да' : 'нет'}</div>
                `;
                
                preview.style.display = 'block';
                importBtn.disabled = false;
            } catch (error) {
                info.innerHTML = `<div style="color: var(--admin-danger);">Ошибка чтения файла: неверный формат</div>`;
                preview.style.display = 'block';
                importBtn.disabled = true;
            }
        };
        
        reader.readAsText(file);
    });
}

function importBackup() {
    const fileInput = document.getElementById('backupFile');
    if (!fileInput.files[0]) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const success = AdminStorage.restoreData(event.target.result);
        
        if (success) {
            document.querySelector('.modal-overlay').remove();
            showNotification('Данные успешно восстановлены', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            showNotification('Ошибка при восстановлении данных', 'error');
        }
    };
    
    reader.readAsText(fileInput.files[0]);
}

function applyPercentToAll() {
    const percentInput = document.getElementById('applyPercent');
    const percent = parseFloat(percentInput.value);
    
    if (!percent || percent <= 0 || percent > 100) {
        showNotification('Введите корректный процент (0.1-100)', 'error');
        return;
    }
    
    if (!confirm(`Применить ${percent}% ко всем активным пользователям?`)) {
        return;
    }
    
    const users = AdminStorage.getUsers().filter(u => u.status === 'active');
    let totalAmount = 0;
    
    users.forEach(user => {
        const profit = (user.balance * percent) / 100;
        totalAmount += profit;
        
        AdminStorage.updateUser(user.id, {
            balance: user.balance + profit,
            available: user.available + profit
        });
        
        AdminStorage.addTransaction({
            userId: user.id,
            userName: user.name,
            type: 'profit',
            amount: profit,
            method: 'system',
            status: 'completed',
            details: `Начисление ${percent}%`,
            date: new Date().toISOString()
        });
    });
    
    AdminStorage.addPercentOperation(percent, users.length, totalAmount);
    
    loadDashboardData();
    loadOperationsData();
    
    showNotification(`Начислено ${percent}% для ${users.length} пользователей`, 'success');
}

function applyQuickPercent(percent) {
    document.getElementById('applyPercent').value = percent;
    applyPercentToAll();
}

function viewTransaction(id) {
    const tx = AdminStorage.getTransactions().find(t => t.id === id);
    if (!tx) return;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">👁️ Просмотр транзакции</h3>
                </div>
                <div class="modal-body">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">ID</div>
                            <div style="font-weight: 700;">${tx.id}</div>
                        </div>
                        <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Сумма</div>
                            <div style="font-weight: 700; color: ${tx.type === 'withdraw' ? 'var(--admin-danger)' : 'var(--admin-success)'}">
                                ${tx.type === 'withdraw' ? '-' : '+'}$${tx.amount.toFixed(2)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px;">
                        <div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Тип</div>
                            <div style="font-weight: 600;">${getTxTypeText(tx.type)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Статус</div>
                            <span class="status-badge status-${tx.status}">${getTxStatusText(tx.status)}</span>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Метод</div>
                            <div style="font-weight: 600; text-transform: capitalize;">${tx.method}</div>
                        </div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Пользователь</div>
                        <div style="font-weight: 700;">${tx.userName}</div>
                        <div style="font-size: 14px; color: var(--admin-text-tertiary);">${tx.userId}</div>
                    </div>
                    
                    <div style="margin-bottom: 16px;">
                        <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Дата</div>
                        <div style="font-weight: 600;">${new Date(tx.date).toLocaleString()}</div>
                    </div>
                    
                    ${tx.details ? `
                        <div>
                            <div style="font-size: 12px; color: var(--admin-text-tertiary); margin-bottom: 4px;">Детали</div>
                            <div style="background: rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 12px;">
                                ${tx.details}
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function approveTx(id) {
    if (confirm('Одобрить эту транзакцию?')) {
        AdminStorage.updateTransaction(id, { status: 'completed' });
        loadDashboardData();
        loadFinanceData();
        showNotification('Транзакция одобрена', 'success');
    }
}

function rejectTx(id) {
    if (confirm('Отклонить эту транзакцию?')) {
        AdminStorage.updateTransaction(id, { status: 'cancelled' });
        loadDashboardData();
        loadFinanceData();
        showNotification('Транзакция отклонена', 'error');
    }
}

function refundTransaction(id) {
    if (!confirm('Вернуть средства по этой транзакции?\nЭто создаст обратную транзакцию.')) {
        return;
    }
    
    const tx = AdminStorage.getTransactions().find(t => t.id === id);
    if (!tx || tx.type !== 'withdraw' || tx.status !== 'completed') {
        showNotification('Невозможно вернуть эту транзакцию', 'error');
        return;
    }
    
    const user = AdminStorage.getUserById(tx.userId);
    if (!user) return;
    
    const refundTx = {
        userId: user.id,
        userName: user.name,
        type: 'deposit',
        amount: tx.amount,
        method: 'refund',
        status: 'completed',
        details: `Возврат средств по транзакции ${tx.id}`,
        date: new Date().toISOString()
    };
    
    AdminStorage.addTransaction(refundTx);
    
    AdminStorage.updateUser(user.id, {
        balance: user.balance + tx.amount,
        available: user.available + tx.amount
    });
    
    loadDashboardData();
    loadUsersData();
    loadFinanceData();
    
    showNotification('Средства возвращены', 'success');
}

function saveAllSettings() {
    const settings = {
        investmentPercent: parseFloat(document.getElementById('investmentPercent').value) || 2.5,
        referralLevel1: parseFloat(document.getElementById('referralLevel1').value) || 10,
        referralLevel2: parseFloat(document.getElementById('referralLevel2').value) || 5,
        minDepositCrypto: parseFloat(document.getElementById('minDepositCrypto').value) || 10,
        minDepositCard: parseFloat(document.getElementById('minDepositCard').value) || 10,
        minWithdrawCrypto: parseFloat(document.getElementById('minWithdrawCrypto').value) || 20,
        minWithdrawCard: parseFloat(document.getElementById('minWithdrawCard').value) || 50
    };
    
    if (settings.investmentPercent < 0.1 || settings.investmentPercent > 100) {
        showNotification('Процент должен быть от 0.1 до 100', 'error');
        return;
    }
    
    AdminStorage.saveSettings(settings);
    showNotification('Все настройки сохранены', 'success');
}

function updateLevel(id, field, value) {
    AdminStorage.updateLevel(id, { [field]: parseFloat(value) || 0 });
    loadSettingsData();
}

function deleteLevel(id) {
    if (confirm('Удалить этот уровень?\nПользователи будут перемещены на уровень ниже.')) {
        AdminStorage.deleteLevel(id);
        loadSettingsData();
        showNotification('Уровень удален', 'info');
    }
}

function showAddLevelModal() {
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">➕ Добавить уровень</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Название уровня</label>
                        <input type="text" id="newLevelName" class="form-control" placeholder="Платиновый">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Порог ($)</label>
                            <input type="number" id="newLevelRequired" class="form-control" placeholder="10000" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Бонус ($)</label>
                            <input type="number" id="newLevelBonus" class="form-control" placeholder="1000" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Цвет</label>
                        <input type="color" id="newLevelColor" class="form-control" value="#FFD700">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="addNewLevel()">
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function addNewLevel() {
    const name = document.getElementById('newLevelName').value.trim();
    const required = parseFloat(document.getElementById('newLevelRequired').value) || 0;
    const bonus = parseFloat(document.getElementById('newLevelBonus').value) || 0;
    const color = document.getElementById('newLevelColor').value;
    
    if (!name) {
        showNotification('Введите название уровня', 'error');
        return;
    }
    
    const level = {
        name: name,
        required: required,
        bonus: bonus,
        color: color
    };
    
    AdminStorage.addLevel(level);
    document.querySelector('.modal-overlay').remove();
    loadSettingsData();
    showNotification('Уровень добавлен', 'success');
}

function editLevelModal(id) {
    const level = AdminStorage.getLevels().find(l => l.id === id);
    if (!level) return;
    
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ Редактировать уровень</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Название уровня</label>
                        <input type="text" id="editLevelName" class="form-control" value="${level.name}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Порог ($)</label>
                            <input type="number" id="editLevelRequired" class="form-control" value="${level.required}" min="0">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Бонус ($)</label>
                            <input type="number" id="editLevelBonus" class="form-control" value="${level.bonus}" min="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Цвет</label>
                        <input type="color" id="editLevelColor" class="form-control" value="${level.color}">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="saveLevelChanges(${id})">
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function saveLevelChanges(id) {
    const name = document.getElementById('editLevelName').value.trim();
    const required = parseFloat(document.getElementById('editLevelRequired').value) || 0;
    const bonus = parseFloat(document.getElementById('editLevelBonus').value) || 0;
    const color = document.getElementById('editLevelColor').value;
    
    if (!name) {
        showNotification('Введите название уровня', 'error');
        return;
    }
    
    AdminStorage.updateLevel(id, {
        name: name,
        required: required,
        bonus: bonus,
        color: color
    });
    
    document.querySelector('.modal-overlay').remove();
    loadSettingsData();
    showNotification('Уровень обновлен', 'success');
}

function getTxTypeText(type) {
    const types = {
        deposit: 'Пополнение',
        withdraw: 'Вывод',
        profit: 'Прибыль',
        referral: 'Реферальное',
        bonus: 'Бонус'
    };
    return types[type] || type;
}

function getTxTypeColor(type) {
    const colors = {
        deposit: 'var(--admin-success)',
        withdraw: 'var(--admin-danger)',
        profit: 'var(--admin-info)',
        referral: 'var(--admin-warning)',
        bonus: 'var(--admin-primary)'
    };
    return colors[type] || 'var(--admin-text-tertiary)';
}

function getTxStatusText(status) {
    const statuses = {
        completed: 'Завершено',
        pending: 'Ожидание',
        cancelled: 'Отменено'
    };
    return statuses[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function showNotification(msg, type = 'info') {
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}
            </div>
            <div>${msg}</div>
        </div>
    `;
    
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(100%)';
        setTimeout(() => div.remove(), 300);
    }, 3000);
}

function sendMessageToUser(userId) {
    const user = AdminStorage.getUserById(userId);
    if (!user) return;
    
    const message = prompt(`Отправить сообщение пользователю ${user.name}:`, '');
    if (message) {
        showNotification(`Сообщение отправлено пользователю ${user.name}`, 'info');
        AdminStorage.addLog('user_message', `Сообщение пользователю ${user.id}: ${message.substring(0, 50)}...`);
    }
}

function showAddUserModal() {
    const html = `
        <div class="modal-overlay" onclick="if(event.target.classList.contains('modal-overlay')) event.target.remove()">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3 class="modal-title">👤 Добавить пользователя</h3>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Имя пользователя *</label>
                        <input type="text" id="newUserName" class="form-control" placeholder="Иван Иванов" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Telegram ID</label>
                            <input type="number" id="newUserTelegramId" class="form-control" placeholder="123456789">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Username</label>
                            <input type="text" id="newUserUsername" class="form-control" placeholder="@username">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email</label>
                            <input type="email" id="newUserEmail" class="form-control" placeholder="user@example.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Телефон</label>
                            <input type="tel" id="newUserPhone" class="form-control" placeholder="+79001234567">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Начальный баланс</label>
                            <input type="number" id="newUserBalance" class="form-control" value="0" step="0.01">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Рефералы</label>
                            <input type="number" id="newUserReferrals" class="form-control" value="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Комментарий</label>
                        <textarea id="newUserComment" class="form-control" rows="2" placeholder="Дополнительная информация..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.querySelector('.modal-overlay').remove()">
                        Отмена
                    </button>
                    <button class="admin-btn admin-btn-primary" onclick="addNewUser()">
                        Добавить
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
}

function addNewUser() {
    const name = document.getElementById('newUserName').value.trim();
    
    if (!name) {
        showNotification('Введите имя пользователя', 'error');
        return;
    }
    
    const user = {
        name: name,
        telegramId: document.getElementById('newUserTelegramId').value || null,
        username: document.getElementById('newUserUsername').value.trim() || null,
        email: document.getElementById('newUserEmail').value.trim() || null,
        phone: document.getElementById('newUserPhone').value.trim() || null,
        balance: parseFloat(document.getElementById('newUserBalance').value) || 0,
        available: parseFloat(document.getElementById('newUserBalance').value) || 0,
        referrals: parseInt(document.getElementById('newUserReferrals').value) || 0,
        comment: document.getElementById('newUserComment').value.trim() || null
    };
    
    AdminStorage.addUser(user);
    document.querySelector('.modal-overlay').remove();
    loadUsersData();
    showNotification('Пользователь добавлен', 'success');
}

// Экспорт функций в глобальную область видимости
window.editUserModal = editUserModal;
window.toggleUserStatus = toggleUserStatus;
window.removeReferrals = removeReferrals;
window.showBalanceModal = showBalanceModal;
window.sendMessageToUser = sendMessageToUser;
window.viewTransaction = viewTransaction;
window.approveTx = approveTx;
window.rejectTx = rejectTx;
window.refundTransaction = refundTransaction;
window.showManualTransactionModal = showManualTransactionModal;
window.createManualTx = createManualTx;
window.exportUsers = exportUsers;
window.exportTransactions = exportTransactions;
window.backupData = backupData;
window.showImportModal = showImportModal;
window.importBackup = importBackup;
window.applyPercentToAll = applyPercentToAll;
window.applyQuickPercent = applyQuickPercent;
window.saveAllSettings = saveAllSettings;
window.updateLevel = updateLevel;
window.deleteLevel = deleteLevel;
window.showAddLevelModal = showAddLevelModal;
window.addNewLevel = addNewLevel;
window.editLevelModal = editLevelModal;
window.saveLevelChanges = saveLevelChanges;
window.resetUserFilters = resetUserFilters;
window.resetTransactionFilters = resetTransactionFilters;
window.filterUsersByStatus = filterUsersByStatus;
window.filterTransactionsByType = filterTransactionsByType;
window.changePage = changePage;
window.showAddUserModal = showAddUserModal;
window.addNewUser = addNewUser;
window.insertBroadcastVariable = insertBroadcastVariable;
window.updateBroadcastPreview = updateBroadcastPreview;
window.saveBroadcastDraft = saveBroadcastDraft;
window.loadBroadcastDraft = loadBroadcastDraft;
window.testBroadcast = testBroadcast;
window.sendBroadcast = sendBroadcast;
window.loadBroadcastHistory = loadBroadcastHistory;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    if (!window.location.href.includes('admin-login.html')) {
        initAdminApp();
    }
});