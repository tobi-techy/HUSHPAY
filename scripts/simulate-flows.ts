#!/usr/bin/env tsx
/**
 * HushPay Message Flow Simulator
 * Simulates actual WhatsApp conversations without spending SOL
 * 
 * Run: npx tsx scripts/simulate-flows.ts
 */

import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import Database from 'better-sqlite3';
import * as CryptoJS from 'crypto-js';

const TEST_KEY = 'test-encryption-key-32-chars-ok!';

// Mock database
const db = new Database(':memory:');
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, phone TEXT UNIQUE, wallet_address TEXT, encrypted_private_key TEXT, preferred_language TEXT DEFAULT 'en');
  CREATE TABLE transfers (id INTEGER PRIMARY KEY, sender_phone TEXT, recipient_phone TEXT, amount REAL, token TEXT, tx_signature TEXT, status TEXT DEFAULT 'pending');
  CREATE TABLE messages (id INTEGER PRIMARY KEY, phone TEXT, role TEXT, content TEXT);
  CREATE TABLE pending_actions (id INTEGER PRIMARY KEY, phone TEXT UNIQUE, action TEXT, data TEXT, expires_at TEXT);
`);

// Test users
const alice = { phone: '+2348012345678', keypair: Keypair.generate() };
const bob = { phone: '+2348087654321', keypair: Keypair.generate() };

function createUser(phone: string, keypair: Keypair) {
  const encrypted = CryptoJS.AES.encrypt(bs58.encode(keypair.secretKey), TEST_KEY).toString();
  db.prepare('INSERT INTO users (phone, wallet_address, encrypted_private_key) VALUES (?, ?, ?)').run(phone, keypair.publicKey.toBase58(), encrypted);
}

function log(msg: string) { console.log(msg); }
function userMsg(phone: string, msg: string) { console.log(`\n📱 ${phone.slice(-4)}: "${msg}"`); }
function botReply(msg: string) { console.log(`🤖 HushPay: ${msg}`); }
function action(msg: string) { console.log(`   ⚡ ${msg}`); }
function divider() { console.log('\n' + '─'.repeat(50)); }

// ============ FLOW SIMULATIONS ============

async function simulateNewUserOnboarding() {
  log('\n═══ FLOW 1: NEW USER ONBOARDING ═══');
  
  userMsg(alice.phone, 'hi');
  action('Creating new wallet...');
  createUser(alice.phone, alice.keypair);
  botReply(`Welcome to HushPay! 🤫

Your wallet is ready. Two ways to send:
• "send 1 sol to +234..." (amount hidden)
• "send anon 1 sol to [wallet]" (sender hidden)

Commands: balance, deposit, withdraw, receipts, help`);
  
  action(`✅ Wallet created: ${alice.keypair.publicKey.toBase58().slice(0,12)}...`);
}

async function simulateBalanceCheck() {
  divider();
  log('═══ FLOW 2: BALANCE CHECK ═══');
  
  userMsg(alice.phone, 'balance');
  action('Fetching public + private balances...');
  botReply(`Your balance:

📊 Public:
• 0.0231 SOL
• 0.00 USD1

🔒 Private Pool:
• 0.0000 SOL

Wallet: ${alice.keypair.publicKey.toBase58().slice(0,8)}...`);
}

async function simulateSendPayment() {
  divider();
  log('═══ FLOW 3: SEND PAYMENT (ShadowWire) ═══');
  
  // Create recipient
  createUser(bob.phone, bob.keypair);
  
  userMsg(alice.phone, 'send 0.005 sol to +2348087654321');
  action('AI parsing intent...');
  action('Screening addresses via Range API...');
  
  // Save pending action
  const expires = new Date(Date.now() + 300000).toISOString();
  db.prepare('INSERT INTO pending_actions (phone, action, data, expires_at) VALUES (?, ?, ?, ?)').run(
    alice.phone, 'send_payment', 
    JSON.stringify({ recipientPhone: bob.phone, amount: 0.005, token: 'SOL' }),
    expires
  );
  
  botReply(`Send 0.005 SOL to +234...4321?
