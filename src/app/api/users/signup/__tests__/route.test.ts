/**
 * @jest-environment node
 */
import { POST } from '../route'
import { connect } from '@/dbConfig/dbConfig'
import User from '@/models/userModel'
import { NextRequest } from 'next/server'

jest.mock('@/dbConfig/dbConfig', () => ({ connect: jest.fn() }))
jest.mock('@/models/userModel')

const mockedConnect = connect as jest.Mock
const mockedFindOne = User.findOne as jest.Mock
const MockUser = User as jest.MockedClass<typeof User>

describe('POST /api/users/signup route', () => {
  beforeEach(() => {
    mockedConnect.mockClear()
    mockedFindOne.mockClear()
    MockUser.mockClear()
  })

  it('returns 400 when fields are missing', async () => {
    const req = {
      json: jest.fn().mockResolvedValue({
        username: '',
        email: '',
        password: '',
      }),
    } as unknown as NextRequest

    const res = await POST(req)
    if (!res) {
      throw new Error('Expected a Response, but got undefined')
    }

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'All fields are required' })
  })

  it('returns 400 if user already exists', async () => {
    mockedConnect.mockResolvedValue(undefined)
    mockedFindOne.mockResolvedValue({ _id: 'u1' })

    const req = {
      json: jest.fn().mockResolvedValue({
        username: 'a',
        email: 'a@b.com',
        password: 'p',
      }),
    } as unknown as NextRequest

    const res = await POST(req)
    if (!res) {
      throw new Error('Expected a Response, but got undefined')
    }

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'User already exists' })
  })
  it('returns 201 and user on success', async () => {
    mockedConnect.mockResolvedValue(undefined)
    mockedFindOne.mockResolvedValue(null)

    const mockSave = jest.fn().mockResolvedValue({
      _id: 'u1',
      username: 'a',
      email: 'a@b.com',
    })

    type MockedUserInstance = {
      save: () => Promise<{ _id: string; username: string; email: string }>
    }

    MockUser.mockImplementation((): MockedUserInstance => ({
      save: mockSave,
    }))

    const req = {
      json: jest.fn().mockResolvedValue({
        username: 'a',
        email: 'a@b.com',
        password: 'p',
      }),
    } as unknown as NextRequest

    const res = await POST(req)
    if (!res) {
      throw new Error('Expected a Response, but got undefined')
    }

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({
      message: 'User created successfully',
      success: true,
      user: { _id: 'u1', username: 'a', email: 'a@b.com' },
    })
  })

  it('returns 500 on DB error', async () => {
    mockedConnect.mockRejectedValue(new Error('failDB'))

    const req = {
      json: jest.fn().mockResolvedValue({
        username: 'a',
        email: 'a@b.com',
        password: 'p',
      }),
    } as unknown as NextRequest

    const res = await POST(req)
    if (!res) {
      throw new Error('Expected a Response, but got undefined')
    }

    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'failDB' })
  })
})
