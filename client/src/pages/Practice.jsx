import { useState, useEffect } from "react";
import { Link } from "react-router-dom";  // Add this import
import PageFeaturePanel from "../components/PageFeaturePanel";
import "./Practice.css";

export default function Practice() {
  const [selectedDomain, setSelectedDomain] = useState("frontend");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [question, setQuestion] = useState(null);
  const [userCode, setUserCode] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [codeHistory, setCodeHistory] = useState([]);

  // Domains for practice
  const domains = [
    { id: "frontend", name: "Frontend", icon: "🎨", color: "#0066cc" },
    { id: "backend", name: "Backend", icon: "⚙️", color: "#003366" },
    { id: "fullstack", name: "Full Stack", icon: "🚀", color: "#004488" },
    { id: "algorithms", name: "Algorithms", icon: "🔢", color: "#0055aa" },
    { id: "database", name: "Database", icon: "🗄️", color: "#0077cc" },
    { id: "system-design", name: "System Design", icon: "🏗️", color: "#002244" }
  ];

  // Difficulty levels
  const difficulties = [
    { id: "easy", name: "Easy", color: "#00C851", icon: "🟢" },
    { id: "medium", name: "Medium", color: "#ffbb33", icon: "🟡" },
    { id: "hard", name: "Hard", color: "#ff4444", icon: "🔴" }
  ];

  // AI-Generated Questions based on domain and difficulty
  const questions = {
    frontend: {
      easy: {
        id: 1,
        title: "Build a Counter Component",
        description: "Create a React counter component with increment, decrement, and reset functionality. The counter should start at 0 and have a maximum limit of 10.",
        requirements: [
          "Create a functional component with useState",
          "Add increment button that increases count by 1",
          "Add decrement button that decreases count by 1",
          "Add reset button to set count back to 0",
          "Disable increment when count reaches 10",
          "Disable decrement when count reaches 0",
          "Display the current count value"
        ],
        starterCode: `import React, { useState } from 'react';

function Counter() {
  // Your code here
  
  return (
    <div className="counter">
      {/* Implement counter UI */}
    </div>
  );
}

export default Counter;`,
        hint: "Use useState hook to manage count state. Conditionally disable buttons based on current count.",
        sampleSolution: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  const increment = () => {
    if (count < 10) setCount(count + 1);
  };
  
  const decrement = () => {
    if (count > 0) setCount(count - 1);
  };
  
  const reset = () => {
    setCount(0);
  };
  
  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={increment} disabled={count >= 10}>
        Increment
      </button>
      <button onClick={decrement} disabled={count <= 0}>
        Decrement
      </button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;`,
        testCases: [
          { input: "Initial render", expected: "Count: 0" },
          { input: "Click increment 5 times", expected: "Count: 5" },
          { input: "Try to go above 10", expected: "Count: 10" }
        ]
      },
      medium: {
        id: 2,
        title: "Todo List with Local Storage",
        description: "Build a todo list application with the ability to add, delete, and mark todos as complete. Persist todos in localStorage.",
        requirements: [
          "Add new todos with input field",
          "Display list of todos",
          "Mark todos as complete/incomplete",
          "Delete todos",
          "Show count of remaining todos",
          "Persist todos in localStorage",
          "Filter todos (All/Active/Completed)"
        ],
        starterCode: `import React, { useState, useEffect } from 'react';

function TodoApp() {
  // Your code here
  
  return (
    <div className="todo-app">
      {/* Implement todo app */}
    </div>
  );
}

export default TodoApp;`,
        hint: "Use useEffect to sync with localStorage. Maintain todos array with 'completed' status.",
        sampleSolution: `import React, { useState, useEffect } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });
  
  const remaining = todos.filter(t => !t.completed).length;
  
  return (
    <div className="todo-app">
      <h1>Todo List ({remaining} remaining)</h1>
      <div className="add-todo">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <div className="filters">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('active')}>Active</button>
        <button onClick={() => setFilter('completed')}>Completed</button>
      </div>
      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>
              {todo.text}
            </span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;`,
        testCases: [
          { input: "Add 'Learn React'", expected: "Todo appears in list" },
          { input: "Mark todo as complete", expected: "Todo shows as completed" },
          { input: "Refresh page", expected: "Todos persist" }
        ]
      },
      hard: {
        id: 3,
        title: "Custom Hook for API Calls",
        description: "Create a custom React hook 'useApi' that handles API calls with loading, error states, and caching. Implement a component that fetches and displays user data.",
        requirements: [
          "Create useApi hook with loading state",
          "Handle error states gracefully",
          "Implement caching mechanism",
          "Add request/response interceptors",
          "Support retry logic",
          "Display loading skeleton",
          "Show error boundary fallback"
        ],
        starterCode: `import React, { useState, useEffect } from 'react';

// Create custom hook here
function useApi(url, options = {}) {
  // Your hook implementation
}

// Component using the hook
function UserProfile() {
  // Your component code
  
  return (
    <div className="user-profile">
      {/* Display user data */}
    </div>
  );
}

export default UserProfile;`,
        hint: "Use AbortController for cleanup. Implement cache with Map and expiration time.",
        sampleSolution: `import React, { useState, useEffect } from 'react';

const cache = new Map();

function useApi(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    
    const fetchData = async () => {
      if (cache.has(url)) {
        setData(cache.get(url));
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(url, { ...options, signal });
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        cache.set(url, result);
        setData(result);
        setError(null);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    return () => controller.abort();
  }, [url]);
  
  return { data, loading, error };
}

function UserProfile() {
  const { data, loading, error } = useApi('https://jsonplaceholder.typicode.com/users/1');
  
  if (loading) return <div className="skeleton">Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      <p>Name: {data?.name}</p>
      <p>Email: {data?.email}</p>
      <p>Phone: {data?.phone}</p>
    </div>
  );
}

export default UserProfile;`,
        testCases: [
          { input: "Initial load", expected: "Show loading skeleton" },
          { input: "API success", expected: "Display user data" },
          { input: "API failure", expected: "Show error message" }
        ]
      }
    },
    backend: {
      easy: {
        id: 4,
        title: "REST API Endpoint",
        description: "Create a simple REST API endpoint using Express.js that handles GET and POST requests for a tasks resource.",
        requirements: [
          "Set up Express server",
          "Create GET /tasks endpoint",
          "Create POST /tasks endpoint",
          "Implement in-memory storage",
          "Add request validation",
          "Return appropriate status codes"
        ],
        starterCode: `const express = require('express');
const app = express();

// Your code here

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
        hint: "Use express.json() middleware. Store tasks in array with unique IDs.",
        sampleSolution: `const express = require('express');
const app = express();

app.use(express.json());

let tasks = [];
let id = 1;

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

app.post('/tasks', (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const newTask = {
    id: id++,
    title,
    description: description || '',
    completed: false,
    createdAt: new Date()
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});`,
        testCases: [
          { input: "GET /tasks", expected: "Returns empty array initially" },
          { input: "POST /tasks with title", expected: "Returns created task" },
          { input: "POST without title", expected: "Returns 400 error" }
        ]
      }
    },
    algorithms: {
      medium: {
        id: 5,
        title: "Two Sum Problem",
        description: "Given an array of integers nums and an integer target, return indices of the two numbers that add up to target. Optimize for O(n) time complexity.",
        requirements: [
          "Implement efficient solution",
          "Handle edge cases",
          "Return indices in array",
          "Assume exactly one solution",
          "Cannot use same element twice"
        ],
        starterCode: `function twoSum(nums, target) {
  // Your code here
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // Should return [0, 1]
console.log(twoSum([3, 2, 4], 6));       // Should return [1, 2]
console.log(twoSum([3, 3], 6));          // Should return [0, 1]`,
        hint: "Use a hash map to store complements. For each number, check if target - num exists in map.",
        sampleSolution: `function twoSum(nums, target) {
  const map = new Map();
  
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    
    map.set(nums[i], i);
  }
  
  return [];
}

// Test cases
console.log(twoSum([2, 7, 11, 15], 9)); // [0, 1]
console.log(twoSum([3, 2, 4], 6));       // [1, 2]
console.log(twoSum([3, 3], 6));          // [0, 1]`,
        testCases: [
          { input: "[2,7,11,15], 9", expected: "[0,1]" },
          { input: "[3,2,4], 6", expected: "[1,2]" },
          { input: "[3,3], 6", expected: "[0,1]" }
        ]
      }
    }
  };

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerActive(false);
      alert("Time's up! Submit your solution.");
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft]);

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate new question
  const generateQuestion = () => {
    setIsLoading(true);
    setTimeout(() => {
      const domainQuestions = questions[selectedDomain] || questions.frontend;
      const difficultyQuestions = domainQuestions[selectedDifficulty] || domainQuestions.medium;
      setQuestion(difficultyQuestions);
      setUserCode(difficultyQuestions.starterCode);
      setOutput("");
      setFeedback("");
      setShowHint(false);
      setTimeLeft(1800);
      setIsTimerActive(true);
      setIsLoading(false);
    }, 1000);
  };

  // Run code
  const runCode = () => {
    setIsRunning(true);
    setOutput("Running code...");
    
    setTimeout(() => {
      try {
        // Simulate code execution
        const randomOutput = `Execution completed successfully!\n\nTest Results:\n✓ Test case 1 passed\n✓ Test case 2 passed\n✗ Test case 3 failed\n\nExpected: ${question?.testCases[2]?.expected}\nGot: undefined`;
        setOutput(randomOutput);
        
        // Generate AI feedback
        const aiFeedback = `AI Code Review Feedback:\n\n` +
          `✅ Good use of React hooks\n` +
          `⚠️ Consider adding error handling\n` +
          `📝 Suggestion: Add PropTypes for better type safety\n` +
          `🎯 Performance: Component renders optimally\n` +
          `🔧 Complexity: O(n) time complexity is good`;
        setFeedback(aiFeedback);
      } catch (error) {
        setOutput(`Error: ${error.message}`);
      } finally {
        setIsRunning(false);
      }
    }, 2000);
  };

  // Save code to history
  const saveCode = () => {
    const newHistory = {
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      code: userCode,
      question: question?.title
    };
    setCodeHistory([newHistory, ...codeHistory].slice(0, 5));
    alert("Code saved to history!");
  };

  // Reset code
  const resetCode = () => {
    if (question) {
      setUserCode(question.starterCode);
      setOutput("");
      setFeedback("");
    }
  };

  return (
    <div className="practice-page">
      {/* Background Elements */}
      <div className="practice-bg">
        <div className="bg-grid"></div>
        <div className="bg-glow glow-1"></div>
        <div className="bg-glow glow-2"></div>
        <div className="bg-glow glow-3"></div>
      </div>

      <div className="practice-container">
        {/* Header - Updated with Back to Dashboard button */}
        <div className="practice-header">
          <div className="header-left">
            <Link to="/dashboard" className="back-to-dashboard">
              <span className="back-icon">←</span>
              Back to Dashboard
            </Link>
            <h1>
              <span className="header-icon">💻</span>
              AI-Powered Practice Platform
            </h1>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-icon">📊</span>
              <span>Progress: 0/50</span>
            </div>
            <div className="stat-item">
              <span className="stat-icon">⚡</span>
              <span>Streak: 5 days</span>
            </div>
          </div>
        </div>

        <PageFeaturePanel pageKey="practice" />

        {/* Domain Selection */}
        <div className="domain-section">
          <h2>Choose Your Domain</h2>
          <div className="domain-grid">
            {domains.map(domain => (
              <button
                key={domain.id}
                className={`domain-card ${selectedDomain === domain.id ? 'active' : ''}`}
                onClick={() => setSelectedDomain(domain.id)}
                style={{ borderColor: selectedDomain === domain.id ? domain.color : 'transparent' }}
              >
                <span className="domain-icon">{domain.icon}</span>
                <span className="domain-name">{domain.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div className="difficulty-section">
          <h2>Select Difficulty</h2>
          <div className="difficulty-grid">
            {difficulties.map(diff => (
              <button
                key={diff.id}
                className={`difficulty-card ${selectedDifficulty === diff.id ? 'active' : ''}`}
                onClick={() => setSelectedDifficulty(diff.id)}
              >
                <span className="difficulty-icon">{diff.icon}</span>
                <span className="difficulty-name">{diff.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="generate-section">
          <button 
            className="generate-btn"
            onClick={generateQuestion}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Generating Question...
              </>
            ) : (
              <>
                <span>🤖</span>
                Generate AI Question
              </>
            )}
          </button>
        </div>

        {/* Question Display */}
        {question && (
          <div className="question-section">
            <div className="question-header">
              <div className="question-title">
                <h2>{question.title}</h2>
                <div className="question-meta">
                  <span className="difficulty-badge" style={{ 
                    background: difficulties.find(d => d.id === selectedDifficulty)?.color 
                  }}>
                    {difficulties.find(d => d.id === selectedDifficulty)?.name}
                  </span>
                  <span className="timer" style={{ 
                    color: timeLeft < 300 ? '#ff4444' : 'inherit' 
                  }}>
                    ⏱️ {formatTime(timeLeft)}
                  </span>
                </div>
              </div>
              <button className="hint-btn" onClick={() => setShowHint(!showHint)}>
                {showHint ? 'Hide Hint' : 'Show Hint'} 💡
              </button>
            </div>

            <div className="question-content">
              <p className="question-description">{question.description}</p>
              
              <div className="requirements">
                <h3>Requirements:</h3>
                <ul>
                  {question.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>

              {showHint && (
                <div className="hint-section">
                  <h3>💡 Hint:</h3>
                  <p>{question.hint}</p>
                </div>
              )}

              <div className="test-cases">
                <h3>Test Cases:</h3>
                {question.testCases.map((test, index) => (
                  <div key={index} className="test-case">
                    <span className="test-input">Input: {test.input}</span>
                    <span className="test-expected">Expected: {test.expected}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Coding Area */}
        {question && (
          <div className="coding-area">
            <div className="coding-header">
              <h3>Code Editor</h3>
              <div className="coding-actions">
                <button className="action-btn" onClick={resetCode}>
                  ↺ Reset
                </button>
                <button className="action-btn" onClick={saveCode}>
                  💾 Save
                </button>
                <button 
                  className="run-btn" 
                  onClick={runCode}
                  disabled={isRunning}
                >
                  {isRunning ? (
                    <>
                      <span className="spinner-small"></span>
                      Running...
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      Run Code
                    </>
                  )}
                </button>
              </div>
            </div>
            <textarea
              className="code-editor"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Write your code here..."
              spellCheck="false"
            />
          </div>
        )}

        {/* Output and Feedback */}
        {(output || feedback) && (
          <div className="output-section">
            <div className="output-tabs">
              <button className="tab active">Output</button>
              <button className="tab">AI Feedback</button>
              <button className="tab">Sample Solution</button>
            </div>
            <div className="output-content">
              {output && (
                <pre className="output-text">{output}</pre>
              )}
              {feedback && (
                <div className="feedback-text">
                  {feedback.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code History */}
        {codeHistory.length > 0 && (
          <div className="history-section">
            <h3>Recent Code History</h3>
            <div className="history-list">
              {codeHistory.map(item => (
                <div key={item.id} className="history-item">
                  <span className="history-time">{item.timestamp}</span>
                  <span className="history-question">{item.question}</span>
                  <button 
                    className="history-view"
                    onClick={() => setUserCode(item.code)}
                  >
                    Load
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}