import React, { useState, useEffect } from 'react';
import { db, auth } from '../backend/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from '../Navbar';
import ItemUpload from './itemUpload';
import ClothesLibSearch from './ClothesLibSearch';
import '../styles/Loading.css';
import '../styles/Wardrobe.css';
import '../styles/Forms.css';
import { Center } from 'framer/render/presentation/Frame/DeprecatedFrame.js';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const DELAY = 750;

    const handleShowModal = (type) => {
        setSelectedType(type);
        setIsModalOpen(true);
        document.body.classList.add('modal-open'); // Prevent scrolling
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        document.body.classList.remove('modal-open');
    };

    const handleOpenLibraryModal = () => {
        setIsLibraryModalOpen(true);
    };

    const handleCloseLibraryModal = () => {
        setIsLibraryModalOpen(false);
    };

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
    };

    const addToDeleteList = (clothing) => {
        setClothesToDelete(prevList => {
            if (prevList.some(item => item.id === clothing.id)) {
                return prevList.filter(item => item.id !== clothing.id);
            } else {
                return [...prevList, clothing];
            }
        });
    };

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
    };

    if (loading) {
        return <div><Navbar /> <div className="loader"></div></div>;
    }

    if (error) {
        return <div><Navbar /> Error: {error.message}</div>;
    }

    return (
        <div className="wardrobe-container">
            <Navbar />
            <div className="wardrobe-header">
                <input
                    type="text"
                    placeholder="Search by title or tags..."
                    value={searchInput}
                    onChange={handleSearchChange}
                    className="wardrobe-search"
                />
                <button className="delete-clothing-item" onClick={toggleDelete}>
                    {isDelete ? 'Cancel' : 'Delete'}
                </button>
                {isDelete && (
                    <button className="delete-clothing-item" onClick={handleDelete}>
                        Confirm Delete
                    </button>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ItemUpload type={selectedType} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                            <button className="modal-close" onClick={handleCloseModal}>Close</button>
                            <button className="modal-close" onClick={handleOpenLibraryModal}>Clothing Library</button>
                        </div>
                    </div>
                </div>
            )}

            {isLibraryModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <ClothesLibSearch />
                        <button className="modal-close" onClick={handleCloseLibraryModal}>
                            Close Library
                        </button>
                    </div>
                </div>
            )}

            {/* Tops Row */}
            <div className="wardrobe-row">
                <div className='Add-Button'>
                    <h3>Tops</h3>
                    <button className="add-nav-link" onClick={() => handleShowModal('top')}>
                        Add
                    </button>
                </div>
                <div className="wardrobe-content-row">
                    {filteredClothes(tops).map((top, index) => (
                        <div key={top.id} className="wardrobe-item">
                            <img
                                src={top.url}
                                alt={`Top ${index + 1}`}
                                className="wardrobe-image"
                                onClick={() => handleDeleteClick({ id: top.id, type: 'top' })}
                            />
                            {isDelete && (
                                <button
                                    onClick={() => addToDeleteList({ id: top.id, type: 'top' })}
                                    className="delete-button"
                                >
                                    {clothesToDelete.some(item => item.id === top.id) ? 'Remove' : 'Select'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottoms Row */}
            <div className="wardrobe-row">
                <div className='Add-Button'>
                    <h3>Bottoms</h3>
                    <button className="add-nav-link" onClick={() => handleShowModal('bottom')}>
                        Add
                    </button>
                </div>
                <div className="wardrobe-content-row">
                    {filteredClothes(bottoms).map((bottom, index) => (
                        <div key={bottom.id} className="wardrobe-item">
                            <img
                                src={bottom.url}
                                alt={`Bottom ${index + 1}`}
                                className="wardrobe-image"
                                onClick={() => handleDeleteClick({ id: bottom.id, type: 'bottom' })}
                            />
                            {isDelete && (
                                <button
                                    onClick={() => addToDeleteList({ id: bottom.id, type: 'bottom' })}
                                    className="delete-button"
                                >
                                    {clothesToDelete.some(item => item.id === bottom.id) ? 'Remove' : 'Select'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Shoes Row */}
            <div className="wardrobe-row">
                <div className='Add-Button'>
                    <h3>Shoes</h3>
                    <button className="add-nav-link" onClick={() => handleShowModal('shoes')}>
                        Add
                    </button>
                </div>
                <div className="wardrobe-content-row">
                    {filteredClothes(shoes).map((shoe, index) => (
                        <div key={shoe.id} className="wardrobe-item">
                            <img
                                src={shoe.url}
                                alt={`Shoe ${index + 1}`}
                                className="wardrobe-image"
                                onClick={() => handleDeleteClick({ id: shoe.id, type: 'shoes' })}
                            />
                            {isDelete && (
                                <button
                                    onClick={() => addToDeleteList({ id: shoe.id, type: 'shoes' })}
                                    className="delete-button"
                                >
                                    {clothesToDelete.some(item => item.id === shoe.id) ? 'Remove' : 'Select'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Layers Row */}
            <div className="wardrobe-row">
                <div className='Add-Button'>
                    <h3>Top Layers</h3>
                    <button className="add-nav-link" onClick={() => handleShowModal('toplayer')}>
                        Add
                    </button>
                </div>
                <div className="wardrobe-content-row">
                    {filteredClothes(topLayers).map((toplayer, index) => (
                        <div key={toplayer.id} className="wardrobe-item">
                            <img
                                src={toplayer.url}
                                alt={`TopLayer ${index + 1}`}
                                className="wardrobe-image"
                                onClick={() => handleDeleteClick({ id: toplayer.id, type: 'toplayer' })}
                            />
                            {isDelete && (
                                <button
                                    onClick={() => addToDeleteList({ id: toplayer.id, type: 'toplayer' })}
                                    className="delete-button"
                                >
                                    {clothesToDelete.some(item => item.id === toplayer.id) ? 'Remove' : 'Select'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Wardrobe;
