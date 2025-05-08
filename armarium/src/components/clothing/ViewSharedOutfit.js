import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig';
import Navbar from '../Navbar';
import Loader from '../Loader';
import '../styles/ViewSharedOutfit.css'; 

function ViewSharedOutfit() {
  // Get parameters from URL instead of location.state
  const { outfitId, ownerId } = useParams();
  const navigate = useNavigate();
  const [outfit, setOutfit] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchOutfit = async () => {
      if (!outfitId || !ownerId) {
        console.error("Missing outfit ID or owner ID");
        navigate('/outfits');
        return;
      }
      
      try {
        console.log("Fetching outfit:", outfitId, "from owner:", ownerId);
        const outfitDoc = await getDoc(doc(db, `Users/${ownerId}/Outfits/${outfitId}`));
        
        if (outfitDoc.exists()) {
          setOutfit({ id: outfitDoc.id, ...outfitDoc.data() });
        } else {
          console.error("Outfit not found");
          alert('Outfit not found');
          navigate('/outfits');
        }
      } catch (error) {
        console.error('Error fetching outfit:', error);
        alert('Error loading outfit');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOutfit();
  }, [outfitId, ownerId, navigate]);
  
  const handleBack = () => {
    // Get the stored conversation data
    const lastConversation = JSON.parse(sessionStorage.getItem('lastConversation'));
    
    // Navigate back to the home page
    navigate('/outfits');
    
    // Set a flag to reopen the conversation
    if (lastConversation) {
      sessionStorage.setItem('reopenConversation', JSON.stringify(lastConversation));
    }
  };
  
  if (loading) {
    return <Loader loading={loading} />;
  }
  
  if (!outfit) {
    return (
      <>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-warning">Outfit not found</div>
          <button className="btn btn-primary" onClick={() => navigate('/outfits')}>
            Back to Home
          </button>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Navbar />
      <div className="shared-outfit-container">
        <div className="shared-outfit-header">
          <h1 className="outfit-title">{outfit.outfitName || 'Shared Outfit'}</h1>
          <button className="back-btn" onClick={handleBack}>
            Back to Conversation
          </button>
        </div>
        
        <div className="main-outfit-items">
          <div className="outfit-card">
            <img src={outfit.topImageUrl} alt="Top" className="outfit-image" />
            <h5 className="item-title">Top</h5>
          </div>
          
          <div className="outfit-card">
            <img src={outfit.bottomImageUrl} alt="Bottom" className="outfit-image" />
            <h5 className="item-title">Bottom</h5>
          </div>
          
          <div className="outfit-card">
            <img src={outfit.shoesImageUrl} alt="Shoes" className="outfit-image" />
            <h5 className="item-title">Shoes</h5>
          </div>
        </div>
        
        {outfit.topLayerUrls && outfit.topLayerUrls.length > 0 && (
        <div className="additional-items">
            <h2 className="section-title">Top Layers</h2>
            <div className="items-grid">
            {outfit.topLayerUrls.map((url, index) => (
                <div key={index} className="additional-item-card">
                <img src={url} alt={`Top Layer ${index+1}`} className="additional-image" />
                <h5 className="additional-title">Layer {index+1}</h5>
                </div>
            ))}
            </div>
        </div>
        )}
        
        {outfit.accessoryUrls && outfit.accessoryUrls.length > 0 && (
        <div className="additional-items">
            <h2 className="section-title">Accessories</h2>
            <div className="items-grid">
            {outfit.accessoryUrls.map((url, index) => (
                <div key={index} className="additional-item-card">
                <img src={url} alt={`Accessory ${index+1}`} className="additional-image" />
                <h5 className="additional-title">Accessory {index+1}</h5>
                </div>
            ))}
            </div>
        </div>
        )}
      </div>
    </>
  );
}

export default ViewSharedOutfit;