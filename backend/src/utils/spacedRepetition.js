class SpacedRepetitionAlgorithm {
  constructor() {
    // Default parameters for SM-2 algorithm
    this.defaultEaseFactor = 2.5;
    this.minEaseFactor = 1.3;
    this.easeFactorModifier = 0.1;
    this.difficultyFactorModifier = 0.08;
    this.difficultyWeightModifier = 0.02;
  }

  /**
   * Calculate next review date using SM-2 algorithm
   * @param {number} quality - Quality of response (0-5)
   * @param {number} repetitionCount - Number of times reviewed
   * @param {number} easeFactor - Current ease factor
   * @param {number} interval - Current interval in days
   * @returns {Object} - {nextReviewDate, newEaseFactor, newInterval}
   */
  calculateNextReview(quality, repetitionCount, easeFactor = this.defaultEaseFactor, interval = 1) {
    // Ensure quality is within valid range
    quality = Math.max(0, Math.min(5, quality));
    
    let newEaseFactor = easeFactor;
    let newInterval = interval;
    
    // Update ease factor based on quality
    newEaseFactor = easeFactor + (
      this.easeFactorModifier - 
      (5 - quality) * (this.difficultyFactorModifier + (5 - quality) * this.difficultyWeightModifier)
    );
    
    // Ensure ease factor doesn't go below minimum
    newEaseFactor = Math.max(this.minEaseFactor, newEaseFactor);
    
    // Calculate new interval
    if (quality < 3) {
      // If response quality is poor, reset interval to 1 day
      newInterval = 1;
    } else {
      if (repetitionCount === 0) {
        newInterval = 1;
      } else if (repetitionCount === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(interval * newEaseFactor);
      }
    }
    
    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
    
    return {
      nextReviewDate: nextReviewDate.toISOString().split('T')[0],
      newEaseFactor: Math.round(newEaseFactor * 100) / 100, // Round to 2 decimal places
      newInterval: newInterval,
      newRepetitionCount: repetitionCount + 1
    };
  }

  /**
   * Get difficulty level based on ease factor
   * @param {number} easeFactor 
   * @returns {string} - difficulty level
   */
  getDifficultyLevel(easeFactor) {
    if (easeFactor >= 2.8) return 'easy';
    if (easeFactor >= 2.5) return 'medium';
    if (easeFactor >= 2.0) return 'hard';
    if (easeFactor >= 1.5) return 'very_hard';
    return 'extremely_hard';
  }

  /**
   * Get recommended study frequency based on performance
   * @param {number} easeFactor 
   * @param {number} repetitionCount 
   * @returns {string} - study frequency recommendation
   */
  getStudyFrequencyRecommendation(easeFactor, repetitionCount) {
    if (repetitionCount < 3) {
      return 'Review daily until familiar';
    }
    
    if (easeFactor < 2.0) {
      return 'Focus more time on this topic';
    }
    
    if (easeFactor >= 2.8) {
      return 'Well mastered - review occasionally';
    }
    
    return 'Regular review recommended';
  }

  /**
   * Calculate optimal batch size for study session
   * @param {Array} flashcards - Array of flashcards with due dates
   * @param {number} targetStudyTime - Target study time in minutes
   * @returns {Object} - {recommendedCards, estimatedTime}
   */
  calculateOptimalBatchSize(flashcards, targetStudyTime = 20) {
    // Sort by priority (overdue cards first, then by ease factor)
    const sortedCards = flashcards.sort((a, b) => {
      const aDue = new Date(a.next_review) <= new Date() ? 1 : 0;
      const bDue = new Date(b.next_review) <= new Date() ? 1 : 0;
      
      if (aDue !== bDue) return bDue - aDue; // Due cards first
      
      return a.ease_factor - b.ease_factor; // Harder cards first
    });
    
    // Estimate time per card based on difficulty
    const estimatedTimePerCard = (easeFactor) => {
      if (easeFactor < 2.0) return 2.5; // minutes
      if (easeFactor < 2.5) return 1.5;
      return 1.0;
    };
    
    let totalTime = 0;
    let cardCount = 0;
    
    for (const card of sortedCards) {
      const cardTime = estimatedTimePerCard(card.ease_factor);
      if (totalTime + cardTime <= targetStudyTime) {
        totalTime += cardTime;
        cardCount++;
      } else {
        break;
      }
    }
    
    return {
      recommendedCards: sortedCards.slice(0, cardCount),
      estimatedTime: Math.round(totalTime),
      totalDueCards: sortedCards.filter(card => new Date(card.next_review) <= new Date()).length
    };
  }

  /**
   * Generate study schedule for a set of flashcards
   * @param {Array} flashcards 
   * @param {number} daysAhead - Number of days to schedule ahead
   * @returns {Object} - Schedule by date
   */
  generateStudySchedule(flashcards, daysAhead = 7) {
    const schedule = {};
    const today = new Date();
    
    // Initialize schedule for next 'daysAhead' days
    for (let i = 0; i < daysAhead; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      schedule[dateStr] = [];
    }
    
    // Assign flashcards to dates
    flashcards.forEach(card => {
      const reviewDate = card.next_review;
      if (schedule[reviewDate]) {
        schedule[reviewDate].push(card);
      }
    });
    
    return schedule;
  }

  /**
   * Get performance analytics for spaced repetition
   * @param {Array} reviewHistory - Array of review records
   * @returns {Object} - Performance analytics
   */
  getPerformanceAnalytics(reviewHistory) {
    if (reviewHistory.length === 0) {
      return {
        averageQuality: 0,
        improvementTrend: 'insufficient_data',
        masteryLevel: 'beginner',
        consistencyScore: 0
      };
    }
    
    const recentReviews = reviewHistory.slice(-10); // Last 10 reviews
    const averageQuality = recentReviews.reduce((sum, review) => sum + review.quality, 0) / recentReviews.length;
    
    // Calculate improvement trend
    const firstHalf = recentReviews.slice(0, Math.floor(recentReviews.length / 2));
    const secondHalf = recentReviews.slice(Math.floor(recentReviews.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.quality, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.quality, 0) / secondHalf.length;
    
    let improvementTrend = 'stable';
    if (secondHalfAvg > firstHalfAvg + 0.5) improvementTrend = 'improving';
    if (secondHalfAvg < firstHalfAvg - 0.5) improvementTrend = 'declining';
    
    // Determine mastery level
    let masteryLevel = 'beginner';
    if (averageQuality >= 4.5) masteryLevel = 'expert';
    else if (averageQuality >= 3.5) masteryLevel = 'advanced';
    else if (averageQuality >= 2.5) masteryLevel = 'intermediate';
    
    // Calculate consistency score (how regular are the reviews)
    const daysBetweenReviews = [];
    for (let i = 1; i < reviewHistory.length; i++) {
      const prevDate = new Date(reviewHistory[i - 1].date);
      const currDate = new Date(reviewHistory[i].date);
      const daysDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
      daysBetweenReviews.push(daysDiff);
    }
    
    const avgDaysBetween = daysBetweenReviews.reduce((sum, days) => sum + days, 0) / daysBetweenReviews.length;
    const consistency = daysBetweenReviews.length > 0 ? Math.max(0, 100 - (avgDaysBetween - 1) * 10) : 0;
    
    return {
      averageQuality: Math.round(averageQuality * 100) / 100,
      improvementTrend,
      masteryLevel,
      consistencyScore: Math.round(consistency),
      totalReviews: reviewHistory.length,
      averageDaysBetweenReviews: Math.round(avgDaysBetween * 10) / 10
    };
  }
}

module.exports = new SpacedRepetitionAlgorithm();
