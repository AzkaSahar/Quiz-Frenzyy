import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Profile from "../page"; // Adjust the import path as needed
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Mock the required modules
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("react-hot-toast", () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe("Profile Component", () => {
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter); // Type the useRouter mock correctly
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders user profile info when fetch is successful", async () => {
    const mockUser = {
      username: "john_doe",
      email: "john.doe@example.com",
      total_points: 100,
      isVerified: true,
      badges: [],
      hosted_quizzes: [],
      createdAt: "2023-01-01",
    };

    // Mock the fetch call
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true, user: mockUser }),
    });

    render(<Profile />);

    // Wait for the component to finish loading and rendering
    await waitFor(() => screen.getByText("john_doe"));

    // Assert that the profile data is displayed
    expect(screen.getByText("john_doe")).toBeInTheDocument();
    expect(screen.getByText("Email: john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  test("shows error message when profile fetch fails", async () => {
    // Mock the fetch call to simulate a failure
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: false, error: "Unauthorized" }),
    });

    render(<Profile />);

    // Wait for the component to finish loading and rendering
    await waitFor(() => screen.getByText("Unauthorized"));

    // Assert that the error message is displayed
    expect(screen.getByText("Unauthorized")).toBeInTheDocument();
    expect(mockRouter.push).toHaveBeenCalledWith("/login");
  });
});
