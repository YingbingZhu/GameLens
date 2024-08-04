import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReviewList from '../components/ReviewList';

// Mock the fetch API
global.fetch = jest.fn();

const mockReviews = [
    {
      id: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
      title: 'Review 1',
      user: { nickname: 'Reviewer 1' },
      game: { name: 'Game 1' },
      star: 5,
      content: 'Review content 1'
    },
    {
      id: 2,
      createdAt: '2024-02-01T00:00:00.000Z',
      title: 'Review 2',
      user: { nickname: 'Reviewer 2' },
      game: { name: 'Game 2' },
      star: 4,
      content: 'Review content 2'
    },
  ];
describe('ReviewList Component Tests', () => {
    test('displays "No Reviews Available" when there are no reviews', () => {
      render(
        <MemoryRouter>
          <ReviewList reviews={[]} />
        </MemoryRouter>
      );
  
      expect(screen.getByText('No Reviews Available')).toBeInTheDocument();
    });
  
    test('displays reviews correctly', () => {
      render(
        <MemoryRouter>
          <ReviewList reviews={mockReviews} />
        </MemoryRouter>
      );
  
      // Check the first review
      expect(screen.getByText('Review 1')).toBeInTheDocument();
      expect(screen.getByText('Reviewer 1')).toBeInTheDocument();
      expect(screen.getByText('Game: Game 1')).toBeInTheDocument();
      expect(screen.getByText('Review content 1')).toBeInTheDocument();
  
      // Check the second review
      expect(screen.getByText('Review 2')).toBeInTheDocument();
      expect(screen.getByText('Reviewer 2')).toBeInTheDocument();
      expect(screen.getByText('Game: Game 2')).toBeInTheDocument();
      expect(screen.getByText('Review content 2')).toBeInTheDocument();
    });
  });