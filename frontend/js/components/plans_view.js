// Subscription Plans View Component
const PlansView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Subscription Plans</h1>
                        <p class="text-sm text-slate-500">Configure recurring billing cadences, minimum commitments, renewal and termination policies.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-plan" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="plus" class="w-4 h-4"></i> Create Plan
                        </button>
                    </div>
                </div>

                <!-- Plans Grid -->
                <div id="plans-cards-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-64"></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-64"></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-64"></div>
                    <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-pulse h-64"></div>
                </div>
            </div>

            <!-- Create Plan Modal -->
            <div id="add-plan-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Create Subscription Plan</h3>
                        <button onclick="document.getElementById('add-plan-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-plan-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Plan Name *</label>
                            <input type="text" id="plan-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Monthly Business Suite">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Billing Cadence *</label>
                                <select id="plan-period" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="MONTHLY">Monthly</option>
                                    <option value="YEARLY">Yearly</option>
                                    <option value="WEEKLY">Weekly</option>
                                    <option value="DAILY">Daily</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Base Plan Fee ($) *</label>
                                <input type="number" step="0.01" id="plan-price" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1200.00">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Minimum Quantity (Seats) *</label>
                                <input type="number" id="plan-min-qty" value="1" min="1" required class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Availability Start *</label>
                                <input type="date" id="plan-start-date" required class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Availability End (Sunset)</label>
                            <input type="date" id="plan-end-date" class="w-full px-3 py-2 border rounded-lg text-sm">
                        </div>

                        <!-- Policy Switches -->
                        <div class="bg-slate-50 p-4 rounded-lg space-y-2 border border-slate-200">
                            <span class="block text-xs font-bold uppercase text-slate-500 mb-2">Lifecycle Permissions</span>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" id="plan-allow-pause" checked class="rounded text-indigo-600">
                                <span>Allow Subscriptions to be <strong>Paused & Resumed</strong></span>
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" id="plan-allow-early-close" checked class="rounded text-indigo-600">
                                <span>Allow <strong>Early Closure</strong> before term expiration</span>
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" id="plan-allow-renewal" checked class="rounded text-indigo-600">
                                <span>Allow Contract <strong>Renewal</strong></span>
                            </label>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" id="plan-auto-close" class="rounded text-indigo-600">
                                <span><strong>Auto-Close</strong> automatically when term ends</span>
                            </label>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-plan-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Plan</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        // Pre-fill start date with today
        document.getElementById('plan-start-date').value = new Date().toISOString().split('T')[0];

        document.getElementById('btn-open-add-plan').addEventListener('click', () => {
            document.getElementById('add-plan-modal').classList.remove('hidden');
        });

        document.getElementById('add-plan-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    name: document.getElementById('plan-name').value,
                    billing_period: document.getElementById('plan-period').value,
                    price: parseFloat(document.getElementById('plan-price').value),
                    min_quantity: parseInt(document.getElementById('plan-min-qty').value, 10),
                    availability_start: document.getElementById('plan-start-date').value,
                    availability_end: document.getElementById('plan-end-date').value || null,
                    allow_pause: document.getElementById('plan-allow-pause').checked,
                    allow_early_close: document.getElementById('plan-allow-early-close').checked,
                    allow_renewal: document.getElementById('plan-allow-renewal').checked,
                    auto_close: document.getElementById('plan-auto-close').checked
                };
                await API.createPlan(payload);
                document.getElementById('add-plan-modal').classList.add('hidden');
                document.getElementById('add-plan-form').reset();
                await this.loadPlans();
            } catch (err) {
                alert('Error creating plan: ' + err.message);
            }
        });

        await this.loadPlans();
    },

    async loadPlans() {
        try {
            const data = await API.getPlans();
            const plans = data.plans || [];
            const grid = document.getElementById('plans-cards-grid');

            if (!plans.length) {
                grid.innerHTML = '<div class="col-span-full py-8 text-center text-slate-400">No subscription plans found.</div>';
                return;
            }

            grid.innerHTML = plans.map(pl => `
                <div class="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition">
                    <div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="px-2.5 py-1 text-xs font-bold rounded-md bg-indigo-50 text-indigo-700 tracking-wider">
                                ${pl.billing_period}
                            </span>
                            <span class="text-xs text-slate-400">Min. ${pl.min_quantity} seat(s)</span>
                        </div>
                        <h3 class="text-lg font-bold text-slate-900 mt-2">${pl.name}</h3>
                        <p class="text-3xl font-extrabold text-slate-900 mt-3">
                            $${pl.price.toFixed(2)}
                            <span class="text-xs font-normal text-slate-400">/ ${pl.billing_period.toLowerCase()}</span>
                        </p>

                        <!-- Policy Feature Flags -->
                        <div class="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
                            <div class="flex items-center gap-1.5 ${pl.allow_pause ? 'text-emerald-700' : 'text-slate-400'}">
                                <i data-lucide="${pl.allow_pause ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
                                <span>Pause & Resume Allowed</span>
                            </div>
                            <div class="flex items-center gap-1.5 ${pl.allow_early_close ? 'text-emerald-700' : 'text-slate-400'}">
                                <i data-lucide="${pl.allow_early_close ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
                                <span>Early Closure Allowed</span>
                            </div>
                            <div class="flex items-center gap-1.5 ${pl.allow_renewal ? 'text-emerald-700' : 'text-slate-400'}">
                                <i data-lucide="${pl.allow_renewal ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
                                <span>Renewal Allowed</span>
                            </div>
                            <div class="flex items-center gap-1.5 ${pl.auto_close ? 'text-amber-700 font-semibold' : 'text-slate-400'}">
                                <i data-lucide="${pl.auto_close ? 'alert-circle' : 'minus'}" class="w-3.5 h-3.5"></i>
                                <span>${pl.auto_close ? 'Closes Automatically at Term' : 'Manual Expiration'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                        <button onclick="PlansView.deletePlan(${pl.id})" class="text-xs font-medium text-rose-600 hover:text-rose-800">
                            Archive Plan
                        </button>
                    </div>
                </div>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load plans:', err);
        }
    },

    async deletePlan(planId) {
        if (!confirm('Are you sure you want to archive this plan?')) return;
        try {
            await API.deletePlan(planId);
            await this.loadPlans();
        } catch (err) {
            alert('Failed to archive plan: ' + err.message);
        }
    }
};
