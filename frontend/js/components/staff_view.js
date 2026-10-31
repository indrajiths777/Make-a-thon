// Staff Management View Component (Admin Only)
const StaffView = {
    async render(container) {
        container.innerHTML = `
            <div class="space-y-6">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800">Internal Staff Administration</h1>
                        <p class="text-sm text-slate-500">Only System Administrators can provision, audit, or manage staff user accounts.</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="btn-open-add-staff" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium shadow-sm transition">
                            <i data-lucide="shield-plus" class="w-4 h-4"></i> Provision Staff User
                        </button>
                    </div>
                </div>

                <!-- Staff Table -->
                <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                <tr>
                                    <th class="py-3 px-4">User ID</th>
                                    <th class="py-3 px-4">Full Name</th>
                                    <th class="py-3 px-4">Work Email</th>
                                    <th class="py-3 px-4">Role</th>
                                    <th class="py-3 px-4">Account Status</th>
                                    <th class="py-3 px-4">Created Date</th>
                                </tr>
                            </thead>
                            <tbody id="staff-table-tbody" class="divide-y divide-slate-100">
                                <tr><td colspan="6" class="py-8 text-center text-slate-400">Loading staff...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Provision Staff Modal -->
            <div id="add-staff-modal" class="fixed inset-0 z-50 flex items-center justify-center hidden modal-overlay">
                <div class="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200">
                    <div class="flex justify-between items-center mb-4 border-b pb-3">
                        <h3 class="text-lg font-bold text-slate-900">Provision Staff Account</h3>
                        <button onclick="document.getElementById('add-staff-modal').classList.add('hidden')" class="text-slate-400 hover:text-slate-600">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <form id="add-staff-form" class="space-y-4">
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Full Name *</label>
                            <input type="text" id="staff-name" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="e.g. Elena Rostova">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Work Email *</label>
                            <input type="email" id="staff-email" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="elena@brightloop.com">
                        </div>
                        <div>
                            <label class="block text-xs font-semibold uppercase text-slate-600 mb-1">Temporary Password *</label>
                            <input type="password" id="staff-password" required class="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Must meet complexity rules">
                            <p class="text-xs text-slate-400 mt-1">Min 8 chars, uppercase, lowercase, special character.</p>
                        </div>
                        <div class="flex justify-end gap-2 pt-3 border-t">
                            <button type="button" onclick="document.getElementById('add-staff-modal').classList.add('hidden')" class="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">Cancel</button>
                            <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium">Create Staff Account</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('btn-open-add-staff').addEventListener('click', () => {
            document.getElementById('add-staff-modal').classList.remove('hidden');
        });

        document.getElementById('add-staff-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const payload = {
                    full_name: document.getElementById('staff-name').value,
                    email: document.getElementById('staff-email').value,
                    password: document.getElementById('staff-password').value
                };
                await API.createStaff(payload);
                document.getElementById('add-staff-modal').classList.add('hidden');
                document.getElementById('add-staff-form').reset();
                alert('Staff account successfully created!');
                await this.loadStaff();
            } catch (err) {
                alert('Error creating staff account: ' + err.message);
            }
        });

        await this.loadStaff();
    },

    async loadStaff() {
        try {
            const data = await API.getStaffList();
            const staffList = data.staff || [];
            const tbody = document.getElementById('staff-table-tbody');

            tbody.innerHTML = staffList.map(s => `
                <tr class="hover:bg-slate-50 transition">
                    <td class="py-3 px-4 font-mono font-bold text-slate-500">#${s.id}</td>
                    <td class="py-3 px-4 font-bold text-slate-900">${s.full_name}</td>
                    <td class="py-3 px-4 text-slate-600 font-mono text-xs">${s.email}</td>
                    <td class="py-3 px-4"><span class="badge badge-active">${s.role}</span></td>
                    <td class="py-3 px-4"><span class="badge badge-confirmed">ACTIVE</span></td>
                    <td class="py-3 px-4 text-slate-500 text-xs">${s.created_at}</td>
                </tr>
            `).join('');

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Failed to load staff list:', err);
        }
    }
};
