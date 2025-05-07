import React from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../backend/firebaseConfig';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import OutfitsList from './OutfitsList';
import '../styles/MyOutfits.css';

function StyleboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { styleboard } = location.state || {};
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedOutfits, setSelectedOutfits] = React.useState([]);


  const handleDelete = async () => {
    const user = auth.currentUser;

    try {
      const styleboardDocRef = doc(db, `Users/${user.uid}/Styleboards`, styleboard.id);

      // Fetch the current document
      const styleboardDoc = await getDoc(styleboardDocRef);

      if (!styleboardDoc.exists()) {
        console.error("Styleboard document does not exist.");
        return;
      }

      // Get the current outfits array
      const currentOutfits = styleboardDoc.data().outfits || [];

      // Create DocumentReference objects for the selected outfits
      const selectedOutfitRefs = selectedOutfits.map((outfit) =>
        doc(db, `Users/${user.uid}/Outfits`, outfit.id)
      );

      console.log("Selected outfit references:", selectedOutfitRefs);

      const updatedOutfits = currentOutfits.filter((outfitRef) => {
        const isMatch = selectedOutfitRefs.some((selectedRef) => {
          console.log("Comparing outfitRef:", outfitRef.path, "with selectedRef:", selectedRef.path);
          return outfitRef.path === selectedRef.path;
        });
        console.log("Is match:", isMatch);
        return !isMatch;
      });

      // Update the document with the modified array
      await updateDoc(styleboardDocRef, { outfits: updatedOutfits });

      styleboard.outfits = updatedOutfits;

      // Clear the selected outfits and close the modal
      setSelectedOutfits([]);
      setShowDeleteModal(false);

      console.log("Outfits removed successfully from the styleboard.");
    } catch (error) {
      console.error("Error deleting outfit:", error);
    }
  }

  if (!styleboard) {
    return <p>No styleboard data found.</p>;
  }

  return (
    <div>
      <Navbar />
      <button onClick={() => navigate(-1)} style={{ marginBottom: '20px' }}>
        Back to Styleboards
      </button>

      <div className="center">
        <button className="outfit-button" onClick={() => {
          if (selectedOutfits.length > 0) {
            setShowDeleteModal(true);
          } else {
            alert("No outfit has been selected.");
          }
        }}>
          Delete
        </button>
      </div>

      <div className="center"><h1>{styleboard.name}</h1></div>
      
      <div className="center">
        <div className="outfit-outer">
          <div className="outfit-center">
            <OutfitsList outfits={styleboard.outfits} selectedOutfits={selectedOutfits} setSelectedOutfits={setSelectedOutfits} />
          </div>
        </div>
      </div>


      {/* Delete Modal */}
      <div className={`modal ${showDeleteModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Delete Outfit</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this outfit from this styleboard?</p>
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

export default StyleboardPage;