# HushPay 🤫

**Quiet money moves.**

Private crypto payments via WhatsApp. No wallet addresses. No public amounts. Just send money like texting.

---

## What is HushPay?

HushPay brings privacy-first crypto payments to WhatsApp's 2+ billion users and Sms. Send money to phone numbers, not wallet addresses. Transaction amounts stay hidden on-chain using zero-knowledge proofs.

**The Problem:**
- Traditional crypto payments expose amounts on public blockchains
- Users need to share long wallet addresses
- No privacy for sender or recipient
- Complex UX barriers for mainstream adoption

**The Solution:**
HushPay combines multiple privacy protocols with WhatsApp's familiar interface to create truly private, phone-to-phone crypto payments.

---

## 🎯 Core Features

### 1. Phone-to-Phone Payments
Send crypto using phone numbers instead of wallet addresses.

```
You: "send 50 usd1 to +234..."
HushPay: ✓ Sent! Amount hidden on-chain.
```

No copying addresses. No blockchain explorers. Just like sending a text message.

### 2. Triple Privacy Layers

**🔒 Amount Hidden (ShadowWire)**
- Transaction amounts invisible on Solscan
- Uses Bulletproofs zero-knowledge technology
- Radr Labs integration

**👤 Sender Hidden (Privacy Cash)**
- Anonymous transfers via private pool
- Recipient can't see who sent it
- Deposit → Mix → Withdraw flow

**🌉 Cross-Chain Hidden (SilentSwap)**
- Private bridge from Solana to Ethereum/Avalanche/Polygon
- Converts SOL → USDC privately
- No public bridge records

### 3. Social Payment Features

**Split Bills**
```
"split 100 sol with +234..., +234..., +234..."
```
- Divides amount equally among recipients
- Each person gets a private transfer
- Perfect for group dinners, shared expenses

**Payment Requests**
```
"request 50 sol from +234..."
```
- Sends WhatsApp message to requester
- One-tap payment link
- No back-and-forth coordination

**Recurring Payments**
```
"send 10 sol to +234... every week"
```
- Scheduled private transfers
- Daily, weekly, or monthly
- Auto-sends and notifies both parties

### 4. Multi-Language Support
Speak your language. HushPay responds in:
- 🇺🇸 English
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇧🇷 Portuguese

Auto-detects based on phone country code or manual selection.

### 5. Beautiful Receipts
Every transaction gets a shareable receipt with:
- Privacy badges (🔒 PRIVATE, 👤 ANONYMOUS, 🌉 CROSS-CHAIN)
- QR code linking to Solscan
- Timestamp and transaction details
- Hosted on Cloudinary

### 6. Price Alerts
```
"alert me when sol hits $200"
```
Get WhatsApp notifications when your tokens reach target prices.

### 7. Compliance-Ready
Every transaction screened through Range API:
- Sanctions list checking
- Risk assessment
- Blocks flagged addresses
- Audit trail for regulators

---

## 🎨 User Experience

### Conversational AI
Powered by Google Gemini 2.5 Flash. Talk naturally:

```
You: "how much do I have?"
HushPay: 💰 Balance
         Public: 2.5 SOL, 100 USD1
         Private: 1.2 SOL

You: "send 0.5 sol to +234..."
HushPay: Send 0.5 SOL to +234...? 
         Amount hidden on-chain.
         Reply YES to confirm.

You: "yes"
HushPay: ✓ Sent! [PRIVATE]
         https://solscan.io/tx/...
```

### Transaction History
```
💸 Recent Payments

→ Sent *1.5 SOL*
+234...7890 🔒 [PRIVATE] ✓
https://solscan.io/tx/...

← Received *0.8 SOL*
+234...1234 🔒 [PRIVATE] ✓
https://solscan.io/tx/...
```

Clickable Solscan links. Clear privacy indicators. Beautiful formatting.

---

## 🏗️ Architecture

### Privacy Stack
- **ShadowWire** - Amount-hidden transfers using Bulletproofs
- **Privacy Cash** - Anonymous sender via private pool mixing
- **SilentSwap** - Cross-chain private bridge with facilitator groups

### Infrastructure
- **Helius** - RPC + webhook notifications for incoming transfers
- **Range API** - Real-time compliance screening
- **Twilio** - WhatsApp Business API integration
- **Cloudinary** - Image hosting for QR codes and receipts

### Database
SQLite with encrypted private keys:
- Users (phone, wallet, encrypted key, language)
- Transfers (sender, recipient, amount, token, tx, status)
- Recurring payments (schedule, frequency, next run)
- Price alerts (token, price, condition)

### Security
- Private keys encrypted with AES-256
- 5-minute expiry on pending confirmations
- Phone number normalization
- Wallet screening before every transfer

---

## 💬 Command Reference

### Send Money
| Command | Description |
|---------|-------------|
| `send 1 sol to +234...` | Amount-hidden transfer |
| `send anon 0.5 sol to 7xKX...` | Anonymous sender (needs wallet) |
| `send 1 sol to +234... on ethereum` | Cross-chain private bridge |
| `split 100 sol with +234..., +234...` | Group payment |
| `send 10 sol to +234... every week` | Recurring payment |

