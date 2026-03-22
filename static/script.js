document.addEventListener('DOMContentLoaded', () => {
    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    const screens = document.querySelectorAll('.screen');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-screen');
            
            // Update nav UI
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Update Screen UI
            screens.forEach(s => s.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            // Load screen data
            if (target === 'dashboard') loadDashboardSummary();
            if (target === 'loans') loadLoans();
            if (target === 'settings') loadSettings();
        });
    });

    // Initial load
    loadDashboardSummary();

    async function loadDashboardSummary() {
        try {
            const res = await fetch('/api/dashboard/summary');
            const data = await res.json();
            
            document.getElementById('shield-current').innerText = data.shield_current.toLocaleString();
            document.getElementById('shield-goal').innerText = data.shield_goal.toLocaleString();
            document.getElementById('sword-current').innerText = data.sword_current.toLocaleString();
            
            const shieldPercent = data.shield_goal > 0 
                ? Math.min(100, (data.shield_current / data.shield_goal) * 100) 
                : 0;
            
            const shieldProg = document.getElementById('shield-progress');
            shieldProg.style.width = '0%';
            setTimeout(() => {
                shieldProg.style.width = `${shieldPercent}%`;
            }, 100);
            
        } catch (err) {
            console.error('Ошибка загрузки сводки:', err);
        }
    }

    // --- DASHBOARD (Calculation) ---
    const calcBtn = document.getElementById('calculate-btn');
    const balanceInput = document.getElementById('current-balance');
    const resultCard = document.getElementById('forecast-result');

    calcBtn.addEventListener('click', async () => {
        const balance = parseFloat(balanceInput.value);
        if (isNaN(balance)) return alert('Введите корректную сумму');

        // Animation reset
        resultCard.style.opacity = '0';
        resultCard.classList.remove('hidden');

        try {
            const response = await fetch('/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_money: balance })
            });
            const data = await response.json();

            if (data.error) {
                resultCard.innerHTML = `<p style="color: #ff6b6b">${data.error}</p>`;
            } else {
                resultCard.innerHTML = `<p id="report-text">${data.report}</p>`;
            }
            
            // Trigger Fade-in
            setTimeout(() => {
                resultCard.style.transition = 'opacity 0.6s ease';
                resultCard.style.opacity = '1';
            }, 50);

        } catch (err) {
            console.error(err);
        }
    });

    // --- LOANS MANAGEMENT ---
    const loansList = document.getElementById('loans-list');
    const loanModal = document.getElementById('loan-modal');
    const modalTitle = document.getElementById('modal-title');
    const editLoanId = document.getElementById('edit-loan-id');
    const openAddBtn = document.getElementById('open-add-loan');
    const closeModalBtn = document.getElementById('close-modal');
    const saveLoanBtn = document.getElementById('save-loan');

    let loansData = []; // Local cache for editing

    async function loadLoans() {
        try {
            const res = await fetch('/api/loans');
            loansData = await res.json();
            renderLoans();
        } catch (err) { console.error(err); }
    }

    function renderLoans() {
        if (loansData.length === 0) {
            loansList.innerHTML = '<div class="glass-card" style="text-align: center">У вас пока нет кредитов</div>';
            return;
        }

        loansList.innerHTML = loansData.map(loan => {
            const p = loan.progress_percent;
            const colorClass = p < 50 ? 'bg-low' : (p < 80 ? 'bg-medium' : 'bg-high');
            const progressLabel = p === 100 ? 'Закрыто!' : `${p}%`;

            return `
                <div class="glass-card loan-card" data-id="${loan.id}">
                    <div class="loan-card-header">
                        <div class="loan-info">
                            <h3>${loan.name}</h3>
                            <p>${loan.amount.toLocaleString()} ₸ • ${loan.date}-го числа</p>
                            <p style="font-size: 0.75rem">Остаток: <b>${loan.current_debt.toLocaleString()} ₸</b></p>
                        </div>
                        <div class="card-actions">
                            <button class="action-btn edit-btn" onclick="openEditLoanModal(${loan.id})">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="action-btn delete-btn" onclick="deleteLoan(${loan.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="progress-container">
                        <div class="progress-info">
                            <span>Выплачено</span>
                            <span>${progressLabel}</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill ${colorClass}" style="width: 0%" id="prog-${loan.id}"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Trigger animations
        setTimeout(() => {
            loansData.forEach(loan => {
                const fill = document.getElementById(`prog-${loan.id}`);
                if (fill) fill.style.width = `${loan.progress_percent}%`;
            });
        }, 100);
    }

    // Modal logic
    window.openEditLoanModal = (id) => {
        const loan = loansData.find(l => l.id === id);
        if (!loan) return;

        modalTitle.innerText = "Редактировать кредит";
        editLoanId.value = loan.id;
        
        document.getElementById('loan-title').value = loan.name;
        document.getElementById('loan-amount').value = loan.amount;
        document.getElementById('loan-date').value = loan.date;
        document.getElementById('loan-total-amount').value = loan.total_amount;
        document.getElementById('loan-issue-date').value = loan.issue_date;
        document.getElementById('loan-term').value = loan.term_months;
        document.getElementById('loan-overpayment').value = loan.total_overpayment;
        document.getElementById('loan-current-debt').value = loan.current_debt;

        loanModal.classList.add('active');
    };

    openAddBtn.addEventListener('click', () => {
        modalTitle.innerText = "Новый кредит";
        editLoanId.value = "";
        
        // Reset fields
        document.getElementById('loan-title').value = "";
        document.getElementById('loan-amount').value = "";
        document.getElementById('loan-date').value = "";
        document.getElementById('loan-total-amount').value = "";
        document.getElementById('loan-issue-date').value = "";
        document.getElementById('loan-term').value = "";
        document.getElementById('loan-overpayment').value = "";
        document.getElementById('loan-current-debt').value = "";

        loanModal.classList.add('active');
    });

    closeModalBtn.addEventListener('click', () => loanModal.classList.remove('active'));

    saveLoanBtn.addEventListener('click', async () => {
        const payload = {
            name: document.getElementById('loan-title').value,
            amount: parseFloat(document.getElementById('loan-amount').value) || 0,
            date: parseInt(document.getElementById('loan-date').value) || 1,
            total_amount: parseFloat(document.getElementById('loan-total-amount').value) || 0,
            issue_date: document.getElementById('loan-issue-date').value,
            term_months: parseInt(document.getElementById('loan-term').value) || 0,
            total_overpayment: parseFloat(document.getElementById('loan-overpayment').value) || 0,
            current_debt: parseFloat(document.getElementById('loan-current-debt').value) || 0
        };

        if (!payload.name) return alert('Бро, название-то введи!');

        const isEdit = editLoanId.value !== "";
        const url = isEdit ? `/api/loans/${editLoanId.value}` : '/api/loans';
        const method = isEdit ? 'PUT' : 'POST';

        await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        loanModal.classList.remove('active');
        loadLoans();
    });

    window.deleteLoan = async (id) => {
        if (!confirm('Удалить этот кредит, бро?')) return;
        await fetch(`/api/loans/${id}`, { method: 'DELETE' });
        loadLoans();
    };

    // --- SETTINGS ---
    const saveSettingsBtn = document.getElementById('save-settings');

    async function loadSettings() {
        const res = await fetch('/api/settings');
        const data = await res.json();
        document.getElementById('salary-input').value = data.stable_salary;
        document.getElementById('days-off-input').value = data.days_off_per_week;
        document.getElementById('base-salary-input').value = data.base_salary;
        document.getElementById('shield-goal-input').value = data.shield_goal;
    }

    saveSettingsBtn.addEventListener('click', async () => {
        const payload = {
            stable_salary: parseFloat(document.getElementById('salary-input').value) || 0,
            days_off_per_week: parseInt(document.getElementById('days-off-input').value) || 1,
            base_salary: parseFloat(document.getElementById('base-salary-input').value) || 260000,
            shield_goal: parseFloat(document.getElementById('shield-goal-input').value) || 242600
        };

        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('Настройки сохранены! ✅');
        loadDashboardSummary(); // Refresh dashboard with new goals
    });

    // --- INCOME MODAL ---
    const incomeModal = document.getElementById('income-modal');
    const openIncomeModalBtn = document.getElementById('open-add-income');
    const closeIncomeModalBtn = document.getElementById('close-income-modal');
    const saveIncomeBtn = document.getElementById('save-income');

    openIncomeModalBtn.addEventListener('click', () => {
        document.getElementById('income-amount').value = '';
        incomeModal.classList.add('active');
    });

    closeIncomeModalBtn.addEventListener('click', () => incomeModal.classList.remove('active'));

    saveIncomeBtn.addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('income-amount').value);
        const type = document.getElementById('income-type').value;
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        if (isNaN(amount) || amount <= 0) return alert('Бро, введи нормальную сумму!');

        try {
            const res = await fetch('/api/incomes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, date, income_type: type })
            });
            
            if (res.ok) {
                incomeModal.classList.remove('active');
                loadDashboardSummary();
            } else {
                alert('Ошибка при сохранении дохода');
            }
        } catch (err) {
            console.error('Ошибка сохранения дохода:', err);
        }
    });

    // --- CHAT (Assistant) ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('send-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatLoader = document.getElementById('chat-loader');

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        const currentBalance = parseFloat(balanceInput.value) || 0;

        // Add user message
        const userDiv = document.createElement('div');
        userDiv.className = 'message user';
        userDiv.innerText = text;
        chatMessages.appendChild(userDiv);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Show loader ("Бро думает...")
        chatLoader.innerText = "Бро думает...";
        chatLoader.classList.remove('hidden');

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: text,
                    current_money: currentBalance
                })
            });
            const data = await res.json();

            const botDiv = document.createElement('div');
            botDiv.className = 'message bot';
            botDiv.innerText = data.response;
            chatMessages.appendChild(botDiv);
        } catch (err) {
            console.error(err);
            const errDiv = document.createElement('div');
            errDiv.className = 'message bot';
            errDiv.style.color = '#ff6b6b';
            errDiv.innerText = "Чето связь барахлит, бро. Проверь инет.";
            chatMessages.appendChild(errDiv);
        } finally {
            chatLoader.classList.add('hidden');
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    chatSendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
});
