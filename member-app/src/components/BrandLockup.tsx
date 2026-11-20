import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

const MARK = require('../../assets/brand/mark.png');
const WORDMARK_ON_LIGHT = require('../../assets/brand/wordmark-light.png');
const WORDMARK_ON_DARK = require('../../assets/brand/wordmark-dark.png');

/**
 * Monogram dan wordmark Revira Fitness Center. Wordmark hitam dipakai di tema terang,
 * wordmark emas di tema gelap, mengikuti brand board.
 */
export function BrandLockup() {
  const theme = useTheme();

  return (
    <View style={styles.container} accessible accessibilityRole="image" accessibilityLabel="Revira Fitness Center">
      <Image source={MARK} style={styles.mark} resizeMode="contain" />
      <Image source={theme.dark ? WORDMARK_ON_DARK : WORDMARK_ON_LIGHT} style={styles.wordmark} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
  },
  mark: {
    width: 72,
    height: 72,
  },
  wordmark: {
    width: 240,
    height: 75,
  },
});
