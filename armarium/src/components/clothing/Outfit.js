import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion"; 
import '../styles/Outfits.css';
import '../styles/Modal.css';
import Navbar from '../Navbar';
import { collection, getDoc, getDocs,addDoc,getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from '../backend/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import Joyride from 'react-joyride';

/**
 * The swipeable component for tops and bottoms
 * @param {Image to display} image 
 * @param {Function to handle swipes} handleSwipe
 * @param {Boolean for locking} isLocked
 * @returns the swipeable image.
 */
const SwipeableImage = ({ image, handleSwipe, isLocked, isAllLocked, handleSwipeAll, itemLength  }) => { 

  /**
  * Sample styling.
  */
  const style = { 
    backgroundImage: `url(${image})`,
    backgroundRepeat: "no-repeat", 
    backgroundSize: "contain", 
    backgroundPosition: "center",
    height: '100%',
  };

  /**
  * This moves the image for when the user wants to drag. 
  */
  const motionValue = useMotionValue(0);

  /**
   * This rotates the image.
   */
  const rotateValue = useTransform(motionValue, [-150, 150], [-10, 10]);

  /**
   * Decreases the opacity when swiping.
   */
  const opacityValue = useTransform(motionValue, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]); 

  /**
   * Framer animation hook.
   */
  const animControls = useAnimation();
  
  return ( 
    <motion.div
        drag={isLocked || itemLength <= 1 ? false : "x"}
        dragConstraints={{ left: -1000, right: 1000 }} 
        style={{
          ...style,
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
    />
  );
}

/**
 * The tinder style page for having users swipe left or right depending if they like the clothing item 
 * recommendation or not.
 * @returns Tinder page.
 */
function Outfit() {
  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [shoesIndex, setShoesIndex] = useState(0);
  const [tops, setTops] = useState([]);
  const [bottoms, setBottoms] = useState([]);
  const [shoes, setShoes] = useState([]);
  const [isLocked, setIsLocked] = useState({ top: false, bottom: false, shoes: false, all: false });
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
      content: 'This button enables all clothing items to change when swipping.',
    },
    {
      target: '#save',
      content: 'Once you’ve chosen your outfit, click here to save it.',
    },
    {
      target: '#upload-link',
      content: 'Lets go to the upload page to learn how to upload an clothing item.',
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
  }

  const handleSwipeTop = (direction) => {
    if (!isLocked.top && !isLocked.all && tops.length > 1) {
      if (direction === "left") {
        setTopIndex((prevIndex) => (prevIndex + 1) % tops.length);
      } else if (direction === "right") {
        setTopIndex((prevIndex) => (prevIndex - 1 + tops.length) % tops.length);
      }
      console.log('New Tops:', topIndex);
    }
  };

  const handleSwipeBottom = (direction) => {
    if (!isLocked.bottom && !isLocked.all && bottoms.length > 1) {
      if (direction === "left") {
        setBottomIndex((prevIndex) => (prevIndex + 1) % bottoms.length);
      } else if (direction === "right") {
        setBottomIndex((prevIndex) => (prevIndex - 1 + bottoms.length) % bottoms.length);
      }
      console.log('New Bottoms:', bottomIndex);
    }
  };

  const handleSwipeShoes = (direction) => {
    console.log("Shoes length", shoes.length);
    if (!isLocked.shoes && !isLocked.all && shoes.length > 1) {
      if (direction === "left") {
        setShoesIndex((prevIndex) => (prevIndex + 1) % shoes.length);
      } else if (direction === "right") {
        setShoesIndex((prevIndex) => (prevIndex - 1 + shoes.length) % shoes.length);
      }
      console.log('New Shoes:', shoesIndex);
    }
  };

  const checkNewUser = async (user) => {
    const userDocRef = doc(db, 'Users', user.uid);
    const userSnapshot = await getDoc(userDocRef);
    
    if (userSnapshot.exists() && userSnapshot.data().isNewUser) {
      setRunTour(true); // Run the tutorial
      //await updateDoc(userDocRef, { isNewUser: false }); // Mark tutorial as complete
    }
  };

  const finishTour = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDocRef = doc(db, 'Users', user.uid);
      await updateDoc(userDocRef, { isNewUser: false }); // Mark tutorial as complete
    }
    setRunTour(false); // Stop the tutorial
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            fetchData(user).then(() => setLoading(false));
            fetchData(user).then(() => checkNewUser(user));
        } else {
            navigate('/login'); // Ensure you have a login route
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
      //Rewrite to save itemid instead of url to user's outfits collection
      // Upload top image
      const topImage = tops[topIndex];
      const topImageRef = ref(storage, `Users/${user.uid}/top/${Date.now()}_${topIndex}.jpg`); ///Users/4EPRfCOVjgUV4tDlwbULjqhuPJJ3/ItemsCollection/top
      await uploadBytes(topImageRef, await fetch(topImage).then(r => r.blob()));
      const topImageUrl = await getDownloadURL(topImageRef);
      
      // Upload bottom image
      const bottomImage = bottoms[bottomIndex];
      const bottomImageRef = ref(storage, `Users/${user.uid}/bottoms/${Date.now()}_${bottomIndex}.jpg`);
      await uploadBytes(bottomImageRef, await fetch(bottomImage).then(r => r.blob()));
      const bottomImageUrl = await getDownloadURL(bottomImageRef);

      const shoesImage = shoes[shoesIndex];
      const shoesImageRef = ref(storage, `Users/${user.uid}/shoes/${Date.now()}_${shoesIndex}.jpg`);
      await uploadBytes(shoesImageRef, await fetch(shoesImage).then(r => r.blob()));
      const shoesImageUrl = await getDownloadURL(shoesImageRef);

      await addDoc(collection(db, `Users/${user.uid}/Outfits`), {
        topImageUrl,
        bottomImageUrl,
        shoesImageUrl,
        outfitName,
        timestamp: new Date()
      });

    
      // Store URLs in Firestore
    
      console.log('Outfit saved successfully');
      alert('Outfit saved successfully!');
      setShowModal(false);
      setOutfitName('');
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
  }

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
      
      // If toggling to 'all locked', make sure individual locks are disabled
      if (newState.all) {
        newState.top = false;
        newState.bottom = false;
        newState.shoes = false;
      }
      
      return newState;
    });
  };

  return (
    <>
      <div>
        <Navbar />
        <div className="App" id="homepage">
          <h1>Outfits</h1>
          <button onClick={toggleOneLock} id="lockall">
            {isLocked.all ? 'Unlock All' : 'Lock All'}
          </button>
  
          <br />
  
          <button onClick={toggleLockTop} id='lockbutton' disabled={isLocked.all}>
            {isLocked.top ? 'Unlock Top' : 'Lock Top'}
          </button>
  
          <div className="outfit-card">
            <div className="swipeable-container top">
              <SwipeableImage
                key={topIndex}
                image={tops[topIndex]}
                handleSwipe={handleSwipeTop}
                isLocked={isLocked.top}
                isAllLocked={isLocked.all}
                handleSwipeAll={handleSwipeAll}
                itemLength={tops.length}
              />
            </div>
  
            <div className="swipeable-container bottom">
              <SwipeableImage
                key={bottomIndex}
                image={bottoms[bottomIndex]}
                handleSwipe={handleSwipeBottom}
                isLocked={isLocked.bottom}
                isAllLocked={isLocked.all}
                handleSwipeAll={handleSwipeAll}
                itemLength={bottoms.length}
              />
            </div>
  
            <div className="swipeable-container bottom">
              <SwipeableImage
                key={shoesIndex}
                image={shoes[shoesIndex]}
                handleSwipe={handleSwipeShoes}
                isLocked={isLocked.shoes}
                isAllLocked={isLocked.all}
                handleSwipeAll={handleSwipeAll}
                itemLength={shoes.length}
              />
            </div>
          </div>
  
          <br />
  
          <button onClick={toggleLockBottom} disabled={isLocked.all}>
            {isLocked.bottom ? 'Unlock Bottom' : 'Lock Bottom'}
          </button>
  
          <br />
  
          <button onClick={toggleLockShoes} disabled={isLocked.all}>
            {isLocked.shoes ? 'Unlock Shoes' : 'Lock Shoes'}
          </button>
  
          <div>
            <button onClick={() => setShowModal(true)} id="save">Save Outfit</button>
          </div>
        </div>
      </div>
  
      {/* Modal for saving outfit */}
      <div className={`modal ${showModal ? 'd-block' : 'd-none'}`} tabIndex="-1" role="dialog">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Save Outfit</h5>
              <button type="button" className="btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
  
            <div className="modal-body">
              <p>Are you sure you want to save this outfit?</p>
              <input
                type="text"
                className="form-control"
                placeholder="Outfit name"
                value={outfitName}
                onChange={(e) => setOutfitName(e.target.value)}
              />
            </div>
  
            <div className="modal-footer">
              <button type="button" className="btn btn-danger" onClick={saveOutfit}>Yes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>No</button>
            </div>
          </div>
        </div>
      </div>
  
      {/* Joyride tutorial */}
      <Joyride
        steps={steps}
        run={runTour}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        callback={(data) => {
          if (data.status === 'finished' || data.status === 'skipped') { 
            navigate('/itemUpload')
          }
          else if (data.status == 'skipped') {
            finishTour();
          }
        }}
      />
    </>
  );
}

export default Outfit;