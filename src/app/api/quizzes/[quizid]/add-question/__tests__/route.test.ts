/**
 * @jest-environment node
 */
import 'openai/shims/node';
import { POST } from "../route";
import * as dbConfig from "@/dbConfig/dbConfig";
import QuestionNews from "@/models/questionModel";
import { NextRequest } from "next/server";

// Mocking the database connection and QuestionNews model
jest.mock("@/dbConfig/dbConfig", () => ({ connect: jest.fn() }));
jest.mock("@/models/questionModel");

describe("POST /api/quiz/[quizid]/question", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the database connection to avoid real DB requests
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  // Type 'Record<string, any>' instead of 'any'
  function makeReq(body: Record<string, any>): NextRequest {
    return { 
      json: async () => body 
    } as NextRequest; // Use 'NextRequest' to ensure correct typing
  }

  // Type '{ params: { quizid: string } }' instead of 'any'
  function makeCtx(id: string): { params: { quizid: string } } {
    return { params: { quizid: id } };
  }

  it("returns 400 if required fields are missing", async () => {
    const res = await POST(
      makeReq({ question_type: "MCQ", options: ["A", "B"] }),
      makeCtx("507f1f77bcf86cd799439011")
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Missing required fields" });
  });

  it("returns 201 when question is created successfully", async () => {
    // Create a mock for the QuestionNews model
    const saveMock = jest.fn().mockResolvedValue(undefined); // Mock the save function

    // Mock the QuestionNews constructor to return an object with 'save'
    const MockedQuestionNews = QuestionNews as jest.MockedClass<typeof QuestionNews>;
    MockedQuestionNews.mockImplementation(() => ({
      save: saveMock
    }));

    const payload = {
      question_text: "What is 2+2?",
      question_type: "MCQ",
      options: ["3", "4", "5", "6"],
      correct_answer: "4"
    };

    const res = await POST(
      makeReq(payload),
      makeCtx("507f1f77bcf86cd799439011")
    );

    // Check if database connection was called
    expect(dbConfig.connect).toHaveBeenCalled();
    
    // Check if QuestionNews model constructor was called with correct parameters
    expect(QuestionNews).toHaveBeenCalledWith({
      quiz_id: "507f1f77bcf86cd799439011",
      ...payload
    });

    // Check if 'save' was called on the created QuestionNews instance
    expect(saveMock).toHaveBeenCalled();

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      message: "Question added successfully"
    });
  });

  it("returns 500 on unexpected errors", async () => {
    // Simulate an error in the 'save' method
    const MockedQuestionNews = QuestionNews as jest.MockedClass<typeof QuestionNews>;
    MockedQuestionNews.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("db crash"))
    }));

    const res = await POST(
      makeReq({
        question_text: "X",
        question_type: "MCQ",
        options: ["A", "B"],
        correct_answer: "A"
      }),
      makeCtx("507f1f77bcf86cd799439011")
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
