const learningService = require('../../src/services/learningService');
const knowledgeService = require('../../src/services/knowledgeService');
const patternExtractor = require('../../src/services/patternExtractor');

jest.mock('../../src/services/knowledgeService');
jest.mock('../../src/services/patternExtractor');

describe('LearningService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    knowledgeService.enabled = true;
  });

  describe('learnFromPR', () => {
    it('should learn patterns from PR', async () => {
      const prData = {
        number: 1,
        title: 'Add feature',
        stats: { totalFiles: 2, totalChanges: 50 }
      };

      const analysis = { complexity: 'low' };

      patternExtractor.extractAll.mockReturnValue({
        architecture: 'MVC pattern',
        conventions: 'camelCase',
        domain: 'authentication',
        patterns: 'async/await'
      });

      knowledgeService.appendKnowledge.mockResolvedValue(true);

      const result = await learningService.learnFromPR(prData, analysis, 'owner/repo');

      expect(result).toBe(true);
      expect(knowledgeService.appendKnowledge).toHaveBeenCalledTimes(4);
    });

    it('should skip if learning disabled', async () => {
      knowledgeService.enabled = false;

      const result = await learningService.learnFromPR({}, {}, 'owner/repo');

      expect(result).toBe(false);
      expect(patternExtractor.extractAll).not.toHaveBeenCalled();
    });

    it('should handle PRs with no patterns', async () => {
      patternExtractor.extractAll.mockReturnValue({
        architecture: null,
        conventions: null,
        domain: null,
        patterns: null
      });

      const result = await learningService.learnFromPR(
        { number: 1, title: 'Test', stats: {} },
        { complexity: 'low' },
        'owner/repo'
      );

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      patternExtractor.extractAll.mockImplementation(() => {
        throw new Error('Extraction failed');
      });

      const result = await learningService.learnFromPR(
        { number: 1, title: 'Test', stats: {} },
        { complexity: 'low' },
        'owner/repo'
      );

      expect(result).toBe(false);
    });
  });

  describe('getContextForReview', () => {
    it('should load and build context', async () => {
      knowledgeService.getAllKnowledge.mockResolvedValue({
        architecture: 'MVC pattern',
        conventions: 'camelCase'
      });

      knowledgeService.buildKnowledgeContext.mockReturnValue('# Project Knowledge\n...');

      const context = await learningService.getContextForReview('owner/repo');

      expect(context).toBeDefined();
      expect(knowledgeService.getAllKnowledge).toHaveBeenCalledWith('owner/repo');
    });

    it('should return null if no knowledge exists', async () => {
      knowledgeService.getAllKnowledge.mockResolvedValue({});

      const context = await learningService.getContextForReview('owner/repo');

      expect(context).toBeNull();
    });

    it('should return null if learning disabled', async () => {
      knowledgeService.enabled = false;

      const context = await learningService.getContextForReview('owner/repo');

      expect(context).toBeNull();
    });

    it('should handle errors', async () => {
      knowledgeService.getAllKnowledge.mockRejectedValue(new Error('Read failed'));

      const context = await learningService.getContextForReview('owner/repo');

      expect(context).toBeNull();
    });
  });

  describe('getKnowledgeStats', () => {
    it('should return stats', async () => {
      const mockStats = {
        categories: 3,
        lastUpdated: new Date()
      };

      knowledgeService.getRepoStats.mockResolvedValue(mockStats);

      const stats = await learningService.getKnowledgeStats('owner/repo');

      expect(stats).toEqual(mockStats);
    });

    it('should return null if learning disabled', async () => {
      knowledgeService.enabled = false;

      const stats = await learningService.getKnowledgeStats('owner/repo');

      expect(stats).toBeNull();
    });
  });
});
