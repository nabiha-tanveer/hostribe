

function renderLandingPageView() {
    state.currentView = "landing";
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
        <div class="landing-page">
            <section id="hero" class="hero-section">
                <div class="container hero-container">
                    <h1 class="hero-title">Hostribe</h1>
                    <p class="hero-subtitle">
                        Split bills, track shared expenses, and settle debts with friends easily.
                    </p>
                    <div class="hero-buttons">
                        <a href="#signup" class="btn btn-primary btn-lg">Get Started</a>
                        <a href="#login" class="btn btn-secondary btn-lg">Log In</a>
                    </div>
                </div>
            </section>

            <section id="features" class="section-container">
                <div class="container">
                    <h2 class="section-title">Features</h2>
                    <p class="section-subtitle">Core tools to manage shared finances</p>

                    <div class="features-grid">
                        <div class="feature-card">
                            <h3 class="feature-title">Group Expenses</h3>
                            <p class="feature-text">Organize shared spending for flatmates, trips, or events in dedicated groups.</p>
                        </div>

                        <div class="feature-card">
                            <h3 class="feature-title">Equal &amp; Exact Splits</h3>
                            <p class="feature-text">Split costs evenly or specify exact custom shares for each member.</p>
                        </div>

                        <div class="feature-card">
                            <h3 class="feature-title">Debt Simplifier</h3>
                            <p class="feature-text">Automatically calculates net balances and minimizes total settlement payments.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="how-it-works" class="section-container section-alt">
                <div class="container">
                    <h2 class="section-title">How It Works</h2>
                    <p class="section-subtitle">Three simple steps to settle up</p>

                    <div class="steps-grid">
                        <div class="step-card">
                            <div class="step-number">1</div>
                            <h3 class="step-title">Create Group</h3>
                            <p class="step-text">Set up a group and add friends by username or email.</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">2</div>
                            <h3 class="step-title">Add Expenses</h3>
                            <p class="step-text">Record payments, select participants, and attach receipt photos.</p>
                        </div>
                        <div class="step-card">
                            <div class="step-number">3</div>
                            <h3 class="step-title">Settle Debts</h3>
                            <p class="step-text">View net balances and record settlements to clear balances.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section id="about" class="section-container">
                <div class="container">
                    <div class="about-card">
                        <h2 class="section-title">About Hostribe</h2>
                        <p class="about-text">
                            A university semester project built with plain HTML, CSS Flexbox, Vanilla JavaScript, and PHP with MySQL.
                        </p>
                        <div class="about-actions">
                            <a href="#signup" class="btn btn-primary">Create Free Account</a>
                        </div>
                    </div>
                </div>
            </section>

            <footer class="app-footer">
                <div class="container footer-container">
                    <div class="footer-brand-wrap">
                        <div class="footer-brand">
                            <img src="/images/logo.png?v=2" alt="Hostribe Logo" class="footer-logo-img">
                            <span class="footer-brand-title">Hostribe</span>
                        </div>
                        <p class="footer-tagline">Expense Splitter Among Friends</p>
                    </div>
                    <div class="footer-nav">
                        <a href="#hero" onclick="scrollToLandingSection('hero', event)">Home</a>
                        <a href="#features" onclick="scrollToLandingSection('features', event)">Features</a>
                        <a href="#how-it-works" onclick="scrollToLandingSection('how-it-works', event)">How It Works</a>
                        <a href="#about" onclick="scrollToLandingSection('about', event)">About</a>
                        <a href="#login">Log In</a>
                        <a href="#signup">Sign Up</a>
                    </div>
                    <div class="footer-credits">
                        <span>Web Technologies Semester Project</span>
                    </div>
                </div>
            </footer>
        </div>
    `;
}

window.renderLandingPageView = renderLandingPageView;

function renderAuthView(view = 'login', resetToken = '') {
    const app = document.getElementById('app');
    if (!app) return;
    
    app.innerHTML = `
        <div style="min-height: calc(100vh - 4rem); display: flex; align-items: center; justify-content: center; padding: 2rem 1rem;">
            <div class="card" style="width: 100%; max-width: 440px;">
                <div class="auth-header" style="text-align: center; margin: 0 auto 2rem auto; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%;">
                    <div class="auth-logo-wrap" style="display: flex; justify-content: center; align-items: center; width: 100%; margin: 0 auto 0.85rem auto; text-align: center;">
                        <img src="/images/logo.png?v=2" alt="Hostribe Logo" class="auth-logo-img" style="display: block; margin: 0 auto; width: 3.75rem; height: 3.75rem; object-fit: contain;">
                    </div>
                    <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); text-align: center; margin: 0 0 0.25rem 0;">Hostribe</h1>
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin: 0 auto; text-align: center; max-width: 340px;">
                        ${view === 'signup' ? 'Create an account to split bills and track balances' :
                          view === 'forgot' ? 'Enter your account email and choose a new password' :
                          view === 'reset' ? 'Choose a new password for your account' :
                          'Log in to track shared group expenses and debts'}
                    </p>
                </div>

                <div id="auth-error-box" style="display: none; background-color: var(--status-negative-bg); border: 1px solid var(--status-negative-border); border-radius: 6px; padding: 10px 14px; color: var(--color-coral); font-size: 13px; text-align: center; margin-bottom: 1.25rem;"></div>

                ${view === 'forgot' ? renderForgotPasswordForm() :
                  view === 'reset' ? renderResetPasswordForm(resetToken) :
                  view === 'signup' ? renderSignupForm() :
                  renderLoginForm()}
            </div>
        </div>
    `;

    if (typeof setupPasswordToggles === 'function') {
        setupPasswordToggles(app);
    }
}

function renderLoginForm() {
    return `
        <form id="login-form" onsubmit="handleLoginSubmit(event)">
            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="login-identifier" class="form-control" placeholder="you@example.com" required autocomplete="email">
            </div>

            <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <label class="form-label" style="margin-bottom: 0;">Password</label>
                    <a href="#forgot-password" style="font-size: 0.75rem; color: var(--color-teal); text-decoration: none;">Forgot password?</a>
                </div>
                <div class="password-input-wrapper">
                    <input type="password" id="login-password" class="form-control" placeholder="Enter your password" required autocomplete="current-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <button type="submit" id="login-submit-btn" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">
                Log In
            </button>

            <p style="text-align: center; font-size: 0.8125rem; color: var(--text-secondary); margin-top: 1.25rem;">
                Don't have an account? <a href="#signup" style="color: var(--color-teal); text-decoration: none; font-weight: 600;">Sign up</a>
            </p>
        </form>
    `;
}

function renderSignupForm() {
    return `
        <form id="signup-form" onsubmit="handleSignupSubmit(event)">
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" id="signup-username" class="form-control" placeholder="e.g. Abdullah Sarwar" required minlength="2" maxlength="80" autocomplete="name">
            </div>

            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" id="signup-email" class="form-control" placeholder="you@example.com" required autocomplete="email">
            </div>

            <div class="form-group">
                <label class="form-label">Password (min 6 characters)</label>
                <div class="password-input-wrapper">
                    <input type="password" id="signup-password" class="form-control" placeholder="Choose a password (min 6 chars)" required minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Confirm Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="signup-confirm-password" class="form-control" placeholder="Confirm your password" required minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <button type="submit" id="signup-submit-btn" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">
                Create Account Free
            </button>

            <p style="text-align: center; font-size: 0.8125rem; color: var(--text-secondary); margin-top: 1.25rem;">
                Already have an account? <a href="#login" style="color: var(--color-teal); text-decoration: none; font-weight: 600;">Log in</a>
            </p>
        </form>
    `;
}

function renderForgotPasswordForm() {
    return `
        <form id="forgot-form" onsubmit="handleForgotPasswordSubmit(event)">
            <div class="form-group">
                <label class="form-label" for="forgot-email">Account Email Address</label>
                <input type="email" id="forgot-email" class="form-control" placeholder="you@example.com" required autocomplete="email">
            </div>

            <div class="form-group">
                <label class="form-label" for="forgot-password">New Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="forgot-password" class="form-control" placeholder="At least 6 characters" required minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label" for="forgot-confirm-password">Confirm New Password</label>
                <div class="password-input-wrapper">
                    <input type="password" id="forgot-confirm-password" class="form-control" placeholder="Re-enter your new password" required minlength="6" autocomplete="new-password">
                    <button type="button" class="password-toggle-btn" title="Toggle password visibility">${ICONS.eye}</button>
                </div>
            </div>

            <button type="submit" id="forgot-submit-btn" class="btn btn-primary" style="width: 100%; padding: 0.75rem;">
                Reset Password
            </button>

            <p style="text-align: center; font-size: 0.8125rem; color: var(--text-secondary); margin-top: 1.25rem;">
                Remember your password? <a href="#login" style="color: var(--color-teal); text-decoration: none; font-weight: 600;">Back to login</a>
            </p>
        </form>
    `;
}

function renderResetPasswordForm(token) {
    return `
        <form id="reset-form" onsubmit="handleResetPasswordSubmit(event)">
            <input type="hidden" id="reset-token" value="${escapeHtml(token)}">

            <div class="form-group">
                <label class="form-label" for="reset-password">New Password</label>
                <input type="password" id="reset-password" class="form-control" required minlength="6" autocomplete="new-password">
            </div>

            <div class="form-group">
                <label class="form-label" for="reset-confirm-password">Confirm New Password</label>
                <input type="password" id="reset-confirm-password" class="form-control" required minlength="6" autocomplete="new-password">
            </div>

            <button type="submit" id="reset-submit-btn" class="btn btn-primary" style="width: 100%;">
                Reset Password
            </button>

            <p style="text-align: center; font-size: 0.8125rem; color: var(--text-secondary); margin-top: 1.25rem;">
                <a href="#login">Back to login</a>
            </p>
        </form>
    `;
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const errBox = document.getElementById('auth-error-box');
    const submitBtn = document.getElementById('login-submit-btn');

    errBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const res = await api.post('/auth/login', { identifier, password });
        state.user = res.user;
        if (typeof updateNavUser === 'function') {
            updateNavUser();
        }
        showToast(`Welcome back, ${res.user.username}..!`);
        window.location.hash = '#dashboard';
    } catch (err) {
        errBox.textContent = err.message || 'Invalid credentials';
        errBox.style.display = 'block';
        showToast(err.message || 'Invalid credentials', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Log In';
    }
}

async function handleSignupSubmit(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    const errBox = document.getElementById('auth-error-box');
    const submitBtn = document.getElementById('signup-submit-btn');

    errBox.style.display = 'none';

    if (password !== confirmPassword) {
        errBox.textContent = 'Passwords do not match';
        errBox.style.display = 'block';
        showToast('Passwords do not match', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    try {
        const res = await api.post('/auth/signup', { username, email, password });
        state.user = res.user;
        if (typeof updateNavUser === 'function') {
            updateNavUser();
        }
        showToast(`Account created successfully! Welcome to Hostribe, ${res.user.username}`);
        window.location.hash = '#dashboard';
    } catch (err) {
        errBox.textContent = err.message || 'Signup failed';
        errBox.style.display = 'block';
        showToast(err.message || 'Signup failed', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account Free';
    }
}

async function handleForgotPasswordSubmit(e) {
    e.preventDefault();

    const email = document.getElementById('forgot-email').value.trim();
    const password = document.getElementById('forgot-password').value;
    const confirmPassword = document.getElementById('forgot-confirm-password').value;
    const errBox = document.getElementById('auth-error-box');
    const submitBtn = document.getElementById('forgot-submit-btn');

    errBox.style.display = 'none';

    if (password.length < 6) {
        errBox.textContent = 'Password must be at least 6 characters long';
        errBox.style.display = 'block';
        showToast('Password must be at least 6 characters long', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
        return;
    }

    if (password !== confirmPassword) {
        errBox.textContent = 'Passwords do not match';
        errBox.style.display = 'block';
        showToast('Passwords do not match', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Resetting Password...';

    try {
        const response = await api.post('/password_reset/reset', { email, password });
        showToast(response.message || 'Password reset successfully! Please log in.');
        window.location.hash = '#login';
    } catch (error) {
        errBox.textContent = error.message || 'Could not reset password';
        errBox.style.display = 'block';
        showToast(error.message || 'Could not reset password', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Reset Password';
    }
}

async function handleResetPasswordSubmit(e) {
    e.preventDefault();

    const token = document.getElementById('reset-token').value;
    const password = document.getElementById('reset-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const errBox = document.getElementById('auth-error-box');
    const submitBtn = document.getElementById('reset-submit-btn');

    errBox.style.display = 'none';

    if (password !== confirmPassword) {
        errBox.textContent = 'Passwords do not match';
        errBox.style.display = 'block';
        showToast('Passwords do not match', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
        return;
    }

    submitBtn.disabled = true;

    try {
        const response = await api.post('/password_reset/confirm', { token, password });
        showToast(response.message);
        window.location.hash = '#login';
    } catch (error) {
        errBox.textContent = error.message || 'Password reset failed';
        errBox.style.display = 'block';
        showToast(error.message || 'Password reset failed', 'error');
        setTimeout(() => {
            if (errBox) errBox.style.display = 'none';
        }, 3000);
    } finally {
        submitBtn.disabled = false;
    }
}

async function logout() {
    try {
        await api.post('/auth/logout');
    } catch (e) {}
    api.csrfToken = null;
    state.user = null;
    if (typeof updateNavUser === 'function') {
        updateNavUser();
    }
    window.location.hash = '#login';
    showToast('Logged out');
}

window.renderAuthView = renderAuthView;
window.renderLoginForm = renderLoginForm;
window.renderSignupForm = renderSignupForm;
window.renderForgotPasswordForm = renderForgotPasswordForm;
window.handleLoginSubmit = handleLoginSubmit;
window.handleSignupSubmit = handleSignupSubmit;
window.handleForgotPasswordSubmit = handleForgotPasswordSubmit;
window.handleResetPasswordSubmit = handleResetPasswordSubmit;
window.renderResetPasswordForm = renderResetPasswordForm;
window.logout = logout;

async function renderDashboardView() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `<div class="container" style="padding-top: 2rem;"><p style="color: var(--text-secondary);">Loading your dashboard...</p></div>`;

    try {
        const data = await api.get('/balances/dashboard');
        state.dashboard = data;
        if (typeof loadPendingInvites === 'function') {
            await loadPendingInvites();
        }

        const summary = data.summary || { total_you_owe: 0, total_owed_to_you: 0, net_balance: 0 };
        const groups = data.groups || [];

        try {
            const lastOpenedId = parseInt(localStorage.getItem('hostribe_last_opened_group_id'), 10);
            if (lastOpenedId) {
                const idx = groups.findIndex(g => g.id === lastOpenedId);
                if (idx > 0) {
                    const [targetGroup] = groups.splice(idx, 1);
                    groups.unshift(targetGroup);
                }
            }
        } catch (e) {}

        app.innerHTML = `
            <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
                ${renderPendingInvitesAlert()}

                <div class="welcome-banner">
                    <div>
                        <h1 class="welcome-title">Welcome back, ${escapeHtml(state.user.username)}..!</h1>
                        <p class="welcome-sub">Here is your group expense summary and overall balances.</p>
                    </div>
                    <div style="display: flex; gap: 0.65rem; align-items: center; flex-wrap: wrap;">
                        <a href="#activity" class="btn btn-secondary" style="text-decoration: none;">
                            ${ICONS.activity} Recent Activity
                        </a>
                        <button class="btn btn-primary" onclick="showCreateGroupModal()">
                            ${ICONS.plus} Create New Group
                        </button>
                    </div>
                </div>

                <div class="metrics-grid">
                    <div class="card">
                        <div class="metric-title">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--color-coral);"></span>
                            Total You Owe
                        </div>
                        <div class="metric-value text-negative">
                            ${formatMoney(summary.total_you_owe)}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.35rem;">
                            ${summary.total_you_owe > 0.005 ? 'Payment owed across active groups' : 'You are completely square'}
                        </div>
                    </div>

                    <div class="card">
                        <div class="metric-title">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--color-teal);"></span>
                            Total Owed to You
                        </div>
                        <div class="metric-value text-positive">
                            ${formatMoney(summary.total_owed_to_you)}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.35rem;">
                            ${summary.total_owed_to_you > 0.005 ? 'Receivables pending from members' : 'No pending receivables'}
                        </div>
                    </div>

                    <div class="card">
                        <div class="metric-title">
                            <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${summary.net_balance > 0.005 ? 'var(--color-teal)' : summary.net_balance < -0.005 ? 'var(--color-coral)' : 'var(--text-tertiary)'};"></span>
                            Net Balance
                        </div>
                        <div class="metric-value ${summary.net_balance > 0.005 ? 'text-positive' : summary.net_balance < -0.005 ? 'text-negative' : 'text-neutral'}">
                            ${formatMoney(summary.net_balance, true)}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.35rem;">
                            ${summary.net_balance > 0.005 ? 'Overall positive balance' : summary.net_balance < -0.005 ? 'Overall payment required' : 'All balances fully settled'}
                        </div>
                    </div>
                </div>

                <div>
                    <div class="section-header">
                        <h2 class="section-title">Your Groups</h2>
                        <span style="font-size: 0.8125rem; color: var(--text-secondary);">${groups.length} active</span>
                    </div>

                    ${groups.length === 0 ? `
                        <div class="card" style="text-align: center; padding: 3rem 1.5rem; border-style: solid;">
                            <p style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem;">No Groups Yet</p>
                            <p style="color: var(--text-secondary); font-size: 0.875rem; max-width: 380px; margin: 0 auto 1.5rem;">
                                Create a group for trips, roommates, or dinner to start splitting expenses fairly!
                            </p>
                            <button class="btn btn-primary" onclick="showCreateGroupModal()">
                                ${ICONS.plus} Create First Group
                            </button>
                        </div>
                    ` : `
                        <div class="groups-grid">
                            ${groups.map(g => renderGroupCard(g)).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderPendingInvitesAlert() {
    if (!state.pendingInvites || state.pendingInvites.length === 0) return '';

    return `
        <div class="invitation-alert">
            <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
                <span></span> Pending Group Invitations (${state.pendingInvites.length})
            </div>
            <div>
                ${state.pendingInvites.map(inv => `
                    <div class="invitation-item">
                        <div>
                            <span style="font-weight: 600; color: var(--text-primary);">${escapeHtml(inv.group_name)}</span>
                            <span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: 0.5rem;">invited by ${escapeHtml(inv.inviter_name)}</span>
                        </div>
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button class="btn btn-primary btn-sm" onclick="respondToInvite(${inv.id}, 'accept')">
                                Accept
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="respondToInvite(${inv.id}, 'ignore')">
                                Ignore
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderGroupCard(g) {
    const net = g.user_net_balance || 0;
    const isOwed = net > 0.005;
    const owes = net < -0.005;

    return `
        <div class="card card-interactive" tabindex="0" role="link" onclick="window.location.hash='#group/${g.id}'" onkeydown="if(event.key==='Enter'||event.key===' ')window.location.hash='#group/${g.id}'">
            <div class="group-card-header">
                <div>
                    <h3 class="group-name">${escapeHtml(g.group_name)}</h3>
                    <div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 0.2rem;">
                        ${g.member_count} member${g.member_count !== 1 ? 's' : ''}
                    </div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">Your Balance</div>
                    <div style="font-size: 1.05rem; font-weight: 700; font-family: var(--font-mono); margin-top: 0.15rem;" class="${isOwed ? 'text-positive' : owes ? 'text-negative' : 'text-neutral'}">
                        ${isOwed ? `+${formatMoney(net)}` : owes ? `-${formatMoney(Math.abs(net))}` : 'Settled up'}
                    </div>
                </div>
            </div>
            <div class="group-card-footer">
                <span>Group #${g.id}</span>
                <span>Created ${formatDate(g.created_at)}</span>
            </div>
        </div>
    `;
}

window.renderDashboardView = renderDashboardView;
window.renderPendingInvitesAlert = renderPendingInvitesAlert;
window.renderGroupCard = renderGroupCard;

async function renderGroupView(groupId) {
    const app = document.getElementById('app');
    if (!app) return;

    try {
        localStorage.setItem('hostribe_last_opened_group_id', groupId);
    } catch (e) {}

    app.innerHTML = `<div class="container" style="padding-top: 2rem;"><p style="color: var(--text-secondary);">Loading group details...</p></div>`;

    try {
        const [groupRes, expRes, balRes, actRes] = await Promise.all([
            api.get(`/groups/${groupId}`),
            api.get(`/expenses/group/${groupId}`),
            api.get(`/balances/group/${groupId}/balances`),
            api.get(`/balances/group/${groupId}/activity`)
        ]);

        state.currentGroup = groupRes.group;
        state.currentMembers = groupRes.members;
        state.currentGroupExpenses = expRes.expenses || [];
        state.currentGroupBalances = balRes.balances || [];
        state.currentSuggestedSettlements = balRes.suggested_settlements || [];
        state.currentGroupActivities = actRes.activities || [];

        const group = state.currentGroup;
        const totalSpending = balRes.total_spending || 0;

        const myBal = state.currentGroupBalances.find(b => b.user_id === state.user.id);
        const myNet = myBal ? myBal.net_balance : 0;

        app.innerHTML = `
            <div class="container" style="padding-top: 1.5rem; padding-bottom: 4rem;">
                <div style="margin-bottom: 1rem;">
                    <a href="#dashboard" class="btn btn-black btn-sm" style="background-color: #000000; color: #ffffff; border: 1px solid #000000;">
                        Back to Dashboard
                    </a>
                </div>

                <div class="group-hero">
                    <div class="group-hero-top">
                        <div>
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.35rem;">
                                <h1 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary);">${escapeHtml(group.group_name)}</h1>
                            </div>
                            <div class="group-hero-meta">
                                <span>Total Spending: <strong style="color: var(--text-primary); font-family: var(--font-mono);">${formatMoney(totalSpending)}</strong></span>
                                <span>Your Balance: <strong class="${myNet > 0.005 ? 'text-positive' : myNet < -0.005 ? 'text-negative' : 'text-neutral'}" style="font-family: var(--font-mono);">${formatMoney(myNet, true)}</strong></span>
                            </div>
                        </div>

                        <div class="group-hero-actions" style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="showAddExpenseModal()">
                                ${ICONS.plus} Add Expense
                            </button>
                            <button class="btn btn-secondary" onclick="exportGroupCSV(${group.id})" title="Export group expenses as CSV">
                                ${ICONS.download} Export CSV
                            </button>
                            <button class="btn btn-secondary" onclick="showInviteMemberModal()">
                                Invite Member
                            </button>
                            <button class="btn btn-danger" onclick="handleLeaveGroup(${group.id})">
                                Leave Group
                            </button>
                        </div>
                    </div>

                    <div class="members-strip">
                        <span style="font-size: 0.75rem; color: var(--text-secondary); margin-right: 0.25rem; align-self: center;">Members:</span>
                        ${state.currentMembers.map(m => `
                            <div class="member-chip">
                                <div class="member-chip-avatar">${m.username.charAt(0).toUpperCase()}</div>
                                <span>${escapeHtml(m.username)} ${m.id === state.user.id ? '(You)' : ''}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="tabs-nav">
                    <button class="tab-btn ${state.activeGroupTab === 'expenses' ? 'active' : ''}" data-tab="expenses" onclick="switchGroupTab('expenses')">
                        Expenses (${state.currentGroupExpenses.length})
                    </button>
                    <button class="tab-btn ${state.activeGroupTab === 'balances' ? 'active' : ''}" data-tab="balances" onclick="switchGroupTab('balances')">
                        Who Owes Whom (${state.currentSuggestedSettlements.length})
                    </button>
                    <button class="tab-btn ${state.activeGroupTab === 'activity' ? 'active' : ''}" data-tab="activity" onclick="switchGroupTab('activity')">
                        Activity Log
                    </button>
                </div>

                <div id="group-tab-content">
                    ${renderGroupTabContent()}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
        window.location.hash = '#dashboard';
    }
}

function switchGroupTab(tab) {
    state.activeGroupTab = tab;
    const content = document.getElementById('group-tab-content');
    if (content) {
        content.innerHTML = renderGroupTabContent();
    }
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
}

function renderGroupTabContent() {
    if (state.activeGroupTab === 'expenses') {
        return renderExpensesTab();
    } else if (state.activeGroupTab === 'balances') {
        return renderBalancesTab();
    } else {
        return renderActivityTab();
    }
}

function renderExpensesTab() {
    const expenses = state.currentGroupExpenses;
    if (expenses.length === 0) {
        return `
            <div class="card" style="text-align: center; padding: 3rem 1.5rem; border-style: solid;">
                <p style="color: var(--text-primary); font-weight: 600; margin-bottom: 0.5rem;">No expenses recorded yet</p>
                <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.25rem;">Log your first group expense to begin splitting fairly!</p>
                <button class="btn btn-primary" onclick="showAddExpenseModal()">${ICONS.plus} Add Expense</button>
            </div>
        `;
    }

    return `
        <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                <span style="font-size: 0.875rem; color: var(--text-muted);">
                    Showing ${expenses.length} recorded expense${expenses.length === 1 ? '' : 's'}
                </span>
                <button class="btn btn-secondary btn-sm" onclick="exportGroupCSV(${state.currentGroup.id})" style="display: inline-flex; align-items: center; gap: 0.4rem;" title="Download complete CSV of group expenses">
                    ${ICONS.download} Export CSV
                </button>
            </div>
            ${expenses.map(e => {
                const dateObj = new Date(e.expense_date);
                const month = dateObj.toLocaleString('default', { month: 'short' });
                const day = dateObj.getDate();
                const isPayer = e.paid_by === state.user.id;
                const receiptUrls = e.receipt_urls && e.receipt_urls.length > 0 
                    ? e.receipt_urls 
                    : (e.receipt_url ? [e.receipt_url] : []);
                const hasReceipts = receiptUrls.length > 0;

                return `
                    <div>
                        <div class="expense-item">
                            <div class="expense-left">
                                <div class="expense-date-badge">
                                    <span class="expense-date-month">${month}</span>
                                    <span class="expense-date-day">${day}</span>
                                </div>
                                <div>
                                    <div class="expense-desc" style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                                        <span>${escapeHtml(e.description)}</span>
                                        ${hasReceipts ? `
                                            <button type="button" class="badge-receipt-btn" onclick="openExpenseReceiptLightbox(${e.id}, 0)" title="View attached receipts (${receiptUrls.length})">
                                                ${ICONS.receipt} ${receiptUrls.length > 1 ? `${receiptUrls.length} Receipts` : 'Receipt'}
                                            </button>
                                        ` : ''}
                                    </div>
                                    <div class="expense-sub">
                                        Paid by <strong style="color: var(--text-primary);">${escapeHtml(e.payer_name)} ${isPayer ? '(You)' : ''}</strong> | 
                                        <span style="font-family: var(--font-mono);">${e.split_type} Split (${e.splits ? e.splits.length : 0})</span>
                                    </div>
                                </div>
                            </div>
                            <div class="expense-right">
                                <div>
                                    <div class="expense-amount">${formatMoney(e.amount)}</div>
                                </div>
                                <div style="display: flex; gap: 0.4rem;">
                                    <button class="btn btn-secondary btn-sm" onclick="toggleExpenseDetails(${e.id})" title="View split breakdown">
                                        Details
                                    </button>
                                    <button class="btn btn-secondary btn-sm" onclick="showEditExpenseModal(${e.id})" title="Edit expense">
                                        ${ICONS.edit}
                                    </button>
                                    <button class="btn btn-danger btn-sm" onclick="handleDeleteExpense(${e.id})" title="Delete expense">
                                        ${ICONS.trash}
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div id="split-box-${e.id}" class="split-breakdown-box" style="display: none;">
                            <div style="font-weight: 600; color: var(--text-secondary); margin-bottom: 0.35rem; font-size: 0.75rem;">Split Breakdown:</div>
                            ${(e.splits || []).map(sp => `
                                <div class="split-breakdown-row">
                                    <span>${escapeHtml(sp.username)} ${sp.user_id === state.user.id ? '(You)' : ''}</span>
                                    <span style="font-family: var(--font-mono); font-weight: 600;">${formatMoney(sp.amount)}</span>
                                </div>
                            `).join('')}

                            ${hasReceipts ? `
                                <div class="split-receipt-attachment" style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid var(--border);">
                                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.35rem;">
                                        <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.75rem;">
                                            Attached Receipts (${receiptUrls.length}):
                                        </div>
                                        <button type="button" class="btn btn-secondary btn-sm" onclick="openExpenseReceiptLightbox(${e.id}, 0)" style="font-size: 0.72rem; padding: 0.2rem 0.55rem; display: inline-flex; align-items: center; gap: 0.35rem;" title="Open receipt viewer">
                                            ${ICONS.eye} View ${receiptUrls.length > 1 ? 'All' : 'Receipt'}
                                        </button>
                                    </div>
                                    <div class="split-receipts-gallery">
                                        ${receiptUrls.map((u, uIdx) => {
                                            const isPdf = u.toLowerCase().endsWith('.pdf');
                                            return `
                                                <div class="split-receipt-item" onclick="openExpenseReceiptLightbox(${e.id}, ${uIdx})" title="Click to view file ${uIdx + 1}" role="button" tabindex="0">
                                                    ${isPdf ? `
                                                        <div class="split-receipt-pdf">${ICONS.fileText} <span>PDF</span></div>
                                                    ` : `
                                                        <img src="${escapeHtml(u)}" alt="Receipt thumbnail" class="split-receipt-thumb" />
                                                    `}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderBalancesTab() {
    const suggested = state.currentSuggestedSettlements;
    const balances = state.currentGroupBalances;

    return `
        <div class="balances-layout">
            
            <div>
                <div class="section-header">
                    <h3 class="section-title">Suggested Debt Settlements</h3>
                    <button class="btn btn-secondary btn-sm" onclick="showCustomSettlementModal()">
                        + Custom Settle
                    </button>
                </div>

                ${suggested.length === 0 ? `
                    <div class="card" style="text-align: center; padding: 2rem 1.5rem; background-color: var(--surface-secondary); border: 1px solid var(--border);">
                        <p style="color: var(--primary); font-weight: 700; font-size: 1rem;">All debts in this group are fully settled!</p>
                        <p style="color: var(--text-muted); font-size: 0.8125rem; margin-top: 0.25rem;">All member balances are settled.</p>
                    </div>
                ` : `
                    <div>
                        ${suggested.map(s => {
                            const isPayer = s.payer_id === state.user.id;
                            const isPayee = s.payee_id === state.user.id;

                            return `
                                <div class="debt-card">
                                    <div class="debt-info">
                                        <div class="debt-avatar">${s.payer_name.charAt(0).toUpperCase()}</div>
                                        <div>
                                            <div style="font-size: 0.875rem; color: var(--text); font-weight: 600; display: flex; align-items: center; gap: 0.35rem; flex-wrap: wrap;">
                                                <span>${escapeHtml(s.payer_name)} ${isPayer ? '(You)' : ''}</span>
                                                <span class="debt-arrow" aria-label="pays">${ICONS.arrowRight}</span>
                                                <span>${escapeHtml(s.payee_name)} ${isPayee ? '(You)' : ''}</span>
                                            </div>
                                            <div style="font-size: 1.15rem; font-weight: 700; color: var(--danger); font-family: var(--font-mono); margin-top: 0.25rem;">
                                                ${formatMoney(s.amount)}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <button class="btn btn-primary btn-sm" onclick="showSettlementModal(${s.payer_id}, ${s.payee_id}, ${s.amount})">
                                            Settle Up
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                `}
            </div>

            <div>
                <div class="section-header">
                    <h3 class="section-title">Individual Member Balances</h3>
                </div>
                <div class="card" style="padding: 1rem 1.25rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                        ${balances.map(b => {
                            const isMe = b.user_id === state.user.id;
                            const net = b.net_balance;
                            return `
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.65rem 0; border-bottom: 1px solid var(--border);">
                                    <div>
                                        <div style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">
                                            ${escapeHtml(b.username)} ${isMe ? '(You)' : ''}
                                        </div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.15rem;">
                                            Paid: ${formatMoney(b.total_paid)} | Share: ${formatMoney(b.total_share)}
                                        </div>
                                    </div>
                                    <div style="font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem;" class="${net > 0.005 ? 'text-positive' : net < -0.005 ? 'text-negative' : 'text-neutral'}">
                                        ${formatMoney(net, true)}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderActivityTab() {
    const activities = state.currentGroupActivities;
    if (activities.length === 0) {
        return `<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 2rem;">No activities logged yet.</p>`;
    }

    return `
        <div class="card" style="padding: 1rem 1.25rem;">
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${activities.map(a => `
                    <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;">
                        <div style="margin-bottom: 0.25rem;">
                            <span style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">
                                ${escapeHtml(a.description)}
                            </span>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">
                            by ${escapeHtml(a.username)} | ${formatDateTime(a.created_at)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

window.renderGroupView = renderGroupView;
window.switchGroupTab = switchGroupTab;
window.renderGroupTabContent = renderGroupTabContent;
window.renderExpensesTab = renderExpensesTab;
window.renderBalancesTab = renderBalancesTab;
window.renderActivityTab = renderActivityTab;

async function renderActivityPageView() {
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = `
        <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
            <div style="margin-bottom: 1.25rem;">
                <a href="#dashboard" class="btn btn-black btn-sm" style="background-color: #000000; color: #ffffff; border: 1px solid #000000;">
                    Back to Dashboard
                </a>
            </div>
            <p style="color: var(--text-secondary);">Loading your activities...</p>
        </div>
    `;

    try {
        const res = await api.get('/balances/all-activity');
        const activities = res.activities || [];

        app.innerHTML = `
            <div class="container" style="padding-top: 2rem; padding-bottom: 4rem;">
                <div style="margin-bottom: 1.25rem;">
                    <a href="#dashboard" class="btn btn-black btn-sm" style="background-color: #000000; color: #ffffff; border: 1px solid #000000;">
                        Back to Dashboard
                    </a>
                </div>

                <div class="welcome-banner" style="margin-top: 0;">
                    <div>
                        <h1 class="welcome-title">Activity History</h1>
                        <p class="welcome-sub">Complete record of expenses, settlements, and member updates across your groups.</p>
                    </div>
                </div>

                <div class="card" style="padding: 1.5rem;">
                    ${activities.length === 0 ? `
                        <p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 2.5rem 0;">No activities recorded yet.</p>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 1rem;">
                            ${activities.map(a => `
                                <div style="border-bottom: 1px solid var(--border); padding-bottom: 0.85rem; display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;">
                                    <div>
                                        <div style="margin-bottom: 0.3rem;">
                                            <span style="font-size: 0.875rem; color: var(--text-primary); font-weight: 500;">
                                                ${escapeHtml(a.description)}
                                            </span>
                                        </div>
                                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.2rem;">
                                            Group: <strong style="color: var(--color-teal);">${escapeHtml(a.group_name)}</strong> | by ${escapeHtml(a.username)}
                                        </div>
                                    </div>
                                    <div style="font-size: 0.75rem; color: var(--text-tertiary); font-family: var(--font-mono); white-space: nowrap;">
                                        ${formatDateTime(a.created_at)}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        `;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

window.renderActivityPageView = renderActivityPageView;
