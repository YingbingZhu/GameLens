import React, { useEffect, useState } from "react";
import '../style/recentGame.css';

export default function RecentGame() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch games when the component mounts
  useEffect(() => {
    fetchGames();
  }, []);
  
  // Function to fetch recent games from external API
  const fetchGames = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/recent-games`); 
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // shrink game summary to a maximum length
  const shrinkSummary = (summary) => {
    if (!summary) return '';
    const maxLength = 100;
    if (summary.length > maxLength) {
      return summary.substring(0, maxLength) + '...';
    }
    return summary;
  };
 
  if (loading) {
    return <p>Loading games...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div className="recent-games-container">
      <h2>Top 10 Newest Games</h2>
      <ul className="recent-games-list">
        {games.map((game, index) => (
          <li key={index} className="game-item">
            {game.cover && (
              <img
                src={game.cover.url.replace('t_thumb', 't_cover_big')}
                alt={`${game.name} cover`}
                className="game-cover"
              />
            )}
            <div className="game-details">
              <h2>{game.name}</h2>
              <p>Released: {new Date(game.first_release_date * 1000).toDateString()}</p>
              <p>{shrinkSummary(game.summary)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}