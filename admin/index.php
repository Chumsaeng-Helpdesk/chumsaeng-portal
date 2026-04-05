<?php
require_once '../config.php';

// ดึงรายการคำร้องทั้งหมด
$stmt = $pdo->query("SELECT * FROM complaints ORDER BY created_at DESC");
$complaints = $stmt->fetchAll();

// คำนวณสถิติ
$total = count($complaints);
$pending = 0; $in_progress = 0; $completed = 0;
foreach($complaints as $c) {
    if($c['status'] == 'pending') $pending++;
    if($c['status'] == 'in_progress') $in_progress++;
    if($c['status'] == 'completed') $completed++;
}
?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - ระบบจัดการคำร้องเทศบาลเมืองชุมแสง</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 flex">

    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 text-white min-h-screen">
        <div class="p-6 text-center border-b border-slate-800">
            <h1 class="text-xl font-bold">ระบบส่วนหลังบ้าน</h1>
            <p class="text-sm text-gray-400">เทศบาลเมืองชุมแสง</p>
        </div>
        <nav class="p-4 space-y-2">
            <a href="#" class="block px-4 py-3 bg-blue-600 rounded-lg"><i class="fas fa-tachometer-alt mr-2"></i> Dashboard</a>
            <a href="#" class="block px-4 py-3 hover:bg-slate-800 rounded-lg"><i class="fas fa-list mr-2"></i> จัดการคำร้อง</a>
            <a href="#" class="block px-4 py-3 hover:bg-slate-800 rounded-lg"><i class="fas fa-newspaper mr-2"></i> จัดการข่าวสาร</a>
        </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6">ภาพรวมคำร้อง</h2>

        <!-- Stats -->
        <div class="grid grid-cols-4 gap-6 mb-8">
            <div class="bg-white p-6 rounded-xl shadow border-t-4 border-blue-500">
                <p class="text-sm text-gray-500 font-semibold mb-1">คำร้องทั้งหมด</p>
                <p class="text-3xl font-bold"><?= $total ?></p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-t-4 border-yellow-500">
                <p class="text-sm text-gray-500 font-semibold mb-1">รอดำเนินการ</p>
                <p class="text-3xl font-bold text-yellow-600"><?= $pending ?></p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-t-4 border-blue-400">
                <p class="text-sm text-gray-500 font-semibold mb-1">กำลังแก้ไข</p>
                <p class="text-3xl font-bold text-blue-500"><?= $in_progress ?></p>
            </div>
            <div class="bg-white p-6 rounded-xl shadow border-t-4 border-green-500">
                <p class="text-sm text-gray-500 font-semibold mb-1">เสร็จสิ้น</p>
                <p class="text-3xl font-bold text-green-600"><?= $completed ?></p>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-xl shadow overflow-hidden">
            <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                <h3 class="font-bold text-lg">รายการคำร้องล่าสุด</h3>
            </div>
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-100 text-gray-600">
                        <th class="p-4 border-b">ID</th>
                        <th class="p-4 border-b">วันที่</th>
                        <th class="p-4 border-b">ประเภท</th>
                        <th class="p-4 border-b">ผู้แจ้ง</th>
                        <th class="p-4 border-b">สถานะ</th>
                        <th class="p-4 border-b text-center">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($complaints as $row): ?>
                    <tr class="hover:bg-gray-50">
                        <td class="p-4 border-b border-gray-100">#<?= $row['id'] ?></td>
                        <td class="p-4 border-b border-gray-100"><?= date('d/m/Y H:i', strtotime($row['created_at'])) ?></td>
                        <td class="p-4 border-b border-gray-100"><?= $row['complaint_type'] ?></td>
                        <td class="p-4 border-b border-gray-100">
                            <?= htmlspecialchars($row['fullname']) ?><br>
                            <span class="text-xs text-gray-500"><?= htmlspecialchars($row['phone']) ?></span>
                        </td>
                        <td class="p-4 border-b border-gray-100">
                            <?php if($row['status'] == 'pending'): ?>
                                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">รอรับเรื่อง</span>
                            <?php elseif($row['status'] == 'in_progress'): ?>
                                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">กำลังดำเนินการ</span>
                            <?php elseif($row['status'] == 'completed'): ?>
                                <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">เสร็จสิ้น</span>
                            <?php endif; ?>
                        </td>
                        <td class="p-4 border-b border-gray-100 text-center">
                            <!-- Link ไปอัปเดตสถานะ (ส่งค่าผ่าน GET เป็นตัวอย่าง) -->
                            <form action="update_status.php" method="POST" class="inline-block">
                                <input type="hidden" name="complaint_id" value="<?= $row['id'] ?>">
                                <select name="new_status" class="border rounded p-1 text-sm mr-2">
                                    <option value="pending" <?= $row['status']=='pending'?'selected':'' ?>>รอรับเรื่อง</option>
                                    <option value="in_progress" <?= $row['status']=='in_progress'?'selected':'' ?>>กำลังดำเนินการ</option>
                                    <option value="completed" <?= $row['status']=='completed'?'selected':'' ?>>เสร็จสิ้น</option>
                                </select>
                                <button type="submit" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">อัปเดต</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </main>

</body>
</html>
