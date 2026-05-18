import { Redirect } from 'expo-router';
import { useAuthStore } from '@/features/auth/store/auth.store';

export default function DashboardRedirect() {
  const role = useAuthStore(s => s.session?.user.role);
  if (role === 'collector') return <Redirect href={'/(collector-tabs)/home' as any} />;
  if (role === 'school_admin' || role === 'staff') return <Redirect href={'/(school-tabs)/home' as any} />;
  return <Redirect href={'/(parent-tabs)' as any} />;
}
