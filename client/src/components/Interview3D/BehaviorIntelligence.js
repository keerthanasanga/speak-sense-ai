/**
 * BehaviorIntelligence.js
 * Maps interview metrics to character behaviors and emotional responses
 */

export class BehaviorIntelligence {
  constructor(characters, animationController) {
    this.characters = characters;
    this.animationController = animationController;
    this.state = {
      lastMetrics: null,
      metricsHistory: [],
      emotionalStates: {},
      gestureCooldowns: {}
    };

    // Initialize emotional states for each character
    characters.forEach(char => {
      this.state.emotionalStates[char.userData.name] = {
        confidence: 0.5,
        engagement: 0.5,
        analysis: 0.3,
        impression: 0.5
      };
    });
  }

  update(_deltaTime, metrics) {
    if (!metrics) return;

    // Store metrics history (keep last 10 frames)
    this.state.metricsHistory.push({
      timestamp: Date.now(),
      metrics
    });
    if (this.state.metricsHistory.length > 10) {
      this.state.metricsHistory.shift();
    }

    // Analyze current state
    this.analyzeUserPerformance(metrics);

    // Update character behaviors
    this.updateCharacterBehaviors(metrics);

    // Trigger appropriate gestures
    this.triggerContextualGestures(metrics);
  }

  analyzeUserPerformance(metrics) {
    const { confidence = 0.5, speaking = false, thinking = false, metrics: speechMetrics } = metrics;

    // Confidence analysis
    const confidenceLevel = Math.min(confidence, 1);
    const isStrongAnswer = confidenceLevel > 0.75;
    const isWeakAnswer = confidenceLevel < 0.4;

    // Speech analysis
    const hasLongPause = speechMetrics?.pauseCount > 3;
    const hasManyFillers = speechMetrics?.fillerCount > 5;
    const goodSpeechClarity = speechMetrics?.clarity > 75;

    this.state.currentAnalysis = {
      isStrongAnswer,
      isWeakAnswer,
      hasLongPause,
      hasManyFillers,
      goodSpeechClarity,
      confidenceLevel,
      speaking,
      thinking
    };
  }

  updateCharacterBehaviors(_metrics) {
    const analysis = this.state.currentAnalysis;

    this.characters.forEach((character) => {
      const role = character.userData.role;
      const emotionalState = this.state.emotionalStates[character.userData.name];

      // Update emotional intensity based on analysis
      if (analysis.isStrongAnswer) {
        emotionalState.impression = Math.min(emotionalState.impression + 0.1, 1);
        emotionalState.confidence = Math.min(emotionalState.confidence + 0.05, 1);
      } else if (analysis.isWeakAnswer) {
        emotionalState.analysis = Math.min(emotionalState.analysis + 0.15, 1);
        emotionalState.impression = Math.max(emotionalState.impression - 0.1, 0);
      }

      // Role-specific behaviors
      switch (role) {
        case 'technical':
          this.updateTechnicalInterviewerBehavior(character, analysis, emotionalState);
          break;
        case 'hr':
          this.updateHRManagerBehavior(character, analysis, emotionalState);
          break;
        case 'behavioral':
          this.updateBehavioralCoachBehavior(character, analysis, emotionalState);
          break;
        case 'moderator':
          this.updateModeratorBehavior(character, analysis, emotionalState);
          break;
      }

      // Apply emotion to expression
      const dominantEmotion = this.getDominantEmotion(emotionalState);
      this.animationController.mapEmotionToExpression(
        character,
        dominantEmotion,
        Math.max(...Object.values(emotionalState)) * 0.8
      );
    });
  }

  updateTechnicalInterviewerBehavior(character, analysis, emotionalState) {
    if (analysis.isStrongAnswer) {
      emotionalState.impression = 0.8;
      emotionalState.engagement = 0.7;
      this.animationController.performGesture(character, 'nod');
    } else if (analysis.isWeakAnswer) {
      emotionalState.analysis = 0.9;
      emotionalState.impression = 0.3;
      this.animationController.performGesture(character, 'noteWriting');
    } else if (analysis.hasLongPause) {
      emotionalState.analysis = 0.7;
      this.animationController.performGesture(character, 'headTilt');
    }

    // Update eye contact intensity
    emotionalState.engagement = Math.max(
      emotionalState.engagement - 0.02,
      analysis.speaking ? 0.6 : 0.4
    );
  }

  updateHRManagerBehavior(character, analysis, emotionalState) {
    if (analysis.isStrongAnswer) {
      emotionalState.impression = 0.9;
      emotionalState.engagement = 0.8;
    } else if (analysis.hasLongPause) {
      emotionalState.engagement = 0.6;
      this.animationController.performGesture(character, 'headTilt');
    }

    // HR is generally more engaged and warm
    emotionalState.engagement = Math.min(emotionalState.engagement + 0.01, 0.9);

    // Nod occasionally to show empathy
    if (Math.random() < 0.1) {
      this.animationController.performGesture(character, 'nod');
    }
  }

