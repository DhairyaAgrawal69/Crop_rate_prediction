const signInForm = document.getElementById('signInForm');
const signUpForm = document.getElementById('signUpForm');
const authNavItem = document.getElementById('navAuthItem');
const tokenKey = 'kisanToken';
const userNameKey = 'kisanUserName';

const showAlert = (message) => {
  window.alert(message);
};

const setFormSubmitting = (form, isSubmitting, loadingText = 'Please wait...') => {
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  if (!button) return;

  button.disabled = isSubmitting;
  if (isSubmitting) {
    button.dataset.originalText = button.textContent.trim();
    button.textContent = loadingText;
    form.setAttribute('aria-busy', 'true');
  } else {
    const originalText = button.dataset.originalText || button.textContent.trim();
    button.textContent = originalText;
    form.removeAttribute('aria-busy');
  }
};

const saveAuth = (token, name) => {
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userNameKey, name);
};

const clearAuth = () => {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userNameKey);
};

const getToken = () => localStorage.getItem(tokenKey);
const getUserName = () => localStorage.getItem(userNameKey);

const handleApiResponse = async (response) => {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || 'Request failed.');
  }
  return response.json();
};

const buildAuthNav = async () => {
  if (!authNavItem) return;

  const token = getToken();
  const storedName = getUserName();

  if (!token || !storedName) {
    authNavItem.innerHTML = `
      <button type="button" class="btn btn-success me-5"><a href="signUp.html" class="text-white text-decoration-none" style="color: #144c17;">Sign Up</a></button>
    `;
    return;
  }

  authNavItem.innerHTML = `
    <div class="dropdown">
      <button class="btn btn-outline-success dropdown-toggle d-flex align-items-center gap-2" type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
        <span class="avatar-circle">${storedName.charAt(0).toUpperCase()}</span>
        <span class="fw-semibold text-success">${storedName}</span>
      </button>
      <ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="profileDropdown">
        <li class="px-3 py-2 border-bottom">
          <div class="fw-semibold text-dark">${storedName}</div>
          <small class="text-muted">Farmer account</small>
        </li>
        <li><a class="dropdown-item" href="MandiPrices.html"><i class="bi bi-graph-up-arrow me-2"></i>View Prices</a></li>
        <li><a class="dropdown-item" href="AiPredict.html"><i class="bi bi-robot me-2"></i>AI Prediction</a></li>
        <li><hr class="dropdown-divider"></li>
        <li><button class="dropdown-item text-danger" id="logoutButton" type="button"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</button></li>
      </ul>
    </div>
  `;

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      clearAuth();
      window.location.href = 'index.html';
    });
  }
};

if (signInForm) {
  signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const identifier = signInForm.identifier.value.trim();
    const password = signInForm.password.value;

    setFormSubmitting(signInForm, true, 'Signing in...');

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await handleApiResponse(response);
      saveAuth(data.token, data.name);
      window.location.href = 'index.html';
    } catch (error) {
      showAlert(error.message);
    } finally {
      setFormSubmitting(signInForm, false);
    }
  });
}

if (signUpForm) {
  signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = signUpForm.name.value.trim();
    const identifier = signUpForm.identifier.value.trim();
    const password = signUpForm.password.value;
    const confirmPassword = signUpForm.confirmPassword.value;

    if (password !== confirmPassword) {
      showAlert('Passwords do not match.');
      return;
    }

    setFormSubmitting(signUpForm, true, 'Creating account...');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier, password }),
      });

      const data = await handleApiResponse(response);
      saveAuth(data.token, data.name);
      window.location.href = 'index.html';
    } catch (error) {
      showAlert(error.message);
    } finally {
      setFormSubmitting(signUpForm, false);
    }
  });
}

window.addEventListener('DOMContentLoaded', buildAuthNav);