Amount will be hidden on-chain.

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Executing ShadowWire private transfer...');
  action('Amount hidden via Bulletproofs ZK...');
  
  // Record transfer
  db.prepare('INSERT INTO transfers (sender_phone, recipient_phone, amount, token, tx_signature, status) VALUES (?, ?, ?, ?, ?, ?)').run(
    alice.phone, bob.phone, 0.005, 'SOL', 'mock-tx-sig-abc123', 'confirmed'
  );
  db.prepare('DELETE FROM pending_actions WHERE phone = ?').run(alice.phone);
  
  botReply(`✓ Sent 0.005 SOL to +234...4321
Amount: [PRIVATE] 🔒
Tx: mock-tx-sig-abc1...

https://solscan.io/tx/mock-tx-sig-abc123`);
  
  action('Notifying recipient...');
  log(`   📨 To ${bob.phone.slice(-4)}: "💰 You received 0.005 SOL! From: ...5678"`);
}

async function simulateSplitPayment() {
  divider();
  log('═══ FLOW 4: SPLIT PAYMENT ═══');
  
  const charlie = { phone: '+2348099999999', keypair: Keypair.generate() };
  createUser(charlie.phone, charlie.keypair);
  
  userMsg(alice.phone, 'split 0.01 sol with +2348087654321, +2348099999999');
  action('AI parsing split intent...');
  
  const expires = new Date(Date.now() + 300000).toISOString();
  db.prepare('INSERT INTO pending_actions (phone, action, data, expires_at) VALUES (?, ?, ?, ?)').run(
    alice.phone, 'split_payment',
    JSON.stringify({ totalAmount: 0.01, token: 'SOL', recipients: [bob.phone, charlie.phone] }),
    expires
  );
  
  botReply(`Split 0.01 SOL between 2 people?
Each gets 0.005 SOL (amount hidden).

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Executing 2 private transfers...');
  
  botReply(`💸 Split Payment Complete

0.01 SOL → 2 people
0.005 SOL each

✓ ...4321
✓ ...9999`);
}

async function simulateRecurringPayment() {
  divider();
  log('═══ FLOW 5: RECURRING PAYMENT ═══');
  
  userMsg(alice.phone, 'send 0.001 sol to +2348087654321 every week');
  action('AI parsing recurring intent...');
  
  botReply(`Set up weekly payment of 0.001 SOL to +234...4321?

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Creating recurring payment schedule...');
  
  botReply(`✓ Recurring payment set up!

0.001 SOL → +234...4321
Frequency: weekly

First payment will be sent now.`);
}

async function simulatePaymentRequest() {
  divider();
  log('═══ FLOW 6: PAYMENT REQUEST ═══');
  
  userMsg(bob.phone, 'request 0.01 sol from +2348012345678');
  action('Sending payment request to Alice...');
  
  botReply(`Request sent to +234...5678 for 0.01 SOL!`);
  
  log(`   📨 To ${alice.phone.slice(-4)}: "💸 Payment Request

${bob.phone} is requesting 0.01 SOL from you.

Reply: send 0.01 sol to ${bob.phone}"`);
}

async function simulateDepositWithdraw() {
  divider();
  log('═══ FLOW 7: DEPOSIT TO PRIVATE POOL ═══');
  
  userMsg(alice.phone, 'deposit 0.005 sol');
  action('AI parsing deposit intent...');
  
  botReply(`Deposit 0.005 SOL to private pool?
Enables anonymous sends.

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Depositing to Privacy Cash pool...');
  action('⚠️ Privacy Cash only works on mainnet');
  
  botReply(`✓ Deposited 0.005 SOL to private pool
Private balance: 0.005 SOL`);
  
  divider();
  log('═══ FLOW 8: ANONYMOUS SEND ═══');
  
  userMsg(alice.phone, 'send anon 0.003 sol to 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');
  
  botReply(`Send 0.003 SOL anonymously to 7xKX...AsU?
Recipient won't know who sent it.

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Withdrawing from private pool to recipient...');
  
  botReply(`✓ Sent 0.003 SOL anonymously
Sender: [UNTRACEABLE] 👤
Tx: mock-anon-tx-xyz...`);
}

async function simulateCrossChain() {
  divider();
  log('═══ FLOW 9: CROSS-CHAIN SEND ═══');
  
  userMsg(alice.phone, 'send 0.1 sol to +2348087654321 on ethereum');
  action('AI parsing cross-chain intent...');
  action('⚠️ Need recipient EVM address for cross-chain');
  
  botReply(`For cross-chain to Ethereum, I need the recipient's EVM address.

Please provide the 0x... address.`);
  
  userMsg(alice.phone, '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00');
  
  botReply(`Send 0.1 SOL to +234...4321 on Ethereum?
Private cross-chain bridge via SilentSwap.

Reply YES to confirm.`);
  
  userMsg(alice.phone, 'yes');
  action('Executing SilentSwap cross-chain swap...');
  action('SOL → USDC via Relay bridge...');
  action('Depositing to SilentSwap facilitator group...');
  
  botReply(`✓ Cross-chain transfer complete! 🌉

Solana: mock-sol-tx-123...
Bridge: 0xmock-bridge-tx...

USDC delivered to Ethereum address.`);
}

async function simulatePriceAlert() {
  divider();
  log('═══ FLOW 10: PRICE ALERT ═══');
  
  userMsg(alice.phone, 'alert me when sol hits $200');
  action('Setting up price alert...');
  
  botReply(`🔔 Alert set!
I'll notify you when SOL reaches $200.`);
  
  log('\n   [Later, when price hits target...]');
  log(`   📨 To ${alice.phone.slice(-4)}: "🔔 Price Alert!

SOL is now $200.05
(Target: above $200)"`);
}

async function simulateReceipts() {
  divider();
  log('═══ FLOW 11: VIEW RECEIPTS ═══');
  
  userMsg(alice.phone, 'receipts');
  action('Fetching transaction history...');
  
  botReply(`💸 Recent Payments

→ Sent *0.005 SOL*
+234...4321 🔒 [PRIVATE] ✓
https://solscan.io/tx/mock-tx-sig-abc123

→ Sent *0.003 SOL*
7xKX...AsU 👤 [ANONYMOUS] ✓
https://solscan.io/tx/mock-anon-tx-xyz`);
}

async function simulateLanguageChange() {
  divider();
  log('═══ FLOW 12: LANGUAGE CHANGE ═══');
  
  userMsg(alice.phone, 'set language to spanish');
  action('Updating language preference...');
  
  botReply(`¡Idioma cambiado a español! 🇪🇸`);
  
  userMsg(alice.phone, 'balance');
  
  botReply(`Tu balance:

📊 Público:
• 0.0181 SOL
• 0.00 USD1

🔒 Pool Privado:
• 0.002 SOL`);
}

async function simulateHelp() {
  divider();
  log('═══ FLOW 13: HELP ═══');
  
  userMsg(alice.phone, 'help');
  
  botReply(`HushPay Commands:

💸 Send
• send [amt] [token] to [phone]
• send anon [amt] [token] to [wallet]
• send [amt] [token] to [phone] on [chain]
• split [amt] [token] with [phone], [phone]
• request [amt] [token] from [phone]
• send [amt] [token] to [phone] every [day/week/month]

💰 Balance
• balance
• deposit [amt] [token]
• withdraw [amt] [token]

📜 History: receipts
🔔 Alerts: alert me when sol hits $200
🌍 Language: set language to spanish

🔒 Regular = amount hidden
👤 Anon = sender hidden
🌉 Cross-chain = private bridge`);
}

// ============ MAIN ============
async function main() {
  console.log('🎭 HushPay Message Flow Simulator');
  console.log('══════════════════════════════════════════════════');
  console.log('Simulates all WhatsApp flows WITHOUT spending SOL');
  console.log('══════════════════════════════════════════════════');

  await simulateNewUserOnboarding();
  await simulateBalanceCheck();
  await simulateSendPayment();
  await simulateSplitPayment();
  await simulateRecurringPayment();
  await simulatePaymentRequest();
  await simulateDepositWithdraw();
  await simulateCrossChain();
  await simulatePriceAlert();
  await simulateReceipts();
  await simulateLanguageChange();
  await simulateHelp();

  divider();
  console.log('\n✅ All 13 flows simulated successfully!');
  console.log('\n📋 DEMO SCRIPT FOR JUDGES:');
  console.log('  1. "hi" → Onboarding');
  console.log('  2. "balance" → Show wallet');
  console.log('  3. "send 0.005 sol to +234..." → Private transfer');
  console.log('  4. "yes" → Confirm');
  console.log('  5. "receipts" → Show history');
  console.log('\n💰 Estimated cost: ~0.004 SOL (2 transfers)');
  console.log('📊 Remaining budget: ~0.019 SOL\n');
  
  db.close();
}

main().catch(console.error);
