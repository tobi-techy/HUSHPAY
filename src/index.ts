import express from 'express';
import { config } from './config';
import { db } from './services/database';
import { chat } from './services/ai';
import { getOrCreateUser, getBalance, getKeypair } from './services/wallet';
import { screenAddress } from './services/range';
import { privateTransfer } from './services/shadowwire';
import { getPrivateBalance, depositToPrivate, anonymousSend } from './services/privacycash';
import { sendSms, sendWhatsApp, sendTypingIndicator } from './services/twilio';
import { detectLanguage, translate } from './services/i18n';
import { sendWalletQR } from './services/qr';
import { addPriceAlert, getPriceAlerts, initPriceAlerts } from './services/priceAlerts';
import { generateReceipt } from './services/receipt';
import { startRecurringPaymentProcessor } from './services/recurringPayments';
import { setPin, requiresPin, createConfirmationLink } from './services/pin';
import type { PaymentIntent, AnonSendIntent, DepositIntent, WithdrawIntent, PriceAlertIntent, SetLanguageIntent, CrossChainSendIntent, SplitPaymentIntent, PaymentRequestIntent, RecurringPaymentIntent, CancelRecurringIntent, DeleteContactIntent } from './types';

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Rate limiter: 10 requests per minute per phone
const rateLimitMap = new Map<string, number[]>();
function isRateLimited(phone: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;
  const timestamps = rateLimitMap.get(phone)?.filter(t => now - t < windowMs) || [];
  if (timestamps.length >= maxRequests) return true;
  timestamps.push(now);
  rateLimitMap.set(phone, timestamps);
  return false;
}

const WELCOME_MSG = `Welcome to HushPay! 🤫

Your wallet is ready. Two ways to send:
• "send 1 sol to +234..." (amount hidden)
• "send anon 1 sol to [wallet]" (sender hidden)

Commands: balance, deposit, withdraw, receipts, help`;

