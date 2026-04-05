<?php
// Database configuration
$db_host = 'localhost';
$db_user = 'root'; // default for local
$db_pass = '';
$db_name = 'chumsaeng_complaints';

// Line OA Configuration
$line_channel_access_token = 'YOUR_LINE_CHANNEL_ACCESS_TOKEN'; // แทนที่ด้วย Token ของ Line OA
$line_admin_group_id = 'YOUR_ADMIN_GROUP_ID'; // แทนที่ด้วย Group ID ของเจ้าหน้าที่

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Function ส่ง Push Message (Line Messaging API)
function sendLinePushMessage($to_user_id, $message, $access_token) {
    if (!$to_user_id || empty($to_user_id)) {
        return; // ไม่พบผู้รับ
    }
    
    $url = 'https://api.line.me/v2/bot/message/push';
    $messages = [
        'type' => 'text',
        'text' => $message
    ];

    $data = [
        'to' => $to_user_id,
        'messages' => [$messages]
    ];

    $post_data = json_encode($data);
    $headers = [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $access_token
    ];

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $post_data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    $err = curl_error($ch);
    curl_close($ch);
    
    return $result;
}
?>
