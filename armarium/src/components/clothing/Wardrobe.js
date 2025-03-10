import React, { useState, useEffect } from 'react';
import { db, auth } from '../backend/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import '../styles/Loading.css';

const Wardrobe = () => {
    const [tops, setTops] = useState([]);
    const [bottoms, setBottoms] = useState([]);
    const [shoes, setShoes] = useState([]);
    const [topLayers, setTopLayers] = useState([]);
    const [isTop, setIsTop] = useState(true);
    const [isBottom, setIsBottom] = useState(false);
    const [isShoes, setIsShoes] = useState(false);
    const [isTopLayer, setIsTopLayer] = useState(false);
    const [isDelete, setIsDelete] = useState(false);
    const [clothesToDelete, setClothesToDelete] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const DELAY = 750;
    
    const filteredClothes = (clothes) => {
        return clothes.filter(clothing => {
            const matchesTitle = clothing.title && clothing.title.toLowerCase().includes(searchInput.toLowerCase());
            const matchesTags = clothing.tags && clothing.tags.some(tag => tag.toLowerCase().includes(searchInput.toLowerCase()));
            return matchesTitle || matchesTags;
        });
    };

    const displayedClothes = isTop ? filteredClothes(tops) :
                         isBottom ? filteredClothes(bottoms) :
                         isShoes ? filteredClothes(shoes) :
                         isTopLayer ? filteredClothes(topLayers) :
                         [];
                         
    const fetchData = async (user) => {
        try {
            await new Promise(resolve => setTimeout(resolve, DELAY));

            if (tops.length === 0) { 
                const topsCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/top/items`));
                const topsData = topsCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("clothing doc:", user.uid);
                console.log(topsData);
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
                console.log(bottomsData);
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
                console.log(shoesData);
                setShoes(shoesData);
            }

            if (topLayers.length === 0) { 
                const topLayersCollection = await getDocs(collection(db, `Users/${user.uid}/ItemsCollection/toplayer/items`));
                const topLayerData = topLayersCollection.docs.map(doc => ({
                    id: doc.id,
                    title: doc.data().title,
                    tags: doc.data().tags,
                    url: doc.data().url
                }));
                console.log("TOP", topLayerData);
                setTopLayers(topLayerData);
            }

        } catch (error) {
            setError(error);
            setLoading(false);
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchData(user).then(() => setLoading(false));
            } else {
                navigate('/login'); 
            }
        });

        return () => unsubscribe();
    }, []);


    const handleDelete = async (id, type) => {
        const user = auth.currentUser;
        if (!clothesToDelete.length) {
            alert("No item has been selected.");
            return;
        }

        await new Promise(resolve => setTimeout(resolve, DELAY));
        for (let { id, type } of clothesToDelete) {
            const itemDoc = doc(db, `Users/${user.uid}/ItemsCollection/${type}/items`, id);
            await deleteDoc(itemDoc);
            
            if (type === 'top') {                                                                                                                                                                               
                setTops(tops.filter((item) => item.id !== id));
            }
            else if (type === 'bottom') {
                setBottoms(bottoms.filter((item) => item.id !== id));
            }
            else if (type === 'shoes') {
                setShoes(shoes.filter((item) => item.id !== id));
            }
            else if (type === 'toplayer') {
                setTopLayers(topLayers.filter((item) => item.id !== id));
            }
        }

        setClothesToDelete([]);
        setIsDelete(false);
    }

    const addToDeleteList = (clothing) => {
        setClothesToDelete(prevList => {
            if (prevList.some(item => item.id === clothing.id)) {
                return prevList.filter(item => item.id !== clothing.id);
            } else {
                return [...prevList, clothing];
            }
        });
    }

    const handleDeleteClick = (id, type) => {
        console.log('Type: ', type);
        if (isDelete) {
            addToDeleteList({ id, type });
        } else {
            console.log(type);
            navigate(`/editClothing/${id.id}/${id.type}`);
        }
    };

    const handleShowTops = () => {
        setIsTop(true);
        setIsBottom(false);
        setIsShoes(false);
        setIsTopLayer(false);
    };

    const handleShowBottoms = () => {
        setIsTop(false);
        setIsBottom(true);
        setIsShoes(false);
        setIsTopLayer(false);
    };

    const handleShowShoes = () => {
        setIsTop(false);
        setIsBottom(false);
        setIsShoes(true);
        setIsTopLayer(false);
    };

    const handleShowTopLayers = () => {
        setIsTop(false);
        setIsBottom(false);
        setIsShoes(false);
        setIsTopLayer(true);
    };

    const toggleDelete = () => {
        if (isDelete) {
            setClothesToDelete([]);
        }
        setIsDelete(!isDelete);
    };

    const handleSearchChange = (e) => {
        const inputValue = e.target.value.toLowerCase();
        setSearchInput(inputValue);
    }

    if (loading) {
        return <div><Navbar /> <div className="loader"></div></div>;
    }

    if (error) {
        return <div><Navbar /> Error: {error.message}</div>;
    }

    return (
        <div>
            <Navbar />
            <input 
                type="text" 
                placeholder="Search by title or tags..." 
                value={searchInput} 
                onChange={handleSearchChange} 
            />
            <NavLink onClick={handleShowTops} style={{ marginRight: '10px', cursor: 'pointer' }}>
                Tops
            </NavLink>
            <NavLink onClick={handleShowBottoms} style={{ cursor: 'pointer' }}>
                Bottoms
            </NavLink>
            <NavLink onClick={handleShowShoes} style={{ marginRight: '10px', cursor: 'pointer' }}>
                Shoes
            </NavLink>
            <NavLink onClick={handleShowTopLayers} style={{ marginRight: '10px', cursor: 'pointer' }}>
                Top Layer
            </NavLink>
            <button onClick={toggleDelete}>
                {isDelete ? 'Cancel' : 'Delete'}
            </button>
            {isDelete && (
                <button onClick={handleDelete} style={{ marginLeft: '10px' }}>
                    Confirm Delete
                </button>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isTop && displayedClothes.map((top, index) => (
                    <div key={top.id} style={{ position: 'relative' }}>
                        <img 
                            src={top.url} 
                            alt={`Top ${index + 1}`} 
                            style={{ 
                                width: '150px', 
                                height: 'auto', 
                                border: clothesToDelete.some(item => item.id === top.id) ? '2px solid red' : 'none'
                            }}
                            onClick={() => handleDeleteClick({ id: top.id, type: 'top' })}
                        />
                        {isDelete && (
                            <button
                                onClick={() => addToDeleteList({ id: top.id, type: 'top' })}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {clothesToDelete.some(item => item.id === top.id) ? 'Remove' : 'Select'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isBottom && displayedClothes.map((bottom, index) => (
                    <div key={bottom.id} style={{ position: 'relative' }}>
                        <img 
                            src={bottom.url} 
                            alt={`Bottom ${index + 1}`} 
                            style={{ 
                                width: '150px', 
                                height: 'auto', 
                                border: clothesToDelete.some(item => item.id === bottom.id) ? '2px solid red' : 'none'
                            }}
                            onClick={() => handleDeleteClick({ id: bottom.id, type: 'bottom' })}
                        />
                        {isDelete && (
                            <button
                                onClick={() => addToDeleteList({ id: bottom.id, type: 'bottom' })}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {clothesToDelete.some(item => item.id === bottom.id) ? 'Remove' : 'Select'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isShoes && displayedClothes.map((shoe, index) => (
                    <div key={shoe.id} style={{ position: 'relative' }}>
                        <img 
                            src={shoe.url} 
                            alt={`Shoe ${index + 1}`} 
                            style={{ 
                                width: '150px', 
                                height: 'auto', 
                                border: clothesToDelete.some(item => item.id === shoe.id) ? '2px solid red' : 'none'
                            }}
                            onClick={() => handleDeleteClick({ id: shoe.id, type: 'shoes' })}
                        />
                        {isDelete && (
                            <button
                                onClick={() => addToDeleteList({ id: shoe.id, type: 'shoes' })}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {clothesToDelete.some(item => item.id === shoe.id) ? 'Remove' : 'Select'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {isTopLayer && displayedClothes.map((toplayer, index) => (
                    <div key={toplayer.id} style={{ position: 'relative' }}>
                        <img 
                            src={toplayer.url} 
                            alt={`TopLayer ${index + 1}`} 
                            style={{ 
                                width: '150px', 
                                height: 'auto', 
                                border: clothesToDelete.some(item => item.id === toplayer.id) ? '2px solid red' : 'none'
                            }}
                            onClick={() => handleDeleteClick({ id: toplayer.id, type: 'toplayer' })}
                        />
                        {isDelete && (
                            <button
                                onClick={() => addToDeleteList({ id: toplayer.id, type: 'toplayer' })}
                                style={{
                                    position: 'absolute',
                                    top: '5px',
                                    right: '5px',
                                    backgroundColor: 'red',
                                    color: 'white',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {clothesToDelete.some(item => item.id === toplayer.id) ? 'Remove' : 'Select'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wardrobe;
