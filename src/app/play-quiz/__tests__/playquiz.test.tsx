import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import PlayQuizContent from "../page";
import { useRouter, useSearchParams } from "next/navigation";

// --- Mock Next Router ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// --- Mock Global Fetch ---
global.fetch = jest.fn();

// --- Mock Child Components ---
jest.mock("@/components/Header", () => () => <div data-testid="Header" />);
jest.mock("@/components/Footer", () => () => <div data-testid="Footer" />);

describe("PlayQuizContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("redirects to home if session_id or player_quiz_id is missing", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) => null, // No session_id or player_quiz_id
    });

    render(<PlayQuizContent />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  test("renders quiz if session_id and data are valid", async () => {
    const mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: (key: string) =>
        key === "session_id" ? "abc123" : key === "player_quiz_id" ? "p1" : null,
    });

    const fakeQuestion = {
      _id: "q1",
      question_text: "What is 2 + 2?",
      question_type: "MCQ",
      options: ["1", "2", "3", "4"],
      points: 1,
    };

    const fakeQuizInfo = {
      success: true,
      questions: [fakeQuestion],
      quiz: { title: "Math Quiz", description: "Simple Math" },
      duration: 5,
      start_time: new Date(Date.now() - 60000).toISOString(), // started 1 min ago
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => fakeQuizInfo,
    });

    render(<PlayQuizContent />);

    expect(await screen.findByText("What is 2 + 2?")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText(/Time Left:/)).toBeInTheDocument();
  });
});
