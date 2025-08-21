class ProgressCalculator {
  constructor() {
    // Weight factors for different activities
    this.weights = {
      materialUpload: 10,
      quizCompletion: 15,
      flashcardReview: 5,
      studySession: 8,
      perfectQuizScore: 25,
      dailyStreak: 3,
      weeklyGoal: 20
    };
  }

  /**
   * Calculate overall learning progress for a user
   * @param {Object} userStats - User statistics object
   * @returns {Object} - Progress analysis
   */
  calculateOverallProgress(userStats) {
    const {
      totalMaterials = 0,
      completedMaterials = 0,
      avgQuizScore = 0,
      totalQuizAttempts = 0,
      totalFlashcards = 0,
      reviewedFlashcards = 0,
      studyStreak = 0,
      totalStudyTime = 0
    } = userStats;

    // Calculate component scores (0-100 scale)
    const materialProgress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;
    const quizProgress = Math.min(avgQuizScore, 100);
    const flashcardProgress = totalFlashcards > 0 ? (reviewedFlashcards / totalFlashcards) * 100 : 0;
    const engagementScore = this.calculateEngagementScore(totalQuizAttempts, totalStudyTime, studyStreak);

    // Weighted overall progress
    const overallProgress = (
      materialProgress * 0.25 +
      quizProgress * 0.35 +
      flashcardProgress * 0.25 +
      engagementScore * 0.15
    );

    return {
      overallProgress: Math.round(overallProgress),
      components: {
        materialProgress: Math.round(materialProgress),
        quizProgress: Math.round(quizProgress),
        flashcardProgress: Math.round(flashcardProgress),
        engagementScore: Math.round(engagementScore)
      },
      level: this.determineLevel(overallProgress),
      nextMilestone: this.getNextMilestone(overallProgress),
      recommendations: this.generateRecommendations(userStats)
    };
  }

  /**
   * Calculate engagement score based on activity metrics
   * @param {number} quizAttempts 
   * @param {number} studyTime 
   * @param {number} streak 
   * @returns {number} - Engagement score (0-100)
   */
  calculateEngagementScore(quizAttempts, studyTime, streak) {
    // Normalize metrics to 0-100 scale
    const quizScore = Math.min((quizAttempts / 20) * 100, 100); // 20 attempts = 100%
    const timeScore = Math.min((studyTime / 1200) * 100, 100); // 20 hours = 100%
    const streakScore = Math.min((streak / 30) * 100, 100); // 30 days = 100%

    return (quizScore * 0.4 + timeScore * 0.3 + streakScore * 0.3);
  }

  /**
   * Calculate subject-specific mastery level
   * @param {Array} subjectStats - Array of subject statistics
   * @returns {Object} - Subject mastery analysis
   */
  calculateSubjectMastery(subjectStats) {
    const masteryLevels = subjectStats.map(subject => {
      const {
        subject: subjectName,
        avgScore = 0,
        totalAttempts = 0,
        flashcardsMastered = 0,
        totalFlashcards = 0,
        studyTime = 0
      } = subject;

      // Calculate mastery components
      const performanceScore = avgScore;
      const practiceScore = Math.min((totalAttempts / 10) * 100, 100);
      const retentionScore = totalFlashcards > 0 ? (flashcardsMastered / totalFlashcards) * 100 : 0;
      const timeInvestment = Math.min((studyTime / 300) * 100, 100); // 5 hours = 100%

      const masteryScore = (
        performanceScore * 0.4 +
        practiceScore * 0.2 +
        retentionScore * 0.3 +
        timeInvestment * 0.1
      );

      return {
        subject: subjectName,
        masteryScore: Math.round(masteryScore),
        level: this.determineMasteryLevel(masteryScore),
        components: {
          performance: Math.round(performanceScore),
          practice: Math.round(practiceScore),
          retention: Math.round(retentionScore),
          timeInvestment: Math.round(timeInvestment)
        },
        recommendations: this.generateSubjectRecommendations(masteryScore, subject)
      };
    });

    return {
      subjects: masteryLevels.sort((a, b) => b.masteryScore - a.masteryScore),
      strongestSubject: masteryLevels.reduce((max, current) => 
        current.masteryScore > max.masteryScore ? current : max, masteryLevels[0]),
      weakestSubject: masteryLevels.reduce((min, current) => 
        current.masteryScore < min.masteryScore ? current : min, masteryLevels)
    };
  }

  /**
   * Calculate learning velocity (progress over time)
   * @param {Array} progressHistory - Historical progress data
   * @returns {Object} - Velocity analysis
   */
  calculateLearningVelocity(progressHistory) {
    if (progressHistory.length < 2) {
      return {
        velocity: 0,
        trend: 'insufficient_data',
        projectedProgress: 0,
        timeToGoal: null
      };
    }

    // Calculate progress change over time
    const sortedHistory = progressHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
    const recent = sortedHistory.slice(-7); // Last 7 data points
    
    if (recent.length < 2) {
      return {
        velocity: 0,
        trend: 'insufficient_data',
        projectedProgress: sortedHistory[sortedHistory.length - 1].progress,
        timeToGoal: null
      };
    }

    // Linear regression to find velocity
    const n = recent.length;
    const sumX = recent.reduce((sum, _, index) => sum + index, 0);
    const sumY = recent.reduce((sum, point) => sum + point.progress, 0);
    const sumXY = recent.reduce((sum, point, index) => sum + (index * point.progress), 0);
    const sumXX = recent.reduce((sum, _, index) => sum + (index * index), 0);

    const velocity = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - velocity * sumX) / n;

    // Determine trend
    let trend = 'stable';
    if (velocity > 1) trend = 'accelerating';
    else if (velocity > 0.1) trend = 'improving';
    else if (velocity < -0.1) trend = 'declining';

    // Project progress for next 30 days
    const projectedProgress = Math.min(100, Math.max(0, intercept + velocity * (n + 30)));

    // Calculate time to reach 90% mastery
    const currentProgress = recent[recent.length - 1].progress;
    const timeToGoal = velocity > 0 ? Math.ceil((90 - currentProgress) / velocity) : null;

    return {
      velocity: Math.round(velocity * 100) / 100,
      trend,
      projectedProgress: Math.round(projectedProgress),
      timeToGoal: timeToGoal > 0 && timeToGoal < 365 ? timeToGoal : null,
      confidence: this.calculateVelocityConfidence(recent)
    };
  }

  /**
   * Calculate study consistency score
   * @param {Array} studyDates - Array of study dates
   * @returns {Object} - Consistency analysis
   */
  calculateStudyConsistency(studyDates) {
    if (studyDates.length === 0) {
      return {
        consistencyScore: 0,
        averageGap: 0,
        longestGap: 0,
        currentStreak: 0,
        pattern: 'no_activity'
      };
    }

    const sortedDates = studyDates
      .map(date => new Date(date))
      .sort((a, b) => a - b);

    // Calculate gaps between study sessions
    const gaps = [];
    for (let i = 1; i < sortedDates.length; i++) {
      const gap = (sortedDates[i] - sortedDates[i - 1]) / (1000 * 60 * 60 * 24);
      gaps.push(gap);
    }

    const averageGap = gaps.length > 0 ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const longestGap = gaps.length > 0 ? Math.max(...gaps) : 0;

    // Calculate consistency score (lower gaps = higher consistency)
    let consistencyScore = 0;
    if (averageGap <= 1) consistencyScore = 100;
    else if (averageGap <= 2) consistencyScore = 80;
    else if (averageGap <= 3) consistencyScore = 60;
    else if (averageGap <= 7) consistencyScore = 40;
    else consistencyScore = 20;

    // Determine study pattern
    let pattern = 'irregular';
    if (averageGap <= 1.2) pattern = 'daily';
    else if (averageGap <= 2.5) pattern = 'frequent';
    else if (averageGap <= 7) pattern = 'weekly';

    // Calculate current streak
    const today = new Date();
    let currentStreak = 0;
    for (let i = sortedDates.length - 1; i >= 0; i--) {
      const daysDiff = (today - sortedDates[i]) / (1000 * 60 * 60 * 24);
      if (daysDiff <= currentStreak + 1.5) { // Allow some flexibility
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      consistencyScore: Math.round(consistencyScore),
      averageGap: Math.round(averageGap * 10) / 10,
      longestGap: Math.round(longestGap),
      currentStreak,
      pattern,
      totalStudyDays: studyDates.length
    };
  }

  // Helper methods
  determineLevel(progress) {
    if (progress >= 90) return 'Expert';
    if (progress >= 75) return 'Advanced';
    if (progress >= 50) return 'Intermediate';
    if (progress >= 25) return 'Beginner';
    return 'Starting';
  }

  determineMasteryLevel(score) {
    if (score >= 85) return 'Mastered';
    if (score >= 70) return 'Proficient';
    if (score >= 50) return 'Developing';
    if (score >= 30) return 'Learning';
    return 'Beginning';
  }

  getNextMilestone(progress) {
    const milestones = [25, 50, 75, 90, 95];
    return milestones.find(milestone => milestone > progress) || 100;
  }

  generateRecommendations(userStats) {
    const recommendations = [];
    
    if (userStats.avgQuizScore < 70) {
      recommendations.push('Focus on reviewing material before taking quizzes');
    }
    
    if (userStats.studyStreak < 3) {
      recommendations.push('Try to study consistently for better retention');
    }
    
    if (userStats.totalFlashcards === 0) {
      recommendations.push('Create flashcards to improve memory retention');
    }
    
    if (userStats.completedMaterials / userStats.totalMaterials < 0.5) {
      recommendations.push('Complete processing more of your uploaded materials');
    }

    return recommendations.slice(0, 3);
  }

  generateSubjectRecommendations(masteryScore, subjectStats) {
    const recommendations = [];
    
    if (masteryScore < 50) {
      recommendations.push('Dedicate more time to this subject');
      recommendations.push('Create additional flashcards for key concepts');
    }
    
    if (subjectStats.totalAttempts < 5) {
      recommendations.push('Practice more quizzes to improve understanding');
    }
    
    if (subjectStats.avgScore < 70) {
      recommendations.push('Review fundamentals before attempting advanced topics');
    }

    return recommendations.slice(0, 2);
  }

  calculateVelocityConfidence(dataPoints) {
    // Higher confidence with more consistent data points
    const variance = this.calculateVariance(dataPoints.map(p => p.progress));
    const confidence = Math.max(0, 100 - variance);
    return Math.round(confidence);
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }
}

module.exports = new ProgressCalculator();
