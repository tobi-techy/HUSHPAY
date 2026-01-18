import { ShadowWireClient, RecipientNotFoundError, InsufficientBalanceError } from '@radr/shadowwire';
import { Keypair, Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { config } from '../config';

type SupportedToken = 'SOL' | 'RADR' | 'USDC' | 'ORE' | 'BONK' | 'JIM' | 'GODL' | 'HUSTLE' | 'ZEC' | 'CRT' | 'BLACKCOIN' | 'GIL' | 'ANON' | 'WLFI' | 'USD1' | 'AOL' | 'IQLABS';

const client = new ShadowWireClient({ debug: config.server.nodeEnv === 'development' });

interface TransferResult {
  success: boolean;
  txSignature?: string;
  error?: string;
  amountHidden?: boolean;
}

export async function privateTransfer(
  senderKeypair: Keypair,
  recipientAddress: string,
  amount: number,
  token: string
): Promise<TransferResult> {
  const senderWallet = senderKeypair.publicKey.toBase58();
  const tokenUpper = token.toUpperCase() as SupportedToken;

  // For devnet SOL, use regular transfer
  if (config.solana.rpcUrl.includes('devnet') && tokenUpper === 'SOL') {
    return devnetTransfer(senderKeypair, recipientAddress, amount);
  }

  try {
    const result = await client.transfer({
      sender: senderWallet,
      recipient: recipientAddress,
      amount,
      token: tokenUpper,
      type: 'internal',
      wallet: {
        signMessage: async (message: Uint8Array) => {
          const nacl = await import('tweetnacl');
          return nacl.sign.detached(message, senderKeypair.secretKey);
        }
      }
    });

    return {
      success: true,
      txSignature: result.tx_signature,
      amountHidden: result.amount_hidden,
    };
  } catch (err: any) {
    if (err instanceof RecipientNotFoundError) {
      try {
        const result = await client.transfer({
          sender: senderWallet,
          recipient: recipientAddress,
          amount,
          token: tokenUpper,
          type: 'external',
          wallet: {
            signMessage: async (message: Uint8Array) => {
              const nacl = await import('tweetnacl');
              return nacl.sign.detached(message, senderKeypair.secretKey);
            }
          }
        });
        return { success: true, txSignature: result.tx_signature, amountHidden: false };
      } catch (extErr: any) {
        return { success: false, error: extErr.message };
      }
    }
    if (err instanceof InsufficientBalanceError) {
      return { success: false, error: 'Insufficient balance' };
    }
    return { success: false, error: err.message };
  }
}

async function devnetTransfer(senderKeypair: Keypair, recipientAddress: string, amount: number): Promise<TransferResult> {
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
    return { success: true, txSignature: sig, amountHidden: false };
  } catch (err: any) {
    console.error('Devnet transfer error:', err);
    return { success: false, error: err.message };
  }
}
