const { createClient } = require('@supabase/supabase-js');

// กำหนด URL และ Key จาก Environment Variables ของ Vercel
const supabaseUrl = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
