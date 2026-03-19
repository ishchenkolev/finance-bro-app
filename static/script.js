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
            if (target === 'loans') loadLoans();
            if (target === 'settings') loadSettings();
        });
    });

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
    }

    saveSettingsBtn.addEventListener('click', async () => {
        const payload = {
            stable_salary: parseFloat(document.getElementById('salary-input').value),
            days_off_per_week: parseInt(document.getElementById('days-off-input').value)
        };

        await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        alert('Настройки сохранены! ✅');
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
