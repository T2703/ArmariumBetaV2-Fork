import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './Login/Login';
import Register from './Login/Register';
import ForgotPassword from './Login/ForgotPassowrd';
import NewPassword from './Login/NewPassowrd';
import Tinder from './clothing/Tinder';
import Outfit from './clothing/CreateAOutfit';
import Suggestions from './clothing/Suggestions';
import ProfileSettings from './profile/ProfileSettings';
import ImageUpload from './clothing/imageUpload';
import ItemUpload from './clothing/itemUpload';
import UserInfo from './Login/userInfo';
import Wardrobe from './clothing/Wardrobe';
import HeightAndWeight from './Questionare/HeightAndWeight';
import Brands from './Questionare/Brands';
import Styles from './Questionare/Styles';
import Ocassions from './Questionare/Ocassions';
import EditClothing from './clothing/EditClothing';
import Styleboards from './clothing/Styleboards';
import StyleboardPage from './clothing/StyleboardPage';
import Explore from './clothing/Explore';
import ExplorePage from './clothing/ExplorePage';
import Outfits from './clothing/MyOutfits';
import ProtectedRoute from './ProtectedRoute';
import EditOutfit from './clothing/EditOutfit';
import FriendRequests from './profile/FriendRequests';
import UserProfile from './profile/UserProfile';
import ClothesLibSearch from './clothing/ClothesLibSearch';
import RouteTracker from './utils/RouteTracker'; 
import ViewSharedOutfit from './clothing/ViewSharedOutfit'
import Bookmarked from './profile/Bookmarked';
import BookmarkedPage from './profile/BookmarkedPage';

/**
 * The routers for linking to different pages.
 * @returns The routers.
 */
function App() {
  return (
    <Router>
      <RouteTracker /> {/* This enables page tracking */}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/new-password" element={<NewPassword />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route path="/clothes-swipe" element={<ProtectedRoute element={<Tinder />} />} />
        <Route path="/outfits" element={<ProtectedRoute element={<Outfit />} />} />
        <Route path="/suggestions" element={<ProtectedRoute element={<Suggestions />} />} />
        <Route path="/profileSettings" element={<ProtectedRoute element={<ProfileSettings />} />} />
        <Route path="/imageUpload" element={<ProtectedRoute element={<ImageUpload />} />} />
        <Route path="/itemUpload" element={<ProtectedRoute element={<ItemUpload />} />} />
        <Route path="/friendRequests" element={<ProtectedRoute element={<FriendRequests />} />} />
        <Route path="/userInfo" element={<ProtectedRoute element={<UserInfo />} />} />
        <Route path="/wardrobe" element={<ProtectedRoute element={<Wardrobe />} />} />
        <Route path="/heightAndWeight" element={<ProtectedRoute element={<HeightAndWeight />} />} />
        <Route path="/brands" element={<ProtectedRoute element={<Brands />} />} />
        <Route path="/styles" element={<ProtectedRoute element={<Styles />} />} />
        <Route path="/occasions" element={<ProtectedRoute element={<Ocassions />} />} />
        <Route path="/editClothing/:clothingId/:type" element={<ProtectedRoute element={<EditClothing />} />} />
        <Route path="/wardrobeOutfits/:userId" element={<ProtectedRoute element={<Outfits />} />} />
        <Route path="/wardrobeStyleboards/:userId" element={<ProtectedRoute element={<Styleboards />} />} />
        <Route path="/" element={<Styleboards />} />
        <Route path="/styleboard/:id" element={<StyleboardPage />} />
        <Route path="/explore" element={<ProtectedRoute element={<Explore />} />} />
        <Route path="/explore/:id" element={<ProtectedRoute element={<ExplorePage />} />} />
        <Route path="/bookmarked" element={<ProtectedRoute element={<Bookmarked />} />} />
        <Route path="/bookmarked/:styleboardId" element={<ProtectedRoute element={<BookmarkedPage />} />} />
        <Route path="/editOutfit/:outfitId" element={<EditOutfit />} />
        <Route path="/profile" element={<ProtectedRoute element={<UserProfile />} />} />
        <Route path="/add-clothes" element={<ProtectedRoute element={<ClothesLibSearch />} />} />
        {/* <Route path="/viewSharedOutfit" element={<ViewSharedOutfit />} /> */}
        <Route path="/viewSharedOutfit/:ownerId/:outfitId" element={<ViewSharedOutfit />} />
      </Routes>
    </Router>
  );
}

export default App;
