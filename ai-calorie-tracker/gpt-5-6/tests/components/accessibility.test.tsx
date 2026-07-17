import { render, screen } from "@testing-library/react-native";

import { AcquisitionView } from "../../src/components/scan/AcquisitionView";
import { AnalyzingOverlay } from "../../src/components/scan/AnalyzingOverlay";
import { ErrorCard } from "../../src/components/scan/ErrorCard";
import { ResultCard } from "../../src/components/scan/ResultCard";
import { nourishThemes } from "../../src/theme/tokens";

const result = {
  food: "Fried chicken with a very long descriptive meal name",
  calories: 988,
  protein_g: 54,
  carbs_g: 39,
  fat_g: 60,
  confidence: 0.99,
};

function luminance(hex: string) {
  const channels = [1, 3, 5].map(
    (offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255,
  );
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );

  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(foreground: string, background: string) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

describe("accessibility presentation", () => {
  it.each(["light", "dark"] as const)(
    "keeps %s semantic colors above required contrast",
    (scheme) => {
      const theme = nourishThemes[scheme];

      expect(contrast(theme.text, theme.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(
        contrast(theme.textMuted, theme.background),
      ).toBeGreaterThanOrEqual(4.5);
      expect(contrast(theme.coral, theme.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(theme.overGoal, theme.background)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(theme.onAccent, theme.primary)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(contrast(theme.protein, theme.track)).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.carbs, theme.track)).toBeGreaterThanOrEqual(3);
      expect(contrast(theme.fat, theme.track)).toBeGreaterThanOrEqual(3);
    },
  );

  it("marks acquisition hierarchy, state, and controls for assistive technology", async () => {
    await render(
      <AcquisitionView
        busy
        cameraMessage="Camera access is off."
        errorMessage="We could not prepare that photo."
        onCamera={jest.fn()}
        onClose={jest.fn()}
        onPhotos={jest.fn()}
      />,
    );

    expect(screen.getByText("What are you eating?")).toHaveProp(
      "accessibilityRole",
      "header",
    );
    expect(
      screen.getByRole("button", { name: "Choose from Photos" }),
    ).toHaveProp("accessibilityState", { disabled: true });
    expect(screen.getByText("Camera access is off.")).toHaveProp(
      "accessibilityRole",
      "alert",
    );
    expect(screen.getByText("We could not prepare that photo.")).toHaveProp(
      "accessibilityRole",
      "alert",
    );
  });

  it("exposes an indeterminate analysis status and removes decorative motion", async () => {
    await render(<AnalyzingOverlay reduceMotionOverride />);

    expect(
      screen.getByRole("progressbar", { name: /Analyzing your meal/ }),
    ).toBeOnTheScreen();
    expect(screen.queryByTestId("analysis-spinner")).not.toBeOnTheScreen();
    expect(screen.getByTestId("analysis-status-marker")).toBeOnTheScreen();
  });

  it("keeps error recovery and long result content readable at larger text sizes", async () => {
    const view = await render(
      <ErrorCard
        kind="network"
        onDiscard={jest.fn()}
        onRetryAnalysis={jest.fn()}
        onTryAnother={jest.fn()}
      />,
    );

    expect(screen.getByText("Connection interrupted")).toHaveProp(
      "accessibilityRole",
      "header",
    );
    expect(screen.getByText(/Your photo is ready/)).toHaveProp(
      "accessibilityRole",
      "alert",
    );

    await view.rerender(
      <ResultCard
        accepting={false}
        onAccept={jest.fn()}
        onDiscard={jest.fn()}
        result={result}
      />,
    );

    expect(
      screen.getByText(result.food).props.maxFontSizeMultiplier,
    ).toBeGreaterThanOrEqual(1.3);
    expect(screen.getByText(result.food)).toHaveProp(
      "accessibilityRole",
      "header",
    );
    expect(
      screen.getByRole("button", { name: "Accept estimate" }),
    ).toBeEnabled();
  });
});
