import React from 'react';
import './styles/Loader.css';

function Loader({ loading }) {
    if (!loading) return null;
    return (
        <div className="loader-overlay">
            <div className="loader"></div>
        </div>
    );
}

export default Loader;