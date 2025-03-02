import { NextRequest, NextResponse } from "next/server";
import Session from "@/models/sessionModel";
import PlayerQuiz from "@/models/playerQuizModel";
import { connect } from "@/dbConfig/dbConfig";

connect();

export async function GET(request: NextRequest) {
  try {
    // Extract join code from URL (last segment)
    const pathSegments = request.nextUrl.pathname.split("/");
    const joinCode = pathSegments[pathSegments.length - 1];

    console.log("🔍 Searching for session with join code:", joinCode);

    if (!joinCode) {
      return NextResponse.json({ error: "Join Code is required" }, { status: 400 });
    }

    // Find the session with the given join code
    const session = await Session.findOne({ join_code: joinCode }).populate("quiz_id");
    if (!session) {
      return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
    }

    // Check if the session has expired
    const now = new Date();
    if (session.end_time && now > session.end_time) {
      if (session.is_active) {
        session.is_active = false;
        await session.save();
      }
      return NextResponse.json({ error: "Session expired" }, { status: 400 });
    }

    // Retrieve user ID from headers (or your auth system)
    const user = request.headers.get("x-user-id");
    if (!user) {
      console.error("❌ User authentication missing.");
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }
    console.log("✅ Found user:", user);

    // Check if the player already joined this session
    const existingPlayerQuiz = await PlayerQuiz.findOne({ session_id: session._id, player_id: user });
    if (existingPlayerQuiz) {
      return NextResponse.json({ error: "Player already joined this session" }, { status: 400 });
    }

    // If not, create a new PlayerQuiz record
    const playerQuiz = new PlayerQuiz({
      session_id: session._id,
      quiz_id: session.quiz_id._id,
      player_id: user,
      score: 0,
    });
    await playerQuiz.save();

    console.log("✅ Player assigned to session:", playerQuiz);

    return NextResponse.json({
      success: true,
      session_id: session._id,
      player_quiz_id: playerQuiz._id,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error joining quiz:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