async function handleMessage(from: string, body: string, channel: 'sms' | 'whatsapp'): Promise<string> {
  console.log(`[handleMessage] from: ${from}, body: "${body}", channel: ${channel}`);
  
  const { user, isNew } = await getOrCreateUser(from);
  const lang = detectLanguage(from, user);
  console.log(`[handleMessage] user: ${user.walletAddress.slice(0,8)}..., isNew: ${isNew}, lang: ${lang}`);

  if (isNew) return translate('welcome', lang);

  // Handle "undo" or "cancel" - clear pending action
  if (/^(undo|cancel|no|n)$/i.test(body)) {
    const pending = db.getPendingAction(from);
    if (pending) {
      db.clearPendingAction(from);
      return `✓ Cancelled. Transaction not sent.`;
    }
    return `Nothing to cancel.`;
  }

  // Handle "retry" - retry failed action
  if (/^retry$/i.test(body)) {
    const failed = db.getFailedAction(from);
    if (failed) {
      db.clearFailedAction(from);
      db.savePendingAction(from, failed.action, failed.data);
      return `Retrying: ${failed.action.replace('_', ' ')}\n\nReply YES to confirm.`;
    }
    return `Nothing to retry.`;
  }

  // Check for pending action confirmation
  const isConfirm = /^(yes|confirm|y|si|sí|oui|sim)$/i.test(body);
  if (isConfirm) {
    console.log(`[handleMessage] Confirmation detected`);
    const pending = db.getPendingAction(from);
    if (pending) {
      console.log(`[handleMessage] Executing pending: ${pending.action}`);
      
      // Check if PIN required for this action
      const amount = pending.data.amount || pending.data.totalAmount || 0;
      if (requiresPin(from, amount)) {
        const link = createConfirmationLink(from, pending.action, pending.data);
        db.clearPendingAction(from);
        return `🔐 PIN required for this amount.\n\nConfirm here: ${link}\n\n⏱️ Link expires in 5 minutes.`;
      }
      
      return await executePendingAction(from, pending, channel);
    }
  }

  console.log(`[handleMessage] Processing with AI...`);
  const contacts = db.getContacts(from);
  const { reply, intent } = await chat(from, body, lang, contacts);
  console.log(`[handleMessage] AI intent: ${intent?.action}`);
  
  let response = reply;

  // Handle set_pin intent
  if (intent?.action === 'set_pin') {
    const link = createConfirmationLink(from, db.hasPin(from) ? 'update_pin' : 'set_pin', {});
    response = `Let's secure your wallet! 🔐\n\nClick here to set your PIN:\n${link}\n\n⏱️ Link expires in 5 minutes.`;
  }
  // Handle save_contact intent
  else if (intent?.action === 'save_contact') {
    const p = intent as any;
    if (p.phone && p.name) {
      db.saveContact(from, p.phone, p.name);
      response = `Got it! Saved ${p.phone} as "${p.name}" 👍\n\nNow you can say "send 1 sol to ${p.name}" anytime!`;
    }
  }
  // Handle list_contacts intent
  else if (intent?.action === 'list_contacts') {
    const contacts = db.getContacts(from);
    if (contacts.length === 0) {
      response = `You haven't saved any contacts yet.\n\nTry: "save +234... as mom"`;
    } else {
      response = `📇 *Your Contacts*\n\n${contacts.map(c => `• ${c.name}: ${c.phone}`).join('\n')}\n\nTo send: "send 1 sol to ${contacts[0].name}"`;
    }
  }
  else if (intent?.action === 'check_balance') {
    console.log(`[handleMessage] Checking balance...`);
    const { sol, usd1 } = await getBalance(user.walletAddress);
    const privateSol = await getPrivateBalance(user.encryptedPrivateKey, 'SOL');
    response = `${translate('balance', lang)}\n\n${translate('publicBalance', lang)}\n• ${sol.toFixed(4)} SOL\n• ${usd1.toFixed(2)} USD1\n\n${translate('privateBalance', lang)}\n• ${privateSol.toFixed(4)} SOL\n\n${translate('wallet', lang)} ${user.walletAddress.slice(0, 8)}...`;
    db.saveMessage(from, 'assistant', response);
  } else if (intent?.action === 'get_wallet') {
    console.log(`[handleMessage] Getting wallet...`);
    if (channel === 'whatsapp') {
      console.log(`[handleMessage] Sending wallet via WhatsApp`);
      await sendWalletQR(from, user.walletAddress);
      return '';
    }
    response = `${translate('wallet', lang)}\n${user.walletAddress}`;
    db.saveMessage(from, 'assistant', response);
  } else if (intent?.action === 'set_language') {
    const p = intent as SetLanguageIntent;
    db.setUserLanguage(from, p.language);
    // reply already set by AI
  } else if (intent?.action === 'get_receipts') {
    const transfers = db.getTransfers(from, 5);
    if (transfers.length === 0) {
      response = "No payments yet. Send your first one!";
    } else {
      response = "💸 *Recent Payments*\n\n" + transfers.map(t => {
        const dir = t.senderPhone === from ? '→ Sent' : '← Received';
        const other = t.senderPhone === from ? t.recipientPhone : t.senderPhone;
        const privacyBadge = t.status === 'confirmed' ? '🔒 [PRIVATE]' : '';
        const status = t.status === 'confirmed' ? '✓' : '✗';
        const link = t.txSignature ? `\nhttps://solscan.io/tx/${t.txSignature}` : '';
        return `${dir} *${t.amount} ${t.token}*\n${other.slice(-4)} ${privacyBadge} ${status}${link}`;
      }).join('\n\n');
    }
    db.saveMessage(from, 'assistant', response);
  } else if (intent?.action === 'price_alert') {
    const p = intent as PriceAlertIntent;
    addPriceAlert(from, p.token, p.price, p.condition);
  } else if (intent?.action === 'send_payment') {
    const p = intent as PaymentIntent;
    const fee = 0.002; // ShadowWire fee estimate
    if (p.amount < 0.001 && p.token.toUpperCase() === 'SOL') {
      response = `⚠️ Amount too small\n\nMinimum: 0.001 SOL\nFees (~${fee} SOL) would exceed your transfer.`;
    } else {
      const total = p.amount + fee;
      response = `Send ${p.amount} ${p.token} to ${p.recipientPhone}?\n\n💰 Amount: ${p.amount} ${p.token}\n💸 Fee: ~${fee} ${p.token}\n📊 Total: ~${total.toFixed(4)} ${p.token}\n🔒 Amount hidden on-chain\n\nReply YES to confirm.`;
      db.savePendingAction(from, 'send_payment', { recipientPhone: p.recipientPhone, amount: p.amount, token: p.token });
    }
  } else if (intent?.action === 'anon_send') {
    const p = intent as AnonSendIntent;
    const fee = 0.003; // Privacy Cash fee estimate
    if (p.amount < 0.001 && p.token.toUpperCase() === 'SOL') {
      response = `⚠️ Amount too small\n\nMinimum: 0.001 SOL\nFees (~${fee} SOL) would exceed your transfer.`;
    } else {
      const total = p.amount + fee;
      response = `Send ${p.amount} ${p.token} anonymously?\n\n💰 Amount: ${p.amount} ${p.token}\n💸 Fee: ~${fee} ${p.token}\n📊 Total: ~${total.toFixed(4)} ${p.token}\n👤 Sender hidden\n\nReply YES to confirm.`;
      db.savePendingAction(from, 'anon_send', { recipientWallet: p.recipientWallet, amount: p.amount, token: p.token });
    }
  } else if (intent?.action === 'deposit') {
    const p = intent as DepositIntent;
    const fee = 0.002;
    response = `Deposit ${p.amount} ${p.token} to private pool?\n\n💰 Amount: ${p.amount} ${p.token}\n💸 Fee: ~${fee} ${p.token}\n📊 Total: ~${(p.amount + fee).toFixed(4)} ${p.token}\n\nReply YES to confirm.`;
    db.savePendingAction(from, 'deposit', { amount: p.amount, token: p.token });
  } else if (intent?.action === 'withdraw') {
    const p = intent as WithdrawIntent;
    db.savePendingAction(from, 'withdraw', { amount: p.amount, token: p.token });
  } else if (intent?.action === 'cross_chain_send') {
    const p = intent as CrossChainSendIntent;
    db.savePendingAction(from, 'cross_chain_send', { 
      recipientPhone: p.recipientPhone, 
      amount: p.amount, 
      token: p.token,
      destinationChain: p.destinationChain,
      recipientEvmAddress: p.recipientEvmAddress
    });
  } else if (intent?.action === 'split_payment') {
    const p = intent as SplitPaymentIntent;
    db.savePendingAction(from, 'split_payment', { 
      totalAmount: p.totalAmount, 
      token: p.token,
      recipients: p.recipients
    });
  } else if (intent?.action === 'payment_request') {
    const p = intent as PaymentRequestIntent;
    await sendWhatsApp(p.fromPhone, `💸 Payment Request\n\n${from} is requesting ${p.amount} ${p.token} from you.\n\nReply: send ${p.amount} ${p.token} to ${from}`);
  } else if (intent?.action === 'recurring_payment') {
    const p = intent as RecurringPaymentIntent;
    db.savePendingAction(from, 'recurring_payment', { 
      recipientPhone: p.recipientPhone, 
      amount: p.amount, 
      token: p.token,
      frequency: p.frequency
    });
  } else if (intent?.action === 'list_recurring') {
    const payments = db.getActiveRecurringPayments(from);
    if (payments.length === 0) {
      response = "You don't have any recurring payments set up.\n\nTry: \"send 10 sol to +234... every week\"";
    } else {
      response = "📅 *Your Recurring Payments*\n\n" + payments.map((p: any) => 
        `• ${p.amount} ${p.token} → ${p.recipient_phone.slice(-4)}\n  ${p.frequency} (next: ${new Date(p.next_run).toLocaleDateString()})`
      ).join('\n\n');
    }
  } else if (intent?.action === 'cancel_recurring') {
    const p = intent as CancelRecurringIntent;
    db.cancelRecurringPayment(from, p.recipientPhone);
    db.audit(from, 'recurring_cancel', { to: p.recipientPhone });
    response = `✓ Cancelled recurring payment to ${p.recipientPhone.slice(-4)}`;
  } else if (intent?.action === 'delete_contact') {
    const p = intent as DeleteContactIntent;
    db.deleteContact(from, p.name);
    response = `✓ Deleted contact "${p.name}"`;
  }

  console.log(`[handleMessage] Returning response (${response?.length} chars)`);
  return response;
}

