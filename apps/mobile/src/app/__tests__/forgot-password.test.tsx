import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import ForgotPasswordScreen from "../forgot-password";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("ForgotPasswordScreen", () => {
  it("renders the request form", () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <ForgotPasswordScreen />
      </LocaleProvider>,
    );
    expect(screen.getByText("Reset your password")).toBeTruthy();
  });
});
