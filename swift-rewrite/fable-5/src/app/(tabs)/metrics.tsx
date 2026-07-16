import { StyleSheet, Text, View } from 'react-native';

export default function MetricsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Metrics</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0a1520',
  },
  text: { color: '#ffffff' },
});
