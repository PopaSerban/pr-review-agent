const { sanitizeRepoName, isValidHttpMethod } = require('../../src/utils/helpers');

describe('Helper Functions', () => {
  describe('sanitizeRepoName', () => {
    it('should replace slash with dash', () => {
      expect(sanitizeRepoName('owner/repo')).toBe('owner-repo');
    });

    it('should handle multiple slashes', () => {
      expect(sanitizeRepoName('owner/repo/branch')).toBe('owner-repo-branch');
    });
  });

  describe('isValidHttpMethod', () => {
    it('should validate correct HTTP methods', () => {
      expect(isValidHttpMethod('GET')).toBe(true);
      expect(isValidHttpMethod('POST')).toBe(true);
      expect(isValidHttpMethod('PUT')).toBe(true);
      expect(isValidHttpMethod('DELETE')).toBe(true);
    });

    it('should handle lowercase methods', () => {
      expect(isValidHttpMethod('get')).toBe(true);
      expect(isValidHttpMethod('post')).toBe(true);
    });

    it('should reject invalid methods', () => {
      expect(isValidHttpMethod('INVALID')).toBe(false);
      expect(isValidHttpMethod('FETCH')).toBe(false);
    });
  });
});
