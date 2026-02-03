const logger = require('../utils/logger');

class PatternExtractor {
  extractArchitecturePatterns(prData) {
    const patterns = [];

    const directories = new Set();
    prData.files.forEach(file => {
      const dir = file.filename.split('/').slice(0, -1).join('/');
      if (dir) directories.add(dir);
    });

    if (directories.size > 0) {
      patterns.push(`Directory structure: ${Array.from(directories).slice(0, 5).join(', ')}`);
    }

    const hasTests = prData.files.some(f => 
      f.filename.includes('test') || f.filename.includes('spec')
    );
    if (hasTests) {
      patterns.push('Tests are included with code changes');
    }

    const hasDocs = prData.files.some(f => 
      f.filename.toLowerCase().includes('readme') || 
      f.filename.toLowerCase().includes('.md')
    );
    if (hasDocs) {
      patterns.push('Documentation is updated alongside code');
    }

    return patterns.length > 0 ? patterns.join('\n- ') : null;
  }

  extractConventions(prData) {
    const conventions = [];

    const namingPatterns = this.analyzeNaming(prData.files);
    if (namingPatterns.length > 0) {
      conventions.push(...namingPatterns);
    }

    const fileOrganization = this.analyzeFileOrganization(prData.files);
    if (fileOrganization) {
      conventions.push(fileOrganization);
    }

    return conventions.length > 0 ? conventions.join('\n- ') : null;
  }

  analyzeNaming(files) {
    const patterns = [];
    
    const hasCamelCase = files.some(f => /[a-z][A-Z]/.test(f.filename));
    const hasKebabCase = files.some(f => /[a-z]-[a-z]/.test(f.filename));
    const hasSnakeCase = files.some(f => /[a-z]_[a-z]/.test(f.filename));

    if (hasCamelCase) patterns.push('camelCase naming used');
    if (hasKebabCase) patterns.push('kebab-case naming used');
    if (hasSnakeCase) patterns.push('snake_case naming used');

    return patterns;
  }

  analyzeFileOrganization(files) {
    const extensions = files.map(f => f.filename.split('.').pop()).filter(Boolean);
    const uniqueExtensions = [...new Set(extensions)];

    if (uniqueExtensions.length > 0) {
      return `File types: ${uniqueExtensions.slice(0, 5).join(', ')}`;
    }

    return null;
  }

  extractDomainKnowledge(prData) {
    const domain = [];

    if (prData.title) {
      const keywords = this.extractKeywords(prData.title);
      if (keywords.length > 0) {
        domain.push(`Feature area: ${keywords.join(', ')}`);
      }
    }

    if (prData.body) {
      const bodyKeywords = this.extractKeywords(prData.body);
      if (bodyKeywords.length > 0) {
        domain.push(`Related concepts: ${bodyKeywords.slice(0, 5).join(', ')}`);
      }
    }

    const modifiedAreas = prData.files
      .map(f => f.filename.split('/')[0])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    if (modifiedAreas.length > 0) {
      domain.push(`Modified areas: ${modifiedAreas.join(', ')}`);
    }

    return domain.length > 0 ? domain.join('\n- ') : null;
  }

  extractKeywords(text) {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'add', 'fix', 'update', 'remove', 'delete', 'change', 'modify', 'improve']);

    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !commonWords.has(w));

    const frequency = {};
    words.forEach(w => {
      frequency[w] = (frequency[w] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  extractCodePatterns(prData) {
    const patterns = [];

    const hasAsync = prData.files.some(f => 
      f.patch && (f.patch.includes('async ') || f.patch.includes('await '))
    );
    if (hasAsync) {
      patterns.push('Uses async/await for asynchronous operations');
    }

    const hasErrorHandling = prData.files.some(f => 
      f.patch && (f.patch.includes('try {') || f.patch.includes('catch'))
    );
    if (hasErrorHandling) {
      patterns.push('Includes error handling with try/catch');
    }

    const hasTypeScript = prData.files.some(f => 
      f.filename.endsWith('.ts') || f.filename.endsWith('.tsx')
    );
    if (hasTypeScript) {
      patterns.push('TypeScript is used for type safety');
    }

    const hasJSDoc = prData.files.some(f => 
      f.patch && f.patch.includes('/**')
    );
    if (hasJSDoc) {
      patterns.push('JSDoc comments are used for documentation');
    }

    return patterns.length > 0 ? patterns.join('\n- ') : null;
  }

  extractAll(prData, analysis) {
    logger.debug(`Extracting patterns from PR #${prData.number}`);

    const extracted = {
      architecture: this.extractArchitecturePatterns(prData),
      conventions: this.extractConventions(prData),
      domain: this.extractDomainKnowledge(prData),
      patterns: this.extractCodePatterns(prData),
      metadata: {
        prNumber: prData.number,
        complexity: analysis.complexity,
        fileCount: prData.stats.totalFiles,
        changeCount: prData.stats.totalChanges
      }
    };

    const hasContent = Object.values(extracted)
      .filter(v => v !== null && typeof v === 'string')
      .length > 0;

    if (hasContent) {
      logger.info(`Extracted patterns from PR #${prData.number}`);
    }

    return extracted;
  }
}

module.exports = new PatternExtractor();
