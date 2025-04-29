/**
 * @jest-environment jsdom
 */
import React, { ImgHTMLAttributes } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import Robots from './Robots'


// next/image ko simple <img> banane ke liye mock
jest.mock('next/image', () => {
  const MockImage = (props: ImgHTMLAttributes<HTMLImageElement>) => {
    return <img {...props} />
  }
  MockImage.displayName = 'NextImage'  // satisfy react/display-name
  return MockImage
})


describe('<Robots />', () => {
  beforeAll(() => {
    // Math.random ko deterministic banane ke liye stub
    jest.spyOn(Math, 'random').mockReturnValue(0.5)
  })


  afterAll(() => {
    // original Math.random wapis lao
    ;(Math.random as jest.Mock).mockRestore()
  })


  it('always renders a wrapper div immediately', () => {
    const { container } = render(<Robots />)
    expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
  })


  it('renders 60 images after mount', async () => {
    render(<Robots />)
    await waitFor(() => {
      const imgs = screen.getAllByAltText('Falling Robot')
      expect(imgs).toHaveLength(60)
    })
  })


  it('calculates correct styles for the first robot', async () => {
    render(<Robots />)
    await waitFor(() => screen.getAllByAltText('Falling Robot'))


    const first = screen.getAllByAltText('Falling Robot')[0]
    // spacing = 100/60 ≈ 1.6667 → fixedLeft = 0
    // duration = 25 + 0.5*8 = 29
    // delay = 0.5*30 = 15
    // rotation = 0.5*40 - 20 = 0
    expect(first.style.left).toBe('calc(0vw - 15px)')
    expect(first.style.top).toBe('-10%')
    expect(first.style.animation).toContain('29s linear infinite')
    expect(first.style.animationDelay).toBe('15s')
    expect(first.style.transform).toBe('rotate(0deg)')
  })
})
