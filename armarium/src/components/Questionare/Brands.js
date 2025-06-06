import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; // Ensure your firebaseConfig exports db
//import '../styles/App.css';
import '../styles/Forms.css';
import '../styles/Brands.css';

function Brands() {
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [customBrand, setCustomBrand] = useState('');
  const navigate = useNavigate();

  const brandsList = ['Gap', 'Nike', 'Lacoste', 'Raymond', 'Gucci', 'Ralph Lauren'];

  const handleBrandClick = (brand) => {
    setSelectedBrands((prevBrands) =>
      prevBrands.includes(brand)
        ? prevBrands.filter((b) => b !== brand)
        : [...prevBrands, brand]
    );
  };

  const handleCustomBrandChange = (e) => {
    setCustomBrand(e.target.value);
  };

  const handleCustomBrandSubmit = (e) => {
    e.preventDefault();
    if (customBrand && !selectedBrands.includes(customBrand)) {
      setSelectedBrands([...selectedBrands, customBrand]);
      setCustomBrand('');
    }
  };

  const handleNext = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('Please log in to save your preferences.');
      return;
    }

    try {
      // Add selected brands to Firestore
      await addDoc(collection(db, `Users/${user.uid}/preferences`), {
        brands: selectedBrands,
        timestamp: new Date(),
      });

      console.log('Brands preferences saved successfully');
      navigate('/styles');
    } catch (error) {
      console.error('Error saving brands preferences:', error);
      alert('Error saving your preferences. Please try again.');
    }
  };

  return (
    <div className="Form-container">
      <div className="logo">
        <div className="logo-text">ARMARIUM</div>
      </div>
      <div className ="Form-box">
        <div className ="input-group">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {brandsList.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className={'Form-Button'+ (selectedBrands.includes(brand) ? 'selected' : '')}
              >
                {brand}
              </button>
            ))}
          </div>

      <form onSubmit={handleCustomBrandSubmit} style={{ marginTop: '20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
    <label htmlFor="customBrandInput" style={{ fontWeight: 'bold' }}>
      Insert your favorite brands:
    </label>
  </div>
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
    <input
      id="customBrandInput"
      type="text"
      value={customBrand}
      onChange={handleCustomBrandChange}
      placeholder="Enter brand name"
      style={{
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ccc',
        flex: '1', // Allow the input to take up available space
        maxWidth: '300px', // Optional: Limit the input width
      }}
    />
    <button
      type="submit"
      className='Form-Button-Add'
    >
      Add Brand
    </button>
  </div>
      </form>
      <button className = 'Form-Submit' onClick={handleNext} style={{ display: 'block', margin: '20px auto' }}>
        Next
      </button>
      </div>
      </div>
    </div>
  );
}

export default Brands;