import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'revira.member.token';

export const tokenStorage = {
  read(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  write(token: string): Promise<void> {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  clear(): Promise<void> {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },
};
