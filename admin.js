'use strict';
console.log('admin.js loaded — admin dashboard');

// DOM: login gate 
const loginGate     = document.getElementById('loginGate');
const loginForm     = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginError    = document.getElementById('loginError');
const loginBtn      = document.getElementById('loginBtn');

// DOM: admin shell 
const adminShell    = document.getElementById('adminShell');
const logoutBtn     = document.getElementById('logoutBtn');
const refreshBtn    = document.getElementById('refreshBtn');
const clearBtn      = document.getElementById('clearBtn');
const searchInput   = document.getElementById('searchInput');
const searchBtn     = document.getElementById('searchBtn');
const recordsBody   = document.getElementById('recordsBody');
const recordCount   = document.getElementById('recordCount');
const toast         = document.getElementById('toast');

// DOM: hero stats 
const heroTotal     = document.getElementById('heroTotal');
const heroMale      = document.getElementById('heroMale');
const heroFemale    = document.getElementById('heroFemale');
const statTotal     = document.getElementById('statTotal');
const statMale      = document.getElementById('statMale');
const statFemale    = document.getElementById('statFemale');
const statAvgAge    = document.getElementById('statAvgAge');
const statYoungest  = document.getElementById('statYoungest');
const statOldest    = document.getElementById('statOldest');

// Toast 
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    toast.classList.remove('hidden');

    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 3500);
}

// Loading state
function setLoading(btn, isLoading) {
    const text    = btn.querySelector('.btn-text');
    const loading = btn.querySelector('.btn-loading');
    btn.disabled  = isLoading;
    text?.classList.toggle('hidden', isLoading);
    loading?.classList.toggle('hidden', !isLoading);
}

// Showing admin dashboard 
function showDashboard() {
    loginGate.classList.add('hidden');
    adminShell.classList.remove('hidden');
}

// Showing login gate 
function showLogin() {
    adminShell.classList.add('hidden');
    loginGate.classList.remove('hidden');
    loginForm?.reset();
    loginError?.classList.add('hidden');
}

// Login 
async function handleLogin(event) {
    event.preventDefault();
    loginError?.classList.add('hidden');

    const password = passwordInput.value.trim();
    if (!password) return;

    setLoading(loginBtn, true);

    try {
        const response = await fetch('/admin/login', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify({ password }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            loginError?.classList.remove('hidden');
            passwordInput.value = '';
            passwordInput.focus();
            return;
        }

        showDashboard();
        await loadDashboard();

    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = 'Network error. Please try again.';
        loginError?.classList.remove('hidden');
    } finally {
        setLoading(loginBtn, false);
    }
}

// Logout 
async function handleLogout() {
    try {
        await fetch('/admin/logout', { method: 'POST' });
    } catch {
        // Even if request fails, we clear the UI
    }
    showLogin();
    showToast('Logged out successfully.', 'success');
}

// Fetching stats 
async function fetchStats() {
    try {
        const response = await fetch('/stats');

        if (response.status === 401) {
            showLogin();
            return;
        }
        if (!response.ok) throw new Error('Stats unavailable.');

        const data = await response.json();

        heroTotal.textContent    = data.total;
        heroMale.textContent     = data.male;
        heroFemale.textContent   = data.female;
        statTotal.textContent    = data.total;
        statMale.textContent     = data.male;
        statFemale.textContent   = data.female;
        statAvgAge.textContent   = data.avg_age;
        statYoungest.textContent = data.youngest;
        statOldest.textContent   = data.oldest;

    } catch (error) {
        console.error('Stats error:', error);
        showToast('Failed to load stats.', 'error');
    }
}

// Fetching & rendering records 
async function fetchRecords(query = '') {
    try {
        const url = query
            ? `/search?name=${encodeURIComponent(query)}`
            : '/records';

        const response = await fetch(url);

        if (response.status === 401) {
            showLogin();
            return;
        }
        if (!response.ok) throw new Error('Records unavailable.');

        const records = await response.json();

        recordsBody.innerHTML = '';

        if (!records.length) {
            recordsBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state">
                        ${query ? 'No records match that search.' : 'No records yet.'}
                    </td>
                </tr>`;
            recordCount.textContent = '0 records';
            return;
        }

        records.forEach((record, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="row-index">${index + 1}</td>
                <td>${record.name ?? '-'}</td>
                <td>${record.gender === 'M' ? 'Male' : 'Female'}</td>
                <td>${record.age ?? '-'}</td>
                <td>${record.address ?? '-'}</td>
                <td>${record.date ?? '-'}</td>
            `;
            recordsBody.appendChild(row);
        });

        recordCount.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;

    } catch (error) {
        console.error('Records error:', error);
        recordsBody.innerHTML = '<tr><td colspan="6" class="empty-state">Could not load records.</td></tr>';
        recordCount.textContent = '0 records';
        showToast('Failed to load records.', 'error');
    }
}

// Loading full dashboard 
async function loadDashboard() {
    await Promise.all([fetchStats(), fetchRecords()]);
}

// Searching
async function handleSearch(event) {
    event?.preventDefault();
    const query = searchInput.value.trim();
    await fetchRecords(query);
    if (query) {
        showToast(`Showing results for "${query}"`, 'success');
    }
}

// Refreshing 
async function handleRefresh() {
    searchInput.value = '';
    await loadDashboard();
    showToast('Dashboard refreshed.', 'success');
}

// Clearing all records
async function handleClear() {
    const confirmed = confirm('Delete ALL records permanently? This cannot be undone.');
    if (!confirmed) return;

    try {
        const response = await fetch('/clear', { method: 'POST' });

        if (response.status === 401) {
            showLogin();
            return;
        }

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            await loadDashboard();
        } else {
            showToast(result.message || 'Could not clear records.', 'error');
        }
    } catch (error) {
        console.error('Clear error:', error);
        showToast('Clear action failed.', 'error');
    }
}

// Checking if already logged in (e.g. page reload)
async function checkSession() {
    try {
        const response = await fetch('/admin/check');
        const data     = await response.json();

        if (data.logged_in) {
            showDashboard();
            await loadDashboard();
        } else {
            showLogin();
        }
    } catch {
        showLogin();
    }
}

// Attaching all event listeners 
function attachEvents() {
    loginForm?.addEventListener('submit', handleLogin);
    logoutBtn?.addEventListener('click', handleLogout);
    refreshBtn?.addEventListener('click', handleRefresh);
    clearBtn?.addEventListener('click', handleClear);
    searchBtn?.addEventListener('click', handleSearch);

    searchInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(e);
        }
    });
}

//  Booting
function init() {
    attachEvents();
    checkSession(); // Checking if admin session already exists
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
