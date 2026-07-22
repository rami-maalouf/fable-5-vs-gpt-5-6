const app = require('./app.json');

module.exports = () => ({
  ...app.expo,
  web: {
    ...app.expo.web,
    output: process.env.EXPO_PUBLIC_DEMO_MODE === '1' ? 'single' : app.expo.web.output,
  },
});
