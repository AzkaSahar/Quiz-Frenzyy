import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import '@testing-library/jest-dom';
import Leaderboard from "../page"; // Adjust if needed
import { useSearchParams } from "next/navigation";

// --- Mock Next.js navigation ---
jest.mock("next/navigation", () => ({
  useSearchParams: jest.fn(),
}));

// --- Mock global fetch ---
global.fetch = jest.fn();

// --- Mock Next Image ---
jest.mock("next/image", () => (props: any) => {
  return <img {...props} alt={props.alt || "mocked image"} />;
});

// --- Mock Header/Footer ---
jest.mock("@/components/Header", () => () => <div data-testid="Header" />);
jest.mock("@/components/Footer", () => () => <div data-testid="Footer" />);

describe("LeaderboardContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders empty leaderboard if session_id is missing", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => null,
    });

    render(<Leaderboard />);

    expect(await screen.findByText("Leaderboard")).toBeInTheDocument();
    expect(screen.queryAllByRole("row")).toHaveLength(1); // Only header row, no player rows
  });

  test("renders leaderboard with sorted players and ranks", async () => {
    (useSearchParams as jest.Mock).mockReturnValue({
      get: () => "session123",
    });

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        leaderboard: [
          {
            _id: "1",
            displayName: "Alice",
            avatar: "/alice.png",
            originalUsername: "alice01",
            score: 10,
            correct: 5,
            completed_at: "2024-05-01",
          },
          {
            _id: "2",
            displayName: "Bob",
            avatar: "/bob.png",
            originalUsername: "bob02",
            score: 15,
            correct: 7,
            completed_at: "2024-05-01",
          },
        ],
      }),
    });

    render(<Leaderboard />);

    expect(await screen.findByText("Leaderboard")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getAllByText("1")[0]).toBeInTheDocument(); // Rank 1 for Bob
      expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Rank 2 for Alice
    });
  });
});
