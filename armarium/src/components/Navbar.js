import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { db } from './backend/firebaseConfig'; // Import Firestore database
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, getDoc, getDocs, arrayUnion, arrayRemove } from 'firebase/firestore';
import './styles/Navbar.css';
import Dropdown from './Dropdown';
import { getAuth, signOut } from 'firebase/auth';
import { 
  getConversationId, 
  sendMessage, 
  getUserConversations, 
  listenToConversationMessages, 
  markConversationAsRead, 
  sendOutfitMessage,
  setTypingStatus,
  listenToTypingStatus
} from './utils/conversations';

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
  const [showOutfitModal, setShowOutfitModal] = useState(false);
  const [userOutfits, setUserOutfits] = useState([]);
  const [selectedOutfit, setSelectedOutfit] = useState(null);
  const [outfitMessage, setOutfitMessage] = useState("Check out this outfit!");
  const [loadingOutfits, setLoadingOutfits] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // State to hold the number of unread messages
  useEffect(() => {
    // Only scroll within the message container, not the whole page
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [conversationMessages, isOtherUserTyping]);

  // Add this useEffect to listen for conversation changes continuously
  useEffect(() => {
    if (!auth.currentUser) return;
    
    // Listen to changes in the user's conversations collection
    const userConversationsRef = collection(db, 'Users', auth.currentUser.uid, 'conversations');
    
    const unsubscribe = onSnapshot(userConversationsRef, async (snapshot) => {
      // When the conversations collection changes, fetch all conversations
      try {
        const conversations = await getUserConversations(auth.currentUser.uid);
        setUserConversations(conversations);
        
        // Count unread conversations
        const unreadCount = conversations.filter(conv => conv.unread).length;
        setUnreadMessages(unreadCount);
      } catch (error) {
        console.error("Error updating conversations:", error);
      }
    });
    
    return () => unsubscribe();
  }, [auth.currentUser]); // Only depend on auth.currentUser

  useEffect(() => {
    // Check if we need to reopen a conversation
    const storedConversation = sessionStorage.getItem('reopenConversation');
    if (storedConversation) {
      const conversation = JSON.parse(storedConversation);
      setShowMessageDropdown(true);
      setCurrentConversation({
        id: conversation.conversationId,
        withUser: conversation.withUser,
        withUserName: conversation.withUserName
      });
      // Clear the stored data
      sessionStorage.removeItem('reopenConversation');
    }
  }, []);

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
        
        // We don't need to fetch conversations here anymore as we do it in the continuous listener
      } catch (error) {
        console.error("Error fetching friends:", error);
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

  // Handle typing status
  useEffect(() => {
    if (!auth.currentUser || !currentConversation) return;

    console.log("Setting up typing status listener for conversation:", currentConversation.id);
    
    // Listen for typing status changes
    const unsubscribe = listenToTypingStatus(
      currentConversation.id,
      auth.currentUser.uid,
      (otherUserTyping) => {
        console.log("Typing status update:", otherUserTyping);
        setIsOtherUserTyping(otherUserTyping);
      }
    );
    
    return () => {
      console.log("Removing typing status listener");
      unsubscribe();
    };
  }, [currentConversation, auth.currentUser]);

  const handleMessageInputChange = (e) => {
    const value = e.target.value;
    setMessageContent(value);
    
    if (!auth.currentUser || !currentConversation) return;
    
    // Clear previous timeout first
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Only update typing status if there's content to type
    if (value.trim()) {
      // If not already set as typing, set it now
      if (!isTyping) {
        console.log("User started typing");
        setIsTyping(true);
        setTypingStatus(auth.currentUser.uid, currentConversation.id, true);
      }
      
      // Set a new timeout - will only trigger if user stops typing
      typingTimeoutRef.current = setTimeout(() => {
        console.log("User stopped typing (timeout)");
        setIsTyping(false);
        setTypingStatus(auth.currentUser.uid, currentConversation.id, false);
      }, 2000);
    } else {
      // If input is empty, immediately set as not typing
      console.log("Input empty, user not typing");
      setIsTyping(false);
      setTypingStatus(auth.currentUser.uid, currentConversation.id, false);
    }
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

  const handleViewOutfit = (outfitId, ownerId, conversationId) => {
    console.log("Viewing outfit with params:", {outfitId, ownerId, conversationId});
    
    if (!outfitId || !ownerId) {
      console.error("Cannot view outfit: missing ID or owner");
      return;
    }
    
    // Store the current conversation state in sessionStorage
    sessionStorage.setItem('lastConversation', JSON.stringify({
      conversationId: conversationId,
      withUser: currentConversation.withUser,
      withUserName: currentConversation.withUserName
    }));
    
    // Navigate to the outfit view page using URL parameters
    navigate(`/viewSharedOutfit/${ownerId}/${outfitId}`);
  };

  const fetchUserOutfits = async () => {
    if (!auth.currentUser) return;
    
    setLoadingOutfits(true);
    try {
      const outfitsRef = collection(db, `Users/${auth.currentUser.uid}/Outfits`);
      const outfitsSnapshot = await getDocs(outfitsRef);
      
      const outfitsList = outfitsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setUserOutfits(outfitsList);
    } catch (error) {
      console.error("Error fetching outfits:", error);
    } finally {
      setLoadingOutfits(false);
    }
  };

  const handleShareOutfit = async () => {
    if (!selectedOutfit || !currentConversation) return;
    
    try {
      await sendOutfitMessage(
        auth.currentUser.uid,
        currentConversation.withUser,
        selectedOutfit.id,
        outfitMessage
      );
      
      // Reset state and close modal
      setSelectedOutfit(null);
      setOutfitMessage("Check out this outfit!");
      setShowOutfitModal(false);
    } catch (error) {
      console.error("Error sharing outfit:", error);
      alert("Failed to share outfit. Please try again.");
    }
  };

  // Function to open modal and load outfits
  const handleOpenOutfitModal = () => {
    fetchUserOutfits();
    setShowOutfitModal(true);
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
            <NavLink className="nav-link nav-link-mobile" id="friend-requests-link" to="/friendRequests" end>
              Social
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink className="nav-link" id="explore-link" to="/explore" end>
              Explore
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
                          {userConversations.length > 0 ? (
                            userConversations.map(conv => (
                              <li
                                key={conv.id}
                                className={`message-item ${conv.unread ? 'unread' : ''}`}
                                onClick={() => openConversation({
                                  id: conv.id,
                                  withUser: conv.withUser,
                                  withUserName: conv.withUserName
                                })}
                              >
                                <div className="message-item-content">
                                  <div className="message-sender">{conv.withUserName}</div>
                                  <div className="message-preview">{conv.lastMessage || "New conversation"}</div>
                                </div>
                                {conv.lastMessageTime && (
                                  <div className="message-time">
                                    {new Date(conv.lastMessageTime.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                )}
                                {conv.unread && <div className="unread-indicator"></div>}
                              </li>
                            ))
                          ) : (
                            <li className="empty-message">No conversations</li>
                          )}
                          {(() => {
                            // Create an array of friend IDs that already have conversations
                            const friendsWithConversations = userConversations.map(conv => conv.withUser);
                            
                            // Filter out friends that already have conversations
                            const friendsWithoutConversations = allFriends.filter(
                              friend => !friendsWithConversations.includes(friend.id)
                            );
                            
                            // Only render the "Friends" section if there are friends without conversations
                            if (friendsWithoutConversations.length > 0) {
                              return (
                                <>
                                  {friendsWithoutConversations.map(friend => (
                                    <li
                                      key={friend.id}
                                      className="message-item"
                                      onClick={() => openNewConversation(friend)}
                                    >
                                      <div className="message-item-content">
                                        <div className="message-sender">{friend.username}</div>
                                        <div className="message-preview">Start a new conversation</div>
                                      </div>
                                    </li>
                                  ))}
                                </>
                              );
                            }
                            return null;
                          })()}
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
                        
                        <div className="conversation-messages" ref={messagesContainerRef}>
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
                                {message.type === 'outfit-share' ? (
                                  <div className="outfit-message">
                                    <div className="message-content">{message.content}</div>
                                    <div 
                                      className="outfit-preview"
                                      onClick={() => handleViewOutfit(message.outfitId, message.outfitOwnerId, currentConversation.id)}
                                    >
                                      <div className="outfit-images">
                                        <img src={message.outfitPreview.topImageUrl} alt="Top" />
                                        <img src={message.outfitPreview.bottomImageUrl} alt="Bottom" />
                                        <img src={message.outfitPreview.shoesImageUrl} alt="Shoes" />
                                      </div>
                                      <div className="outfit-name">{message.outfitPreview.name || "Outfit"}</div>
                                      <span className="view-outfit">View outfit details</span>
                                    </div>
                                    <div className="message-time">
                                      {message.timestamp ? 
                                        (typeof message.timestamp.toDate === 'function' ? 
                                          new Date(message.timestamp.toDate()).toLocaleTimeString() : 
                                          new Date(message.timestamp).toLocaleTimeString()
                                        ) : 'Sending...'}
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="message-content">{message.content}</div>
                                    <div className="message-time">
                                      {message.timestamp ? 
                                        (typeof message.timestamp.toDate === 'function' ? 
                                          new Date(message.timestamp.toDate()).toLocaleTimeString() : 
                                          new Date(message.timestamp).toLocaleTimeString()
                                        ) : 'Sending...'}
                                    </div>
                                  </>
                                )}
                              </div>
                            ))
                          )}

                          {/* Add typing indicator */}
                          {isOtherUserTyping && (
                            <div className="typing-indicator">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                          )}

                          <div ref={messagesEndRef} /> {/* Add this for auto-scroll */}
                        </div>
                        
                        <div className="conversation-footer">
                          <div className="conversation-actions">
                            <button 
                              type="button" 
                              className="share-outfit-btn"
                              onClick={handleOpenOutfitModal}
                            >
                              Share Outfit
                            </button>
                          </div>
                          <form onSubmit={handleSendMessage} className="conversation-reply">
                            <div className="conversation-input">
                              <input
                                type="text"
                                placeholder="Type a message..."
                                value={messageContent}
                                onChange={handleMessageInputChange}
                              />
                              <button type="submit">Send</button>
                            </div>
                          </form>
                        </div>
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
      {/* Outfit Selection Modal */}
      {showOutfitModal && (
        <div className="outfit-share-modal">
          <div className="outfit-modal-header">
            <h3>Share an Outfit</h3>
            <button className="close-btn" onClick={() => setShowOutfitModal(false)}>×</button>
          </div>
          
          <div className="outfit-modal-body">
            {loadingOutfits ? (
              <div className="loading-outfits">Loading your outfits...</div>
            ) : userOutfits.length === 0 ? (
              <div className="no-outfits-message">
                <p>You don't have any outfits to share.</p>
                <button onClick={() => {
                  setShowOutfitModal(false);
                  navigate('/create-outfit');
                }}>Create a new outfit</button>
              </div>
            ) : (
              <>
                <div className="outfit-grid">
                  {userOutfits.map(outfit => (
                    <div 
                      key={outfit.id} 
                      className={`outfit-item ${selectedOutfit?.id === outfit.id ? 'selected' : ''}`}
                      onClick={() => setSelectedOutfit(outfit)}
                    >
                      <div className="outfit-preview-grid">
                        <img src={outfit.topImageUrl} alt="Top" />
                        <img src={outfit.bottomImageUrl} alt="Bottom" />
                        <img src={outfit.shoesImageUrl} alt="Shoes" />
                      </div>
                      <p className="outfit-name">{outfit.outfitName || "Outfit"}</p>
                    </div>
                  ))}
                </div>
                
                {selectedOutfit && (
                  <div className="selected-outfit-preview">
                    <h4>Preview: {selectedOutfit.outfitName || "Outfit"}</h4>
                    <div className="outfit-large-preview">
                      <img src={selectedOutfit.topImageUrl} alt="Top" className="preview-image" />
                      <img src={selectedOutfit.bottomImageUrl} alt="Bottom" className="preview-image" />
                      <img src={selectedOutfit.shoesImageUrl} alt="Shoes" className="preview-image" />
                    </div>
                    
                    <div className="outfit-message-input">
                      <label>Add a message:</label>
                      <input
                        type="text"
                        value={outfitMessage}
                        onChange={(e) => setOutfitMessage(e.target.value)}
                        placeholder="Say something about this outfit..."
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="outfit-modal-footer">
            <button 
              className="share-btn" 
              onClick={handleShareOutfit}
              disabled={!selectedOutfit || loadingOutfits}
            >
              Share
            </button>
            <button className="cancel-btn" onClick={() => setShowOutfitModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;