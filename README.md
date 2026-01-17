# HushPay

**Quiet money moves.**

Send private Solana payments via WhatsApp. Transaction amounts hidden on-chain using zero-knowledge proofs.

---

## What is HushPay?

HushPay brings privacy-first crypto payments to WhatsApp's 2+ billion users. Send money to phone numbers, not wallet addresses. Amounts stay hidden on-chain using ShadowWire's Bulletproofs technology.

**Key Features:**
- 📱 Send to phone numbers (no wallet addresses)
- 🔒 Hidden amounts on-chain (zero-knowledge proofs)
- 💬 WhatsApp interface (no app download)
- 💵 USD1 stablecoin (stable value)
- ✅ Compliance-ready (Range API screening)

---

## Project Status: Task 1 - Setup Complete ✅

### What's Been Done
- ✅ Project structure created
- ✅ TypeScript configuration
- ✅ Dependencies defined in package.json
- ✅ Environment variables template
- ✅ Basic type definitions
- ✅ Configuration module
- ✅ Database service (SQLite)
- ✅ Command parser utility

### Next Steps
1. Install dependencies: `npm install`
2. Register for WhatsApp Business API (see guide below)
3. Copy `.env.example` to `.env` and fill in credentials
4. Proceed to Task 2: WhatsApp Webhook implementation

---

## Quick Start

### 1. Install Dependencies

```bash
cd whisperpay
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Then edit `.env` with your credentials (see WhatsApp setup guide below).

### 3. Run Development Server

```bash
npm run dev
```

---

## How It Works

```
User: "send 50 usd1 to +234..."
  ↓
HushPay Bot receives message
  ↓
Screens addresses (Range API)
  ↓
Private transfer (ShadowWire - amount hidden)
  ↓
Both parties notified
  ↓
Transaction on Solscan shows [PRIVATE]
```

---

## WhatsApp Business API Setup Guide

### Step 1: Create Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Click "Create Account"
3. Fill in your business details
4. Verify your email

### Step 2: Create Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - **App Name:** WhisperPay Bot
   - **App Contact Email:** Your email
   - **Business Account:** Select your business account
5. Click "Create App"

### Step 3: Add WhatsApp Product

1. In your app dashboard, find "WhatsApp" in the products list
2. Click "Set Up"
3. Select your Business Account
4. Click "Continue"

### Step 4: Get Test Phone Number

Meta provides a free test phone number for development:

1. In WhatsApp settings, go to "API Setup"
2. You'll see a test phone number (e.g., +1 555-0100)
3. Copy the **Phone Number ID** - you'll need this for `.env`
4. Add your personal phone number to "To" field and click "Send Message"
5. You should receive a test message on WhatsApp

### Step 5: Get Access Token

1. In the same "API Setup" page, find "Temporary access token"
2. Copy this token - it's valid for 24 hours (we'll get permanent one later)
3. Paste it in your `.env` file as `WHATSAPP_TOKEN`

### Step 6: Configure Webhook (Do this in Task 2)

We'll set this up when we implement the webhook server.

### Step 7: Get Permanent Access Token (Optional for now)

For production, you'll need a permanent token:

1. Go to "App Settings" → "Basic"
2. Copy your **App ID** and **App Secret**
3. Use these to generate a permanent token (we'll do this later)

---

## Environment Variables Needed

After WhatsApp setup, your `.env` should have:

```env
# From WhatsApp API Setup page
WHATSAPP_TOKEN=EAAxxxxxxxxxx  # Temporary access token
WHATSAPP_PHONE_ID=123456789   # Phone Number ID
WHATSAPP_VERIFY_TOKEN=whisperpay_verify  # You choose this

# These we'll set up in later tasks
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=your_key
RANGE_API_KEY=your_range_api_key
SHADOWWIRE_API_KEY=your_shadowwire_key
ENCRYPTION_KEY=your_32_character_encryption_key
```

---

## Project Structure

```
whisperpay/
├── docs/
│   ├── IMPLEMENTATION_PLAN.md
│   └── PROJECT_BRIEF.md
├── src/
│   ├── config/
│   │   └── index.ts          # Configuration management
│   ├── services/
│   │   └── database.ts       # SQLite database service
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── utils/
│       └── parser.ts         # Command parser
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** SQLite (better-sqlite3)
- **Blockchain:** Solana (@solana/web3.js)
- **Privacy:** ShadowWire (Radr Labs)
- **Compliance:** Range API
- **Infrastructure:** Helius RPC
- **Messaging:** WhatsApp Cloud API

---

## Development Workflow

1. **Task 1 (Current):** Project setup + WhatsApp registration
2. **Task 2:** Implement webhook to receive messages
3. **Task 3:** Implement sending messages back
4. **Task 4:** Command parsing
5. **Task 5:** User & wallet management
6. **Task 6:** Solana integration
7. **Task 7:** Range compliance
8. **Task 8:** ShadowWire private transfers
9. **Task 9:** Helius webhooks
10. **Task 10:** Receipt generation
11. **Task 11:** Error handling & polish
12. **Task 12:** Deployment

---

## Troubleshooting

### Can't create Meta Business Account
- Make sure you're using a verified Facebook account
- Some regions may have restrictions

### Don't see WhatsApp in products list
- Make sure your app type is "Business"
- Refresh the page and check again

### Test message not received
- Verify your phone number is added to the "To" field
- Check that your phone has WhatsApp installed
- Try a different phone number

### Access token expired
- Temporary tokens expire in 24 hours
- Generate a new one from the API Setup page
- For production, use permanent tokens

---

## Resources

- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Meta Business Help Center](https://www.facebook.com/business/help)
- [Solana Docs](https://docs.solana.com)
- [ShadowWire API](https://registry.scalar.com/@radr/apis/shadowpay-api)

---

## License

MIT

---

## Hackathon Submission

**Solana Privacy Hackathon 2026**
- **Project:** HushPay - Quiet money moves
- Submission Deadline: February 1, 2026
- Target Tracks: Radr Labs ($15k), Helius ($5k), Range ($1.5k)
- Total Prize Potential: $21.5k
