   

const state = {
    user: null,
    dashboard: null,
    currentGroup: null,
    currentMembers: [],
    currentGroupBalances: null,
    currentGroupExpenses: null,
    currentGroupActivities: null,
    currentSuggestedSettlements: [],
    pendingInvites: [],
    activeGroupTab: 'expenses',
    expenseModalMode: 'create',
    editingExpenseId: null,
    currentExpenseReceiptUrls: [],
    expenseSplitMode: 'EQUAL',
    exactSplits: {}
};

window.state = state;

const ICONS = {
    eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
    eyeOff: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
    lock: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
    user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    trash: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    edit: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    arrowRight: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    activity: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
    download: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
    receipt: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="12" y2="14"/></svg>`,
    image: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    fileText: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    sun: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
    moon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`
};

window.ICONS = ICONS;

const API_BASE = '/api';

const api = {
    csrfToken: null,

    async request(endpoint, options = {}) {
        const method = (options.method || 'GET').toUpperCase();

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && !this.csrfToken) {
            const tokenResponse = await this.get('/auth/csrf');
            this.csrfToken = tokenResponse.csrf_token;
        }

        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        if (!(options.body instanceof FormData) && options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
        }

        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }

        const config = {
            ...options,
            method,
            headers,
            credentials: 'same-origin'
        };

        if (options.body instanceof FormData) {
            config.body = options.body;
        } else if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`, config);

            if (response.status === 419 && !options.csrfRetry) {
                this.csrfToken = null;
                return this.request(endpoint, { ...options, csrfRetry: true });
            }

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error = new Error(data.error || `Request failed with status ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            return data;
        } catch (error) {
            console.error(`API Error [${method} ${endpoint}]:`, error);
            throw error;
        }
    },

    get(endpoint, options = {}) {
        return this.request(endpoint, { method: 'GET', ...options });
    },

    post(endpoint, body, options = {}) {
        return this.request(endpoint, { method: 'POST', body, ...options });
    },

    put(endpoint, body, options = {}) {
        return this.request(endpoint, { method: 'PUT', body, ...options });
    },

    delete(endpoint, options = {}) {
        return this.request(endpoint, { method: 'DELETE', ...options });
    }
};

window.api = api;

function setupPasswordToggles(container = document) {
    const toggleBtns = container.querySelectorAll('.password-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const wrapper = btn.closest('.password-input-wrapper');
            if (!wrapper) return;
            const input = wrapper.querySelector('input');
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = window.ICONS?.eyeOff || 'Hide';
            } else {
                input.type = 'password';
                btn.innerHTML = window.ICONS?.eye || 'Show';
            }
        };
    });
}

