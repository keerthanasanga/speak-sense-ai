const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// All interview routes are protected
router.use(protect);

// Get questions for interview
router.get("/questions", async (req, res) => {
  try {
    const { role, type, count } = req.query;
    
    // Forward to main app handler
    req.app.emit('get-questions', { role, type, count }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create interview session
router.post("/session/create", async (req, res) => {
  try {
    const { jobRole, avatarId, avatarName } = req.body;
    const userId = req.user.id;
    
    // Forward to main app handler
    req.app.emit('create-session', { userId, jobRole, avatarId, avatarName }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Submit answer
router.post("/submit-answer", async (req, res) => {
  try {
    // File upload is handled by multer in main app
    req.app.emit('submit-answer', req, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate feedback
router.post("/generate-feedback", async (req, res) => {
  try {
    const { sessionId } = req.body;
    req.app.emit('generate-feedback', { sessionId }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get session details
router.get("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    req.app.emit('get-session', { sessionId }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's interview history
router.get("/history", async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, page } = req.query;
    req.app.emit('get-history', { userId, limit, page }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete session
router.delete("/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    req.app.emit('delete-session', { sessionId }, res);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();

// ---- Grammar Analysis Helpers ---- //
const grammarPatterns = [
    { pattern: /\b(i)\b/g, fix: 'I', rule: 'Always capitalize "I"' },
    { pattern: /\b(gonna|wanna|gotta)\b/gi, fix: (m) => ({ gonna: 'going to', wanna: 'want to', gotta: 'got to' }[m.toLowerCase()]), rule: 'Avoid informal contractions in interviews' },
    { pattern: /\b(Me and )([A-Z])/g, fix: '$2 and I', rule: '"Me and ..." should be "[Name] and I"' },
    { pattern: /\b(there was )([a-z]+ (?:of|who) (?:was|were|had))/gi, fix: null, rule: 'Consider subject-verb agreement' },
    { pattern: /\b(alot)\b/gi, fix: 'a lot', rule: '"alot" is not a word — use "a lot"' },
    { pattern: /\b(your)\b/gi, fix: null, rule: 'Check "your" vs "you\'re" usage' },
    { pattern: /\b(uh|um|er|ah|like,)\b/gi, fix: null, rule: 'Reduce filler words (uh, um, like)' },
    { pattern: /\b(very very|really really)\b/gi, fix: null, rule: 'Avoid repetitive intensifiers' },
    { pattern: /\.{3,}/g, fix: '...', rule: 'Excessive ellipsis — use complete sentences' },
];

const improvementTopicMap = [
    { keywords: ['react', 'component', 'hooks', 'jsx', 'frontend'], topics: ['React Advanced Patterns', 'Component Design', 'Custom Hooks'] },
    { keywords: ['node', 'express', 'backend', 'rest', 'api', 'server'], topics: ['REST API Design', 'Node.js Best Practices', 'Database Integration'] },
    { keywords: ['database', 'sql', 'mongodb', 'schema', 'query'], topics: ['SQL Fundamentals', 'Database Normalization', 'Query Optimization'] },
    { keywords: ['algorithm', 'sort', 'search', 'complexity', 'big o'], topics: ['Time Complexity', 'Sorting Algorithms', 'Data Structures'] },
    { keywords: ['team', 'conflict', 'collaboration', 'manage', 'leadership'], topics: ['Team Communication', 'Conflict Resolution', 'Leadership Skills'] },
    { keywords: ['design', 'pattern', 'architecture', 'system', 'scalable'], topics: ['System Design', 'Design Patterns', 'Scalability Concepts'] },
];

const communicationTips = [
    'Use the STAR method (Situation, Task, Action, Result) for behavioral answers',
    'Quantify your achievements with numbers and percentages',
    'Vary your sentence length for natural speech rhythm',
    'Use transition words ("Furthermore", "As a result", "Building on that")',
    'Maintain a confident tone — avoid phrases like "I think maybe" or "I guess"',
    'Be concise: aim for 1–2 minute answers per question',
];

function analyzeGrammar(text) {
    if (!text || text.trim().length < 5) return [];
    const issues = [];
    const seen = new Set();

    grammarPatterns.forEach(({ pattern, rule }) => {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
            const key = rule + match.index;
            if (!seen.has(key)) {
                seen.add(key);
                issues.push({
                    word: match[0],
                    rule,
                    position: match.index,
                    context: text.slice(Math.max(0, match.index - 15), match.index + match[0].length + 15)
                });
            }
            if (!regex.global) break;
        }
    });
    return issues.slice(0, 6);
}

function detectTopics(text) {
    const lower = text.toLowerCase();
    const suggestions = new Set();
    improvementTopicMap.forEach(({ keywords, topics }) => {
        if (keywords.some(k => lower.includes(k))) {
            topics.forEach(t => suggestions.add(t));
        }
    });
    // Generic communication
    if (suggestions.size === 0) {
        suggestions.add('Interview Communication Skills');
        suggestions.add('Professional Vocabulary');
    }
    return [...suggestions].slice(0, 4);
}

function detectImprovements(text) {
    const points = [];
    const wordCount = text.trim().split(/\s+/).length;
    const fillerCount = (text.match(/\b(uh|um|er|ah|like,|you know)\b/gi) || []).length;
    const fillerRatio = fillerCount / wordCount;

    if (wordCount < 30) points.push('Your answer was quite short — aim for at least 3–4 sentences.');
    if (wordCount > 250) points.push('Your answer was very long — practice being more concise.');
    if (fillerRatio > 0.05) points.push(`High filler word usage (${fillerCount} detected) — practice pausing instead.`);
    if (!/[?!.]/.test(text)) points.push('Use proper punctuation to structure ideas clearly.');
    if (!/\d/.test(text)) points.push('Consider adding specific numbers or metrics to strengthen credibility.');
    if (!/because|since|therefore|result|achieved|improved/i.test(text)) points.push('Include outcome statements: what did you achieve or improve?');
    const tip = communicationTips[Math.floor(Math.random() * communicationTips.length)];
    points.push(`💡 Tip: ${tip}`);
    return points.slice(0, 5);
}

const mockQuestions = {
    frontend: [
        "How does React's virtual DOM work?",
        "Explain the difference between props and state.",
        "What are React Hooks? Can you name a few?",
        "How do you handle state management in large React applications?"
    ],
    backend: [
        "What is the event loop in Node.js?",
        "How does Express handle middleware?",
        "Explain the difference between SQL and NoSQL databases.",
        "What are RESTful APIs and their principles?"
    ],
    general: [
        "Tell me about a challenging project you've worked on.",
        "How do you handle conflicts within a team?",
        "Where do you see yourself in 5 years?",
        "Why do you want to work here?"
    ]
};

const getCategoryQuestions = (role) => {
    const lowercaseRole = role?.toLowerCase() || '';
    if (lowercaseRole.includes('frontend') || lowercaseRole.includes('react')) return mockQuestions.frontend;
    if (lowercaseRole.includes('backend') || lowercaseRole.includes('node') || lowercaseRole.includes('developer')) return mockQuestions.backend;
    return mockQuestions.general;
};

// Start interview session
router.post('/start', (req, res) => {
    const { avatar, role, config, industry } = req.body;

    if (!avatar || !role) {
        return res.status(400).json({ error: 'Avatar and role are required' });
    }

    const modeLabel = config?.mode ? ` Focus today: ${config.mode}.` : '';
    const difficultyLabel = config?.difficulty ? ` Difficulty: ${config.difficulty}.` : '';
    const industryLabel = industry ? ` Industry context: ${industry}.` : '';
    const initialGreeting = `Hello! I'm ${avatar.name}, your ${role}.${modeLabel}${difficultyLabel}${industryLabel} Let's begin your interview. To start, please introduce yourself.`;

    res.status(200).json({
        message: initialGreeting,
        sessionId: Date.now().toString()
    });
});

// Chat endpoint for ongoing interview
router.post('/chat', (req, res) => {
    const { message, avatar, role, questionCount, config } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // Simulate AI processing delay
    setTimeout(() => {
        const configuredMax = Number(config?.questionCount) || 5;
        const maxQuestions = Math.min(Math.max(configuredMax, 3), 10);

        if (questionCount >= maxQuestions) {
            return res.status(200).json({
                response: "Thank you for your time. That concludes our interview today. We will be in touch soon.",
                isComplete: true
            });
        }

        // Otherwise, pick a contextual question based on role
        const questions = getCategoryQuestions(role);
        const nextQuestion = questions[questionCount % questions.length] || questions[0];

        // Add some random conversational filler sometimes
        const fillers = ["That's interesting.", "I see.", "Good point.", "Understood."];
        const filler = Math.random() > 0.5 ? fillers[Math.floor(Math.random() * fillers.length)] + " " : "";

        res.status(200).json({
            response: `${filler}${nextQuestion}`,
            isComplete: false
        });
    }, 1000); // 1 second delay
});

// Analyze user's answer for grammar, improvements, and topic suggestions
router.post('/analyze', (req, res) => {
    const { message } = req.body;

    if (!message || message.trim().length < 3) {
        return res.status(400).json({ error: 'Message is required for analysis' });
    }

    const grammarIssues = analyzeGrammar(message);
    const improvements = detectImprovements(message);
    const topics = detectTopics(message);

    const wordCount = message.trim().split(/\s+/).length;
    const sentenceCount = (message.match(/[.!?]+/g) || []).length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : wordCount;

    res.status(200).json({
        grammarIssues,
        improvements,
        topics,
        stats: {
            wordCount,
            sentenceCount,
            avgWordsPerSentence,
            score: Math.max(40, 100 - (grammarIssues.length * 8) - Math.min(30, (improvements.length - 1) * 6))
        }
    });
});

module.exports = router;

