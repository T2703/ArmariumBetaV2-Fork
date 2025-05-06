import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../backend/firebaseConfig";
import Navbar from '../Navbar';
import Loader from '../Loader';
import '../styles/StyleboardsFormat.css'; 

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
      const styleboardsPath = `Users/Styleboards/${userId}`;
      const styleboardsRef = ref(storage, styleboardsPath);
  
      const styleboardsList = [];
      const styleboardsSnapshot = await listAll(styleboardsRef);
  
      console.log("Styleboards snapshot:", styleboardsSnapshot);
  
      for (const folderRef of styleboardsSnapshot.prefixes) {
        const styleboardName = folderRef.name;
        console.log("Fetching styleboard:", styleboardName);
        const outfits = [];
  
        const outfitFoldersSnapshot = await listAll(folderRef);
  
        for (const outfitFolderRef of outfitFoldersSnapshot.prefixes) {
          const outfitName = outfitFolderRef.name;
          console.log("Fetching outfit:", outfitName);
          const images = {};
  
          const imageFilesSnapshot = await listAll(outfitFolderRef);
  
          for (const imageFileRef of imageFilesSnapshot.items) {
            const fileName = imageFileRef.name.replace(".jpg", "");
            const downloadUrl = await getDownloadURL(imageFileRef); 
            images[fileName] = downloadUrl; 
          }
  
          outfits.push({ name: outfitName, images });
        }
  
        styleboardsList.push({
          id: folderRef.name,
          styleboardName,
          outfits,
        });
      }
  
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


    <ul className="styleboards-list">
      {styleboards.length > 0 ? (
        styleboards.map((styleboard) => {
          const isSelected = styleboardToDelete.some((item) => item.id === styleboard.id); 

          return (
            <li
              key={styleboard.id}
              className="styleboard-item"
              onClick={() => {
                if (!isDelete) {
                  console.log("Navigating to styleboard:", styleboard.id); 
                  handleStyleboardClick(styleboard);
                }
              }}
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid red' : '1px solid #ccc', 
                padding: '10px',
                margin: '10px',
              }}
            >
              <div className="image-container">
                <h1>{styleboard.styleboardName}</h1>
                {styleboard.outfits.length > 0 && (
                  <div>
                    {styleboard.outfits[0].images.top && (
                      <img
                        src={styleboard.outfits[0].images.top}
                        alt="Top"
                        className="styleboard-image"
                      />
                    )}
                    {styleboard.outfits[0].images.bottom ? (
                      <img
                        src={styleboard.outfits[0].images.bottom}
                        alt="Bottom"
                        className="styleboard-image"
                      />
                    ) : (
                      <p>No bottom image available</p>
                    )}
                    {styleboard.outfits[0].images.shoes && (
                      <img
                        src={styleboard.outfits[0].images.shoes}
                        alt="Shoes"
                        className="styleboard-image"
                      />
                    )}
                  </div>
                )}
              </div>
              {isDelete && (
                <div
                  onClick={(e) => e.stopPropagation()} // Prevent navigation when clicking the checkbox
                  style={{ display: 'inline-block', marginTop: '10px' }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected} 
                    onChange={() => addToDeleteList(styleboard)} // Toggle selection
                  />
                  <label style={{ marginLeft: '5px' }}>Select for Deletion</label>
                </div>
              )}
            </li>
          );
        })
      ) : (
        <p>No styleboards found.</p>
      )}
    </ul>
  </div>
  </div>
);
}

export default Styleboards;
