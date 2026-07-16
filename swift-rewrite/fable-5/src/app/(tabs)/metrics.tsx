import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { useTheme } from '@/theme/ThemeProvider';

export default function MetricsScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={{ color: theme.textPrimary }}>Metrics</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
