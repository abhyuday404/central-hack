import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Storage } from "@reown/appkit-common-react-native";

const prefix = "central-hack:";

export const asyncStorage: Storage = {
  async getKeys() {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  },
  async getEntries() {
    const keys = await AsyncStorage.getAllKeys();
    const scopedKeys = keys.filter((key) => key.startsWith(prefix));
    const entries = await AsyncStorage.multiGet(scopedKeys);

    return entries
      .map(([key, value]) => {
        const trimmedKey = key.slice(prefix.length);
        if (value === null || trimmedKey.length === 0) {
          return null;
        }
        let parsed: unknown = value;
        try {
          parsed = JSON.parse(value);
        } catch {
          // keep raw string if not JSON
        }
        return [trimmedKey, parsed] as [string, unknown];
      })
      .filter((entry): entry is [string, unknown] => entry !== null);
  },
  async getItem(key) {
    const value = await AsyncStorage.getItem(`${prefix}${key}`);
    if (value === null) {
      return undefined;
    }
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  },
  async setItem(key, value) {
    const stored = JSON.stringify(value);
    return AsyncStorage.setItem(`${prefix}${key}`, stored);
  },
  async removeItem(key) {
    return AsyncStorage.removeItem(`${prefix}${key}`);
  },
};
