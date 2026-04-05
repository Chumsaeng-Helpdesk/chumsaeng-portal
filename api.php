<?php
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// โค้ดนี้เป็นเพียง "โครงร่าง (Skeleton)" เพื่อให้นักพัฒนา Backend (PHP) 
// นำไปต่อยอดเพื่อเชื่อมกับฐานข้อมูล MySQL ของจริง
// สำหรับตอนนี้ ถ้าใช้ api.js เชื่อมเข้ามันจะตอบกลับแบบ Mock ไปพลางๆ

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

switch ($action) {
    case 'getComplaints':
        // TODO: เชื่อมต่อ DB > SELECT * FROM complaints ORDER BY created_at DESC
        // ตัวอย่างข้อมูล (Mock Response)
        echo json_encode(['status' => 'success', 'data' => []]);
        break;

    case 'submitComplaint':
        // รับค่า JSON จาก Frontend
        $input = json_decode(file_get_contents('php://input'), true);
        
        // TODO: ตรวจสอบความถูกต้อง (Validation)
        // TODO: บันทึกรูปลงโฟลเดอร์ uploads และเอาชื่อภาพใส่ DB แกะ base64
        // TODO: INSERT INTO complaints (...) VALUES (...)
        
        // จำลองสำเร็จ
        echo json_encode(['status' => 'success', 'message' => 'บันทึกสำเร็จ', 'ticket_number' => 'TC-BACKEND-001']);
        break;

    case 'updateStatus':
        $input = json_decode(file_get_contents('php://input'), true);
        $ticket_id = isset($input['ticket_number']) ? $input['ticket_number'] : '';
        $new_status = isset($input['status']) ? $input['status'] : '';
        
        // ฟิลด์ของช่าง
        $resolved_note = isset($input['resolved_note']) ? $input['resolved_note'] : null;
        $resolved_image = isset($input['resolved_image']) ? $input['resolved_image'] : null;
        $staff_lat = isset($input['staff_lat']) ? $input['staff_lat'] : null;
        $staff_lng = isset($input['staff_lng']) ? $input['staff_lng'] : null;

        // TODO: UPDATE complaints SET status = ?, resolved_note = ? WHERE ticket_number = ?
        
        echo json_encode(['status' => 'success', 'message' => "อัปเดตสถานะเป็น $new_status เรียบร้อย"]);
        break;

    case 'login':
        // TODO: ตรวจสอบ Username / Password จากตาราง `users`
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input['username'] == 'admin' && $input['password'] == 'admin123') {
            echo json_encode(['status' => 'success', 'role' => 'admin', 'name' => 'ผู้ดูแลระบบส่วนกลาง', 'token' => 'fake_jwt_token_admin']);
        } else if ($input['username'] == 'staff' && $input['password'] == '1234') {
            echo json_encode(['status' => 'success', 'role' => 'staff', 'name' => 'ช่างชุมแสง', 'token' => 'fake_jwt_token_staff']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'รหัสผ่านไม่ถูกต้อง']);
        }
        break;

    default:
        // ตรวจสอบไม่ได้
        echo json_encode(['status' => 'error', 'message' => 'Invalid Request']);
}
?>
