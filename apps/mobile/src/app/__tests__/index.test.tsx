import { render, screen } from "@testing-library/react-native";
import { LocaleProvider, type LocaleStorage } from "@rescue-alert/localization";
import Home from "../index";

const memoryStorage: LocaleStorage = {
  getItem: () => null,
  setItem: () => {},
};

describe("Home", () => {
  it("renders the Rescue Alert heading", () => {
    render(
      <LocaleProvider storage={memoryStorage}>
        <Home />
      </LocaleProvider>,
    );
    expect(screen.getByText("Rescue Alert")).toBeTruthy();
  });
});
