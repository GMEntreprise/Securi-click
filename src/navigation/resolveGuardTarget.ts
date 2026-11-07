import type { UserRole } from '@/features/auth/types';
import type { DemoRole } from '@/features/demo/domain/types';

export interface GuardInput {
  isAuthenticated: boolean;
  role: UserRole | undefined;
  pinVerified: boolean;
  demoRole: DemoRole | null;
  seg: string;
  sub1?: string;
}

const DEMO_TABS: Record<DemoRole, { seg: string; home: string }> = {
  parent: { seg: '(parent-tabs)', home: '/(parent-tabs)' },
  collector: { seg: '(collector-tabs)', home: '/(collector-tabs)/home' },
  establishment: { seg: '(school-tabs)', home: '/(school-tabs)/home' },
};

export function resolveGuardTarget(input: GuardInput): string | null {
  const { isAuthenticated, role, pinVerified, demoRole, seg, sub1 } = input;

  if (seg === 'demo') return null;

  if (demoRole) {
    const tabs = DEMO_TABS[demoRole];
    return seg === tabs.seg ? null : tabs.home;
  }

  const inAuth = seg === '(auth)';
  if (inAuth && (sub1 === 'callback' || sub1 === 'reset-password')) return null;

  if (!isAuthenticated) return inAuth ? null : '/(auth)/login';

  if (role === 'collector') {
    const inPinScreen = inAuth && sub1 === 'collector-pin';
    if (!pinVerified) return inPinScreen ? null : '/(auth)/collector-pin';
    return inAuth || seg !== '(collector-tabs)'
      ? '/(collector-tabs)/home'
      : null;
  }

  if (role === 'school_admin' || role === 'staff') {
    return inAuth ||
      seg === '(app)' ||
      seg === '(parent-tabs)' ||
      seg === '(collector-tabs)'
      ? '/(school-tabs)/home'
      : null;
  }

  return inAuth ||
    seg === '(app)' ||
    seg === '(collector-tabs)' ||
    seg === '(school-tabs)'
    ? '/(parent-tabs)'
    : null;
}
