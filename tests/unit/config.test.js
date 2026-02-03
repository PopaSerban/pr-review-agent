const { parseWatchedRepos, validateRepoFormat } = require('../../src/config/validator');

describe('Configuration Validator', () => {
  describe('parseWatchedRepos', () => {
    it('should parse comma-separated repos', () => {
      const result = parseWatchedRepos('owner/repo1,owner/repo2');
      expect(result).toEqual(['owner/repo1', 'owner/repo2']);
    });

    it('should handle spaces around repos', () => {
      const result = parseWatchedRepos('owner/repo1 , owner/repo2');
      expect(result).toEqual(['owner/repo1', 'owner/repo2']);
    });

    it('should return empty array for empty string', () => {
      const result = parseWatchedRepos('');
      expect(result).toEqual([]);
    });

    it('should filter out empty entries', () => {
      const result = parseWatchedRepos('owner/repo1,,owner/repo2');
      expect(result).toEqual(['owner/repo1', 'owner/repo2']);
    });
  });

  describe('validateRepoFormat', () => {
    it('should validate correct repo format', () => {
      expect(validateRepoFormat('owner/repo')).toBe(true);
      expect(validateRepoFormat('my-org/my-repo')).toBe(true);
      expect(validateRepoFormat('user_name/repo_name')).toBe(true);
    });

    it('should reject invalid repo format', () => {
      expect(validateRepoFormat('invalid')).toBe(false);
      expect(validateRepoFormat('owner/')).toBe(false);
      expect(validateRepoFormat('/repo')).toBe(false);
      expect(validateRepoFormat('owner/repo/extra')).toBe(false);
    });
  });
});
