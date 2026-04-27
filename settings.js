const axios = require('axios');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'uniAuVpvKFbl3Jxirqpeex7Svj+rzDGPexpK2Ne+PfdrxghYVXgyRyQQ5mwjbKdNIhiqJU5AuvZ9FMe6zwyTGg9IaCoFuioUEznkPVeficOHaN0Aw5++w9Fjfzxs8Yg5xiSae5/bAcWOsPsAGToY+gdB04t89/1O/w1cDnyilFU='; // ใส่ Token สำรองเผื่อใน env ยังไม่ได้ตั้งค่า

        const { events } = req.body;

        if (events && events.length > 0) {
            for (const event of events) {
                // เช็คว่ามีคนส่งข้อความมา หรือเพิ่งเชิญบอทเข้ากลุ่ม
                if (event.type === 'message' || event.type === 'join') {
                    
                    const source = event.source;
                    let targetInfo = '';
                    
                    if (source.type === 'group') {
                        targetInfo = `Group ID ของกลุ่มนี้คือ:\n${source.groupId}`;
                    } else if (source.type === 'room') {
                        targetInfo = `Room ID ของห้องนี้คือ:\n${source.roomId}`;
                    } else if (source.type === 'user') {
                        targetInfo = `User ID ของคุณคือ:\n${source.userId}`;
                    }

                    // สร้างข้อความตอบกลับ
                    const replyMessage = {
                        type: 'text',
                        text: `สวัสดีครับ! นี่คือ ID สำหรับใช้ไปกรอกในระบบแอดมินครับ\n\n${targetInfo}`
                    };

                    // ส่งข้อความกลับไปหาคนที่ส่งมา (ใช้ Reply Token)
                    if (event.replyToken) {
                        await axios.post('https://api.line.me/v2/bot/message/reply', {
                            replyToken: event.replyToken,
                            messages: [replyMessage]
                        }, {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${lineToken}`
                            }
                        }).catch(e => console.error("Reply Error:", e.response?.data || e.message));
                    }
                }
            }
        }

        // ต้องตอบ 200 OK กลับไปให้ LINE เสมอเพื่อบอกว่ารับข้อมูลแล้ว
        res.status(200).send('OK');

    } catch (err) {
        console.error('Webhook Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
}
