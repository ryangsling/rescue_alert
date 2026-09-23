import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import SignInScreen from "../sign-in";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("SignInScreen", () => {
  it("renders the sign-in form", () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <SignInScreen />
      </LocaleProvider>,
    );
    expect(screen.getAllByText("Sign in").length).toBeGreaterThan(0);
  });
});
