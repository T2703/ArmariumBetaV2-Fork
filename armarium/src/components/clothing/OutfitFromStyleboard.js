import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyOutfits.css';

function OutfitFromStyleboard({ outfits, selectedOutfits, setSelectedOutfits }) {
  const navigate = useNavigate();

  const handleCheckboxClick = (event, outfit) => {
    event.stopPropagation();
    if (event.target.checked) {
      setSelectedOutfits((prevList) => [...prevList, outfit]);
    } else {
      setSelectedOutfits((prevList) => prevList.filter((item) => item.id !== outfit.id));
    }
  };

  if (!outfits || outfits.length === 0) {
    return <p>No outfits found.</p>;
  }

  return (
    <ul className="outfits-list">
        <li className="outfit-item" 
            style={{ backgroundColor: '#a52a2a' }}
            onClick={() => navigate("/outfits")}>
        </li>
        {outfits.map((outfit) => (
        <li
          key={outfit.id}
          className="outfit-item"
          onClick={() =>
            navigate(`/editOutfit/${outfit.id}`, {
              state: { outfitName: outfit.outfitName, outfitId: outfit.id },
            })
          }
          style={{
            border: selectedOutfits.some((item) => item.id === outfit.id)
              ? '2px solid blue'
              : '2px solid whitesmoke',
          }}
        >
          <input
            type="checkbox"
            className="select-box"
            onClick={(event) => handleCheckboxClick(event, outfit)}
          />
          <div className="image-container">
            <img
              src={outfit.images.top}
              alt="Top"
              className="outfit-image center"
            />
            <img
              src={outfit.images.bottom}
              alt="Bottom"
              className="outfit-image center"
            />
            <img
              src={outfit.images.shoes}
              alt="Shoes"
              className="outfit-image center"
            />
          </div>
          <h1 className="outfit-title">{outfit.name}</h1>
        </li>
      ))}
    </ul>
  );
}

export default OutfitFromStyleboard;