import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; // Ensure this is the correct path to your Firebase config
import Navbar from '../Navbar';
import '../styles/ExplorePage.css';

function ExplorePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { styleboard } = location.state || {};
  const [isBookmarked, setIsBookmarked] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      if (!styleboard || !user) return;

      try {
        const bookmarkDocRef = doc(db, `Users/${user.uid}/InspoFolder`, styleboard.id);
        const bookmarkDoc = await getDoc(bookmarkDocRef);

        if (bookmarkDoc.exists()) {
          setIsBookmarked(true);
        } else {
          setIsBookmarked(false);
        }
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    checkBookmarkStatus();
  }, [styleboard, user]);

  const handleBookmarkToggle = async () => {
    if (!styleboard || !user) {
      alert('You must be logged in to bookmark a styleboard.');
      return;
    }
  
    try {
      const bookmarkDocRef = doc(db, `Users/${user.uid}/InspoFolder/${styleboard.id}`);
  
      if (isBookmarked) {
        // Unbookmark the styleboard
        await deleteDoc(bookmarkDocRef);
        setIsBookmarked(false);
        alert('Styleboard removed from InspoFolder.');
      } else {
        // Bookmark the styleboard and save its data
        await setDoc(bookmarkDocRef, {
          id: styleboard.id,
          name: styleboard.styleboardName,
          outfits: styleboard.outfits, // Save the outfits array
          createdAt: new Date().toISOString(), // Optional: Add a timestamp
        });
        setIsBookmarked(true);
        alert('Styleboard added to InspoFolder.');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert('Failed to update bookmark status. Please try again.');
    }
  };

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  console.log('Styleboard data in ExplorePage:', styleboard); // Debugging

  return (
    <div>
      <Navbar />
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back to Explore Inspoboards Page
      </button>
      <h1>{styleboard.styleboardName}</h1>
      <div className="bookmark-container">
        <img
          src={isBookmarked ? "bookmark.png" : "unbookmark.png"} // Use inline image paths
          alt={isBookmarked ? "Bookmark" : "Unbookmark"}
          onClick={handleBookmarkToggle} // Toggle bookmark state
          style={{ width: "30px", height: "30px", cursor: "pointer" }}
        />
      </div>
      <ul className="outfits-list1">
        {styleboard.outfits.map((outfit) => (
          <li key={outfit.name} className="outfit-item1">
            <h2>{outfit.name}</h2>
            <div className="image-container1">
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