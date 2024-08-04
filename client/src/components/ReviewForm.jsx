import React, { useState } from 'react';
import { useAuth0 } from "@auth0/auth0-react";
import '../style/reviewForm.css';

export default function ReviewForm({ onReviewSubmitted }) {
  const { isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [gameName, setGameName] = useState('');
  const [title, setTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Handle rating click
  const handleRatingClick = (ratingValue) => {
    setRating(ratingValue);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      setError('You must be logged in to submit a review.');
      return;
    }

    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gameName,
          title, 
          reviewContent,
          rating,
        }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      setSuccess('Review submitted successfully!');
      setGameName('');
      setTitle(''); 
      setReviewContent('');
      setRating('');
      setError(null);
      // Call the callback function to fetch recent reviews
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      setError(error.message);
      setSuccess(null);
    }
  };


  return (
    <div className="review-form-container">
      <h2>Write Your Review</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
      <form id="review-form" onSubmit={handleSubmit}>
        <div id="rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg
              key={star}
              className="star"
              id={star}
              viewBox="0 12.705 512 486.59"
              x="0px"
              y="0px"
              xmlSpace="preserve"
              style={{ fill: star <= rating ? '#f39c12' : '#808080' }}
              onClick={() => handleRatingClick(star)}
            >
              <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
            </svg>
          ))}
        </div>
        <span id="starsInfo" className="help-block">
          Click on a star to change your rating 1 - 5, where 5 = great! and 1 = really bad
        </span>
        <div className="form-group">
        <label htmlFor="game-name">Game:</label>
          <input
            className="form-control"
            type="text"
            placeholder="Game Name"
            name="game-name"
            id="game-name"
            value={gameName}
            onChange={(e) => setGameName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="title">Title:</label>
          <input
            className="form-control"
            type="text"
            placeholder="Title"
            name="title"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label className="control-label" htmlFor="review">Your Review:</label>
          <textarea
            className="form-control"
            rows="10"
            placeholder="Your Review"
            name="review"
            id="review"
            value={reviewContent}
            onChange={(e) => setReviewContent(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Submit</button>
        <span id="submitInfo" className="help-block">
          By clicking <strong>Submit</strong>, I authorize the sharing of my review on the web. 
        </span>
      </form>
    </div>
  );
};

