import { Redirect } from 'expo-router';

export default function AppGroupRedirect() {
  return <Redirect href={'/(parent-tabs)' as any} />;
}
