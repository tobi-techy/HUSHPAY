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
  try {
    const phone = to.startsWith('+') ? to : `+${to}`;
    const result = await client.messages.create({
      body: message,
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${phone}`,
    });
    return result.sid;
  } catch (err: any) {
    if (err.code === 63038) {
      console.log('[Twilio] Daily message limit reached.');
      return 'rate_limited';
    }
    throw err;
  }
}

export async function sendWhatsAppWithButtons(to: string, body: string, buttons: string[]): Promise<string> {
  try {
    const phone = to.startsWith('+') ? to : `+${to}`;
    const result = await client.messages.create({
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${phone}`,
      body,
      persistentAction: buttons.slice(0, 3).map(b => `reply:${b}`),
    } as any);
    return result.sid;
  } catch (err: any) {
    // Fallback to regular message if buttons not supported
    return sendWhatsApp(to, body);
  }
}

export async function sendPinPad(to: string, prompt: string, currentPin: string = ''): Promise<string> {
  const display = currentPin ? '•'.repeat(currentPin.length) + '_'.repeat(4 - currentPin.length) : '____';
  const digitNum = currentPin.length + 1;
  
  let body = `${prompt}\n\n🔐 PIN: [ ${display} ]\n\n`;
  
  if (digitNum <= 4) {
    body += `Type digit ${digitNum} and send:`;
  }
  
  return sendWhatsApp(to, body);
}

export async function sendTypingIndicator(to: string): Promise<void> {
  try {
    await client.messages.create({
      contentSid: 'typing',
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${to}`,
    });
  } catch {}
}
