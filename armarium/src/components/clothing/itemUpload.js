// Old code that will be used once funding happens.
import React, { useState, useEffect } from 'react';
import { storage, db, auth, analytics } from '../backend/firebaseConfig';
import { logEvent } from 'firebase/analytics';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { collection, addDoc, getDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import Navbar from '../Navbar';
import Joyride from 'react-joyride';
import { Center } from 'framer/render/presentation/Frame/DeprecatedFrame.js';
import '../styles/Forms.css';

const ItemUpload = ({type}) => {
  const [items, setItems] = useState([
    { file: null, title: '', tags: '', color: '', type: '', preview: null },
  ]);
  const [images, setImages] = useState([]);
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
      content: 'Here is where you can upload your clothing item to the wadrobe once you are all done.',
    },
  ]);

  const handleFileChange = (index, file) => {
    const updatedItems = [...items];
    updatedItems[index].file = file;
    updatedItems[index].preview = URL.createObjectURL(file);
    setItems(updatedItems);
  };

  useEffect(() => {
    setItems((prevItems) =>
      prevItems.map((item => ({ ...item, type: type || '' })))
    );
  }, [type]);

  // const handleChange = (e) => {
  //   if (e.target.files[0]) {
  //     setImages(e.target.files[0]);
  //   }
  // };

  // const handleChange = (e) => {
  //   if (e.target.files) {
  //     setImages(Array.from(e.target.files)); // Convert FileList to an array
  //   }
  // };

  const handleInputChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const addNewItem = () => {
    setItems([...items, { file: null, title: '', tags: '', color: '', type: '', preview: null }]);
  };

  // const handleUpload = () => {
  //   if (!auth.currentUser) {
  //     console.error('User is not authenticated');
  //     return;
  //   }
  //   const user = auth.currentUser;
  
  //   if (image) {
  //     const storageRef = ref(storage, `images/${image.name}`);
  //     const uploadTask = uploadBytesResumable(storageRef, image);
  
  //     uploadTask.on(
  //       "state_changed",
  //       (snapshot) => {
  //         const progress = Math.round(
  //           (snapshot.bytesTransferred / snapshot.totalBytes) * 100
  //         );
  //         setProgress(progress);
  //       },
  //       (error) => {
  //         console.log(error);
  //       },
  //       () => {
  //         getDownloadURL(uploadTask.snapshot.ref).then((url) => {
  //           setUrl(url);
  //           removeBackground(url).then((bgRemoveUrl) => {
  //             const itemId = `${itemType}-${new Date().getTime()}`;
  //             addDoc(collection(db, `Users/${user.uid}/ItemsCollection/${itemType}/items`), {
  //               url: bgRemoveUrl || url,
  //               title: title,
  //               tags: tags.split(',').map(tag => tag.trim()),
  //               color: color,
  //               itemId: itemId,
  //               createdAt: serverTimestamp(),
  //             }).then(() => {
  //               logEvent(analytics, 'item_uploaded', {
  //                 item_type: itemType,
  //                 title: title,
  //                 color: color,
  //                 tags: tags.split(',').map(tag => tag.trim()),
  //               });
  //               console.log('Item uploaded and event logged');
  //             }).catch((error) => {
  //               console.error('Error logging event:', error);
  //             });
  //           });
  //         });
  //       }
  //     );
  //   }
  // };

  const handleUpload = async () => {
    if (!auth.currentUser) {
      console.error('User is not authenticated');
      return;
    }
    const user = auth.currentUser;

    const uploadPromises = items.map((item, index) => {
      if (!item.file) {
        console.error(`Item ${index + 1} is missing a file.`);
        return Promise.resolve(); // Skip this item
      }

      if (!item.type) {
        console.error(`Item ${index + 1} is missing a type.`);
        return Promise.resolve(); // Skip this item
      }

      const storageRef = ref(storage, `images/${item.file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, item.file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progressValue = Math.round(
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            );
            setProgress((prev) => ({
              ...prev,
              [item.file.name]: progressValue,
            }));
          },
          (error) => {
            console.error(error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then((url) => {
              addDoc(collection(db, `Users/${user.uid}/ItemsCollection/${item.type}/items`), {
                url: url,
                title: item.title,
                tags: item.tags.split(',').map((tag) => tag.trim()),
                color: item.color,
                createdAt: serverTimestamp(),
              }).then(() => resolve(url));
            }); 
          }
        );
      });
    });

    Promise.all(uploadPromises)
      .then(() => {
        console.log('All items uploaded successfully');
        alert('All items uploaded successfully!');
      })
      .catch((error) => {
        console.error('Error uploading items:', error);
      });
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
  
      const storageRef = ref(storage, `images/bg-removed-${images.name}`);
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
        <div className='Form-box'>
          <div className='input-group'>
        <h2 style={{ textAlign: 'center' }}>Upload Items</h2>
        {items.map((item, index) => (
        <div key={index} style={{ marginBottom: '20px', padding: '20px' }}>
          <input
            type="file"
            onChange={(e) => handleFileChange(index, e.target.files[0])}
            required
          />
          {item.preview && (
            <div>
              <img
                src={item.preview}
                alt="Preview"
                style={{ width: '100px', height: 'auto', marginTop: '10px' }}
              />
            </div>
          )}
          <select
            value={item.type}
            onChange={(e) => handleInputChange(index, 'type', e.target.value)}
            required
            style={{
              display: 'block', // Makes the select box a block element
              margin: '0 auto', // Centers it horizontally
              marginBottom: '10px', // Adds some space below the select box
            }}
          >
            <option value="" disabled>
              Select Type
            </option>
            <option value="top">Top</option>
            <option value="bottom">Bottom</option>
            <option value="shoes">Shoes</option>
            <option value="toplayer">Top Layer</option>
            <option value="accessory">Accessory</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            value={item.title}
            onChange={(e) => handleInputChange(index, 'title', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Tags (comma separated)"
            value={item.tags}
            onChange={(e) => handleInputChange(index, 'tags', e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Color"
            value={item.color}
            onChange={(e) => handleInputChange(index, 'color', e.target.value)}
            required
          />
        </div>
      ))}
      <button className= 'Form-Submit' onClick={addNewItem} style={{ marginBottom: '20px' }}>
        + Add Another Item
      </button>
      <button className = 'Form-Submit' onClick={handleUpload}>Upload All</button>
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
