const fs = require('fs').promises;
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');
const { sanitizeRepoName } = require('../utils/helpers');

class KnowledgeService {
  constructor() {
    this.knowledgeDir = config.learning?.knowledgeDir || './knowledge';
    this.enabled = config.learning?.enabled || false;
  }

  async ensureKnowledgeDir(repoFullName) {
    if (!this.enabled) return null;

    const sanitized = sanitizeRepoName(repoFullName);
    const repoDir = path.join(this.knowledgeDir, sanitized);

    try {
      await fs.mkdir(repoDir, { recursive: true });
      return repoDir;
    } catch (error) {
      logger.error(`Failed to create knowledge directory: ${error.message}`);
      return null;
    }
  }

  async loadKnowledge(repoFullName, category) {
    if (!this.enabled) return null;

    const sanitized = sanitizeRepoName(repoFullName);
    const filePath = path.join(this.knowledgeDir, sanitized, `${category}.md`);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      logger.debug(`Loaded ${category} knowledge for ${repoFullName}`);
      return content;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        logger.error(`Failed to load knowledge: ${error.message}`);
      }
      return null;
    }
  }

  async saveKnowledge(repoFullName, category, content) {
    if (!this.enabled) return false;

    const repoDir = await this.ensureKnowledgeDir(repoFullName);
    if (!repoDir) return false;

    const filePath = path.join(repoDir, `${category}.md`);

    try {
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`Saved ${category} knowledge for ${repoFullName}`);
      return true;
    } catch (error) {
      logger.error(`Failed to save knowledge: ${error.message}`);
      return false;
    }
  }

  async appendKnowledge(repoFullName, category, newContent) {
    if (!this.enabled) return false;

    const existing = await this.loadKnowledge(repoFullName, category) || '';
    const timestamp = new Date().toISOString().split('T')[0];
    
    const updated = existing 
      ? `${existing}\n\n## Update ${timestamp}\n${newContent}`
      : `# ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n## ${timestamp}\n${newContent}`;

    return await this.saveKnowledge(repoFullName, category, updated);
  }

  async getAllKnowledge(repoFullName) {
    if (!this.enabled) return {};

    const categories = ['architecture', 'conventions', 'domain', 'patterns', 'preferences'];
    const knowledge = {};

    for (const category of categories) {
      const content = await this.loadKnowledge(repoFullName, category);
      if (content) {
        knowledge[category] = content;
      }
    }

    return knowledge;
  }

  buildKnowledgeContext(knowledge) {
    if (!knowledge || Object.keys(knowledge).length === 0) {
      return '';
    }

    const sections = [];
    sections.push('# Project Knowledge\n');

    if (knowledge.architecture) {
      sections.push('## Architecture Patterns');
      sections.push(this.truncateContent(knowledge.architecture, 500));
      sections.push('');
    }

    if (knowledge.conventions) {
      sections.push('## Code Conventions');
      sections.push(this.truncateContent(knowledge.conventions, 500));
      sections.push('');
    }

    if (knowledge.patterns) {
      sections.push('## Common Patterns');
      sections.push(this.truncateContent(knowledge.patterns, 500));
      sections.push('');
    }

    if (knowledge.preferences) {
      sections.push('## Review Preferences');
      sections.push(this.truncateContent(knowledge.preferences, 300));
      sections.push('');
    }

    return sections.join('\n');
  }

  truncateContent(content, maxLength) {
    if (content.length <= maxLength) {
      return content;
    }

    const lines = content.split('\n');
    let result = [];
    let length = 0;

    for (const line of lines) {
      if (length + line.length > maxLength) {
        result.push('... [truncated for brevity]');
        break;
      }
      result.push(line);
      length += line.length + 1;
    }

    return result.join('\n');
  }

  async getRepoStats(repoFullName) {
    if (!this.enabled) return null;

    const sanitized = sanitizeRepoName(repoFullName);
    const repoDir = path.join(this.knowledgeDir, sanitized);

    try {
      const files = await fs.readdir(repoDir);
      const stats = {
        categories: files.filter(f => f.endsWith('.md')).length,
        lastUpdated: null
      };

      for (const file of files) {
        const filePath = path.join(repoDir, file);
        const stat = await fs.stat(filePath);
        if (!stats.lastUpdated || stat.mtime > stats.lastUpdated) {
          stats.lastUpdated = stat.mtime;
        }
      }

      return stats;
    } catch (error) {
      return null;
    }
  }
}

module.exports = new KnowledgeService();
