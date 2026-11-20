import { StyleSheet, View } from 'react-native';
import { ProgressBar, Text, useTheme } from 'react-native-paper';
import { participantProgress } from '../domain/participants';
import { toneColors } from '../theme';

interface ParticipantCounterProps {
  count: number;
  minimum: number;
}

export function ParticipantCounter({ count, minimum }: ParticipantCounterProps) {
  const theme = useTheme();
  const progress = participantProgress(count, minimum);
  const tone = toneColors(progress.isMinimumMet ? 'success' : 'warning', theme.dark);
  const hint = progress.isMinimumMet ? 'Minimum peserta terpenuhi' : `Butuh ${progress.missing} peserta lagi`;

  return (
    <View style={styles.container} accessible accessibilityLabel={`${progress.label}. ${hint}`}>
      <Text variant="labelLarge">{progress.label}</Text>
      <View style={styles.barTrack}>
        <ProgressBar progress={progress.ratio} color={tone.foreground} style={styles.bar} />
      </View>
      <Text variant="bodySmall" style={{ color: tone.foreground }}>
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  barTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: 6,
  },
});
