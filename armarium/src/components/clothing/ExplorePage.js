import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';

function ExplorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { styleboard } = location.state || {};

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  return (
    <div>
      <Navbar />
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back to Explore Page
      </button>
      <h1>{styleboard.styleboardName}</h1>
      <ul className="outfits-list">
        {styleboard.outfits.map((outfit) => (
          <li key={outfit.name} className="outfit-item">
            <h2>{outfit.name}</h2>
            <div className="image-container">
              {outfit.images.top && <img src={outfit.images.top} alt="Top" />}
              {outfit.images.bottom && <img src={outfit.images.bottom} alt="Bottom" />}
              {outfit.images.shoes && <img src={outfit.images.shoes} alt="Shoes" />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ExplorePage;