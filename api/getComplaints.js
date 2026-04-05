const { supabase } = require('./_db');
const cors = require('cors')({ origin: true });

export default async function handler(req, res) {
    // ใช้งาน CORS เพื่อให้หน้าเว็บเรา (Frontend) สามารถเรียก API ตัวนี้ข้ามขอบเขตโดเมนได้
    await new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // ดึงข้อมูล 50 รายการล่าสุดจากฐานข้อมูลตาราง complaints เพื่อนำไปทำแดชบอร์ด
        const { data, error } = await supabase
            .from('complaints')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ status: 'error', data: [], message: error.message });
        }

        // ก่อนส่งกลับต้องแปลงวันที่ created_at ให้กลับไปเป็น format date ที่ Frontend ของเราเข้าใจ
        const formattedData = data.map(c => ({
            ...c,
            date: c.created_at, // API.js ที่เราทำไว้จะมองหาตัวแปรรูปแบบ date เดิม
            image: c.image_path, // แปลงตัวแปร image กลับมาใช้ชื่อเดิมที่หน้า HTML คาดหวัง
            type: c.complaint_type
        }));

        res.status(200).json({ status: 'success', data: formattedData });
    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
}
