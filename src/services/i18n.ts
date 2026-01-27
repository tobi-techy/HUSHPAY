import { parsePhoneNumber } from 'libphonenumber-js';

interface Translation {
  welcome: string;
  balance: string;
  publicBalance: string;
  privateBalance: string;
  wallet: string;
  sendConfirm: string;
  sendSuccess: string;
  depositConfirm: string;
  depositSuccess: string;
  withdrawConfirm: string;
  withdrawSuccess: string;
  anonSendConfirm: string;
  anonSendSuccess: string;
  replyYes: string;
  help: string;
}

const translations: Record<string, Translation> = {
  en: {
    welcome: `Welcome to HushPay! 🤫

Your wallet is ready. Two ways to send:
• "send 1 sol to +234..." (amount hidden)
• "send anon 1 sol to [wallet]" (sender hidden)

Commands: balance, deposit, withdraw, receipts, help`,
    balance: 'Your balance:',
    publicBalance: '📊 Public:',
    privateBalance: '🔒 Private Pool:',
    wallet: 'Wallet:',
    sendConfirm: 'Send {amount} {token} to {recipient}?\nAmount will be hidden on-chain.\n\nReply YES to confirm.',
    sendSuccess: '✓ Sent {amount} {token} to {recipient}\nAmount: [PRIVATE]\nTx: {tx}',
    depositConfirm: 'Deposit {amount} {token} to private pool?\nEnables anonymous sends.\n\nReply YES to confirm.',
    depositSuccess: '✓ Deposited {amount} {token} to private pool\nPrivate balance: {balance} {token}',
    withdrawConfirm: 'Withdraw {amount} {token} to your public wallet?\n\nReply YES to confirm.',
    withdrawSuccess: '✓ Withdrew {amount} {token} to public wallet\nTx: {tx}',
    anonSendConfirm: 'Send {amount} {token} anonymously to {recipient}?\nRecipient won\'t know who sent it.\n\nReply YES to confirm.',
    anonSendSuccess: '✓ Sent {amount} {token} anonymously\nSender: [UNTRACEABLE]\nTx: {tx}',
    replyYes: 'Reply YES to confirm.',
    help: `HushPay Commands:

💸 Send
• send [amt] [token] to [phone]
• send anon [amt] [token] to [wallet]

💰 Balance
• balance
• deposit [amt] [token]
• withdraw [amt] [token]

📜 History: receipts

🔒 Regular = amount hidden
🔒 Anon = sender hidden`,
  },
  es: {
    welcome: `¡Bienvenido a HushPay! 🤫

Tu billetera está lista. Dos formas de enviar:
• "enviar 1 sol a +234..." (monto oculto)
• "enviar anon 1 sol a [wallet]" (remitente oculto)

Comandos: balance, depositar, retirar, recibos, ayuda`,
    balance: 'Tu balance:',
    publicBalance: '📊 Público:',
    privateBalance: '🔒 Pool Privado:',
    wallet: 'Billetera:',
    sendConfirm: '¿Enviar {amount} {token} a {recipient}?\nEl monto estará oculto.\n\nResponde SÍ para confirmar.',
    sendSuccess: '✓ Enviado {amount} {token} a {recipient}\nMonto: [PRIVADO]\nTx: {tx}',
    depositConfirm: '¿Depositar {amount} {token} al pool privado?\nPermite envíos anónimos.\n\nResponde SÍ para confirmar.',
    depositSuccess: '✓ Depositado {amount} {token} al pool privado\nBalance privado: {balance} {token}',
    withdrawConfirm: '¿Retirar {amount} {token} a tu billetera pública?\n\nResponde SÍ para confirmar.',
    withdrawSuccess: '✓ Retirado {amount} {token} a billetera pública\nTx: {tx}',
    anonSendConfirm: '¿Enviar {amount} {token} anónimamente a {recipient}?\nEl destinatario no sabrá quién envió.\n\nResponde SÍ para confirmar.',
    anonSendSuccess: '✓ Enviado {amount} {token} anónimamente\nRemitente: [IMPOSIBLE RASTREAR]\nTx: {tx}',
    replyYes: 'Responde SÍ para confirmar.',
    help: `Comandos HushPay:

💸 Enviar
• enviar [cant] [token] a [teléfono]
• enviar anon [cant] [token] a [wallet]

💰 Balance
• balance
• depositar [cant] [token]
• retirar [cant] [token]

📜 Historial: recibos

🔒 Regular = monto oculto
🔒 Anon = remitente oculto`,
  },
  fr: {
    welcome: `Bienvenue sur HushPay! 🤫

Votre portefeuille est prêt. Deux façons d'envoyer:
• "envoyer 1 sol à +234..." (montant caché)
• "envoyer anon 1 sol à [wallet]" (expéditeur caché)

Commandes: balance, dépôt, retrait, reçus, aide`,
    balance: 'Votre solde:',
    publicBalance: '📊 Public:',
    privateBalance: '🔒 Pool Privé:',
    wallet: 'Portefeuille:',
    sendConfirm: 'Envoyer {amount} {token} à {recipient}?\nLe montant sera caché.\n\nRépondez OUI pour confirmer.',
    sendSuccess: '✓ Envoyé {amount} {token} à {recipient}\nMontant: [PRIVÉ]\nTx: {tx}',
    depositConfirm: 'Déposer {amount} {token} dans le pool privé?\nPermet les envois anonymes.\n\nRépondez OUI pour confirmer.',
    depositSuccess: '✓ Déposé {amount} {token} dans le pool privé\nSolde privé: {balance} {token}',
    withdrawConfirm: 'Retirer {amount} {token} vers votre portefeuille public?\n\nRépondez OUI pour confirmer.',
    withdrawSuccess: '✓ Retiré {amount} {token} vers portefeuille public\nTx: {tx}',
    anonSendConfirm: 'Envoyer {amount} {token} anonymement à {recipient}?\nLe destinataire ne saura pas qui a envoyé.\n\nRépondez OUI pour confirmer.',
    anonSendSuccess: '✓ Envoyé {amount} {token} anonymement\nExpéditeur: [INTRAÇABLE]\nTx: {tx}',
    replyYes: 'Répondez OUI pour confirmer.',
    help: `Commandes HushPay:

💸 Envoyer
• envoyer [montant] [token] à [téléphone]
• envoyer anon [montant] [token] à [wallet]

💰 Solde
• balance
• dépôt [montant] [token]
• retrait [montant] [token]

📜 Historique: reçus

🔒 Regular = montant caché
🔒 Anon = expéditeur caché`,
  },
  pt: {
    welcome: `Bem-vindo ao HushPay! 🤫

Sua carteira está pronta. Duas formas de enviar:
• "enviar 1 sol para +234..." (valor oculto)
• "enviar anon 1 sol para [wallet]" (remetente oculto)

Comandos: saldo, depositar, sacar, recibos, ajuda`,
    balance: 'Seu saldo:',
    publicBalance: '📊 Público:',
    privateBalance: '🔒 Pool Privado:',
    wallet: 'Carteira:',
    sendConfirm: 'Enviar {amount} {token} para {recipient}?\nO valor ficará oculto.\n\nResponda SIM para confirmar.',
    sendSuccess: '✓ Enviado {amount} {token} para {recipient}\nValor: [PRIVADO]\nTx: {tx}',
    depositConfirm: 'Depositar {amount} {token} no pool privado?\nPermite envios anônimos.\n\nResponda SIM para confirmar.',
    depositSuccess: '✓ Depositado {amount} {token} no pool privado\nSaldo privado: {balance} {token}',
    withdrawConfirm: 'Sacar {amount} {token} para sua carteira pública?\n\nResponda SIM para confirmar.',
    withdrawSuccess: '✓ Sacado {amount} {token} para carteira pública\nTx: {tx}',
    anonSendConfirm: 'Enviar {amount} {token} anonimamente para {recipient}?\nO destinatário não saberá quem enviou.\n\nResponda SIM para confirmar.',
    anonSendSuccess: '✓ Enviado {amount} {token} anonimamente\nRemetente: [IMPOSSÍVEL RASTREAR]\nTx: {tx}',
    replyYes: 'Responda SIM para confirmar.',
    help: `Comandos HushPay:

💸 Enviar
• enviar [valor] [token] para [telefone]
• enviar anon [valor] [token] para [wallet]

💰 Saldo
• saldo
• depositar [valor] [token]
• sacar [valor] [token]

📜 Histórico: recibos

🔒 Regular = valor oculto
🔒 Anon = remetente oculto`,
  },
};

export function detectLanguage(phone: string, user?: { preferredLanguage?: string }): string {
  // Use saved preference if available
  if (user?.preferredLanguage) {
    return user.preferredLanguage;
  }

  // Auto-detect from phone number
  try {
    const parsed = parsePhoneNumber(phone);
    const countryCode = parsed?.country;
    
    const languageMap: Record<string, string> = {
      // Spanish
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'CL': 'es', 'PE': 'es', 'VE': 'es',
      // French
      'FR': 'fr', 'BE': 'fr', 'CH': 'fr', 'CA': 'fr',
      // Portuguese
      'BR': 'pt', 'PT': 'pt', 'AO': 'pt', 'MZ': 'pt',
      // English (Nigeria, Ghana, etc.)
      'NG': 'en', 'GH': 'en', 'US': 'en', 'GB': 'en', 'AU': 'en',
    };
    
    return languageMap[countryCode || ''] || 'en';
  } catch {
    return 'en';
  }
}

export function translate(key: keyof Translation, lang: string, params?: Record<string, string>): string {
  const t = translations[lang] || translations.en;
  let text = t[key];
  
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  
  return text;
}

export function getTranslations(lang: string): Translation {
  return translations[lang] || translations.en;
}
