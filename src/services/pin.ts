import * as crypto from 'crypto-js';
import { db } from './database';
import { config } from '../config';

const PIN_THRESHOLD = 0.1; // SOL - require PIN for amounts >= this

export function hashPin(pin: string): string {
  return crypto.SHA256(pin + config.encryption.key).toString();
}

export function verifyPin(phone: string, pin: string): boolean {
  const stored = db.getUserPinHash(phone);
  if (!stored) return false;
  return stored === hashPin(pin);
}

export function setPin(phone: string, pin: string): boolean {
  if (!/^\d{4,6}$/.test(pin)) return false;
  db.setUserPin(phone, hashPin(pin));
  return true;
}

export function requiresPin(phone: string, amount: number): boolean {
  if (!db.hasPin(phone)) return false;
  return amount >= PIN_THRESHOLD;
}

export function createConfirmationLink(phone: string, action: string, data: any): string {
  const token = db.createPinConfirmation(phone, action, data);
  return `${config.server.baseUrl}/confirm/${token}`;
}

export function validateConfirmation(token: string, pin: string): { valid: boolean; error?: string; phone?: string; action?: string; data?: any } {
  const confirmation = db.getPinConfirmation(token);
  if (!confirmation) return { valid: false, error: 'Link expired or invalid' };
  
  const attempts = db.incrementPinAttempts(token);
  if (attempts > 3) {
    db.deletePinConfirmation(token);
    return { valid: false, error: 'Too many attempts. Request a new link.' };
  }

  if (!verifyPin(confirmation.phone, pin)) {
    return { valid: false, error: `Wrong PIN. ${3 - attempts} attempts left.` };
  }

  db.deletePinConfirmation(token);
  return { valid: true, phone: confirmation.phone, action: confirmation.action, data: confirmation.data };
}
