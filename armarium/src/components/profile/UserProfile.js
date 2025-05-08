import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/UserProfile.css';
import Navbar from '../Navbar';

const db = getFirestore();
const auth = getAuth();

export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [friends, setFriends] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMeasurements, setEditedMeasurements] = useState({ height: '', weight: '' });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      const userRef = doc(db, 'Users', user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserData(userSnap.data());
      }

      const measurementsQuery = query(
        collection(db, 'Users', user.uid, 'measurements')
      );
      const measurementsSnap = await getDocs(measurementsQuery);

      if (!measurementsSnap.empty) {
        const sortedMeasurements = measurementsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

        const latest = sortedMeasurements[0];
        setUserData((prev) => ({ ...prev, ...latest }));
      }

      const friendsQuery = query(
        collection(db, 'Users'),
        where('friends', 'array-contains', user.uid)
      );
      const friendsSnap = await getDocs(friendsQuery);
      setFriends(friendsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

      const messagesQuery = query(
        collection(db, 'messages'),
        where('to', '==', user.uid)
      );
      const messagesSnap = await getDocs(messagesQuery);
      setMessages(messagesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    fetchProfileData();
  }, [navigate]);

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedMeasurements({
      height: userData?.height || '',
      weight: userData?.weight || '',
    });
  };

  const handleSaveClick = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, 'Users', user.uid);

    // 1. Update main user document
    await updateDoc(userRef, {
      height: editedMeasurements.height,
      weight: editedMeasurements.weight,
    });

    // 2. Add new document to 'measurements' subcollection
    const measurementRef = collection(db, 'Users', user.uid, 'measurements');
    await addDoc(measurementRef, {
      height: editedMeasurements.height,
      weight: editedMeasurements.weight,
      timestamp: new Date(),
    });

    setUserData((prev) => ({
      ...prev,
      height: editedMeasurements.height,
      weight: editedMeasurements.weight,
    }));
    setIsEditing(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedMeasurements((prev) => ({ ...prev, [name]: value }));
  };

   // Navigate to the Bookmarked page
  const handleBookmarkClick = () => {
    navigate('/bookmarked');
  };

  return (
    <div>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Hi, {userData?.username || 'User'}.</h1>
          <span className="profile-star">★</span>
        </div>

        {/* Bookmark Button */}
        <div className="bookmark-container1">
          <img
            src="bookmark.png" // Path to the bookmark icon
            alt="Bookmarks"
            onClick={handleBookmarkClick} // Navigate to the Bookmarked page
            className="bookmark-button"
            style={{ cursor: 'pointer', width: '30px', height: '30px' }}
          />
        </div>

        <h2 className="weekly-title">
          Your <span className="weekly-highlight">weekly</span> styles
        </h2>

        <div className="style-bubbles">
          {['Artsy', 'Classic', 'Vintage', 'Edgy', 'Comfortable'].map((style, idx) => (
            <div key={idx} className={`bubble bubble-${idx}`}>
              {style}
            </div>
          ))}
        </div>

        <div className="measurements-box">
          <div className="measurements-header">
            <h3>Your measurements</h3>
            {isEditing ? (
              <button onClick={handleSaveClick}>Save</button>
            ) : (
              <button onClick={handleEditClick}>Edit</button>
            )}
          </div>
          <div className="measurements-grid">
            {isEditing ? (
              <>
                <label>
                  Height:
                  <input
                    type="text"
                    name="height"
                    value={editedMeasurements.height}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Weight:
                  <input
                    type="text"
                    name="weight"
                    value={editedMeasurements.weight}
                    onChange={handleInputChange}
                  />
                </label>
              </>
            ) : (
              <>
                <p>Height: {userData?.height ? `${userData.height} in` : '#'}</p>
                <p>Weight: {userData?.weight ? `${userData.weight} lbs` : '#'}</p>
              </>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h3>Friends</h3>
          <ul>
            {friends.length ? (
              friends.map((f) => (
                <li key={f.id}>
                  {f.username} ({f.email})
                </li>
              ))
            ) : (
              <li>No friends found.</li>
            )}
          </ul>
        </div>

        <div className="profile-section">
          <h3>Messages</h3>
          <ul>
            {messages.length ? (
              messages.map((m) => (
                <li key={m.id}>
                  <strong>From:</strong> {m.from} - {m.content}
                </li>
              ))
            ) : (
              <li>No messages found.</li>
            )}
          </ul>
        </div>

        <div className="indicator-row">
          <div className="indicator" />
          <div className="indicator" />
          <div className="indicator" />
        </div>
      </div>
    </div>
  );
}