async function executePendingAction(phone: string, pending: { action: string; data: any }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const user = db.getUser(phone);
  if (!user) return 'Error: User not found';

  db.clearPendingAction(phone);

  if (pending.action === 'send_payment') {
    return await executeSendPayment(phone, user, pending.data, channel);
  } else if (pending.action === 'anon_send') {
    return await executeAnonSend(user, pending.data);
  } else if (pending.action === 'deposit') {
    return await executeDeposit(user, pending.data);
  } else if (pending.action === 'withdraw') {
    return await executeWithdraw(user, pending.data);
  } else if (pending.action === 'cross_chain_send') {
    return await executeCrossChainSend(phone, user, pending.data, channel);
  } else if (pending.action === 'split_payment') {
    return await executeSplitPayment(phone, user, pending.data, channel);
  } else if (pending.action === 'recurring_payment') {
    db.createRecurringPayment(phone, pending.data.recipientPhone, pending.data.amount, pending.data.token, pending.data.frequency);
    db.audit(phone, 'recurring_setup', { to: pending.data.recipientPhone, amount: pending.data.amount, token: pending.data.token, frequency: pending.data.frequency });
    return `✓ Recurring payment set up!\n\n${pending.data.amount} ${pending.data.token} → ${pending.data.recipientPhone.slice(-4)}\nFrequency: ${pending.data.frequency}\n\nFirst payment will be sent now.`;
  }

  return 'Unknown action';
}

