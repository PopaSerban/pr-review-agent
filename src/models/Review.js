class Review {
  constructor(prData, analysis) {
    this.prNumber = prData.number;
    this.repository = prData.repository || {};
    this.complexity = analysis.complexity;
    this.summary = this.generateSummary(prData, analysis);
    this.event = this.determineEvent(analysis);
  }

  generateSummary(prData, analysis) {
    const lines = [];
    
    lines.push(`## PR Review Summary`);
    lines.push('');
    lines.push(`**Complexity**: ${analysis.complexity}`);
    lines.push(`**Files Changed**: ${prData.stats.totalFiles}`);
    lines.push(`**Total Changes**: ${prData.stats.totalChanges} (+${prData.stats.totalAdditions}/-${prData.stats.totalDeletions})`);
    
    if (analysis.fileTypes.length > 0) {
      lines.push(`**File Types**: ${analysis.fileTypes.join(', ')}`);
    }
    
    lines.push('');
    lines.push('### Analysis');
    
    if (analysis.hasLargeFiles) {
      lines.push('- ⚠️ Contains files with significant changes (>500 lines)');
    }
    
    if (analysis.hasMultipleFiles) {
      lines.push('- 📁 Multiple files modified');
    }
    
    if (analysis.hasManyChanges) {
      lines.push('- 🔍 Large changeset - consider breaking into smaller PRs');
    }
    
    if (!analysis.hasLargeFiles && !analysis.hasManyChanges) {
      lines.push('- ✅ Reasonable size for review');
    }
    
    lines.push('');
    lines.push('---');
    lines.push('*Automated review by PR Review Agent*');
    
    return lines.join('\n');
  }

  determineEvent(analysis) {
    if (analysis.complexity === 'high') {
      return 'COMMENT';
    }
    return 'COMMENT';
  }

  toGitHubReview() {
    return {
      body: this.summary,
      event: this.event
    };
  }
}

module.exports = Review;
