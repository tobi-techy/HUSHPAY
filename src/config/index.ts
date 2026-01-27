import dotenv from 'dotenv';

dotenv.config();

// Validate critical environment variables
if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
  throw new Error('ENCRYPTION_KEY must be set and at least 32 characters long');
}

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
  console.warn('⚠️  Twilio credentials not set - SMS/WhatsApp will not work');
}

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
    key: process.env.ENCRYPTION_KEY!,
  },
  server: {
    port: parseInt(process.env.PORT || '8000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    baseUrl: process.env.BASE_URL || 'http://localhost:8000',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
  evmPrivateKey: process.env.EVM_PRIVATE_KEY || '',
  heliusRpcUrl: process.env.HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com',
};
