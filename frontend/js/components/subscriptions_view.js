// Subscriptions View Component
const SubscriptionsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Subscription Contracts</h1>
                        <p class="text-sm text-slate-500">Manage client subscriptions, lifecycle state transitions, pausing, and renewals.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="sub-filter-status" class="px-3 py-2 border rounded-lg text-sm bg-white text-slate-700">
                            <option value="">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="CLOSED">Closed</option>
                        </select>
                    </div>
                </div>

                <!-- Subscriptions Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Subscription #</th>
                                    <th class="py-3 px-4">Customer</th>
                                    <th class="py-3 px-4">Plan</th>
                                    <th class="py-3 px-4">Next Billing</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Periodic Total</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="subs-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="7" class="py-8 text-center text-slate-400">Loading subscriptions...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- View Subscription Modal -->
            <div id="view-sub-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900" id="sub-modal-title">Subscription Details</h3>
                        <button onclick="document.getElementById('view-sub-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div id="sub-modal-content" class="space-y-4"></div>
                </div>
            </div>
        `;

        document.getElementById('sub-filter-status').addEventListener('change', (e) => {
            this.loadSubscriptions(e.target.value);
        });

        await this.loadSubscriptions();
    },

    async loadSubscriptions(statusFilter = null) {
        try {
            const data = await API.getSubscriptions(statusFilter);
            const subs = data.subscriptions || [];
            const tbody = document.getElementById('subs-table-tbody');

            if (!subs.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No subscriptions found.</td></tr>';
                return;
            }

            tbody.innerHTML = subs.map(s => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-bold text-indigo-600">${s.subscription_number}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">${s.company_name}</td>
                    <td class="py-3 px-4 text-slate-600">${s.plan_name} <span class="text-xs text-slate-400">(${s.billing_period})</span></td>
                    <td class="py-3 px-4 text-slate-700 font-medium">${s.next_billing_date}</td>
                    <td class="py-3 px-4"><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                    <td class="py-3 px-4 text-right font-extrabold text-slate-900">$${s.total_amount.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button onclick="SubscriptionsView.viewSubscription(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
                            Details
                        </button>
                        ${s.status === 'ACTIVE' && s.allow_pause ? `
                            <button onclick="SubscriptionsView.pauseSub(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100">
                                Pause
                            </button>
                        ` : ''}
                        ${s.status === 'PAUSED' ? `
                            <button onclick="SubscriptionsView.resumeSub(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100">
                                Resume
                            </button>
                        ` : ''}
                        ${s.status === 'ACTIVE' && s.allow_early_close ? `
                            <button onclick="SubscriptionsView.closeSub(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 rounded hover:bg-rose-100">
                                Close
                            </button>
                        ` : ''}
                        ${s.allow_renewal ? `
                            <button onclick="SubscriptionsView.renewSub(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100">
                                Renew
                            </button>
                        ` : ''}
                        ${s.status === 'ACTIVE' ? `
                            <button onclick="SubscriptionsView.generateInvoice(${s.id})" class="text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                Bill Now
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load subscriptions:', err);
        }
    },

    async viewSubscription(subId) {
        try {
            const data = await API.getSubscription(subId);
            const s = data.subscription;
            document.getElementById('sub-modal-title').innerText = `${s.subscription_number} – ${s.company_name}`;
            const content = document.getElementById('sub-modal-content');

            content.innerHTML = `
                <div class="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg">
                    <div>
                        <p class="text-xs text-slate-400 uppercase font-bold">Plan</p>
                        <p class="font-semibold text-slate-800">${s.plan_name} (${s.billing_period})</p>
                        <p class="text-xs text-slate-400 uppercase font-bold mt-2">Start Date</p>
                        <p class="text-slate-700">${s.start_date}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-400 uppercase font-bold">Status</p>
                        <span class="badge badge-${s.status.toLowerCase()}">${s.status}</span>
                        <p class="text-xs text-slate-400 uppercase font-bold mt-2">Contract Expiry</p>
                        <p class="text-slate-700">${s.expiry_date || 'Ongoing'}</p>
                    </div>
                </div>

                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-600">Product Line Items</div>
                    <table class="w-full text-left text-sm">
                        <thead class="text-xs text-slate-400 border-b">
                            <tr>
                                <th class="py-2 px-3">Product</th>
                                <th class="py-2 px-3 text-center">Qty</th>
                                <th class="py-2 px-3 text-right">Unit Price</th>
                                <th class="py-2 px-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(s.lines || []).map(l => `
                                <tr>
                                    <td class="py-2 px-3 font-medium text-slate-800">
                                        ${l.product_name}
                                        ${l.variant_value ? `<span class="text-xs text-indigo-600 block">${l.variant_name}: ${l.variant_value}</span>` : ''}
                                    </td>
                                    <td class="py-2 px-3 text-center">${l.quantity}</td>
                                    <td class="py-2 px-3 text-right">$${l.unit_price.toFixed(2)}</td>
                                    <td class="py-2 px-3 text-right font-bold text-slate-900">$${l.line_total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="border rounded-lg overflow-hidden">
                    <div class="bg-slate-100 px-3 py-2 text-xs font-bold uppercase text-slate-600">Generated Period Invoices</div>
                    <table class="w-full text-left text-xs">
                        <thead class="text-slate-400 border-b">
                            <tr>
                                <th class="py-1.5 px-3">Invoice #</th>
                                <th class="py-1.5 px-3">Date</th>
                                <th class="py-1.5 px-3">Status</th>
                                <th class="py-1.5 px-3 text-right">Total</th>
                                <th class="py-1.5 px-3 text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(s.invoices || []).map(inv => `
                                <tr>
                                    <td class="py-2 px-3 font-bold text-indigo-600">${inv.invoice_number}</td>
                                    <td class="py-2 px-3 text-slate-500">${inv.invoice_date}</td>
                                    <td class="py-2 px-3"><span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span></td>
                                    <td class="py-2 px-3 text-right font-semibold">$${inv.total_amount.toFixed(2)}</td>
                                    <td class="py-2 px-3 text-right font-bold ${inv.outstanding_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}">
                                        $${inv.outstanding_balance.toFixed(2)}
                                    </td>
                                </tr>
                            `).join('') || '<tr><td colspan="5" class="py-3 text-center text-slate-400">No invoices generated yet.</td></tr>'}
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('view-sub-modal').classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            alert('Failed to view subscription: ' + err.message);
        }
    },

    async pauseSub(subId) {
        if (!confirm('Pause this active subscription?')) return;
        try {
            await API.pauseSubscription(subId);
            await this.loadSubscriptions();
        } catch (err) {
            alert('Error pausing subscription: ' + err.message);
        }
    },

    async resumeSub(subId) {
        if (!confirm('Resume this paused subscription?')) return;
        try {
            await API.resumeSubscription(subId);
            await this.loadSubscriptions();
        } catch (err) {
            alert('Error resuming subscription: ' + err.message);
        }
    },

    async closeSub(subId) {
        if (!confirm('Close this subscription early?')) return;
        try {
            await API.closeSubscription(subId);
            await this.loadSubscriptions();
        } catch (err) {
            alert('Error closing subscription: ' + err.message);
        }
    },

    async renewSub(subId) {
        const months = prompt('Enter renewal term extension (months):', '12');
        if (!months) return;
        try {
            await API.renewSubscription(subId, parseInt(months, 10));
            alert('Subscription renewed successfully!');
            await this.loadSubscriptions();
        } catch (err) {
            alert('Error renewing subscription: ' + err.message);
        }
    },

    async generateInvoice(subId) {
        if (!confirm('Generate the next recurring period invoice for this subscription now?')) return;
        try {
            const res = await API.generateInvoiceForSubscription(subId);
            alert('Invoice generated: ' + res.invoice.invoice_number);
            await this.loadSubscriptions();
        } catch (err) {
            alert('Error generating invoice: ' + err.message);
        }
    }
};
