import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStyleboardContext } from '../../StyleboardContext';
import Navbar from '../Navbar';
import '../styles/ExploreFormat.css'; // Reuse the styles from Styleboards.css

function Explore() {
  const { styleboards } = useStyleboardContext(); // Access styleboards from context
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  const handleSearchChange = (e) => {
    const inputValue = e.target.value.toLowerCase();
    setSearchInput(inputValue);
  };

  const handleStyleboardClick = (styleboard) => {
    console.log('Navigating with styleboard:', styleboard); // Debugging
    navigate(`/explore/${styleboard.id}`, { state: { styleboard } });
  };

  return (
    <div>
      <Navbar />
      <div>
        <h1>Explore InspoBoards</h1>
        <input
          type="text"
          placeholder="Search styleboard by title"
          value={searchInput}
          onChange={handleSearchChange}
        />
        <ul className="styleboards-list">
          {styleboards.length > 0 ? (
            styleboards
              .filter((styleboard) =>
                styleboard.styleboardName
                  ?.toLowerCase()
                  .includes(searchInput)
              )
              .map((styleboard) => {
                const firstOutfit = styleboard.outfits?.[0]; // Get the first outfit
                return (
                  <li
                    key={styleboard.id}
                    className="styleboard-item"
                    onClick={() => handleStyleboardClick(styleboard)}
                  >
                    <h2>{styleboard.styleboardName || 'Unnamed Styleboard'}</h2>
                    {firstOutfit && (
                      <div className="first-outfit-preview">
                        <div className="image-container">
                          {firstOutfit.images.top && (
                            <img
                              src={firstOutfit.images.top}
                              alt="Top"
                              className="outfit-image"
                            />
                          )}
                          {firstOutfit.images.bottom && (
                            <img
                              src={firstOutfit.images.bottom}
                              alt="Bottom"
                              className="outfit-image"
                            />
                          )}
                          {firstOutfit.images.shoes && (
                            <img
                              src={firstOutfit.images.shoes}
                              alt="Shoes"
                              className="outfit-image"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
          ) : (
            <p>No styleboards found.</p>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Explore;