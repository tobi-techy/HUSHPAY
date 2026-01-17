import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { db } from './database';
import type { Intent } from '../types';

const genai = new GoogleGenerativeAI(config.gemini.apiKey);
const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

const SYSTEM_PROMPT = `You are HushPay, a friendly SMS assistant for private crypto payments on Solana.

Keep responses SHORT (SMS has character limits). Be conversational.

IMPORTANT: Respond with JSON only. Format:
{"reply": "your message", "intent": null}

Or for actions:
{"reply": "Send 50 USD1 to +1234567890?\\n\\nReply YES to confirm.", "intent": {"action": "send_payment", "amount": 50, "token": "USD1", "recipientPhone": "+1234567890"}}
{"reply": "", "intent": {"action": "check_balance"}}
{"reply": "", "intent": {"action": "get_receipts"}}

Actions: send_payment, check_balance, get_receipts, chat`;

export async function chat(phone: string, userMessage: string): Promise<{ reply: string; intent: Intent | null }> {
  db.saveMessage(phone, 'user', userMessage);

  const history = db.getMessages(phone);
  const prompt = `${SYSTEM_PROMPT}\n\nConversation:\n${history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nRespond with JSON:`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(text);

  if (parsed.reply) db.saveMessage(phone, 'assistant', parsed.reply);

  return { reply: parsed.reply || '', intent: parsed.intent };
}
