// Centralized API Client for Brightloop Software Subscription Management
const API = {
    baseUrl: (typeof window !== 'undefined' && window.location.protocol === 'file:') ? 'http://127.0.0.1:5000/api/v1' : '/api/v1',

    getToken() {
        return localStorage.getItem('brightloop_token');
    },

    setToken(token) {
        if (token) {
            localStorage.setItem('brightloop_token', token);
        } else {
            localStorage.removeItem('brightloop_token');
        }
    },

    getUser() {
        const u = localStorage.getItem('brightloop_user');
        return u ? JSON.parse(u) : null;
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('brightloop_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('brightloop_user');
        }
    },

    logout() {
        this.setToken(null);
        this.setUser(null);
        window.location.reload();
    },

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = options.headers || {};
        headers['Content-Type'] = 'application/json';

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const res = await fetch(url, config);
            if (res.status === 401) {
                // If unauthorized, clear token and notify
                this.setToken(null);
                this.setUser(null);
                if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
                    window.location.reload();
                }
            }
            const data = await res.json();
            if (!res.ok) {
                const errorMsg = data.detail || (typeof data === 'string' ? data : 'An error occurred.');
                throw new Error(errorMsg);
            }
            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // Auth
    login: (credentials) => API.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    register: (userData) => API.request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
    getProfile: () => API.request('/auth/me'),
    requestPasswordReset: (email) => API.request('/auth/request-password-reset', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) => API.request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
    createStaff: (payload) => API.request('/auth/create-staff', { method: 'POST', body: JSON.stringify(payload) }),
    getStaffList: () => API.request('/auth/staff'),

    // Dashboard
    getDashboardMetrics: () => API.request('/dashboard/metrics'),
    getOverdueInvoices: () => API.request('/dashboard/overdue'),

    // Products
    getProducts: (includeInactive = false) => API.request(`/products?include_inactive=${includeInactive}`),
    getProduct: (id) => API.request(`/products/${id}`),
    createProduct: (data) => API.request('/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => API.request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteProduct: (id) => API.request(`/products/${id}`, { method: 'DELETE' }),
    addProductVariant: (productId, data) => API.request(`/products/${productId}/variants`, { method: 'POST', body: JSON.stringify(data) }),

    // Plans
    getPlans: (includeInactive = false) => API.request(`/plans?include_inactive=${includeInactive}`),
    getPlan: (id) => API.request(`/plans/${id}`),
    createPlan: (data) => API.request('/plans', { method: 'POST', body: JSON.stringify(data) }),
    updatePlan: (id, data) => API.request(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePlan: (id) => API.request(`/plans/${id}`, { method: 'DELETE' }),

    // Quotation Templates & Quotes
    getQuotationTemplates: () => API.request('/quotation-templates'),
    createQuotationTemplate: (data) => API.request('/quotation-templates', { method: 'POST', body: JSON.stringify(data) }),
    getQuotations: () => API.request('/quotations'),
    getQuotation: (id) => API.request(`/quotations/${id}`),
    createQuotation: (data) => API.request('/quotations', { method: 'POST', body: JSON.stringify(data) }),
    convertQuotationToSubscription: (id) => API.request(`/quotations/${id}/convert`, { method: 'POST' }),

    // Subscriptions
    getSubscriptions: (status = null) => API.request(`/subscriptions${status ? '?status_filter=' + status : ''}`),
    getSubscription: (id) => API.request(`/subscriptions/${id}`),
    createSubscription: (data) => API.request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
    updateSubscriptionStatus: (id, status) => API.request(`/subscriptions/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    pauseSubscription: (id) => API.request(`/subscriptions/${id}/pause`, { method: 'POST' }),
    resumeSubscription: (id) => API.request(`/subscriptions/${id}/resume`, { method: 'POST' }),
    closeSubscription: (id) => API.request(`/subscriptions/${id}/close`, { method: 'POST' }),
    renewSubscription: (id, extensionMonths = 12) => API.request(`/subscriptions/${id}/renew?extension_months=${extensionMonths}`, { method: 'POST' }),

    // Invoices
    getInvoices: (status = null) => API.request(`/invoices${status ? '?status_filter=' + status : ''}`),
    getInvoice: (id) => API.request(`/invoices/${id}`),
    generateInvoiceForSubscription: (subId) => API.request(`/invoices/generate/${subId}`, { method: 'POST' }),
    runRecurringBilling: (executionDate = null) => API.request('/invoices/run-billing', { method: 'POST', body: JSON.stringify({ execution_date: executionDate }) }),
    confirmInvoice: (id) => API.request(`/invoices/${id}/confirm`, { method: 'POST' }),
    cancelInvoice: (id) => API.request(`/invoices/${id}/cancel`, { method: 'POST' }),

    // Payments
    getPayments: () => API.request('/payments'),
    recordPayment: (data) => API.request('/payments', { method: 'POST', body: JSON.stringify(data) }),

    // Discounts
    getDiscounts: () => API.request('/discounts'),
    createDiscount: (data) => API.request('/discounts', { method: 'POST', body: JSON.stringify(data) }),
    updateDiscount: (id, data) => API.request(`/discounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteDiscount: (id) => API.request(`/discounts/${id}`, { method: 'DELETE' }),

    // Taxes
    getTaxes: () => API.request('/taxes'),
    createTax: (data) => API.request('/taxes', { method: 'POST', body: JSON.stringify(data) }),
    updateTax: (id, data) => API.request(`/taxes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

    // Customers
    getCustomers: () => API.request('/customers'),
    getCustomer: (id) => API.request(`/customers/${id}`),
    createCustomer: (data) => API.request('/customers', { method: 'POST', body: JSON.stringify(data) })
};
