import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; // Ensure this is the correct path to your Firebase config
import Navbar from '../Navbar';
import '../styles/BookmarkedPage.css';

function BookmarkedPage() {
  const { styleboardId } = useParams(); // Get the styleboardId from the URL
  const navigate = useNavigate();
  const [styleboard, setStyleboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchStyleboard = async () => {
      if (!user) {
        console.error('User not logged in');
        setLoading(false);
        return;
      }

      try {
        const styleboardRef = doc(db, `Users/${user.uid}/InspoFolder`, styleboardId);
        const styleboardSnap = await getDoc(styleboardRef);

        if (styleboardSnap.exists()) {
          setStyleboard({ id: styleboardSnap.id, ...styleboardSnap.data() });
        } else {
          console.error('No such styleboard found');
        }
      } catch (error) {
        console.error('Error fetching styleboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStyleboard();
  }, [user, styleboardId]);

  if (loading) {
    return <p>Loading styleboard...</p>;
  }

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  console.log('Styleboard data in BookmarkedPage:', styleboard); // Debugging

  return (
    <div>
      <Navbar />
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back to Bookmarked Styleboards
      </button>
      <h1>{styleboard.name || 'Unnamed Styleboard'}</h1>
      <ul className="outfits-list2">
        {styleboard.outfits?.map((outfit, index) => (
          <li key={index} className="outfit-item2">
            <h2>{outfit.name || `Outfit ${index + 1}`}</h2>
            <div className="image-container2">
              {outfit.images?.top && <img src={outfit.images.top} alt="Top" className="outfit-image" />}
              {outfit.images?.bottom && <img src={outfit.images.bottom} alt="Bottom" className="outfit-image" />}
              {outfit.images?.shoes && <img src={outfit.images.shoes} alt="Shoes" className="outfit-image" />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BookmarkedPage;