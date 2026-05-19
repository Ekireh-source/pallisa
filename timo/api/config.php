<?php
// =========================================================
// 1. STRICT CORS HEADERS (For Frontend/Backend Separation)
// =========================================================
// In production, change '*' to your actual frontend domain (e.g., 'https://app.yourschool.com')
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight requests for modern browsers
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// =========================================================
// 2. SECURE SESSION MANAGEMENT
// =========================================================
// Prevents JavaScript from accessing the session cookie (XSS protection)
ini_set('session.cookie_httponly', 1);
// Ensure cookies are only sent over HTTPS (Set to 1 in production)
ini_set('session.cookie_secure', 0); 
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Strict');

session_start();

// =========================================================
// 3. DATABASE CONNECTION (Strict PDO)
// =========================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'timo');
define('DB_USER', 'root'); // Change in production
define('DB_PASS', '');     // Change in production

try {
    // We use the charset=utf8mb4 for full Unicode support (emojis, specific characters)
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Fail hard on SQL errors
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Fetch arrays, not objects
        PDO::ATTR_EMULATE_PREPARES   => false,                  // True native prepared statements (SQL Injection prevention)
    ];
    
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // CRITICAL: Never expose the real database error to the frontend!
    error_log("Database Connection Failed: " . $e->getMessage());
    echo json_encode([
        "success" => false, 
        "message" => "A critical database error occurred. Please contact the administrator.",
        "data" => null
    ]);
    exit();
}

// =========================================================
// 4. GLOBAL API HELPER FUNCTIONS
// =========================================================

/**
 * Standardizes all JSON responses sent back to the HTML frontend.
 */
function jsonResponse($success, $message, $data = null, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data'    => $data
    ]);
    exit();
}

/**
 * Sanitizes basic text inputs to prevent XSS.
 */
function sanitize($input) {
    if (is_array($input)) {
        return array_map('sanitize', $input);
    }
    return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
}

/**
 * Security Gateway: Ensures the user is logged in.
 * Call this at the top of protected API files (like attendance or marking).
 */
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(false, "Unauthorized Access. Please log in.", null, 401);
    }
}

/**
 * Security Gateway: Ensures the user is an Admin.
 */
function requireAdmin() {
    requireAuth();
    if ($_SESSION['role'] !== 'admin') {
        jsonResponse(false, "Access Denied: Administrator privileges required.", null, 403);
    }
}
?>