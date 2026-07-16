import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import {
  endLiveActivitySpike,
  startLiveActivitySpike,
  startWindDownLiveActivitySpike,
  updateLiveActivitySpike,
} from '../../src/services/live-activity-spike';

type Status = {
  label: string;
  detail: string;
};

export function LiveActivitySpikeControls() {
  const [status, setStatus] = useState<Status>({ label: 'idle', detail: 'ready' });

  async function run(label: string, action: () => Promise<unknown> | unknown) {
    try {
      const result = await action();
      setStatus({ label, detail: JSON.stringify(result) });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      setStatus({ label: `${label} failed`, detail });
      Alert.alert(label, detail);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>live activity spike</Text>
      <View style={styles.row}>
        <SpikeButton
          title="start"
          onPress={() => void run('start', () => startLiveActivitySpike())}
        />
        <SpikeButton
          title="update"
          onPress={() => void run('update', () => updateLiveActivitySpike())}
        />
        <SpikeButton
          title="wind-down"
          onPress={() => void run('wind-down', () => startWindDownLiveActivitySpike())}
        />
        <SpikeButton title="end" onPress={() => void run('end', () => endLiveActivitySpike())} />
      </View>
      <Text numberOfLines={2} style={styles.status}>
        {status.label}: {status.detail}
      </Text>
    </View>
  );
}

function SpikeButton({ onPress, title }: { onPress: () => void; title: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    borderColor: 'rgba(0, 212, 255, 0.45)',
    borderRadius: 18,
    borderWidth: 1,
    bottom: 104,
    gap: 8,
    left: 16,
    padding: 12,
    position: 'absolute',
    right: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    backgroundColor: '#00b4d8',
    borderRadius: 12,
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  status: {
    color: '#8b9dc3',
    fontSize: 12,
    lineHeight: 16,
  },
});
