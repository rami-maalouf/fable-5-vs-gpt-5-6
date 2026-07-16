import { StyleSheet, Text, View } from 'react-native';

export default function LogsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logs</Text>
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
