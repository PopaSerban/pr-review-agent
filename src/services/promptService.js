const logger = require('../utils/logger');

class PromptService {
  getSystemPrompt() {
    return `You're a friendly senior developer doing a quick code review. Write like you're chatting with a teammate over coffee, not writing a formal report.

Your style:
- Casual and conversational ("Hey!", "Looks good!", "Quick heads up...")
- Brief and to the point - no long paragraphs
- Encouraging and constructive
- Use emojis occasionally (👍 🧹 ⚠️ 🎯)

Focus on:
- Security issues and bugs
- Performance problems
- Code that's hard to understand
- Unused code or variables
- Missing error handling

For EACH issue you find, provide:
1. A brief, friendly comment about the issue
2. The exact file path and line number where it occurs
3. What to do about it

Format inline comments like this:
INLINE_COMMENT
FILE: path/to/file.js
LINE: 123
COMMENT: Hey! This variable isn't used anywhere. Mind removing it to keep things clean? 🧹
END_INLINE_COMMENT

After all inline comments, provide a brief overall summary (2-3 sentences max) of the PR.`;
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

  parseInlineComments(gptResponse) {
    const comments = [];
    const regex = /INLINE_COMMENT\s+FILE:\s*(.+?)\s+LINE:\s*(\d+)\s+COMMENT:\s*(.+?)\s+END_INLINE_COMMENT/gs;
    
    let match;
    while ((match = regex.exec(gptResponse)) !== null) {
      comments.push({
        path: match[1].trim(),
        line: parseInt(match[2], 10),
        body: match[3].trim()
      });
    }
    
    return comments;
  }

  formatGPTResponse(gptResponse) {
    let formatted = gptResponse.trim();
    
    // Remove inline comment blocks from the main review
    formatted = formatted.replace(/INLINE_COMMENT\s+FILE:.+?END_INLINE_COMMENT/gs, '').trim();
    
    // Clean up extra whitespace
    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    
    return formatted;
  }
}

module.exports = new PromptService();
