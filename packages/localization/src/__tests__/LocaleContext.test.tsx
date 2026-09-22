import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import {
  LocaleProvider,
  useLocale,
  LOCALE_STORAGE_KEY,
  type LocaleStorage,
} from "../LocaleContext";

// This package imports test globals explicitly rather than relying on
// Vitest's `globals: true`, so @testing-library/react's auto-cleanup
// (which hooks a global `afterEach`) never fires on its own - without
// this, renders from earlier `it` blocks stay mounted and later
// `getByTestId` queries match more than one element.
afterEach(cleanup);

function createMemoryStorage(
  initial: Record<string, string> = {},
): LocaleStorage {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
  };
}

function LocaleProbe() {
  const { locale, setLocale } = useLocale();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale(locale === "en" ? "bn" : "en")}>
        toggle
      </button>
    </div>
  );
}

describe("LocaleProvider / useLocale", () => {
  it("throws when used outside a LocaleProvider", () => {
    expect(() => renderHook(() => useLocale())).toThrow(/LocaleProvider/);
  });

  it("defaults to en when storage has nothing stored", async () => {
    const storage = createMemoryStorage();
    render(
      <LocaleProvider storage={storage}>
        <LocaleProbe />
      </LocaleProvider>,
    );
    expect(screen.getByTestId("locale").textContent).toBe("en");
  });

  it("adopts a previously persisted locale on mount", async () => {
    const storage = createMemoryStorage({ [LOCALE_STORAGE_KEY]: "bn" });
    render(
      <LocaleProvider storage={storage}>
        <LocaleProbe />
      </LocaleProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("bn"),
    );
  });

  it("switching locale re-renders in place, without remounting, and persists the change", async () => {
    const storage = createMemoryStorage();
    render(
      <LocaleProvider storage={storage}>
        <LocaleProbe />
      </LocaleProvider>,
    );

    expect(screen.getByTestId("locale").textContent).toBe("en");
    fireEvent.click(screen.getByText("toggle"));

    await waitFor(() =>
      expect(screen.getByTestId("locale").textContent).toBe("bn"),
    );
    expect(await storage.getItem(LOCALE_STORAGE_KEY)).toBe("bn");
  });
});
