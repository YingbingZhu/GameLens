import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { MemoryRouter } from 'react-router-dom';
import Profile from '../components/Profile';

// Mock the Auth0 hook
jest.mock('@auth0/auth0-react');

// Mock the fetch API
global.fetch = jest.fn();

const mockUser = {
  nickname: 'John Doe',
  email: 'johndoe@example.com',
  picture: 'http://example.com/picture.jpg',
  sub: 'auth0|123456',
  email_verified: true,
};

const mockProfileData = {
  bio: 'This is my bio.',
  avatar: 'http://example.com/avatar.jpg',
};

const mockReviews = [
  { 
    id: 1, 
    createdAt: '2024-01-01T00:00:00.000Z', 
    title: 'Review 1',
    user: { nickname: 'Reviewer 1' }, 
    game: { name: 'Game 1' },
    star: 5,
    details: 'Review details 1',
  },
  { 
    id: 2, 
    createdAt: '2024-02-01T00:00:00.000Z', 
    title: 'Review 2',
    user: { nickname: 'Reviewer 2' }, 
    game: { name: 'Game 2' },
    star: 4,
    details: 'Review details 2',
  },
];

const mockFollowers = [
  { id: 1, nickname: 'Follower 1', picture: 'http://example.com/follower1.jpg' },
  { id: 2, nickname: 'Follower 2', picture: 'http://example.com/follower2.jpg' },
];

const mockFollowing = [
  { id: 1, nickname: 'Following 1', picture: 'http://example.com/following1.jpg' },
  { id: 2, nickname: 'Following 2', picture: 'http://example.com/following2.jpg' },
];

describe('Profile Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useAuth0.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      getAccessTokenSilently: jest.fn().mockResolvedValue('fake-token'),
    });

    fetch.mockImplementation((url) => {
      if (url.endsWith('/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProfileData),
        });
      }
      if (url.endsWith('/me/reviews')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockReviews),
        });
      }
      if (url.endsWith('/me/followers')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFollowers),
        });
      }
      if (url.endsWith('/me/followings')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFollowing),
        });
      }
      return Promise.reject(new Error('not found'));
    });
  });

  test('displays user information correctly', async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Profile />
        </MemoryRouter>
      );
    });

    // Check user profile information
    expect(screen.getByText((content, element) => content.includes(`${mockUser.nickname}`))).toBeInTheDocument();
    const profileImage = screen.getByAltText(mockUser.nickname);
    expect(profileImage).toBeInTheDocument();
    expect(profileImage).toHaveAttribute('src', mockProfileData.avatar);

    // Check bio
    await waitFor(() => {
      expect(screen.getByText((content, element) => content.includes(`${mockProfileData.bio}`))).toBeInTheDocument();
    });

    // Check reviews
    await waitFor(() => {
      expect(screen.getByText('Review 1')).toBeInTheDocument();
      expect(screen.getByText('Game: Game 1')).toBeInTheDocument();
      expect(screen.getByText('Review details 1')).toBeInTheDocument();

      expect(screen.getByText('Review 2')).toBeInTheDocument();
      expect(screen.getByText('Game: Game 2')).toBeInTheDocument();
      expect(screen.getByText('Review details 2')).toBeInTheDocument();
    });

    // Check followers
    await waitFor(() => {
      expect(screen.getByText('Follower 1')).toBeInTheDocument();
      expect(screen.getByText('Follower 2')).toBeInTheDocument();
    });

    // Check following
    await waitFor(() => {
      expect(screen.getByText('Following 1')).toBeInTheDocument();
      expect(screen.getByText('Following 2')).toBeInTheDocument();
    });
  });
});
