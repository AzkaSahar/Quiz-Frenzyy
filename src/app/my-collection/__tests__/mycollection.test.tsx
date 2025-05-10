/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";

// --- Mock Header/Footer with display names ---
jest.mock("@/components/Header", () => {
  const MockHeader = () => <div data-testid="header" />;
  MockHeader.displayName = "Header";
  return MockHeader;
});

jest.mock("@/components/Footer", () => {
  const MockFooter = () => <div data-testid="footer" />;
  MockFooter.displayName = "Footer";
  return MockFooter;
});

// --- Mock next/navigation ---
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// --- Import the component under test ---
import MyCollection from "../page";

// --- Typed Fetch Mock ---
beforeAll(() => {
  global.fetch = jest.fn((url: string): Promise<Response> => {
    if (url === "/api/quizzes/user") {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          hosted_quizzes: [],
          participated_quizzes: [],
        }),
      } as Response);
    }

    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    } as Response);
  }) as jest.Mock;
});

describe("MyCollection Page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });

  it("always renders the Hosted and Played section titles", async () => {
    render(<MyCollection />);

    // Hosted Quizzes header should be rendered
    expect(await screen.findByText(/Hosted Quizzes/i)).toBeInTheDocument();
    // Played Quizzes header should be rendered
    expect(screen.getByText(/Played Quizzes/i)).toBeInTheDocument();
  });
});
