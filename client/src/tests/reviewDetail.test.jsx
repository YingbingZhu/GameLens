// src/components/ReviewDetails.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import ReviewDetail from '../components/ReviewDetail';
import { MemoryRouter } from 'react-router-dom';

// Mock the Auth0 hook
jest.mock('@auth0/auth0-react');

global.fetch = jest.fn();

const mockReview = {
    id: 1,
    title: 'Great Game!',
    content: 'This game is amazing!',
    star: 5,
    game: { name: 'Game Title' },
    user: { id: 1, email: 'user@example.com', nickname: 'User123' },
  };

describe('ReviewDetails Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('renders loading state initially', async () => {
        useAuth0.mockReturnValue({
          getAccessTokenSilently: jest.fn(),
          user: {},
          isAuthenticated: false,
        });
    
        fetch.mockImplementationOnce(() =>
            new Promise((resolve) => setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve(mockReview),
            }), 100))
          );
    
        await act(async () => {
            render(
              <MemoryRouter>
                <ReviewDetail />
              </MemoryRouter>
            );
          });
    
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });

      test('renders review details correctly', async () => {
        useAuth0.mockReturnValue({
          getAccessTokenSilently: jest.fn(),
          user: {},
          isAuthenticated: false,
        });
    
        fetch.mockResolvedValueOnce({
          json: () => Promise.resolve(mockReview),
        });
    
        await act(async () => {
            render(
              <MemoryRouter>
                <ReviewDetail />
              </MemoryRouter>
            );
          });
    
        await waitFor(() => {
          expect(screen.getByText('Great Game!')).toBeInTheDocument();
          expect(screen.getByText('Game Title')).toBeInTheDocument();
          expect(screen.getByText('This game is amazing!')).toBeInTheDocument();
          expect(screen.getByText('User123')).toBeInTheDocument();
        });
    });

    test('renders follow button when not owner and authenticated', async () => {
        useAuth0.mockReturnValue({
          getAccessTokenSilently: jest.fn(),
          user: { email: 'anotheruser@example.com' },
          isAuthenticated: true,
        });
    
        fetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockReview),
        }).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve([]), // Mock followings response
        });
    
        await act(async () => {
          render(
            <MemoryRouter>
              <ReviewDetail />
            </MemoryRouter>
          );
        });
    
        await waitFor(() => {
          expect(screen.getByText('Follow')).toBeInTheDocument();
        });
      });
    
    
});