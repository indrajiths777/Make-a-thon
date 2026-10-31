// Tax Management View Component (Admin Only)
const TaxesView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Tax Rates & Jurisdictions</h1>
                        <p class="text-sm text-slate-500">Configure sales taxes, VAT rates, and jurisdiction defaults.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-tax" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="percent" class="w-4 h-4"></i> Add Tax Rate
                        </button>
                    </div>
                </div>

                <!-- Taxes Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Tax Name</th>
                                    <th class="py-3 px-4">Rate (%)</th>
                                    <th class="py-3 px-4">Default Applied</th>
                                </tr>
                            </thead>
                            <tbody id="taxes-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="3" class="py-8 text-center text-slate-400">Loading taxes...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Create Tax Modal -->
            <div id="add-tax-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Add Tax Rate</h3>
                        <button onclick="document.getElementById('add-tax-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-tax-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Tax Label / Name *</label>
                            <input type="text" id="tax-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Standard Sales Tax (10%)">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Tax Rate (%) *</label>
                            <input type="number" step="0.01" min="0" max="100" id="tax-rate" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="10.0">
                        </div>
                        <div>
                            <label class="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                <input type="checkbox" id="tax-is-default" class="rounded text-indigo-600">
                                <span>Set as <strong>Default System Tax</strong> on new invoices</span>
                            </label>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-tax-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Tax</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-open-add-tax').addEventListener('click', () => {
            document.getElementById('add-tax-modal').classList.remove('hidden');
        });

        document.getElementById('add-tax-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    name: document.getElementById('tax-name').value,
                    rate: parseFloat(document.getElementById('tax-rate').value),
                    is_default: document.getElementById('tax-is-default').checked
                };
                await API.createTax(payload);
                document.getElementById('add-tax-modal').classList.add('hidden');
                document.getElementById('add-tax-form').reset();
                await this.loadTaxes();
            } catch (err) {
                alert('Error creating tax: ' + err.message);
            }
        });

        await this.loadTaxes();
    },

    async loadTaxes() {
        try {
            const data = await API.getTaxes();
            const taxes = data.taxes || [];
            const tbody = document.getElementById('taxes-table-tbody');

            tbody.innerHTML = taxes.map(t => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-semibold text-slate-900">${t.name}</td>
                    <td class="py-3 px-4 font-bold text-slate-700">${t.rate.toFixed(2)}%</td>
                    <td class="py-3 px-4">
                        ${t.is_default ? '<span class="badge badge-active">Default Applied</span>' : '<span class="text-xs text-slate-400">Optional</span>'}
                    </td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load taxes:', err);
        }
    }
};
