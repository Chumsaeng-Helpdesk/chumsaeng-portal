/**
 * API Abstraction Layer สำหรับระบบแจ้งเรื่องร้องเรียน (Chumsaeng)
 * ออกแบบมาเพื่อให้สลับการทำงานระหว่าง โหมดจำลอง(LocalStorage) และ ของจริง(Backend PHP) ได้ง่าย
 */

// ======================================
// ⚙️ การตั้งค่าระบบหลัก
// ======================================
const USE_REAL_BACKEND = false; // เปิดใช้ Backend จำลอง (LocalStorage) สำหรับเวอร์ชั่นทดสอบ
const SUPABASE_URL = 'https://qwkwjrxwuoblklzzqnma.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3a3dqcnh3dW9ibGtsenpxbm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzA1NjMsImV4cCI6MjA5MDM0NjU2M30.Nrw3C5MiZblEbiLWnsb-Bl78pIkyrFurk6qSX32krHk';

const API = {
    /**
     * ดึงข้อมูลคำร้องเรียนทั้งหมด
     * @returns {Promise<Array>} รายการคำร้อง
     */
    getComplaints: async function() {
        if (USE_REAL_BACKEND) {
            try {
                // เรียกใช้ Vercel Serverless Function แทนการยิงตรงไป Supabase
                const res = await fetch('/api/getComplaints');
                if (!res.ok) throw new Error('Fetch failed');
                const json = await res.json();
                return json.status === 'success' && Array.isArray(json.data) ? json.data : [];
            } catch (err) {
                console.error("API Error getComplaints", err);
                return [];
            }
        } 
        else {
            // ================= MOCK MODE =================
            let complaints = JSON.parse(localStorage.getItem('chumsaeng_complaints')) || [];
            // กรองเอาข้อมูลทดสอบ/เดโมออก
            return complaints.filter(c => c.ticket_number !== 'R-150326-001');
        }
    },

    /**
     * ยื่นเรื่องร้องเรียนเข้ามาใหม่
     * @param {Object} complaintData ข้อมูลที่กรอกในฟอร์ม
     * @returns {Promise<Boolean>} ความสำเร็จของการเซฟ
     */
    submitComplaint: async function(complaintData) {
        if (USE_REAL_BACKEND) {
            try {
                // จัดเตรียม Payload ให้สอดคล้องกับความต้องการของ Serverless API และ DB Schema
                const payload = {
                    ...complaintData,
                    complaint_type: complaintData.type, // แมป 'type' ไปที่ 'complaint_type'
                    image: complaintData.image || null,
                    // แปลงค่าอายุเป็นตัวเลข หรือ null (เพื่อไม่ให้ส่งสตริง '-' เข้า DB INT)
                    age: (complaintData.age && complaintData.age !== '-') ? parseInt(complaintData.age) : null
                };

                const res = await fetch('/api/submitComplaint', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                if (!res.ok) {
                    const errJson = await res.json().catch(() => ({}));
                    console.error("Submit Complaint Server Error:", errJson);
                    return false;
                }

                const json = await res.json();
                if (json.status === 'success' && json.data) {
                    // นำเลขที่ตั๋วที่เซิร์ฟเวอร์สร้างมาใส่กลับใน object เพื่อแสดงผลใน UI สำเร็จ
                    complaintData.ticket_number = json.data.ticket_number;
                    return true;
                }
                return false;
            } catch (err) {
                console.error("API Error submitComplaint", err);
                return false;
            }
        } 
        else {
            // ================= MOCK MODE =================
            let complaints = JSON.parse(localStorage.getItem('chumsaeng_complaints')) || [];
            complaints.unshift(complaintData); // ใส่ชิ้นแรก
            localStorage.setItem('chumsaeng_complaints', JSON.stringify(complaints));
            return true;
        }
    },

    /**
     * อัปเดตสถานะของคำร้อง (ส่วนใหญ่ใช้โดย Admin หรือ Staff)
     * @param {String} ticketNumber รหัสตั๋ว
     * @param {String} newStatus สถานะใหม่ 'in_progress', 'resolved', 'rejected'
     * @param {Object} extraData ข้อมูลเสริมของช่างเวลาปิดงาน เช่น resolved_note, resolved_image, gps
     * @returns {Promise<Boolean>} สำเร็จหรือไม่
     */
    updateStatus: async function(ticketNumber, newStatus, extraData = {}) {
        if (USE_REAL_BACKEND) {
            try {
                const payload = { 
                    ticket_number: ticketNumber,
                    status: newStatus, 
                    ...extraData 
                };
                const res = await fetch('/api/updateStatus', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                return res.ok;
            } catch (err) {
                console.error("API Error updateStatus", err);
                return false;
            }
        } 
        else {
            // ================= MOCK MODE =================
            let complaints = JSON.parse(localStorage.getItem('chumsaeng_complaints')) || [];
            let targetIndex = complaints.findIndex(c => c.ticket_number === ticketNumber);
            
            if (targetIndex !== -1) {
                complaints[targetIndex].status = newStatus;
                
                // จัดการข้อมูลเสริม (Field Worker Update)
                if (extraData.resolved_note) complaints[targetIndex].resolved_note = extraData.resolved_note;
                if (extraData.resolved_image) complaints[targetIndex].resolved_image = extraData.resolved_image;
                if (extraData.staff_lat) complaints[targetIndex].staff_lat = extraData.staff_lat;
                if (extraData.staff_lng) complaints[targetIndex].staff_lng = extraData.staff_lng;
                if (newStatus === 'resolved' || newStatus === 'rejected') {
                    complaints[targetIndex].resolved_date = new Date().toISOString();
                }

                localStorage.setItem('chumsaeng_complaints', JSON.stringify(complaints));
                return true;
            }
            return false;
        }
    },

    /**
     * ดึงข้อมูลผู้ใช้งาน (ของประชาชน) สมมติจาก Token หรือ Session
     * เนื่องจาก Prototype ไม่มีระบบ Login ประชาชน จึง mock ดึงจาก profile ธรรมดา
     */
    getUserProfile: async function() {
        if (USE_REAL_BACKEND) {
            // ถ้าระบบจริง อาจจะดึงจาก Session ฝั่งเซิร์ฟเวอร์ โดยไม่ต้องส่งพารามิเตอร์ หรือใช้ Token แนบไป
            return { fullname: 'บุคคลหน้าบ้าน', phone: '-' };
        } else {
            return JSON.parse(localStorage.getItem('chumsaeng_user_profile')) || { fullname: 'บุคคลทั่วไป', phone: '-' };
        }
    },

    /**
     * เซฟข้อมูลโปรไฟล์ตัวเอง (ประชาชน)
     */
    saveUserProfile: async function(profileData) {
        if (USE_REAL_BACKEND) {
            // ...
            return true;
        } else {
            let existing = JSON.parse(localStorage.getItem('chumsaeng_user_profile')) || {};
            let merged = { ...existing, ...profileData };
            localStorage.setItem('chumsaeng_user_profile', JSON.stringify(merged));
            return true;
        }
    },

    /**
     * Clear all data (Admin Prototype specific)
     */
    clearAllComplaints: async function() {
        if (!USE_REAL_BACKEND) {
            localStorage.removeItem('chumsaeng_complaints');
            return true;
        }
        return false; // ไม่ให้ลบในระบบจริง
    },

    /**
     * Clear user profile (Logout Prototype specific)
     */
    clearUserProfile: async function() {
        if (!USE_REAL_BACKEND) {
            localStorage.removeItem('chumsaeng_user_profile');
            return true;
        }
        return false;
    }
};