  updateBehavioralCoachBehavior(character, analysis, emotionalState) {
    if (analysis.goodSpeechClarity) {
      emotionalState.impression = 0.85;
      emotionalState.engagement = 0.8;
    }

    if (analysis.hasManyFillers) {
      emotionalState.analysis = 0.6;
    }

    // Behavioral coach watches carefully
    emotionalState.engagement = Math.max(emotionalState.engagement - 0.01, 0.5);

    // Encouraging nods
    if (analysis.speaking && Math.random() < 0.05) {
      this.animationController.performGesture(character, 'nod');
    }
  }

  updateModeratorBehavior(character, analysis, emotionalState) {
    // Moderator stays neutral but responsive
    emotionalState.impression = 0.5;
    emotionalState.analysis = 0.5;
    emotionalState.engagement = 0.5;

    // Subtle reactions to strong answers
    if (analysis.isStrongAnswer && Math.random() < 0.05) {
      this.animationController.performGesture(character, 'nod');
    }
  }

  triggerContextualGestures(_metrics) {
    const analysis = this.state.currentAnalysis;

    // Technical interviewer takes notes on weak answers
    if (analysis.isWeakAnswer) {
      const techInterviewer = this.characters.find(c => c.userData.role === 'technical');
      if (techInterviewer && !this.isOnCooldown(techInterviewer.userData.name, 'noteWriting')) {
        this.animationController.performGesture(techInterviewer, 'noteWriting');
        this.setCooldown(techInterviewer.userData.name, 'noteWriting', 3);
      }
    }

    // All interviewers respond to long pauses
    if (analysis.hasLongPause) {
      this.characters.forEach(char => {
        if (char.userData.role !== 'moderator' &&
          !this.isOnCooldown(char.userData.name, 'headTilt')) {
          this.animationController.performGesture(char, 'headTilt');
          this.setCooldown(char.userData.name, 'headTilt', 2);
        }
      });
    }

    // Update procedural eye contact
    this.characters.forEach(char => {
      this.animationController.updateEyeContact(char, { x: 0, y: 1.5, z: 3 });
    });
  }

  getDominantEmotion(emotionalState) {
    const emotions = {
      confidence: emotionalState.confidence,
      analytical: emotionalState.analysis,
      engaged: emotionalState.engagement,
      impressed: emotionalState.impression,
      concerned: Math.max(0, 1 - emotionalState.impression - emotionalState.engagement)
    };

    return Object.entries(emotions).reduce((max, [emotion, value]) =>
      value > emotions[max] ? emotion : max
    );
  }

  isOnCooldown(characterName, gestureName) {
    const key = `${characterName}-${gestureName}`;
    const cooldownTime = this.state.gestureCooldowns[key];
    return cooldownTime && Date.now() < cooldownTime;
  }

  setCooldown(characterName, gestureName, seconds) {
    const key = `${characterName}-${gestureName}`;
    this.state.gestureCooldowns[key] = Date.now() + (seconds * 1000);
  }

  // ==================== ADVANCED BEHAVIOR TRIGGERS ====================

  triggerFollowUpQuestion(character) {
    this.animationController.performGesture(character, 'handGesture');

    // Update emotion to suggest questioning
    const emotionalState = this.state.emotionalStates[character.userData.name];
    emotionalState.analysis = 0.8;
  }

  triggerImpressionResponse(character, intensity = 'positive') {
    if (intensity === 'positive') {
      this.animationController.performGesture(character, 'nod');
      const emotionalState = this.state.emotionalStates[character.userData.name];
      emotionalState.impression = 0.9;
    } else {
      const emotionalState = this.state.emotionalStates[character.userData.name];
      emotionalState.impression = 0.3;
    }
  }

  // ==================== PANEL MODE SPECIFIC ====================

  switchInterviewerFocus(fromIndex, toIndex) {
    // Fade out emotion on previous interviewer
    const fromChar = this.characters[fromIndex];
    const fromEmotion = this.state.emotionalStates[fromChar.userData.name];
    Object.keys(fromEmotion).forEach(key => {
      fromEmotion[key] *= 0.5;
    });

    // Highlight new interviewer
    const toChar = this.characters[toIndex];
    const toEmotion = this.state.emotionalStates[toChar.userData.name];
    toEmotion.engagement = 0.9;
  }

  // ==================== CLEANUP ====================

  dispose() {
    if (this.animationController?.dispose) {
      this.animationController.dispose();
    }
    this.characters = null;
    this.animationController = null;
    this.state = null;
  }
}
