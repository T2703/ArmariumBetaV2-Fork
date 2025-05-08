import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../backend/firebaseConfig";
import Navbar from '../Navbar';
import Loader from '../Loader';
import '../styles/StyleboardsFormat.css';
import '../styles/MyOutfits.css';

function Styleboards() {
  const [styleboards, setStyleboards] = useState([]);
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [isDelete, setIsDelete] = useState(false);
  const [styleboardToDelete, setStyleboardToDelete] = useState([]);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();
  const DELAY = 750;

  const fetchStyleboards = async (user) => {
    if (!user) {
      console.log("No user logged in");
      return;
    }
  
    try {
      setLoading(true);
      const userId = user.uid;
      const q = query(collection(db, 'Users', userId, 'Styleboards'));
      const querySnapshot = await getDocs(q);

      const styleboardsList = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const styleboardData = doc.data();
  
          // Fetch the outfits referenced in the styleboard
          const outfits = await Promise.all(
            styleboardData.outfits.map(async (outfitRef) => {
              const outfitDoc = await getDoc(outfitRef); // Fetch the document
              if (outfitDoc.exists()) {
                return { id: outfitDoc.id, ...outfitDoc.data() }; // Return the outfit data
              } else {
                console.warn(`Outfit document not found: ${outfitRef.path}`);
                return null;
              }
            })
          );
  
          // Filter out any null outfits (in case a referenced document doesn't exist)
          return {
            id: doc.id,
            ...styleboardData,
            outfits: outfits.filter((outfit) => outfit !== null),
          };
        })
      );
  
      setStyleboards(styleboardsList);
      console.log("Fetched styleboards:", styleboardsList);
    } catch (error) {
      console.error("Error fetching styleboards from storage:", error);
      setLoading(false);
    }
  };

const handleSearchChange = (e) => {
  const inputValue = e.target.value.toLowerCase();
  setSearchInput(inputValue);
}

const handleDelete = async () => {
  const user = auth.currentUser;
  if (!styleboardToDelete.length) {
    alert("No styleboard has been selected.");
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, DELAY));

    for (const styleboard of styleboardToDelete) {
      console.log("Starting deletion for styleboard:", styleboard.id);

      // Delete all files in the styleboard folder from Firebase Storage
      const styleboardFolderRef = ref(storage, `Users/Styleboards/${user.uid}/${styleboard.id}`);
      const filesSnapshot = await listAll(styleboardFolderRef);

      for (const fileRef of filesSnapshot.items) {
        console.log("Deleting file:", fileRef.fullPath);
        await deleteObject(fileRef); 
      }

      // Delete all subfolders
      for (const folderRef of filesSnapshot.prefixes) {
        console.log("Deleting subfolder:", folderRef.fullPath);
        const subfolderSnapshot = await listAll(folderRef);

        for (const subfileRef of subfolderSnapshot.items) {
          console.log("Deleting file in subfolder:", subfileRef.fullPath);
          await deleteObject(subfileRef); // Delete each file in the subfolder
        }
      }

      console.log("All files and subfolders deleted for styleboard:", styleboard.id);

      // Delete the styleboard document from Firestore
      const styleboardDocRef = doc(db, `Users/${user.uid}/Styleboards`, styleboard.id);
      console.log("Attempting to delete Firestore document:", styleboardDocRef.path);
      await deleteDoc(styleboardDocRef);
      console.log("Firestore document deleted for styleboard:", styleboard.id);
    }

    setStyleboards((prevStyleboards) =>
      prevStyleboards.filter(
        (styleboard) => !styleboardToDelete.some((item) => item.id === styleboard.id)
      )
    );

    setStyleboardToDelete([]);
    setIsDelete(false); 
    console.log("Deletion process completed.");
  } catch (error) {
    console.error("Error deleting styleboard:", error);
    alert("Failed to delete styleboard. Please try again.");
  }
};

const addToDeleteList = (styleboards) => {
  setStyleboardToDelete(prevList => {
      if (prevList.some(item => item.id === styleboards.id)) {
          return prevList.filter(item => item.id !== styleboards.id);
      } else {
          return [...prevList, styleboards];
      }
  });
}

const toggleDelete = () => {
  console.log("Toggling delete mode. Current state:", isDelete); 
  if (isDelete) {
    setStyleboardToDelete([]);
  }
  setIsDelete(!isDelete);
};

const handleStyleboardClick = (styleboard) => {
  navigate(`/styleboard/${styleboard.id}`, { state: { styleboard } });
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchStyleboards(user).then(() => setLoading(false));
        } else {
            navigate('/login'); 
        }
    });

    return () => unsubscribe();
}, []);

return (
  <div>
    {/* Loader overlay */}
    <Loader loading={loading} />
    <Navbar /> 
  <div className={loading ? 'blurred' : ''}>
    <h1>My Styleboards</h1>

    <input
      type="text"
      placeholder="Search styleboard by title"
      value={searchInput}
      onChange={handleSearchChange} 
    />

    <button onClick={toggleDelete}>
      {isDelete ? 'Cancel' : 'Delete'}
    </button>
    {isDelete && (
      <button onClick={handleDelete} style={{ marginLeft: '10px' }}>
        Confirm Delete
      </button>
    )}

    <div className="center">
      <div className="outfit-outer">
        <div className="outfit-center"></div>
          {styleboards.length > 0 ? (
            <ul className="outfits-list">
              {styleboards.map((styleboard) => (
              <li
                key={styleboard.id}
                className="outfit-item"
                onClick={() =>
                  handleStyleboardClick(styleboard)
                }>
                <div className="image-container">
                  <img
                    src={styleboard.outfits[0].topImageUrl}
                    alt="Top"
                    className="outfit-image center"
                  />
                  <img
                    src={styleboard.outfits[0].bottomImageUrl}
                    alt="Bottom"
                    className="outfit-image center"
                  />
                  <img
                    src={styleboard.outfits[0].shoesImageUrl}
                    alt="Shoes"
                    className="outfit-image center"
                  />
                </div>
                <h1 className="outfit-title">{styleboard.name}</h1>
              </li>
              ))}
            </ul>
          ) : (
            <p>No styleboards found.</p>
          )}
        </div>
      </div>
    </div>
  </div>
);
}

export default Styleboards;