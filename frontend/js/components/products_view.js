// Products & Variants View Component
const ProductsView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Products & Catalog Management</h1>
                        <p class="text-sm text-slate-500">Configure base SaaS products, modular add-ons, services, and tiered variants.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-product" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="plus" class="w-4 h-4"></i> Add Product
                        </button>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">Product Name</th>
                                    <th class="py-3 px-4">Type</th>
                                    <th class="py-3 px-4">Base Sales Price</th>
                                    <th class="py-3 px-4">Cost Price</th>
                                    <th class="py-3 px-4">Variants & Surcharges</th>
                                    <th class="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="products-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="6" class="py-8 text-center text-slate-400">Loading catalog...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Add Product Modal -->
            <div id="add-product-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Add New Product</h3>
                        <button onclick="document.getElementById('add-product-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-product-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Product Name *</label>
                            <input type="text" id="prod-name" required class="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="e.g. Brightloop ERP Core">
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Product Type *</label>
                                <select id="prod-type" required class="w-full px-3 py-2 border rounded-lg text-sm bg-white">
                                    <option value="SAAS">SaaS License</option>
                                    <option value="SERVICE">Service</option>
                                    <option value="ADDON">Add-on Module</option>
                                    <option value="PHYSICAL">Physical Goods</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Sales Price ($) *</label>
                                <input type="number" step="0.01" id="prod-sales-price" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="1200.00">
                            </div>
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Cost Price ($)</label>
                            <input type="number" step="0.01" id="prod-cost-price" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="400.00">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes / Description</label>
                            <textarea id="prod-notes" rows="2" class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Features, modules, or delivery SLA..."></textarea>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-product-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Create Product</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Add Variant Modal -->
            <div id="add-variant-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Add Product Variant</h3>
                        <button onclick="document.getElementById('add-variant-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-variant-form" class="space-y-4">
                        <input type="hidden" id="variant-product-id">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Variant Category *</label>
                            <input type="text" id="variant-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Brand, Tier, Region">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Variant Option *</label>
                            <input type="text" id="variant-value" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Odoo Enterprise">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Price Surcharge ($) *</label>
                            <input type="number" step="0.01" id="variant-adjustment" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. 560.00">
                            <p class="text-xs text-slate-400 mt-1">E.g. Choosing Odoo brand adds $560 to the base price.</p>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-variant-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Save Variant</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-open-add-product').addEventListener('click', () => {
            document.getElementById('add-product-modal').classList.remove('hidden');
        });

        document.getElementById('add-product-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    name: document.getElementById('prod-name').value,
                    product_type: document.getElementById('prod-type').value,
                    sales_price: parseFloat(document.getElementById('prod-sales-price').value),
                    cost_price: parseFloat(document.getElementById('prod-cost-price').value || 0),
                    notes: document.getElementById('prod-notes').value
                };
                await API.createProduct(payload);
                document.getElementById('add-product-modal').classList.add('hidden');
                document.getElementById('add-product-form').reset();
                await this.loadProducts();
            } catch (err) {
                alert('Error creating product: ' + err.message);
            }
        });

        document.getElementById('add-variant-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const prodId = document.getElementById('variant-product-id').value;
                const payload = {
                    variant_name: document.getElementById('variant-name').value,
                    variant_value: document.getElementById('variant-value').value,
                    price_adjustment: parseFloat(document.getElementById('variant-adjustment').value || 0)
                };
                await API.addProductVariant(prodId, payload);
                document.getElementById('add-variant-modal').classList.add('hidden');
                document.getElementById('add-variant-form').reset();
                await this.loadProducts();
            } catch (err) {
                alert('Error adding variant: ' + err.message);
            }
        });

        await this.loadProducts();
    },

    async loadProducts() {
        try {
            const data = await API.getProducts();
            const products = data.products || [];
            const tbody = document.getElementById('products-table-tbody');

            if (!products.length) {
                tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-slate-400">No products configured yet.</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(p => {
                const variantsHtml = (p.variants || []).map(v => `
                    <span class="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-medium mr-1.5 mb-1 ${v.variant_value.includes('Odoo') ? 'border border-indigo-300 bg-indigo-50 text-indigo-700' : ''}">
                        ${v.variant_name}: <strong>${v.variant_value}</strong>
                        <span class="text-emerald-600 font-bold ml-1">+${v.price_adjustment > 0 ? '$' + v.price_adjustment.toFixed(2) : '$0.00'}</span>
                    </span>
                `).join('') || '<span class="text-xs text-slate-400">No variants</span>';

                return `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="py-3 px-4 font-semibold text-slate-900">
                            ${p.name}
                            ${p.notes ? `<div class="text-xs text-slate-400 font-normal mt-0.5">${p.notes}</div>` : ''}
                        </td>
                        <td class="py-3 px-4">
                            <span class="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded">${p.product_type}</span>
                        </td>
                        <td class="py-3 px-4 font-bold text-slate-900">$${p.sales_price.toFixed(2)}</td>
                        <td class="py-3 px-4 text-slate-500">$${p.cost_price.toFixed(2)}</td>
                        <td class="py-3 px-4">${variantsHtml}</td>
                        <td class="py-3 px-4 text-right space-x-2">
                            <button onclick="ProductsView.openAddVariant(${p.id})" class="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 transition">
                                + Variant
                            </button>
                            <button onclick="ProductsView.deleteProduct(${p.id})" class="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100 transition">
                                Archive
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load products:', err);
        }
    },

    openAddVariant(productId) {
        document.getElementById('variant-product-id').value = productId;
        document.getElementById('add-variant-modal').classList.remove('hidden');
    },

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to archive this product?')) return;
        try {
            await API.deleteProduct(productId);
            await this.loadProducts();
        } catch (err) {
            alert('Failed to archive product: ' + err.message);
        }
    }
};
