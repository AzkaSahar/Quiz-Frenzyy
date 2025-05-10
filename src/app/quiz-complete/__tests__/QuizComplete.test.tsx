import 'whatwg-fetch'; // 👈 Add this line first
import { render, screen } from '@testing-library/react';
import QuizComplete from '@/app/quiz-complete/page'; // adjust as needed
import { useRouter, useSearchParams } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

describe('QuizComplete page (test mode)', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

    const mockSearchParams = new URLSearchParams('player_quiz_id=test123');
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
  });

  it('renders fake test data correctly', async () => {
    render(<QuizComplete />);

    expect(await screen.findByText('Quiz Completed!')).toBeInTheDocument();
    expect(screen.getByText(/Your Score: 95/)).toBeInTheDocument();
    expect(screen.getByText(/Test Mode: Fake quiz results/i)).toBeInTheDocument();
  });
});
