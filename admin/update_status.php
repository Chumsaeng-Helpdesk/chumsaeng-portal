<?php
require_once '../config.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $complaint_id = $_POST['complaint_id'];
    $new_status = $_POST['new_status'];

    if ($complaint_id && $new_status) {
        
        // อัปเดตสถานะใน DB
        $stmt = $pdo->prepare("UPDATE complaints SET status = ? WHERE id = ?");
        $stmt->execute([$new_status, $complaint_id]);

        // ดึงข้อมูลผู้แจ้งเพื่อตรวจสอบว่ามี line_user_id หรือไม่
        $stmt = $pdo->prepare("SELECT c.*, u.line_user_id FROM complaints c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ?");
        $stmt->execute([$complaint_id]);
        $complaint = $stmt->fetch();

        // [LINE NOTIFY TO CITIZEN]
        if ($complaint && !empty($complaint['line_user_id'])) {
            $status_th = "";
            if ($new_status == 'pending') $status_th = "รอรับเรื่อง";
            if ($new_status == 'in_progress') $status_th = "กำลังดำเนินการ";
            if ($new_status == 'completed') $status_th = "ดำเนินการเสร็จสิ้นเรียบร้อยแล้ว ✅";

            $messageForCitizen = "เทศบาลเมืองชุมแสง แจ้งอัปเดตสถานะคำร้องของท่าน:\n\n";
            $messageForCitizen .= "คำร้องหมายเลข: #" . $complaint_id . "\n";
            $messageForCitizen .= "ประเภท: " . $complaint['complaint_type'] . "\n";
            $messageForCitizen .= "สถานะปัจจุบัน: " . $status_th . "\n";
            $messageForCitizen .= "\nขอบคุณที่ใช้บริการระบบคำร้องออนไลน์ครับ🙏";

            // ส่งข้อความหาประชาชน (Push Message)
            sendLinePushMessage($complaint['line_user_id'], $messageForCitizen, $line_channel_access_token);
        }

        echo "<script>alert('อัปเดตสถานะและแจ้งเตือนสำเร็จ!'); window.location.href='index.php';</script>";
    }
} else {
    header("Location: index.php");
}
?>
