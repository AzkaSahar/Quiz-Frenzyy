/**
 * @jest-environment node
 */
import 'openai/shims/node';
import { POST } from '../route';
import * as dbConfig from '@/dbConfig/dbConfig';
import mongoose from 'mongoose';
import Answer from '@/models/answerModel';
import Question from '@/models/questionModel';
import PlayerQuiz from '@/models/playerQuizModel';
import UserNew from '@/models/userModel';
import type { NextRequest } from 'next/server';

jest.mock('@/dbConfig/dbConfig', () => ({ connect: jest.fn() }));

jest.mock('@/models/answerModel', () => ({
  __esModule: true,
  default: {
    insertMany: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.mock('@/models/questionModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('@/models/playerQuizModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

jest.mock('@/models/userModel', () => ({
  __esModule: true,
  default: {
    findById: jest.fn()
  }
}));

// Helper interfaces
interface MockedPlayerQuiz {
  player_id: string;
  session_id: string;
  score: number;
  save: jest.Mock;
  completed_at?: Date;
}

interface MockedUser {
  total_points: number;
  save: jest.Mock;
}

interface MockedQuestion {
  question_type: 'MCQ' | 'Ranking';
  correct_answer: string | string[];
  points: number;
}

interface AnswerPayload {
  player_quiz_id: string;
  answers: { question_id: string; submitted_answer: string | string[] }[];
}

interface MockedAnswerDoc {
  player_quiz_id: mongoose.Types.ObjectId;
  question_id: mongoose.Types.ObjectId;
  submitted_answer: string | string[];
  is_correct: boolean;
  points: number;
}

// Utility to create a mocked NextRequest
function makeReq(body: Partial<AnswerPayload>): NextRequest {
  return {
    json: async () => body
  } as unknown as NextRequest;
}

describe('POST /api/quizzes/complete', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
  });

  it('400 if player_quiz_id or answers missing', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: 'Player quiz Id and answers are required'
    });
  });

  it('404 if player quiz not found', async () => {
    (PlayerQuiz.findById as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeReq({
      player_quiz_id: '507f1f77bcf86cd799439011',
      answers: [{ question_id: '507f1f77bcf86cd799439012', submitted_answer: 'foo' }]
    }));

    expect(PlayerQuiz.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Player quiz not found' });
  });

  it('500 if question lookup fails', async () => {
    const playerQuiz: MockedPlayerQuiz = {
      player_id: 'u1',
      session_id: 's1',
      score: 0,
      save: jest.fn()
    };

    (PlayerQuiz.findById as jest.Mock).mockResolvedValue(playerQuiz);
    (Question.findById as jest.Mock).mockResolvedValue(null);

    const res = await POST(makeReq({
      player_quiz_id: '507f1f77bcf86cd799439011',
      answers: [{ question_id: '507f1f77bcf86cd799439012', submitted_answer: 'foo' }]
    }));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Internal server error' });
  });

  it('200 happy path: processes answers, updates quiz & user', async () => {
    const playerQuiz: MockedPlayerQuiz = {
      player_id: 'user1',
      session_id: 'sess1',
      score: 0,
      save: jest.fn().mockResolvedValue(undefined)
    };
    (PlayerQuiz.findById as jest.Mock).mockResolvedValue(playerQuiz);

    const question1: MockedQuestion = {
      question_type: 'MCQ',
      correct_answer: 'Yes',
      points: 3
    };
    const question2: MockedQuestion = {
      question_type: 'Ranking',
      correct_answer: ['A', 'B'],
      points: 2
    };
    (Question.findById as jest.Mock)
      .mockResolvedValueOnce(question1)
      .mockResolvedValueOnce(question2);

    const inserted: MockedAnswerDoc[] = [];
    (Answer.insertMany as jest.Mock).mockImplementation((docs: MockedAnswerDoc[]) => {
      inserted.push(...docs);
      return Promise.resolve(docs);
    });

    (Answer.aggregate as jest.Mock).mockResolvedValue([{ total: 5 }]);

    const user: MockedUser = {
      total_points: 10,
      save: jest.fn().mockResolvedValue(undefined)
    };
    (UserNew.findById as jest.Mock).mockResolvedValue(user);

    const res = await POST(makeReq({
      player_quiz_id: '507f1f77bcf86cd799439011',
      answers: [
        { question_id: '507f1f77bcf86cd799439012', submitted_answer: 'yes' },
        { question_id: '507f1f77bcf86cd799439013', submitted_answer: ['A', 'B'] }
      ]
    }));

    expect(Question.findById).toHaveBeenCalledTimes(2);

    expect(Answer.insertMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          player_quiz_id: expect.any(mongoose.Types.ObjectId),
          question_id: expect.any(mongoose.Types.ObjectId),
          submitted_answer: 'yes',
          is_correct: true,
          points: 3
        }),
        expect.objectContaining({
          submitted_answer: ['A', 'B'],
          is_correct: true,
          points: 2
        })
      ])
    );

    expect(Answer.aggregate).toHaveBeenCalledWith([
      { $match: { player_quiz_id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011') } },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    expect(playerQuiz.score).toBe(5);
    expect(playerQuiz.completed_at).toEqual(new Date('2025-01-01T00:00:00Z'));
    expect(playerQuiz.save).toHaveBeenCalled();

    expect(user.total_points).toBe(15);
    expect(user.save).toHaveBeenCalled();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      success: true,
      session_id: 'sess1',
      score: 5,
      completed_at: new Date('2025-01-01T00:00:00Z')
    });
  });
});
