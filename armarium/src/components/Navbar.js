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

  const handleMouseLeave = () => {
    setDropdownVisible(false);
    console.log("unhover");
  };

  // Track unread messages
  useEffect(() => {
    if (!auth.currentUser) return; // Ensure user is logged in

    const messageQuery = query(
      collection(db, 'messages'),
      where('receiverId', '==', auth.currentUser.uid),
      where('read', '==', false) // Filter for unread messages
    );

    const unsubscribe = onSnapshot(messageQuery, (snapshot) => {
      setUnreadMessages(snapshot.docs.length); // Update unread messages count

      // Get the recent unread messages for the dropdown
      const messageData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Group messages by sender for conversations
      const groupedMessages = messageData.reduce((acc, message) => {
        const senderId = message.senderId;
        if (!acc[senderId]) {
          acc[senderId] = [];
        }
        acc[senderId].push(message);
        return acc;
      }, {});

      // Get the latest message from each conversation
      const latestMessages = Object.keys(groupedMessages).map(senderId => {
        const messages = groupedMessages[senderId];
        return messages.reduce((latest, message) => {
          if (!latest.timestamp || (message.timestamp && message.timestamp.toDate() > latest.timestamp.toDate())) {
            return message;
          }
          return latest;
        }, {});
      });

      setRecentMessages(messageData); // Update recent messages state
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const toggleMessageDropdown = () => {
    setShowMessageDropdown(!showMessageDropdown); // Toggle message dropdown visibility
    setCurrentConversation(null); // Reset current conversation when toggling dropdown
    setConversationMessages([]); // Reset conversation messages
  };

  // Load conversation messages when a conversation is selected
  useEffect(() => {
    if (!auth.currentUser || !currentConversation) return; // Ensure user is logged in and conversation is selected

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(msg => 
        (msg.senderId === auth.currentUser.uid && msg.receiverId === currentConversation.senderId) ||
        (msg.senderId === currentConversation.senderId && msg.receiverId === auth.currentUser.uid)
      );

      setConversationMessages(messages); // Update conversation messages state

      // Mark messages as read
      messages.forEach(async (message) => {
        if (message.receiverId === auth.currentUser.uid && !message.read) {
          await updateDoc(doc(db, 'messages', message.id), {
            read: true // Mark message as read
          });
        }
      });
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, [currentConversation]);

  const openConversation = (message) => {
    setCurrentConversation(message);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageContent.trim() || !currentConversation) return; // Ensure message content is not empty and conversation is selected

    try {
      await addDoc(collection(db, 'messages'), {
        content: messageContent,
        senderId: auth.currentUser.uid,
        senderName: auth.currentUser.displayName || 'You',
        receiverId: currentConversation.senderId,
        receiverName: currentConversation.senderName,
        timestamp: serverTimestamp(),
        read: false,
        participants: [auth.currentUser.uid, currentConversation.senderId]
      });

      setMessageContent(''); // Clear message input after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const viewAllMessages = () => {
    setShowMessageDropdown(false);
    navigate('/messages'); // Redirect to messages page
  }

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
            {/* Message button with notification counter and dropdown */}
            <li className="nav-item message-item">
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
                          {recentMessages.length > 0 ? (
                            recentMessages.map(message => (
                              <li key={message.id} onClick={() => openConversation(message)}>
                                <div className="message-preview">
                                  <strong>{message.senderName}</strong>
                                  <span className="message-time">
                                    {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : ''}
                                  </span>
                                </div>
                                <p className="message-snippet">{message.content?.substring(0, 30)}...</p>
                              </li>
                            ))
                          ) : (
                            <li className="empty-message">No messages</li>
                          )}
                          <li className="view-all" onClick={viewAllMessages}>
                            See All in Messenger
                          </li>
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
                          {conversationMessages.map(message => (
                            <div 
                              key={message.id}
                              className={`message ${message.senderId === auth.currentUser.uid ? 'sent' : 'received'}`}
                            >
                              <div className="message-content">{message.content}</div>
                              <div className="message-time">
                                {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : 'Sending...'}
                              </div>
                            </div>
                          ))}
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