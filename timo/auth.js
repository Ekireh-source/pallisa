document.addEventListener("DOMContentLoaded", () => {
    
    // =========================================================
    // 1. PASSWORD VISIBILITY TOGGLE
    // =========================================================
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener('click', function () {
            // Check current type and swap
            const currentType = passwordInput.getAttribute('type');
            const newType = currentType === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', newType);
            
            // Visual feedback: change icon color when password is visible
            this.style.color = newType === 'text' ? '#2563eb' : '#94a3b8';
        });
    }

    // =========================================================
    // 2. LOGIN FORM SUBMISSION
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent standard HTML form submission
            
            const btn = document.getElementById('loginBtn');
            const errorBox = document.getElementById('loginError');
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // UX: Loading state
            btn.innerText = "Signing in...";
            btn.disabled = true;
            errorBox.style.display = 'none';

            try {
                // Call the isolated PHP API
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email, password: password })
                });

                const result = await response.json();

                if (result.success) {
                    // Redirect based on backend instruction (Admin vs Teacher)
                    window.location.href = result.data.redirect;
                } else {
                    // Show error message returned from API
                    errorBox.innerText = result.message;
                    errorBox.style.display = 'block';
                    btn.innerText = "Sign In";
                    btn.disabled = false;
                }
            } catch (error) {
                // Handle network errors or server crashes
                console.error("Network Error:", error);
                errorBox.innerText = "Cannot connect to the server. Please check your internet connection.";
                errorBox.style.display = 'block';
                btn.innerText = "Sign In";
                btn.disabled = false;
            }
        });
    }
});