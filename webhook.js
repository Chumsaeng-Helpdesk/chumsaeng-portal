const { supabase } = require('./_db');
const axios = require('axios');
const cors = require('cors')({ origin: true });

export default async function handler(req, res) {
    // ใช้งาน CORS
    await new Promise((resolve, reject) => {
        cors(req, res, (result) => {
            if (result instanceof Error) return reject(result);
            return resolve(result);
        });
    });

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const body = req.body;
        // Validation เบื้องต้น
        if (!body.ticket_number || !body.status) {
            return res.status(400).json({ status: 'error', message: 'กรุณาส่งรหัสตั๋วและสถานะใหม่' });
        }

        // 1. อัปเดตข้อมูลลงฐานข้อมูล Supabase
        const { data: updatedRow, error } = await supabase
            .from('complaints')
            .update({
                status: body.status,
                resolved_note: body.resolved_note || null,
                resolved_image: body.resolved_image || null,
                staff_lat: body.staff_lat ? parseFloat(body.staff_lat) : null,
                staff_lng: body.staff_lng ? parseFloat(body.staff_lng) : null,
                resolved_date: new Date().toISOString()
            })
            .eq('ticket_number', body.ticket_number)
            .select() // ขอดูข้อมูลที่อัปเดตออกมาด้วย
            .single();

        if (error) throw new Error(error.message);

        // 2. ถ้าสถานะเป็น resolved และมี line_user_id ให้ยิง Push แจ้งประชาชน
        const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (body.status === 'resolved' && updatedRow.line_user_id && lineAccessToken) {
            const pushData = {
                to: updatedRow.line_user_id,
                messages: [
                    {
                        type: 'text',
                        text: `🎉 เทศบาลเมืองชุมแสงได้ดำเนินการแก้ไขปัญหาของคุณเรียบร้อยแล้วครับ!\n\nรหัสอ้างอิง: ${updatedRow.ticket_number}\nปัญหา: ${updatedRow.subject}\nหมายเหตุช่าง: ${updatedRow.resolved_note || 'ปิดงานเสร็จสิ้น'}\n\nขอบพระคุณที่ร่วมเป็นส่วนหนึ่งในการพัฒนาบ้านเมืองของเราครับ 😊`
                    }
                ]
            };

            // แนบภาพความภาคภูมิใจไปด้วย
            if (updatedRow.resolved_image) {
                // สมมุติว่าเก็บเป็น URL จริง ไม่ใช่ Base64
                if(updatedRow.resolved_image.startsWith('http')) {
                    pushData.messages.push({
                        type: 'image',
                        originalContentUrl: updatedRow.resolved_image,
                        previewImageUrl: updatedRow.resolved_image
                    });
                }
            }

            await axios.post('https://api.line.me/v2/bot/message/push', pushData, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${lineAccessToken}`
                }
            }).catch(e => console.error("Line Push Error:", e.response?.data || e.message));
        }

        res.status(200).json({ status: 'success', data: updatedRow });

    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
}
