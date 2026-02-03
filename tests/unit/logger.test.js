const logger = require('../../src/utils/logger');

describe('Logger', () => {
  it('should have all required log levels', () => {
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.http).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  it('should be a winston logger instance', () => {
    expect(logger.constructor.name).toBe('DerivedLogger');
  });

  it('should not exit on error', () => {
    expect(logger.exitOnError).toBe(false);
  });
});
