export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isMe: boolean;
  type: 'text' | 'proof';
  proofData?: {
    type: string;
    value: string;
    verified: boolean;
  };
}

export interface Contact {
  id: string;
  name: string;
  status: 'online' | 'offline';
  reputation: number;
}

export interface Vault {
  id: string;
  name: string;
  amount: number;
  lockDate: string;
  unlockDate: string;
  status: 'locked' | 'unlocked';
}

export interface ProofTemplate {
  id: string;
  title: string;
  description: string;
  requirement: string;
}
