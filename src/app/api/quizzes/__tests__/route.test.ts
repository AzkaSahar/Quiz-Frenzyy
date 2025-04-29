import 'openai/shims/node'; // in case you need Node shims
import { POST } from "../route";
import * as dbConfig from "@/dbConfig/dbConfig";
import Quiz from "@/models/quizModel";
import UserNew from "@/models/userModel";
import Question from "@/models/questionModel";
import mongoose from "mongoose";
import { NextRequest } from "next/server";

// Mocking models
jest.mock("@/dbConfig/dbConfig", () => ({ connect: jest.fn() }));
jest.mock("@/models/quizModel");
jest.mock("@/models/userModel");
jest.mock("@/models/questionModel");

// Define types based on quizModel schema
type QuizRequestBody = {
  title: string;
  description: string;
  created_by: string;
  duration: number;
  questions: Array<{
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    points: number;
  }>;
};

describe("POST /api/quiz", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  function makeReq(body: QuizRequestBody): NextRequest {
    return { json: async () => body } as NextRequest;
  }

  it("returns 400 when title is missing", async () => {
    const res = await POST(
      makeReq({
        title: "",
        description: "Desc",
        created_by: "u1",
        duration: 5,
        questions: []
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Quiz title is required" });
  });

  it("returns 400 when description is missing", async () => {
    const res = await POST(
      makeReq({
        title: "T",
        description: "",
        created_by: "u1",
        duration: 5,
        questions: []
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Quiz description is required" });
  });

  it("returns 400 when created_by is missing", async () => {
    const res = await POST(
      makeReq({
        title: "T",
        description: "Desc",
        created_by: "",
        duration: 5,
        questions: []
      })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Creator ID is required" });
  });

  it("returns 201 and quiz on success", async () => {
    const quizInst = {
      _id: "quiz123",
      save: jest.fn().mockResolvedValue(undefined),
    } as unknown as { _id: string; save: jest.Mock };
    

    (Quiz as unknown as jest.Mock).mockImplementation(() => quizInst);
    (UserNew.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    (Question.insertMany as jest.Mock).mockResolvedValue([]);
    (Question.aggregate as jest.Mock).mockResolvedValue([{ total: 42 }]);

    const body: QuizRequestBody = {
      title: "T",
      description: "Desc",
      created_by: "507f1f77bcf86cd799439011",
      duration: 5,
      questions: [
        { question_text: "Question", question_type: "MCQ", options: ["A", "B"], correct_answer: "A", points: 10 }
      ]
    };

    const res = await POST(makeReq(body));

    expect(dbConfig.connect).toHaveBeenCalled();
    expect(quizInst.save).toHaveBeenCalled();
    expect(UserNew.findByIdAndUpdate).toHaveBeenCalledWith(
      body.created_by,
      { $addToSet: { hosted_quizzes: quizInst._id } },
      { new: true }
    );
    expect(Question.insertMany).toHaveBeenCalled();
    expect(Question.aggregate).toHaveBeenCalled();

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.quiz._id).toBe("quiz123");
  });

  it("returns 400 on mongoose validation error", async () => {
    // Create a ValidationError instance with 'undefined' as the argument
    const ve = new mongoose.Error.ValidationError(undefined);
  
    // Correctly assign the 'errors' property with the right type
    ve.errors = {
      title: new mongoose.Error.ValidatorError({
        message: "Invalid title",
        path: "title",
        value: "Bad"
      })
    };
  
    // Mock the save method to reject with the ValidationError
    (Quiz as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(ve)
    }));
  
    const res = await POST(
      makeReq({ title: "Bad", description: "D", created_by: "u1", duration: 5, questions: [] })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid title" });
  });
  

  it("returns 500 on unexpected error", async () => {
    (Quiz as unknown as jest.Mock).mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(new Error("db crash"))
    }));

    const res = await POST(
      makeReq({ title: "T", description: "D", created_by: "u1", duration: 5, questions: [] })
    );
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
