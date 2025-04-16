import React, { useState, useEffect } from 'react';
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Navbar from '../Navbar';
import '../styles/ClothesLibSearch.css';

const db = getFirestore();
const auth = getAuth();

const AddClothesPage = () => {
    const [category, setCategory] = useState('');
    const [clothingItems, setClothingItems] = useState({});
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchClothingItems = async () => {
            const rootRef = collection(db, 'DefaultItemCollection');
            const categorySnapshots = await getDocs(rootRef);

            const updatedItems = {};
            for (const categoryDoc of categorySnapshots.docs) {
                const catName = categoryDoc.id;
                const itemsRef = collection(db, `DefaultItemCollection/${catName}/Items`);
                const itemSnapshots = await getDocs(itemsRef);

                updatedItems[catName] = itemSnapshots.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().title,
                    image: doc.data().url,
                    color: doc.data().color || '',
                    tags: doc.data().tags || []
                }));
            }

            setClothingItems(updatedItems);
            const firstCategory = Object.keys(updatedItems)[0] || '';
            setCategory(firstCategory);
        };

        fetchClothingItems();
    }, []);

    const handleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const handleAddSelected = async () => {
        const user = auth.currentUser;
        if (!user) {
            alert("You must be logged in to add items.");
            return;
        }

        const itemsToAdd = clothingItems[category].filter(item =>
            selectedItems.includes(item.id)
        );

        if (itemsToAdd.length === 0) {
            alert("No items selected.");
            return;
        }

        setLoading(true);

        try {
            for (const item of itemsToAdd) {
                const collectionRef = collection(db, `Users/${user.uid}/ItemsCollection/${category}/items`);
                const itemData = {
                    title: item.name,
                    url: item.image,
                    color: item.color,
                    tags: item.tags,
                    createdAt: serverTimestamp()
                };

                await addDoc(collectionRef, itemData);
                console.log(`Added item to wardrobe: ${item.name}`);
            }

            alert("Items successfully added to your wardrobe.");
            setSelectedItems([]);
        } catch (err) {
            console.error("Error adding items:", err);
            alert("Failed to add one or more items. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const categories = Object.keys(clothingItems);

    return (
        <div className="page-container">
            <div className="content-wrapper">
                <h1 className="main-heading">Select Items to Add to Your Wardrobe</h1>

                <div className="toolbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            className={`toolbar-button ${category === cat ? 'active' : ''}`}
                            onClick={() => {
                                setCategory(cat);
                                setSelectedItems([]);
                            }}
                        >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </button>
                    ))}
                </div>

                <div className="cards-grid">
                    {clothingItems[category]?.map(item => (
                        <div
                            key={item.id}
                            className={`card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                            onClick={() => handleSelectItem(item.id)}
                        >
                            <img src={item.image} alt={item.name} className="card-image" />
                            <p className="card-name">{item.name}</p>
                        </div>
                    ))}
                </div>

                <div className="add-button-container">
                    <button className="add-button" onClick={handleAddSelected} disabled={loading}>
                        {loading ? 'Adding...' : 'Add Selected Items'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddClothesPage;
