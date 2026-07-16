import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/common/Screen';
import { useTheme } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={{ color: theme.textPrimary }}>Settings</Text>
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
