console.log('app.js loaded');
const registerForm = document.getElementById('registerForm');
const nameInput = document.getElementById('nameInput');
const genderInput = document.getElementById('genderInput');
const ageInput = document.getElementById('ageInput');
const addressInput = document.getElementById('addressInput');
const formMessage = document.getElementById('formMessage');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const refreshBtn = document.getElementById('refreshBtn');
const clearBtn = document.getElementById('clearBtn');
const recordsBody = document.getElementById('recordsBody');
const recordCount = document.getElementById('recordCount');
const toast = document.getElementById('toast');

const heroTotal = document.getElementById('heroTotal');
const heroMale = document.getElementById('heroMale');
const heroFemale = document.getElementById('heroFemale');
const statTotal = document.getElementById('statTotal');
const statMale = document.getElementById('statMale');
const statFemale = document.getElementById('statFemale');
const statAvgAge = document.getElementById('statAvgAge');
const statYoungest = document.getElementById('statYoungest');
const statOldest = document.getElementById('statOldest');

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    toast.classList.remove('hidden');

    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hidden');
    }, 3200);
}

async function fetchStats() {
    try {
        const response = await fetch('/stats');
        if (!response.ok) throw new Error('Unable to load statistics.');
        const stats = await response.json();

        heroTotal.textContent = stats.total;
        heroMale.textContent = stats.male;
        heroFemale.textContent = stats.female;
        statTotal.textContent = stats.total;
        statMale.textContent = stats.male;
        statFemale.textContent = stats.female;
        statAvgAge.textContent = stats.avg_age;
        statYoungest.textContent = stats.youngest;
        statOldest.textContent = stats.oldest;
    } catch (error) {
        console.error(error);
        showToast('Failed to load dashboard stats.', 'error');
    }
}

async function fetchRecords(query = '') {
    try {
        const url = query ? `/search?name=${encodeURIComponent(query)}` : '/records';
        const response = await fetch(url);
        if (!response.ok) throw new Error('Unable to load records.');
        const records = await response.json();

        recordsBody.innerHTML = '';
        if (!records.length) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = '<td colspan="5" class="empty-state">No records found.</td>';
            recordsBody.appendChild(emptyRow);
            recordCount.textContent = '0 records';
            return;
        }

        records.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.name}</td>
                <td>${record.gender}</td>
                <td>${record.age}</td>
                <td>${record.address}</td>
                <td>${record.date}</td>
            `;
            recordsBody.appendChild(row);
        });
        recordCount.textContent = `${records.length} record${records.length === 1 ? '' : 's'}`;
    } catch (error) {
        console.error(error);
        recordsBody.innerHTML = '<tr><td colspan="5" class="empty-state">Could not load records.</td></tr>';
        recordCount.textContent = '0 records';
        showToast('Failed to load records.', 'error');
    }
}

function validateForm() {
    const name = nameInput.value.trim();
    const gender = genderInput.value;
    const age = ageInput.value.trim();
    const address = addressInput.value.trim();

    if (!name) return 'Name is required.';
    if (!['M', 'F'].includes(gender)) return 'Please select a gender.';
    if (!age || Number(age) <= 0 || !Number.isInteger(Number(age))) return 'Age must be a positive whole number.';
    if (!address) return 'Address is required.';
    return '';
}

async function handleRegister(event) {
    event.preventDefault();
    formMessage.textContent = '';

    const validation = validateForm();
    if (validation) {
        formMessage.textContent = validation;
        return;
    }

    const payload = {
        name: nameInput.value.trim(),
        gender: genderInput.value.trim().toUpperCase(),
        age: ageInput.value.trim(),
        address: addressInput.value.trim(),
    };

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        let result = null;

        try {
            result = JSON.parse(text);
        } catch (parseError) {
            console.error('Invalid JSON response:', text);
        }

        if (!response.ok) {
            formMessage.textContent = result?.message || 'Registration failed. Try again.';
            return;
        }

        if (!result || !result.success) {
            formMessage.textContent = result?.message || 'Registration failed.';
            return;
        }

        showToast(result.message, 'success');
        registerForm.reset();
        await fetchStats();
        await fetchRecords();
    } catch (error) {
        console.error(error);
        formMessage.textContent = 'Registration failed. Try again.';
    }
}

async function handleSearch(event) {
    event.preventDefault();
    const query = searchInput.value.trim();
    await fetchRecords(query);
    if (query) {
        showToast(`Showing results for "${query}"`, 'success');
    }
}

async function handleRefresh() {
    searchInput.value = '';
    await fetchStats();
    await fetchRecords();
    showToast('Dashboard refreshed.', 'success');
}

async function handleClear() {
    const confirmed = confirm('Clear all records? This cannot be undone.');
    if (!confirmed) return;

    try {
        const response = await fetch('/clear', { method: 'POST' });
        const result = await response.json();
        if (result.success) {
            showToast(result.message, 'success');
            await fetchStats();
            await fetchRecords();
        } else {
            showToast(result.message || 'Could not clear records.', 'error');
        }
    } catch (error) {
        console.error(error);
        showToast('Clear action failed.', 'error');
    }
}

function attachEvents() {
    console.log('attaching event listeners');

    if (!registerForm) {
        console.error('Register form not found in DOM.');
        return;
    }
    if (!searchBtn || !searchInput || !refreshBtn || !clearBtn) {
        console.error('One or more UI controls are missing:', {
            searchBtn,
            searchInput,
            refreshBtn,
            clearBtn,
        });
        return;
    }

    registerForm.addEventListener('submit', handleRegister);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', event => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleSearch(event);
        }
    });
    refreshBtn.addEventListener('click', handleRefresh);
    clearBtn.addEventListener('click', handleClear);
}

async function init() {
    console.log('init called');
    attachEvents();
    await fetchStats();
    await fetchRecords();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
