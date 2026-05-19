<?php
session_start();
if (isset($_SESSION['user_id'])) {
    $redirect_url = ($_SESSION['role'] === 'admin') ? 'admin_dashboard.php' : 'index.php';
    header("Location: " . $redirect_url);
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Sign In | Academic System</title>
    <link rel="stylesheet" href="styles.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="login-layout">

    <div class="login-split-container">
        
        <div class="login-brand-side">
            <div class="brand-bg-circle circle-large"></div>
            <div class="brand-bg-circle circle-small"></div>

            <div class="brand-content-top">
                <div class="logo-line"></div>
                <h1>Empower Your School with Academic System</h1>
                
                <div class="brand-sub-profile">
                    <div class="brand-avatar">AS</div>
                    <div class="brand-sub-text">
                        <strong>Academic System</strong><br>
                        <span>Administration System</span>
                    </div>
                </div>
            </div>

            <div class="brand-content-bottom">
                <p>&copy; 2026 Academic System. All rights reserved.</p>
            </div>
        </div>

        <div class="login-form-side">
            <div class="form-wrapper">
                <div class="form-header">
                    <h2>Sign in</h2>
                    <p>Enter your details to access your dashboard.</p>
                </div>

                <div id="loginError" class="alert alert-error" style="display: none;"></div>

                <form id="loginForm">
                    <div class="input-group">
                        <label for="email">Username / Email</label>
                        <div class="input-wrapper">
                            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            <input type="email" id="email" name="email" placeholder="teacher@school.com" required autocomplete="email">
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                            <input type="password" id="password" name="password" placeholder="••••••••" required>
                            <button type="button" class="toggle-password" id="togglePassword">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="eyeIcon"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                        </div>
                    </div>

                    <div class="form-actions">
                        <label class="remember-me">
                            <input type="checkbox" name="remember">
                            <span>Remember me</span>
                        </label>
                        <a href="#" class="forgot-link">Forgot password?</a>
                    </div>

                    <button type="submit" class="btn primary-btn w-100" id="loginBtn">Sign In</button>
                </form>
            </div>
        </div>
    </div>

    <script src="auth.js"></script>
</body>
</html>