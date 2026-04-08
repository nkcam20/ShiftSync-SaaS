require('dotenv').config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: '15m',
    refreshExpiry: '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
  
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || 'ShiftSync <noreply@shiftsync.com>',
  },
  
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
};

// Validate required config
const required = ['supabase.url', 'supabase.serviceKey', 'jwt.secret', 'jwt.refreshSecret'];
for (const key of required) {
  const keys = key.split('.');
  let val = config;
  for (const k of keys) val = val?.[k];
  if (!val) {
    console.error(`Missing required config: ${key}`);
    process.exit(1);
  }
}

module.exports = config;
