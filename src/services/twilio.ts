import twilio from 'twilio';
import { config } from '../config';

const client = twilio(config.twilio.accountSid, config.twilio.authToken);

export async function sendSms(to: string, message: string): Promise<string> {
  const result = await client.messages.create({
    body: message,
    from: config.twilio.phoneNumber,
    to,
  });
  return result.sid;
}

export async function sendWhatsApp(to: string, message: string): Promise<string> {
  const result = await client.messages.create({
    body: message,
    from: `whatsapp:${config.twilio.whatsappNumber}`,
    to: `whatsapp:${to}`,
  });
  return result.sid;
}

export async function sendTypingIndicator(to: string): Promise<void> {
  try {
    await client.messages.create({
      contentSid: 'typing',
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${to}`,
    });
  } catch {
    // Typing indicator not critical, ignore errors
  }
}
