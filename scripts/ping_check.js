const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');
const http = require('https');

// Load environment variables from mobile .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ HATA: .env.local dosyasında EXPO_PUBLIC_SUPABASE_URL veya EXPO_PUBLIC_SUPABASE_ANON_KEY bulunamadı.");
  process.exit(1);
}

console.log("=========================================");
console.log("   BİLENEHALAL MOBİL PING KONTROLÜ     ");
console.log("=========================================");
console.log(`Supabase URL: ${supabaseUrl}`);

async function measureHttpPing() {
  return new Promise((resolve) => {
    const start = Date.now();
    const url = `${supabaseUrl}/auth/v1/health`;
    
    http.get(url, (res) => {
      const duration = Date.now() - start;
      console.log(`\n1. HTTP API Sağlık Kontrolü (Ping):`);
      console.log(`   - Adres: ${url}`);
      console.log(`   - Durum Kodu: ${res.statusCode}`);
      console.log(`   - Yanıt Süresi (Gecikme): ${duration} ms`);
      resolve(duration);
    }).on('error', (err) => {
      console.error(`❌ HTTP Ping başarısız:`, err.message);
      resolve(-1);
    });
  });
}

async function measureDbQueryPing() {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const start = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select('id')
      .limit(1);
      
    const duration = Date.now() - start;
    console.log(`\n2. Supabase DB Sorgu Kontrolü (Ping):`);
    if (error) {
      console.error(`   - Durum: BAŞARISIZ ❌`);
      console.error(`   - Hata Detayı:`, error.message);
      return -1;
    } else {
      console.log(`   - Durum: BAŞARILI ✅`);
      console.log(`   - Veri Alındı: ${JSON.stringify(data)}`);
      console.log(`   - DB Round-Trip Süresi (Gecikme): ${duration} ms`);
      return duration;
    }
  } catch (err) {
    console.error(`❌ DB Ping sırasında beklenmeyen hata:`, err.message);
    return -1;
  }
}

async function runAll() {
  await measureHttpPing();
  await measureDbQueryPing();
  console.log("\n=========================================");
}

runAll();