async function executeSendPayment(senderPhone: string, sender: any, data: { recipientPhone: string; amount: number; token: string }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const { user: recipient } = await getOrCreateUser(data.recipientPhone);

  const senderScreen = await screenAddress(sender.walletAddress);
  const recipientScreen = await screenAddress(recipient.walletAddress);
  if (!senderScreen.allowed) return `Transfer blocked: ${senderScreen.reason}`;
  if (!recipientScreen.allowed) return `Transfer blocked: ${recipientScreen.reason}`;

  // Check balance before attempting transfer
  const balance = await getBalance(sender.walletAddress);
  const tokenBalance = data.token.toUpperCase() === 'SOL' ? balance.sol : balance.usd1;
  const fee = 0.002; // Estimated tx fee
  const required = data.amount + (data.token.toUpperCase() === 'SOL' ? fee : 0);
  
  if (tokenBalance < required) {
    const shortage = (required - tokenBalance).toFixed(4);
    return `❌ Insufficient balance\n\nYou have: ${tokenBalance.toFixed(4)} ${data.token}\nRequired: ${required.toFixed(4)} ${data.token}\nShortage: ${shortage} ${data.token}\n\n💡 Deposit ${shortage} ${data.token} to continue.\nWallet: ${sender.walletAddress.slice(0, 16)}...`;
  }

  const transferId = db.createTransfer(senderPhone, data.recipientPhone, data.amount, data.token);
  const keypair = getKeypair(sender);
  const result = await privateTransfer(keypair, recipient.walletAddress, data.amount, data.token);

  if (result.success) {
    db.updateTransfer(transferId, 'confirmed', result.txSignature);
    
    // Generate and send receipt
    if (channel === 'whatsapp' && result.txSignature) {
      const receiptUrl = await generateReceipt({
        amount: data.amount,
        token: data.token,
        recipient: data.recipientPhone,
        txSignature: result.txSignature,
        timestamp: new Date().toLocaleString(),
        isPrivate: result.amountHidden || false,
        isAnonymous: false,
      });

      if (receiptUrl) {
        try {
          const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
          await client.messages.create({
            body: `✓ Payment sent!\n${data.amount} ${data.token} to ${data.recipientPhone}`,
            from: `whatsapp:${config.twilio.whatsappNumber}`,
            to: `whatsapp:${senderPhone}`,
            mediaUrl: [receiptUrl]
          });
        } catch (err) {
          console.error('Failed to send receipt:', err);
        }
      }
    }

    // Notify recipient
    try {
      const notify = channel === 'whatsapp' ? sendWhatsApp : sendSms;
      await notify(data.recipientPhone, `💰 You received ${data.amount} ${data.token}!\nFrom: ${senderPhone.slice(-4)}\n\nText "balance" to check.`);
    } catch {}
    
    db.audit(senderPhone, 'transfer', { to: data.recipientPhone, amount: data.amount, token: data.token, tx: result.txSignature });
    return `✓ Sent ${data.amount} ${data.token} to ${data.recipientPhone}\nAmount: [PRIVATE]\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    db.updateTransfer(transferId, 'failed');
    // Save failed action for retry
    db.saveFailedAction(senderPhone, 'send_payment', data, result.error || 'Unknown error');
    return `❌ Transfer failed: ${result.error}\n\nReply "retry" to try again.`;
  }
}

async function executeAnonSend(user: any, data: { recipientWallet: string; amount: number; token: string }): Promise<string> {
  const result = await anonymousSend(user.encryptedPrivateKey, data.amount, data.recipientWallet, data.token);

  if (result.success) {
    db.audit(user.phone, 'anon_transfer', { to: data.recipientWallet, amount: data.amount, token: data.token });
    return `✓ Sent ${data.amount} ${data.token} anonymously\nSender: [UNTRACEABLE]\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    return `Anonymous send failed: ${result.error}`;
  }
}

