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

export interface PaymentIntent {
  action: 'send_payment';
  amount: number;
  token: string;
  recipientPhone: string;
}

export interface AnonSendIntent {
  action: 'anon_send';
  amount: number;
  token: string;
  recipientWallet: string;
}

export interface DepositIntent {
  action: 'deposit';
  amount: number;
  token: string;
}

export interface WithdrawIntent {
  action: 'withdraw';
  amount: number;
  token: string;
}

export interface BalanceIntent {
  action: 'check_balance';
}

export interface WalletIntent {
  action: 'get_wallet';
}

export interface ReceiptIntent {
  action: 'get_receipts';
}

export interface ChatIntent {
  action: 'chat';
}

export type Intent = PaymentIntent | AnonSendIntent | DepositIntent | WithdrawIntent | BalanceIntent | WalletIntent | ReceiptIntent | ChatIntent;
