// Payments View Component
const PaymentsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Payments & Remittances</h1>
                        <p class="text-sm text-slate-500">Record incoming client payments, reconcile partial installments, and track payment receipts.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-record-payment" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="plus-circle" class="w-4 h-4"></i> Record Payment
                        </button>
                    </div>
                </div>

                <!-- Payments Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Payment #</th>
                                    <th class="py-3 px-4">Customer</th>
                                    <th class="py-3 px-4">Invoice #</th>
                                    <th class="py-3 px-4">Payment Method</th>
                                    <th class="py-3 px-4">Transaction Ref</th>
                                    <th class="py-3 px-4">Payment Date</th>
                                    <th class="py-3 px-4 text-right">Amount Paid</th>
                                </tr>
                            </thead>
                            <tbody id="payments-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="7" class="py-8 text-center text-slate-400">Loading payments...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Standalone Record Payment Modal -->
            <div id="record-payment-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Record Incoming Payment</h3>
                        <button onclick="document.getElementById('record-payment-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="record-payment-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Select Open Invoice *</label>
                            <select id="modal-pay-invoice-select" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
                            <div id="invoice-balance-hint" class="text-xs text-amber-600 font-semibold mt-1"></div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Amount ($) *</label>
                            <input type="number" step="0.01" id="modal-pay-amount" required class="w-full px-3 py-2 border rounded-lg text-sm font-bold">
                            <p class="text-xs text-slate-400 mt-1">Accepts partial payments or exact settlement.</p>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Method *</label>
                                <select id="modal-pay-method" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                                    <option value="CREDIT_CARD">Credit Card</option>
                                    <option value="ONLINE">Online Portal</option>
                                    <option value="CHEQUE">Corporate Cheque</option>
                                    <option value="CASH">Cash</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Date *</label>
                                <input type="date" id="modal-pay-date" required class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Transaction Reference</label>
                            <input type="text" id="modal-pay-ref" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. WIRE-89102, CC-AUTH-4412">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Remittance Notes</label>
                            <textarea id="modal-pay-notes" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Optional notes..."></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('record-payment-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Record Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('modal-pay-date').value = new Date().toISOString().split('T')[0];

        document.getElementById('btn-open-record-payment').addEventListener('click', async () => {
            await this.populateInvoiceDropdown();
            document.getElementById('record-payment-modal').classList.remove('hidden');
        });

        document.getElementById('record-payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    invoice_id: parseInt(document.getElementById('modal-pay-invoice-select').value, 10),
                    amount: parseFloat(document.getElementById('modal-pay-amount').value),
                    payment_method: document.getElementById('modal-pay-method').value,
                    payment_date: document.getElementById('modal-pay-date').value,
                    transaction_reference: document.getElementById('modal-pay-ref').value,
                    notes: document.getElementById('modal-pay-notes').value
                };
                await API.recordPayment(payload);
                document.getElementById('record-payment-modal').classList.add('hidden');
                document.getElementById('record-payment-form').reset();
                alert('Payment successfully recorded!');
                await this.loadPayments();
            } catch (err) {
                alert('Payment error: ' + err.message);
            }
        });

        await this.loadPayments();
    },

    async populateInvoiceDropdown() {
        const data = await API.getInvoices();
        const openInvoices = (data.invoices || []).filter(i => i.outstanding_balance > 0 && i.status !== 'CANCELLED');
        const select = document.getElementById('modal-pay-invoice-select');
        const hint = document.getElementById('invoice-balance-hint');

        if (!openInvoices.length) {
            select.innerHTML = '<option value="">-- No Outstanding Invoices Found --</option>';
            hint.innerText = 'All invoices are fully paid.';
            return;
        }

        select.innerHTML = openInvoices.map(i => `
            <option value="${i.id}" data-balance="${i.outstanding_balance}">
                ${i.invoice_number} – ${i.company_name} (Balance: $${i.outstanding_balance.toFixed(2)})
            </option>
        `).join('');

        const updateHint = () => {
            const opt = select.selectedOptions[0];
            if (opt) {
                const bal = parseFloat(opt.getAttribute('data-balance') || 0);
                hint.innerText = `Current Outstanding Balance: $${bal.toFixed(2)}`;
                document.getElementById('modal-pay-amount').value = bal.toFixed(2);
            }
        };

        select.addEventListener('change', updateHint);
        updateHint();
    },

    async loadPayments() {
        try {
            const data = await API.getPayments();
            const payments = data.payments || [];
            const tbody = document.getElementById('payments-table-tbody');

            if (!payments.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No payment records found.</td></tr>';
                return;
            }

            tbody.innerHTML = payments.map(p => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-bold text-emerald-600">${p.payment_number}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">${p.company_name}</td>
                    <td class="py-3 px-4 font-medium text-indigo-600">${p.invoice_number}</td>
                    <td class="py-3 px-4 text-slate-700">${p.payment_method}</td>
                    <td class="py-3 px-4 text-slate-500 font-mono text-xs">${p.transaction_reference || 'N/A'}</td>
                    <td class="py-3 px-4 text-slate-600">${p.payment_date}</td>
                    <td class="py-3 px-4 text-right font-extrabold text-emerald-600">+$${p.amount.toFixed(2)}</td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load payments:', err);
        }
    }
};
