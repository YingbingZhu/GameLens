import React from 'react';
import { Link } from 'react-router-dom';
import '../style/reviewList.css';

export default function ReviewList({ reviews }) {
  // Render message if there are no reviews
  if (reviews.length === 0) {
    return <h2>No Reviews Available</h2>;
  }

  return (
    <div className="review-list-container">
      {reviews.map((review) => (
        <div key={review.id} className={review.isFollowed ? 'followed-review' : 'review-item'}>
          <header>
            <strong className="review-title">
              <Link to={`/review/${review.id}`}>
              {review.title}
              </Link>
            </strong>
            <div className="review-meta">
              
              <span> By <em>{review.user.nickname}</em></span>
              <span className="game-tag">Game: {review.game.name}</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="star"
                  viewBox="0 12.705 512 486.59"
                  style={{ fill: star <= review.star ? '#f39c12' : '#808080' }}
                >
                  <polygon points="256.814,12.705 317.205,198.566 512.631,198.566 354.529,313.435 414.918,499.295 256.814,384.427 98.713,499.295 159.102,313.435 1,198.566 196.426,198.566" />
                </svg>
              ))}
            </div>
          </header>
          <p>{review.content}</p>
        </div>
      ))}
    </div>
  );
}



