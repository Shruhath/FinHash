module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
    plugins: [
      // Must stay last — Reanimated/worklets rewrites worklet functions.
      "react-native-worklets/plugin",
    ],
  };
};
