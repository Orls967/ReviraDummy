import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../auth/useAuth';

/**
 * Status membership bisa berubah di luar aplikasi (mis. admin menyetujui pengajuan),
 * jadi layar yang bergantung padanya memuat ulang profil setiap kali difokuskan.
 */
export function useProfileRefreshOnFocus(): void {
  const { refreshProfile } = useAuth();

  useFocusEffect(
    useCallback(() => {
      void refreshProfile();
    }, [refreshProfile]),
  );
}
