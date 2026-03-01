import { useState, useEffect, useCallback } from 'react';
import API from '../services/api';
import './FeedbackSidebar.css';

/**
 * FeedbackSidebar
 * Analyzes the latest user message via /api/interview/analyze
 * and shows grammar issues, improvement points, and suggested topics.
 */
export default function FeedbackSidebar({ lastUserMessage, isOpen, onToggle, speechMetrics, analysisTrigger = 0 }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('grammar');

    const analyzeAnswer = useCallback(async (message, cancelledRef) => {
        if (!message || message.trim().length < 5) return;

        setLoading(true);
        setError('');
        try {
            const res = await API.post('/interview/analyze', { message });
            if (!cancelledRef.current) {
                setData({
                    grammarIssues: Array.isArray(res.data?.grammarIssues) ? res.data.grammarIssues : [],
                    improvements: Array.isArray(res.data?.improvements) ? res.data.improvements : [],
                    topics: Array.isArray(res.data?.topics) ? res.data.topics : [],
                    stats: res.data?.stats || null,
                });
            }
        } catch {
            if (!cancelledRef.current) {
                setError('Could not analyze this answer. Please try again.');
            }
        } finally {
            if (!cancelledRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!lastUserMessage || lastUserMessage.trim().length < 5) return;
        const cancelledRef = { current: false };
        analyzeAnswer(lastUserMessage, cancelledRef);
        return () => { cancelledRef.current = true; };
    }, [analyzeAnswer, analysisTrigger, lastUserMessage]);

    const scoreColor = (score) => {
        if (score >= 80) return '#22c55e';
        if (score >= 60) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className={`feedback-sidebar ${isOpen ? 'open' : 'closed'}`}>
            {/* Collapse toggle */}
            <button className="feedback-toggle-btn" onClick={onToggle} title={isOpen ? 'Collapse feedback' : 'Open feedback'}>
                {isOpen ? '›' : '‹'}
            </button>

            {isOpen && (
                <div className="feedback-inner">
                    <div className="feedback-header">
                        <h3>📋 Real-Time Feedback</h3>
                        <p>Analysis updates after each answer</p>
                    </div>

                    {speechMetrics && (
                        <div className="speech-metrics-card">
                            <h4>🎙️ Speaking Quality</h4>
                            <div className="speech-metrics-grid">
                                <div className="speech-metric-item">
                                    <span>{speechMetrics.wordsPerMinute || 0}</span>
                                    <small>WPM</small>
                                </div>
                                <div className="speech-metric-item">
                                    <span>{speechMetrics.fillerCount || 0}</span>
                                    <small>Fillers</small>
                                </div>
                                <div className="speech-metric-item">
                                    <span>{speechMetrics.pauseCount || 0}</span>
                                    <small>Pauses</small>
                                </div>
                            </div>
                            <p className="speech-coach-tip">{speechMetrics.tip || 'Keep a steady pace and pause intentionally.'}</p>
                        </div>
                    )}

                    {/* Score ring */}
                    {data?.stats && (
                        <div className="feedback-score-wrap">
                            <div
                                className="feedback-score-ring"
                                style={{ '--score-color': scoreColor(data.stats.score), '--score': data.stats.score }}
                            >
                                <span className="score-number">{data.stats.score}</span>
                                <span className="score-label">/ 100</span>
                            </div>
                            <div className="feedback-stats">
                                <div className="fstat"><span>{data.stats.wordCount}</span><small>Words</small></div>
                                <div className="fstat"><span>{data.stats.sentenceCount || 1}</span><small>Sentences</small></div>
                                <div className="fstat"><span>{data.stats.avgWordsPerSentence}</span><small>Avg len</small></div>
                            </div>
                        </div>
                    )}

                    {/* Tab nav */}
                    <div className="feedback-tabs">
                        {['grammar', 'improve', 'topics'].map(tab => (
                            <button
                                key={tab}
                                className={`feedback-tab ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab === 'grammar' ? '✏️ Grammar' : tab === 'improve' ? '📈 Improve' : '📚 Topics'}
                                {tab === 'grammar' && data?.grammarIssues?.length > 0 && (
                                    <span className="tab-badge">{data.grammarIssues.length}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="feedback-content">
                        {loading ? (
                            <div className="feedback-loading">
                                <div className="fb-spinner" />
                                <p>Analyzing your answer…</p>
                            </div>
                        ) : error ? (
                            <div className="feedback-error">
                                <p>{error}</p>
                                <button
                                    type="button"
                                    className="feedback-retry-btn"
                                    onClick={() => analyzeAnswer(lastUserMessage, { current: false })}
                                >
                                    Retry Analysis
                                </button>
                            </div>
                        ) : !data ? (
                            <div className="feedback-empty">
                                <span className="feedback-empty-icon">💬</span>
                                <p>Send your first answer to see feedback here</p>
                            </div>
                        ) : (
                            <>
                                {/* Grammar Tab */}
                                {activeTab === 'grammar' && (
                                    <div className="feedback-list">
                                        {(data.grammarIssues || []).length === 0 ? (
                                            <div className="feedback-good">
                                                <span>✅</span>
                                                <p>No grammar issues detected! Great job.</p>
                                            </div>
                                        ) : (
                                            (data.grammarIssues || []).map((issue, i) => (
                                                <div className="feedback-item issue" key={i}>
                                                    <div className="issue-chip">
                                                        <span className="issue-word">{issue.word}</span>
                                                    </div>
                                                    <p className="issue-rule">{issue.rule}</p>
                                                    {issue.context && (
                                                        <p className="issue-context">…{issue.context}…</p>
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Improve Tab */}
                                {activeTab === 'improve' && (
                                    <div className="feedback-list">
                                        {(data.improvements || []).length === 0 ? (
                                            <div className="feedback-good">
                                                <span>🌟</span>
                                                <p>Excellent answer structure!</p>
                                            </div>
                                        ) : (
                                            (data.improvements || []).map((pt, i) => (
                                                <div className="feedback-item improve" key={i}>
                                                    <span className="improve-bullet">→</span>
                                                    <p>{pt}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {/* Topics Tab */}
                                {activeTab === 'topics' && (
                                    <div className="feedback-topics">
                                        <p className="topics-intro">Based on your answers, focus on:</p>
                                        {(data.topics || []).map((topic, i) => (
                                            <div className="topic-chip" key={i} style={{ animationDelay: `${i * 0.08}s` }}>
                                                <span className="topic-icon">📖</span>
                                                <span>{topic}</span>
                                            </div>
                                        ))}
                                        <div className="topics-cta">
                                            <a href="/courses" className="topics-cta-btn">
                                                Browse Courses →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
