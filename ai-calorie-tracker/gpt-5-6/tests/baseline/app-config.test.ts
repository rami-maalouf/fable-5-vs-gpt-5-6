import appConfig from "../../app.json";

describe("app configuration", () => {
  it("enables server output and exactly one small widget", () => {
    expect(appConfig.expo.web.output).toBe("server");

    const widgetPlugin = appConfig.expo.plugins.find(
      (plugin) => Array.isArray(plugin) && plugin[0] === "expo-widgets",
    );

    expect(widgetPlugin).toEqual([
      "expo-widgets",
      expect.objectContaining({
        widgets: [
          expect.objectContaining({
            name: "RemainingCaloriesWidget",
            supportedFamilies: ["systemSmall"],
          }),
        ],
      }),
    ]);
  });

  it("keeps native status bar ownership compatible with react native", () => {
    expect(
      appConfig.expo.ios.infoPlist.UIViewControllerBasedStatusBarAppearance,
    ).toBe(false);
  });
});
