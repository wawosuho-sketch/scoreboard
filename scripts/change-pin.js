const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// .env.local 로드
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.replace(/\\n/gm, '\n');
    }
    value = value.replace(/(^['"]|['"]$)/g, '').trim();
    env[key] = value;
  }
});

const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'];
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ .env.local 파일에서 Supabase 환경변수를 찾을 수 없습니다.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

async function changeAdminPin() {
  const newPin = process.argv[2];
  
  if (!newPin || newPin.length < 4) {
    console.error("❌ 사용법: node scripts/change-pin.js [새비밀번호]");
    console.error("비밀번호는 최소 4자리 이상이어야 합니다.");
    process.exit(1);
  }

  const pinHash = sha256(newPin);
  
  // 모든 관리자 계정의 비밀번호를 변경합니다 (현재 1개)
  const { data, error } = await supabase
    .from('admin_users')
    .update({ pin_hash: pinHash })
    .eq('role', 'SUPER_ADMIN')
    .select();

  if (error) {
    console.error("❌ 비밀번호 변경 실패:", error.message);
  } else {
    console.log(`✅ 관리자 비밀번호가 성공적으로 변경되었습니다! (적용된 계정 수: ${data.length})`);
    console.log(`새 비밀번호: ${newPin}`);
  }
}

changeAdminPin();
