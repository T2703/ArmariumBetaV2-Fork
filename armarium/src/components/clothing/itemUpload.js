// Old code that will be used once funding happens.
import React, { useState, useEffect } from 'react';
import { storage, db, auth, analytics } from '../backend/firebaseConfig';
import { logEvent } from 'firebase/analytics';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { collection, addDoc, getDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../Navbar';
import Joyride from 'react-joyride';

const ItemUpload = () => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");
  const [itemType, setItemType] = useState("top");
  const [bgRemove, setBgRemove] = useState(null);
  const [runTour, setRunTour] = useState(false);
  const [steps, setSteps] = useState([ 
    {
      target: '#choosefile', 
      content: 'This is the button for choosing what image to upload.',
    },
    {
      target: '#selecttype', 
      content: 'You can choose what type of clothing it is such as top, bottom, or shoes.',
    },
    {
      target: '#textinput', 
      content: 'These are the inputs of where you can type in title, tags, or color.',
    },
    {
      target: '#uploadbutton', 
      content: 'Here is where you can upload your clothing item to the wardrobe once you are all done.',
    },
  ]);

  const handleChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }
    const user = auth.currentUser;
  
    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);
  
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progress);
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            setUrl(url);
            removeBackground(url).then((bgRemoveUrl) => {
              const itemId = `${itemType}-${new Date().getTime()}`;
              addDoc(collection(db, `Users/${user.uid}/ItemsCollection/${itemType}/items`), {
                url: bgRemoveUrl || url,
                title: title,
                tags: tags.split(',').map(tag => tag.trim()),
                color: color,
                itemId: itemId,
                createdAt: serverTimestamp(),
              }).then(() => {
                logEvent(analytics, 'item_uploaded', {
                  item_type: itemType,
                  title: title,
                  color: color,
                  tags: tags.split(',').map(tag => tag.trim()),
                });
                console.log('Item uploaded and event logged');
              }).catch((error) => {
                console.error('Error logging event:', error);
              });
            });
          });
        }
      );
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
    if (auth.currentUser) {
      checkNewUser(auth.currentUser);
    }
  }, []);

  const removeBackground = async (imageUrl) => {
    const apiKey = "izMQbubK4NUk3p24uQn9kBvP"; // Consider moving this to a secure location (e.g., environment variables)
    const apiUrl = "https://api.remove.bg/v1.0/removebg";
    const accountUrl = "https://api.remove.bg/v1.0/account";
  
    // Check account credits
    try {
      const accountRes = await fetch(accountUrl, {
        method: "GET",
        headers: {
          "X-Api-Key": apiKey,
        },
      });
  
      if (!accountRes.ok) {
        throw new Error("Failed to fetch account info.");
      }
  
      const accountData = await accountRes.json();
      const { total_credits, total_credits_used } = accountData.data.attributes;
      const remainingCredits = total_credits - total_credits_used;
  
      // Alert if half of the credits are used
      if (remainingCredits <= total_credits / 2) {
        alert("Warning: You've used more than half of your Remove.bg credits.");
      }
  
      if (remainingCredits <= 0) {
        alert("You've run out of Remove.bg credits. Please add more credits.");
        return null;
      }
  
      // Proceed with background removal
      const formData = new FormData();
      formData.append("image_url", imageUrl);
      formData.append("size", "auto");
  
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "X-Api-Key": apiKey,
        },
        body: formData,
      });
  
      if (res.status === 402) {
        alert("You've run out of Remove.bg credits. Please add more credits.");
        return null;
      }
  
      if (!res.ok) {
        throw new Error(`API error: ${res.statusText}`);
      }
  
      const data = await res.blob();
      const bgRemovedImageUrl = URL.createObjectURL(data);
      setBgRemove(bgRemovedImageUrl);
  
      const storageRef = ref(storage, `images/bg-removed-${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, data);
  
      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
          }
        );
      });
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="App">
        <h2>Upload an Item</h2>
        <progress value={progress} max="100" />
        <br />
        <input type="file" id="choosefile" onChange={handleChange} required />
        <br />
        <select onChange={(e) => setItemType(e.target.value)} id="selecttype" value={itemType}>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
          <option value="shoes">Shoes</option>
          <option value="toplayer">Top Layer</option>
        </select>
        <br />
        <br />
        <br />
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id = "textinput"
          required
        />
        <br />
        <input
          type="text"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          required
        />
        <br />
        <button onClick={handleUpload} id="uploadbutton">Upload</button>
        <br />
        {url && <img src={bgRemove || url} alt="Uploaded" style={{ width: "300px" }} />}
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
            finishTour();
          }
        }}
      />
    </div>
  );
};

export default ItemUpload;

// Old code that will be used once funding happens.
/*import React, { useState } from 'react';
import { storage, db, auth } from '../backend/firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../Navbar';

const ItemUpload = () => {
  const [image, setImage] = useState(null);
  const [url, setUrl] = useState("");
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState("");
  const [title, setTitle] = useState("");
  const [color, setColor] = useState("");
  const [itemType, setItemType] = useState("top");
  const [bgRemove, setBgRemove] = useState(null);

  const handleChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }
    const user = auth.currentUser;

    if (image) {
      const storageRef = ref(storage, `images/${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, image);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setProgress(progress);
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((url) => {
            setUrl(url);
            removeBackground(url).then((bgRemoveUrl) => {
              const itemId = `${itemType}-${new Date().getTime()}`;
              addDoc(collection(db, `Users/${user.uid}/ItemsCollection/${itemType}/items`), {
                url: bgRemoveUrl || url,
                title: title,
                tags: tags.split(',').map(tag => tag.trim()),
                color: color,
                itemId: itemId,
                createdAt: serverTimestamp(),
              });
            })
          });
        }
      );
    }
  };

  const removeBackground = async (imageUrl) => {
    const apiKey = "izMQbubK4NUk3p24uQn9kBvP"; // At some point this should be in a hidden place. 
    const apiUrl = "https://api.remove.bg/v1.0/removebg";

    const formData = new FormData();
    formData.append("image_url", imageUrl);
    formData.append("size", "auto");

    try {
      const res = await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'X-Api-Key': apiKey
          },
          body: formData
      });

      const data = await res.blob();
      const bgRemovedImageUrl = URL.createObjectURL(data);
      setBgRemove(bgRemovedImageUrl);

      const storageRef = ref(storage, `images/bg-removed-${image.name}`);
      const uploadTask = uploadBytesResumable(storageRef, data);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          null,
          (error) => reject(error),
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
          }
        );
      });

    } catch (error) {
      console.log(error);
      return null;
    }
  };

  return (
    <div>
      <Navbar />
      <div className="App">
      <h2>Upload an Item</h2>
      <progress value={progress} max="100" />
      <br />
      <input type="file" onChange={handleChange} />
      <br />
      <select onChange={(e) => setItemType(e.target.value)} value={itemType}>
        <option value="top">Top</option>
        <option value="bottom">Bottom</option>
        <option value="shoes">Shoes</option>
      </select>
      <br />
      <br />
      <br />
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <br />
      <input
        type="text"
        placeholder="Tags (comma separated)"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        required
      />
      <br />
      <input
        type="text"
        placeholder="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
        required
      />
      <br />
      <button onClick={handleUpload}>Upload</button>
      <br />
      {url && <img src={bgRemove || url} alt="Uploaded" style={{ width: "300px" }} />}
    </div>
    </div>
  );
};

export default ItemUpload;*/
