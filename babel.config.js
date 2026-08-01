const expoPreset = require.resolve('babel-preset-expo', {
  paths: [require.resolve('expo/package.json')],
});

module.exports = (api) => {
  api.cache(true);
  return {
    presets: [[expoPreset, { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
