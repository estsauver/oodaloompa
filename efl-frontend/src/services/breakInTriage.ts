import type { BreakInContent } from '../types';

export interface BreakInTriageResult {
  recommendation: 'Now' | 'AtBreak' | 'Park';
  urgencyScore: number;
  impactScore: number;
  readinessScore: number;
  rationale: string;
}

export class BreakInTriageService {
  /**
   * Calculate triage recommendation based on urgency, impact, and readiness
   * Following the threshold logic from Milestone A.1 refinement
   */
  static calculateTriage(content: BreakInContent): BreakInTriageResult {
    // Calculate urgency score (0-1)
    const urgencyScore = this.calculateUrgencyScore(content);
    
    // Calculate impact score (0-1)
    const impactScore = this.calculateImpactScore(content);
    
    // Calculate readiness score (0-1)
    // For now, this is a heuristic until we have memory stack
    const readinessScore = this.calculateReadinessScore(content);
    
    // Apply threshold logic from refinement document
    const urgent = urgencyScore >= 0.8 && impactScore >= 0.6;
    
    let recommendation: 'Now' | 'AtBreak' | 'Park';
    let rationale: string;
    
    if (urgent && readinessScore >= 0.8) {
      recommendation = 'Now';
      rationale = `High urgency (${(urgencyScore * 100).toFixed(0)}%) and impact (${(impactScore * 100).toFixed(0)}%) with immediate readiness`;
    } else if (urgent && readinessScore < 0.8) {
      recommendation = 'AtBreak';
      rationale = `High urgency but needs context gathering (readiness: ${(readinessScore * 100).toFixed(0)}%)`;
    } else {
      recommendation = 'Park';
      rationale = `Lower priority (U: ${(urgencyScore * 100).toFixed(0)}%, I: ${(impactScore * 100).toFixed(0)}%). Default park for 1 hour`;
    }
    
    return {
      recommendation,
      urgencyScore,
      impactScore,
      readinessScore,
      rationale
    };
  }
  
  private static calculateUrgencyScore(content: BreakInContent): number {
    // Base score from urgency level
    let score = content.urgency === 'high' ? 0.9 : 
                content.urgency === 'medium' ? 0.5 : 0.2;
    
    // Adjust based on keywords in message
    const urgentKeywords = ['urgent', 'asap', 'critical', 'emergency', 'blocking', 'down', 'outage'];
    const message = content.message.toLowerCase();
    
    const hasUrgentKeywords = urgentKeywords.some(keyword => message.includes(keyword));
    if (hasUrgentKeywords) {
      score = Math.min(1.0, score + 0.2);
    }
    
    // Production alerts get max urgency
    if (content.source === 'PagerDuty' || message.includes('production')) {
      score = Math.max(0.9, score);
    }
    
    return score;
  }
  
  private static calculateImpactScore(content: BreakInContent): number {
    let score = 0.5; // Default medium impact
    
    const message = content.message.toLowerCase();
    
    // High impact indicators
    const highImpactIndicators = [
      'production',
      'customer',
      'revenue',
      'security',
      'data loss',
      'compliance',
      'release',
      'deployment',
      'all users',
      'system wide'
    ];
    
    // Low impact indicators
    const lowImpactIndicators = [
      'test',
      'dev',
      'minor',
      'typo',
      'documentation',
      'comment'
    ];
    
    if (highImpactIndicators.some(indicator => message.includes(indicator))) {
      score = 0.8;
    } else if (lowImpactIndicators.some(indicator => message.includes(indicator))) {
      score = 0.3;
    }
    
    // Source-based adjustments
    if (content.source === 'PagerDuty') {
      score = Math.max(0.9, score);
    } else if (content.source === 'Email') {
      score = Math.min(0.6, score);
    }
    
    // Sender-based adjustments (would need more context in real implementation)
    if (content.sender.includes('ceo') || content.sender.includes('cto') || content.sender.includes('manager')) {
      score = Math.max(0.7, score);
    }
    
    return score;
  }
  
  private static calculateReadinessScore(content: BreakInContent): number {
    // This is a placeholder until we have memory stack
    // In real implementation, would check:
    // - Do we have context about this issue in memory?
    // - Have we dealt with similar issues before?
    // - Do we have the necessary tools/access ready?
    
    const message = content.message.toLowerCase();
    
    // Things we can answer immediately
    const immediatelyAnswerable = [
      'status',
      'eta',
      'update',
      'quick question',
      'yes or no',
      'confirm'
    ];
    
    // Things that need investigation
    const needsInvestigation = [
      'investigate',
      'debug',
      'analyze',
      'root cause',
      'why',
      'how did'
    ];
    
    if (immediatelyAnswerable.some(term => message.includes(term))) {
      return 0.9;
    } else if (needsInvestigation.some(term => message.includes(term))) {
      return 0.3;
    }
    
    // Default: moderate readiness
    return 0.6;
  }
  
  /**
   * Get keyboard shortcuts for triage options
   */
  static getKeyboardShortcuts(): Record<string, string> {
    return {
      'n': 'Now',
      'b': 'At Break',
      'p': 'Park',
      's': 'Skip'
    };
  }
}
