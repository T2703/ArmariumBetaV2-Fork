import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../backend/firebaseConfig";
import { db } from '../backend/firebaseConfig'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import OutfitsList from './OutfitsList';
import '../styles/MyOutfits.css';

function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const auth = getAuth(); 
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [styleboardState, setStyleboardState] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState([]);
  const [showStyleboardModal, setShowStyleboardModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [styleboardName, setStyleboardName] = useState('');
  const [title, setTitle] = useState('');
  const navigate = useNavigate();
  const DELAY = 750;

  const fetchOutfits = async (user) => {
    if (user) {
      const userId = user.uid;  
      const q = query(collection(db, 'Users', userId, 'Outfits'));
      
      const querySnapshot = await getDocs(q);
      const outfitsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOutfits(outfitsList);
      setTitle(querySnapshot.outfitName);
      console.log(outfitsList)
    } else {
      console.log("No user logged in");
    }
  };

  const filteredOutfits = () => {
    if (!outfits) return [];
    let fOutfits = outfits.filter(outfit => {
      const matchesTitle = outfit.outfitName && outfit.outfitName.toLowerCase().includes(searchInput.toLowerCase());
      return matchesTitle;
    });
    return fOutfits;
};


const handleSearchChange = (e) => {
  const inputValue = e.target.value.toLowerCase();
  setSearchInput(inputValue);
}

const createStyleboard = async () => {
  const user = auth.currentUser;
  if (!selectedOutfits.length) {
    alert("No outfit has been selected.");
    return;
  }
  if (!styleboardName) return;

  try {
    await new Promise((resolve) => setTimeout(resolve, DELAY));

    for (const outfit of selectedOutfits) {
      // Define the original outfit path and the new styleboard path
      const originalOutfitPath = `Users/${user.uid}/Outfits/${outfit.id}/${outfit.outfitName}`;
      const styleboardPath = `Users/Styleboards/${user.uid}/${styleboardName}/${outfit.outfitName}`;

      console.log(`Reusing images from path: ${originalOutfitPath}`);
      console.log(`Creating styleboard path: ${styleboardPath}`);

      // Upload images to Firebase Storage
      const imageTypes = ["topImageUrl", "bottomImageUrl", "shoesImageUrl"];
      const uploadedImages = {};

      for (const type of imageTypes) {
        const imageUrl = outfit[type];
        const fileName = type.replace("ImageUrl", ""); // e.g., "topImageUrl" -> "top"
        const storageRef = ref(storage, `${styleboardPath}/${fileName}.jpg`);

        // Fetch the image as a blob
        const imageBlob = await fetch(imageUrl).then((res) => res.blob());

        // Upload the image to Firebase Storage
        await uploadBytes(storageRef, imageBlob);

        // Get the download URL for the uploaded image
        const downloadUrl = await getDownloadURL(storageRef);
        uploadedImages[fileName] = downloadUrl;

        console.log(`Uploaded ${fileName} image to: ${downloadUrl}`);
      }

      console.log(`Outfit "${outfit.outfitName}" added to styleboard at path: ${styleboardPath}`);
    }

    console.log("Styleboard created successfully:", styleboardName);
    setSelectedOutfits([]);
    setShowStyleboardModal(false);
  } catch (error) {
    console.error("Error creating styleboard:", error);
    alert("Failed to create styleboard. Please try again.");
  }
};

const handleDelete = async () => {
  const user = auth.currentUser;
  if (!selectedOutfits.length) {
    alert("No outfit has been selected.");
    return;
  }

  try {
    await new Promise((resolve) => setTimeout(resolve, DELAY));

    for (const outfit of selectedOutfits) {
      const outfitDocRef = doc(db, `Users/${user.uid}/Outfits`, outfit.id);
      await deleteDoc(outfitDocRef);
      console.log("Outfit deleted successfully:", outfit.id);
    }

    setSelectedOutfits([]);
    await fetchOutfits(user); 
    setShowDeleteModal(false);
  } catch (error) {
    console.error("Error deleting outfit:", error);
    alert("Failed to delete outfit. Please try again.");
  }
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchOutfits(user).then(() => setLoading(false));
        } else {
            navigate('/login'); 
        }
    });

    return () => unsubscribe();
}, []);

return (
  <div>
    <Navbar />
    <div className="center">
      <h1 className="outfit-page-title">My Outfits</h1>
    </div>

    <div className="center">
      <input
        type="text"
        placeholder="Search outfits by title"
        value={searchInput}
        onChange={handleSearchChange} 
        className="search-input"
      />
    </div>

    <div className="center">
      <button className="delete-outfits-button" onClick={() => {
        if (selectedOutfits.length > 0) {
          setShowDeleteModal(true);
        } else {
          alert("No outfit has been selected.");
        }
      }}>
        Delete
      </button>
      <button className="styleboard-button" onClick={() => {
          if (selectedOutfits.length > 0) {
            setShowStyleboardModal(true);
          } else {
            alert("No outfit has been selected.");
          }
        }}>
        Create Styleboard
      </button>
    </div>
    
    <div className="center">
      <div className="outfit-outer">

      <OutfitsList outfits={filteredOutfits()} selectedOutfits={selectedOutfits} setSelectedOutfits={setSelectedOutfits} />

      {/* Delete Modal */}
      <div className={`modal ${showDeleteModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Outfit</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this outfit?</p>
              <p>This action cannot be undone.</p>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-primary" onClick={handleDelete}>
                Delete
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Styleboard Modal */}
      <div className={`modal ${showStyleboardModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Create Styleboard</h5>
              <button type="button" className="btn-close" onClick={() => setShowStyleboardModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>Enter a name for your styleboard:</p>
              <input
                type="text"
                className="form-control"
                placeholder="Styleboard name"
                value={styleboardName}
                onChange={(e) => setStyleboardName(e.target.value)}
              />
            </div>

            <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={createStyleboard}>
                  Save Styleboard
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStyleboardModal(false)}>
                  Cancel
                </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

export default Outfits;