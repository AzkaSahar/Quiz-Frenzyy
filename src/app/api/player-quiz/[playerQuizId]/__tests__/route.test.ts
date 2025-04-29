/**
 * @jest-environment node
 */
import { GET } from "../route";
import * as dbConfig from "@/dbConfig/dbConfig";
import PlayerQuiz from "@/models/playerQuizModel";
import { NextRequest } from "next/server";

jest.mock("@/dbConfig/dbConfig", () => ({ connect: jest.fn() }));
jest.mock("@/models/playerQuizModel");

describe("GET /api/player-quiz/[playerQuizId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  // Mocked NextRequest with only the properties you need (even if it's empty)
  function makeReq(): NextRequest {
    return {} as unknown as NextRequest;
  }

  // Type-safe mock context with 'params'
  function makeCtx(id: string): { params: Promise<{ playerQuizId: string }> } {
    return { params: Promise.resolve({ playerQuizId: id }) };
  }
  

  it("400 when no ID provided", async () => {
    const res = await GET(makeReq(), makeCtx(""));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Player Quiz Id is required" });
  });

  it("404 when quiz not found", async () => {
    (PlayerQuiz.findById as jest.Mock).mockResolvedValue(null);

    const res = await GET(makeReq(), makeCtx("507f1f77bcf86cd799439011"));
    expect(dbConfig.connect).toHaveBeenCalled();
    expect(PlayerQuiz.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Player quiz not found" });
  });

  it("200 and data on success", async () => {
    const fake = {
      session_id: "sess42",
      score: 88,
      completed_at: "2025-04-28T12:00:00Z",
    };
    (PlayerQuiz.findById as jest.Mock).mockResolvedValue(fake);

    const res = await GET(makeReq(), makeCtx("507f1f77bcf86cd799439011"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      session_id: "sess42",
      score: 88,
      completed_at: "2025-04-28T12:00:00Z",
    });
  });

  it("500 on unexpected error", async () => {
    (PlayerQuiz.findById as jest.Mock).mockImplementation(() => {
      throw new Error("db crash");
    });

    const res = await GET(makeReq(), makeCtx("507f1f77bcf86cd799439011"));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
