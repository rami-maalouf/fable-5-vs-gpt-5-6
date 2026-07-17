import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { AcquisitionView } from "../../src/components/scan/AcquisitionView";

jest.mock("react-native-safe-area-context", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    SafeAreaView: ({
      children,
      ...props
    }: import("react").PropsWithChildren<
      import("react-native").ViewProps
    >) => React.createElement(View, props, children),
    initialWindowMetrics: {
      frame: { height: 874, width: 402, x: 0, y: 0 },
      insets: { bottom: 34, left: 0, right: 0, top: 59 },
    },
  };
});

describe("scanner acquisition safe area", () => {
  it("places the close control below the live top inset", async () => {
    await render(
      <AcquisitionView
        busy={false}
        onCamera={jest.fn()}
        onClose={jest.fn()}
        onPhotos={jest.fn()}
      />,
    );

    const safeArea = screen.getByTestId("scanner-safe-area");
    expect(StyleSheet.flatten(safeArea.props.style).paddingTop).toBe(59);
    expect(
      screen.getByRole("button", { name: "Close scanner" }),
    ).toBeEnabled();
  });
});
