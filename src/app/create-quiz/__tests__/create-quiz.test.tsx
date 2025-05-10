/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateQuiz from "../page";
import { useRouter } from "next/navigation";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Stub out Header/Footer with display names
jest.mock("@/components/Header", () => {
  const MockHeader = () => <header />;
  MockHeader.displayName = "Header";
  return MockHeader;
});

jest.mock("@/components/Footer", () => {
  const MockFooter = () => <footer />;
  MockFooter.displayName = "Footer";
  return MockFooter;
});

// Provide a global.fetch mock before tests
beforeAll(() => {
  global.fetch = jest.fn((url: string) => {
    if (url === "/api/users/profile") {
      return Promise.resolve({
        ok: true,
        json: async () => ({ success: true, user: { _id: "user1" } }),
      });
    }
    // Default stub for any other fetch: return empty success
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  }) as jest.Mock;
});

describe("CreateQuiz Page", () => {
  beforeEach(() => {
    // Clear any previous fetch calls
    (global.fetch as jest.Mock).mockClear();
    // Stub router.push
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it('adds a new question section when "Add Question" is clicked', async () => {
    render(<CreateQuiz />);

    const addBtn = screen.getByRole("button", { name: /Add Question/i });
    await userEvent.click(addBtn);

    expect(await screen.findByText(/Question 1/i)).toBeInTheDocument();
  });
});
