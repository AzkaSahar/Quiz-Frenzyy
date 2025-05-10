/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import QuizResults from "@/app/results/[sessionId]/page";
import { useParams } from "next/navigation";

jest.mock("next/navigation", () => ({
  useParams: jest.fn(),
}));

// Mock Header and Footer
jest.mock("@/components/Header", () => () => <div data-testid="header" />);
jest.mock("@/components/Footer", () => () => <div data-testid="footer" />);

// Mock fetch
global.fetch = jest.fn();

const mockUseParams = useParams as jest.Mock;

describe("QuizResults Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ sessionId: "12345" });
  });

  it("shows message when user did not play in the session", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, result: { answers: [] } }),
    });

    render(<QuizResults />);

    await waitFor(() => {
      expect(screen.getByText("You did not play in this session.")).toBeInTheDocument();
    });
  });

  it("shows message when results are not yet available", async () => {
    const futureTime = new Date(Date.now() + 100000).toISOString();

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        result: {
          displayName: "John Doe",
          score: 10,
          completed_at: new Date().toISOString(),
          end_time: futureTime,
          answers: [{ question_text: "Q1?", submitted_answer: "A", is_correct: true, points: 5, question_type: "mcq", options: ["A", "B"], correct_answer: "A" }],
        },
      }),
    });

    render(<QuizResults />);

    await waitFor(() => {
      expect(screen.getByText("Results will be available after the session ends.")).toBeInTheDocument();
    });
  });

  it("renders results and allows navigation", async () => {
    const pastTime = new Date(Date.now() - 100000).toISOString();

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        result: {
          quiz_id: "qz1",
          displayName: "Jane Doe",
          score: 20,
          completed_at: pastTime,
          end_time: pastTime,
          answers: [
            {
              question_text: "What is 2+2?",
              options: ["3", "4"],
              correct_answer: "4",
              submitted_answer: "4",
              is_correct: true,
              points: 5,
              question_type: "mcq",
            },
            {
              question_text: "Type 'yes'",
              correct_answer: "yes",
              submitted_answer: "no",
              is_correct: false,
              points: 5,
              question_type: "short answer",
            },
          ],
        },
      }),
    });

    render(<QuizResults />);

    await waitFor(() => {
      expect(screen.getByText("Results for Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("What is 2+2?")).toBeInTheDocument();
    });

    // Navigate to next question
    const nextButton = screen.getByRole("button", { name: "▶" });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Type 'yes'")).toBeInTheDocument();
    });
  });

  it("handles fetch error gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Fetch failed"));

    render(<QuizResults />);

    await waitFor(() => {
      expect(screen.getByText("You did not play in this session.")).toBeInTheDocument();
    });
  });
});
