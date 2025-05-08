import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../backend/firebaseConfig';
import Navbar from '../Navbar';
import '../styles/Bookmarked.css';

function Bookmarked() {
  const [bookmarkedStyleboards, setBookmarkedStyleboards] = useState([]);
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();

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
        {/* Back to Profile Button */}
        <button onClick={() => navigate('/profile')} style={{ marginBottom: '20px' }}>
          Back to Profile
        </button>
        <h1>Your Bookmarked Styleboards</h1>
        {bookmarkedStyleboards.length > 0 ? (
          <ul className="styleboards-list4">
            {bookmarkedStyleboards.map((styleboard) => {
              console.log('Styleboard Data:', styleboard); 
              return (
                <li
                  key={styleboard.id}
                  className="styleboard-item4"
                  onClick={() => handleStyleboardClick(styleboard.id)}
                  style={{ cursor: 'pointer' }} 
                >
                  <h2>{styleboard.name || 'Unnamed Styleboard'}</h2>
                  <div className="outfits-preview4">
                    {styleboard.outfits?.[0] && ( 
                      <div className="outfit-preview4">
                        {styleboard.outfits[0].images?.top && (
                          <img
                            src={styleboard.outfits[0].images.top}
                            alt="Top"
                            className="outfit-image4"
                          />
                        )}
                        {styleboard.outfits[0].images?.bottom && (
                          <img
                            src={styleboard.outfits[0].images.bottom}
                            alt="Bottom"
                            className="outfit-image4"
                          />
                        )}
                        {styleboard.outfits[0].images?.shoes && (
                          <img
                            src={styleboard.outfits[0].images.shoes}
                            alt="Shoes"
                            className="outfit-image4"
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