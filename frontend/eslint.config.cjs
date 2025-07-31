const securityPlugin = require("eslint-plugin-security");

module.exports = [
  {
    ignores: ["node_modules/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "module"
    },
    plugins: {
      security: securityPlugin
    },
    rules: {
      ...securityPlugin.configs.recommended.rules
    }
  }
]; 