// Customers View Component
const CustomersView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Customer Directory</h1>
                        <p class="text-sm text-slate-500">Corporate and retail client accounts, contacts, and financial ledger summaries.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-customer" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="user-plus" class="w-4 h-4"></i> Add Customer
                        </button>
                    </div>
                </div>

                <!-- Customers Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Customer #</th>
                                    <th class="py-3 px-4">Company Name</th>
                                    <th class="py-3 px-4">Contact</th>
                                    <th class="py-3 px-4">Email</th>
                                    <th class="py-3 px-4">Phone</th>
                                    <th class="py-3 px-4 text-center">Active Subs</th>
                                    <th class="py-3 px-4 text-right">Outstanding</th>
                                </tr>
                            </thead>
                            <tbody id="customers-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="7" class="py-8 text-center text-slate-400">Loading customers...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
<!-- Customer Details Modal -->
<div id="customer-details-modal"
     class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
    <div class="bg-white rounded-xl max-w-lg w-full mx-4 p-6 shadow-xl border border-slate-200">
        <div class="flex justify-between items-center mb-5 border-b pb-3">
            <h3 class="text-lg font-bold text-slate-900">Customer Details</h3>
            <button onclick="document.getElementById('customer-details-modal').classList.add('hidden')"
                    class="text-slate-400 hover:text-slate-600">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
        </div>

        <div id="customer-details-content" class="space-y-3"></div>

        <div class="flex justify-end pt-4 border-t mt-5">
            <button onclick="document.getElementById('customer-details-modal').classList.add('hidden')"
                    class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
                Close
            </button>
        </div>
    </div>
</div>
            <!-- Add Customer Modal -->
            <div id="add-customer-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Add Customer Account</h3>
                        <button onclick="document.getElementById('add-customer-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-customer-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Company / Organization *</label>
                            <input type="text" id="cust-company" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Apex Ventures Inc">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Contact Name *</label>
                                <input type="text" id="cust-contact" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Sarah Jenkins">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Billing Email *</label>
                                <input type="email" id="cust-email" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="sarah@apexventures.com">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Phone</label>
                                <input type="text" id="cust-phone" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="+1 (555) 234-5678">
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">City</label>
                                <input type="text" id="cust-city" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Springfield">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Address</label>
                            <input type="text" id="cust-address" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Street address...">
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-customer-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Customer</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-open-add-customer').addEventListener('click', () => {
            document.getElementById('add-customer-modal').classList.remove('hidden');
        });

        document.getElementById('add-customer-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    company_name: document.getElementById('cust-company').value,
                    contact_name: document.getElementById('cust-contact').value,
                    email: document.getElementById('cust-email').value,
                    phone: document.getElementById('cust-phone').value,
                    city: document.getElementById('cust-city').value,
                    address: document.getElementById('cust-address').value
                };
                await API.createCustomer(payload);
                document.getElementById('add-customer-modal').classList.add('hidden');
                document.getElementById('add-customer-form').reset();
                await this.loadCustomers();
            } catch (err) {
                alert('Error creating customer: ' + err.message);
            }
        });

        await this.loadCustomers();
    },

    async loadCustomers() {
        try {
            const data = await API.getCustomers();
            const customers = data.customers || [];
            const tbody = document.getElementById('customers-table-tbody');

            if (!customers.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">No customers registered yet.</td></tr>';
                return;
            }

            tbody.innerHTML = customers.map(c => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4">
    <button onclick="CustomersView.showCustomerDetails(${c.id})"
            class="font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer">
        ${c.customer_number}
    </button>
</td>
                    <td class="py-3 px-4 font-semibold text-slate-900">${c.company_name}</td>
                    <td class="py-3 px-4 text-slate-700">${c.contact_name}</td>
                    <td class="py-3 px-4 text-slate-500 font-mono text-xs">${c.email}</td>
                    <td class="py-3 px-4 text-slate-500 text-xs">${c.phone || 'N/A'}</td>
                    <td class="py-3 px-4 text-center">
                        <span class="px-2 py-0.5 text-xs font-bold rounded-full ${c.active_subscriptions_count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}">
                            ${c.active_subscriptions_count || 0}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-right font-bold ${c.total_outstanding > 0 ? 'text-amber-600' : 'text-slate-400'}">
                        $${(c.total_outstanding || 0).toFixed(2)}
                    </td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load customers:', err);
        }
},

    async showCustomerDetails(customerId) {
        try {
            const data = await API.getCustomers();
            const customer = (data.customers || []).find(c => c.id === customerId);

            if (!customer) {
                alert('Customer details not found.');
                return;
            }

            const safe = value => String(value ?? 'N/A').replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]);

            document.getElementById('customer-details-content').innerHTML = `
                <div class="bg-indigo-50 rounded-lg p-4">
                    <p class="text-xs text-indigo-600 font-bold uppercase">Customer Number</p>
                    <p class="text-xl font-bold text-indigo-800">${safe(customer.customer_number)}</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div><p class="text-xs text-slate-500">Company</p><p>${safe(customer.company_name)}</p></div>
                    <div><p class="text-xs text-slate-500">Contact</p><p>${safe(customer.contact_name)}</p></div>
                    <div><p class="text-xs text-slate-500">Email</p><p class="break-all">${safe(customer.email)}</p></div>
                    <div><p class="text-xs text-slate-500">Phone</p><p>${safe(customer.phone)}</p></div>
                    <div><p class="text-xs text-slate-500">City</p><p>${safe(customer.city)}</p></div>
                    <div><p class="text-xs text-slate-500">Address</p><p>${safe(customer.address)}</p></div>
                </div>

                <div class="grid grid-cols-2 gap-4 border-t pt-4">
                    <div>
                        <p class="text-xs text-slate-500">Active Subscriptions</p>
                        <p class="font-bold text-emerald-600">${Number(customer.active_subscriptions_count || 0)}</p>
                    </div>
                    <div>
                        <p class="text-xs text-slate-500">Outstanding Balance</p>
                        <p class="font-bold text-amber-600">$${Number(customer.total_outstanding || 0).toFixed(2)}</p>
                    </div>
                </div>
            `;

            document.getElementById('customer-details-modal').classList.remove('hidden');

            if (window.lucide) window.lucide.createIcons();

        } catch (err) {
            alert('Unable to load customer details: ' + err.message);
        }
    }
};
