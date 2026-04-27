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
        if (!body.fullname || !body.complaint_type || !body.subject || !body.phone) {
            return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อมูลสำคัญให้ครบถ้วน' });
        }

        // 1. ดึงรหัสตั๋วล่าสุดเพื่อรันเลข
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        const { data: latestRow } = await supabase
            .from('complaints')
            .select('ticket_number')
            .like('ticket_number', `R-${dateStr}-%`)
            .order('created_at', { ascending: false })
            .limit(1);

        let nextNum = 1;
        if (latestRow && latestRow.length > 0) {
            const lastTicket = latestRow[0].ticket_number;
            const parts = lastTicket.split('-');
            if (parts.length === 3) {
                nextNum = parseInt(parts[2], 10) + 1;
            }
        }
        const ticketNumber = `R-${dateStr}-${String(nextNum).padStart(3, '0')}`;

        // 2. บันทึกข้อมูลลงฐานข้อมูล Supabase
        const { data: newRow, error } = await supabase
            .from('complaints')
            .insert([{
                ticket_number: ticketNumber,
                line_user_id: body.line_user_id || null, // ถ้าผูก LINE LIFF ไว้
                fullname: body.fullname,
                age: parseInt(body.age) || null,
                house_number: body.house_number || '-',
                village_or_road: body.village_or_road || '-',
                subdistrict: body.subdistrict || '-',
                phone: body.phone,
                complaint_type: body.complaint_type,
                subject: body.subject,
                details: body.details || '-',
                latitude: body.latitude ? parseFloat(body.latitude) : null,
                longitude: body.longitude ? parseFloat(body.longitude) : null,
                image_path: body.image || null, // ส่ง Base64 มาก่อนในช่วง Prototype
                status: 'pending'
            }])
            .select();

        if (error) throw new Error(error.message);

        // 3. ยิงแจ้งเตือนผ่าน LINE Messaging API เข้ากลุ่มหรือบุคคล
        // ดึงค่าการตั้งค่าจากตาราง system_settings (เพื่อให้แก้ผ่านหน้าเว็บได้)
        const { data: settingsData } = await supabase.from('system_settings').select('*');
        const settings = {};
        if (settingsData) {
            settingsData.forEach(item => settings[item.setting_key] = item.setting_value);
        }

        const lineToken = settings['LINE_CHANNEL_ACCESS_TOKEN'] || process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const lineTarget = settings['LINE_TARGET_ID'] || process.env.LINE_TARGET_ID;

        if (lineToken && lineTarget) {
            const typeLabels = {
                'maintenance': 'ไฟฟ้า/ประปา',
                'garbage': 'ปัญหาขยะ',
                'road': 'ถนนชำรุด',
                'flood': 'แจ้งน้ำท่วม',
                'other': 'เรื่องอื่นๆ'
            };
            const typeLabel = typeLabels[body.complaint_type] || 'อื่นๆ';
            
            // หน้าเว็บแอดมินสำหรับแปะในปุ่ม (หาจาก ENV ก่อน ถ้าไม่มีพยายามใช้ของ Vercel)
            const adminUrl = process.env.ADMIN_URL || 
                             (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}/admin.html` : "https://google.com");

            const flexMessage = {
                type: "flex",
                altText: `🚨 คำร้องใหม่: ${body.subject}`,
                contents: {
                    type: "bubble",
                    header: {
                        type: "box",
                        layout: "vertical",
                        backgroundColor: "#dc2626", // สีแดงแจ้งเตือน
                        contents: [
                            {
                                type: "text",
                                text: "🚨 มีคำร้องเรื่องใหม่",
                                weight: "bold",
                                size: "lg",
                                color: "#ffffff"
                            }
                        ]
                    },
                    body: {
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        contents: [
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "รหัสตั๋ว", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: ticketNumber, wrap: true, color: "#333333", size: "sm", flex: 5, weight: "bold" }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "หมวดหมู่", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: typeLabel, wrap: true, color: "#333333", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "หัวข้อ", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: body.subject, wrap: true, color: "#333333", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "สถานที่", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: `ต.${body.subdistrict}`, wrap: true, color: "#333333", size: "sm", flex: 5 }
                                ]
                            },
                            {
                                type: "box",
                                layout: "baseline",
                                spacing: "sm",
                                contents: [
                                    { type: "text", text: "ผู้แจ้ง", color: "#aaaaaa", size: "sm", flex: 2 },
                                    { type: "text", text: `${body.fullname} (${body.phone})`, wrap: true, color: "#333333", size: "sm", flex: 5 }
                                ]
                            }
                        ]
                    },
                    footer: {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        contents: [
                            {
                                type: "button",
                                style: "primary",
                                height: "sm",
                                color: "#15803d", // สีเขียวแบรนด์
                                action: {
                                    type: "uri",
                                    label: "เปิดดูรายละเอียดงาน",
                                    uri: adminUrl
                                }
                            }
                        ]
                    }
                }
            };
            
            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: lineTarget,
                messages: [flexMessage]
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${lineToken}`
                }
            }).catch(e => console.error("Line Messaging API Error:", e.response?.data || e.message));
        }

        res.status(200).json({ status: 'success', data: newRow[0] });

    } catch (err) {
        console.error('API Error:', err);
        res.status(500).json({ status: 'error', message: err.message });
    }
}
