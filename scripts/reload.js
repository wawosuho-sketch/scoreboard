const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function reload() {
  const { error } = await supabase.rpc('reload_schema', {});
  console.log("RPC Error:", error);
  // Actually rpc might not exist. Let's just use SQL via postgres node module, 
  // or we can just restart supabase locally.
}

reload();
