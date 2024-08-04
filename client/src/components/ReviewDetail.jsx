import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import '../style/reviewDetail.css';

export default function ReviewDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getAccessTokenSilently, user, isAuthenticated } = useAuth0();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [star, setStar] = useState(1);
  const [gameName, setGameName] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  
  // Fetch review details when the component mounts
  useEffect(() => {
    const fetchReview = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/review/${id}`);
        const data = await response.json();
        setReview(data);
        setTitle(data.title);
        setContent(data.content);
        setStar(data.star);
        setGameName(data.game.name);
        if (isAuthenticated) {
          setIsOwner(data.user.email === user.email);
          const token = await getAccessTokenSilently();
          const followingResponse = await fetch(`${process.env.REACT_APP_API_URL}/me/followings`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          const followings = await followingResponse.json();
          const isFollowing = followings.some(f => f.id === data.user.id);
          setIsFollowing(isFollowing);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching review:', error);
        setLoading(false);
      }
    };

    fetchReview();
  }, [id, getAccessTokenSilently, isAuthenticated, user]);

   // Handle review update
  const handleUpdate = async () => {
    if (!window.confirm('Are you sure you want to update this review?')) {
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${process.env.REACT_APP_API_URL}/review/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, reviewContent: content, rating: star, gameName }),
      });
      // Refetch the updated review details
      const response = await fetch(`${process.env.REACT_APP_API_URL}/review/${id}`);
      const updatedReview = await response.json();
      setReview(updatedReview);
      setTitle(updatedReview.title);
      setContent(updatedReview.content);
      setStar(updatedReview.star);
      setGameName(updatedReview.game.name);
      alert('Review updated successfully');
      closeModal();
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  // Handle review deletion
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }
    try {
      const token = await getAccessTokenSilently();
      await fetch(`${process.env.REACT_APP_API_URL}/review/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert('Review deleted successfully');
      navigate('/profile');
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  // Handle follow/unfollow actions
  const handleFollowClick = async () => {
    if (user.email === review.user.email) {
      alert('You cannot follow yourself.');
      return;
    }

    const token = await getAccessTokenSilently();
    const method = isFollowing ? 'DELETE' : 'POST';
    await fetch(`${process.env.REACT_APP_API_URL}/follow/${review.user.id}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    setIsFollowing(!isFollowing);
  };

  // Open/close the update modal
  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const StarRating = ({ rating }) => (
    <div className="stars-container">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`star ${star <= rating ? 'filled' : ''}`}
          viewBox="0 12.705 512 486.59"
        >
          <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
        </svg>
      ))}
    </div>
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!review) {
    return <div>Review not found</div>;
  }

  return (
    <div className="review-details">
      <h2>{review.title}</h2>
      <p><strong>Game:</strong> {review.game.name}</p>
      <div><strong>Rating:</strong> <StarRating rating={review.star} /></div>
      <p><strong>Content:</strong> {review.content}</p>
      <p><strong>User:</strong> {review.user.nickname}</p>

      {isAuthenticated && !isOwner && (
        <button onClick={() => handleFollowClick(review.user.id)}>
          {isFollowing ? "Unfollow" : "Follow"}
        </button>
      )}

      {isOwner && (
        <div>
          <span><button aria-label="open-update-modal" onClick={openModal}>Update Review</button></span>
          <span><button aria-label="delete-review" onClick={handleDelete}>Delete Review</button></span>
        </div>
      )}

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={closeModal}>&times;</span>
            <h3>Update Review</h3>
            <div>
              <label>Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label>Content:</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div>
              <label>Rating:</label>
              <input
                type="number"
                value={star}
                onChange={(e) => setStar(e.target.value)}
                min="1"
                max="5"
              />
            </div>
            <div>
              <label>Game Name:</label>
              <input
                type="text"
                value={gameName}
                onChange={(e) => setGameName(e.target.value)}
              />
            </div>
            <button aria-label="submit-update" onClick={handleUpdate}>Update Review</button>
          </div>
        </div>
      )}
    </div>
  );
};
