<?php
// Include the database connection from config.php
require_once 'config.php';

echo "<!DOCTYPE html><html lang='en'><head><title>Database Setup</title><style>body{font-family: Arial, sans-serif; padding: 20px; background: #f8fafc; color: #0f172a;} .success{color: #166534; background: #dcfce7; padding: 10px; border-radius: 5px; margin-bottom: 10px;} .error{color: #991b1b; background: #fee2e2; padding: 10px; border-radius: 5px; margin-bottom: 10px;}</style></head><body>";
echo "<h2>System Initialization: Seeding Dummy Data</h2>";

try {
    // 1. CLEAR EXISTING DATA (To prevent duplicate errors during testing)
    // Disabling foreign key checks temporarily so we can truncate tables safely
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
    $pdo->exec("TRUNCATE TABLE teacher_assignments");
    $pdo->exec("TRUNCATE TABLE learners");
    $pdo->exec("TRUNCATE TABLE subjects");
    $pdo->exec("TRUNCATE TABLE streams");
    $pdo->exec("TRUNCATE TABLE classes");
    $pdo->exec("TRUNCATE TABLE users");
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");
    echo "<div class='success'>✅ Tables cleared successfully.</div>";

    // 2. CREATE SAMPLE USERS
    $password = 'password123'; // Default password for all test accounts
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)");
    
    // Admin User (Matching the "super" from your screenshot)
    $stmt->execute(['System Administrator', 'super@school.com', $hashed_password, 'admin']);
    $admin_id = $pdo->lastInsertId();
    
    // Teacher Users
    $stmt->execute(['John Doe', 'teacher@school.com', $hashed_password, 'teacher']);
    $teacher_id_1 = $pdo->lastInsertId();

    $stmt->execute(['Jane Smith', 'jane@school.com', $hashed_password, 'teacher']);
    $teacher_id_2 = $pdo->lastInsertId();

    echo "<div class='success'>✅ Users created successfully.</div>";

    // 3. CREATE ACADEMIC INFRASTRUCTURE
    // Classes
    $stmt = $pdo->prepare("INSERT INTO classes (class_name) VALUES (?)");
    $stmt->execute(['Senior 3']); $s3_id = $pdo->lastInsertId();
    $stmt->execute(['Senior 4']); $s4_id = $pdo->lastInsertId();

    // Streams
    $stmt = $pdo->prepare("INSERT INTO streams (class_id, stream_name) VALUES (?, ?)");
    $stmt->execute([$s3_id, 'S3 North']); $s3_north_id = $pdo->lastInsertId();
    $stmt->execute([$s3_id, 'S3 South']); $s3_south_id = $pdo->lastInsertId();
    $stmt->execute([$s4_id, 'S4 Blue']);  $s4_blue_id = $pdo->lastInsertId();

    // Subjects
    $stmt = $pdo->prepare("INSERT INTO subjects (subject_name, subject_code) VALUES (?, ?)");
    $stmt->execute(['Physics', 'PHY']); $phy_id = $pdo->lastInsertId();
    $stmt->execute(['Mathematics', 'MTC']); $mtc_id = $pdo->lastInsertId();
    $stmt->execute(['Chemistry', 'CHE']); $che_id = $pdo->lastInsertId();

    echo "<div class='success'>✅ Classes, Streams, and Subjects created.</div>";

    // 4. ENROLL SAMPLE LEARNERS INTO S3 NORTH
    $stmt = $pdo->prepare("INSERT INTO learners (stream_id, admission_number, full_name) VALUES (?, ?, ?)");
    $learners = [
        ['U001', 'Kato Paul'],
        ['U002', 'Babirye Sarah'],
        ['U003', 'Mukasa Peter'],
        ['U004', 'Nalubega Grace'],
        ['U005', 'Okelo James']
    ];
    foreach ($learners as $l) {
        $stmt->execute([$s3_north_id, $l[0], $l[1]]);
    }
    echo "<div class='success'>✅ Sample Learners enrolled in S3 North.</div>";

    // 5. ASSIGN TEACHERS (Crucial for the dashboard logic!)
    $stmt = $pdo->prepare("INSERT INTO teacher_assignments (teacher_id, stream_id, subject_id) VALUES (?, ?, ?)");
    
    // John Doe (teacher@school.com) teaches Physics to S3 North and S4 Blue
    $stmt->execute([$teacher_id_1, $s3_north_id, $phy_id]);
    $stmt->execute([$teacher_id_1, $s4_blue_id, $phy_id]);

    // Jane Smith (jane@school.com) teaches Math to S3 North
    $stmt->execute([$teacher_id_2, $s3_north_id, $mtc_id]);

    echo "<div class='success'>✅ Teachers assigned to Streams and Subjects.</div>";

    // ==========================================
    // SUCCESS SUMMARY
    // ==========================================
    echo "<h3>🎉 Setup Complete! You can now log in with the following accounts:</h3>";
    echo "<table border='1' cellpadding='10' style='border-collapse: collapse; width: 100%; background: white;'>";
    echo "<tr style='background: #e2e8f0;'><th>Role</th><th>Email / Username</th><th>Password</th></tr>";
    echo "<tr><td><strong>Admin</strong></td><td>super@school.com</td><td>password123</td></tr>";
    echo "<tr><td><strong>Teacher 1 (Physics)</strong></td><td>teacher@school.com</td><td>password123</td></tr>";
    echo "<tr><td><strong>Teacher 2 (Math)</strong></td><td>jane@school.com</td><td>password123</td></tr>";
    echo "</table>";

    echo "<br><a href='../login.php' style='display: inline-block; padding: 10px 20px; background: #0a58ca; color: white; text-decoration: none; border-radius: 8px;'>Go to Login Page</a>";

} catch (PDOException $e) {
    echo "<div class='error'>❌ Database Error: " . htmlspecialchars($e->getMessage()) . "</div>";
    echo "<p>Please ensure your database is running and `config.php` has the correct credentials.</p>";
}

echo "</body></html>";
?>