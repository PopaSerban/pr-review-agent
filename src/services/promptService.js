const logger = require('../utils/logger');

class PromptService {
  getSystemPrompt() {
    return `You are a senior software engineer conducting a thorough code review. Your reviews are:
- Constructive and helpful, not just critical
- Focused on important issues, not nitpicks
- Clear and actionable with specific suggestions
- Professional but friendly in tone

Focus on:
- Security vulnerabilities and potential bugs
- Performance issues and optimization opportunities
- Code maintainability and readability
- Best practices for the language/framework
- Potential edge cases or error handling gaps

Provide:
- An overall assessment of the changes
- Specific feedback on problematic areas
- Praise for good practices
- Concrete suggestions for improvement

Keep your review concise but thorough. Prioritize issues by severity.`;
  }

  buildReviewPrompt(prData, analysis) {
    const sections = [];

    sections.push('# Pull Request Review');
    sections.push('');
    sections.push('## PR Information');
    sections.push(`**Title**: ${prData.title}`);
    sections.push(`**Author**: ${prData.author}`);
    
    if (prData.body && prData.body.trim()) {
      sections.push(`**Description**: ${prData.body.substring(0, 500)}`);
    }
    
    sections.push('');
    sections.push('## Changes Summary');
    sections.push(`- **Files Changed**: ${prData.stats.totalFiles}`);
    sections.push(`- **Lines Added**: ${prData.stats.totalAdditions}`);
    sections.push(`- **Lines Deleted**: ${prData.stats.totalDeletions}`);
    sections.push(`- **Complexity**: ${analysis.complexity}`);
    sections.push(`- **File Types**: ${analysis.fileTypes.join(', ')}`);
    
    sections.push('');
    sections.push('## Files Modified');
    
    prData.files.slice(0, 10).forEach(file => {
      sections.push(`- \`${file.filename}\` (${file.status}): +${file.additions}/-${file.deletions}`);
    });
    
    if (prData.files.length > 10) {
      sections.push(`... and ${prData.files.length - 10} more files`);
    }
    
    sections.push('');
    sections.push('## Code Changes');
    sections.push('');
    
    const relevantFiles = this.selectRelevantFiles(prData.files, 3);
    
    relevantFiles.forEach(file => {
      sections.push(`### ${file.filename}`);
      sections.push('```diff');
      
      if (file.patch) {
        const truncatedPatch = file.patch.substring(0, 2000);
        sections.push(truncatedPatch);
        
        if (file.patch.length > 2000) {
          sections.push('... [truncated]');
        }
      } else {
        sections.push('Binary file or no patch available');
      }
      
      sections.push('```');
      sections.push('');
    });
    
    sections.push('');
    sections.push('Please provide a comprehensive code review focusing on the most important aspects of these changes.');
    
    return sections.join('\n');
  }

  selectRelevantFiles(files, maxFiles) {
    const sorted = [...files].sort((a, b) => {
      const scoreA = this.calculateFileRelevance(a);
      const scoreB = this.calculateFileRelevance(b);
      return scoreB - scoreA;
    });
    
    return sorted.slice(0, maxFiles);
  }

  calculateFileRelevance(file) {
    let score = 0;
    
    score += file.changes;
    
    if (file.status === 'added') score += 50;
    if (file.status === 'removed') score += 30;
    if (file.status === 'modified') score += 20;
    
    const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'go', 'rb', 'php', 'cs', 'cpp', 'c'];
    const ext = file.filename.split('.').pop();
    if (codeExtensions.includes(ext)) {
      score += 100;
    }
    
    if (file.filename.includes('test') || file.filename.includes('spec')) {
      score -= 50;
    }
    
    return score;
  }

  buildMessages(prData, analysis, knowledgeContext = null) {
    const systemPrompt = this.getSystemPrompt();
    let userPrompt = this.buildReviewPrompt(prData, analysis);
    
    if (knowledgeContext) {
      userPrompt = `${knowledgeContext}\n\n---\n\n${userPrompt}`;
      logger.debug('Added knowledge context to prompt');
    }
    
    logger.debug('Built prompt messages for GPT');
    
    return [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];
  }

  formatGPTResponse(gptResponse) {
    let formatted = gptResponse.trim();
    
    if (!formatted.startsWith('#')) {
      formatted = '## AI Code Review\n\n' + formatted;
    }
    
    return formatted;
  }
}

module.exports = new PromptService();
