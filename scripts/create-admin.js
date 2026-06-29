const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function createAdmin() {
  const pin = "0000";
  const pinHash = sha256(pin); // No salt for simplicity
  
  const { data, error } = await supabase.from('admin_users').insert({
    name: 'Super Admin',
    role: 'SUPER_ADMIN',
    pin_hash: pinHash,
    pin_salt: '',
    is_active: true
  }).select();

  if (error) {
    console.error("Admin insert error:", error);
  } else {
    console.log("Admin created successfully:", data);
  }
}

createAdmin();
