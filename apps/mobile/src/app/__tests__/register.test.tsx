import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import RegisterScreen from "../register";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("RegisterScreen", () => {
  it("renders the registration form", () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <RegisterScreen />
      </LocaleProvider>,
    );
    expect(screen.getByText("Create your account")).toBeTruthy();
  });
});
