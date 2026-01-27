import { Contact, Message, Vault, ProofTemplate } from '../types';

export const MOCK_CONTACTS: Contact[] = [
  { id: '1', name: 'Landlord_Dave', status: 'online', reputation: 85 },
  { id: '2', name: 'Alice_Crypto', status: 'offline', reputation: 92 },
  { id: '3', name: 'Bank_DAO', status: 'online', reputation: 100 },
];

export const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'Landlord_Dave', content: 'Hey, I need proof of funds for the apartment.', timestamp: '10:42 AM', isMe: false, type: 'text' },
  { id: '2', sender: 'Me', content: 'Sure, generating a ZK proof now. You won\'t see my balance, just confirmation.', timestamp: '10:44 AM', isMe: true, type: 'text' },
];

export const MOCK_VAULTS: Vault[] = [
  { id: 'v1', name: 'Emergency Fund', amount: 5000, lockDate: '2023-01-01', unlockDate: '2024-01-01', status: 'locked' },
  { id: 'v2', name: 'New Car', amount: 1200, lockDate: '2023-06-15', unlockDate: '2023-12-15', status: 'unlocked' },
];

export const MOCK_TEMPLATES: ProofTemplate[] = [
  { id: 'p1', title: 'Solvency Check', description: 'Prove balance > X without revealing total.', requirement: 'Balance > $2,000' },
  { id: 'p2', title: 'Income Stability', description: 'Prove regular deposits > Y for 6 months.', requirement: 'Monthly In > $3,000' },
  { id: 'p3', title: 'Credit Score', description: 'Aleo-computed private reputation score.', requirement: 'Score > 700' },
];
