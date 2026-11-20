import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Memuat ulang data saat layar kembali difokuskan (mis. setelah booking dari layar detail).
 * Fokus pertama dilewati karena data sudah diambil saat layar dipasang.
 */
export function useReloadOnFocus(reload: () => void): void {
  const isFirstFocus = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;

        return;
      }

      reload();
    }, [reload]),
  );
}
