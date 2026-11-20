const TOKEN_KEY = 'revira.member.token';

/**
 * expo-secure-store tidak tersedia di web; localStorage bisa diblokir (mode privat),
 * dan dalam kasus itu sesi hanya bertahan selama tab terbuka.
 */
export const tokenStorage = {
  async read(): Promise<string | null> {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  async write(token: string): Promise<void> {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      return;
    }
  },
  async clear(): Promise<void> {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      return;
    }
  },
};
