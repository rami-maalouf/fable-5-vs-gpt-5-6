import { useLocalSearchParams } from 'expo-router';

import { LogEditorScreen } from '@/components/logs';

export default function LogEditorRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();

  return <LogEditorScreen sessionId={id} />;
}
