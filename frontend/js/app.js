// Main Application Controller & Role Router for Brightloop Software
const App = {
    currentUser: null,

    async init() {
        try {
            this.currentUser = API.getUser();
            if (!this.currentUser) {
                this.renderAuthView();
            } else {
                this.renderAppShell();
                await this.handleNavigation();
                window.addEventListener('hashchange', () => this.handleNavigation());
            }
        } catch (err) {
            console.error('Initialization error:', err);
            this.renderAuthView();
        }
    },

    renderAuthView() {
        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
                <div class="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <!-- Brand Top Banner -->
                    <div class="bg-indigo-700 px-6 py-8 text-white text-center">
                        <div class="w-12 h-12 rounded-xl bg-white/10 mx-auto flex items-center justify-center font-black text-2xl mb-2">B</div>
                        <h1 class="text-2xl font-black">Brightloop Software</h1>
                        <p class="text-xs text-indigo-200 mt-1 uppercase tracking-wider font-semibold">Subscription Management Platform</p>
                    </div>

                    <!-- Auth Tabs -->
                    <div class="flex border-b border-slate-200 text-sm font-semibold">
                        <button id="tab-login" class="flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600">Sign In</button>
                        <button id="tab-register" class="flex-1 py-3 text-center text-slate-500 hover:text-slate-700">Register</button>
                        <button id="tab-reset" class="flex-1 py-3 text-center text-slate-500 hover:text-slate-700">Reset</button>
                    </div>

                    <div class="p-6">
                        <!-- Quick Demo Credentials Hint -->
                        <div class="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                            <p class="font-bold text-slate-700">Demo Accounts Available:</p>
                            <p class="text-slate-600"><strong>Admin:</strong> admin@brightloop.com / Admin@123</p>
                            <p class="text-slate-600"><strong>Staff:</strong> staff@brightloop.com / Staff@123</p>
                            <p class="text-slate-600"><strong>Customer:</strong> sarah@apexventures.com / Customer@123</p>
                        </div>

                        <!-- 1. Login Form -->
                        <form id="auth-login-form" class="space-y-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address</label>
                                <input type="email" id="login-email" required value="admin@brightloop.com" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Password</label>
                                <input type="password" id="login-password" required value="Admin@123" class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                            </div>
                            <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow transition">
                                Sign In
                            </button>
                        </form>

                        <!-- 2. Customer Registration Form -->
                        <form id="auth-register-form" class="space-y-3 hidden">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Company / Organization *</label>
                                <input type="text" id="reg-company" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Apex Ventures Inc">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Name *</label>
                                <input type="text" id="reg-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Sarah Jenkins">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address *</label>
                                <input type="email" id="reg-email" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="sarah@apexventures.com">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Password *</label>
                                <input type="password" id="reg-password" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Min 8 chars, Upper, Lower, Special">
                                <p class="text-xs text-slate-400 mt-0.5">Complexity: >8 chars, 1 uppercase, 1 lowercase, 1 special symbol.</p>
                            </div>
                            <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow transition mt-2">
                                Complete Customer Registration
                            </button>
                        </form>

                        <!-- 3. Password Reset Form -->
                        <form id="auth-reset-form" class="space-y-4 hidden">
                            <p class="text-xs text-slate-500">Enter your registered email address to generate a secure reset token.</p>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Email Address</label>
                                <input type="email" id="reset-email" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="user@brightloop.com">
                            </div>
                            <button type="submit" class="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-bold shadow transition">
                                Request Password Reset
                            </button>
                            <div id="reset-token-result" class="hidden p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-2"></div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Tab Switching
        const tabLogin = document.getElementById('tab-login');
        const tabReg = document.getElementById('tab-register');
        const tabReset = document.getElementById('tab-reset');
        const formLogin = document.getElementById('auth-login-form');
        const formReg = document.getElementById('auth-register-form');
        const formReset = document.getElementById('auth-reset-form');

        const switchTab = (activeTab, activeForm) => {
            [tabLogin, tabReg, tabReset].forEach(t => t.className = 'flex-1 py-3 text-center text-slate-500 hover:text-slate-700');
            [formLogin, formReg, formReset].forEach(f => f.classList.add('hidden'));
            activeTab.className = 'flex-1 py-3 text-center border-b-2 border-indigo-600 text-indigo-600 font-bold';
            activeForm.classList.remove('hidden');
        };

        tabLogin.onclick = () => switchTab(tabLogin, formLogin);
        tabReg.onclick = () => switchTab(tabReg, formReg);
        tabReset.onclick = () => switchTab(tabReset, formReset);

        // Login Handler
        formLogin.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const res = await API.login({
                    email: document.getElementById('login-email').value,
                    password: document.getElementById('login-password').value
                });
                API.setToken(res.token);
                API.setUser(res.user);
                window.location.reload();
            } catch (err) {
                alert('Sign in failed: ' + err.message);
            }
        };

        // Register Handler
        formReg.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    company_name: document.getElementById('reg-company').value,
                    full_name: document.getElementById('reg-name').value,
                    email: document.getElementById('reg-email').value,
                    password: document.getElementById('reg-password').value
                };
                const res = await API.register(payload);
                alert('Account registered! Signing you in...');
                API.setToken(res.token);
                API.setUser(res.user);
                window.location.reload();
            } catch (err) {
                alert('Registration failed: ' + err.message);
            }
        };

        // Reset Handler
        formReset.onsubmit = async (e) => {
            e.preventDefault();
            try {
                const res = await API.requestPasswordReset(document.getElementById('reset-email').value);
                const resDiv = document.getElementById('reset-token-result');
                resDiv.classList.remove('hidden');
                resDiv.innerHTML = `
                    <p class="font-bold text-emerald-800">Token Dispatched!</p>
                    <p class="text-slate-600">${res.message}</p>
                    ${res.reset_token ? `<div class="p-2 bg-white rounded font-mono text-[11px] break-all border border-emerald-300">Token: ${res.reset_token}</div>` : ''}
                `;
            } catch (err) {
                alert('Reset request failed: ' + err.message);
            }
        };
    },

    renderAppShell() {
        const u = this.currentUser;
        const role = u.role; // ADMIN, STAFF, CUSTOMER

        const appContainer = document.getElementById('app');
        appContainer.innerHTML = `
            <div class="min-h-screen flex bg-slate-50">
                <!-- Sidebar -->
                <aside class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between hidden md:flex shrink-0">
                    <div>
                        <!-- Logo Header -->
                        <div class="px-6 py-5 border-b border-slate-800 flex items-center gap-3">
                            <div class="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">B</div>
                            <div>
                                <h1 class="text-base font-bold text-white tracking-tight">Brightloop</h1>
                                <p class="text-xs text-indigo-400 font-semibold tracking-wider uppercase">${role} Portal</p>
                            </div>
                        </div>

                        <!-- Navigation Links -->
                        <nav id="sidebar-nav" class="p-4 space-y-1 text-sm font-medium">
                            ${this.getNavItemsHTML(role)}
                        </nav>
                    </div>

                    <!-- User Footer Info -->
                    <div class="p-4 border-t border-slate-800 bg-slate-950/40">
                        <div class="flex items-center justify-between">
                            <div class="overflow-hidden mr-2">
                                <p class="text-sm font-bold text-white truncate">${u.full_name}</p>
                                <p class="text-xs text-slate-400 truncate">${u.email}</p>
                            </div>
                            <button onclick="API.logout()" title="Logout" class="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition">
                                <i data-lucide="log-out" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </aside>

                <!-- Main Content Area -->
                <div class="flex-1 flex flex-col min-w-0">
                    <!-- Top Navbar -->
                    <header class="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full uppercase tracking-wider">
                                Role: ${role}
                            </span>
                            ${u.company_name ? `<span class="text-sm font-semibold text-slate-600">Client: ${u.company_name}</span>` : ''}
                        </div>

                        <!-- Fast Demo Switcher for Evaluation -->
                        <div class="flex items-center gap-3">
                            <span class="text-xs text-slate-400 font-medium hidden sm:inline">Switch Demo Role:</span>
                            <div class="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                                <button onclick="App.quickSwitchRole('admin@brightloop.com', 'Admin@123')" class="px-2.5 py-1 text-xs font-semibold rounded ${role === 'ADMIN' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Admin</button>
                                <button onclick="App.quickSwitchRole('staff@brightloop.com', 'Staff@123')" class="px-2.5 py-1 text-xs font-semibold rounded ${role === 'STAFF' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Staff</button>
                                <button onclick="App.quickSwitchRole('sarah@apexventures.com', 'Customer@123')" class="px-2.5 py-1 text-xs font-semibold rounded ${role === 'CUSTOMER' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'}">Customer</button>
                            </div>
                            <button onclick="API.logout()" class="text-xs font-bold px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                                Sign Out
                            </button>
                        </div>
                    </header>

                    <!-- Dynamic View Host -->
                    <main id="main-content" class="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full"></main>
                </div>
            </div>
        `;

        if (window.lucide) window.lucide.createIcons();
    },

    getNavItemsHTML(role) {
        if (role === 'CUSTOMER') {
            return `
                <a href="#dashboard" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i> My Dashboard
                </a>
                <a href="#subscriptions" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="layers" class="w-4 h-4"></i> My Subscriptions
                </a>
                <a href="#invoices" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="file-text" class="w-4 h-4"></i> My Invoices
                </a>
                <a href="#payments" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="credit-card" class="w-4 h-4"></i> Payment History
                </a>
                <a href="#quotations" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="file-check" class="w-4 h-4"></i> Proposals / Quotes
                </a>
            `;
        }

        if (role === 'STAFF') {
            return `
                <a href="#dashboard" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Operations Overview
                </a>
                <a href="#customers" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="users" class="w-4 h-4"></i> Customers
                </a>
                <a href="#quotations" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="file-check" class="w-4 h-4"></i> Quotations
                </a>
                <a href="#subscriptions" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="layers" class="w-4 h-4"></i> Subscriptions
                </a>
                <a href="#invoices" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="file-text" class="w-4 h-4"></i> Invoices
                </a>
                <a href="#payments" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                    <i data-lucide="credit-card" class="w-4 h-4"></i> Payments
                </a>
            `;
        }

        // Default: ADMIN Role (All 14 Sections)
        return `
            <a href="#dashboard" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Overview
            </a>
            <a href="#products" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="package" class="w-4 h-4"></i> Products & Variants
            </a>
            <a href="#plans" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="calendar" class="w-4 h-4"></i> Subscription Plans
            </a>
            <a href="#customers" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="users" class="w-4 h-4"></i> Customers
            </a>
            <a href="#quotations" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="file-check" class="w-4 h-4"></i> Quotations
            </a>
            <a href="#subscriptions" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="layers" class="w-4 h-4"></i> Subscriptions
            </a>
            <a href="#invoices" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="file-text" class="w-4 h-4"></i> Invoices
            </a>
            <a href="#payments" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="credit-card" class="w-4 h-4"></i> Payments
            </a>
            <a href="#discounts" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="tag" class="w-4 h-4"></i> Discounts
            </a>
            <a href="#taxes" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="percent" class="w-4 h-4"></i> Taxes
            </a>
            <a href="#staff" class="nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition">
                <i data-lucide="shield" class="w-4 h-4"></i> Staff Management
            </a>
        `;
    },

    async handleNavigation() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const container = document.getElementById('main-content');
        if (!container) return;

        // Highlight active link
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('href') === `#${hash}`) {
                link.className = 'nav-link flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-600 text-white font-bold transition';
            } else {
                link.className = 'nav-link flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition';
            }
        });

        // View Router
        switch (hash) {
            case 'products':
                await ProductsView.render(container);
                break;
            case 'plans':
                await PlansView.render(container);
                break;
            case 'quotations':
                await QuotationsView.render(container);
                break;
            case 'subscriptions':
                await SubscriptionsView.render(container);
                break;
            case 'invoices':
                await InvoicesView.render(container);
                break;
            case 'payments':
                await PaymentsView.render(container);
                break;
            case 'customers':
                await CustomersView.render(container);
                break;
            case 'discounts':
                await DiscountsView.render(container);
                break;
            case 'taxes':
                await TaxesView.render(container);
                break;
            case 'staff':
                await StaffView.render(container);
                break;
            case 'dashboard':
            default:
                await DashboardView.render(container);
                break;
        }

        if (window.lucide) window.lucide.createIcons();
    },

    async quickSwitchRole(email, password) {
        try {
            const res = await API.login({ email, password });
            API.setToken(res.token);
            API.setUser(res.user);
            window.location.hash = '#dashboard';
            window.location.reload();
        } catch (err) {
            alert('Switch failed: ' + err.message);
        }
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
