import {
  createSilentSwapClient,
  createViemSigner,
  createSignInMessage,
  createEip712DocForWalletGeneration,
  createHdFacilitatorGroupFromEntropy,
  queryDepositCount,
  hexToBytes,
  quoteResponseToEip712Document,
  solveOptimalUsdcAmount,
  caip19FungibleEvmToken,
  FacilitatorKeyType,
  PublicKeyArgGroups,
  ENVIRONMENT,
  N_RELAY_CHAIN_ID_SOLANA,
  SB58_ADDR_SOL_PROGRAM_SYSTEM,
  createPhonyDepositCalldata,
  X_MAX_IMPACT_PERCENT,
  fetchRelayQuote,
  getRelayStatus,
  DeliveryMethod,
  type SilentSwapClient,
  type EvmSigner,
} from '@silentswap/sdk';
import { createWalletClient, http, publicActions, encodeFunctionData, erc20Abi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet, avalanche, polygon } from 'viem/chains';
import { Connection, Keypair, Transaction, PublicKey } from '@solana/web3.js';
import BigNumber from 'bignumber.js';
import { config } from '../config';

const CHAIN_MAP: Record<string, any> = {
  ethereum: mainnet,
  avalanche: avalanche,
  polygon: polygon,
};

const CHAIN_ID_MAP: Record<string, number> = {
  ethereum: 1,
  avalanche: 43114,
  polygon: 137,
};

const USDC_MAP: Record<string, `0x${string}`> = {
  ethereum: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  avalanche: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
};

async function authenticateAndDeriveEntropy(
  silentswap: SilentSwapClient,
  signer: EvmSigner
): Promise<`0x${string}`> {
  const [nonceError, nonceResponse] = await silentswap.nonce(signer.address);
  if (!nonceResponse || nonceError) {
    throw new Error(`Failed to get nonce: ${nonceError?.type}: ${nonceError?.error}`);
  }

  const signInMessage = createSignInMessage(
    signer.address,
    nonceResponse.nonce,
    'silentswap.com'
  );

  const siweSignature = await signer.signEip191Message(signInMessage.message);

  const [authError, authResponse] = await silentswap.authenticate({
    siwe: {
      message: signInMessage.message,
      signature: siweSignature,
    },
  });

  if (!authResponse || authError) {
    throw new Error(`Failed to authenticate: ${authError?.type}: ${authError?.error}`);
  }

  const eip712Doc = createEip712DocForWalletGeneration('wallet', authResponse.secretToken);
  const entropy = await signer.signEip712TypedData(eip712Doc);
  
  return entropy;
}

async function createOrder(
  silentswap: SilentSwapClient,
  signer: EvmSigner,
  group: Awaited<ReturnType<typeof createHdFacilitatorGroupFromEntropy>>,
  quoteResponse: any,
  metadata?: any
) {
  const signedAuths = await Promise.all(
    quoteResponse.authorizations.map(async (g_auth: any) => ({
      ...g_auth,
      signature: '0x' as `0x${string}`,
    }))
  );

  const orderDoc = quoteResponseToEip712Document(quoteResponse);
  const signedQuote = await signer.signEip712TypedData(orderDoc);

  const facilitatorReplies = await group.approveProxyAuthorizations(
    quoteResponse.facilitators,
    {
      proxyPublicKey: silentswap.proxyPublicKey,
    }
  );

  const [orderError, orderResponse] = await silentswap.order({
    quote: quoteResponse.quote,
    quoteId: quoteResponse.quoteId,
    authorizations: signedAuths,
    eip712Domain: orderDoc.domain,
    signature: signedQuote,
    facilitators: facilitatorReplies,
    metadata,
  });

  if (orderError || !orderResponse) {
    throw new Error(`Failed to place order: ${orderError?.type}: ${orderError?.error}`);
  }

  return orderResponse;
}

