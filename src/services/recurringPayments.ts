import { db } from './database';
import { getKeypair } from './wallet';
import { privateTransfer } from './shadowwire';
import { sendWhatsApp } from './twilio';

export function startRecurringPaymentProcessor() {
  // Check every 5 minutes
  setInterval(async () => {
    try {
      const duePayments = db.getDueRecurringPayments();
      
      for (const payment of duePayments) {
        try {
          const user = db.getUser(payment.sender_phone);
          if (!user) continue;

          const recipient = db.getUser(payment.recipient_phone);
          if (!recipient) continue;

          const keypair = getKeypair(user);
          const result = await privateTransfer(
            keypair,
            recipient.walletAddress,
            payment.amount,
            payment.token
          );

          if (result.success) {
            db.createTransfer(
              payment.sender_phone,
              payment.recipient_phone,
              payment.amount,
              payment.token
            );

            await sendWhatsApp(
              payment.sender_phone,
              `✓ Recurring payment sent\n\n${payment.amount} ${payment.token} → ${payment.recipient_phone.slice(-4)}\n[PRIVATE AMOUNT]`
            );

            await sendWhatsApp(
              payment.recipient_phone,
              `💸 You received ${payment.amount} ${payment.token}\n\n[PRIVATE AMOUNT]`
            );

            db.updateRecurringPaymentNextRun(payment.id, payment.frequency);
          }
        } catch (err) {
          console.error(`[RecurringPayment] Error processing payment ${payment.id}:`, err);
        }
      }
    } catch (err) {
      console.error('[RecurringPayment] Error:', err);
    }
  }, 5 * 60 * 1000); // 5 minutes

  console.log('[RecurringPayment] Processor started');
}
