-- ฐานข้อมูลสำหรับระบบแจ้งเรื่องร้องเรียนออนไลน์ เทศบาลเมืองชุมแสง (v2 - รองรับ Staff APP)
-- ชุดคำสั่งนี้ถูกแก้ไขไวยากรณ์ (Syntax) ให้รองรับ PostgreSQL สำหรับการรันบน Supabase เรียบร้อยแล้ว

CREATE TABLE IF NOT EXISTS complaints (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    line_user_id VARCHAR(255) NULL,
    
    -- ข้อมูลผู้แจ้ง (Citizen)
    fullname VARCHAR(150) NOT NULL,
    age INT NULL,
    house_number VARCHAR(50) NULL,
    village_or_road VARCHAR(150) NULL,
    subdistrict VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- ข้อมูลการร้องเรียน
    complaint_type VARCHAR(50) NOT NULL CHECK (complaint_type IN ('maintenance', 'garbage', 'road', 'flood', 'other')),
    subject VARCHAR(200) NOT NULL,
    details TEXT NULL,
    
    -- พิกัดสถานที่เกิดเหตุ
    latitude DECIMAL(10, 8) NULL,
    longitude DECIMAL(11, 8) NULL,
    resolved_address VARCHAR(255) NULL,
    
    -- ไฟล์รูปภาพที่ผู้แจ้งแนบมา (ใช้ TEXT แทน LONGTEXT สำหรับ Postgres)
    image_path TEXT NULL,
    id_card_image TEXT NULL,
    
    -- สถานะการดำเนินงาน
    status VARCHAR(50) DEFAULT 'pending_admin' CHECK (status IN ('pending_admin', 'pending_director', 'pending_clerk', 'pending_mayor', 'assigned', 'in_progress', 'resolved', 'rejected')),
    
    -- ข้อมูลจากเจ้าหน้าที่ปฏิบัติงาน (Field Worker Data)
    assigned_to INT NULL,
    resolved_note TEXT NULL,
    resolved_image TEXT NULL,
    staff_lat DECIMAL(10, 8) NULL,
    staff_lng DECIMAL(11, 8) NULL,
    resolved_date TIMESTAMP NULL,
    
    -- บันทึกภายในของแอดมิน (ผู้แจ้งไม่เห็น)
    admin_note TEXT NULL,
    
    -- วันเวลา (ใช้ TIMESTAMP WITH TIME ZONE ตามมาตรฐาน Supabase)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ตารางตั้งค่าระบบส่วนกลาง (สำหรับแก้ไขผ่านปุ่มหน้าเว็บโดยไม่ต้องแก้ Vercel ENV)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มอธิบายตารางบางส่วน (Postgres syntax)
COMMENT ON COLUMN complaints.ticket_number IS 'รหัสตั๋วคำร้อง เช่น R-20260315-001';
COMMENT ON COLUMN complaints.status IS 'สถานะ: รอดำเนินการ, กำลังทำ, เสร็จสิ้น, ปฏิเสธ/ยกเลิก';

-- ตารางผู้ใช้งานระบบ (อัปเดตเพื่อรองรับ สิทธิ์ Staff)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fullname VARCHAR(150) NOT NULL,
    role VARCHAR(50) DEFAULT 'staff' CHECK (role IN ('admin', 'director', 'clerk', 'mayor', 'staff')),
    department VARCHAR(100) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- (ตัวอย่าง: เพิ่มแอดมินและช่างทดสอบ)
-- INSERT INTO users (username, password_hash, fullname, role) VALUES ('admin', '...', 'ผู้ดูแลระบบส่วนกลาง', 'admin');
-- INSERT INTO users (username, password_hash, fullname, role) VALUES ('staff', '...', 'นายสมชาย กองช่าง', 'staff');
