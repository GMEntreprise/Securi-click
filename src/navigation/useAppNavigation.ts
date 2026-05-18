import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCollectorSessionStore } from '@/features/collector/stores/collectorSession.store';
import { ROUTES } from './routes';
import { setExplicitLogoutInProgress } from './authFlags';

// Single navigation hook for the whole app.
// Screens never call useRouter directly — they call useAppNavigation().
export function useAppNavigation() {
  const router = useRouter();

  // ── Auth ────────────────────────────────────────────────────────────────────

  const goToLogin = useCallback(() => {
    router.replace(ROUTES.auth.login as any);
  }, [router]);

  const goToCollectorPin = useCallback(
    (invitationToken?: string) => {
      if (invitationToken) {
        router.replace({
          pathname: ROUTES.auth.collectorPin as any,
          params: { invitation_token: invitationToken },
        });
      } else {
        router.replace(ROUTES.auth.collectorPin as any);
      }
    },
    [router]
  );

  // ── Logout (shared by all roles) ────────────────────────────────────────────

  const logout = useCallback(async () => {
    const logoutAction = useAuthStore.getState().logout;
    const clearPin = useCollectorSessionStore.getState().clear;
    setExplicitLogoutInProgress(true);
    await Promise.allSettled([logoutAction(), clearPin()]);
    setExplicitLogoutInProgress(false);
    router.replace(ROUTES.auth.login as any);
  }, [router]);

  // ── Parent ──────────────────────────────────────────────────────────────────

  const goToParentDashboard = useCallback(() => {
    router.replace(ROUTES.parent.root as any);
  }, [router]);

  const goToParentChildren = useCallback(() => {
    router.push(ROUTES.parent.children as any);
  }, [router]);

  const goToParentChildAdd = useCallback(() => {
    router.push(ROUTES.parent.childAdd as any);
  }, [router]);

  const goToParentChildDetail = useCallback(
    (id: string) => {
      router.push(ROUTES.parent.childDetail(id) as any);
    },
    [router]
  );

  const goToParentGuardianAdd = useCallback(
    (childId: string) => {
      router.push(ROUTES.parent.guardianAdd(childId) as any);
    },
    [router]
  );

  const goToParentGuardianEdit = useCallback(
    (guardianId: string, childId: string) => {
      router.push(ROUTES.parent.guardianEdit(guardianId, childId) as any);
    },
    [router]
  );

  const goToParentAuthorizedPersonAdd = useCallback(() => {
    router.push(ROUTES.parent.authorizedPersonAdd as any);
  }, [router]);

  const goToParentAuthorizedPersonDetail = useCallback(
    (id: string) => {
      router.push(ROUTES.parent.authorizedPersonDetail(id) as any);
    },
    [router]
  );

  const goToParentQr = useCallback(() => {
    router.push(ROUTES.parent.qr as any);
  }, [router]);

  const goToParentHistory = useCallback(() => {
    router.push(ROUTES.parent.history as any);
  }, [router]);

  const goToParentHistoryArchive = useCallback(() => {
    router.push(ROUTES.parent.historyArchive as any);
  }, [router]);

  const goToParentNotifications = useCallback(() => {
    router.push(ROUTES.parent.notifications as any);
  }, [router]);

  const goToParentLegalMentions = useCallback(() => {
    router.push(ROUTES.parent.legalMentions as any);
  }, [router]);

  const goToParentPrivacyPolicy = useCallback(() => {
    router.push(ROUTES.parent.privacyPolicy as any);
  }, [router]);

  // ── Collector ───────────────────────────────────────────────────────────────

  const goToCollectorDashboard = useCallback(() => {
    router.replace(ROUTES.collector.home as any);
  }, [router]);

  const goToCollectorProfile = useCallback(() => {
    router.push(ROUTES.collector.profile as any);
  }, [router]);

  const goToCollectorNotifications = useCallback(() => {
    router.push(ROUTES.collector.notifications as any);
  }, [router]);

  const goToCollectorLegalMentions = useCallback(() => {
    router.push(ROUTES.collector.legalMentions as any);
  }, [router]);

  const goToCollectorPrivacyPolicy = useCallback(() => {
    router.push(ROUTES.collector.privacyPolicy as any);
  }, [router]);

  // ── School ──────────────────────────────────────────────────────────────────

  const goToSchoolDashboard = useCallback(() => {
    router.replace(ROUTES.school.home as any);
  }, [router]);

  const goToSchoolScanner = useCallback(() => {
    router.push(ROUTES.school.scanner as any);
  }, [router]);

  const goToSchoolHistory = useCallback(() => {
    router.push(ROUTES.school.history as any);
  }, [router]);

  const goToSchoolNotifications = useCallback(() => {
    router.push(ROUTES.school.notifications as any);
  }, [router]);

  const goToSchoolLegalMentions = useCallback(() => {
    router.push(ROUTES.school.legalMentions as any);
  }, [router]);

  const goToSchoolPrivacyPolicy = useCallback(() => {
    router.push(ROUTES.school.privacyPolicy as any);
  }, [router]);

  // ── Generic push for notification routing ───────────────────────────────────

  const pushRoute = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  return {
    // auth
    goToLogin,
    goToCollectorPin,
    logout,
    // parent
    goToParentDashboard,
    goToParentChildren,
    goToParentChildAdd,
    goToParentChildDetail,
    goToParentGuardianAdd,
    goToParentGuardianEdit,
    goToParentAuthorizedPersonAdd,
    goToParentAuthorizedPersonDetail,
    goToParentQr,
    goToParentHistory,
    goToParentHistoryArchive,
    goToParentNotifications,
    goToParentLegalMentions,
    goToParentPrivacyPolicy,
    // collector
    goToCollectorDashboard,
    goToCollectorProfile,
    goToCollectorNotifications,
    goToCollectorLegalMentions,
    goToCollectorPrivacyPolicy,
    // school
    goToSchoolDashboard,
    goToSchoolScanner,
    goToSchoolHistory,
    goToSchoolNotifications,
    goToSchoolLegalMentions,
    goToSchoolPrivacyPolicy,
    // generic
    pushRoute,
  };
}
