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
