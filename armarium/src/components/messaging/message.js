import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../backend/firebaseConfig';
import Navbar from '../Navbar';
import '../styles/Messages.css';
import { getConversationId, sendMessage, getUserConversations, listenToConversationMessages, markConversationAsRead } from '../utils/conversations';

function Messages() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentUser = auth.currentUser;
  
  // Fetch user's friends and conversations
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchFriendsAndConversations = async () => {
      try {
        // Fetch friends
        const friendsRef = collection(db, 'Users', currentUser.uid, 'friends');
        const friendsSnapshot = await getDocs(friendsRef);
        const friendsList = friendsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFriends(friendsList);
        
        // Fetch conversations
        const userConversations = await getUserConversations(currentUser.uid);
        setConversations(userConversations);
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchFriendsAndConversations();
  }, [currentUser]);
  
  // Load messages for selected friend
  useEffect(() => {
    if (!currentUser || !selectedFriend) return;
    
    const conversationId = getConversationId(currentUser.uid, selectedFriend.id);
    
    // Mark as read when selecting
    markConversationAsRead(currentUser.uid, conversationId);
    
    // Listen for messages
    const unsubscribe = listenToConversationMessages(conversationId, (messagesList) => {
      setMessages(messagesList);
    });
    
    return () => unsubscribe();
  }, [currentUser, selectedFriend]);
  
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !selectedFriend) return;
    
    try {
      await sendMessage(currentUser.uid, selectedFriend.id, messageContent);
      setMessageContent('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  return (
    <>
      <Navbar />
      <div className="messages-container">
        <div className="friends-sidebar">
          <h3>Friends</h3>
          {loading ? (
            <p>Loading friends...</p>
          ) : friends.length === 0 ? (
            <p>No friends found.</p>
          ) : (
            <ul>
              {friends.map(friend => (
                <li 
                  key={friend.id} 
                  className={selectedFriend?.id === friend.id ? 'selected' : ''}
                  onClick={() => setSelectedFriend(friend)}
                >
                  {friend.username || 'Unknown User'}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="chat-area">
          {selectedFriend ? (
            <>
              <div className="chat-header">
                <h3>Chat with {selectedFriend.username || 'Friend'}</h3>
              </div>
              
              <div className="messages-list">
                {messages.map(message => (
                  <div 
                    key={message.id}
                    className={`message ${message.senderId === currentUser.uid ? 'sent' : 'received'}`}
                  >
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">
                      {message.timestamp ? new Date(message.timestamp.toDate()).toLocaleTimeString() : 'Sending...'}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="message-input">
                <input
                  type="text"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button onClick={sendMessage}>Send</button>
              </div>
            </>
          ) : (
            <div className="no-chat-selected">
              <p>Select a friend to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Messages;