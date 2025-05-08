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
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isDelete, setIsDelete] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStyleboards, setSelectedStyleboards] = useState([]);
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
      setLoading(false);
    } catch (error) {
      console.error("Error fetching styleboards from storage:", error);
      setLoading(false);
    }
  };

  const handleCheckboxClick = (event, styleboard) => {
    event.stopPropagation();
    if (event.target.checked) {
      setSelectedStyleboards((prevList) => [...prevList, styleboard]);
    } else {
      setSelectedStyleboards((prevList) => prevList.filter((styleboardId) => styleboardId !== styleboard));
    }
  };

  const handleSearchChange = (e) => {
    const inputValue = e.target.value.toLowerCase();
    setSearchInput(inputValue);
  }

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!selectedStyleboards.length) {
      alert("No styleboard has been selected.");
      return;
    }

    try {
        await new Promise((resolve) => setTimeout(resolve, DELAY));
    
        for (const styleboard of selectedStyleboards) {
          const styleboardDocRef = doc(db, `Users/${user.uid}/Styleboards`, styleboard);
          await deleteDoc(styleboardDocRef);
          console.log("Styleboard deleted successfully:", styleboard);
        }
    
        setSelectedStyleboards([]);
        await fetchStyleboards(user); 
        setShowDeleteModal(false);
      } catch (error) {
        console.error("Error deleting styleboard:", error);
        alert("Failed to delete styleboard. Please try again.");
      }
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

      <div className="center">
        <button className="outfit-button" onClick={() => {
          if (selectedStyleboards.length > 0) {
            setShowDeleteModal(true);
          } else {
            alert("No outfit has been selected.");
          }
        }}>
          Delete
        </button>
      </div>

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
                  <input
                    type="checkbox"
                    className="select-box"
                    onClick={(event) => handleCheckboxClick(event, styleboard.id)}
                  />
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

      {/* Delete Modal */}
      <div className={`modal ${showDeleteModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Styleboards</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete the selected styleboards?</p>
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

    </div>
  );
}

export default Styleboards;
