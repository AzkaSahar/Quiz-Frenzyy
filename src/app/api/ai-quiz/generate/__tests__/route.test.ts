/**
 * @jest-environment node
 */
import 'openai/shims/node';

import { type NextRequest } from "next/server";
import { POST } from "../route";
import * as dbConfig from "@/dbConfig/dbConfig";
import Quiz from "@/models/quizModel";
import Question from "@/models/questionModel";
import UserNew from "@/models/userModel";
import jwt from "jsonwebtoken";
import OpenAI from "openai";
import { type RequestCookie } from "next/dist/compiled/@edge-runtime/cookies";

jest.mock("@/dbConfig/dbConfig", () => ({ connect: jest.fn() }));
jest.mock("@/models/quizModel");
jest.mock("@/models/questionModel");
jest.mock("@/models/userModel");
jest.mock("jsonwebtoken");
jest.mock("openai");

describe("POST /api/ai-quiz/generate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  function makeReq(
    body: Record<string, unknown>,
    token?: string
  ): NextRequest {
    return {
      json: async () => body,
      cookies: {
        get: (_: string): RequestCookie | undefined =>
          token
            ? {
                name: "token",
                value: token,
                [Symbol.for("edge-runtime.cookie")]: true,
              } as RequestCookie
            : undefined,
      },
    } as unknown as NextRequest;
  }

  it("returns 201 and new quiz ID on success", async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.GITHUB_TOKEN = "fake-token";

    (jwt.verify as jest.Mock).mockReturnValue({
      id: "507f1f77bcf86cd799439011",
    });

    const fakeContent = JSON.stringify([
      {
        question_text: "Q1?",
        options: ["A", "B", "C", "D"],
        correct_answer: "B",
      },
    ]);

    const mockCreate = jest.fn().mockResolvedValue({
      choices: [{ message: { content: fakeContent } }],
    });

    (OpenAI as any).mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    }));

    const quizInst = {
      _id: "quiz123",
      total_points: 0,
      save: jest.fn().mockResolvedValue({ _id: "quiz123", total_points: 5 }),
    };

    (Quiz as any).mockImplementation(() => quizInst);

    (UserNew.findByIdAndUpdate as jest.Mock).mockResolvedValue({});
    (Question.insertMany as jest.Mock).mockResolvedValue([{}]);

    const req = makeReq(
      {
        topic: "Math",
        numQuestions: 1,
        duration: 10,
        questionConfigs: [{ points: 5 }],
      },
      "valid-token"
    );

    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      quizId: "quiz123",
      message: "AI Quiz generated successfully",
    });

    expect(mockCreate).toHaveBeenCalled();
    expect(quizInst.total_points).toBe(5);
  });
});
