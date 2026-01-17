import axios from 'axios';
import { config } from '../config';
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';

interface TransferResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

export async function privateTransfer(
  senderKeypair: Keypair,
  recipientAddress: string,
  amount: number,
  token: string
): Promise<TransferResult> {
  console.log('privateTransfer called:', { recipientAddress, amount, token, hasShadowwireKey: !!config.shadowwire.apiKey });

  // Use regular Solana transfer for SOL on devnet
  if (token.toUpperCase() === 'SOL' && config.solana.rpcUrl.includes('devnet')) {
    try {
      const connection = new Connection(config.solana.rpcUrl);
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: senderKeypair.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: Math.floor(amount * 1e9),
        })
      );
      const sig = await sendAndConfirmTransaction(connection, tx, [senderKeypair]);
      return { success: true, txSignature: sig };
    } catch (err: any) {
      console.error('SOL transfer error:', err);
      return { success: false, error: err.message || String(err) };
    }
  }

  if (!config.shadowwire.apiKey) {
    return { success: false, error: 'ShadowWire not configured' };
  }

  try {
    const response = await axios.post(
      `${config.shadowwire.apiUrl}/v1/transfer`,
      {
        sender: senderKeypair.publicKey.toBase58(),
        recipient: recipientAddress,
        amount,
        token,
      },
      {
        headers: {
          'Authorization': `Bearer ${config.shadowwire.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return { success: true, txSignature: response.data.signature };
  } catch (err: any) {
    return { success: false, error: err.response?.data?.message || 'Transfer failed' };
  }
}
