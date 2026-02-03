const patternExtractor = require('../../src/services/patternExtractor');

describe('PatternExtractor', () => {
  describe('extractArchitecturePatterns', () => {
    it('should extract directory structure', () => {
      const prData = {
        files: [
          { filename: 'src/controllers/user.js' },
          { filename: 'src/services/auth.js' },
          { filename: 'tests/unit/user.test.js' }
        ]
      };

      const result = patternExtractor.extractArchitecturePatterns(prData);

      expect(result).toContain('src/controllers');
      expect(result).toContain('src/services');
    });

    it('should detect test presence', () => {
      const prData = {
        files: [
          { filename: 'src/app.js' },
          { filename: 'tests/app.test.js' }
        ]
      };

      const result = patternExtractor.extractArchitecturePatterns(prData);

      expect(result).toContain('Tests are included');
    });

    it('should detect documentation updates', () => {
      const prData = {
        files: [
          { filename: 'src/app.js' },
          { filename: 'README.md' }
        ]
      };

      const result = patternExtractor.extractArchitecturePatterns(prData);

      expect(result).toContain('Documentation is updated');
    });

    it('should return null for no patterns', () => {
      const prData = { files: [] };

      const result = patternExtractor.extractArchitecturePatterns(prData);

      expect(result).toBeNull();
    });
  });

  describe('extractConventions', () => {
    it('should detect camelCase naming', () => {
      const prData = {
        files: [{ filename: 'userController.js' }]
      };

      const result = patternExtractor.extractConventions(prData);

      expect(result).toContain('camelCase');
    });

    it('should detect kebab-case naming', () => {
      const prData = {
        files: [{ filename: 'user-controller.js' }]
      };

      const result = patternExtractor.extractConventions(prData);

      expect(result).toContain('kebab-case');
    });

    it('should detect snake_case naming', () => {
      const prData = {
        files: [{ filename: 'user_controller.js' }]
      };

      const result = patternExtractor.extractConventions(prData);

      expect(result).toContain('snake_case');
    });

    it('should list file types', () => {
      const prData = {
        files: [
          { filename: 'app.js' },
          { filename: 'style.css' },
          { filename: 'index.html' }
        ]
      };

      const result = patternExtractor.extractConventions(prData);

      expect(result).toContain('File types');
      expect(result).toContain('js');
      expect(result).toContain('css');
    });
  });

  describe('extractDomainKnowledge', () => {
    it('should extract keywords from title', () => {
      const prData = {
        title: 'Add user authentication feature',
        body: '',
        files: []
      };

      const result = patternExtractor.extractDomainKnowledge(prData);

      expect(result).toContain('Feature area');
      expect(result).toContain('user');
      expect(result).toContain('authentication');
    });

    it('should extract keywords from body', () => {
      const prData = {
        title: 'Update',
        body: 'Implements OAuth2 authentication with JWT tokens',
        files: []
      };

      const result = patternExtractor.extractDomainKnowledge(prData);

      expect(result).toContain('Related concepts');
    });

    it('should identify modified areas', () => {
      const prData = {
        title: 'Test',
        body: '',
        files: [
          { filename: 'src/auth.js' },
          { filename: 'src/user.js' },
          { filename: 'tests/auth.test.js' }
        ]
      };

      const result = patternExtractor.extractDomainKnowledge(prData);

      expect(result).toContain('Modified areas');
      expect(result).toContain('src');
      expect(result).toContain('tests');
    });
  });

  describe('extractCodePatterns', () => {
    it('should detect async/await usage', () => {
      const prData = {
        files: [{
          filename: 'app.js',
          patch: '+async function getData() {\n+  await fetch()'
        }]
      };

      const result = patternExtractor.extractCodePatterns(prData);

      expect(result).toContain('async/await');
    });

    it('should detect error handling', () => {
      const prData = {
        files: [{
          filename: 'app.js',
          patch: '+try {\n+  doSomething();\n+} catch (error) {'
        }]
      };

      const result = patternExtractor.extractCodePatterns(prData);

      expect(result).toContain('error handling');
    });

    it('should detect TypeScript', () => {
      const prData = {
        files: [{ filename: 'app.ts', patch: '' }]
      };

      const result = patternExtractor.extractCodePatterns(prData);

      expect(result).toContain('TypeScript');
    });

    it('should detect JSDoc comments', () => {
      const prData = {
        files: [{
          filename: 'app.js',
          patch: '+/**\n+ * Function description\n+ */'
        }]
      };

      const result = patternExtractor.extractCodePatterns(prData);

      expect(result).toContain('JSDoc');
    });

    it('should return null for no patterns', () => {
      const prData = {
        files: [{ filename: 'app.js', patch: '' }]
      };

      const result = patternExtractor.extractCodePatterns(prData);

      expect(result).toBeNull();
    });
  });

  describe('extractKeywords', () => {
    it('should extract meaningful keywords', () => {
      const text = 'Add user authentication with OAuth2 and JWT tokens';

      const keywords = patternExtractor.extractKeywords(text);

      expect(keywords).toContain('user');
      expect(keywords).toContain('authentication');
      expect(keywords).toContain('oauth2');
    });

    it('should filter common words', () => {
      const text = 'The user is authenticated with the system';

      const keywords = patternExtractor.extractKeywords(text);

      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('with');
    });

    it('should handle empty text', () => {
      const keywords = patternExtractor.extractKeywords('');

      expect(keywords).toEqual([]);
    });
  });

  describe('extractAll', () => {
    it('should extract all pattern types', () => {
      const prData = {
        number: 1,
        title: 'Add authentication',
        body: 'OAuth2 implementation',
        files: [
          { filename: 'src/auth.js', patch: '+async function login()' },
          { filename: 'tests/auth.test.js', patch: '' }
        ],
        stats: {
          totalFiles: 2,
          totalChanges: 50
        }
      };

      const analysis = { complexity: 'low' };

      const result = patternExtractor.extractAll(prData, analysis);

      expect(result.architecture).toBeDefined();
      expect(result.conventions).toBeDefined();
      expect(result.domain).toBeDefined();
      expect(result.patterns).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.prNumber).toBe(1);
      expect(result.metadata.complexity).toBe('low');
    });

    it('should handle PRs with minimal patterns', () => {
      const prData = {
        number: 2,
        title: 'Fix typo',
        body: '',
        files: [{ filename: 'README.md', patch: '' }],
        stats: { totalFiles: 1, totalChanges: 1 }
      };

      const analysis = { complexity: 'low' };

      const result = patternExtractor.extractAll(prData, analysis);

      expect(result.metadata).toBeDefined();
    });
  });
});
