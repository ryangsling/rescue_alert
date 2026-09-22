import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LocaleStorage } from "@rescue-alert/localization";

export const mobileLocaleStorage: LocaleStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
};
