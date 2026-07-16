import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/common/Card';
import { GlowingMoonView } from '@/components/common/GlowingMoonView';
import { Screen } from '@/components/common/Screen';
import { useTheme } from '@/theme/ThemeProvider';

export default function DashboardScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={styles.container}>
        <GlowingMoonView />
        <Card style={styles.card}>
          <Text style={{ color: theme.textPrimary }}>Dashboard</Text>
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  card: { marginHorizontal: 16, alignSelf: 'stretch' },
});
