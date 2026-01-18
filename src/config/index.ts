import dotenv from 'dotenv';

dotenv.config();

export const config = {
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  solana: {
    rpcUrl: process.env.HELIUS_RPC_URL || 'https://api.devnet.solana.com',
    network: process.env.SOLANA_NETWORK || 'devnet',
    usd1Mint: process.env.USD1_MINT || '',
  },
  helius: {
    apiKey: process.env.HELIUS_API_KEY || '',
  },
  range: {
    apiKey: process.env.RANGE_API_KEY || '',
  },
  shadowwire: {
    apiUrl: process.env.SHADOWWIRE_API_URL || 'https://api.radr.fun',
    apiKey: process.env.SHADOWWIRE_API_KEY || '',
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || 'default_key_change_in_production',
  },
  server: {
    port: parseInt(process.env.PORT || '8000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:8000',
  },
};
