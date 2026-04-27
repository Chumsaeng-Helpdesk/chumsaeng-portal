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
        const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const events = req.body.events;

        if (!events || events.length === 0) {
            return res.status(200).send('OK');
        }

        // วนลูปสำหรับทุกเหตุการณ์ที่ส่งเข้ามา
        for (const event of events) {
            // เราสนใจแค่ event ประเภท 'message' และส่งมาเป็น 'text' เท่านั้น
            if (event.type === 'message' && event.message.type === 'text') {
                const userMessage = event.message.text.trim();
                const replyToken = event.replyToken;
                const userId = event.source.userId;

                // หากประชาชนพิมพ์คำว่า "เช็คสถานะ" หรือคลิกปุ่มจาก Rich Menu
                if (userMessage === 'เช็คสถานะ' || userMessage === 'เช็คสถานะคำร้อง') {
                    
                    // ไปค้นหาตั๋วล่าสุดที่คนนี้สร้างไว้ใน 30 วันที่ผ่านมา
                    const { data: tickets, error } = await supabase
                        .from('complaints')
                        .select('ticket_number, subject, status, created_at')
                        .eq('line_user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    let replyText = '';

                    if (error || !tickets || tickets.length === 0) {
                        replyText = 'ขออภัยครับ ไม่พบประวัติการแจ้งเรื่องร้องเรียนของคุณในระบบเลยครับ 🥺\nคุณสามารถกดเมนู "ยื่นคำร้องใหม่" ด้านล่างได้เลยนะครับ';
                    } else {
                        // พบข้อมูล
                        const latest = tickets[0];
                        const typeLabels = {
                            'pending': '⏳ รอดำเนินการ',
                            'in_progress': '🛠️ กำลังออกซ่อม',
                            'resolved': '✅ แก้ไขเสร็จสิ้น',
                            'rejected': '❌ ปฏิเสธการรับเรื่อง'
                        };
                        
                        replyText = `ค้นพบข้อมูลล่าสุดของคุณครับทั่น!\n\n` +
                                    `รหัสตั๋ว: ${latest.ticket_number}\n` +
                                    `เรื่อง: ${latest.subject}\n` +
                                    `สถานะ: ${typeLabels[latest.status] || latest.status}\n\n`;

                        if (tickets.length > 1) {
                            replyText += `(คุณมีรายการร้องเรียนทั้งหมด ${tickets.length} รายการ)`;
                        }
                    }

                    // ยิง Reply กลับไปให้ผู้ใช้ฟรีๆ ภายใน 1 วินาที!
                    await axios.post('https://api.line.me/v2/bot/message/reply', {
                        replyToken: replyToken,
                        messages: [{ type: 'text', text: replyText }]
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${lineAccessToken}`
                        }
                    });

                }
            }
        }

        // ตอบ 200 OK ให้ LINE ทราบว่าเรารับข้อมูลสำเร็จแล้ว (บรรทัดนี้สำคัญมาก)
        res.status(200).send('OK');

    } catch (err) {
        console.error('Webhook Error:', err);
        // ถึงพังก็ต้องส่ง 200 OK ไม่งั้น LINE จะงอนแล้วไม่ส่งมาอีก
        res.status(200).send('Error but OK');
    }
}
