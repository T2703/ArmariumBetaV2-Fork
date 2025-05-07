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
    const [tabContent, setTabContent] = useState('Tops');

    const [tops, setTops] = useState([]);
    const [bottoms, setBottoms] = useState([]);
    const [shoes, setShoes] = useState([]);
    const [madeChanges, setMadeChanges] = useState(false);
    const [chosenName, setChosenName] = useState(outfitName);
    const [chosenTop, setChosenTop] = useState(null);
    const [chosenBottom, setChosenBottom] = useState(null);
    const [chosenShoes, setChosenShoes] = useState(null);
    // const [chosenLayers, setChosenLayers] = useState([]);

    const [baseName, setBaseName] = useState(outfitName);
    const [baseTop, setBaseTop] = useState(null);
    const [baseBottom, setBaseBottom] = useState(null);
    const [baseShoes, setBaseShoes] = useState(null);
    // const [baseLayers, setBaseLayers] = useState([]);

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
            // if (topLayers.length === 0) {
            //     const topLayersCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/toplayer/items`));
            //     const topLayerData = topLayersCollection.docs.map(doc => ({
            //         id: doc.id,
            //         title: doc.data().title,
            //         tags: doc.data().tags,
            //         url: doc.data().url
            //     }));
            //     console.log("TOP", topLayerData);
            //     setTopLayers(topLayerData);
            // }

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    const handleClothingChange = (newURL) => {
        setMadeChanges(true);
        if (tabContent === 'Tops') {
            setChosenTop(newURL);
            console.log("top: ", newURL);
        } else if (tabContent === 'Bottoms') {
            setChosenBottom(newURL);
            console.log("bottom: ", newURL);
        } else if (tabContent === 'Shoes') {
            setChosenShoes(newURL);
            console.log("shoes: ", newURL);
        }
    }

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

            // TODO: only update if the value has been changed

            const outfitRef = doc(db, `Users/${user.uid}/Outfits/${outfitId}`);
            await updateDoc(outfitRef, {
                topImageUrl: chosenTop,
                bottomImageUrl: chosenBottom,
                shoesImageUrl: chosenShoes,
                outfitName: chosenName
            });

            // TODO: update in storage too instead of just in firestore database

            console.log("Outfit updated successfully");
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
        // setChosenLayers(null);
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
                <div className="center edit-outfit-container">
                    <div className="button-container">
                        <button className="left-button">Remove Layer</button>
                        <button className="right-button">Add layer</button>
                    </div>

                    <div className="center clothing-preview">
                    <img src={chosenTop} alt="Top" className="clothing-image" />
                    <img src={chosenBottom} alt="Bottom" className="clothing-image" />
                    <img src={chosenShoes} alt="Shoes" className="clothing-image" />
                </div>
                </div>
            </div>

            {/* Bottom Tab */}
            <div className="bottom-tab">
                <div className="tab-buttons">
                    <button onClick={() => setTabContent('Tops')} className="tab-button"
                        style={{
                            backgroundColor: tabContent === 'Tops' ? '#a52a2a' : 'white',
                            color: tabContent === 'Tops' ? 'white' : '#a52a2a'
                        }}>Tops</button>

                    <button onClick={() => setTabContent('Bottoms')} className="tab-button"
                        style={{
                            backgroundColor: tabContent === 'Bottoms' ? '#a52a2a' : 'white',
                            color: tabContent === 'Bottoms' ? 'white' : '#a52a2a'
                        }}>Bottoms</button>

                    <button onClick={() => setTabContent('Shoes')} className="tab-button"
                        style={{
                            backgroundColor: tabContent === 'Shoes' ? '#a52a2a' : 'white',
                            color: tabContent === 'Shoes' ? 'white' : '#a52a2a'
                        }}>Shoes</button>

                    <button onClick={() => setTabContent('Layers')} className="tab-button"
                        style={{
                            backgroundColor: tabContent === 'Layers' ? '#a52a2a' : 'white',
                            color: tabContent === 'Layers' ? 'white' : '#a52a2a'
                        }}>Layers</button>
                    
                    {madeChanges && (
                        <>
                            <button onClick={() => handleSaveChanges()} className="tab-button save-button">Save</button>
                            <button onClick={() => handleCancelChanges()} className="tab-button cancel-button">Cancel</button>
                        </>
                    )}                
                </div>

                <div className="tab-content">
                    <div className="wardrobe-row">
                        {tabContent === 'Tops' && (
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

                        {tabContent === 'Bottoms' && (
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

                        {tabContent === 'Shoes' && (
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
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EditOutfit;