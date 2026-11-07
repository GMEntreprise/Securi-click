import { i18n } from './index';

export function message(key: string) {
  return { error: () => i18n.t(key) };
}
