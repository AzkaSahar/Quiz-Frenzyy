/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import SignupPage from '../page'
import axios, { AxiosError } from 'axios'

// Axios ko mock kar rahe hain, taake real HTTP request na jaye
jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

// Next.js router.push ko mock karke redirect ko track karenge
const pushMock = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('SignupPage Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    pushMock.mockClear()
  })
  afterEach(() => jest.useRealTimers())

  it('should display success message and redirect after 2 seconds', async () => {
    mockedAxios.post.mockResolvedValue({ status: 201 })

    render(<SignupPage />)

    const usernameInput = screen.getByPlaceholderText('Username')
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'alice' } })
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(screen.getByText('Signup successful!')).toBeInTheDocument()
    )

    await act(async () => {
      jest.advanceTimersByTime(2000)
    })

    expect(pushMock).toHaveBeenCalledWith('/login')
  })

  it('should display error message if signup fails (e.g., user exists)', async () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(true)


    const axiosError: AxiosError = {
      name: 'AxiosError',
      message: 'Request failed',
      config: {
        headers: new axios.AxiosHeaders(), // Required field
      },
      isAxiosError: true,
      toJSON: () => ({}),
      response: {
        data: {
          error: 'User already exists'
        },
        status: 409,
        statusText: 'Conflict',
        headers: new axios.AxiosHeaders(),
        config: {
          headers: new axios.AxiosHeaders()
        }
      }
    }
    mockedAxios.post.mockRejectedValue(axiosError)

    render(<SignupPage />)

    const usernameInput = screen.getByPlaceholderText('Username')
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'alice' } })
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(screen.getByText('User already exists')).toBeInTheDocument()
    )
  })

  it('should display fallback error message on unexpected error', async () => {
    jest.spyOn(axios, 'isAxiosError').mockReturnValue(false)
    mockedAxios.post.mockRejectedValue(new Error('Network error'))

    render(<SignupPage />)

    const usernameInput = screen.getByPlaceholderText('Username')
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    const submitButton = screen.getByRole('button', { name: /sign up/i })

    fireEvent.change(usernameInput, { target: { value: 'alice' } })
    fireEvent.change(emailInput, { target: { value: 'alice@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() =>
      expect(
        screen.getByText('An unexpected error occurred. Please try again.')
      ).toBeInTheDocument()
    )
  })
})
