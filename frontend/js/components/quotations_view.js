// Quotations & Templates View Component
const QuotationsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Quotations & Proposals</h1>
                        <p class="text-sm text-slate-500">Draft customized sales quotes, leverage templates, and convert confirmed deals into active subscriptions.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-create-quote" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="file-plus" class="w-4 h-4"></i> New Quotation
                        </button>
                    </div>
                </div>

                <!-- Quotations Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Quote #</th>
                                    <th class="py-3 px-4">Customer</th>
                                    <th class="py-3 px-4">Plan & Cadence</th>
                                    <th class="py-3 px-4">Valid Until</th>
                                    <th class="py-3 px-4">Status</th>
                                    <th class="py-3 px-4 text-right">Total Amount</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="quotes-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="7" class="py-8 text-center text-slate-400">Loading quotations...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Create Quotation Modal -->
            <div id="create-quote-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Create New Quotation</h3>
                        <button onclick="document.getElementById('create-quote-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="create-quote-form" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Customer *</label>
                                <select id="quote-customer-id" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Plan *</label>
                                <select id="quote-plan-id" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white"></select>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Validity (Days) *</label>
                                <input type="number" id="quote-validity" value="30" min="1" required class="w-full px-3 py-2 border rounded-lg text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Payment Terms</label>
                                <select id="quote-payment-terms" class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="Net 30">Net 30</option>
                                    <option value="Net 15">Net 15</option>
                                    <option value="Immediate">Immediate / Due on Receipt</option>
                                    <option value="Net 60">Net 60</option>
                                </select>
                            </div>
                        </div>

                        <!-- Product Line Items -->
                        <div class="border rounded-lg p-4 bg-slate-50 space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold uppercase text-slate-600">Quotation Line Items</span>
                                <button type="button" id="btn-add-quote-line" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                                    + Add Item
                                </button>
                            </div>
                            <div id="quote-lines-container" class="space-y-2"></div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Proposal Notes</label>
                            <textarea id="quote-notes" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Terms, discounts, or delivery notes..."></textarea>
                        </div>

                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('create-quote-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Generate Quotation</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- View / Print Quotation Modal -->
            <div id="view-quote-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-3xl w-full p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6 no-print border-b pb-4">
                        <div class="flex items-center gap-2">
                            <button onclick="window.print()" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-1.5">
                                <i data-lucide="printer" class="w-4 h-4"></i> Print Proposal
                            </button>
                            <span id="quote-modal-status-badge"></span>
                        </div>
                        <button onclick="document.getElementById('view-quote-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div id="printable-quote-content"></div>
                </div>
            </div>
        `;

        document.getElementById('btn-open-create-quote').addEventListener('click', async () => {
            await this.populateDropdowns();
            document.getElementById('create-quote-modal').classList.remove('hidden');
        });

        document.getElementById('btn-add-quote-line').addEventListener('click', () => {
            this.addQuoteLineRow();
        });

        document.getElementById('create-quote-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const lineRows = document.querySelectorAll('.quote-line-row');
                const lines = [];
                lineRows.forEach(row => {
                    const prodSelect = row.querySelector('.line-product-id');
                    const variantSelect = row.querySelector('.line-variant-id');
                    const qtyInput = row.querySelector('.line-qty');
                    if (prodSelect && prodSelect.value) {
                        lines.push({
                            product_id: parseInt(prodSelect.value, 10),
                            product_variant_id: variantSelect.value ? parseInt(variantSelect.value, 10) : null,
                            quantity: parseInt(qtyInput.value, 10) || 1,
                            tax_rate: 10.0
                        });
                    }
                });

                if (!lines.length) {
                    alert('Please add at least one product line item.');
                    return;
                }

                const payload = {
                    customer_id: parseInt(document.getElementById('quote-customer-id').value, 10),
                    plan_id: parseInt(document.getElementById('quote-plan-id').value, 10),
                    validity_days: parseInt(document.getElementById('quote-validity').value, 10),
                    payment_terms: document.getElementById('quote-payment-terms').value,
                    notes: document.getElementById('quote-notes').value,
                    lines: lines
                };

                await API.createQuotation(payload);
                document.getElementById('create-quote-modal').classList.add('hidden');
                document.getElementById('create-quote-form').reset();
                await this.loadQuotations();
            } catch (err) {
                alert('Error creating quotation: ' + err.message);
            }
        });

        await this.loadQuotations();
    },

    async populateDropdowns() {
        const [custData, planData, prodData] = await Promise.all([
            API.getCustomers(),
            API.getPlans(),
            API.getProducts()
        ]);

        const custSelect = document.getElementById('quote-customer-id');
        custSelect.innerHTML = (custData.customers || []).map(c => `
            <option value="${c.id}">${c.company_name} (${c.customer_number})</option>
        `).join('');

        const planSelect = document.getElementById('quote-plan-id');
        planSelect.innerHTML = (planData.plans || []).map(p => `
            <option value="${p.id}">${p.name} ($${p.price.toFixed(2)} / ${p.billing_period})</option>
        `).join('');

        window._cachedProducts = prodData.products || [];
        const linesContainer = document.getElementById('quote-lines-container');
        linesContainer.innerHTML = '';
        this.addQuoteLineRow();
    },

    addQuoteLineRow() {
        const container = document.getElementById('quote-lines-container');
        const row = document.createElement('div');
        row.className = 'quote-line-row flex items-center gap-2 bg-white p-2.5 rounded border border-slate-200';

        const products = window._cachedProducts || [];
        const productOptions = products.map(p => `<option value="${p.id}">${p.name} ($${p.sales_price.toFixed(2)})</option>`).join('');

        row.innerHTML = `
            <select class="line-product-id flex-1 px-2.5 py-1.5 border rounded text-xs bg-white">
                <option value="">-- Select Product --</option>
                ${productOptions}
            </select>
            <select class="line-variant-id flex-1 px-2.5 py-1.5 border rounded text-xs bg-white">
                <option value="">-- Base (No Variant) --</option>
            </select>
            <input type="number" class="line-qty w-16 px-2.5 py-1.5 border rounded text-xs text-center" value="1" min="1" placeholder="Qty">
            <button type="button" class="text-rose-500 hover:text-rose-700 px-1" onclick="this.parentElement.remove()">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        `;

        const prodSelect = row.querySelector('.line-product-id');
        const varSelect = row.querySelector('.line-variant-id');

        prodSelect.addEventListener('change', () => {
            const pId = parseInt(prodSelect.value, 10);
            const p = products.find(x => x.id === pId);
            if (p && p.variants && p.variants.length) {
                varSelect.innerHTML = '<option value="">-- Base (No Variant) --</option>' + p.variants.map(v => `
                    <option value="${v.id}">${v.variant_name}: ${v.variant_value} (+${v.price_adjustment > 0 ? '$' + v.price_adjustment.toFixed(2) : '$0'})</option>
                `).join('');
            } else {
                varSelect.innerHTML = '<option value="">-- No Variants --</option>';
            }
        });

        container.appendChild(row);
        if (window.lucide) window.lucide.createIcons();
    },

    async loadQuotations() {
        try {
            const data = await API.getQuotations();
            const quotes = data.quotations || [];
            const tbody = document.getElementById('quotes-table-tbody');

            if (!quotes.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No quotations generated yet.</td></tr>';
                return;
            }

            tbody.innerHTML = quotes.map(q => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-bold text-indigo-600">${q.quotation_number}</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">${q.company_name}</td>
                    <td class="py-3 px-4 text-slate-600">${q.plan_name} <span class="text-xs text-slate-400">(${q.billing_period})</span></td>
                    <td class="py-3 px-4 text-slate-500">${q.valid_until}</td>
                    <td class="py-3 px-4"><span class="badge badge-${q.status.toLowerCase()}">${q.status}</span></td>
                    <td class="py-3 px-4 text-right font-extrabold text-slate-900">$${q.total_amount.toFixed(2)}</td>
                    <td class="py-3 px-4 text-right space-x-2">
                        <button onclick="QuotationsView.viewQuote(${q.id})" class="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition">
                            View
                        </button>
                        ${q.status !== 'CONVERTED' ? `
                            <button onclick="QuotationsView.convertToSubscription(${q.id})" class="text-xs font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition">
                                Convert to Sub
                            </button>
                        ` : '<span class="text-xs text-emerald-600 font-bold">Sub Active</span>'}
                    </td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load quotations:', err);
        }
    },

    async viewQuote(quoteId) {
        try {
            const data = await API.getQuotation(quoteId);
            const q = data.quotation;
            const content = document.getElementById('printable-quote-content');

            document.getElementById('quote-modal-status-badge').innerHTML = `
                <span class="badge badge-${q.status.toLowerCase()}">${q.status}</span>
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
                            <p class="text-xs text-slate-500 mt-1">Enterprise Cloud & Subscription Infrastructure</p>
                            <p class="text-xs text-slate-400">billing@brightloopsoftware.com</p>
                        </div>
                        <div class="text-right">
                            <h2 class="text-2xl font-black text-indigo-700">COMMERCIAL PROPOSAL</h2>
                            <p class="text-sm font-semibold text-slate-800 mt-1">${q.quotation_number}</p>
                            <p class="text-xs text-slate-500">Date: ${q.quotation_date}</p>
                            <p class="text-xs text-amber-600 font-medium">Valid Until: ${q.valid_until}</p>
                        </div>
                    </div>

                    <!-- Customer & Plan Details -->
                    <div class="grid grid-cols-2 gap-8 text-sm">
                        <div>
                            <p class="text-xs font-bold uppercase text-slate-400">Proposed For:</p>
                            <p class="font-bold text-slate-800 text-base mt-1">${q.company_name}</p>
                            <p class="text-slate-600">Attn: ${q.contact_name || 'Accounts Representative'}</p>
                            <p class="text-slate-600">${q.customer_email}</p>
                            <p class="text-slate-600">${q.address || ''}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs font-bold uppercase text-slate-400">Plan & Terms:</p>
                            <p class="font-bold text-slate-800 mt-1">${q.plan_name}</p>
                            <p class="text-slate-600">Billing Cadence: ${q.billing_period}</p>
                            <p class="text-slate-600">Payment Terms: ${q.payment_terms || 'Net 30'}</p>
                        </div>
                    </div>

                    <!-- Line Items Table -->
                    <table class="w-full text-left text-sm border-t border-b">
                        <thead class="text-xs uppercase bg-slate-50 text-slate-500">
                            <tr>
                                <th class="py-3 px-3">Description</th>
                                <th class="py-3 px-3 text-center">Qty</th>
                                <th class="py-3 px-3 text-right">Agreed Unit Price</th>
                                <th class="py-3 px-3 text-right">Tax Rate</th>
                                <th class="py-3 px-3 text-right">Line Total</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(q.lines || []).map(l => `
                                <tr>
                                    <td class="py-3 px-3 font-medium text-slate-800">
                                        ${l.product_name}
                                        ${l.variant_value ? `<div class="text-xs text-indigo-600 font-semibold">${l.variant_name}: ${l.variant_value}</div>` : ''}
                                    </td>
                                    <td class="py-3 px-3 text-center">${l.quantity}</td>
                                    <td class="py-3 px-3 text-right">$${l.unit_price.toFixed(2)}</td>
                                    <td class="py-3 px-3 text-right">${l.tax_rate}%</td>
                                    <td class="py-3 px-3 text-right font-bold text-slate-900">$${l.line_total.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <!-- Totals Summary -->
                    <div class="flex justify-end">
                        <div class="w-64 space-y-2 text-sm">
                            <div class="flex justify-between text-slate-600">
                                <span>Subtotal:</span>
                                <span>$${q.subtotal.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-slate-600">
                                <span>Estimated Tax:</span>
                                <span>$${q.tax_amount.toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-base font-extrabold text-slate-900 border-t pt-2">
                                <span>Total Payable:</span>
                                <span class="text-indigo-700">$${q.total_amount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    ${q.notes ? `<div class="text-xs text-slate-500 bg-slate-50 p-3 rounded border"><strong>Notes:</strong> ${q.notes}</div>` : ''}
                </div>
            `;

            document.getElementById('view-quote-modal').classList.remove('hidden');
            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            alert('Failed to view quotation: ' + err.message);
        }
    },

    async convertToSubscription(quoteId) {
        if (!confirm('Convert this confirmed quotation into an active subscription?')) return;
        try {
            const res = await API.convertQuotationToSubscription(quoteId);
            alert('Quotation converted! New Subscription created: ' + res.subscription.subscription_number);
            await this.loadQuotations();
        } catch (err) {
            alert('Failed to convert quotation: ' + err.message);
        }
    }
};
