<?php
require_once 'config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // รับค่าจากฟอร์ม
    $complaint_type = $_POST['complaint_type'] ?? '';
    $fullname = $_POST['fullname'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $latitude = $_POST['latitude'] ?? null;
    $longitude = $_POST['longitude'] ?? null;
    $details = $_POST['details'] ?? '';
    $line_user_id = $_POST['line_user_id'] ?? null; // ถ้ามี Line Login
    
    // จัดการอัปโหลดไฟล์รูุูปภาพ (ทำแบบจำลองเบื้องต้น)
    $problem_image = null;
    if (isset($_FILES['problem_image']) && $_FILES['problem_image']['error'] == 0) {
        $target_dir = "uploads/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $filename = time() . "_" . basename($_FILES["problem_image"]["name"]);
        $target_file = $target_dir . $filename;
        if (move_uploaded_file($_FILES["problem_image"]["tmp_name"], $target_file)) {
            $problem_image = $target_file;
        }
    }

    // จัดการ user id ใน DB ถ้ามี line_user_id
    $user_internal_id = null;
    if ($line_user_id) {
        $stmt = $pdo->prepare("SELECT id FROM users WHERE line_user_id = ?");
        $stmt->execute([$line_user_id]);
        $user = $stmt->fetch();
        if ($user) {
            $user_internal_id = $user['id'];
        } else {
            // Insert new user
            $stmt = $pdo->prepare("INSERT INTO users (line_user_id, display_name) VALUES (?, ?)");
            $stmt->execute([$line_user_id, $fullname]);
            $user_internal_id = $pdo->lastInsertId();
        }
    }

    // บันทึกลงฐานข้อมูล complaints
    try {
        $sql = "INSERT INTO complaints (user_id, complaint_type, fullname, phone, latitude, longitude, problem_image, details, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $user_internal_id, $complaint_type, $fullname, $phone, 
            $latitude, $longitude, $problem_image, $details
        ]);
        
        $complaint_id = $pdo->lastInsertId();

        // [LINE NOTIFY TO ADMIN]
        // แจ้งเตือนเข้ากลุ่มเจ้าหน้าที่ หรือ Admin ส่วนตัว
        $messageForAdmin = "🔔 มีคำร้องใหม่เข้ามา!\n\n";
        $messageForAdmin .= "ID: #" . $complaint_id . "\n";
        $messageForAdmin .= "ผู้แจ้ง: " . $fullname . "\n";
        $messageForAdmin .= "เบอร์โทร: " . $phone . "\n";
        $messageForAdmin .= "ประเภท: " . $complaint_type . "\n";
        $messageForAdmin .= "รายละเอียด: " . $details . "\n";
        if ($latitude && $longitude) {
            $messageForAdmin .= "พิกัด: https://maps.google.com/?q={$latitude},{$longitude}\n";
        }
        $messageForAdmin .= "\nดูรายละเอียด: http://localhost/chumsaeng/admin/index.php\n";

        // ส่งข้อความหา Admin Group ID (สมมุติว่าเก็บไว้ใน config.php)
        sendLinePushMessage($line_admin_group_id, $messageForAdmin, $line_channel_access_token);

        // นำทางผู้ใช้กลับไปหน้ารายการ (หรือหน้า Success)
        echo "<script>alert('ส่งคำร้องสำเร็จ! เจ้าหน้าที่ได้รับเรื่องแล้ว'); window.location.href='index.html';</script>";

    } catch(PDOException $e) {
        die("Error: " . $e->getMessage());
    }
}
?>
