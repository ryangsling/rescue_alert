import { render, screen, fireEvent } from "@testing-library/react-native";
import { TextField } from "../TextField";

describe("TextField", () => {
  it("renders the label", () => {
    render(<TextField label="Full name" value="" onChangeText={() => {}} />);
    expect(screen.getByText("Full name")).toBeTruthy();
  });

  it("exposes the label as its accessibility label", () => {
    render(<TextField label="Full name" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText("Full name")).toBeTruthy();
  });

  it("shows error text instead of help text when both are given", () => {
    render(
      <TextField
        label="Email"
        value=""
        onChangeText={() => {}}
        helpText="We'll never share this"
        errorText="Enter a valid email"
      />,
    );
    expect(screen.getByText("Enter a valid email")).toBeTruthy();
    expect(screen.queryByText("We'll never share this")).toBeNull();
  });

  it("calls onChangeText when edited", () => {
    const onChangeText = jest.fn();
    render(<TextField label="Title" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText("Title"), "Injured dog");
    expect(onChangeText).toHaveBeenCalledWith("Injured dog");
  });

  it("is not editable when disabled", () => {
    render(
      <TextField label="Title" value="" onChangeText={() => {}} disabled />,
    );
    expect(screen.getByLabelText("Title").props.editable).toBe(false);
  });

  it("declares the 48px minimum height class", () => {
    render(<TextField label="Title" value="" onChangeText={() => {}} />);
    expect(screen.getByLabelText("Title").props.className).toContain(
      "min-h-12",
    );
  });

  it("prefills the +880 prefix for phone fields", () => {
    render(
      <TextField label="Phone" value="" onChangeText={() => {}} phoneField />,
    );
    expect(screen.getByLabelText("Phone").props.defaultValue).toBe("+880 ");
  });
});
