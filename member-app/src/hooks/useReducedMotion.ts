import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

let lastKnown = false;

/**
 * Mengikuti pengaturan "kurangi gerakan" di perangkat (web: prefers-reduced-motion).
 * Nilai terakhir disimpan di modul supaya layar berikutnya langsung memakai nilai yang benar.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(lastKnown);

  useEffect(() => {
    let active = true;
    const update = (value: boolean) => {
      lastKnown = value;

      if (active) {
        setReduced(value);
      }
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(update)
      .catch(() => update(false));

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
