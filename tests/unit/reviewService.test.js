const reviewService = require('../../src/services/reviewService');
const githubService = require('../../src/services/githubService');

jest.mock('../../src/services/githubService');

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPullRequestData', () => {
    it('should fetch and combine PR data', async () => {
      const mockPR = {
        number: 1,
        title: 'Test PR',
        body: 'Description',
        user: { login: 'testuser' },
        state: 'open',
        head: { sha: 'abc123', ref: 'feature' },
        base: { ref: 'main' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-02T00:00:00Z'
      };

      const mockFiles = [
        {
          filename: 'test.js',
          status: 'modified',
          additions: 10,
          deletions: 5,
          changes: 15,
          patch: '@@ -1,5 +1,10 @@'
        },
        {
          filename: 'test2.js',
          status: 'added',
          additions: 20,
          deletions: 0,
          changes: 20,
          patch: '@@ -0,0 +1,20 @@'
        }
      ];

      const mockDiff = 'diff --git a/test.js b/test.js...';

      githubService.getPullRequest.mockResolvedValue(mockPR);
      githubService.getPullRequestFiles.mockResolvedValue(mockFiles);
      githubService.getPullRequestDiff.mockResolvedValue(mockDiff);

      const result = await reviewService.fetchPullRequestData('owner', 'repo', 1);

      expect(result.number).toBe(1);
      expect(result.title).toBe('Test PR');
      expect(result.files).toHaveLength(2);
      expect(result.stats.totalFiles).toBe(2);
      expect(result.stats.totalAdditions).toBe(30);
      expect(result.stats.totalDeletions).toBe(5);
      expect(result.stats.totalChanges).toBe(35);
      expect(result.diff).toBe(mockDiff);
    });

    it('should handle PR without body', async () => {
      const mockPR = {
        number: 1,
        title: 'Test',
        body: null,
        user: { login: 'user' },
        state: 'open',
        head: { sha: 'abc', ref: 'feature' },
        base: { ref: 'main' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };

      githubService.getPullRequest.mockResolvedValue(mockPR);
      githubService.getPullRequestFiles.mockResolvedValue([]);
      githubService.getPullRequestDiff.mockResolvedValue('');

      const result = await reviewService.fetchPullRequestData('owner', 'repo', 1);

      expect(result.body).toBe('');
    });

    it('should handle files without patches', async () => {
      const mockFiles = [
        {
          filename: 'binary.png',
          status: 'added',
          additions: 0,
          deletions: 0,
          changes: 0
        }
      ];

      githubService.getPullRequest.mockResolvedValue({
        number: 1,
        title: 'Test',
        body: '',
        user: { login: 'user' },
        state: 'open',
        head: { sha: 'abc', ref: 'feature' },
        base: { ref: 'main' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      });
      githubService.getPullRequestFiles.mockResolvedValue(mockFiles);
      githubService.getPullRequestDiff.mockResolvedValue('');

      const result = await reviewService.fetchPullRequestData('owner', 'repo', 1);

      expect(result.files[0].patch).toBe('');
    });

    it('should handle fetch errors', async () => {
      githubService.getPullRequest.mockRejectedValue(new Error('API Error'));

      await expect(
        reviewService.fetchPullRequestData('owner', 'repo', 1)
      ).rejects.toThrow('API Error');
    });
  });

  describe('analyzePullRequest', () => {
    it('should detect large files', async () => {
      const prData = {
        number: 1,
        files: [
          { filename: 'large.js', changes: 600 }
        ],
        stats: { totalFiles: 1, totalChanges: 600 }
      };

      const analysis = await reviewService.analyzePullRequest(prData);

      expect(analysis.hasLargeFiles).toBe(true);
    });

    it('should detect multiple files', async () => {
      const prData = {
        number: 1,
        files: Array(10).fill({ filename: 'test.js', changes: 10 }),
        stats: { totalFiles: 10, totalChanges: 100 }
      };

      const analysis = await reviewService.analyzePullRequest(prData);

      expect(analysis.hasMultipleFiles).toBe(true);
    });

    it('should detect many changes', async () => {
      const prData = {
        number: 1,
        files: [{ filename: 'test.js', changes: 1500 }],
        stats: { totalFiles: 1, totalChanges: 1500 }
      };

      const analysis = await reviewService.analyzePullRequest(prData);

      expect(analysis.hasManyChanges).toBe(true);
    });

    it('should extract file types', async () => {
      const prData = {
        number: 1,
        files: [
          { filename: 'test.js', changes: 10 },
          { filename: 'style.css', changes: 5 },
          { filename: 'index.html', changes: 3 }
        ],
        stats: { totalFiles: 3, totalChanges: 18 }
      };

      const analysis = await reviewService.analyzePullRequest(prData);

      expect(analysis.fileTypes).toContain('js');
      expect(analysis.fileTypes).toContain('css');
      expect(analysis.fileTypes).toContain('html');
    });
  });

  describe('calculateComplexity', () => {
    it('should return high complexity for large PRs', () => {
      const prData = {
        stats: { totalFiles: 25, totalChanges: 1500 }
      };

      const complexity = reviewService.calculateComplexity(prData);

      expect(complexity).toBe('high');
    });

    it('should return medium complexity for moderate PRs', () => {
      const prData = {
        stats: { totalFiles: 12, totalChanges: 400 }
      };

      const complexity = reviewService.calculateComplexity(prData);

      expect(complexity).toBe('medium');
    });

    it('should return low complexity for small PRs', () => {
      const prData = {
        stats: { totalFiles: 3, totalChanges: 50 }
      };

      const complexity = reviewService.calculateComplexity(prData);

      expect(complexity).toBe('low');
    });
  });

  describe('processPullRequest', () => {
    it('should fetch and analyze PR', async () => {
      const mockPR = {
        number: 1,
        title: 'Test',
        body: '',
        user: { login: 'user' },
        state: 'open',
        head: { sha: 'abc', ref: 'feature' },
        base: { ref: 'main' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z'
      };

      const mockFiles = [
        {
          filename: 'test.js',
          status: 'modified',
          additions: 10,
          deletions: 5,
          changes: 15
        }
      ];

      githubService.getPullRequest.mockResolvedValue(mockPR);
      githubService.getPullRequestFiles.mockResolvedValue(mockFiles);
      githubService.getPullRequestDiff.mockResolvedValue('diff');

      const result = await reviewService.processPullRequest('owner', 'repo', 1);

      expect(result.prData).toBeDefined();
      expect(result.analysis).toBeDefined();
      expect(result.analysis.complexity).toBe('low');
    });
  });

  describe('getFileTypes', () => {
    it('should extract unique file extensions', () => {
      const files = [
        { filename: 'test.js' },
        { filename: 'app.js' },
        { filename: 'style.css' },
        { filename: 'README.md' }
      ];

      const types = reviewService.getFileTypes(files);

      expect(types).toContain('js');
      expect(types).toContain('css');
      expect(types).toContain('md');
      expect(types).toHaveLength(3);
    });

    it('should handle files without extensions', () => {
      const files = [
        { filename: 'Dockerfile' },
        { filename: 'Makefile' }
      ];

      const types = reviewService.getFileTypes(files);

      expect(types).toContain('Dockerfile');
      expect(types).toContain('Makefile');
      expect(types).toHaveLength(2);
    });
  });
});
