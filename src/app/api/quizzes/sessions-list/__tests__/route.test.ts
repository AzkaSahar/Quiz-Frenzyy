import { GET } from '../route'
import { NextRequest, NextResponse } from 'next/server'
import * as dbConfig from '@/dbConfig/dbConfig'
import Session from '@/models/sessionModel'

// Mocks
jest.mock('@/dbConfig/dbConfig', () => ({ connect: jest.fn() }))
jest.mock('@/models/sessionModel', () => ({
  __esModule: true,
  default: {
    find: jest.fn().mockReturnValue({ sort: jest.fn() }),
  },
}))

describe('GET /api/quizzes/sessions-list?quizId=', () => {
  let jsonSpy: jest.SpyInstance
  const connectMock = dbConfig.connect as jest.Mock
  const findMock = (Session.find as jest.Mock)
  const sortMock = (Session.find().sort as jest.Mock)

  beforeAll(() => {
    // Spy on NextResponse.json and keep a reference so we can restore it
    jsonSpy = jest
      .spyOn(NextResponse, 'json')
      .mockImplementation((body, init) => {
        const response = {
          status: init?.status,
          headers: init?.headers,
          json: async () => body,
        }
        return response as unknown as NextResponse
      })
  })

  afterAll(() => {
    // Restore the original
    jsonSpy.mockRestore()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    connectMock.mockResolvedValue(undefined)
    sortMock.mockReturnValue([{ _id: 'session1' }, { _id: 'session2' }])
  })

  function makeReq(url: string): NextRequest {
    return { url } as unknown as NextRequest
  }

  it('400 when quizId missing', async () => {
    const res = await GET(
      makeReq('http://localhost/api/quizzes/sessions-list')
    )
    if (!res) throw new Error('Expected a Response, but got undefined')

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Quiz Id is required' })
  })

  it('200 returns sorted sessions', async () => {
    const url =
      'http://localhost/api/quizzes/sessions-list?quizId=Q1'
    const res = await GET(makeReq(url))
    if (!res) throw new Error('Expected a Response, but got undefined')

    expect(connectMock).toHaveBeenCalled()
    expect(findMock).toHaveBeenCalledWith({ quiz_id: 'Q1' })
    expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      success: true,
      sessions: [
        { _id: 'session1' },
        { _id: 'session2' },
      ],
    })
  })

  it('500 on unexpected error', async () => {
    connectMock.mockRejectedValue(new Error('fail'))
    const res = await GET(
      makeReq(
        'http://localhost/api/quizzes/sessions-list?quizId=Q1'
      )
    )
    if (!res) throw new Error('Expected a Response, but got undefined')

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({
      error: 'Internal server error',
    })
  })
})