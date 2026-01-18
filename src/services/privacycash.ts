import { PrivacyCash } from 'privacycash';
import { PublicKey, Keypair } from '@solana/web3.js';
import { config } from '../config';
import { db } from './database';
import bs58 from 'bs58';

interface PrivacyResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

function getKeypairFromEncrypted(encryptedPrivateKey: string): Keypair {
  const privateKey = db.decryptPrivateKey(encryptedPrivateKey);
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}

function getClient(encryptedPrivateKey: string): PrivacyCash {
  const keypair = getKeypairFromEncrypted(encryptedPrivateKey);
  return new PrivacyCash({
    RPC_url: config.solana.rpcUrl,
    owner: keypair,
    enableDebug: true,
  });
}

export async function getPrivateBalance(encryptedPrivateKey: string, token: string = 'SOL'): Promise<number> {
  // Privacy Cash only works on mainnet
  if (config.solana.rpcUrl.includes('devnet')) {
    return 0;
  }

  try {
    const client = getClient(encryptedPrivateKey);
    if (token.toUpperCase() === 'SOL') {
      const balance = await client.getPrivateBalance();
      return balance.lamports / 1e9;
    } else if (token.toUpperCase() === 'USDC') {
      const balance = await client.getPrivateBalanceUSDC();
      return balance.amount / 1e6;
    } else {
      const mint = getMintAddress(token);
      if (!mint) return 0;
      const balance = await client.getPrivateBalanceSpl(new PublicKey(mint));
      return balance.amount / getDecimals(token);
    }
  } catch (err: any) {
    console.error('getPrivateBalance error:', err.message);
    return 0;
  }
}

export async function depositToPrivate(encryptedPrivateKey: string, amount: number, token: string = 'SOL'): Promise<PrivacyResult> {
  // Privacy Cash only works on mainnet
  if (config.solana.rpcUrl.includes('devnet')) {
    return { success: false, error: 'Private pool only available on mainnet. Switch to mainnet to use this feature.' };
  }

  try {
    const client = getClient(encryptedPrivateKey);
    if (token.toUpperCase() === 'SOL') {
      const res = await client.deposit({ lamports: Math.floor(amount * 1e9) });
      return { success: true, txSignature: res.tx };
    } else if (token.toUpperCase() === 'USDC') {
      const res = await client.depositUSDC({ base_units: Math.floor(amount * 1e6) });
      return { success: true, txSignature: res.tx };
    } else {
      const mint = getMintAddress(token);
      if (!mint) return { success: false, error: 'Unsupported token' };
      const res = await client.depositSPL({ amount: Math.floor(amount * getDecimals(token)), mintAddress: new PublicKey(mint) });
      return { success: true, txSignature: res.tx };
    }
  } catch (err: any) {
    console.error('depositToPrivate error:', err);
    return { success: false, error: err.message };
  }
}

export async function withdrawFromPrivate(encryptedPrivateKey: string, amount: number, recipientAddress: string, token: string = 'SOL'): Promise<PrivacyResult> {
  // Privacy Cash only works on mainnet
  if (config.solana.rpcUrl.includes('devnet')) {
    return { success: false, error: 'Private pool only available on mainnet. Switch to mainnet to use this feature.' };
  }

  try {
    const client = getClient(encryptedPrivateKey);
    if (token.toUpperCase() === 'SOL') {
      const res = await client.withdraw({ lamports: Math.floor(amount * 1e9), recipientAddress });
      return { success: true, txSignature: res.tx };
    } else if (token.toUpperCase() === 'USDC') {
      const res = await client.withdrawUSDC({ base_units: Math.floor(amount * 1e6), recipientAddress });
      return { success: true, txSignature: res.tx };
    } else {
      const mint = getMintAddress(token);
      if (!mint) return { success: false, error: 'Unsupported token' };
      const res = await client.withdrawSPL({ amount: Math.floor(amount * getDecimals(token)), mintAddress: new PublicKey(mint), recipientAddress });
      return { success: true, txSignature: res.tx };
    }
  } catch (err: any) {
    console.error('withdrawFromPrivate error:', err);
    return { success: false, error: err.message };
  }
}

export async function anonymousSend(encryptedPrivateKey: string, amount: number, recipientAddress: string, token: string = 'SOL'): Promise<PrivacyResult> {
  return withdrawFromPrivate(encryptedPrivateKey, amount, recipientAddress, token);
}

function getMintAddress(token: string): string | null {
  const mints: Record<string, string> = {
    'USDC': 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    'USDT': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  };
  return mints[token.toUpperCase()] || null;
}

function getDecimals(token: string): number {
  const decimals: Record<string, number> = { 'SOL': 1e9, 'USDC': 1e6, 'USDT': 1e6 };
  return decimals[token.toUpperCase()] || 1e9;
}
