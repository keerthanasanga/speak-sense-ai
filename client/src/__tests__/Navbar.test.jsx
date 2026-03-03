// ensure authStorage returns a token so navbar renders user links
import * as authStorage from "../utils/authStorage";

jest.mock("../utils/authStorage", () => ({
  getAuthToken: jest.fn(() => "fake-token"),
  getStoredUser: jest.fn(() => ({ name: "Tester", avatar: "👤" })),
  clearAuthSession: jest.fn()
}));

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdvancedNavbar from "../components/AdvancedNavbar";
import Practice from "../pages/Practice";

function renderNavbar(initialPath = "/") {
  return render(
    <MemoryRouter
      initialEntries={[initialPath]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AdvancedNavbar />
      <Routes>
        <Route path="/practice" element={<Practice />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AdvancedNavbar", () => {
  beforeEach(() => {
    // make sure every test starts with a logged-in user
    authStorage.getAuthToken.mockReturnValue("fake-token");
    authStorage.getStoredUser.mockReturnValue({ name: "Tester", avatar: "👤" });
  });

  test("contains Practice link when user is logged in", () => {
    renderNavbar();
    const practiceLink = screen.getByRole("link", { name: /practice/i });
    expect(practiceLink).toBeInTheDocument();
    expect(practiceLink.getAttribute("href")).toBe("/practice");
  });

  test("navigates to Practice page on click", () => {
    renderNavbar("/dashboard");
    const practiceLink = screen.getByRole("link", { name: /practice/i });
    fireEvent.click(practiceLink);
    expect(screen.getByText(/ai-powered practice platform/i)).toBeInTheDocument();
  });

  test("desktop nav links route to the expected pages when logged in", () => {
    // override initial render to include markers for each route
    render(
      <MemoryRouter
        initialEntries={["/dashboard"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AdvancedNavbar />
        <Routes>
          <Route path="/dashboard" element={<div data-testid="dashboard-route">Dashboard</div>} />
          <Route path="/planning" element={<div data-testid="planning-route">Planning</div>} />
          <Route path="/practice" element={<div data-testid="practice-route">Practice</div>} />
          <Route path="/results" element={<div data-testid="results-route">Results</div>} />
          <Route path="/settings" element={<div data-testid="settings-route">Settings</div>} />
        </Routes>
      </MemoryRouter>
    );

    // click each link and verify the route marker appears
    const linkNames = [
      { name: /overview/i, testid: "dashboard-route" },
      { name: /interviews/i, testid: "planning-route" },
      { name: /practice/i, testid: "practice-route" },
      { name: /feedback/i, testid: "results-route" },
      { name: /settings/i, testid: "settings-route" }
    ];

    linkNames.forEach(({ name, testid }) => {
      const link = screen.getByRole("link", { name });
      fireEvent.click(link);
      expect(screen.getByTestId(testid)).toBeInTheDocument();
    });
  });

  test("public nav links include anchors when logged out", () => {
    // re-render as logged-out by restoring default mock implementation
    authStorage.getAuthToken.mockReturnValue("");
    renderNavbar();
    const features = screen.getByRole("link", { name: /features/i });
    const stories = screen.getByRole("link", { name: /success stories/i });
    const resources = screen.getByRole("link", { name: /resources/i });
    expect(features).toHaveAttribute("href", "/#features");
    expect(stories).toHaveAttribute("href", "/#testimonials");
    expect(resources).toHaveAttribute("href", "/#resources");
  });
});
