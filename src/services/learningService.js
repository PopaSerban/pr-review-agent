const knowledgeService = require('./knowledgeService');
const patternExtractor = require('./patternExtractor');
const logger = require('../utils/logger');

class LearningService {
  async learnFromPR(prData, analysis, repoFullName) {
    if (!knowledgeService.enabled) {
      logger.debug('Learning is disabled, skipping');
      return false;
    }

    try {
      logger.info(`Learning from PR #${prData.number} in ${repoFullName}`);

      const patterns = patternExtractor.extractAll(prData, analysis);

      const updates = [];

      if (patterns.architecture) {
        const success = await knowledgeService.appendKnowledge(
          repoFullName,
          'architecture',
          `PR #${prData.number}: ${prData.title}\n- ${patterns.architecture}`
        );
        if (success) updates.push('architecture');
      }

      if (patterns.conventions) {
        const success = await knowledgeService.appendKnowledge(
          repoFullName,
          'conventions',
          `PR #${prData.number}\n- ${patterns.conventions}`
        );
        if (success) updates.push('conventions');
      }

      if (patterns.domain) {
        const success = await knowledgeService.appendKnowledge(
          repoFullName,
          'domain',
          `PR #${prData.number}: ${prData.title}\n- ${patterns.domain}`
        );
        if (success) updates.push('domain');
      }

      if (patterns.patterns) {
        const success = await knowledgeService.appendKnowledge(
          repoFullName,
          'patterns',
          `PR #${prData.number}\n- ${patterns.patterns}`
        );
        if (success) updates.push('patterns');
      }

      if (updates.length > 0) {
        logger.info(`Updated knowledge categories: ${updates.join(', ')}`);
        return true;
      }

      logger.debug('No new patterns to learn from this PR');
      return false;
    } catch (error) {
      logger.error(`Failed to learn from PR: ${error.message}`);
      return false;
    }
  }

  async getContextForReview(repoFullName) {
    if (!knowledgeService.enabled) {
      return null;
    }

    try {
      const knowledge = await knowledgeService.getAllKnowledge(repoFullName);
      
      if (Object.keys(knowledge).length === 0) {
        logger.debug(`No existing knowledge for ${repoFullName}`);
        return null;
      }

      const context = knowledgeService.buildKnowledgeContext(knowledge);
      logger.info(`Loaded knowledge context for ${repoFullName}`);
      
      return context;
    } catch (error) {
      logger.error(`Failed to get context: ${error.message}`);
      return null;
    }
  }

  async getKnowledgeStats(repoFullName) {
    if (!knowledgeService.enabled) {
      return null;
    }

    return await knowledgeService.getRepoStats(repoFullName);
  }
}

module.exports = new LearningService();
