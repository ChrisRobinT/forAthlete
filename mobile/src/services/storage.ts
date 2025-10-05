import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';

export const storage = {
  saveToken: async (token: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error saving token:', error);
      throw error;
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  removeToken: async (): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
      throw error;
    }
  },
};

// Named exports for convenience
export const { saveToken, getToken, removeToken } = storage;