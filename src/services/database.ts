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
        preferred_language TEXT DEFAULT 'en',
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

      CREATE TABLE IF NOT EXISTS recurring_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_phone TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        amount REAL NOT NULL,
        token TEXT NOT NULL,
        frequency TEXT NOT NULL,
        next_run TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS pending_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE NOT NULL,
        action TEXT NOT NULL,
        data TEXT NOT NULL,
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
      preferredLanguage: row.preferred_language || 'en',
      createdAt: row.created_at,
    };
  }

  getUserByWallet(walletAddress: string): User | undefined {
    const row = this.db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(walletAddress) as any;
    if (!row) return undefined;
    return {
      id: row.id,
      phone: row.phone,
      walletAddress: row.wallet_address,
      encryptedPrivateKey: row.encrypted_private_key,
      preferredLanguage: row.preferred_language || 'en',
      createdAt: row.created_at,
    };
  }

  setUserLanguage(phone: string, language: string): void {
    this.db.prepare('UPDATE users SET preferred_language = ? WHERE phone = ?').run(language, phone);
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

  // Pending action methods (for deposit/withdraw/anon_send)
  savePendingAction(phone: string, action: string, data: any) {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.db.prepare('DELETE FROM pending_actions WHERE phone = ?').run(phone);
    this.db.prepare('INSERT INTO pending_actions (phone, action, data, expires_at) VALUES (?, ?, ?, ?)').run(phone, action, JSON.stringify(data), expiresAt);
  }

  getPendingAction(phone: string): { action: string; data: any } | null {
    const row = this.db.prepare('SELECT * FROM pending_actions WHERE phone = ? AND expires_at > ?').get(phone, new Date().toISOString()) as any;
    if (!row) return null;
    return { action: row.action, data: JSON.parse(row.data) };
  }

  clearPendingAction(phone: string) {
    this.db.prepare('DELETE FROM pending_actions WHERE phone = ?').run(phone);
  }

  // Recurring payment methods
  createRecurringPayment(senderPhone: string, recipientPhone: string, amount: number, token: string, frequency: string) {
    const nextRun = this.calculateNextRun(frequency);
    this.db.prepare('INSERT INTO recurring_payments (sender_phone, recipient_phone, amount, token, frequency, next_run) VALUES (?, ?, ?, ?, ?, ?)').run(senderPhone, recipientPhone, amount, token, frequency, nextRun);
  }

  getDueRecurringPayments(): any[] {
    return this.db.prepare('SELECT * FROM recurring_payments WHERE active = 1 AND next_run <= ?').all(new Date().toISOString()) as any[];
  }

  updateRecurringPaymentNextRun(id: number, frequency: string) {
    const nextRun = this.calculateNextRun(frequency);
    this.db.prepare('UPDATE recurring_payments SET next_run = ? WHERE id = ?').run(nextRun, id);
  }

  cancelRecurringPayment(senderPhone: string, recipientPhone: string) {
    this.db.prepare('UPDATE recurring_payments SET active = 0 WHERE sender_phone = ? AND recipient_phone = ?').run(senderPhone, recipientPhone);
  }

  getActiveRecurringPayments(phone: string): any[] {
    return this.db.prepare('SELECT * FROM recurring_payments WHERE sender_phone = ? AND active = 1').all(phone) as any[];
  }

  // Failed action methods (for retry)
  saveFailedAction(phone: string, action: string, data: any, error: string) {
    this.db.exec(`CREATE TABLE IF NOT EXISTS failed_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      error TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    this.db.prepare('DELETE FROM failed_actions WHERE phone = ?').run(phone);
    this.db.prepare('INSERT INTO failed_actions (phone, action, data, error) VALUES (?, ?, ?, ?)').run(phone, action, JSON.stringify(data), error);
  }

  getFailedAction(phone: string): { action: string; data: any; error: string } | null {
    try {
      const row = this.db.prepare('SELECT * FROM failed_actions WHERE phone = ?').get(phone) as any;
      if (!row) return null;
      return { action: row.action, data: JSON.parse(row.data), error: row.error };
    } catch { return null; }
  }

  clearFailedAction(phone: string) {
    try { this.db.prepare('DELETE FROM failed_actions WHERE phone = ?').run(phone); } catch {}
  }

  // PIN management
  setUserPin(phone: string, pinHash: string) {
    try { this.db.exec(`ALTER TABLE users ADD COLUMN pin_hash TEXT`); } catch {}
    this.db.prepare('UPDATE users SET pin_hash = ? WHERE phone = ?').run(pinHash, phone);
  }

  getUserPinHash(phone: string): string | null {
    try {
      const row = this.db.prepare('SELECT pin_hash FROM users WHERE phone = ?').get(phone) as any;
      return row?.pin_hash || null;
    } catch { return null; }
  }

  hasPin(phone: string): boolean {
    return !!this.getUserPinHash(phone);
  }

  // PIN confirmation tokens
  createPinConfirmation(phone: string, action: string, data: any): string {
    this.db.exec(`CREATE TABLE IF NOT EXISTS pin_confirmations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
    const token = crypto.lib.WordArray.random(16).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.db.prepare('DELETE FROM pin_confirmations WHERE phone = ?').run(phone);
    this.db.prepare('INSERT INTO pin_confirmations (token, phone, action, data, expires_at) VALUES (?, ?, ?, ?, ?)').run(token, phone, action, JSON.stringify(data), expiresAt);
    return token;
  }

  getPinConfirmation(token: string): { phone: string; action: string; data: any; attempts: number } | null {
    try {
      const row = this.db.prepare('SELECT * FROM pin_confirmations WHERE token = ? AND expires_at > ?').get(token, new Date().toISOString()) as any;
      if (!row) return null;
      return { phone: row.phone, action: row.action, data: JSON.parse(row.data), attempts: row.attempts };
    } catch { return null; }
  }

  incrementPinAttempts(token: string): number {
    this.db.prepare('UPDATE pin_confirmations SET attempts = attempts + 1 WHERE token = ?').run(token);
    const row = this.db.prepare('SELECT attempts FROM pin_confirmations WHERE token = ?').get(token) as any;
    return row?.attempts || 0;
  }

  deletePinConfirmation(token: string) {
    this.db.prepare('DELETE FROM pin_confirmations WHERE token = ?').run(token);
  }

  // PIN entry state (for button-based entry)
  savePinEntryState(phone: string, action: string, data: any, currentPin: string = '') {
    this.db.exec(`CREATE TABLE IF NOT EXISTS pin_entry_state (
      phone TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      data TEXT NOT NULL,
      current_pin TEXT DEFAULT '',
      expires_at TEXT NOT NULL
    )`);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    this.db.prepare('INSERT OR REPLACE INTO pin_entry_state (phone, action, data, current_pin, expires_at) VALUES (?, ?, ?, ?, ?)').run(phone, action, JSON.stringify(data), currentPin, expiresAt);
  }

  getPinEntryState(phone: string): { action: string; data: any; currentPin: string } | null {
    try {
      const row = this.db.prepare('SELECT * FROM pin_entry_state WHERE phone = ? AND expires_at > ?').get(phone, new Date().toISOString()) as any;
      if (!row) return null;
      return { action: row.action, data: JSON.parse(row.data), currentPin: row.current_pin };
    } catch { return null; }
  }

  updatePinEntryPin(phone: string, pin: string) {
    this.db.prepare('UPDATE pin_entry_state SET current_pin = ? WHERE phone = ?').run(pin, phone);
  }

  clearPinEntryState(phone: string) {
    try { this.db.prepare('DELETE FROM pin_entry_state WHERE phone = ?').run(phone); } catch {}
  }

  // Contacts management
  saveContact(ownerPhone: string, contactPhone: string, name: string) {
    this.db.exec(`CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_phone TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(owner_phone, name)
    )`);
    this.db.prepare('INSERT OR REPLACE INTO contacts (owner_phone, contact_phone, name) VALUES (?, ?, ?)').run(ownerPhone, contactPhone, name.toLowerCase());
  }

  getContacts(ownerPhone: string): { name: string; phone: string }[] {
    try {
      const rows = this.db.prepare('SELECT name, contact_phone as phone FROM contacts WHERE owner_phone = ?').all(ownerPhone) as any[];
      return rows || [];
    } catch { return []; }
  }

  getContactByName(ownerPhone: string, name: string): string | null {
    try {
      const row = this.db.prepare('SELECT contact_phone FROM contacts WHERE owner_phone = ? AND name = ?').get(ownerPhone, name.toLowerCase()) as any;
      return row?.contact_phone || null;
    } catch { return null; }
  }

  deleteContact(ownerPhone: string, name: string) {
    try { this.db.prepare('DELETE FROM contacts WHERE owner_phone = ? AND name = ?').run(ownerPhone, name.toLowerCase()); } catch {}
  }

  private calculateNextRun(frequency: string): string {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        now.setMonth(now.getMonth() + 1);
        break;
    }
    return now.toISOString();
  }
}


export const db = new DatabaseService();
