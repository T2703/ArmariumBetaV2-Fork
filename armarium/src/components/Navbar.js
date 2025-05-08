import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { db } from './backend/firebaseConfig'; // Import Firestore database
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import './styles/Navbar.css';
import Dropdown from './Dropdown';
import { getAuth, signOut } from 'firebase/auth';
import { getConversationId, sendMessage, getUserConversations, listenToConversationMessages, markConversationAsRead } from './utils/conversations';

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
  const messagesEndRef = useRef(null); // Ref for auto-scrolling to the bottom of the message list
  const [allFriends, setAllFriends] = useState([]); // State to hold all friends
  const [friendMessages, setFriendMessages] = useState([]); // State to hold messages of all friends
  const [userConversations, setUserConversations] = useState([]);

  // State to hold the number of unread messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);

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

  const handleMouseLeave = () => {
    setDropdownVisible(false);
    console.log("unhover");
  };

  // Fetch all friends when the dropdown is opened
  useEffect(() => {
    if (!showMessageDropdown || !auth.currentUser) return;

    const fetchFriendsAndConversations = async () => {
      try {
        // Get friends from the user's friends collection
        const friendsRef = collection(db, 'Users', auth.currentUser.uid, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        
        const friendsList = friendsSnapshot.docs.map(doc => ({
          id: doc.id,
          username: doc.data().username || 'Unknown User',
          ...doc.data()
        }));
        
        setAllFriends(friendsList);

        // Get all conversations
        const conversations = await getUserConversations(auth.currentUser.uid);
        setUserConversations(conversations);
        
        // Count unread conversations
        const unreadCount = conversations.filter(conv => conv.unread).length;
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchFriendsAndConversations();
  }, [showMessageDropdown, auth.currentUser]);

  const toggleMessageDropdown = () => {
    setShowMessageDropdown(!showMessageDropdown); // Toggle message dropdown visibility
    setCurrentConversation(null); // Reset current conversation when toggling dropdown
    setConversationMessages([]); // Reset conversation messages
  };

  // Start new conversation with a friend
  const openNewConversation = (friend) => {
    console.log("Opening conversation with:", friend);
    setCurrentConversation({
      id: getConversationId(auth.currentUser.uid, friend.id),
      withUser: friend.id,
      withUserName: friend.username || 'Friend'
    });
  };

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    if (!auth.currentUser || !currentConversation) return;
    
    // Mark the conversation as read
    markConversationAsRead(auth.currentUser.uid, currentConversation.id);
    
    // Listen to messages
    const unsubscribe = listenToConversationMessages(
      currentConversation.id,
      (messages) => {
        console.log(`Received ${messages.length} messages for conversation`);
        setConversationMessages(messages);
      }
    );
    
    return () => unsubscribe();
  }, [currentConversation, auth.currentUser]);

  const openConversation = (message) => {
    setCurrentConversation(message);
  };

  // Send message function
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageContent.trim() || !currentConversation) return;

    try {
      // Show optimistic update
      const optimisticMessage = {
        id: 'pending-' + Date.now(),
        content: messageContent,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'You',
        timestamp: new Date(),
        read: false
      };
      
      setConversationMessages(prev => [...prev, optimisticMessage]);
      setMessageContent('');
      
      // Send using the new function
      await sendMessage(
        auth.currentUser.uid, 
        currentConversation.withUser, 
        messageContent
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // const viewAllMessages = () => {
  //   setShowMessageDropdown(false);
  //   navigate('/messages'); // Redirect to messages page
  // }

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
            <NavLink className="nav-link nav-link-mobile" id="friend-requests-link" to="/friendRequests" end>
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
            <li className="nav-item mobile-only">
              <button className="nav-link btn btn-link" id="signout-button" onClick={handleLogout}>
                Sign Out
              </button>
            </li>
          </div>


          {/* Right-side icons that stay visible on mobile */}
          <div className="navbar-right">
            {/* Message button with notification counter and dropdown */}
              <div className="message-dropdown-container" ref={messageDropdownRef}>
                <button className="nav-link message-link" onClick={toggleMessageDropdown}>
                  Messages
                  {unreadMessages > 0 && (
                    <span className="message-badge">{unreadMessages}</span>
                  )}
                </button>
                
                {showMessageDropdown && (
                  <div className="message-dropdown">
                    {!currentConversation ? (
                      <>
                        <h4>Messages</h4>
                        <ul className="message-list">
                          {allFriends.length > 0 ? (
                            allFriends.map(friend => {
                              // Find if there's a conversation with this friend
                              const conversationId = getConversationId(auth.currentUser.uid, friend.id);
                              const conversation = userConversations.find(c => c.id === conversationId);
                              
                              return (
                                <li key={friend.id} onClick={() => openNewConversation(friend)}>
                                  <div className="message-preview">
                                    <strong>{friend.username}</strong>
                                    {conversation && conversation.lastMessageTime && (
                                      <span className="message-time">
                                        {new Date(conversation.lastMessageTime.toDate()).toLocaleTimeString()}
                                      </span>
                                    )}
                                    {conversation && conversation.unread && (
                                      <span className="unread-indicator">•</span>
                                    )}
                                  </div>
                                  {conversation ? (
                                    <p className="message-snippet">{conversation.lastMessage?.substring(0, 30)}...</p>
                                  ) : (
                                    <p className="message-snippet empty-message-preview">Start a conversation</p>
                                  )}
                                </li>
                              );
                            })
                          ) : (
                            <li className="empty-message">No friends found</li>
                          )}
                          {/* <li className="view-all" onClick={viewAllMessages}>
                            See All in Messenger
                          </li> */}
                        </ul>
                      </>
                    ) : (
                      <div className="message-conversation">
                        <div className="conversation-header">
                          <button className="back-button" onClick={() => setCurrentConversation(null)}>
                            ← Back
                          </button>
                          <h4>{currentConversation.senderName}</h4>
                        </div>
                        
                        <div className="conversation-messages">
                          {conversationMessages.length === 0 ? (
                            <div className="no-messages">
                              <p>No messages yet. Send a message to start the conversation!</p>
                            </div>
                          ) : (
                            conversationMessages.map(message => (
                              <div 
                                key={message.id}
                                className={`message ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
                              >
                                <div className="message-content">{message.content}</div>
                                <div className="message-time">
                                  {message.timestamp ? 
                                    (typeof message.timestamp.toDate === 'function' ? 
                                      new Date(message.timestamp.toDate()).toLocaleTimeString() : 
                                      new Date(message.timestamp).toLocaleTimeString()
                                    ) : 'Sending...'}
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={messagesEndRef} /> {/* Add this for auto-scroll */}
                        </div>
                        
                        <form onSubmit={handleSendMessage} className="conversation-reply">
                          <input
                            type="text"
                            placeholder="Type a message..."
                            value={messageContent}
                            onChange={(e) => setMessageContent(e.target.value)}
                          />
                          <button type="submit">Send</button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sign Out button (desktop only) */}
              <button className="nav-link btn btn-link desktop-only" id="signout-button" onClick={handleLogout}>
                Sign Out
              </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;