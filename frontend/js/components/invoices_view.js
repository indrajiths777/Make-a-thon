// Invoices & Recurring Billing View Component
const InvoicesView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Invoices & Recurring Billing</h1>
                        <p class="text-sm text-slate-500">Track period invoices, automated tax calculations, discounts, and dispatch billing runs.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <select id="invoice-filter-status" class="px-3 py-2 border rounded-lg text-sm bg-white text-slate-700">
                            <option value="">All Invoices</option>
                            <option value="CONFIRMED">Confirmed</option>
                            <option value="PAID">Paid</option>
                            <option value="DRAFT">Draft</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <button id="btn-run-billing" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="play-circle" class="w-4 h-4"></i> Run Recurring Billing
                        </button>
                    </div>
                </div>

                <!-- Invoices Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Invoice #</th>
                                    <th class="py-3 px-4">Customer</th>
                                    <th class="py-3 px-4">Period</th>
                                    <th class="py-3 px-4">Due Date</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Total</th>
                                    <th class="py-3 px-4 text-right">Outstanding</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="invoices-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="8" class="py-8 text-center text-slate-400">Loading invoices...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- View / Print Invoice Modal -->
            <div id="view-invoice-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6 no-print border-b pb-4">
                        <div class="flex items-center gap-2">
                            <button onclick="window.print()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5">
                                <i data-lucide="printer" class="w-4 h-4"></i> Print Tax Invoice
                            </button>
                            <span id="invoice-modal-status-badge"></span>
                        </div>
                        <button onclick="document.getElementById('view-invoice-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div id="printable-invoice-content"></div>
                </div>
            </div>

            <!-- Quick Payment Modal -->
            <div id="quick-payment-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Record Payment</h3>
                        <button onclick="document.getElementById('quick-payment-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="quick-payment-form" class="space-y-4">
                        <input type="hidden" id="pay-invoice-id">
                        <div class="bg-slate-50 p-3 rounded border text-sm">
                            <p class="text-xs text-slate-500 uppercase font-semibold">Invoice</p>
                            <p class="font-bold text-slate-900" id="pay-invoice-number"></p>
                            <p class="text-xs text-slate-500 uppercase font-semibold mt-2">Remaining Outstanding Balance</p>
                            <p class="text-lg font-extrabold text-amber-600" id="pay-invoice-outstanding"></p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Amount ($) *</label>
                            <input type="number" step="0.01" id="pay-amount" required class="w-full px-3 py-2 border rounded-lg text-sm font-bold">
                            <p class="text-xs text-slate-400 mt-1">Supports partial payments or full settlement.</p>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Method *</label>
                            <select id="pay-method" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                <option value="BANK_TRANSFER">Bank Transfer / Wire</option>
                                <option value="CREDIT_CARD">Credit Card</option>
                                <option value="ONLINE">Online Portal</option>
                                <option value="CHEQUE">Corporate Cheque</option>
                                <option value="CASH">Cash</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Transaction Reference</label>
                            <input type="text" id="pay-ref" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. WIRE-89102, CC-AUTH-4412">
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes</label>
                            <textarea id="pay-notes" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Internal remittance notes..."></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('quick-payment-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium">Confirm Payment</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('invoice-filter-status').addEventListener('change', (e) => {
            this.loadInvoices(e.target.value);
        });

        document.getElementById('btn-run-billing').addEventListener('click', async () => {
            if (!confirm('Run automated recurring billing now for all active subscriptions due today? (Idempotent duplicate prevention is enforced).')) return;
            try {
                const res = await API.runRecurringBilling();
                alert(`Recurring billing complete! Invoices generated: ${res.invoices_generated}`);
                await this.loadInvoices();
            } catch (err) {
                alert('Error running recurring billing: ' + err.message);
            }
        });

        document.getElementById('quick-payment-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    invoice_id: parseInt(document.getElementById('pay-invoice-id').value, 10),
                    amount: parseFloat(document.getElementById('pay-amount').value),
                    payment_method: document.getElementById('pay-method').value,
                    transaction_reference: document.getElementById('pay-ref').value,
                    notes: document.getElementById('pay-notes').value
                };
                await API.recordPayment(payload);
                document.getElementById('quick-payment-modal').classList.add('hidden');
                document.getElementById('quick-payment-form').reset();
                alert('Payment recorded successfully!');
                await this.loadInvoices();
            } catch (err) {
                alert('Payment error: ' + err.message);
            }
        });

        await this.loadInvoices();
    },

    async loadInvoices(statusFilter = null) {
        try {
            const data = await API.getInvoices(statusFilter);
            const invoices = data.invoices || [];
            const tbody = document.getElementById('invoices-table-tbody');

            if (!invoices.length) {
                tbody.innerHTML = '<tr><td colspan="8" class="py-8 text-center text-slate-400">No invoices found.</td></tr>';
                return;
            }

            const today = new Date().toISOString().split('T')[0];

            tbody.innerHTML = invoices.map(i => {
                const isOverdue = i.due_date < today && i.outstanding_balance > 0 && i.status !== 'CANCELLED';
                const statusBadge = isOverdue 
                    ? '<span class="badge badge-overdue">OVERDUE</span>' 
                    : `<span class="badge badge-${i.status.toLowerCase()}">${i.status}</span>`;

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="py-3 px-4 font-bold text-indigo-600">${i.invoice_number}</td>
                        <td class="py-3 px-4 font-semibold text-slate-900">${i.company_name}</td>
                        <td class="py-3 px-4 text-xs text-slate-500">${i.period_start} &rarr; ${i.period_end}</td>
                        <td class="py-3 px-4 text-sm ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-600'}">${i.due_date}</td>
                        <td class="py-3 px-4">${statusBadge}</td>
                        <td class="py-3 px-4 text-right font-extrabold text-slate-900">$${i.total_amount.toFixed(2)}</td>
                        <td class="py-3 px-4 text-right font-bold ${i.outstanding_balance > 0 ? 'text-amber-600' : 'text-emerald-600'}">
                            $${i.outstanding_balance.toFixed(2)}
                        </td>
                        <td class="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                            <button onclick="InvoicesView.viewInvoice(${i.id})" class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
                                View
                            </button>
                            ${i.outstanding_balance > 0 && i.status !== 'CANCELLED' ? `
                                <button onclick="InvoicesView.openQuickPayment(${i.id}, '${i.invoice_number}', ${i.outstanding_balance})" class="text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                    Pay
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load invoices:', err);
        }
    },

    openQuickPayment(invoiceId, invoiceNumber, outstandingBalance) {
        document.getElementById('pay-invoice-id').value = invoiceId;
        document.getElementById('pay-invoice-number').innerText = invoiceNumber;
        document.getElementById('pay-invoice-outstanding').innerText = '$' + outstandingBalance.toFixed(2);
        document.getElementById('pay-amount').value = outstandingBalance.toFixed(2);
        document.getElementById('quick-payment-modal').classList.remove('hidden');
    },

    async viewInvoice(invoiceId) {
        try {
            const data = await API.getInvoice(invoiceId);
            const inv = data.invoice;
            const content = document.getElementById('printable-invoice-content');

            document.getElementById('invoice-modal-status-badge').innerHTML = `
                <span class="badge badge-${inv.status.toLowerCase()}">${inv.status}</span>
            `;

            content.innerHTML = `
                <div id="printable-document" class="space-y-6">
                    <!-- Brand Header -->
                    <div class="flex justify-between items-start border-b pb-6">
                        <div>
                            <div class="flex items-center gap-2">
                                <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">B</div>
                                <span class="text-xl font-bold text-slate-900">Brightloop Software</span>
                            </div>
                            <p class="text-xs text-slate-500 mt-1">Enterprise Subscription Billing & Cloud Solutions</p>
                            <p class="text-xs text-slate-400">Tax ID: US-EIN-9482104 | billing@brightloopsoftware.com</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-2xl font-black text-indigo-700">TAX INVOICE</h2>
                            <p class="text-sm font-semibold text-slate-800 mt-1">${inv.invoice_number}</p>
                            <p class="text-xs text-slate-500">Invoice Date: ${inv.invoice_date}</p>
                            <p class="text-xs font-semibold ${inv.outstanding_balance > 0 ? 'text-rose-600' : 'text-emerald-600'}">Payment Due: ${inv.due_date}</p>
                        </div>
                    </div>

                    <!-- Customer & Period Info -->
                    <div class="grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <p class="text-xs font-bold uppercase text-slate-400">Billed To:</p>
                            <p class="font-bold text-slate-800 text-base mt-1">${inv.company_name}</p>
                            <p class="text-slate-600">Attn: ${inv.contact_name || 'Accounts Payable'}</p>
                            <p class="text-slate-600">${inv.customer_email}</p>
                            <p class="text-slate-600">${inv.address || ''} ${inv.city ? ', ' + inv.city : ''} ${inv.country || ''}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-bold uppercase text-slate-400">Subscription & Service Period:</p>
                            <p class="font-bold text-slate-800 mt-1">${inv.subscription_number || 'Direct Contract'}</p>
                            <p class="text-slate-600 text-xs">Coverage: <strong>${inv.period_start}</strong> to <strong>${inv.period_end}</strong></p>
                        </div>
                    </div>

                    <!-- Items Table -->
                    <table class="w-full text-left text-sm border-t border-b">
                        <thead class="text-xs uppercase bg-slate-50 text-slate-500">
                            <tr>
                                <th class="py-3 px-3">Description</th>
                                <th class="py-3 px-3 text-center">Qty</th>
                                <th class="py-3 px-3 text-right">Unit Price</th>
                                <th class="py-3 px-3 text-right">Tax Rate</th>
                                <th class="py-3 px-3 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(inv.lines || []).map(l => `
                                <tr>
                                    <td class="py-3 px-3 font-medium text-slate-800">${l.description}</td>
                                    <td class="py-3 px-3 text-center">${l.quantity}</td>
                                    <td class="py-3 px-3 text-right">$${l.unit_price.toFixed(2)}</td>
                                    <td class="py-3 px-3 text-right">${l.tax_rate}%</td>
                                    <td class="py-3 px-3 text-right font-bold text-slate-900">$${l.line_total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <!-- Financial Summary & Balance -->
                    <div class="flex justify-end">
                        <div class="w-72 space-y-2 text-sm">
                            <div class="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span>$${inv.subtotal.toFixed(2)}</span>
                            </div>
                            ${inv.discount_amount > 0 ? `
                                <div class="flex justify-between text-emerald-600 font-medium">
                                    <span>Applied Discount ${inv.discount_code ? '(' + inv.discount_code + ')' : ''}:</span>
                                    <span>-$${inv.discount_amount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            <div class="flex justify-between text-slate-600">
                                <span>Sales Tax (${inv.tax_rate}%):</span>
                                <span>$${inv.tax_amount.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-base font-extrabold text-slate-900 border-t pt-2">
                                <span>Total Amount:</span>
                                <span>$${inv.total_amount.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-slate-600">
                                <span>Total Paid:</span>
                                <span class="text-emerald-600 font-bold">-$${inv.amount_paid.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-base font-extrabold border-t pt-2 ${inv.outstanding_balance > 0 ? 'text-amber-600' : 'text-emerald-700'}">
                                <span>Outstanding Balance:</span>
                                <span>$${inv.outstanding_balance.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Ledger History -->
                    ${(inv.payments && inv.payments.length) ? `
                        <div class="border rounded-lg overflow-hidden mt-6">
                            <div class="bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-600">Payment Ledger History</div>
                            <table class="w-full text-left text-xs">
                                <thead class="text-slate-400 border-b">
                                    <tr>
                                        <th class="py-1.5 px-3">Payment #</th>
                                        <th class="py-1.5 px-3">Date</th>
                                        <th class="py-1.5 px-3">Method</th>
                                        <th class="py-1.5 px-3">Reference</th>
                                        <th class="py-1.5 px-3 text-right">Amount Settled</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-100">
                                    ${inv.payments.map(p => `
                                        <tr>
                                            <td class="py-2 px-3 font-semibold text-emerald-600">${p.payment_number}</td>
                                            <td class="py-2 px-3 text-slate-600">${p.payment_date}</td>
                                            <td class="py-2 px-3 text-slate-700">${p.payment_method}</td>
                                            <td class="py-2 px-3 text-slate-500">${p.transaction_reference || 'N/A'}</td>
                                            <td class="py-2 px-3 text-right font-bold text-emerald-600">+$${p.amount.toFixed(2)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('view-invoice-modal').classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            alert('Failed to load invoice: ' + err.message);
        }
    }
};
