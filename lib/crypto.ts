import crypto from 'crypto';

// AES-256-GCM for secrets stored in the AppSetting table (currently the Azure
// AD client secret). The key itself can't live in the database for obvious
// reasons, so it stays an env var: SETTINGS_ENCRYPTION_KEY, a 64-character
// hex string (32 bytes). Generate one with:
//   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const KEY_ENV = 'SETTINGS_ENCRYPTION_KEY';

export function encryptionKeyConfigured(): boolean {
  const raw = process.env[KEY_ENV];
  return !!raw && /^[0-9a-fA-F]{64}$/.test(raw);
}

function getKey(): Buffer {
  const raw = process.env[KEY_ENV];
  if (!raw || !/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(
      `${KEY_ENV} is missing or malformed. It must be a 64-character hex string (32 bytes).`
    );
  }
  return Buffer.from(raw, 'hex');
}

// Output format: v1.<iv hex>.<authTag hex>.<ciphertext hex>
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ['v1', iv.toString('hex'), authTag.toString('hex'), ciphertext.toString('hex')].join('.');
}

export function decrypt(payload: string): string {
  const [version, ivHex, authTagHex, ciphertextHex] = payload.split('.');
  if (version !== 'v1' || !ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Stored secret is not in the expected format.');
  }
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}
