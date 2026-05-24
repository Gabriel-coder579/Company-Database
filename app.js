'use strict';
console.log('app.js loaded — public registration page');

// DOM references
const registerForm      = document.getElementById('registerForm');
const nameInput         = document.getElementById('nameInput');
const genderInput       = document.getElementById('genderInput');
const ageInput          = document.getElementById('ageInput');
const addressInput      = document.getElementById('addressInput');
const formMessage       = document.getElementById('formMessage');
const submitBtn         = document.getElementById('submitBtn');
const toast             = document.getElementById('toast');
const successState      = document.getElementById('successState');
const formState         = document.getElementById('formState');
const registerAnotherBtn = document.getElementById('registerAnotherBtn');

// Toast notification
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

// Form validation 
function validateForm() {
    const name    = nameInput.value.trim();
    const gender  = genderInput.value;
    const age     = ageInput.value.trim();
    const address = addressInput.value.trim();

    if (!name)                                          return 'Full name is required.';
    if (!['M', 'F'].includes(gender))                  return 'Please select a gender.';
    if (!age || Number(age) <= 0 || !Number.isInteger(Number(age)))
                                                        return 'Age must be a positive whole number.';
    if (!address)                                       return 'Address is required.';
    return '';
}

// Setting button loading state
function setLoading(btn, isLoading) {
    const text    = btn.querySelector('.btn-text');
    const loading = btn.querySelector('.btn-loading');
    btn.disabled  = isLoading;
    text?.classList.toggle('hidden', isLoading);
    loading?.classList.toggle('hidden', !isLoading);
}

// Showing success screen 
function showSuccess() {
    formState.classList.add('hidden');
    successState.classList.remove('hidden');
}

// Resetting back to form 
function resetToForm() {
    successState.classList.add('hidden');
    formState.classList.remove('hidden');
    registerForm.reset();
    formMessage.textContent = '';
}

// Handling registration submit 
async function handleRegister(event) {
    event.preventDefault();
    formMessage.textContent = '';

    const validationError = validateForm();
    if (validationError) {
        formMessage.textContent = validationError;
        return;
    }

    const payload = {
        name    : nameInput.value.trim(),
        gender  : genderInput.value.trim().toUpperCase(),
        age     : ageInput.value.trim(),
        address : addressInput.value.trim(),
    };

    setLoading(submitBtn, true);

    try {
        const response = await fetch('/register', {
            method  : 'POST',
            headers : { 'Content-Type': 'application/json' },
            body    : JSON.stringify(payload),
        });

        let result = null;
        try {
            result = await response.json();
        } catch {
            console.error('Non-JSON response from /register');
        }

        if (!response.ok || !result?.success) {
            formMessage.textContent = result?.message || 'Registration failed. Please try again.';
            return;
        }

        // Success — showing success screen (no data echoed back to user)
        showSuccess();

    } catch (error) {
        console.error('Registration error:', error);
        formMessage.textContent = 'Network error. Please check your connection and try again.';
    } finally {
        setLoading(submitBtn, false);
    }
}

// Event listeners 
function init() {
    if (!registerForm) {
        console.error('Registration form not found in DOM.');
        return;
    }

    registerForm.addEventListener('submit', handleRegister);

    registerAnotherBtn?.addEventListener('click', resetToForm);
}

// Booting the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
