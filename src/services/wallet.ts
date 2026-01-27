import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { config } from '../config';
import { db } from './database';
import { registerWalletForNotifications } from './helius';
import type { User } from '../types';
import bs58 from 'bs58';

const connection = new Connection(config.solana.rpcUrl);

export async function getOrCreateUser(phone: string): Promise<{ user: User; isNew: boolean }> {
  // Validate and normalize phone number
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  if (!/^\+\d{10,15}$/.test(normalizedPhone)) {
    throw new Error('Invalid phone number format');
  }

  const existing = db.getUser(normalizedPhone);
  if (existing) return { user: existing, isNew: false };

  const keypair = Keypair.generate();
  const walletAddress = keypair.publicKey.toBase58();
  const privateKey = bs58.encode(keypair.secretKey);

  const user = db.createUser(normalizedPhone, walletAddress, privateKey);
  
  // Register wallet for notifications
  registerWalletForNotifications(walletAddress).catch(() => {});
  
  return { user, isNew: true };
}

export async function getBalance(walletAddress: string): Promise<{ sol: number; usd1: number }> {
  const pubkey = new PublicKey(walletAddress);

  // SOL balance
  const solBalance = await connection.getBalance(pubkey);
  const sol = solBalance / LAMPORTS_PER_SOL;

  // USD1 balance
  let usd1 = 0;
  if (config.solana.usd1Mint) {
    try {
      const mint = new PublicKey(config.solana.usd1Mint);
      const ata = await getAssociatedTokenAddress(mint, pubkey);
      const account = await getAccount(connection, ata);
      usd1 = Number(account.amount) / 1e6; // Assuming 6 decimals
    } catch {
      // No token account = 0 balance
    }
  }

  return { sol, usd1 };
}

export function getKeypair(user: User): Keypair {
  const privateKey = db.decryptPrivateKey(user.encryptedPrivateKey);
  return Keypair.fromSecretKey(bs58.decode(privateKey));
}
