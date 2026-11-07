import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { i18n } from '@/i18n';

const KEY = (uid: string) => `biometric_enabled_${uid}`;

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricCapability {
  isAvailable: boolean;
  isEnrolled: boolean;
  type: BiometricType;
}

function mapAuthType(
  types: LocalAuthentication.AuthenticationType[]
): BiometricType {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION))
    return 'facial';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT))
    return 'fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS))
    return 'iris';
  return 'none';
}

async function getCapability(): Promise<BiometricCapability> {
  const [isAvailable, isEnrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);
  return { isAvailable, isEnrolled, type: mapAuthType(types) };
}

async function isEnabled(uid: string): Promise<boolean> {
  try {
    const val = await SecureStore.getItemAsync(KEY(uid));
    return val === 'true';
  } catch {
    return false;
  }
}

async function enable(uid: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: i18n.t('auth:biometric_enable_prompt'),
    cancelLabel: i18n.t('common:cancel'),
    fallbackLabel: '',
    disableDeviceFallback: true,
  });
  if (!result.success) return false;
  await SecureStore.setItemAsync(KEY(uid), 'true');
  return true;
}

async function disable(uid: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: i18n.t('auth:biometric_disable_prompt'),
    cancelLabel: i18n.t('common:cancel'),
    fallbackLabel: '',
    disableDeviceFallback: true,
  });
  if (!result.success) return false;
  await SecureStore.deleteItemAsync(KEY(uid));
  return true;
}

async function authenticate(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: i18n.t('auth:biometric_unlock_prompt'),
    cancelLabel: i18n.t('common:cancel'),
    fallbackLabel: i18n.t('auth:biometric_use_password'),
    disableDeviceFallback: false,
  });
  return result.success;
}

async function test(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: i18n.t('auth:biometric_test_prompt'),
    cancelLabel: i18n.t('common:cancel'),
    fallbackLabel: '',
    disableDeviceFallback: true,
  });
  return result.success;
}

async function revoke(uid: string): Promise<void> {
  await SecureStore.deleteItemAsync(KEY(uid));
}

export const localSecurityService = {
  getCapability,
  isEnabled,
  enable,
  disable,
  authenticate,
  test,
  revoke,
};
