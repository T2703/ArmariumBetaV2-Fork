import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import OutfitFromStyleboard from './OutfitFromStyleboard';
import '../styles/MyOutfits.css';

function StyleboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { styleboard } = location.state || {};
  const [selectedOutfits, setSelectedOutfits] = React.useState([]);

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  return (
    <div>
      <Navbar />
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back to Styleboards
      </button>

      <div className="center"><h1>{styleboard.styleboardName}</h1></div>
      
      <div className="center">
        <div className="outfit-outer">
          <div className="outfit-center">
            { console.log("From StyleboardPage.js: ", styleboard.outfits)}
            <OutfitFromStyleboard outfits={styleboard.outfits} selectedOutfits={selectedOutfits} setSelectedOutfits={setSelectedOutfits} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StyleboardPage;