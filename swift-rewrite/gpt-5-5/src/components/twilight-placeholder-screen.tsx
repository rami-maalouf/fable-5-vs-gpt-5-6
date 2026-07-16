import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type TwilightPlaceholderScreenProps = {
  eyebrow: string;
  title: string;
  body: string;
};

export function TwilightPlaceholderScreen({ eyebrow, title, body }: TwilightPlaceholderScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.eyebrow}>
            {eyebrow}
          </ThemedText>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.body}>
            {body}
          </ThemedText>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    marginHorizontal: 'auto',
    maxWidth: MaxContentWidth,
    paddingBottom: BottomTabInset + Spacing.four,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.six,
    width: '100%',
  },
  card: {
    borderRadius: 28,
    gap: Spacing.two,
    padding: Spacing.four,
  },
  eyebrow: {
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 40,
    lineHeight: 46,
  },
  body: {
    maxWidth: 420,
  },
});
