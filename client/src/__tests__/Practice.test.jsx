import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Practice from "../pages/Practice";

describe("Practice page", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("renders header with back link and title", () => {
    render(
      <MemoryRouter initialEntries={["/practice"]}>
        <Routes>
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    // header text should appear before navigation
    expect(screen.getByText(/ai-powered practice platform/i)).toBeInTheDocument();
    const backLink = screen.getByRole("link", { name: /back to dashboard/i });
    expect(backLink).toBeInTheDocument();

    fireEvent.click(backLink);
    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
  });

  test("generate button disables then loads question", () => {
    render(
      <MemoryRouter initialEntries={["/practice"]}>
        <Practice />
      </MemoryRouter>
    );

    const genBtn = screen.getByRole("button", { name: /generate ai question/i });
    expect(genBtn).not.toBeDisabled();

    fireEvent.click(genBtn);
    expect(genBtn).toBeDisabled();
    expect(genBtn).toHaveTextContent(/generating question/i);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // after timeout the button should re-enable and question heading should appear
    expect(genBtn).not.toBeDisabled();
    // the default question for frontend/medium is the todo list exercise
    expect(
      screen.getByRole("heading", { name: /todo list with local storage/i })
    ).toBeInTheDocument();
  });
});