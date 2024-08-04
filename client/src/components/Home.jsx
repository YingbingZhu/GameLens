import React, { useEffect, useState } from "react";
import RecentGame from "./RecentGame";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { useAuth0 } from "@auth0/auth0-react";
import '../style/home.css';

export default function Home() {
  const { loginWithRedirect, isAuthenticated, isLoading, getAccessTokenSilently} = useAuth0();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [isAuthenticated]);

  const fetchReviews = async () => {
    try {
      let headers = {
        'Content-Type': 'application/json',
      };

      let url = `${process.env.REACT_APP_API_URL}/reviews`;
      if (isAuthenticated) {
        const token = await getAccessTokenSilently();
        headers = {
          ...headers,
          Authorization: `Bearer ${token}`,
        };
      } else {
        url += '?limit=10';
      }

      const response = await fetch(url, {
        headers: headers,
      });
      const data = await response.json();
      setReviews(data);
      setLoadingReviews(false);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setLoadingReviews(false);
    }
  };

  const WriteReview = () => {
  
    const handleWriteReview = () => {
      if (!isAuthenticated) {
        alert("Please Log in to write review ");
        loginWithRedirect();
      } 
    };
  
    return (
      <button className="btn-primary" onClick={handleWriteReview}>
        Write Review
      </button>
    );
  };
  

  const handleReviewSubmitted = () => {
    fetchReviews();
  };

  return (
    <div className="home">
      <div className="content-section">
        <div className="column">
        {isAuthenticated ? (
            <ReviewForm onReviewSubmitted={handleReviewSubmitted} />
          ) : (
            <WriteReview />
          )}
          <div className="reviews-section">
            {loadingReviews ? (
              <p>Loading reviews...</p>
            ) : (
              <ReviewList reviews={reviews} />
            )}
          </div>
        </div>
        <div className="games-section">
          <RecentGame />
        </div>
      </div>
    </div>
  );
}

