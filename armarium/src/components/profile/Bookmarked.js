import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import { db } from '../backend/firebaseConfig'; // Ensure this is the correct path to your Firebase config
import Navbar from '../Navbar';
import '../styles/Bookmarked.css';

function Bookmarked() {
  const [bookmarkedStyleboards, setBookmarkedStyleboards] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchBookmarkedStyleboards = async () => {
      if (!user) {
        console.error('User not logged in');
        return;
      }

      try {
        const inspoFolderRef = collection(db, `Users/${user.uid}/InspoFolder`);
        const snapshot = await getDocs(inspoFolderRef);

        const styleboards = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setBookmarkedStyleboards(styleboards);
      } catch (error) {
        console.error('Error fetching bookmarked styleboards:', error);
      }
    };

    fetchBookmarkedStyleboards();
  }, [user]);

  if (!user) {
    return <p>Please log in to view your bookmarked styleboards.</p>;
  }

  const handleStyleboardClick = (styleboardId) => {
    // Navigate to the BookmarkedPage for the selected styleboard
    navigate(`/bookmarked/${styleboardId}`);
  };

  return (
    <div>
      <Navbar />
      <div className="bookmarked-container">
        <h1>Your Bookmarked Styleboards</h1>
        {bookmarkedStyleboards.length > 0 ? (
          <ul className="styleboards-list">
            {bookmarkedStyleboards.map((styleboard) => {
              console.log('Styleboard Data:', styleboard); // Log the styleboard data
              return (
                <li
                  key={styleboard.id}
                  className="styleboard-item"
                  onClick={() => handleStyleboardClick(styleboard.id)} // Add onClick handler
                  style={{ cursor: 'pointer' }} // Add pointer cursor for better UX
                >
                  <h2>{styleboard.name || 'Unnamed Styleboard'}</h2>
                  <div className="outfits-preview">
                    {styleboard.outfits?.[0] && ( // Display only the first outfit
                      <div className="outfit-preview">
                        {styleboard.outfits[0].images?.top && (
                          <img
                            src={styleboard.outfits[0].images.top}
                            alt="Top"
                            className="outfit-image"
                          />
                        )}
                        {styleboard.outfits[0].images?.bottom && (
                          <img
                            src={styleboard.outfits[0].images.bottom}
                            alt="Bottom"
                            className="outfit-image"
                          />
                        )}
                        {styleboard.outfits[0].images?.shoes && (
                          <img
                            src={styleboard.outfits[0].images.shoes}
                            alt="Shoes"
                            className="outfit-image"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>You have no bookmarked styleboards.</p>
        )}
      </div>
    </div>
  );
}

export default Bookmarked;