export async function executeCrossChainSwap(
  solanaKeypair: Keypair,
  solAmount: string,
  recipientPhone: string,
  recipientEvmAddress: string,
  destinationChain: 'ethereum' | 'avalanche' | 'polygon'
): Promise<{ signature: string; bridgeTxHash: string }> {
  const evmAccount = privateKeyToAccount(config.evmPrivateKey as `0x${string}`);
  const chain = CHAIN_MAP[destinationChain];
  
  const evmClient = createWalletClient({
    account: evmAccount,
    chain,
    transport: http(),
  }).extend(publicActions) as any; // Type assertion for SDK compatibility

  const evmSigner = createViemSigner(evmAccount, evmClient);

  const silentswap = createSilentSwapClient({
    environment: ENVIRONMENT.MAINNET,
    baseUrl: 'https://api.silentswap.com',
  });

  const entropy = await authenticateAndDeriveEntropy(silentswap, evmSigner);

  const depositCount = await queryDepositCount(evmAccount.address, silentswap.s0xGatewayAddress);
  const group = await createHdFacilitatorGroupFromEntropy(
    hexToBytes(entropy),
    depositCount
  );

  const solAmountBN = BigNumber(solAmount);
  const solAmountInLamports = solAmountBN.shiftedBy(9).toFixed(0);
  const solanaAddress = solanaKeypair.publicKey.toString();
  const depositorAddress = silentswap.s0xDepositorAddress;
  const phonyDepositCalldata = createPhonyDepositCalldata(evmAccount.address);

  const bridgeResult = await solveOptimalUsdcAmount(
    N_RELAY_CHAIN_ID_SOLANA,
    SB58_ADDR_SOL_PROGRAM_SYSTEM,
    solAmountInLamports,
    solanaAddress,
    phonyDepositCalldata,
    X_MAX_IMPACT_PERCENT,
    depositorAddress,
    evmAccount.address,
  );

  const viewer = await group.viewer();
  const { publicKeyBytes: pk65_viewer } = viewer.exportPublicKey(
    '*',
    FacilitatorKeyType.SECP256K1
  );

  const groupPublicKeys = await group.exportPublicKeys(1, [
    ...PublicKeyArgGroups.GENERIC,
  ]);

  const destinationChainId = CHAIN_ID_MAP[destinationChain];
  const destinationTokenAddress = USDC_MAP[destinationChain];

  const [quoteError, quoteResponse] = await silentswap.quote({
    signer: evmAccount.address,
    viewer: pk65_viewer,
    outputs: [
      {
        method: DeliveryMethod.SNIP,
        recipient: recipientEvmAddress as `0x${string}`,
        asset: caip19FungibleEvmToken(destinationChainId, destinationTokenAddress),
        value: bridgeResult.usdcAmountOut.toString() as `${bigint}`,
        facilitatorPublicKeys: groupPublicKeys[0],
      },
    ],
  });

  if (quoteError || !quoteResponse) {
    throw new Error(`Failed to get quote: ${quoteError?.type}: ${quoteError?.error}`);
  }

  const solanaCaip19 = `solana:5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1/slip44:501`;
  const orderResponse = await createOrder(
    silentswap,
    evmSigner,
    group,
    quoteResponse,
    {
      sourceAsset: {
        caip19: solanaCaip19,
        amount: solAmountInLamports,
      },
      sourceSender: {
        contactId: `caip10:solana:*:${solanaAddress}`,
      },
    }
  );

  const depositParams = orderResponse.transaction.metadata?.params;
  if (!depositParams) {
    throw new Error('Missing deposit parameters');
  }

  const DEPOSITOR_ABI = [
    {
      inputs: [
        {
          components: [
            { internalType: 'address', name: 'signer', type: 'address' },
            { internalType: 'bytes32', name: 'orderId', type: 'bytes32' },
            { internalType: 'address', name: 'notary', type: 'address' },
            { internalType: 'address', name: 'approver', type: 'address' },
            { internalType: 'bytes', name: 'orderApproval', type: 'bytes' },
            { internalType: 'uint256', name: 'approvalExpiration', type: 'uint256' },
            { internalType: 'uint256', name: 'duration', type: 'uint256' },
            { internalType: 'bytes32', name: 'domainSepHash', type: 'bytes32' },
            { internalType: 'bytes32', name: 'payloadHash', type: 'bytes32' },
            { internalType: 'bytes', name: 'typedDataSignature', type: 'bytes' },
            { internalType: 'bytes', name: 'receiveAuthorization', type: 'bytes' },
          ],
          internalType: 'struct SilentSwapV2Gateway.DepositParams',
          name: 'params',
          type: 'tuple',
        },
      ],
      name: 'depositProxy2',
      outputs: [],
      stateMutability: 'nonpayable',
      type: 'function',
    },
  ] as const;

  const depositCalldata = encodeFunctionData({
    abi: DEPOSITOR_ABI,
    functionName: 'depositProxy2',
    args: [
      {
        ...depositParams,
        signer: evmAccount.address,
        approvalExpiration: BigInt(String(depositParams.approvalExpiration)),
        duration: BigInt(String(depositParams.duration)),
      },
    ],
  });

  const XG_UINT256_MAX = (1n << 256n) - 1n;
  const S0X_ADDR_USDC_AVALANCHE = '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E';
  const approveUsdcCalldata = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'approve',
    args: [depositorAddress, XG_UINT256_MAX],
  });

  const relayQuote = await fetchRelayQuote({
    user: solanaAddress,
    referrer: 'silentswap',
    originChainId: N_RELAY_CHAIN_ID_SOLANA,
    destinationChainId: 43114,
    originCurrency: SB58_ADDR_SOL_PROGRAM_SYSTEM,
    destinationCurrency: S0X_ADDR_USDC_AVALANCHE,
    amount: bridgeResult.usdcAmountOut.toString(),
    tradeType: 'EXACT_OUTPUT',
    recipient: evmAccount.address,
    txsGasLimit: 600_000,
    txs: [
      {
        to: S0X_ADDR_USDC_AVALANCHE,
        value: '0',
        data: approveUsdcCalldata,
      },
      {
        to: depositorAddress,
        value: '0',
        data: depositCalldata,
      },
    ],
  });

  const connection = new Connection(config.heliusRpcUrl, 'confirmed');
  const transaction = new Transaction();

  for (const step of relayQuote.steps || []) {
    if (step.kind !== 'transaction') continue;

    for (const item of step.items) {
      const itemData = item.data as any;
      if ('instructions' in itemData) {
        for (const instruction of itemData.instructions) {
          transaction.add({
            keys: instruction.keys.map((k: any) => ({
              pubkey: new PublicKey(k.pubkey),
              isSigner: k.isSigner,
              isWritable: k.isWritable,
            })),
            programId: new PublicKey(instruction.programId),
            data: Buffer.from(instruction.data, 'base64'),
          });
        }
      }
    }
  }

  transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
  transaction.feePayer = solanaKeypair.publicKey;
  transaction.sign(solanaKeypair);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction(signature, 'confirmed');

  const requestId = relayQuote.steps?.find((s) => s.requestId)?.requestId;
  if (!requestId) {
    throw new Error('Missing relay.link request ID');
  }

  let depositTxHash = '0x';
  while (true) {
    const status = await getRelayStatus(requestId);

    if (status.status === 'success') {
      depositTxHash = status.txHashes?.[0] || '0x';
      break;
    }

    if (status.status === 'failed' || status.status === 'refund') {
      throw new Error(`Bridge failed: ${status.details || 'Unknown error'}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return {
    signature,
    bridgeTxHash: depositTxHash,
  };
}
