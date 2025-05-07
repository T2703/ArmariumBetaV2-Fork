import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import './styles/Navbar.css';
import Dropdown from './Dropdown';
import { getAuth, signOut } from 'firebase/auth';

function Navbar() {
  const navigate = useNavigate();
  const auth = getAuth();
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Automatically close the mobile menu when the screen size increases
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setMobileMenuOpen(false); // Close the mobile menu
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <nav className="navbar">
        <button className="navbar-toggle" onClick={toggleMobileMenu}>
          ☰ {/* Hamburger menu icon */}
        </button>
        <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile active' : ''}`}>
          <li className="nav-item">
            <NavLink className="nav-link " id="home-link" to="/outfits" end>
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
            <NavLink className="nav-link nav-link-mobile" id="friend-requests-link" to="/friendRequests" end>
              Social
            </NavLink>
          </li>
          <li className="nav-item">
            <a
              className="nav-link "
              id="upload-link"
              href="https://docs.google.com/forms/d/1vh_fvJm27AYNRzrLfdTZajZctn0Fr6Tdb4QUMaBo8NA/edit"
              target="_blank"
              rel="noopener noreferrer"
            >
              Feedback
            </a>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link " id="profile-link" to="/profile" end>
              Profile
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link " id="add-clothes-link" to="/add-clothes" end>
              Add Clothes
            </NavLink>
          </li>
          <button className="nav-link btn btn-link " id="signout-button" onClick={handleLogout}>
              Sign Out
            </button>
        </div>

    </nav>
  );
}

export default Navbar;