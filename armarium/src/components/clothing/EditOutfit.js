import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db, auth } from '../backend/firebaseConfig';
import { collection, getDocs, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../Navbar';
import '../styles/EditOutfit.css';

function EditOutfit() {
    const location = useLocation();
    const outfitName = location.state?.outfitName;
    const outfitId = location.state?.outfitId;

    const TABS = {
        TOPS: 'Tops',
        BOTTOMS: 'Bottoms',
        SHOES: 'Shoes',
        LAYERS: 'Layers',
        ACCESSORIES: 'Accessories',
      };

    const [tabContent, setTabContent] = useState(TABS.TOPS);
    const [madeChanges, setMadeChanges] = useState(false);

    // all of users clothing items
    const [tops, setTops] = useState([]);
    const [bottoms, setBottoms] = useState([]);
    const [shoes, setShoes] = useState([]);
    const [layers, setLayers] = useState([]);
    const [accessories, setAccessories] = useState([]);

    // displayed clothing items
    const [chosenName, setChosenName] = useState(outfitName);
    const [chosenTop, setChosenTop] = useState(null);
    const [chosenBottom, setChosenBottom] = useState(null);
    const [chosenShoes, setChosenShoes] = useState(null);
    const [chosenLayers, setChosenLayers] = useState([null, null, null]);
    const [chosenAccessories, setChosenAccessories] = useState([null, null, null])

    // base clothing items (for cancel changes)
    const [baseName, setBaseName] = useState(outfitName);
    const [baseTop, setBaseTop] = useState(null);
    const [baseBottom, setBaseBottom] = useState(null);
    const [baseShoes, setBaseShoes] = useState(null);
    const [baseLayers, setBaseLayers] = useState([]);
    const [baseAccessories, setBaseAccessories] = useState([]);

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchOutfit(user);
                fetchData(user);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, []);

    const fetchData = async (user) => {
        try {
            if (tops.length === 0) {
                const topsCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/top/items`));
                const topsData = topsCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("Tops: ", topsData);
                setTops(topsData);
            }

            if (bottoms.length === 0) {
                const bottomsCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/bottom/items`));
                const bottomsData = bottomsCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("Bottoms: ", bottomsData);
                setBottoms(bottomsData);
            }

            if (shoes.length === 0) {
                const shoesCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/shoes/items`));
                const shoesData = shoesCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("Shoes: ", shoesData);
                setShoes(shoesData);
            }

            /* layering */
            if (layers.length === 0) {
                const layersCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/toplayer/items`));
                const layerData = layersCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                if (!layerData.length) {
                    console.log("No top layers for this outfit");
                }
                else {
                    setLayers(layerData);
                }
            }

            if (accessories.length === 0) {
                const accessoriesCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/accessory/items`));
                const accessoriesData = accessoriesCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("Accessories: ", accessoriesData);
                if (!accessoriesData.length) {
                    console.log("No accessories for this outfit");
                }
                else {
                    setAccessories(accessoriesData);
                }
            }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleClothingChange = (newURL) => {
        setMadeChanges(true);
        if (tabContent === TABS.TOPS) {
            setChosenTop(newURL);
            console.log("top: ", newURL);
        } else if (tabContent === TABS.BOTTOMS) {
            setChosenBottom(newURL);
            console.log("bottom: ", newURL);
        } else if (tabContent === TABS.SHOES) {
            setChosenShoes(newURL);
            console.log("shoes: ", newURL);
        }
    }

    const handleLayerChange = (newURL) => {
        const nextOpenSlot = chosenLayers.findIndex((layer) => layer === null);

        if (nextOpenSlot === -1) {
            // If no open slots are available, show an alert
            alert("All layer slots are filled. Please remove a layer to add a new one.");
            return;
        }
    
        // Update the next open slot with the new layer URL
        setMadeChanges(true);
        console.log("Layers before change: ", chosenLayers);
    
        setChosenLayers((prev) => {
            const updatedLayers = [...prev];
            updatedLayers[nextOpenSlot] = newURL;
            return updatedLayers;
        });
    
        console.log("Layers after change: ", chosenLayers);
    };

    const handleRemoveLayer = (index) => {
        setMadeChanges(true);
      
        setChosenLayers((prev) => {
          const updatedLayers = [...prev];
          // Remove the layer at the specified index
          updatedLayers.splice(index, 1);
          // Add a `null` at the end to maintain the array length
          updatedLayers.push(null);
          return updatedLayers;
        });
    };

    const handleAccessoryChange = (newURL) => {
        const nextOpenSlot = chosenAccessories.findIndex((accessory) => accessory === null);
    
        if (nextOpenSlot === -1) {
            alert("All accessory slots are filled. Please remove an accessory to add a new one.");
            return;
        }
    
        setMadeChanges(true);
        console.log("Accessories before change: ", chosenAccessories);
    
        setChosenAccessories((prev) => {
            const updatedAccessories = [...prev];
            updatedAccessories[nextOpenSlot] = newURL;
            return updatedAccessories;
        });
    
        console.log("Accessories after change: ", chosenAccessories);
    };

    const handleRemoveAccessory = (index) => {
        setMadeChanges(true);
    
        setChosenAccessories((prev) => {
            const updatedAccessories = [...prev];
            updatedAccessories.splice(index, 1); // Remove the accessory at the specified index
            updatedAccessories.push(null); // Add a `null` at the end to maintain the array length
            return updatedAccessories;
        });
    };

    // const handleAccessoryChange = (newURL, index = accessoryToChange) => {


    const fetchOutfit = async (user) => {
        if (user) {
            const userId = user.uid;
            const outfitDoc = await getDocs(query(collection(db, 'Users', userId, 'Outfits')));
            outfitDoc.forEach(doc => {
                if (doc.id === outfitId) {
                    console.log("Found outfit with same ID");
                    setChosenTop(doc.data().topImageUrl);
                    setBaseTop(doc.data().topImageUrl);
                    setChosenBottom(doc.data().bottomImageUrl);
                    setBaseBottom(doc.data().bottomImageUrl);
                    setChosenShoes(doc.data().shoesImageUrl);
                    setBaseShoes(doc.data().shoesImageUrl);
                    setChosenName(doc.data().outfitName);
                    setBaseName(doc.data().outfitName);

                    // Ensure chosenLayers is always a valid array with 3 elements
                    const layers = doc.data().topLayerUrls || [];
                    const paddedLayers = [layers[0] || null, layers[1] || null, layers[2] || null];
                    setChosenLayers(paddedLayers);
                    setBaseLayers(paddedLayers);

                    const accessories = doc.data().accessoryUrls || [];
                    const paddedAccessories = [accessories[0] || null, accessories[1] || null, accessories[2] || null];
                    setChosenAccessories(paddedAccessories);
                    setBaseAccessories(paddedAccessories);
                }
            });
            console.log(outfitId);
        } else {
            console.log("No user logged in");
        }
    }

    const handleSaveChanges = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                console.error("No user logged in");
                return;
            }

            const outfitRef = doc(db, `Users/${user.uid}/Outfits/${outfitId}`);

            const updateData = {
                topImageUrl: chosenTop,
                bottomImageUrl: chosenBottom,
                shoesImageUrl: chosenShoes,
                outfitName: chosenName,
            };

            
            if (chosenLayers !== undefined) {
                updateData.topLayerUrls = chosenLayers;
            }

            if (chosenAccessories !== undefined) {
                updateData.accessoryUrls = chosenAccessories;
            }

            await updateDoc(outfitRef, updateData);

            console.log("Outfit updated successfully");

            setBaseName(chosenName);
            setBaseTop(chosenTop);
            setBaseBottom(chosenBottom);
            setBaseShoes(chosenShoes);
            setBaseLayers(chosenLayers);
            setBaseAccessories(chosenAccessories);

            setMadeChanges(false);
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    }

    const handleCancelChanges = () => {
        setMadeChanges(false);
        setBaseName(baseName);
        setChosenTop(baseTop);
        setChosenBottom(baseBottom);
        setChosenShoes(baseShoes);
        setChosenLayers(baseLayers);
        setChosenAccessories(baseAccessories);
    }

    return (
        <div>
            <Navbar />
            <div className="center">
                <input 
                    type="text" 
                    className="page-title" 
                    value={chosenName} 
                    onChange={(e) => {
                        setMadeChanges(true);
                        setChosenName(e.target.value);
                    }} 
                />
            </div>

            <div className="center">
            <button
                onClick={() => handleSaveChanges()}
                className={`tab-button edit-button save-button ${!madeChanges ? 'disabled' : ''}`}
                disabled={!madeChanges} // Disable the button if madeChanges is false
            >
                Save
            </button>
            <button
                onClick={() => handleCancelChanges()}
                className={`tab-button edit-button cancel-button ${!madeChanges ? 'disabled' : ''}`}
                disabled={!madeChanges} // Disable the button if madeChanges is false
            >
                Cancel
            </button>
            </div>

            <div className="center">
                <div className="three-column-layout">
                    {/* First Column: Layers */}
                    <div className="column">
                        <h3>Layers</h3>
                        {chosenLayers.map((layer, index) => (
                        <div key={`layer-${index}`} className="column-item">
                            {layer ? (
                            <div>
                                <button
                                    className="remove-layer"
                                    onClick={() => handleRemoveLayer(index)}
                                >✖
                                </button>
                                <img
                                    src={layer}
                                    alt={`Layer ${index + 1}`}
                                    className="column-image"
                                />
                            </div>
                            ) : (
                            <p>Spot {index + 1}</p>
                            )}
                        </div>
                        ))}
                    </div>

                    {/* Second Column: Top, Bottom, Shoes */}
                    <div className="column">
                        <h3>Clothing</h3>
                        <div className="column-item">
                            <img src={chosenTop} alt="Top" className="column-image" />
                        </div>
                        <div className="column-item">
                            <img src={chosenBottom} alt="Bottom" className="column-image" />
                        </div>
                        <div className="column-item">
                            <img src={chosenShoes} alt="Shoes" className="column-image" />
                        </div>
                    </div>

                    {/* Third Column: Accessories */}
                    <div className="column">
                        <h3>Accessories</h3>
                        {chosenAccessories.map((accessory, index) => (
                            <div key={`accessory-${index}`} className="column-item">
                            {accessory ? (
                                <div>
                                    <button
                                        className="remove-layer"
                                        onClick={() => handleRemoveAccessory(index)}
                                    >
                                        ✖
                                    </button>
                                    <img
                                        src={accessory}
                                        alt={`Accessory ${index + 1}`}
                                        className="column-image"
                                    />
                                </div>
                            ) : (
                                <p>Spot {index + 1}</p>
                            )}
                            </div>
                        ))}
                    </div>


                </div>
            </div>

            {/* Bottom Tab */}
            <div className="bottom-tab">
                <div className="tab-buttons">
                    <button onClick={() => setTabContent(TABS.TOPS)} className="tab-button"
                        style={{
                            backgroundColor: tabContent === TABS.TOPS ? '#a52a2a' : 'white',
                            color: tabContent === TABS.TOPS ? 'white' : '#a52a2a'
                        }}>Tops
                    </button>

                    <button onClick={() => setTabContent(TABS.BOTTOMS)} className="tab-button"
                        style={{
                            backgroundColor: tabContent === TABS.BOTTOMS ? '#a52a2a' : 'white',
                            color: tabContent === TABS.BOTTOMS ? 'white' : '#a52a2a'
                        }}>Bottoms
                    </button>

                    <button onClick={() => setTabContent(TABS.SHOES)} className="tab-button"
                        style={{
                            backgroundColor: tabContent === TABS.SHOES ? '#a52a2a' : 'white',
                            color: tabContent === TABS.SHOES ? 'white' : '#a52a2a'
                        }}>Shoes
                    </button>

                    <button onClick={() => setTabContent(TABS.LAYERS)} className="tab-button"
                        style={{
                            backgroundColor: tabContent === TABS.LAYERS ? '#a52a2a' : 'white',
                            color: tabContent === TABS.LAYERS ? 'white' : '#a52a2a'
                        }}>Layers
                    </button>
                    
                    <button onClick={() => setTabContent(TABS.ACCESSORIES)} className="tab-button"
                        style={{
                            backgroundColor: tabContent === TABS.ACCESSORIES ? '#a52a2a' : 'white',
                            color: tabContent === TABS.ACCESSORIES ? 'white' : '#a52a2a'
                        }}>Accessories
                    </button>               
                </div>

                <div className="tab-content">
                    <div className="wardrobe-row">
                        {tabContent === TABS.TOPS && (
                            <div className="wardrobe-content-row">
                                {tops.map((top, index) => (
                                    <div key={top.id} className="wardrobe-item"
                                        onClick = {() => handleClothingChange(top.url)}>
                                        <img 
                                            src={top.url} 
                                            alt={`Top ${index + 1}`} 
                                            className="wardrobe-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {tabContent === TABS.BOTTOMS && (
                            <div className="wardrobe-content-row">
                                {bottoms.map((bottom, index) => (
                                    <div key={bottom.id} className="wardrobe-item"
                                        onClick = {() => handleClothingChange(bottom.url)}>
                                        <img 
                                            src={bottom.url} 
                                            alt={`Bottom ${index + 1}`} 
                                            className="wardrobe-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {tabContent === TABS.SHOES && (
                            <div className="wardrobe-content-row">
                                {shoes.map((shoes, index) => (
                                    <div key={shoes.id} className="wardrobe-item"
                                        onClick={() => handleClothingChange(shoes.url)}>
                                        <img 
                                            src={shoes.url} 
                                            alt={`Shoe ${index + 1}`} 
                                            className="wardrobe-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {tabContent === TABS.LAYERS && (
                            <div className="wardrobe-content-row">
                                {layers.map((layer, index) => (
                                    <div key={layer.id} className="wardrobe-item"
                                        onClick={() => handleLayerChange(layer.url)}>
                                        <img 
                                            src={layer.url} 
                                            alt={`Layer ${index + 1}`} 
                                            className="wardrobe-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {tabContent === TABS.ACCESSORIES && (
                            <div className="wardrobe-content-row">
                                {accessories.map((accessory, index) => (
                                    <div key={accessory.id} className="wardrobe-item"
                                        onClick={() => handleAccessoryChange(accessory.url)}>
                                        <img 
                                            src={accessory.url} 
                                            alt={`Accessory ${index + 1}`} 
                                            className="wardrobe-image"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditOutfit;