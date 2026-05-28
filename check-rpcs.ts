import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const getEnvVar = (name: string, fallback: string = ''): string => {
  const val = process.env[name] || fallback;
  if (val === 'undefined' || val === 'null' || !val) return fallback;
  return val.trim();
};

const supabaseUrlRaw = getEnvVar('SUPABASE_URL', getEnvVar('VITE_SUPABASE_URL', 'https://auqwezpczravciclsemz.supabase.co'));
let supabaseUrl = supabaseUrlRaw;
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}
const supabaseServiceKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY', '');
const supabaseAnonKey = getEnvVar('SUPABASE_ANON_KEY', getEnvVar('VITE_SUPABASE_ANON_KEY', ''));

const activeKey = supabaseServiceKey || supabaseAnonKey;

async function run() {
  if (!supabaseUrl || !activeKey) {
    console.error('Missing credentials');
    return;
  }
  
  try {
    const response = await axios.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': activeKey,
        'Authorization': `Bearer ${activeKey}`
      }
    });
    
    const paths = Object.keys(response.data.paths || {});
    const rpcs = paths.filter(p => p.startsWith('/rpc/'));
    
    console.log('=== Registered RPC Functions in Supabase ===');
    if (rpcs.length === 0) {
      console.log('No /rpc/ functions exposed.');
    } else {
      for (const rpc of rpcs) {
        console.log(`- ${rpc}`);
        const methods = response.data.paths[rpc];
        console.log('  Methods:', Object.keys(methods));
        const postDesc = methods.post;
        if (postDesc && postDesc.parameters) {
          console.log('  Parameters:', postDesc.parameters.map((p: any) => `${p.name} (${p.type || p.schema?.type})`));
        }
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
