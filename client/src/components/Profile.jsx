import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from 'react-router-dom';
import "../style/reviewList.css";
import "../style/profile.css";


export default function Profile() {
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [reviews, setReviews] = useState([]);
  const [newBio, setNewBio] = useState("");
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Fetch profile data, reviews, and followers/following when the user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData();
      fetchUserReviews();
      fetchFollowersAndFollowing();
    }
  }, [isAuthenticated]);

  // Fetch profile data from the API
  const fetchProfileData = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setBio(data.bio);
      setAvatar(data.avatar || user.picture);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  // Fetch user's reviews from the API
  const fetchUserReviews = async () => {
    try {
      const token = await getAccessTokenSilently();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/me/reviews`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setReviews(data);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  // Fetch followers and following data from the API
  const fetchFollowersAndFollowing = async () => {
    try {
      const token = await getAccessTokenSilently();
      const followersResponse = await fetch(`${process.env.REACT_APP_API_URL}/me/followers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const followersData = await followersResponse.json();
      setFollowers(followersData);
      const followingResponse = await fetch(`${process.env.REACT_APP_API_URL}/me/followings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const followingData = await followingResponse.json();
      setFollowing(followingData);
    } catch (error) {
      console.error('Error fetching followers and following:', error);
    }
  };

  // Handle bio update
  const handleBioUpdate = async () => {
    const token = await getAccessTokenSilently();
    await fetch(`${process.env.REACT_APP_API_URL}/me/bio`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bio: newBio }),
    });
    setBio(newBio);
    setNewBio("");
  };

  // Handle unfollow a user
  const handleUnfollow = async (userId) => {
    if (window.confirm('Are you sure you want to unfollow this user?')) {
      const token = await getAccessTokenSilently();
      await fetch(`${process.env.REACT_APP_API_URL}/follow/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Update the following list
      setFollowing(following.filter(user => user.id !== userId));
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    isAuthenticated && (
      <div className="content">
        <div className="column profile-section">
          <div className="profile">
            <h2>Profile</h2>
            <div className="profile-info">
              <img src={avatar} alt={user.nickname} className="profile-avatar" />
              <p><strong>Name:</strong> {user.nickname}</p>
              <div className="bio-section">
                <p><strong>Bio:</strong> {bio}</p>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="Add a bio"
                />
                <button onClick={handleBioUpdate}>Update Bio</button>
              </div>
            </div>
            <div className="followers-following-section">
              <div className="followers-section">
                <h3>Followers</h3>
                <div className="followers-list">
                  {followers.length === 0 ? (
                    <p>No Followers</p>
                  ) : (
                    followers.map((follower) => (
                      <div key={follower.id} className="user-item">
                        <img src={follower.picture} alt={follower.nickname} className="avatar" />
                        <p>{follower.nickname}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="following-section">
                <h3>Following</h3>
                <div className="following-list">
                  {following.length === 0 ? (
                    <p>Not Following Anyone</p>
                  ) : (
                    following.map((followed) => (
                      <div key={followed.id} className="user-item">
                        <img src={followed.picture} alt={user.name} className="avatar" />
                        <p>{followed.nickname}</p>
                        <button className="unfollow-button" onClick={() => handleUnfollow(followed.id)}>Unfollow</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="column reviews-section">
          <h3>My Reviews</h3>
          <div className="review-list-container">
            {reviews.length === 0 ? (
              <h2>No Reviews Available</h2>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-item">
                  <header>
                    <strong className="review-title">
                      <Link to={`/review/${review.id}`}>{review.title}</Link>
                    </strong>
                    <div className="review-meta">
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      <span> By <em>{review.user.nickname}</em></span>
                      <span className="game-tag">Game: {review.game.name}</span>
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
                  <p>{review.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  );
}