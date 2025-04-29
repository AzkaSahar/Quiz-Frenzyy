/**
 * @jest-environment node
 */
import 'openai/shims/node';
import { PATCH } from "../route";
import * as dbConfig from "@/dbConfig/dbConfig";
import PlayerQuiz from "@/models/playerQuizModel";
import { NextRequest } from "next/server";

jest.mock("@/dbConfig/dbConfig", () => ({ connect: jest.fn() }));
jest.mock("@/models/playerQuizModel");

describe("PATCH /api/player-quiz-settings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ham connect() ko stub kar rahe hain taake real DB na lage
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  // Provide specific types for body and the returned object
  function makeReq(body: Record<string, any>): NextRequest {
    return {
      json: async () => body,
    } as NextRequest; // Cast to NextRequest for better type-checking
  }

  it("returns 400 when playerQuizId is missing", async () => {
    const res = await PATCH(
      makeReq({ avatar: "avatar.png", displayName: "John Doe" })
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "PlayerQuizId is required" });
  });

  it("returns 404 when quiz not found", async () => {
    (PlayerQuiz.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

    const res = await PATCH(
      makeReq({
        playerQuizId: "507f1f77bcf86cd799439011",
        avatar: "avatar.png",
        displayName: "John Doe",
      })
    );

    expect(dbConfig.connect).toHaveBeenCalled();
    expect(PlayerQuiz.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { avatar: "avatar.png", displayName: "John Doe" },
      { new: true, runValidators: true }
    );
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Player quiz not found" });
  });

  it("returns 200 and updated quiz on success", async () => {
    const fakeQuiz = {
      _id: "quiz123",
      session_id: "sess1",
      score: 42,
      completed_at: "2025-04-28T12:00:00Z",
      avatar: "avatar.png",
      displayName: "John Doe",
    };
    (PlayerQuiz.findByIdAndUpdate as jest.Mock).mockResolvedValue(fakeQuiz);

    const res = await PATCH(
      makeReq({
        playerQuizId: "507f1f77bcf86cd799439011",
        avatar: "avatar.png",
        displayName: "John Doe",
      })
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      success: true,
      message: "Player quiz updated successfully",
      playerQuiz: fakeQuiz,
    });
  });

  it("returns 500 on unexpected error", async () => {
    (PlayerQuiz.findByIdAndUpdate as jest.Mock).mockImplementation(() => {
      throw new Error("db crash");
    });

    const res = await PATCH(
      makeReq({
        playerQuizId: "507f1f77bcf86cd799439011",
        avatar: "avatar.png",
        displayName: "John Doe",
      })
    );

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Internal server error" });
  });
});
