// Discount Management View Component (Admin Only)
const DiscountsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Discount & Promotion Rules</h1>
                        <p class="text-sm text-slate-500">Configure promotional discount codes, percentage rates, volume thresholds, and usage limits.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-discount" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="tag" class="w-4 h-4"></i> Create Discount
                        </button>
                    </div>
                </div>

                <!-- Discounts Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Code</th>
                                    <th class="py-3 px-4">Name</th>
                                    <th class="py-3 px-4">Type</th>
                                    <th class="py-3 px-4">Discount Value</th>
                                    <th class="py-3 px-4">Min Spend / Qty</th>
                                    <th class="py-3 px-4">Validity</th>
                                    <th class="py-3 px-4">Usage Count</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="discounts-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="8" class="py-8 text-center text-slate-400">Loading discounts...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Create Discount Modal -->
            <div id="add-discount-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Create Discount Rule</h3>
                        <button onclick="document.getElementById('add-discount-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-discount-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Discount Code *</label>
                                <input type="text" id="disc-code" required class="w-full px-3 py-2 border rounded-lg text-sm uppercase font-mono" placeholder="WELCOME100">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Discount Type *</label>
                                <select id="disc-type" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="FIXED">Fixed Amount ($)</option>
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Rule Name *</label>
                            <input type="text" id="disc-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. New Subscriber Welcome Discount">
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Value ($ or %) *</label>
                                <input type="number" step="0.01" id="disc-value" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="100.00">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Scope</label>
                                <select id="disc-scope" class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="SUBSCRIPTION">Whole Subscription</option>
                                    <option value="PRODUCT">Product Specific</option>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Min Spend ($)</label>
                                <input type="number" step="0.01" id="disc-min-spend" value="0.00" class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Min Quantity (Seats)</label>
                                <input type="number" id="disc-min-qty" value="0" class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Start Date *</label>
                                <input type="date" id="disc-start-date" required class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">End Date</label>
                                <input type="date" id="disc-end-date" class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Max Usages (Limit)</label>
                            <input type="number" id="disc-max-uses" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Leave blank for unlimited">
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-discount-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Rule</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('disc-start-date').value = new Date().toISOString().split('T')[0];

        document.getElementById('btn-open-add-discount').addEventListener('click', () => {
            document.getElementById('add-discount-modal').classList.remove('hidden');
        });

        document.getElementById('add-discount-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const maxUsesVal = document.getElementById('disc-max-uses').value;
                const payload = {
                    code: document.getElementById('disc-code').value,
                    name: document.getElementById('disc-name').value,
                    discount_type: document.getElementById('disc-type').value,
                    value: parseFloat(document.getElementById('disc-value').value),
                    scope: document.getElementById('disc-scope').value,
                    min_purchase_amount: parseFloat(document.getElementById('disc-min-spend').value || 0),
                    min_quantity: parseInt(document.getElementById('disc-min-qty').value || 0, 10),
                    start_date: document.getElementById('disc-start-date').value,
                    end_date: document.getElementById('disc-end-date').value || null,
                    max_uses: maxUsesVal ? parseInt(maxUsesVal, 10) : null
                };
                await API.createDiscount(payload);
                document.getElementById('add-discount-modal').classList.add('hidden');
                document.getElementById('add-discount-form').reset();
                await this.loadDiscounts();
            } catch (err) {
                alert('Error creating discount: ' + err.message);
            }
        });

        await this.loadDiscounts();
    },

    async loadDiscounts() {
        try {
            const data = await API.getDiscounts();
            const discounts = data.discounts || [];
            const tbody = document.getElementById('discounts-table-tbody');

            if (!discounts.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-slate-400">No discount rules found.</td></tr>';
                return;
            }

            tbody.innerHTML = discounts.map(d => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-indigo-700">${d.code}</td>
                    <td class="py-3 px-4 font-semibold text-slate-800">${d.name}</td>
                    <td class="py-3 px-4 text-xs font-semibold text-slate-500">${d.discount_type}</td>
                    <td class="py-3 px-4 font-bold text-emerald-600">
                        ${d.discount_type === 'PERCENTAGE' ? d.value + '%' : '$' + d.value.toFixed(2)}
                    </td>
                    <td class="py-3 px-4 text-xs text-slate-600">
                        $${d.min_purchase_amount.toFixed(2)} / ${d.min_quantity} seat(s)
                    </td>
                    <td class="py-3 px-4 text-xs text-slate-500">
                        ${d.start_date} &rarr; ${d.end_date || 'Ongoing'}
                    </td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-0.5 text-xs font-bold rounded ${d.max_uses && d.times_used >= d.max_uses ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}">
                            ${d.times_used} / ${d.max_uses !== null ? d.max_uses : '&infin;'}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="DiscountsView.deleteDiscount(${d.id})" class="text-xs font-semibold text-rose-600 hover:text-rose-800">
                            Deactivate
                        </button>
                    </td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load discounts:', err);
        }
    },

    async deleteDiscount(discountId) {
        if (!confirm('Deactivate this discount rule?')) return;
        try {
            await API.deleteDiscount(discountId);
            await this.loadDiscounts();
        } catch (err) {
            alert('Failed to deactivate discount: ' + err.message);
        }
    }
};
