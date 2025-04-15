import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import '../styles/Styleboards.css'; // ✅ Make sure this path is correct

function StyleboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { styleboard } = location.state || {};

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  return (
    <div className="styleboard-page-container">
      <Navbar />
      <button onClick={() => navigate(-1)} className="back-button">
        Back to Styleboards
      </button>
      <h1 className="styleboard-title">{styleboard.styleboardName}</h1>

      <div className="outfit-grid-container">
        {styleboard.outfits.map((outfit) => (
          <div key={outfit.name} className="outfit-grid-card">
            <h2 className="outfit-name">{outfit.name}</h2>
            <div className="outfit-image-group">
              {['top', 'bottom', 'shoes'].map((part) =>
                outfit.images?.[part] ? (
                  <div className="outfit-slot" key={part}>
                    <img
                      src={outfit.images[part]}
                      alt={part}
                      className="outfit-img-small"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                    <span className="outfit-label">
                      {part.charAt(0).toUpperCase() + part.slice(1)}
                    </span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StyleboardPage;
