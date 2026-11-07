import { useEffect } from 'react';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { DemoRolePicker } from '@/features/demo/components/DemoRolePicker';
import { resolveDemoEntry } from '@/features/demo/domain/resolveDemoEntry';
import { useDemoStore } from '@/features/demo/store/demo.store';

export default function DemoDeepLink() {
  const { path } = useLocalSearchParams<{ path: string[] }>();
  const router = useRouter();
  const enter = useDemoStore(s => s.enter);
  const entry = resolveDemoEntry(Array.isArray(path) ? path : [path ?? '']);
  const role = entry?.role;
  const href = entry?.href;

  useEffect(() => {
    if (!role || !href) return;
    enter(role);
    router.replace(href as Href);
  }, [role, href, enter, router]);

  return <DemoRolePicker />;
}
