import React, { useEffect } from 'react';
import { useAppNavigation } from '@/navigation/useAppNavigation';
import { useSession } from '@/features/auth/store/auth.store';
import {
  useComplianceStore,
  useHasSeenCompliance,
  useComplianceLoading,
} from '@/stores/compliance.store';
import { WelcomeComplianceSheet } from './WelcomeComplianceSheet';

/**
 * Drop this component into any dashboard layout (_layout.tsx).
 * It initializes the compliance store once per session and shows the
 * WelcomeComplianceSheet exactly once — after the first successful login.
 * After acceptance (or on every subsequent session), it renders nothing.
 */
export function ComplianceGate() {
  const session = useSession();
  const userId = session?.user.id ?? null;

  const initialize = useComplianceStore(s => s.initialize);
  const accept = useComplianceStore(s => s.accept);
  const hasSeenCompliance = useHasSeenCompliance();
  const isLoading = useComplianceLoading();
  const nav = useAppNavigation();

  // Load compliance state from DB once we have a user
  useEffect(() => {
    if (userId && hasSeenCompliance === null) {
      initialize(userId);
    }
  }, [userId, hasSeenCompliance, initialize]);

  const handleContinue = () => {
    if (!userId) return;
    accept(userId);
  };

  // Not loaded yet, or already accepted — render nothing
  if (isLoading || hasSeenCompliance === null || hasSeenCompliance === true) {
    return null;
  }

  return (
    <WelcomeComplianceSheet
      visible={true}
      onContinue={handleContinue}
      onOpenPrivacy={() => nav.goToParentPrivacyPolicy()}
      onOpenLegal={() => nav.goToParentLegalMentions()}
    />
  );
}
