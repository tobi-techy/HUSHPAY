export interface User {
  id: number;
  phone: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  preferredLanguage?: string;
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

export interface PriceAlertIntent {
  action: 'price_alert';
  token: string;
  price: number;
  condition: 'above' | 'below';
}

export interface SetLanguageIntent {
  action: 'set_language';
  language: string;
}

export interface CrossChainSendIntent {
  action: 'cross_chain_send';
  amount: number;
  token: string;
  recipientPhone: string;
  destinationChain: 'ethereum' | 'avalanche' | 'polygon';
  recipientEvmAddress: string;
}

export interface SplitPaymentIntent {
  action: 'split_payment';
  totalAmount: number;
  token: string;
  recipients: string[];
}

export interface PaymentRequestIntent {
  action: 'payment_request';
  amount: number;
  token: string;
  fromPhone: string;
}

export interface RecurringPaymentIntent {
  action: 'recurring_payment';
  amount: number;
  token: string;
  recipientPhone: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface SetPinIntent {
  action: 'set_pin';
}

export interface SaveContactIntent {
  action: 'save_contact';
  phone: string;
  name: string;
}

export interface ListContactsIntent {
  action: 'list_contacts';
}

export interface HelpIntent {
  action: 'help';
}

export type Intent = PaymentIntent | AnonSendIntent | DepositIntent | WithdrawIntent | BalanceIntent | WalletIntent | ReceiptIntent | PriceAlertIntent | SetLanguageIntent | CrossChainSendIntent | SplitPaymentIntent | PaymentRequestIntent | RecurringPaymentIntent | ChatIntent | SetPinIntent | SaveContactIntent | ListContactsIntent | HelpIntent;