async function executeCrossChainSend(senderPhone: string, sender: any, data: { recipientPhone: string; amount: number; token: string; destinationChain: string; recipientEvmAddress: string }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const { executeCrossChainSwap } = await import('./services/silentswap');
  const keypair = getKeypair(sender);
  
  try {
    const result = await executeCrossChainSwap(
      keypair,
      data.amount.toString(),
      data.recipientPhone,
      data.recipientEvmAddress,
      data.destinationChain as 'ethereum' | 'avalanche' | 'polygon'
    );

    if (channel === 'whatsapp') {
      const receiptUrl = await generateReceipt({
        amount: data.amount,
        token: data.token,
        recipient: `${data.recipientPhone} (${data.destinationChain})`,
        txSignature: result.signature,
        timestamp: new Date().toLocaleString(),
        isPrivate: true,
        isAnonymous: false,
        isCrossChain: true,
      });
      
      if (receiptUrl) {
        const client = require('twilio')(config.twilio.accountSid, config.twilio.authToken);
        await client.messages.create({
          body: `✓ Cross-chain transfer complete!\n\nSolana: ${result.signature.slice(0, 16)}...\nBridge: ${result.bridgeTxHash.slice(0, 16)}...`,
          from: `whatsapp:${config.twilio.whatsappNumber}`,
          to: `whatsapp:${senderPhone}`,
          mediaUrl: [receiptUrl]
        });
        return '';
      }
    }

    return `✓ Cross-chain transfer complete!\n\nSolana: ${result.signature.slice(0, 16)}...\nBridge: ${result.bridgeTxHash.slice(0, 16)}...`;
  } catch (err: any) {
    console.error('[CrossChainSend] Error:', err);
    return `Cross-chain transfer failed. Please try again later.`;
  }
}

async function executeSplitPayment(senderPhone: string, sender: any, data: { totalAmount: number; token: string; recipients: string[] }, channel: 'sms' | 'whatsapp'): Promise<string> {
  const amountPerPerson = data.totalAmount / data.recipients.length;
  const keypair = getKeypair(sender);
  const results: string[] = [];

  for (const recipientPhone of data.recipients) {
    try {
      const { user: recipient } = await getOrCreateUser(recipientPhone);
      const result = await privateTransfer(keypair, recipient.walletAddress, amountPerPerson, data.token);
      
      if (result.success) {
        db.createTransfer(senderPhone, recipientPhone, amountPerPerson, data.token);
        results.push(`✓ ${recipientPhone.slice(-4)}`);
        
        await sendWhatsApp(recipientPhone, `💸 You received ${amountPerPerson.toFixed(4)} ${data.token} from ${senderPhone.slice(-4)}\n\n[PRIVATE AMOUNT]`);
      } else {
        results.push(`✗ ${recipientPhone.slice(-4)}`);
      }
    } catch (err) {
      results.push(`✗ ${recipientPhone.slice(-4)}`);
    }
  }

  return `💸 Split Payment Complete\n\n${data.totalAmount} ${data.token} → ${data.recipients.length} people\n${amountPerPerson.toFixed(4)} ${data.token} each\n\n${results.join('\n')}`;
}

async function executeDeposit(user: any, data: { amount: number; token: string }): Promise<string> {
  const result = await depositToPrivate(user.encryptedPrivateKey, data.amount, data.token);

  if (result.success) {
    const newBalance = await getPrivateBalance(user.encryptedPrivateKey, data.token);
    db.audit(user.phone, 'deposit', { amount: data.amount, token: data.token });
    return `✓ Deposited ${data.amount} ${data.token} to private pool\nPrivate balance: ${newBalance.toFixed(4)} ${data.token}`;
  } else {
    return `Deposit failed: ${result.error}`;
  }
}

