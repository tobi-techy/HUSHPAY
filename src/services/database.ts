import Database from 'better-sqlite3';
import { User, Transfer, Message } from '../types';
import * as crypto from 'crypto-js';
import { config } from '../config';

class DatabaseService {
  private db: Database.Database;

  constructor() {
    this.db = new Database('hushpay.db');
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        wallet_address TEXT NOT NULL,
        encrypted_private_key TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_phone TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        amount REAL NOT NULL,
        token TEXT NOT NULL,
        tx_signature TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pending_transfers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        amount REAL NOT NULL,
        token TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
      CREATE INDEX IF NOT EXISTS idx_pending_phone ON pending_transfers(phone);
    `);
  }

  // User methods
  getUser(phone: string): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE phone = ?').get(phone) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      phone: row.phone,
      walletAddress: row.wallet_address,
      encryptedPrivateKey: row.encrypted_private_key,
      createdAt: row.created_at,
    };
  }

  createUser(phone: string, walletAddress: string, privateKey: string): User {
    const encrypted = crypto.AES.encrypt(privateKey, config.encryption.key).toString();
    this.db.prepare('INSERT INTO users (phone, wallet_address, encrypted_private_key) VALUES (?, ?, ?)').run(phone, walletAddress, encrypted);
    return this.getUser(phone)!;
  }

  decryptPrivateKey(encryptedKey: string): string {
    return crypto.AES.decrypt(encryptedKey, config.encryption.key).toString(crypto.enc.Utf8);
  }

  // Message methods
  saveMessage(phone: string, role: 'user' | 'assistant', content: string) {
    this.db.prepare('INSERT INTO messages (phone, role, content) VALUES (?, ?, ?)').run(phone, role, content);
  }

  getMessages(phone: string, limit = 20): Message[] {
    const rows = this.db.prepare('SELECT * FROM messages WHERE phone = ? ORDER BY created_at DESC LIMIT ?').all(phone, limit) as any[];
    return rows.reverse().map(row => ({
      id: row.id,
      phone: row.phone,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  // Transfer methods
  createTransfer(senderPhone: string, recipientPhone: string, amount: number, token: string): number {
    const result = this.db.prepare('INSERT INTO transfers (sender_phone, recipient_phone, amount, token) VALUES (?, ?, ?, ?)').run(senderPhone, recipientPhone, amount, token);
    return result.lastInsertRowid as number;
  }

  updateTransfer(id: number, status: string, txSignature?: string) {
    this.db.prepare('UPDATE transfers SET status = ?, tx_signature = ? WHERE id = ?').run(status, txSignature || null, id);
  }

  getTransfers(phone: string, limit = 10): Transfer[] {
    const rows = this.db.prepare('SELECT * FROM transfers WHERE sender_phone = ? OR recipient_phone = ? ORDER BY created_at DESC LIMIT ?').all(phone, phone, limit) as any[];
    return rows.map(row => ({
      id: row.id,
      senderPhone: row.sender_phone,
      recipientPhone: row.recipient_phone,
      amount: row.amount,
      token: row.token,
      txSignature: row.tx_signature,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  // Pending transfer methods
  savePendingTransfer(phone: string, recipientPhone: string, amount: number, token: string) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry
    this.db.prepare('DELETE FROM pending_transfers WHERE phone = ?').run(phone); // Clear old
    this.db.prepare('INSERT INTO pending_transfers (phone, recipient_phone, amount, token, expires_at) VALUES (?, ?, ?, ?, ?)').run(phone, recipientPhone, amount, token, expiresAt);
  }

  getPendingTransfer(phone: string): { recipientPhone: string; amount: number; token: string } | null {
    const row = this.db.prepare('SELECT * FROM pending_transfers WHERE phone = ? AND expires_at > ?').get(phone, new Date().toISOString()) as any;
    if (!row) return null;
    this.db.prepare('DELETE FROM pending_transfers WHERE id = ?').run(row.id);
    return { recipientPhone: row.recipient_phone, amount: row.amount, token: row.token };
  }
}

export const db = new DatabaseService();
