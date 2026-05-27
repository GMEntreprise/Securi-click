import { useEffect } from 'react';
import * as Updates from 'expo-updates';

/**
 * Vérifie si une update OTA est disponible au montage de l'app.
 * Si oui, la télécharge et recharge l'app silencieusement.
 *
 * - Ne tourne qu'en production (pas en dev, pas sur simulateur).
 * - Silencieux : aucun toast, aucun crash si le check échoue.
 * - Recharge uniquement si l'update est bien téléchargée.
 */
export function useOTAUpdate(): void {
  useEffect(() => {
    if (__DEV__) return;
    if (!Updates.isEnabled) return;

    async function checkAndApply(): Promise<void> {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;

        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } catch {
        // Silencieux — réseau indisponible, update invalide, etc.
        // L'app continue de fonctionner avec la version embarquée.
      }
    }

    void checkAndApply();
  }, []);
}