async function executeWithdraw(user: any, data: { amount: number; token: string }): Promise<string> {
  const { withdrawFromPrivate } = await import('./services/privacycash');
  const result = await withdrawFromPrivate(user.encryptedPrivateKey, data.amount, user.walletAddress, data.token);

  if (result.success) {
    db.audit(user.phone, 'withdraw', { amount: data.amount, token: data.token });
    return `✓ Withdrew ${data.amount} ${data.token} to public wallet\nTx: ${result.txSignature?.slice(0, 16)}...`;
  } else {
    return `Withdraw failed: ${result.error}`;
  }
}

// SMS webhook
app.post('/sms', async (req, res) => {
  const from = req.body.From;
  const body = req.body.Body?.trim() || '';
  console.log(`SMS from ${from}: ${body}`);

  if (isRateLimited(from)) {
    return res.type('text/xml').send(`<Response><Message>Too many requests. Please wait a minute.</Message></Response>`);
  }

  try {
    const response = await handleMessage(from, body, 'sms');
    res.type('text/xml').send(`<Response><Message>${response}</Message></Response>`);
  } catch (err) {
    console.error('SMS Error:', err);
    res.type('text/xml').send(`<Response><Message>Something went wrong. Try again.</Message></Response>`);
  }
});

// WhatsApp webhook
app.post('/whatsapp', async (req, res) => {
  const from = req.body.From?.replace('whatsapp:', '') || '';
  const body = req.body.Body?.trim() || '';
  console.log(`WhatsApp from ${from}: ${body}`);

  // Send immediate empty response, then process async
  res.sendStatus(200);

  if (isRateLimited(from)) {
    await sendWhatsApp(from, 'Too many requests. Please wait a minute.');
    return;
  }

  try {
    await sendTypingIndicator(from);
    const response = await handleMessage(from, body, 'whatsapp');
    if (response) {
      await sendWhatsApp(from, response);
    }
  } catch (err) {
    console.error('WhatsApp Error:', err);
    await sendWhatsApp(from, 'Something went wrong. Try again.');
  }
});

// Helius webhook
app.post('/webhook/helius', async (req, res) => {
  res.sendStatus(200);
  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const event of events) {
      if (event.type === 'TRANSFER' && event.nativeTransfers?.length) {
        for (const transfer of event.nativeTransfers) {
          const user = db.getUserByWallet(transfer.toUserAccount);
          if (user && !isRateLimited(`helius:${user.phone}`)) {
            const amount = (transfer.amount / 1e9).toFixed(4);
            try { await sendWhatsApp(user.phone, `💰 You received ${amount} SOL!\n\nText "balance" to check.`); } catch {}
          }
        }
      }
    }
  } catch (err) {
    console.error('Helius webhook error:', err);
  }
  res.sendStatus(200);
});

