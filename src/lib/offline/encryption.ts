import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_NAME = 'securiclick_offline_cache_key';

function utf8ToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

async function loadKey(): Promise<Crypto.AESEncryptionKey> {
  const stored = await SecureStore.getItemAsync(KEY_NAME);
  if (stored) return Crypto.AESEncryptionKey.import(stored, 'base64');
  const key = await Crypto.AESEncryptionKey.generate();
  await SecureStore.setItemAsync(KEY_NAME, await key.encoded('base64'));
  return key;
}

export async function encryptText(text: string): Promise<string> {
  const key = await loadKey();
  const sealed = await Crypto.aesEncryptAsync(utf8ToBytes(text), key);
  return sealed.combined('base64');
}

export async function decryptText(sealedText: string): Promise<string> {
  const key = await loadKey();
  const sealed = Crypto.AESSealedData.fromCombined(sealedText);
  const bytes = await Crypto.aesDecryptAsync(sealed, key);
  return new TextDecoder().decode(bytes);
}

export async function deleteEncryptionKey(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_NAME);
}