### Balance & Wallet
| Command | Description |
|---------|-------------|
| `balance` | Check public + private balance |
| `wallet` or `qr` | Get wallet address with QR code |
| `deposit 1 sol` | Deposit to private pool |
| `withdraw 0.5 sol` | Withdraw from private pool |

### History & Requests
| Command | Description |
|---------|-------------|
| `receipts` | View transaction history with links |
| `request 50 sol from +234...` | Request payment |

### Alerts & Settings
| Command | Description |
|---------|-------------|
| `alert me when sol hits $200` | Price alert |
| `set language to spanish` | Change language |
| `help` | Show all commands |

---

## 🎯 Hackathon Bounties

HushPay targets **5 bounty tracks** with a total potential of **$41,500**:

| Track | Prize | Integration |
|-------|-------|-------------|
| **Radr Labs** | $15,000 | ShadowWire amount-hidden transfers |
| **Privacy Cash** | $15,000 | Anonymous sender via private pool |
| **SilentSwap** | $5,000 | Cross-chain private payments |
| **Helius** | $5,000 | Webhook notifications + RPC |
| **Range** | $1,500 | Compliance screening |

### Why HushPay Wins

**1. Real Privacy**
Not just one privacy layer—three. Amount hidden, sender hidden, and cross-chain hidden.

**2. Mainstream UX**
WhatsApp interface. Phone numbers instead of addresses. Conversational AI. No crypto jargon.

**3. Social Features**
Split bills, payment requests, recurring payments. Features people actually use.

**4. Production Ready**
- Running on mainnet
- Real transactions with USD1 stablecoin
- Compliance screening
- Multi-language support
- Error handling and fallbacks

**5. Technical Depth**
- Full SilentSwap integration with facilitator groups
- Privacy Cash pool mixing
- ShadowWire Bulletproofs
- Background job processor for recurring payments
- Helius webhook handling

---

## 🌟 Use Cases

### 1. Remittances
Send money home privately. No one knows how much you're sending.

### 2. Freelance Payments
Get paid without revealing your wallet balance to clients.

### 3. Group Expenses
Split dinner bills, rent, or trip costs with friends.

### 4. Donations
Support causes anonymously. Recipient can't track you.

### 5. Subscriptions
Set up recurring payments for services, rent, or allowances.

### 6. Cross-Border Payments
Bridge from Solana to Ethereum/Avalanche privately.

---

## 🔐 Privacy Guarantees

### What's Hidden
✅ Transaction amounts (ShadowWire)
✅ Sender identity (Privacy Cash)
✅ Cross-chain bridge records (SilentSwap)
✅ Wallet addresses (phone-to-phone)

### What's Visible
- Transaction occurred (timestamp on-chain)
- Recipient wallet (but not linked to phone)
- Token type (SOL, USD1, etc.)

### What's Encrypted
- Private keys (AES-256 in database)
- Pending action data
- User preferences

---

## 🚀 Technical Highlights

### Smart Fallbacks
- ShadowWire → Regular Solana transfer on devnet
- Privacy Cash → Only on mainnet (devnet check)
- Cloudinary → Text-only fallback if not configured

### Background Jobs
- Recurring payment processor (5-min intervals)
- Price alert checker (5-min intervals)
- Helius webhook listener (real-time)

### AI Integration
- Google Gemini 2.5 Flash
- Intent extraction from natural language
- Multi-language response generation
- Context-aware conversations

### Image Generation
- QR codes with Canvas
- Receipt images with privacy badges
- Cloudinary upload and hosting
- WhatsApp media message support

---

## 📊 Stats

- **3 Privacy Protocols** integrated
- **5 Bounty Tracks** targeted
- **4 Languages** supported
- **10+ Commands** available
- **$41.5k** total prize potential

---

## 🎬 Demo Flow

1. **User texts:** "send 50 usd1 to +234..."
2. **HushPay:** Creates wallet if new user
3. **HushPay:** Screens addresses via Range API
4. **HushPay:** Asks for confirmation
5. **User:** "yes"
6. **HushPay:** Executes private transfer via ShadowWire
7. **HushPay:** Generates receipt with QR code
8. **HushPay:** Notifies both parties
9. **Solscan:** Shows [PRIVATE] amount 🔒

---

## 🏆 Why This Matters

**Privacy is a human right.** But current crypto solutions force users to choose between privacy and usability. HushPay proves you can have both.

By combining:
- Multiple privacy protocols
- Familiar messaging interface
- Social payment features
- Compliance screening

HushPay makes private crypto payments accessible to billions of WhatsApp users worldwide.

**Quiet money moves. Loud impact.**

---

## 📝 License

MIT

---

## 🔗 Links

- **Solana Privacy Hackathon 2026**
- **Submission Deadline:** February 1, 2026
- **Built with:** ShadowWire, Privacy Cash, SilentSwap, Helius, Range

---

*HushPay - Because your finances are nobody's business but yours.* 🤫