// PIN confirmation page
app.get('/confirm/:token', (req, res) => {
  const { token } = req.params;
  const confirmation = db.getPinConfirmation(token);
  if (!confirmation) {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>❌ Link expired</h2><p>Request a new link from WhatsApp.</p></body></html>');
  }
  
  const isSetPin = confirmation.action === 'set_pin' || confirmation.action === 'update_pin';
  const title = isSetPin ? (confirmation.action === 'update_pin' ? 'Update PIN' : 'Set PIN') : 'Confirm Payment';
  const subtitle = isSetPin ? 'Enter a 4-digit PIN' : 'Enter your PIN to authorize';
  const btnText = isSetPin ? 'Set PIN' : 'Confirm Payment';
  const amountHtml = isSetPin ? '' : `<div class="amount">${confirmation.data.amount || ''} ${confirmation.data.token || 'SOL'}</div><p>To: ${confirmation.data.recipientPhone?.slice(-4) || confirmation.data.recipientWallet?.slice(0,8) || 'recipient'}...</p>`;

  res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} - HushPay</title>
<style>*{box-sizing:border-box}body{font-family:-apple-system,sans-serif;background:#0a0a0a;color:#fff;margin:0;padding:20px;min-height:100vh;display:flex;align-items:center;justify-content:center}
.card{background:#1a1a1a;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center}h1{font-size:24px;margin:0 0 8px}
.subtitle{color:#888;margin-bottom:24px}.amount{font-size:32px;color:#00ff88;margin:16px 0}.pin-input{display:flex;gap:8px;justify-content:center;margin:24px 0}
.pin-input input{width:48px;height:56px;border:2px solid #333;border-radius:12px;background:#0a0a0a;color:#fff;font-size:24px;text-align:center;-webkit-text-security:disc}
.pin-input input:focus{border-color:#00ff88;outline:none}button{width:100%;padding:16px;border:none;border-radius:12px;background:#00ff88;color:#000;font-size:16px;font-weight:600;cursor:pointer}
button:disabled{background:#333;color:#666}</style></head>
<body><div class="card"><h1>🔐 ${title}</h1><p class="subtitle">${subtitle}</p>${amountHtml}
<form method="POST" action="/confirm/${token}"><div class="pin-input">
<input type="tel" name="p1" maxlength="1" inputmode="numeric" required autofocus>
<input type="tel" name="p2" maxlength="1" inputmode="numeric" required>
<input type="tel" name="p3" maxlength="1" inputmode="numeric" required>
<input type="tel" name="p4" maxlength="1" inputmode="numeric" required>
</div><input type="hidden" name="pin" id="pin"><button type="submit">${btnText}</button></form>
<script>const inputs=document.querySelectorAll('.pin-input input'),pinField=document.getElementById('pin');
inputs.forEach((inp,i)=>{inp.addEventListener('input',e=>{if(e.target.value){inputs[i+1]?.focus()}pinField.value=[...inputs].map(x=>x.value).join('')});
inp.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!e.target.value){inputs[i-1]?.focus()}})});</script></div></body></html>`);
});

// PIN confirmation submit
app.post('/confirm/:token', async (req, res) => {
  const { token } = req.params;
  const pin = req.body.pin || `${req.body.p1}${req.body.p2}${req.body.p3}${req.body.p4}`;
  
  const confirmation = db.getPinConfirmation(token);
  if (!confirmation) {
    return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>❌ Link expired</h2></body></html>');
  }

  // Handle set/update PIN (no verification needed)
  if (confirmation.action === 'set_pin' || confirmation.action === 'update_pin') {
    if (!/^\d{4}$/.test(pin)) {
      return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>❌ PIN must be 4 digits</h2><a href="/confirm/${token}" style="color:#00ff88">Try again</a></body></html>`);
    }
    setPin(confirmation.phone, pin);
    db.deletePinConfirmation(token);
    db.audit(confirmation.phone, confirmation.action === 'update_pin' ? 'pin_update' : 'pin_set', {});
    try { await sendWhatsApp(confirmation.phone, `✓ PIN ${confirmation.action === 'update_pin' ? 'updated' : 'set'} successfully!\n\n🔐 You'll need this PIN for payments over 0.1 SOL.`); } catch {}
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>✅ PIN ${confirmation.action === 'update_pin' ? 'Updated' : 'Set'}!</h2><p style="color:#888">You can close this window.</p></body></html>`);
  }

  // Validate PIN for payment actions
  const { validateConfirmation } = await import('./services/pin');
  const result = validateConfirmation(token, pin);
  
  if (!result.valid) {
    return res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>❌ ${result.error}</h2><a href="/confirm/${token}" style="color:#00ff88">Try again</a></body></html>`);
  }

  const user = db.getUser(result.phone!);
  if (!user) return res.send('<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff"><h2>❌ User not found</h2></body></html>');

  let response = '';
  if (result.action === 'send_payment') {
    response = await executeSendPayment(result.phone!, user, result.data, 'whatsapp');
  } else if (result.action === 'anon_send') {
    response = await executeAnonSend(user, result.data);
  } else if (result.action === 'withdraw') {
    response = await executeWithdraw(user, result.data);
  } else if (result.action === 'deposit') {
    response = await executeDeposit(user, result.data);
  }

  try { await sendWhatsApp(result.phone!, response); } catch {}

  const success = response.startsWith('✓');
  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:50px;background:#0a0a0a;color:#fff">
<h2>${success ? '✅' : '❌'} ${success ? 'Payment Sent!' : 'Failed'}</h2><p style="color:#888">${response.replace(/\n/g,'<br>')}</p>
<p style="margin-top:24px;color:#666">You can close this window.</p></body></html>`);
});

app.get('/', (req, res) => res.send('HushPay Running'));

// Waitlist endpoint
app.post('/api/waitlist', async (req, res) => {
  try {
    const { email, phone } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    
    db.addWaitlistEntry(email, phone || null);
    res.json({ success: true });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
});

const server = app.listen(config.server.port, () => {
  console.log(`HushPay running on port ${config.server.port}`);
  startRecurringPaymentProcessor();
  initPriceAlerts();
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('HTTP server closed');
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
