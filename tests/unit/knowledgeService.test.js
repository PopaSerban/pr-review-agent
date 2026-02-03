const fs = require('fs').promises;
const path = require('path');

jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));

jest.mock('../../src/config', () => ({
  learning: {
    enabled: true,
    knowledgeDir: './knowledge'
  },
  server: {
    nodeEnv: 'test',
    logLevel: 'error'
  }
}));

const knowledgeService = require('../../src/services/knowledgeService');

describe('KnowledgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    knowledgeService.enabled = true;
  });

  describe('ensureKnowledgeDir', () => {
    it('should create knowledge directory', async () => {
      fs.mkdir.mockResolvedValue();

      const result = await knowledgeService.ensureKnowledgeDir('owner/repo');

      expect(fs.mkdir).toHaveBeenCalled();
      expect(result).toContain('owner-repo');
    });

    it('should return null if learning disabled', async () => {
      knowledgeService.enabled = false;

      const result = await knowledgeService.ensureKnowledgeDir('owner/repo');

      expect(result).toBeNull();
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should handle mkdir errors', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));

      const result = await knowledgeService.ensureKnowledgeDir('owner/repo');

      expect(result).toBeNull();
    });
  });

  describe('loadKnowledge', () => {
    it('should load existing knowledge', async () => {
      fs.readFile.mockResolvedValue('# Architecture\nMVC pattern');

      const result = await knowledgeService.loadKnowledge('owner/repo', 'architecture');

      expect(result).toBe('# Architecture\nMVC pattern');
    });

    it('should return null if file does not exist', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);

      const result = await knowledgeService.loadKnowledge('owner/repo', 'architecture');

      expect(result).toBeNull();
    });

    it('should return null if learning disabled', async () => {
      knowledgeService.enabled = false;

      const result = await knowledgeService.loadKnowledge('owner/repo', 'architecture');

      expect(result).toBeNull();
    });
  });

  describe('saveKnowledge', () => {
    it('should save knowledge to file', async () => {
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await knowledgeService.saveKnowledge('owner/repo', 'conventions', 'Use camelCase');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false if learning disabled', async () => {
      knowledgeService.enabled = false;

      const result = await knowledgeService.saveKnowledge('owner/repo', 'conventions', 'content');

      expect(result).toBe(false);
    });
  });

  describe('appendKnowledge', () => {
    it('should append to existing knowledge', async () => {
      fs.readFile.mockResolvedValue('# Conventions\nExisting content');
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await knowledgeService.appendKnowledge('owner/repo', 'conventions', 'New pattern');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should create new file if none exists', async () => {
      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();

      const result = await knowledgeService.appendKnowledge('owner/repo', 'patterns', 'First pattern');

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('getAllKnowledge', () => {
    it('should load all knowledge categories', async () => {
      fs.readFile.mockImplementation((filePath) => {
        if (filePath.includes('architecture')) return Promise.resolve('Architecture content');
        if (filePath.includes('conventions')) return Promise.resolve('Conventions content');
        const error = new Error('Not found');
        error.code = 'ENOENT';
        return Promise.reject(error);
      });

      const result = await knowledgeService.getAllKnowledge('owner/repo');

      expect(result.architecture).toBe('Architecture content');
      expect(result.conventions).toBe('Conventions content');
      expect(result.domain).toBeUndefined();
    });

    it('should return empty object if learning disabled', async () => {
      knowledgeService.enabled = false;

      const result = await knowledgeService.getAllKnowledge('owner/repo');

      expect(result).toEqual({});
    });
  });

  describe('buildKnowledgeContext', () => {
    it('should build context from knowledge', () => {
      const knowledge = {
        architecture: 'MVC pattern used throughout',
        conventions: 'camelCase for variables'
      };

      const context = knowledgeService.buildKnowledgeContext(knowledge);

      expect(context).toContain('# Project Knowledge');
      expect(context).toContain('## Architecture Patterns');
      expect(context).toContain('## Code Conventions');
    });

    it('should return empty string for no knowledge', () => {
      const context = knowledgeService.buildKnowledgeContext({});

      expect(context).toBe('');
    });

    it('should truncate long content', () => {
      const knowledge = {
        architecture: 'a'.repeat(1000)
      };

      const context = knowledgeService.buildKnowledgeContext(knowledge);

      expect(context.length).toBeLessThan(1000);
      expect(context).toContain('[truncated for brevity]');
    });
  });

  describe('truncateContent', () => {
    it('should not truncate short content', () => {
      const content = 'Short content';
      const result = knowledgeService.truncateContent(content, 100);

      expect(result).toBe(content);
    });

    it('should truncate long content', () => {
      const content = 'a'.repeat(1000);
      const result = knowledgeService.truncateContent(content, 100);

      expect(result.length).toBeLessThan(content.length);
      expect(result).toContain('[truncated for brevity]');
    });
  });

  describe('getRepoStats', () => {
    it('should return stats for repository', async () => {
      fs.readdir.mockResolvedValue(['architecture.md', 'conventions.md']);
      fs.stat.mockResolvedValue({ mtime: new Date() });

      const stats = await knowledgeService.getRepoStats('owner/repo');

      expect(stats.categories).toBe(2);
      expect(stats.lastUpdated).toBeDefined();
    });

    it('should return null if directory does not exist', async () => {
      fs.readdir.mockRejectedValue(new Error('Not found'));

      const stats = await knowledgeService.getRepoStats('owner/repo');

      expect(stats).toBeNull();
    });
  });
});
