/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";


// 1️⃣ Mock out Header and Footer so they don't run any real logic or fetches
jest.mock("@/components/Header", () => () => <div data-testid="header" />);
jest.mock("@/components/Footer", () => () => <div data-testid="footer" />);


// 2️⃣ Stub next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));


// 3️⃣ Now import the component under test
import MyCollection from "../page";


// 4️⃣ Make sure fetch is a Jest mock before any tests
beforeAll(() => {
  ;(global as any).fetch = jest.fn((url: string) => {
    if (url === "/api/quizzes/user") {
      // return the empty‐list “success” payload
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          hosted_quizzes: [],
          participated_quizzes: [],
        }),
      });
    }
    // any other fetch (sessions-list, header, etc) → harmless empty
    return Promise.resolve({
      ok: true,
      json: async () => ({}),
    });
  });
});


describe("MyCollection smoke test", () => {
  beforeEach(() => {
    // reset any prior mock state
    (global.fetch as jest.Mock).mockClear();
    // stub router.push (unused here, but required)
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
  });


  it("always renders the Hosted and Played section titles", async () => {
    // Act: render the page
    render(<MyCollection />);


    // Assert: wait for the Hosted Quizzes header
    expect(await screen.findByText(/Hosted Quizzes/i)).toBeInTheDocument();
    // And the Played Quizzes header should be there immediately
    expect(screen.getByText(/Played Quizzes/i)).toBeInTheDocument();
  });
});
