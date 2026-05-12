import { Redirect } from 'expo-router';
import { useSession } from '@/features/auth/store/auth.store';

/**
 * Point d’entrée `/` : redirection stable après session connue (pas de flicker : le layout
 * parent n’affiche cette pile qu’une fois `isRestoring === false`).
 */
export default function Index() {
  const session = useSession();

  if (session) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}
