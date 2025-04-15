import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../backend/firebaseConfig";
import { db } from '../backend/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import '../styles/MyOutfits.css';

function Outfits() {
  const [outfits, setOutfits] = useState([]);
  const auth = getAuth();
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [isDelete, setIsDelete] = useState(false);
  const [outfitToDelete, setOutfitToDelete] = useState([]);
  const [styleboardState, setStyleboardState] = useState(false);
  const [selectedOutfits, setSelectedOutfits] = useState([]);
  const [showStyleboardModal, setShowStyleboardModal] = useState(false);
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
    } else {
      console.log("No user logged in");
    }
  };

  const resizeImageBlob = (blob, maxWidth, maxHeight) => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(resolve, 'image/jpeg', 0.85);
      };

      img.src = URL.createObjectURL(blob);
    });
  };

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
        const originalOutfitPath = `Users/${user.uid}/Outfits/${outfit.id}/${outfit.outfitName}`;
        const styleboardPath = `Users/Styleboards/${user.uid}/${styleboardName}/${outfit.outfitName}`;
        const imageTypes = ["topImageUrl", "bottomImageUrl", "shoesImageUrl"];

        for (const type of imageTypes) {
          const imageUrl = outfit[type];
          const fileName = type.replace("ImageUrl", "");
          const storageRef = ref(storage, `${styleboardPath}/${fileName}.jpg`);

          const imageBlob = await fetch(imageUrl).then((res) => res.blob());
          const resizedBlob = await resizeImageBlob(imageBlob, 600, 600);

          await uploadBytes(storageRef, resizedBlob);
          await getDownloadURL(storageRef); // just to ensure upload success
        }

        console.log(`Outfit "${outfit.outfitName}" added to styleboard.`);
      }

      setSelectedOutfits([]);
      setStyleboardState(false);
    } catch (error) {
      console.error("Error creating styleboard:", error);
      alert("Failed to create styleboard. Please try again.");
    }
  };

  const addToStyleboardList = (outfits) => {
    setSelectedOutfits(prevList =>
      prevList.some(item => item.id === outfits.id)
        ? prevList.filter(item => item.id !== outfits.id)
        : [...prevList, outfits]
    );
  };

  const toggleStyleboard = () => {
    if (styleboardState) setSelectedOutfits([]);
    setStyleboardState(!styleboardState);
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!outfitToDelete.length) {
      alert("No outfit has been selected.");
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, DELAY));
      for (const outfit of outfitToDelete) {
        const outfitDocRef = doc(db, `Users/${user.uid}/Outfits`, outfit.id);
        await deleteDoc(outfitDocRef);
      }

      setOutfitToDelete([]);
      setIsDelete(false);
      await fetchOutfits(user);
    } catch (error) {
      console.error("Error deleting outfit:", error);
      alert("Failed to delete outfit. Please try again.");
    }
  };

  const addToDeleteList = (outfits) => {
    setOutfitToDelete(prevList =>
      prevList.some(item => item.id === outfits.id)
        ? prevList.filter(item => item.id !== outfits.id)
        : [...prevList, outfits]
    );
  };

  const toggleDelete = () => {
    if (isDelete) setOutfitToDelete([]);
    setIsDelete(!isDelete);
  };

  const filteredOutfits = () => {
    if (!outfits) return [];
    return outfits.filter(outfit =>
      outfit.outfitName?.toLowerCase().includes(searchInput.toLowerCase())
    );
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
        <h1 className="page-title">My Outfits</h1>
      </div>

      <div className="center">
        <input
          type="text"
          placeholder="Search outfits by title"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      <div className="center">
        <img
          src="trashcan.png"
          alt="Delete Mode"
          onClick={toggleDelete}
          className="mode-image"
          style={{ border: isDelete ? '2px solid red' : 'none' }}
        />
      </div>

      <div className="center">
        {isDelete && (
          <button className="styleboard-button" onClick={handleDelete}>
            Confirm Delete
          </button>
        )}
      </div>

      <div className="center">
        <button className="styleboard-button" onClick={toggleStyleboard}>
          {styleboardState ? 'Cancel' : 'Create Styleboard'}
        </button>
        {styleboardState && (
          <button
            className="styleboard-button"
            onClick={() => setShowStyleboardModal(true)}
          >
            Save Styleboard
          </button>
        )}
      </div>

      <div className="center">
        <div className="outfit-outer">
          <ul className="outfits-list">
            <li className="add-outfit center" onClick={() => navigate("/outfits")}>
              <div className="circle">
                <div className="horizontal-plus"></div>
                <div className="vertical-plus"></div>
              </div>
            </li>
            {filteredOutfits().length > 0 ? (
              filteredOutfits().map((outfit) => (
                <li
                  key={outfit.id}
                  className="outfit-item"
                  onClick={() =>
                    styleboardState
                      ? addToStyleboardList(outfit)
                      : isDelete
                      ? addToDeleteList(outfit)
                      : navigate(`/editOutfit/${outfit.id}`, {
                          state: {
                            outfitName: outfit.outfitName,
                            outfitId: outfit.id,
                          },
                        })
                  }
                  style={{
                    border: outfitToDelete.some(item => item.id === outfit.id)
                      ? '2px solid red'
                      : selectedOutfits.some(item => item.id === outfit.id)
                      ? '2px solid blue'
                      : '2px solid whitesmoke',
                  }}
                >
                  <div className="image-container">
                    <img src={outfit.topImageUrl} alt="Top" className="outfit-image center" />
                    <img src={outfit.bottomImageUrl} alt="Bottom" className="outfit-image center" />
                    <img src={outfit.shoesImageUrl} alt="Shoes" className="outfit-image center" />
                  </div>
                  <h1 className="outfit-title">{outfit.outfitName}</h1>
                </li>
              ))
            ) : (
              <p>No outfits found.</p>
            )}

            <div
              className={`modal ${showStyleboardModal ? 'd-block' : 'd-none'}`}
              tabIndex="-1"
              role="dialog"
            >
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Create Styleboard</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowStyleboardModal(false)}
                    >
                      ×
                    </button>
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
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={createStyleboard}
                    >
                      Save Styleboard
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowStyleboardModal(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Outfits;
