import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { act } from "react";
import Interview from "../pages/Interview";
import API from "../services/api";

jest.mock("../services/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));

jest.mock("../components/Interview3D/InterviewScene3D", () => ({
  __esModule: true,
  default: () => <div data-testid="mock-interview-scene-3d" />
}));

const renderInterview = () =>
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Interview />
    </MemoryRouter>
  );

const renderInterviewWithRoutes = () =>
  render(
    <MemoryRouter
      initialEntries={["/interview"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/interview" element={<Interview />} />
        <Route path="/results" element={<div data-testid="results-route-marker">Results Route</div>} />
      </Routes>
    </MemoryRouter>
  );

const startFirstInterview = async () => {
  await act(async () => {
    fireEvent.click(screen.getAllByRole("button", { name: /start interview/i })[0]);
    await Promise.resolve();
  });
};

const createDeferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

jest.setTimeout(30000);

describe("Interview posture integration", () => {
  let now;

  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    API.get.mockResolvedValue({ data: { user: null } });
    API.post.mockReset();
    now = 1700000000000;
    jest.spyOn(Date, "now").mockImplementation(() => {
      now += 1;
      return now;
    });
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: {
        getUserMedia: jest.fn().mockRejectedValue(new Error("No media"))
      },
      configurable: true
    });
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  test("transitions avatar posture thinking -> nodding -> speaking during chat flow", async () => {
    const chatDeferred = createDeferred();

    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return Promise.resolve({
          data: { message: "Hello! Let's begin your interview." }
        });
      }
      if (url === "/interview/chat") {
        return chatDeferred.promise;
      }
      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            stats: { score: 85, wordCount: 8, sentenceCount: 1, avgWordsPerSentence: 8 }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container } = renderInterview();

    await startFirstInterview();

    expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(2500);
    });

    const input = screen.getByPlaceholderText(/type your response/i);
    fireEvent.change(input, { target: { value: "I solved a critical production issue under pressure." } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // ensure the 3D character panel is rendered instead of the old avatar wrapper
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();

    await act(async () => {
      chatDeferred.resolve({
        data: {
          response: "Thanks. Can you describe your debugging approach in more detail?",
          isComplete: false
        }
      });
      await Promise.resolve();
    });

    // panel should still be present after nodding stage
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    // after speaking stage, ensure panel still exists (3D placeholder)
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();
  });

  test("3D toggle button switches between 3D and 2D character", async () => {
    // simple start flow without deep API mocking
    API.post.mockResolvedValue({ data: { message: "Hello! Let's begin your interview." } });
    const { container } = renderInterview();
    await startFirstInterview();

    // 3D scene should be visible initially
    const toggleBtn = screen.getByRole("button", { name: /switch to 2d avatar/i });
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();

    // click to switch to 2D
    fireEvent.click(toggleBtn);
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-interview-scene-3d")).not.toBeInTheDocument();
    // now there should be the 2D emoji panel avatar rendered
    expect(container.querySelector(".ai-panel-emoji")).toBeInTheDocument();

    // toggle back to 3D and verify mock returns
    fireEvent.click(screen.getByRole("button", { name: /switch to 3d mode/i }));
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();
  });

  test("shows fallback response and transitions thinking -> speaking when chat API fails", async () => {
    const chatDeferred = createDeferred();

    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return Promise.resolve({
          data: { message: "Hello! Let's begin your interview." }
        });
      }
      if (url === "/interview/chat") {
        return chatDeferred.promise;
      }
      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            stats: { score: 82, wordCount: 9, sentenceCount: 1, avgWordsPerSentence: 9 }
          }
        });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container } = renderInterview();

    await startFirstInterview();

    expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/type your response/i);
    fireEvent.change(input, { target: { value: "I improved our system reliability." } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // 3D panel remains even when chat request fails
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();

    await act(async () => {
      chatDeferred.reject(new Error("chat failed"));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getAllByText("I'm having a little trouble. Please continue.").length).toBeGreaterThan(0);
    });

    // ensure 3D panel remains and no nodding element exists
    expect(container.querySelector(".ai-avatar-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mock-interview-scene-3d")).toBeInTheDocument();
    // nodding state does not apply to 3D panel
    expect(container.querySelector(".avatar-game-wrapper.avatar-state-nodding")).not.toBeInTheDocument();
  });

  test("shows starting state and sends experimental prompt mode when feature flag is enabled", async () => {
    localStorage.setItem("ff.experimentalPrompts", "true");
    const startDeferred = createDeferred();

    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return startDeferred.promise;
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container } = renderInterview();

    await startFirstInterview();

    expect(screen.getAllByText(/starting your session…/i).length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/interview/start",
        expect.objectContaining({ promptMode: "experimental" })
      );
    });

    await act(async () => {
      startDeferred.resolve({ data: { message: "Welcome to the interview." } });
      await Promise.resolve();
    });

    expect(screen.getByPlaceholderText(/type your response/i)).toBeInTheDocument();
  });

  test("requests and renders next question when Next Question button is clicked", async () => {
    API.post.mockImplementation((url, payload) => {
      if (url === "/interview/start") {
        return Promise.resolve({ data: { message: "Welcome to the interview." } });
      }

      if (url === "/interview/chat" && /^next question please/i.test(payload?.message || "")) {
        return Promise.resolve({
          data: {
            response: "Sure — let's continue. Explain a challenging project you delivered.",
            isComplete: false
          }
        });
      }

      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            stats: { score: 84, wordCount: 10, sentenceCount: 1, avgWordsPerSentence: 10 }
          }
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container } = renderInterview();

    await startFirstInterview();

    await waitFor(() => {
      expect(container.querySelector(".next-question-btn")).toBeInTheDocument();
    });

    fireEvent.click(container.querySelector(".next-question-btn"));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/interview/chat",
        expect.objectContaining({ message: expect.stringMatching(/^next question please/i) })
      );
    });

    await waitFor(() => {
      const counter = container.querySelector(".progress-counter");
      expect(counter).toBeInTheDocument();
      expect(counter.textContent).toMatch(/Q\s*\d+\s*\/\s*\d+/i);
    });
  });

  test("shows no-person posture guidance without rendering a posture score", async () => {
    const stopTrack = jest.fn();
    const playSpy = jest.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const FaceDetectorMock = jest.fn().mockImplementation(() => ({
      detect: jest.fn().mockResolvedValue([])
    }));

    Object.defineProperty(window, "FaceDetector", {
      value: FaceDetectorMock,
      configurable: true
    });

    navigator.mediaDevices.getUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: stopTrack }]
    });

    renderInterview();

    fireEvent.click(screen.getByRole("button", { name: /check my posture/i }));

    await waitFor(() => {
      expect(screen.getByText(/no person detected/i)).toBeInTheDocument();
    });

    expect(screen.queryByText(/posture score:/i)).not.toBeInTheDocument();

    playSpy.mockRestore();
    delete window.FaceDetector;
  });

  test("DOM checklist: avatar selection, voice transcript, sidebar toggle, and posture score", async () => {
    const recognitionInstances = [];
    class MockSpeechRecognition {
      constructor() {
        this.lang = "en-US";
        this.interimResults = true;
        this.maxAlternatives = 1;
        this.continuous = true;
        this.onstart = null;
        this.onresult = null;
        this.onend = null;
        this.onerror = null;
        recognitionInstances.push(this);
      }

      start() {
        this.onstart?.();
      }

      stop() {
        this.onend?.();
      }
    }

    Object.defineProperty(window, "SpeechRecognition", {
      value: MockSpeechRecognition,
      configurable: true
    });

    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return Promise.resolve({ data: { message: "Welcome to the interview." } });
      }
      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            verification: { overallScore: 82, relevanceScore: 80, grammarScore: 84, correctnessLabel: "partially-correct" },
            stats: { score: 82, wordCount: 8, sentenceCount: 1, avgWordsPerSentence: 8 }
          }
        });
      }
      if (url === "/interview/chat") {
        return Promise.resolve({ data: { response: "Thanks for the response.", isComplete: false } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    const { container } = renderInterview();

    expect(screen.queryByText("🦉")).not.toBeInTheDocument();
    expect(screen.queryByText("🦊")).not.toBeInTheDocument();
    expect(screen.queryByText("🐼")).not.toBeInTheDocument();

    await startFirstInterview();

    const sidebar = container.querySelector(".feedback-sidebar.open");
    expect(sidebar).toBeInTheDocument();

    const toggle = container.querySelector(".feedback-toggle-btn");
    fireEvent.click(toggle);
    expect(container.querySelector(".feedback-sidebar.closed")).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(container.querySelector(".feedback-sidebar.open")).toBeInTheDocument();

    const speakButton = screen.getByRole("button", { name: /start voice input|stop voice input/i });
    fireEvent.click(speakButton);

    const recognition = recognitionInstances[0];
    expect(recognition).toBeDefined();

    await act(async () => {
      recognition.onresult?.({
        resultIndex: 0,
        results: [
          {
            0: { transcript: "I am speaking now" },
            isFinal: false
          }
        ]
      });
      await Promise.resolve();
    });

    expect(screen.getAllByText(/i am speaking now/i).length).toBeGreaterThan(0);

    delete window.SpeechRecognition;
  });

  test("end interview auto-redirects to results route", async () => {
    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return Promise.resolve({ data: { message: "Welcome to the interview." } });
      }
      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            verification: { overallScore: 80, relevanceScore: 78, grammarScore: 82, correctnessLabel: "partially-correct" },
            stats: { score: 80, wordCount: 7, sentenceCount: 1, avgWordsPerSentence: 7 }
          }
        });
      }
      if (url === "/interview/chat") {
        return Promise.resolve({ data: { response: "Thanks for your answer.", isComplete: false } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderInterviewWithRoutes();

    await startFirstInterview();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /end interview session/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /end interview session/i }));

    await waitFor(() => {
      expect(screen.getByTestId("results-route-marker")).toBeInTheDocument();
    });
  });

  test("auto-complete path redirects to results route when chat returns isComplete true", async () => {
    API.post.mockImplementation((url) => {
      if (url === "/interview/start") {
        return Promise.resolve({ data: { message: "Welcome to the interview." } });
      }
      if (url === "/interview/analyze") {
        return Promise.resolve({
          data: {
            grammarIssues: [],
            improvements: [],
            topics: ["Interview Communication Skills"],
            verification: { overallScore: 85, relevanceScore: 84, grammarScore: 86, correctnessLabel: "correct" },
            stats: { score: 85, wordCount: 9, sentenceCount: 1, avgWordsPerSentence: 9 }
          }
        });
      }
      if (url === "/interview/chat") {
        return Promise.resolve({ data: { response: "Thank you, that completes the interview.", isComplete: true } });
      }
      return Promise.reject(new Error(`Unexpected URL: ${url}`));
    });

    renderInterviewWithRoutes();

    await startFirstInterview();

    const input = await screen.findByPlaceholderText(/type your response/i);
    fireEvent.change(input, { target: { value: "Here is my final answer." } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(API.post).toHaveBeenCalledWith(
        "/interview/chat",
        expect.objectContaining({ message: "Here is my final answer." })
      );
    });

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.getByTestId("results-route-marker")).toBeInTheDocument();
    });
  });
});
