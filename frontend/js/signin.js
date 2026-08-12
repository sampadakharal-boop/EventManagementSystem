const loginForm = document.getElementById('loginForm');
const message = document.getElementById('message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    message.textContent = '';
    message.style.color = '';

    if (!email || !password) {
        message.textContent = 'Please enter your email and password.';
        message.style.color = 'red';
        return;
    }

    try {
        message.textContent = 'Logging in...';

        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                email: email,
                password: password
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            message.textContent = data.message || 'Login failed.';
            message.style.color = 'red';
            return;
        }

        message.textContent = 'Login successful!';
        message.style.color = 'green';

        // Small delay so user can see the success message
        setTimeout(() => {
            if (data.role === 'admin') {
                window.location.href = '/admin/dashboard.html';
            } else {
                window.location.href = '/index.html';
            }
        }, 500);

    } catch (error) {
        console.error('LOGIN ERROR:', error);

        message.textContent =
            'Unable to connect to the server. Please try again.';

        message.style.color = 'red';
    }
});