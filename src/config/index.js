const { validateConfig } = require('./validator');

let validatedConfig;

try {
  validatedConfig = validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
}

module.exports = validatedConfig;
