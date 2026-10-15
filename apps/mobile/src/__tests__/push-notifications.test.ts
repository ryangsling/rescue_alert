const mockIsDevice = { value: true };
jest.mock("expo-device", () => ({
  get isDevice() {
    return mockIsDevice.value;
  },
}));

const mockGetPermissionsAsync = jest.fn();
const mockRequestPermissionsAsync = jest.fn();
const mockGetExpoPushTokenAsync = jest.fn();
const mockSetNotificationChannelAsync = jest.fn();
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: (...args: unknown[]) =>
    mockSetNotificationChannelAsync(...args),
  getPermissionsAsync: () => mockGetPermissionsAsync(),
  requestPermissionsAsync: () => mockRequestPermissionsAsync(),
  getExpoPushTokenAsync: (...args: unknown[]) =>
    mockGetExpoPushTokenAsync(...args),
  getLastNotificationResponseAsync: () => Promise.resolve(null),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  AndroidImportance: { HIGH: 4 },
}));

jest.mock("expo-constants", () => ({
  expoConfig: { extra: { eas: { projectId: "test-project-id" } } },
}));

const mockRegisterDevice = jest.fn();
const mockUnregisterDevice = jest.fn();
const mockRecordAnalyticsEvent = jest.fn();
jest.mock("@rescue-alert/api", () => ({
  registerDevice: (...args: unknown[]) => mockRegisterDevice(...args),
  unregisterDevice: (...args: unknown[]) => mockUnregisterDevice(...args),
  recordAnalyticsEvent: (...args: unknown[]) =>
    mockRecordAnalyticsEvent(...args),
}));

jest.mock("../supabase-client", () => ({ supabase: {} }));

// eslint-disable-next-line import/first
import {
  registerForPushNotifications,
  unregisterPushNotifications,
} from "../push-notifications";

describe("registerForPushNotifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDevice.value = true;
  });

  it("does nothing on a simulator with no push capability", async () => {
    mockIsDevice.value = false;
    await registerForPushNotifications();
    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });

  it("does nothing when permission is denied, but records the result", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "denied" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "denied" });
    await registerForPushNotifications();
    expect(mockRegisterDevice).not.toHaveBeenCalled();
    expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
      {},
      "notification_permission_result",
      { status: "denied" },
    );
  });

  it("registers the device once permission is granted", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "undetermined" });
    mockRequestPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[abc]",
    });

    await registerForPushNotifications();

    expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
      {},
      "notification_permission_result",
      { status: "granted" },
    );
    expect(mockRegisterDevice).toHaveBeenCalledWith(
      {},
      { expoPushToken: "ExponentPushToken[abc]", platform: "ios" },
    );
  });

  it("unregisters the token it just registered", async () => {
    mockGetPermissionsAsync.mockResolvedValue({ status: "granted" });
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: "ExponentPushToken[abc]",
    });
    await registerForPushNotifications();

    await unregisterPushNotifications();

    expect(mockUnregisterDevice).toHaveBeenCalledWith(
      {},
      "ExponentPushToken[abc]",
    );
  });

  it("does nothing on unregister when no token was ever registered", async () => {
    mockIsDevice.value = false;
    await registerForPushNotifications();
    await unregisterPushNotifications();
    expect(mockUnregisterDevice).not.toHaveBeenCalled();
  });
});
