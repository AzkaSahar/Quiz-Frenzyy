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
// Stub out Header/Footer
jest.mock("@/components/Header", () => () => <header />);
jest.mock("@/components/Footer", () => () => <footer />);


// Provide a global.fetch mock before tests
beforeAll(() => {
  (global as any).fetch = jest.fn((url: string) => {
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
  });
});


describe("CreateQuiz Page", () => {
  beforeEach(() => {
    // Clear any previous fetch calls
    (global.fetch as jest.Mock).mockClear();
    // Stub router.push
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });


  it('adds a new question section when "Add Question" is clicked', async () => {
    // Render the page
    render(<CreateQuiz />);


    // Find and click the Add Question button
    const addBtn = screen.getByRole("button", { name: /Add Question/i });
    await userEvent.click(addBtn);


    // After clicking, "Question 1" heading should appear
    expect(await screen.findByText(/Question 1/i)).toBeInTheDocument();
  });
});



