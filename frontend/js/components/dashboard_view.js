
// Dashboard View Component
const DashboardView = {
    chartInstances: {},

    async render(container) {
        const user = API.getUser();

        // Customers get a separate personal dashboard.
        // Admin and Staff retain the original dashboard.
        if (user && user.role === 'CUSTOMER') {
            await this.renderCustomerDashboard(container, user);
            return;
        }

        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Financial & Operations Dashboard</h1>
                        <p class="text-sm text-slate-500">Live operational overview across Brightloop Software's subscription portfolio.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-refresh-dashboard" class="px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 font-medium shadow-sm transition">
                            <i data-lucide="refresh-cw" class="w-4 h-4"></i> Refresh Data
                        </button>
                    </div>
                </div>

                <div id="metrics-cards-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse h-28"></div>
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse h-28"></div>
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse h-28"></div>
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-pulse h-28"></div>
                </div>

                <div id="mrr-banner" class="grid grid-cols-1 md:grid-cols-3 gap-4"></div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <i data-lucide="trending-up" class="w-4 h-4 text-indigo-600"></i> Revenue History
                        </h2>
                        <div class="h-64"><canvas id="revenueChart"></canvas></div>
                    </div>
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h2 class="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <i data-lucide="pie-chart" class="w-4 h-4 text-indigo-600"></i> Subscriptions by Status
                        </h2>
                        <div class="h-64 flex items-center justify-center"><canvas id="statusChart"></canvas></div>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <i data-lucide="layers" class="w-4 h-4 text-indigo-600"></i> Recent Subscriptions
                            </h2>
                            <a href="#subscriptions" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View All →</a>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="text-xs uppercase bg-slate-50 text-slate-500">
                                    <tr>
                                        <th class="py-2.5 px-3">Sub #</th>
                                        <th class="py-2.5 px-3">Customer</th>
                                        <th class="py-2.5 px-3">Plan</th>
                                        <th class="py-2.5 px-3">Status</th>
                                        <th class="py-2.5 px-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody id="recent-subs-tbody" class="divide-y divide-slate-100">
                                    <tr><td colspan="5" class="py-4 text-center text-slate-400">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-base font-semibold text-slate-800 flex items-center gap-2">
                                <i data-lucide="credit-card" class="w-4 h-4 text-emerald-600"></i> Recent Payments
                            </h2>
                            <a href="#payments" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View All →</a>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="text-xs uppercase bg-slate-50 text-slate-500">
                                    <tr>
                                        <th class="py-2.5 px-3">Payment #</th>
                                        <th class="py-2.5 px-3">Customer</th>
                                        <th class="py-2.5 px-3">Method</th>
                                        <th class="py-2.5 px-3">Date</th>
                                        <th class="py-2.5 px-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody id="recent-payments-tbody" class="divide-y divide-slate-100">
                                    <tr><td colspan="5" class="py-4 text-center text-slate-400">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-refresh-dashboard').addEventListener('click', () => this.loadData());
        await this.loadData();
    },

    // CUSTOMER DASHBOARD
    async renderCustomerDashboard(container, user) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Welcome, ${this.escapeHTML(user.full_name || 'Customer')}!</h1>
                        <p class="text-sm text-slate-500 mt-1">Here's an overview of your Brightloop account.</p>
                    </div>
                    <button id="btn-refresh-customer-dashboard" class="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
                        <i data-lucide="refresh-cw" class="w-4 h-4 inline"></i> Refresh
                    </button>
                </div>

                <div id="customer-dashboard-error" class="hidden p-4 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700"></div>

                <div id="customer-metrics" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    ${[1,2,3,4].map(() => '<div class="bg-white rounded-xl border border-slate-200 h-28 animate-pulse"></div>').join('')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                                <i data-lucide="layers" class="w-5 h-5 text-indigo-600"></i> My Recent Subscriptions
                            </h2>
                            <a href="#subscriptions" class="text-xs font-semibold text-indigo-600">View All →</a>
                        </div>
                        <div id="customer-recent-subscriptions" class="space-y-3">
                            <p class="text-sm text-slate-400">Loading subscriptions...</p>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div class="flex items-center justify-between mb-4">
                            <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                                <i data-lucide="file-text" class="w-5 h-5 text-indigo-600"></i> Recent Invoices
                            </h2>
                            <a href="#invoices" class="text-xs font-semibold text-indigo-600">View All →</a>
                        </div>
                        <div id="customer-recent-invoices" class="space-y-3">
                            <p class="text-sm text-slate-400">Loading invoices...</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="font-semibold text-slate-800 flex items-center gap-2">
                            <i data-lucide="credit-card" class="w-5 h-5 text-emerald-600"></i> Recent Payments
                        </h2>
                        <a href="#payments" class="text-xs font-semibold text-indigo-600">View All →</a>
                    </div>
                    <div id="customer-recent-payments" class="space-y-3">
                        <p class="text-sm text-slate-400">Loading payments...</p>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('btn-refresh-customer-dashboard')
            .addEventListener('click', () => this.loadCustomerData());

        await this.loadCustomerData();

        if (window.lucide) window.lucide.createIcons();
    },

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    },

    money(value) {
        return '$' + Number(value || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    async loadCustomerData() {
        const metricsEl = document.getElementById('customer-metrics');
        if (!metricsEl) return;

        const errorEl = document.getElementById('customer-dashboard-error');

        try {
            const [subData, invoiceData, paymentData] = await Promise.all([
                API.getSubscriptions(),
                API.getInvoices(),
                API.getPayments()
            ]);

            const subscriptions = subData.subscriptions || [];
            const invoices = invoiceData.invoices || [];
            const payments = paymentData.payments || [];

            const activeCount = subscriptions.filter(s => s.status === 'ACTIVE').length;

            const outstanding = invoices
                .filter(i => i.status !== 'CANCELLED')
                .reduce((sum, i) => sum + Number(i.outstanding_balance || 0), 0);

            const paid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

            const upcomingDates = subscriptions
                .filter(s => s.status === 'ACTIVE' && s.next_billing_date)
                .map(s => s.next_billing_date)
                .sort();

            const nextBilling = upcomingDates.length
                ? new Date(upcomingDates[0] + 'T00:00:00').toLocaleDateString()
                : 'Not scheduled';

            metricsEl.innerHTML = `
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Active Subscriptions</p>
                        <i data-lucide="layers" class="w-5 h-5 text-indigo-600"></i>
                    </div>
                    <p class="text-3xl font-bold text-slate-900 mt-3">${activeCount}</p>
                    <p class="text-xs text-slate-500 mt-1">Your active plans</p>
                </div>

                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Outstanding Balance</p>
                        <i data-lucide="wallet" class="w-5 h-5 text-amber-600"></i>
                    </div>
                    <p class="text-2xl font-bold text-amber-600 mt-3">${this.money(outstanding)}</p>
                    <p class="text-xs text-slate-500 mt-1">Across your invoices</p>
                </div>

                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Payments</p>
                        <i data-lucide="check-circle" class="w-5 h-5 text-emerald-600"></i>
                    </div>
                    <p class="text-2xl font-bold text-emerald-600 mt-3">${this.money(paid)}</p>
                    <p class="text-xs text-slate-500 mt-1">${payments.length} recorded payments</p>
                </div>

                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold uppercase tracking-wider text-slate-500">Next Billing Date</p>
                        <i data-lucide="calendar-clock" class="w-5 h-5 text-indigo-600"></i>
                    </div>
                    <p class="text-lg font-bold text-slate-900 mt-3">${this.escapeHTML(nextBilling)}</p>
                    <p class="text-xs text-slate-500 mt-1">Your next scheduled billing</p>
                </div>
            `;

            const recentSubs = document.getElementById('customer-recent-subscriptions');
            recentSubs.innerHTML = subscriptions.slice(0, 5).map(s => `
                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">${this.escapeHTML(s.plan_name || s.subscription_number)}</p>
                        <p class="text-xs text-slate-500">${this.escapeHTML(s.subscription_number)} · ${this.escapeHTML(s.billing_period || '')}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">${this.escapeHTML(s.status)}</span>
                        <p class="text-sm font-bold text-slate-800 mt-1">${this.money(s.total_amount)}</p>
                    </div>
                </div>
            `).join('') || '<p class="text-sm text-slate-400">No subscriptions found.</p>';

            const recentInvoices = document.getElementById('customer-recent-invoices');
            recentInvoices.innerHTML = invoices.slice(0, 5).map(i => `
                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">${this.escapeHTML(i.invoice_number)}</p>
                        <p class="text-xs text-slate-500">${this.escapeHTML(i.invoice_date || '')}</p>
                    </div>
                    <div class="text-right shrink-0">
                        <span class="text-xs font-semibold px-2 py-1 rounded-full bg-slate-100 text-slate-700">${this.escapeHTML(i.status)}</span>
                        <p class="text-sm font-bold text-slate-800 mt-1">${this.money(i.total_amount)}</p>
                    </div>
                </div>
            `).join('') || '<p class="text-sm text-slate-400">No invoices found.</p>';

            const recentPayments = document.getElementById('customer-recent-payments');
            recentPayments.innerHTML = payments.slice(0, 5).map(p => `
                <div class="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-800">${this.escapeHTML(p.payment_number)}</p>
                        <p class="text-xs text-slate-500">${this.escapeHTML(p.payment_date || '')} · ${this.escapeHTML(p.payment_method || '')}</p>
                    </div>
                    <p class="text-sm font-bold text-emerald-600 shrink-0">${this.money(p.amount)}</p>
                </div>
            `).join('') || '<p class="text-sm text-slate-400">No payments recorded yet.</p>';

            if (errorEl) errorEl.classList.add('hidden');
            if (window.lucide) window.lucide.createIcons();

        } catch (err) {
            console.error('Failed to load customer dashboard:', err);
            if (errorEl) {
                errorEl.textContent = 'Unable to load your account information: ' + err.message;
                errorEl.classList.remove('hidden');
            }
            metricsEl.innerHTML = '<div class="col-span-full p-5 bg-rose-50 text-rose-700 rounded-lg">Could not load dashboard data. Please try refreshing.</div>';
        }
    },

    async loadData() {
        try {
            const data = await API.getDashboardMetrics();
            const metrics = data.metrics || {};
            this.renderMetricsCards(metrics);
            this.renderMRR(metrics);
            this.renderCharts(metrics);
            this.renderRecentTables(metrics);
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load dashboard metrics:', err);
        }
    },

    renderMetricsCards(m) {
        const grid = document.getElementById('metrics-cards-grid');
        grid.innerHTML = `
            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Active Subscriptions</p>
                    <p class="text-2xl font-bold text-slate-900 mt-1">${m.active_subscriptions || 0}</p>
                    <p class="text-xs text-slate-500 mt-1">out of ${m.total_subscriptions || 0} total subscriptions</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <i data-lucide="zap" class="w-6 h-6"></i>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Revenue Received</p>
                    <p class="text-2xl font-bold text-emerald-600 mt-1">$${(m.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p class="text-xs text-slate-500 mt-1">Settled cash flow to date</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <i data-lucide="check-circle" class="w-6 h-6"></i>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Outstanding Balance</p>
                    <p class="text-2xl font-bold text-amber-600 mt-1">$${(m.total_outstanding || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p class="text-xs text-slate-500 mt-1">Open invoice receivables</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                    <i data-lucide="clock" class="w-6 h-6"></i>
                </div>
            </div>

            <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs font-medium uppercase tracking-wider text-slate-500">Overdue Invoices</p>
                    <p class="text-2xl font-bold text-rose-600 mt-1">${m.overdue_count || 0}</p>
                    <p class="text-xs text-rose-500 mt-1 font-medium">$${(m.overdue_amount || 0).toLocaleString(undefined, {minimumFractionDigits: 2})} at risk</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <i data-lucide="alert-triangle" class="w-6 h-6"></i>
                </div>
            </div>
        `;
    },

    renderMRR(m) {
        const banner = document.getElementById('mrr-banner');
        banner.innerHTML = `
            <div class="bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wider font-semibold text-indigo-200">Monthly Recurring Revenue (MRR)</p>
                    <p class="text-3xl font-extrabold mt-1">$${(m.mrr || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p class="text-xs text-indigo-300 mt-1">Normalized active subscription run-rate</p>
                </div>
                <div class="p-3 bg-white/10 rounded-lg"><i data-lucide="bar-chart-2" class="w-8 h-8 text-indigo-200"></i></div>
            </div>

            <div class="bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wider font-semibold text-slate-300">Annual Run-Rate (ARR)</p>
                    <p class="text-3xl font-extrabold mt-1">$${(m.arr || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    <p class="text-xs text-slate-400 mt-1">Projected annualized recurring revenue</p>
                </div>
                <div class="p-3 bg-white/10 rounded-lg"><i data-lucide="calendar" class="w-8 h-8 text-slate-300"></i></div>
            </div>

            <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wider font-semibold text-slate-500">Total Customer Accounts</p>
                    <p class="text-3xl font-extrabold text-slate-800 mt-1">${m.total_customers || 0}</p>
                    <p class="text-xs text-slate-500 mt-1">B2B enterprise and retail clients</p>
                </div>
                <div class="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><i data-lucide="users" class="w-8 h-8"></i></div>
            </div>
        `;
    },

    renderCharts(m) {
        if (this.chartInstances.revenue) this.chartInstances.revenue.destroy();
        if (this.chartInstances.status) this.chartInstances.status.destroy();

        const revCtx = document.getElementById('revenueChart');
        if (revCtx) {
            const revData = m.revenue_chart || [];
            const labels = revData.length ? revData.map(r => r.month) : ['Oct 2026', 'Nov 2026'];
            const values = revData.length ? revData.map(r => r.total) : [3872.0, 1872.0];

            this.chartInstances.revenue = new Chart(revCtx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Cash Inflow ($)',
                        data: values,
                        borderColor: '#4f46e5',
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.35
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: { callback: v => '$' + v.toLocaleString() }
                        }
                    }
                }
            });
        }

        const statusCtx = document.getElementById('statusChart');
        if (statusCtx) {
            const rawStatus = m.status_breakdown || [];
            const labels = rawStatus.map(s => s.status);
            const counts = rawStatus.map(s => s.count);

            this.chartInstances.status = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: labels.length ? labels : ['ACTIVE'],
                    datasets: [{
                        data: counts.length ? counts : [1],
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
    },

    renderRecentTables(m) {
        const subsTbody = document.getElementById('recent-subs-tbody');
        if (m.recent_subscriptions && m.recent_subscriptions.length) {
            subsTbody.innerHTML = m.recent_subscriptions.map(s => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-2.5 px-3 font-semibold text-indigo-600">${s.subscription_number}</td>
                    <td class="py-2.5 px-3 font-medium text-slate-800">${s.company_name}</td>
                    <td class="py-2.5 px-3 text-slate-600">${s.plan_name} <span class="text-xs text-slate-400">(${s.billing_period})</span></td>
                    <td class="py-2.5 px-3"><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                    <td class="py-2.5 px-3 text-right font-bold text-slate-900">$${Number(s.total_amount || 0).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            subsTbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400">No subscriptions found.</td></tr>';
        }

        const payTbody = document.getElementById('recent-payments-tbody');
        if (m.recent_payments && m.recent_payments.length) {
            payTbody.innerHTML = m.recent_payments.map(p => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-2.5 px-3 font-semibold text-emerald-600">${p.payment_number}</td>
                    <td class="py-2.5 px-3 font-medium text-slate-800">${p.company_name}</td>
                    <td class="py-2.5 px-3 text-slate-600">${p.payment_method}</td>
                    <td class="py-2.5 px-3 text-slate-500">${p.payment_date}</td>
                    <td class="py-2.5 px-3 text-right font-bold text-emerald-600">+$${Number(p.amount || 0).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            payTbody.innerHTML = '<tr><td colspan="5" class="py-4 text-center text-slate-400">No payments found.</td></tr>';
        }
    }
};
