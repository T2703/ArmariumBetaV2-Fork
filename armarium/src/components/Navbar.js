import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { db } from './backend/firebaseConfig'; // Import Firestore database
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import './styles/Navbar.css';
import Dropdown from './Dropdown';
import { getAuth, signOut } from 'firebase/auth';

function Navbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [unreadMessages, setUnreadMessages] = useState(0); // State to hold unread messages count
  const [showMessageDropdown, setShowMessageDropdown] = useState(false); // State to control message dropdown visibility
  const [recentMessages, setRecentMessages] = useState([]); // State to hold recent messages
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]); // State to hold messages of the current conversation
  const [messageContent, setMessageContent] = useState('');
  const messageDropdownRef = useRef(null); // Ref for the message dropdown

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (messageDropdownRef.current && !messageDropdownRef.current.contains(event.target)) {
        setShowMessageDropdown(false); // Close the dropdown if clicked outside
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login page after successful sign-out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
    console.log('Mobile menu state:', !isMobileMenuOpen); // Debugging
  };

  return (
    <nav className="navbar">
      <div className="container-fluid">
        <button className="navbar-toggle" onClick={toggleMobileMenu}>
          ☰ {/* Hamburger menu icon */}
        </button>
        <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile active' : ''}`}>
          <li className="nav-item">
            <NavLink className="nav-link" id="home-link" to="/outfits" end>
              Home
            </NavLink>
          </li>
          <li
            className="nav-link dropdown"
            id="wardrobe-link"
            onMouseEnter={() => setDropdownVisible(true)}
            onMouseLeave={() => setDropdownVisible(false)}
          >
            Wardrobe
            {isDropdownVisible && <Dropdown />}
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" id="friend-requests-link" to="/friendRequests" end>
              Social
            </NavLink>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              id="upload-link"
              href="https://docs.google.com/forms/d/1vh_fvJm27AYNRzrLfdTZajZctn0Fr6Tdb4QUMaBo8NA/edit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Feedback
            </a>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" id="profile-link" to="/profile" end>
              Profile
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" id="add-clothes-link" to="/add-clothes" end>
              Add Clothes
            </NavLink>
          </li>
          <li className="nav-item">
            <button className="nav-link btn btn-link" id="signout-button" onClick={handleLogout}>
              Sign Out
            </button>
          </li>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;