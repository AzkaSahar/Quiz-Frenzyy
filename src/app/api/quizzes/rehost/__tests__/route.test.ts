import 'openai/shims/node';
import { POST } from '../route';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { RequestCookies } from 'next/dist/compiled/@edge-runtime/cookies';
import { Model } from 'mongoose';
import * as dbConfig from '@/dbConfig/dbConfig';
import Quiz from '@/models/quizModel';
import Session from '@/models/sessionModel';
import UserNew from '@/models/userModel';
import jwt from 'jsonwebtoken';

// ────────────────────────────────────────────────────────────────────────────────
// Mock Cookies Object
// ────────────────────────────────────────────────────────────────────────────────
const mockCookies = {
  get(_name: string) {
    return _name === 'authToken' ? { name: _name, value: 'mock-token' } : undefined;
  },
  has(_name: string) {
    return _name === 'authToken';
  },
  set(_name: string, _value: string) {
    return this;
  },
  delete(_name: string) {
    return this;
  },
  getAll(_name: string) {
    return [];
  },
  clear() {
    return this;
  },
  size: 1,
  [Symbol.iterator]: function* () {
    yield ['authToken', { name: 'authToken', value: 'mock-token' }];
  },
};

// ────────────────────────────────────────────────────────────────────────────────
// Request Factory
// ────────────────────────────────────────────────────────────────────────────────
function makeReq(body: object, token?: string): Partial<NextRequest> {
  const cookies: RequestCookies = {
    ...mockCookies,
    get(_name: string) {
      return _name === 'authToken' && token ? { name: _name, value: token } : undefined;
    },
    has(_name: string) {
      return _name === 'authToken' && !!token;
    },
  } as unknown as RequestCookies;

  return {
    json: async () => body,
    cookies,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────────────────────────────────────
jest.mock('@/dbConfig/dbConfig', () => ({ connect: jest.fn() }));

jest.mock('@/models/quizModel', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('@/models/sessionModel', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    _id: 'NEW_SESSION_ID',
    join_code: 'JOIN123',
    start_time: new Date(),
    end_time: new Date(),
    is_active: true,
    save: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/models/userModel', () => ({
  __esModule: true,
  default: { findByIdAndUpdate: jest.fn() },
}));

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

// ────────────────────────────────────────────────────────────────────────────────
// Monkey Patch NextResponse
// ────────────────────────────────────────────────────────────────────────────────
beforeAll(() => {
  jest
    .spyOn(NextResponse, 'json')
    .mockImplementation((body, init) => ({
      status: init?.status,
      headers: init?.headers,
      json: async () => body,
    }) as unknown as NextResponse);
});

afterAll(() => {
  (NextResponse.json as jest.Mock).mockRestore();
});

// ────────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────────
describe('POST /api/quizzes/rehost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dbConfig.connect as jest.Mock).mockResolvedValue(undefined);
    (jwt.verify as jest.Mock).mockReturnValue({ id: 'USER123' });
  });

  it('201 happy path: creates session & updates user', async () => {
    (Quiz.findById as jest.Mock).mockResolvedValue({ _id: 'Q1', duration: 20 });
    (UserNew.findByIdAndUpdate as jest.Mock).mockResolvedValue({
      _id: 'USER123',
      hosted_quizzes: ['Q1'],
    });

    const req = makeReq({ quizId: 'Q1', duration: 15 }, 'tok') as NextRequest;
    const res = await POST(req);

    expect(dbConfig.connect).toHaveBeenCalled();
    expect(jwt.verify).toHaveBeenCalledWith('tok', process.env.JWT_SECRET!);
    expect(Quiz.findById).toHaveBeenCalledWith('Q1');

    const SessionMock = Session as unknown as jest.Mock<Model<Record<string, unknown>>>;
    expect(SessionMock.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        quiz_id: 'Q1',
        is_active: true,
        start_time: expect.any(Date),
        end_time: expect.any(Date),
      })
    );

    const sessionInstance = SessionMock.mock.results[0].value;
    expect(sessionInstance.save).toHaveBeenCalled();

    expect(UserNew.findByIdAndUpdate).toHaveBeenCalledWith(
      'USER123',
      { $addToSet: { hosted_quizzes: 'Q1' } },
      { new: true }
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({
      success: true,
      sessionId: 'NEW_SESSION_ID',
      join_code: 'JOIN123',
      message: 'New session created successfully',
    });
  });
});
