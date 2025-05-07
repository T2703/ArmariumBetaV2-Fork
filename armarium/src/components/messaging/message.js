// Messages structure in Firestore:
// - messages (collection)
//   - messageId (document)
//     - senderId: string
//     - receiverId: string
//     - content: string
//     - timestamp: timestamp
//     - read: boolean

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../backend/firebaseConfig';
import Navbar from '../Navbar';
import '../styles/Messages.css';

function Messages() {
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentUser = auth.currentUser;
  
  // Fetch user's friends
  useEffect(() => {
    if (!currentUser) return;
    
    const fetchFriends = async () => {
      try {
        const friendsRef = collection(db, 'Users', currentUser.uid, 'friends');
        const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
          const friendsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setFriends(friendsList);
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching friends:", error);
        setLoading(false);
      }
    };
    
    fetchFriends();
  }, [currentUser]);
  
  // Load messages when a friend is selected
  useEffect(() => {
    if (!currentUser || !selectedFriend) return;
    
    // Query messages between current user and selected friend
    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messageList = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(msg => 
          (msg.senderId === currentUser.uid && msg.receiverId === selectedFriend.id) ||
          (msg.senderId === selectedFriend.id && msg.receiverId === currentUser.uid)
        );
      
      setMessages(messageList);
    });
    
    return () => unsubscribe();
  }, [currentUser, selectedFriend]);
  
  const sendMessage = async () => {
    if (!messageContent.trim() || !selectedFriend) return;
    
    try {
      await addDoc(collection(db, 'messages'), {
        content: messageContent,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'You',
        receiverId: selectedFriend.id,
        receiverName: selectedFriend.username || 'Friend',
        timestamp: serverTimestamp(),
        read: false,
        participants: [currentUser.uid, selectedFriend.id]
      });
      
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
                      sendMessage();
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