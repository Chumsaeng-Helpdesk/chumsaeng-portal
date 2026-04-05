const { supabase } = require('./_db');
const cors = require('cors')({ origin: true });

export default async function handler(req, res) {
    // ใช้งาน CORS
    await new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase.from('system_settings').select('*');
            if (error) throw error;
            
            const settings = {};
            data.forEach(item => {
                settings[item.setting_key] = item.setting_value;
            });
            
            return res.status(200).json({ status: 'success', data: settings });
        }

        if (req.method === 'POST') {
            const { line_token, line_target } = req.body;
            
            // เตรียมข้อมูลสำหรับ Upsert (ถ้ามีให้อัปเดต ถ้าไม่มีให้สร้างใหม่)
            const updates = [];
            if (line_token !== undefined) {
                updates.push({ setting_key: 'LINE_CHANNEL_ACCESS_TOKEN', setting_value: line_token });
            }
            if (line_target !== undefined) {
                updates.push({ setting_key: 'LINE_TARGET_ID', setting_value: line_target });
            }

            if (updates.length > 0) {
                const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'setting_key' });
                if (error) throw error;
            }

            return res.status(200).json({ status: 'success', message: 'บันทึกการตั้งค่าสำเร็จ' });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });
    } catch (err) {
        console.error('Settings API Error:', err);
        return res.status(500).json({ status: 'error', message: err.message });
    }
}
