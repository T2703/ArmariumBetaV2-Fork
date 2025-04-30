import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import '../styles/CreateAOutfit.css';
import '../styles/Modal.css';
import Navbar from '../Navbar';
import { collection, getDoc, getDocs, addDoc, getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '../backend/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Joyride from 'react-joyride';

/**
 * The swipeable component for tops, bottoms, top layers, and accessories
 * @param {Image URL to display} image 
 * @param {Function to handle swipes} handleSwipe
 * @param {Boolean for locking} isLocked
 * @returns the swipeable image.
 */
const SwipeableImage = ({ image, handleSwipe, isLocked, isAllLocked, handleSwipeAll, itemLength }) => {
  const motionValue = useMotionValue(0);
  const rotateValue = useTransform(motionValue, [-150, 150], [-10, 10]);
  const opacityValue = useTransform(motionValue, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const animControls = useAnimation();

  return (
    <motion.div
      drag={isLocked || itemLength <= 1 ? false : "x"}
      dragConstraints={{ left: -1000, right: 1000 }}
      style={{
        width: '100%',
        height: '100%',
        x: motionValue,
        rotate: rotateValue,
        opacity: opacityValue
      }}
      onDragEnd={(event, info) => {
        if (Math.abs(info.point.x) <= 10) {
          animControls.start({ x: 0, rotate: 0, opacity: 1 });
        }
        else {
          const direction = info.offset.x < 0 ? "left" : "right";
          animControls.start({
            x: direction === "left" ? -1000 : 1000,
            rotate: direction === "left" ? -20 : 20,
            opacity: 0
          }).then(() => {
            if (isAllLocked) {
              handleSwipeAll(direction);
            } else {
              handleSwipe(direction);
            }
            animControls.start({ x: 0, rotate: 0, opacity: 1 });
          });
        }
      }}
    >
      <img src={image} alt="Clothing item" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </motion.div>
  );
}

/**
 * The tinder-style page for users to swipe left or right on clothing items.
 * @returns Outfit page.
 */
function Outfit() {
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [shoesIndex, setShoesIndex] = useState(0);
  const [topLayerIndex, setTopLayerIndex] = useState(0);
  const [accessoryIndex, setAccessoryIndex] = useState(0);
  const [tops, setTops] = useState([]);
  const [bottoms, setBottoms] = useState([]);
  const [shoes, setShoes] = useState([]);
  const [topLayers, setTopLayers] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [isLocked, setIsLocked] = useState({ top: false, bottom: false, shoes: false, all: false });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTopLayers, setSelectedTopLayers] = useState([]);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [showLayers, setShowLayers] = useState(false);
  const DELAY = 650;
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [outfitName, setOutfitName] = useState('');
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState([
    {
      target: '.navbar',
      content: 'This is the navigation bar where you can access the pages.',
    },
    {
      target: '#home-link',
      content: 'This is the Home page where you can swipe through clothing items and save outfits.',
    },
    {
      target: '#homepage',
      content: 'This is the main area where you can browse and create outfits by swiping left or right on the clothing items.',
    },
    {
      target: '#.swipeable-container.top',
      content: 'Swipe left or right to browse through the clothing item. Each clothing item has one.'
    },
    {
      target: '#lockbutton',
      content: 'Each clothing item has a lock button, locking it means it will not change/swipe.',
    },
    {
      target: '#lockall',
      content: 'This button enables all clothing items to change when swiping.',
    },
    {
      target: '#save',
      content: 'Once you’ve chosen your outfit, click here to save it.',
    },
    {
      target: '#upload-link',
      content: 'Lets go to the upload page to learn how to upload a clothing item.',
    },
  ]);

  const fetchData = async (user) => {
    await new Promise(resolve => setTimeout(resolve, DELAY));
    if (tops.length === 0) {
      const topsCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/top/items`));
      const topsData = topsCollection.docs.map(doc => doc.data().url);
      setTops(topsData);
    }

    if (bottoms.length === 0) {
      const bottomsCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/bottom/items`));
      const bottomsData = bottomsCollection.docs.map(doc => doc.data().url);
      setBottoms(bottomsData);
    }

    if (shoes.length === 0) {
      const shoesCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/shoes/items`));
      const shoesData = shoesCollection.docs.map(doc => doc.data().url);
      setShoes(shoesData);
    }

    if (topLayers.length === 0) {
      const topLayersCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/topLayer/items`));
      const topLayersData = topLayersCollection.docs.map(doc => doc.data().url);
      setTopLayers(topLayersData);
    }

    if (accessories.length === 0) {
      const accessoriesCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/accessory/items`));
      const accessoriesData = accessoriesCollection.docs.map(doc => doc.data().url);
      setAccessories(accessoriesData);
    }
  }

  const handleSwipeTop = (direction) => {
    if (!isLocked.top && !isLocked.all && tops.length > 1) {
      if (direction === "left") {
        setTopIndex((prevIndex) => (prevIndex + 1) % tops.length);
      } else if (direction === "right") {
        setTopIndex((prevIndex) => (prevIndex - 1 + tops.length) % tops.length);
      }
    }
  };

  const handleSwipeBottom = (direction) => {
    if (!isLocked.bottom && !isLocked.all && bottoms.length > 1) {
      if (direction === "left") {
        setBottomIndex((prevIndex) => (prevIndex + 1) % bottoms.length);
      } else if (direction === "right") {
        setBottomIndex((prevIndex) => (prevIndex - 1 + bottoms.length) % bottoms.length);
      }
    }
  };

  const handleSwipeShoes = (direction) => {
    if (!isLocked.shoes && !isLocked.all && shoes.length > 1) {
      if (direction === "left") {
        setShoesIndex((prevIndex) => (prevIndex + 1) % shoes.length);
      } else if (direction === "right") {
        setShoesIndex((prevIndex) => (prevIndex - 1 + shoes.length) % shoes.length);
      }
    }
  };

  const checkNewUser = async (user) => {
    const userDocRef = doc(db, 'Users', user.uid);
    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists() && userSnapshot.data().isNewUser) {
      setRunTour(true);
      await updateDoc(userDocRef, { isNewUser: false });
    }
  };

  const finishTour = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'Users', user.uid);
      await updateDoc(userDocRef, { isNewUser: false });
    }
    setRunTour(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user).then(() => setLoading(false));
        fetchData(user).then(() => checkNewUser(user));
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const saveOutfit = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('Please log in to save your outfit.');
      return;
    }

    try {
      const topImage = tops[topIndex];
      const bottomImage = bottoms[bottomIndex];
      const shoesImage = shoes[shoesIndex];

      const topLayerUrls = [];
      for (let i = 0; i < selectedTopLayers.length; i++) {
        const topLayerImage = selectedTopLayers[i];
        const topLayerRef = ref(storage, `Users/Outfits/${user.uid}/${outfitName}/topLayers/${Date.now()}_${i}.jpg`);
        await uploadBytes(topLayerRef, await fetch(topLayerImage).then(r => r.blob()));
        const topLayerUrl = await getDownloadURL(topLayerRef);
        topLayerUrls.push(topLayerUrl);
      }

      const accessoryUrls = [];
      for (let i = 0; i < selectedAccessories.length; i++) {
        const accessoryImage = selectedAccessories[i];
        const accessoryRef = ref(storage, `Users/Outfits/${user.uid}/${outfitName}/accessories/${Date.now()}_${i}.jpg`);
        await uploadBytes(accessoryRef, await fetch(accessoryImage).then(r => r.blob()));
        const accessoryUrl = await getDownloadURL(accessoryRef);
        accessoryUrls.push(accessoryUrl);
      }

      await addDoc(collection(db, `Users/${user.uid}/Outfits`), {
        topImageUrl: topImage,
        bottomImageUrl: bottomImage,
        shoesImageUrl: shoesImage,
        topLayerUrls,
        accessoryUrls,
        outfitName,
        timestamp: new Date()
      });

      alert('Outfit saved successfully!');
      setShowModal(false);
      setOutfitName('');
      setSelectedTopLayers([]);
      setSelectedAccessories([]);
    } catch (error) {
      console.error('Error saving outfit:', error);
      alert('Error saving outfit. Please try again.');
    }
  };

  const handleSwipeAll = (direction) => {
    if (isLocked.all) {
      if (direction === "left") {
        setTopIndex((prevIndex) => (prevIndex + 1) % tops.length);
        setBottomIndex((prevIndex) => (prevIndex + 1) % bottoms.length);
        setShoesIndex((prevIndex) => (prevIndex + 1) % shoes.length);
      } else if (direction === "right") {
        setTopIndex((prevIndex) => (prevIndex - 1 + tops.length) % tops.length);
        setBottomIndex((prevIndex) => (prevIndex - 1 + bottoms.length) % bottoms.length);
        setShoesIndex((prevIndex) => (prevIndex + 1) % shoes.length);
      }
    }
  };

  const toggleLockTop = () => {
    setIsLocked(prevState => ({ ...prevState, top: !prevState.top }));
  };

  const toggleLockBottom = () => {
    setIsLocked(prevState => ({ ...prevState, bottom: !prevState.bottom }));
  };

  const toggleLockShoes = () => {
    setIsLocked(prevState => ({ ...prevState, shoes: !prevState.shoes }));
  };

  const toggleOneLock = () => {
    setIsLocked(prevState => {
      const newState = { ...prevState, all: !prevState.all };
      if (newState.all) {
        newState.top = false;
        newState.bottom = false;
        newState.shoes = false;
      }
      return newState;
    });
  };

  const toggleLayers = () => {
    setShowLayers(prev => !prev);
  };

  const handleDeleteItem = (url, category) => {
    if (category === 'topLayer') {
      setSelectedTopLayers(prev => prev.filter(item => item !== url));
    } else if (category === 'accessory') {
      setSelectedAccessories(prev => prev.filter(item => item !== url));
    }
  };

  return (
    <div>
      <Navbar />
      <div className="App" id="homepage">
        <h1 className="outfits-title">
          Outfits
          <img
            src="save.png"
            alt="Save Outfit"
            onClick={() => setShowModal(true)} /* Opens the Save Outfit modal */
            className="save-image"
            style={{ cursor: "pointer" }}
          />
        </h1>
        <div className="header-buttons">
          {/* Lock All Button */}
          <img
            src={isLocked.all ? "unlock.png" : "lock.png"}
            alt={isLocked.all ? "Unlock All" : "Lock All"}
            onClick={toggleOneLock}
            className="lock-image"
            style={{ cursor: "pointer" }}
          />

          {/* Add Modal Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="circle-btn"
          >
            <span className="plus-icon">+</span>
          </button>

          {/* Flip Button */}
          <img
            src="flip.png"
            alt="Flip"
            onClick={toggleLayers}
            className="flip-image"
            style={{ cursor: "pointer" }}
          />
        </div>

        <div className="main-content">
          {showAddModal && (
            <div className="modal-container">
              <div className="modal-content">
                <div className="modal-header">
                  <h3 className="modal-title">Add Top Layers and Accessories</h3>
                  <button type="button" className="close-btn" onClick={() => setShowAddModal(false)}>X</button>
                </div>
                <div className="modal-body">
                  <div className="swipeable-section">
                    <div className="swipeable-wrapper">
                      <div className="swipeable-container topLayer">
                        <h3>Top Layers</h3>
                        {topLayers.length > 0 ? (
                          <SwipeableImage
                            key={topLayerIndex}
                            image={topLayers[topLayerIndex]}
                            handleSwipe={(direction) => {
                              if (direction === "left") {
                                setTopLayerIndex((prevIndex) => (prevIndex + 1) % topLayers.length);
                              } else if (direction === "right") {
                                setTopLayerIndex((prevIndex) => (prevIndex - 1 + topLayers.length) % topLayers.length);
                              }
                            }}
                            isLocked={false}
                            isAllLocked={false}
                            itemLength={topLayers.length}
                          />
                        ) : (
                          <p>No top layers available.</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const selectedImage = topLayers[topLayerIndex];
                          if (!selectedTopLayers.includes(selectedImage)) {
                            setSelectedTopLayers((prev) => [...prev, selectedImage]);
                          }
                        }}
                        className="modal-action-btn"
                        disabled={topLayers.length === 0}
                      >
                        Add Top Layer
                      </button>
                    </div>
                    <div className="selected-items-box">
                      <h3>Selected Top Layers</h3>
                      <div className="selected-items">
                        {selectedTopLayers.map((url, index) => (
                          <div key={index} className="selected-item">
                            <img src={url} alt={`Top Layer ${index + 1}`} className="selected-image" />
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteItem(url, 'topLayer')}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="swipeable-section">
                    <div className="swipeable-wrapper">
                      <div className="swipeable-container accessory">
                        <h3>Accessories</h3>
                        {accessories.length > 0 ? (
                          <SwipeableImage
                            key={accessoryIndex}
                            image={accessories[accessoryIndex]}
                            handleSwipe={(direction) => {
                              if (direction === "left") {
                                setAccessoryIndex((prevIndex) => (prevIndex + 1) % accessories.length);
                              } else if (direction === "right") {
                                setAccessoryIndex((prevIndex) => (prevIndex - 1 + accessories.length) % accessories.length);
                              }
                            }}
                            isLocked={false}
                            isAllLocked={false}
                            itemLength={accessories.length}
                          />
                        ) : (
                          <p>No accessories available.</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          const selectedImage = accessories[accessoryIndex];
                          if (!selectedAccessories.includes(selectedImage)) {
                            setSelectedAccessories((prev) => [...prev, selectedImage]);
                          }
                        }}
                        className="modal-action-btn"
                        disabled={accessories.length === 0}
                      >
                        Add Accessory
                      </button>
                    </div>
                    <div className="selected-items-box">
                      <h3>Selected Accessories</h3>
                      <div className="selected-items">
                        {selectedAccessories.map((url, index) => (
                          <div key={index} className="selected-item">
                            <img src={url} alt={`Accessory ${index + 1}`} className="selected-image" />
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteItem(url, 'accessory')}
                            >
                              X
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="done-btn" onClick={() => setShowAddModal(false)}>
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="outfit-builder">
            {!showLayers ? (
              <>
                {/* Top Clothing Container */}
                <div className="clothing-container">
                  <div className="lock-icon">
                    <img
                      src={isLocked.top ? "unlock.png" : "lock.png"}
                      alt={isLocked.top ? "Unlock Top" : "Lock Top"}
                      onClick={toggleLockTop}
                      className="lock-image"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div className="swipeable-container top">
                    {tops.length > 0 ? (
                      <SwipeableImage
                        key={topIndex}
                        image={tops[topIndex]}
                        handleSwipe={handleSwipeTop}
                        isLocked={isLocked.top}
                        isAllLocked={isLocked.all}
                        handleSwipeAll={handleSwipeAll}
                        itemLength={tops.length}
                      />
                    ) : (
                      <p>No tops available.</p>
                    )}
                  </div>
                </div>

                {/* Bottom Clothing Container */}
                <div className="clothing-container">
                  <div className="lock-icon">
                    <img
                      src={isLocked.bottom ? "unlock.png" : "lock.png"}
                      alt={isLocked.bottom ? "Unlock Bottom" : "Lock Bottom"}
                      onClick={toggleLockBottom}
                      className="lock-image"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div className="swipeable-container bottom">
                    {bottoms.length > 0 ? (
                      <SwipeableImage
                        key={bottomIndex}
                        image={bottoms[bottomIndex]}
                        handleSwipe={handleSwipeBottom}
                        isLocked={isLocked.bottom}
                        isAllLocked={isLocked.all}
                        handleSwipeAll={handleSwipeAll}
                        itemLength={bottoms.length}
                      />
                    ) : (
                      <p>No bottoms available.</p>
                    )}
                  </div>
                </div>

                {/* Shoes Clothing Container */}
                <div className="clothing-container">
                  <div className="lock-icon">
                    <img
                      src={isLocked.shoes ? "unlock.png" : "lock.png"}
                      alt={isLocked.shoes ? "Unlock Shoes" : "Lock Shoes"}
                      onClick={toggleLockShoes}
                      className="lock-image"
                      style={{ cursor: "pointer" }}
                    />
                  </div>
                  <div className="swipeable-container shoes">
                    {shoes.length > 0 ? (
                      <SwipeableImage
                        key={shoesIndex}
                        image={shoes[shoesIndex]}
                        handleSwipe={handleSwipeShoes}
                        isLocked={isLocked.shoes}
                        isAllLocked={isLocked.all}
                        handleSwipeAll={handleSwipeAll}
                        itemLength={shoes.length}
                      />
                    ) : (
                      <p>No shoes available.</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Top Layer Overlay */}
                <div className="clothing-container">
                  <div className="overlay-container">
                    <h3>Selected Top Layers</h3>
                    <div className="overlay-items">
                      {selectedTopLayers.length > 0 ? (
                        selectedTopLayers.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Top Layer ${index + 1}`}
                            className="overlay-image"
                          />
                        ))
                      ) : (
                        <p>No top layers selected.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Accessory Overlay */}
                <div className="clothing-container">
                  <div className="overlay-container">
                    <h3>Selected Accessories</h3>
                    <div className="overlay-items">
                      {selectedAccessories.length > 0 ? (
                        selectedAccessories.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Accessory ${index + 1}`}
                            className="overlay-image"
                          />
                        ))
                      ) : (
                        <p>No accessories selected.</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div className={`modal ${showModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Save Outfit</h5>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="form-control"
                placeholder="Outfit name"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={saveOutfit}>Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </div>

      <Joyride
        steps={steps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={(data) => {
          if (data.status === 'finished' || data.status === 'skipped') {
            navigate('/itemUpload');
          } else if (data.status === 'skipped') {
            finishTour();
          }
        }}
      />
    </div>
  );
}

export default Outfit;