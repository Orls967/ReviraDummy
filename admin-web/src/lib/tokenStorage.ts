const TOKEN_KEY = 'revira.admin.token';

/**
 * Akses localStorage bisa melempar error (mode privat atau penyimpanan diblokir);
 * dalam kasus itu sesi tetap berjalan di memori sampai tab ditutup.
 */
export const tokenStorage = {
  read(): string | null {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  write(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};
