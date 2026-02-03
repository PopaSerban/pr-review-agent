const Review = require('../../src/models/Review');

describe('Review Model', () => {
  describe('constructor', () => {
    it('should create a review with basic data', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 5,
          totalChanges: 100,
          totalAdditions: 60,
          totalDeletions: 40
        }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js', 'css'],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.prNumber).toBe(1);
      expect(review.complexity).toBe('low');
      expect(review.event).toBe('COMMENT');
    });
  });

  describe('generateSummary', () => {
    it('should generate summary for low complexity PR', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 3,
          totalChanges: 50,
          totalAdditions: 30,
          totalDeletions: 20
        }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js'],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.summary).toContain('## PR Review Summary');
      expect(review.summary).toContain('**Complexity**: low');
      expect(review.summary).toContain('**Files Changed**: 3');
      expect(review.summary).toContain('**Total Changes**: 50');
      expect(review.summary).toContain('✅ Reasonable size for review');
    });

    it('should flag large files', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 2,
          totalChanges: 600,
          totalAdditions: 400,
          totalDeletions: 200
        }
      };

      const analysis = {
        complexity: 'medium',
        fileTypes: ['js'],
        hasLargeFiles: true,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.summary).toContain('⚠️ Contains files with significant changes');
    });

    it('should flag multiple files', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 12,
          totalChanges: 200,
          totalAdditions: 120,
          totalDeletions: 80
        }
      };

      const analysis = {
        complexity: 'medium',
        fileTypes: ['js', 'css', 'html'],
        hasLargeFiles: false,
        hasMultipleFiles: true,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.summary).toContain('📁 Multiple files modified');
    });

    it('should flag many changes', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 5,
          totalChanges: 1500,
          totalAdditions: 900,
          totalDeletions: 600
        }
      };

      const analysis = {
        complexity: 'high',
        fileTypes: ['js'],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: true
      };

      const review = new Review(prData, analysis);

      expect(review.summary).toContain('🔍 Large changeset - consider breaking into smaller PRs');
    });

    it('should include file types', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 3,
          totalChanges: 50,
          totalAdditions: 30,
          totalDeletions: 20
        }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js', 'css', 'html'],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.summary).toContain('**File Types**: js, css, html');
    });

    it('should handle empty file types', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 1,
          totalChanges: 10,
          totalAdditions: 10,
          totalDeletions: 0
        }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: [],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.summary).not.toContain('**File Types**');
    });
  });

  describe('determineEvent', () => {
    it('should return COMMENT for high complexity', () => {
      const prData = {
        number: 1,
        stats: { totalFiles: 1, totalChanges: 10, totalAdditions: 10, totalDeletions: 0 }
      };

      const analysis = {
        complexity: 'high',
        fileTypes: [],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.event).toBe('COMMENT');
    });

    it('should return COMMENT for low complexity', () => {
      const prData = {
        number: 1,
        stats: { totalFiles: 1, totalChanges: 10, totalAdditions: 10, totalDeletions: 0 }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: [],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);

      expect(review.event).toBe('COMMENT');
    });
  });

  describe('toGitHubReview', () => {
    it('should format review for GitHub API', () => {
      const prData = {
        number: 1,
        stats: {
          totalFiles: 2,
          totalChanges: 30,
          totalAdditions: 20,
          totalDeletions: 10
        }
      };

      const analysis = {
        complexity: 'low',
        fileTypes: ['js'],
        hasLargeFiles: false,
        hasMultipleFiles: false,
        hasManyChanges: false
      };

      const review = new Review(prData, analysis);
      const githubReview = review.toGitHubReview();

      expect(githubReview).toHaveProperty('body');
      expect(githubReview).toHaveProperty('event');
      expect(githubReview.event).toBe('COMMENT');
      expect(githubReview.body).toContain('## PR Review Summary');
    });
  });
});