function scrollToLandingSection(id, event) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    const targetHash = '#' + id;

    if (state.currentView !== 'landing' || !document.getElementById(id)) {
        state.currentView = 'landing';
        if (typeof renderLandingPageView === 'function') {
            renderLandingPageView();
        }
        setTimeout(() => {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
            try {
                history.pushState(null, '', targetHash);
            } catch (e) {}
        }, 80);
        return;
    }

    const el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        try {
            history.pushState(null, '', targetHash);
        } catch (e) {}
    }
}

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMoney(amount, showSign = false) {
    const num = parseFloat(amount) || 0;
    const formatted = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (showSign) {
        if (num > 0.005) return `+${formatted}`;
        if (num < -0.005) return `-${formatted}`;
        return formatted;
    }
    return (num < -0.005 ? `-${formatted}` : formatted);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function getTheme() {
    return "light";
}

function updateThemeToggleButton() {}

function setTheme() {
    document.documentElement.setAttribute('data-theme', 'light');
}

function toggleTheme() {
    setTheme("light");
}

function initTheme() {
    setTheme("light");
}

window.setupPasswordToggles = setupPasswordToggles;
window.scrollToLandingSection = scrollToLandingSection;
window.showToast = showToast;
window.escapeHtml = escapeHtml;
window.formatMoney = formatMoney;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.getTheme = getTheme;
window.setTheme = setTheme;
window.toggleTheme = toggleTheme;
window.initTheme = initTheme;
window.updateThemeToggleButton = updateThemeToggleButton;

async function handleHashRouting() {
    const hash = window.location.hash || '';

    if (hash.includes('invite_action=')) {
        if (typeof handleEmailInviteAction === 'function') {
            await handleEmailInviteAction(hash);
        }
        return;
    }

    if (hash.startsWith('#reset-password')) {
        const query = hash.split('?')[1] || '';
        const token = new URLSearchParams(query).get('token') || '';
        state.currentView = 'auth';
        renderAuthView('reset', token);
        return;
    }

    if (!state.user) {
        if (hash === '#signup') {
            state.currentView = 'auth';
            renderAuthView('signup');
        } else if (hash === '#forgot-password') {
            state.currentView = 'auth';
            renderAuthView('forgot');
        } else if (hash === '#login') {
            state.currentView = 'auth';
            renderAuthView('login');
        } else {
            const anchorId = hash.replace('#', '');
            const isAnchor = ['how-it-works', 'features', 'about', 'hero', 'home'].includes(anchorId);

            if (state.currentView === 'landing') {
                if (isAnchor) {
                    const el = document.getElementById(anchorId);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                    }
                } else if (hash === '#home' || hash === '') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else {
                state.currentView = 'landing';
                renderLandingPageView();
                if (isAnchor) {
                    setTimeout(() => {
                        const el = document.getElementById(anchorId);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);
                }
            }
        }
        return;
    }

    if (hash === '#activity') {
        state.currentView = 'activity';
        await renderActivityPageView();
        return;
    }

    if (hash.startsWith('#group/')) {
        const groupId = parseInt(hash.replace('#group/', ''), 10);
        if (groupId) {
            state.currentView = 'group';
            await renderGroupView(groupId);
            return;
        }
    }

    window.location.hash = '#dashboard';
    state.currentView = 'dashboard';
    await renderDashboardView();
}

window.handleHashRouting = handleHashRouting;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof initTheme === 'function') {
        initTheme();
    }
    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles();
    }
    await checkAuth();
    handleHashRouting();
    window.addEventListener('hashchange', handleHashRouting);
});

async function checkAuth() {
    try {
        const res = await api.get('/auth/me');
        state.user = res.user;
        updateNavUser();
        if (typeof loadPendingInvites === 'function') {
            await loadPendingInvites();
        }
    } catch (e) {
        state.user = null;
        updateNavUser();
    }
}

function updateNavUser() {
    const navActions = document.getElementById('nav-actions');
    const brandLink = document.getElementById('brand-link');

    if (state.user) {
        if (brandLink) brandLink.href = '#dashboard';
        if (!navActions) return;
        const inviteCount = state.pendingInvites?.length || 0;
        navActions.innerHTML = `
            ${inviteCount > 0 ? `
                <button class="btn btn-secondary btn-sm nav-invites-btn" onclick="showInvitesModal()" title="Pending Invitations">
                    <span class="badge-count">${inviteCount}</span>
                    <span class="nav-invites-text">Invites</span>
                </button>
            ` : ''}
            <button id="profile-nav-btn" class="btn btn-secondary btn-sm nav-profile-btn" onclick="showProfileModal()" title="Profile Settings">
                ${ICONS.user}
                <span class="nav-username">${escapeHtml(state.user.username)}</span>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="logout()">
                Log Out
            </button>
        `;
    } else {
        if (brandLink) {
            brandLink.href = '#home';
            brandLink.onclick = (e) => {
                if (!state.user && state.currentView === 'landing') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    try { history.pushState(null, '', '#home'); } catch (err) {}
                }
            };
        }
        if (!navActions) return;
        navActions.innerHTML = `
            <a href="#features" class="nav-link nav-section-link" onclick="scrollToLandingSection('features', event)">Features</a>
            <a href="#how-it-works" class="nav-link nav-section-link" onclick="scrollToLandingSection('how-it-works', event)">How It Works</a>
            <a href="#about" class="nav-link nav-section-link" onclick="scrollToLandingSection('about', event)">About</a>
            <a href="#login" class="nav-link nav-auth-link">Log In</a>
            <a href="#signup" class="btn btn-primary btn-sm">Sign Up</a>
        `;
    }
}

window.checkAuth = checkAuth;
window.updateNavUser = updateNavUser;
