class Review {
  constructor(prData, analysis, aiReview = null, inlineComments = []) {
    this.prNumber = prData.number;
    this.repository = prData.repository || {};
    this.complexity = analysis.complexity;
    this.aiReview = aiReview;
    this.inlineComments = inlineComments;
    this.summary = this.generateSummary(prData, analysis, aiReview);
    this.event = this.determineEvent(analysis);
  }

  generateSummary(prData, analysis, aiReview) {
    const lines = [];
    
    if (aiReview) {
      lines.push(aiReview);
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
    lines.push(`📊 **Quick Stats**: ${prData.stats.totalFiles} file${prData.stats.totalFiles > 1 ? 's' : ''}, ${prData.stats.totalChanges} change${prData.stats.totalChanges > 1 ? 's' : ''} (+${prData.stats.totalAdditions}/-${prData.stats.totalDeletions}) • Complexity: ${analysis.complexity}`);
    lines.push('');
    lines.push('*🤖 Automated review by PR Review Agent*');
    
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
