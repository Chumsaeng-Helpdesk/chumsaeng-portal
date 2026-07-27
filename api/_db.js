const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://qwkwjrxwuoblklzzqnma.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3a3dqcnh3dW9ibGtsenpxbm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NzA1NjMsImV4cCI6MjA5MDM0NjU2M30.Nrw3C5MiZblEbiLWnsb-Bl78pIkyrFurk6qSX32krHk';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
