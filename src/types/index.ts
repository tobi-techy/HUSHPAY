export interface User {
  id: number;
  phone: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  createdAt: string;
}

export interface Transfer {
  id: number;
  senderPhone: string;
  recipientPhone: string;
  amount: number;
  token: string;
  txSignature: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface Message {
  id: number;
  phone: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface SmsMessage {
  from: string;
  body: string;
  messageSid: string;
}

export interface PaymentIntent {
  action: 'send_payment';
  amount: number;
  token: string;
  recipientPhone: string;
}

export interface BalanceIntent {
  action: 'check_balance';
}

export interface ReceiptIntent {
  action: 'get_receipts';
}

export interface HelpIntent {
  action: 'help';
}

export interface ChatIntent {
  action: 'chat';
}

export type Intent = PaymentIntent | BalanceIntent | ReceiptIntent | HelpIntent | ChatIntent;
