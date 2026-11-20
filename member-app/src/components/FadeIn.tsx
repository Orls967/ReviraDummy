import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface FadeInProps {
  children: ReactNode;
  /** Urutan elemen dalam daftar; tiap urutan menunda animasi sedikit agar muncul bertahap. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

const DURATION = 220;
const STAGGER = 45;
const MAX_STAGGERED = 6;

/**
 * Konten muncul dengan memudar dan naik sedikit. Tidak menahan sentuhan selama animasi,
 * dan langsung tampil bila pengguna mengaktifkan "kurangi gerakan".
 */
export function FadeIn({ children, index = 0, style }: FadeInProps) {
  const reducedMotion = useReducedMotion();
  const progress = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (reducedMotion) {
      progress.setValue(1);
      return;
    }

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: DURATION,
      delay: Math.min(index, MAX_STAGGERED) * STAGGER,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });

    animation.start();

    return () => animation.stop();
  }, [index, progress, reducedMotion]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  return <Animated.View style={[style, { opacity: progress, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
