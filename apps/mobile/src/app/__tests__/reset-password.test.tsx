import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import ResetPasswordScreen from "../reset-password";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("ResetPasswordScreen", () => {
  it("renders the new-password form", () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <ResetPasswordScreen />
      </LocaleProvider>,
    );
    expect(screen.getByText("Choose a new password")).toBeTruthy();
  });
});
