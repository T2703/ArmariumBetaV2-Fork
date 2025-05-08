import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { storage } from '../backend/firebaseConfig';
import { db } from '../backend/firebaseConfig';
import { useStyleboardContext } from '../../StyleboardContext';
import '../styles/App.css';
import '../styles/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setStyleboards } = useStyleboardContext(); // Access the context

  const fetchAllStyleboards = async (user) => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const allStyleboards = [];

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Skip the current user's styleboards
        if (userId === user.uid) {
          continue;
        }

        const styleboardsRef = ref(storage, `Users/Styleboards/${userId}`);
        const styleboardsSnapshot = await listAll(styleboardsRef);

        for (const folderRef of styleboardsSnapshot.prefixes) {
          const styleboardName = folderRef.name;
          const outfits = [];
          const outfitFoldersSnapshot = await listAll(folderRef);

          for (const outfitFolderRef of outfitFoldersSnapshot.prefixes) {
            const outfitName = outfitFolderRef.name;
            const images = {};
            const imageFilesSnapshot = await listAll(outfitFolderRef);

            for (const imageFileRef of imageFilesSnapshot.items) {
              const fileName = imageFileRef.name.replace('.jpg', '');
              const downloadUrl = await getDownloadURL(imageFileRef);
              images[fileName] = downloadUrl;
            }

            outfits.push({ name: outfitName, images });
          }

          allStyleboards.push({
            id: folderRef.name,
            styleboardName,
            outfits,
          });
        }
      }

      console.log('Fetched all styleboards:', allStyleboards);
      return allStyleboards;
    } catch (error) {
      console.error('Error fetching all styleboards:', error);
      return [];
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User logged in successfully');
      setError(''); // Clear any previous error messages

      // Check the accountSetup status
      const user = auth.currentUser;
      const userDocRef = doc(db, `Users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      const styleboards = await fetchAllStyleboards(user);
      setStyleboards(styleboards); // Store styleboards in context

      if (userDoc.exists()) {
        const { accountSetup } = userDoc.data();
        if (accountSetup === false) {
          navigate('/userInfo'); // Navigate to /userInfo if accountSetup is false
        } else {
          navigate('/outfits'); // Navigate to /outfits if accountSetup is true
        }
      } else {
        console.log('No user document found');
        alert('User data not found.');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      setError('Invalid email or password. Please try again.'); // Display error message
    }
  };

  return (
    <div className="login-container">
      <div className="logo">
        <div className="logo-text">ARMARIUM</div>
      </div>
      <div className="login-box">
        <form onSubmit={handleLoginSubmit}>
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-message">{error}</p>}
          </div>
          <button type="submit" className="login-button">Sign in</button>
        </form>
        <div className="links">
          <Link to="/forgot-password">Forgot Password</Link>
          <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;