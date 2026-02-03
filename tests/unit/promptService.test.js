const promptService = require('../../src/services/promptService');

describe('PromptService', () => {
  describe('getSystemPrompt', () => {
    it('should return system prompt', () => {
      const prompt = promptService.getSystemPrompt();
      
      expect(prompt).toContain('senior software engineer');
      expect(prompt).toContain('code review');
      expect(prompt).toContain('Security');
      expect(prompt).toContain('Performance');
    });
  });

  describe('buildReviewPrompt', () => {
    it('should build comprehensive review prompt', () => {
      const prData = {
        title: 'Add new feature',
        author: 'testuser',
        body: 'This PR adds a new feature',
        stats: {
          totalFiles: 3,
          totalAdditions: 50,
          totalDeletions: 10
        },
        files: [
          {
            filename: 'src/app.js',
            status: 'modified',
            additions: 30,
            deletions: 5,
            changes: 35,
            patch: '@@ -1,5 +1,10 @@\n+new code'
          },
          {
            filename: 'src/utils.js',
            status: 'added',
            additions: 20,
            deletions: 0,
            changes: 20,
            patch: '@@ -0,0 +1,20 @@\n+utility code'
          }
        ]
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js']
      };

      const prompt = promptService.buildReviewPrompt(prData, analysis);

      expect(prompt).toContain('Add new feature');
      expect(prompt).toContain('testuser');
      expect(prompt).toContain('**Files Changed**: 3');
      expect(prompt).toContain('src/app.js');
      expect(prompt).toContain('src/utils.js');
    });

    it('should handle PR without body', () => {
      const prData = {
        title: 'Test PR',
        author: 'user',
        body: '',
        stats: { totalFiles: 1, totalAdditions: 10, totalDeletions: 0 },
        files: []
      };

      const analysis = {
        complexity: 'low',
        fileTypes: []
      };

      const prompt = promptService.buildReviewPrompt(prData, analysis);

      expect(prompt).toContain('Test PR');
      expect(prompt).not.toContain('**Description**');
    });

    it('should truncate long patches', () => {
      const longPatch = 'a'.repeat(3000);
      
      const prData = {
        title: 'Test',
        author: 'user',
        body: '',
        stats: { totalFiles: 1, totalAdditions: 100, totalDeletions: 0 },
        files: [{
          filename: 'large.js',
          status: 'modified',
          additions: 100,
          deletions: 0,
          changes: 100,
          patch: longPatch
        }]
      };

      const analysis = {
        complexity: 'medium',
        fileTypes: ['js']
      };

      const prompt = promptService.buildReviewPrompt(prData, analysis);

      expect(prompt).toContain('[truncated]');
    });

    it('should limit files to 10 in summary', () => {
      const files = Array(15).fill(null).map((_, i) => ({
        filename: `file${i}.js`,
        status: 'modified',
        additions: 10,
        deletions: 5,
        changes: 15,
        patch: 'patch'
      }));

      const prData = {
        title: 'Many files',
        author: 'user',
        body: '',
        stats: { totalFiles: 15, totalAdditions: 150, totalDeletions: 75 },
        files
      };

      const analysis = {
        complexity: 'high',
        fileTypes: ['js']
      };

      const prompt = promptService.buildReviewPrompt(prData, analysis);

      expect(prompt).toContain('and 5 more files');
    });
  });

  describe('selectRelevantFiles', () => {
    it('should select most relevant files', () => {
      const files = [
        { filename: 'test.spec.js', status: 'modified', changes: 100, patch: 'test' },
        { filename: 'app.js', status: 'modified', changes: 50, patch: 'code' },
        { filename: 'utils.js', status: 'added', changes: 30, patch: 'utils' },
        { filename: 'README.md', status: 'modified', changes: 10, patch: 'docs' }
      ];

      const selected = promptService.selectRelevantFiles(files, 2);

      expect(selected).toHaveLength(2);
      expect(selected[0].filename).toBe('utils.js');
      expect(selected[1].filename).toBe('test.spec.js');
    });
  });

  describe('calculateFileRelevance', () => {
    it('should score code files higher', () => {
      const codeFile = { filename: 'app.js', status: 'modified', changes: 50 };
      const docFile = { filename: 'README.md', status: 'modified', changes: 50 };

      const codeScore = promptService.calculateFileRelevance(codeFile);
      const docScore = promptService.calculateFileRelevance(docFile);

      expect(codeScore).toBeGreaterThan(docScore);
    });

    it('should score added files higher than modified', () => {
      const addedFile = { filename: 'new.js', status: 'added', changes: 50 };
      const modifiedFile = { filename: 'old.js', status: 'modified', changes: 50 };

      const addedScore = promptService.calculateFileRelevance(addedFile);
      const modifiedScore = promptService.calculateFileRelevance(modifiedFile);

      expect(addedScore).toBeGreaterThan(modifiedScore);
    });

    it('should score test files lower', () => {
      const testFile = { filename: 'app.test.js', status: 'modified', changes: 50 };
      const codeFile = { filename: 'app.js', status: 'modified', changes: 50 };

      const testScore = promptService.calculateFileRelevance(testFile);
      const codeScore = promptService.calculateFileRelevance(codeFile);

      expect(testScore).toBeLessThan(codeScore);
    });
  });

  describe('buildMessages', () => {
    it('should build messages array for GPT', () => {
      const prData = {
        title: 'Test',
        author: 'user',
        body: '',
        stats: { totalFiles: 1, totalAdditions: 10, totalDeletions: 0 },
        files: []
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js']
      };

      const messages = promptService.buildMessages(prData, analysis);

      expect(messages).toHaveLength(2);
      expect(messages[0].role).toBe('system');
      expect(messages[1].role).toBe('user');
      expect(messages[0].content).toContain('senior software engineer');
      expect(messages[1].content).toContain('Test');
    });
  });

  describe('formatGPTResponse', () => {
    it('should add header if missing', () => {
      const response = 'This is a review without header';
      const formatted = promptService.formatGPTResponse(response);

      expect(formatted).toContain('## AI Code Review');
    });

    it('should not add header if already present', () => {
      const response = '# Review\nThis already has a header';
      const formatted = promptService.formatGPTResponse(response);

      expect(formatted).toBe(response);
    });

    it('should trim whitespace', () => {
      const response = '  \n\n  Review content  \n\n  ';
      const formatted = promptService.formatGPTResponse(response);

      expect(formatted).not.toMatch(/^\s+/);
      expect(formatted).not.toMatch(/\s+$/);
    });
  });
});
