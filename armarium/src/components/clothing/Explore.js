import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig'; 
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../backend/firebaseConfig";
import Navbar from '../Navbar';
import '../styles/ExploreFormat.css'; 

function Explore() {
  const [explore, setExplore] = useState([]);
  const auth = getAuth(); 
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();
  const DELAY = 750;

  const fetchAllStyleboards = async () => {
    try {
      setLoading(true);
      const currentUser = auth.currentUser; // Get the current user
      const usersSnapshot = await getDocs(collection(db, 'Users'));
      const allStyleboards = [];
  
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
  
        // Skip the current user's styleboards
        if (currentUser && userId === currentUser.uid) {
          continue;
        }
  
        console.log(`Fetching styleboards for user: ${userId}`);
  
        // Create a valid Firebase Storage reference for the user's styleboards
        const styleboardsRef = ref(storage, `Users/Styleboards/${userId}`);
        const styleboardsSnapshot = await listAll(styleboardsRef);
  
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
  
          allStyleboards.push({
            id: folderRef.name,
            styleboardName,
            outfits,
          });
        }
      }
  
      setExplore(allStyleboards);
      console.log("Fetched all styleboards:", allStyleboards);
    } catch (error) {
      console.error("Error fetching all styleboards:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchAllStyleboards();
  }, []);


const handleSearchChange = (e) => {
  const inputValue = e.target.value.toLowerCase();
  setSearchInput(inputValue);
}

// const handleDelete = async () => {
//   const user = auth.currentUser;
//   if (!styleboardToDelete.length) {
//     alert("No styleboard has been selected.");
//     return;
//   }

//   try {
//     await new Promise((resolve) => setTimeout(resolve, DELAY));

//     for (const styleboard of styleboardToDelete) {
//       console.log("Starting deletion for styleboard:", styleboard.id);

//       // Delete all files in the styleboard folder from Firebase Storage
//       const styleboardFolderRef = ref(storage, `Users/Styleboards/${user.uid}/${styleboard.id}`);
//       const filesSnapshot = await listAll(styleboardFolderRef);

//       for (const fileRef of filesSnapshot.items) {
//         console.log("Deleting file:", fileRef.fullPath);
//         await deleteObject(fileRef); 
//       }

//       // Delete all subfolders
//       for (const folderRef of filesSnapshot.prefixes) {
//         console.log("Deleting subfolder:", folderRef.fullPath);
//         const subfolderSnapshot = await listAll(folderRef);

//         for (const subfileRef of subfolderSnapshot.items) {
//           console.log("Deleting file in subfolder:", subfileRef.fullPath);
//           await deleteObject(subfileRef); // Delete each file in the subfolder
//         }
//       }

//       console.log("All files and subfolders deleted for styleboard:", styleboard.id);

//       // Delete the styleboard document from Firestore
//       const styleboardDocRef = doc(db, `Users/${user.uid}/Styleboards`, styleboard.id);
//       console.log("Attempting to delete Firestore document:", styleboardDocRef.path);
//       await deleteDoc(styleboardDocRef);
//       console.log("Firestore document deleted for styleboard:", styleboard.id);
//     }

//     setStyleboards((prevStyleboards) =>
//       prevStyleboards.filter(
//         (styleboard) => !styleboardToDelete.some((item) => item.id === styleboard.id)
//       )
//     );

//     setStyleboardToDelete([]);
//     setIsDelete(false); 
//     console.log("Deletion process completed.");
//   } catch (error) {
//     console.error("Error deleting styleboard:", error);
//     alert("Failed to delete styleboard. Please try again.");
//   }
// };

// const addToDeleteList = (styleboards) => {
//   setStyleboardToDelete(prevList => {
//       if (prevList.some(item => item.id === styleboards.id)) {
//           return prevList.filter(item => item.id !== styleboards.id);
//       } else {
//           return [...prevList, styleboards];
//       }
//   });
// }

// const toggleDelete = () => {
//   console.log("Toggling delete mode. Current state:", isDelete); 
//   if (isDelete) {
//     setStyleboardToDelete([]);
//   }
//   setIsDelete(!isDelete);
// };

const handleStyleboardClick = (styleboard) => {
  navigate(`/styleboard/${styleboard.id}`, { state: { styleboard } });
};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchAllStyleboards().then(() => setLoading(false));
        } else {
            navigate('/login'); 
        }
    });

    return () => unsubscribe();
}, []);

return (
  <div>
    {/* Loader overlay */}
    {loading && (
      <div className="loader-overlay">
        <div className="loader"></div>
      </div>
    )}
    <Navbar /> 
  <div className={loading ? 'blurred' : ''}>
    <h1>Explore Styleboards</h1>

    <input
      type="text"
      placeholder="Search styleboard by title"
      value={searchInput}
      onChange={handleSearchChange} 
    />

    {/* <button onClick={toggleDelete}>
      {isDelete ? 'Cancel' : 'Delete'}
    </button>
    {isDelete && (
      <button onClick={handleDelete} style={{ marginLeft: '10px' }}>
        Confirm Delete
      </button>
    )} */}


    <ul className="styleboards-list">
      {explore.length > 0 ? (
        explore.map((styleboard) => {
          const outfits = styleboard.outfits || []; // Ensure outfits is defined
          const firstOutfit = outfits.length > 0 ? outfits[0] : null; // Get the first outfit if it exists
          const images = firstOutfit ? firstOutfit.images || {} : {}; // Ensure images is defined

          return (
            <li
              key={styleboard.id} // Use styleboard.id instead of explore.id
              className="styleboard-item"
              onClick={() => {
                  console.log("Navigating to styleboard:", styleboard.id); 
                  handleStyleboardClick(styleboard);
              }}
              style={{
                cursor: 'pointer',
                padding: '10px',
                margin: '10px',
              }}
            >
              <div className="image-container">
                <h1>{styleboard.styleboardName || "Unnamed Styleboard"}</h1>
                {firstOutfit ? (
                  <div>
                    {images.top ? (
                      <img
                        src={images.top}
                        alt="Top"
                        className="styleboard-image"
                      />
                    ) : (
                      <p>No top image available</p>
                    )}
                    {images.bottom ? (
                      <img
                        src={images.bottom}
                        alt="Bottom"
                        className="styleboard-image"
                      />
                    ) : (
                      <p>No bottom image available</p>
                    )}
                    {images.shoes ? (
                      <img
                        src={images.shoes}
                        alt="Shoes"
                        className="styleboard-image"
                      />
                    ) : (
                      <p>No shoes image available</p>
                    )}
                  </div>
                ) : (
                  <p>No outfits available</p>
                )}
              </div>
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

export default Explore;
