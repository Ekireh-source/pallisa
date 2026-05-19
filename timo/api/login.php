<?php
require_once 'config.php'; // Includes session_start() and $pdo

// Only accept POST requests for login
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(false, "Invalid request method.", null, 405);
}

// Get the raw POST data (since we are sending JSON from the frontend)
$json = file_get_contents('php://input');
$data = json_decode($json, true);

$email = sanitize($data['email'] ?? '');
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    jsonResponse(false, "Please provide both email and password.");
}

try {
    // 1. Fetch the user by email
    $stmt = $pdo->prepare("SELECT user_id, full_name, password_hash, role FROM users WHERE email = ? LIMIT 1");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // 2. Verify existence and password
    // password_verify automatically handles the salt and Bcrypt algorithm
    if ($user && password_verify($password, $user['password_hash'])) {
        
        // 3. Security Check: Regenerate session ID to prevent Session Fixation attacks
        session_regenerate_id(true);
        
        // 4. Set Session Variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];

        // 5. Send Success Response
        jsonResponse(true, "Login successful", [
            'redirect' => $user['role'] === 'admin' ? 'admin.php' : 'index.php',
            'role' => $user['role'],
            'name' => $user['full_name']
        ]);
    } else {
        // We use a generic error message so attackers don't know if the email exists or not
        jsonResponse(false, "Invalid email or password.");
    }

} catch (Exception $e) {
    error_log("Login Error: " . $e->getMessage());
    jsonResponse(false, "An error occurred during login. Please try again later.", null, 500);
}
?>