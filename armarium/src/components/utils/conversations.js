import { collection, doc, setDoc, addDoc, getDoc, getDocs, query, where, orderBy, updateDoc, serverTimestamp, onSnapshot, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../backend/firebaseConfig';

/**
 * Generate a consistent conversation ID from two user IDs
 */
export const getConversationId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (senderId, receiverId, content) => {
  const conversationId = getConversationId(senderId, receiverId);
  
  try {
    // Get sender and receiver info
    const senderDoc = await getDoc(doc(db, 'Users', senderId));
    const receiverDoc = await getDoc(doc(db, 'Users', receiverId));
    
    const senderName = senderDoc.data()?.username || 'Unknown User';
    const receiverName = receiverDoc.data()?.username || 'Unknown User';
    
    // Add message to the conversation's messages subcollection
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      content,
      senderId,
      senderName,
      receiverId,
      receiverName,
      timestamp: serverTimestamp(),
      read: false
    });
    
    // Update conversation metadata
    await setDoc(doc(db, 'conversations', conversationId), {
      lastMessage: content,
      lastMessageTime: serverTimestamp(),
      participants: [senderId, receiverId],
      participantNames: {
        [senderId]: senderName,
        [receiverId]: receiverName
      }
    }, { merge: true });
    
    // Update user's conversation references
    await setDoc(doc(db, 'Users', senderId, 'conversations', conversationId), {
      withUser: receiverId,
      withUserName: receiverName,
      lastRead: serverTimestamp()
    }, { merge: true });
    
    await setDoc(doc(db, 'Users', receiverId, 'conversations', conversationId), {
      withUser: senderId, 
      withUserName: senderName,
      unread: true
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error sending message:", error);
    return false;
  }
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (userId) => {
  try {
    const conversationsRef = collection(db, 'Users', userId, 'conversations');
    const conversationsSnap = await getDocs(conversationsRef);
    
    const conversations = [];
    for (const convDoc of conversationsSnap.docs) {
      const convData = convDoc.data();
      const conversationId = convDoc.id;
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (conversationDoc.exists()) {
        const fullConvData = conversationDoc.data();
        conversations.push({
          id: conversationId,
          withUser: convData.withUser,
          withUserName: convData.withUserName,
          lastMessage: fullConvData.lastMessage,
          lastMessageTime: fullConvData.lastMessageTime,
          unread: convData.unread || false
        });
      }
    }
    
    // Sort by last message time (newest first)
    return conversations.sort((a, b) => {
      if (!a.lastMessageTime) return 1;
      if (!b.lastMessageTime) return -1;
      return b.lastMessageTime.toMillis() - a.lastMessageTime.toMillis();
    });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    return [];
  }
};

/**
 * Listen to messages in a conversation
 */
export const listenToConversationMessages = (conversationId, callback) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(messages);
  });
};

/**
 * Mark conversation as read for a user
 */
export const markConversationAsRead = async (userId, conversationId) => {
    try {
      await updateDoc(doc(db, 'Users', userId, 'conversations', conversationId), {
        lastRead: serverTimestamp(),
        unread: false
      });
      
      // Also mark all messages as read
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      const unreadQuery = query(messagesRef, where('receiverId', '==', userId), where('read', '==', false));
      const unreadSnap = await getDocs(unreadQuery);
      
      // Create a batch using the v9 SDK
      const batch = writeBatch(db);
      unreadSnap.docs.forEach(docRef => {
        batch.update(docRef.ref, { read: true });
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      return false;
    }
  };

/**
 * Send an outfit share message in a conversation
 */
export const sendOutfitMessage = async (senderId, receiverId, outfitId, customMessage = "Check out this outfit!") => {
  const conversationId = getConversationId(senderId, receiverId);
  
  try {
    // Get sender and receiver info
    const senderDoc = await getDoc(doc(db, 'Users', senderId));
    const receiverDoc = await getDoc(doc(db, 'Users', receiverId));
    
    const senderName = senderDoc.data()?.username || 'Unknown User';
    const receiverName = receiverDoc.data()?.username || 'Unknown User';
    
    // Get outfit data for preview
    const outfitDoc = await getDoc(doc(db, `Users/${senderId}/Outfits/${outfitId}`));
    
    if (!outfitDoc.exists()) {
      throw new Error("Outfit not found");
    }
    
    const outfitData = outfitDoc.data();
    
    // Add message with outfit reference to the conversation
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      type: "outfit-share",
      content: customMessage,
      senderId,
      senderName,
      receiverId,
      receiverName,
      timestamp: serverTimestamp(),
      read: false,
      outfitId: outfitId,       // Make sure this is set
      outfitOwnerId: senderId,  // Make sure this is set
      outfitPreview: {
        name: outfitData.outfitName,
        topImageUrl: outfitData.topImageUrl,
        bottomImageUrl: outfitData.bottomImageUrl,
        shoesImageUrl: outfitData.shoesImageUrl
      }
    });
    
    // Update conversation metadata (similar to regular messages)
    await setDoc(doc(db, 'conversations', conversationId), {
      lastMessage: `[Outfit] ${customMessage}`,
      lastMessageTime: serverTimestamp(),
      participants: [senderId, receiverId],
      participantNames: {
        [senderId]: senderName,
        [receiverId]: receiverName
      }
    }, { merge: true });
    
    // Update user conversation references
    await setDoc(doc(db, 'Users', senderId, 'conversations', conversationId), {
      withUser: receiverId,
      withUserName: receiverName,
      lastRead: serverTimestamp()
    }, { merge: true });
    
    await setDoc(doc(db, 'Users', receiverId, 'conversations', conversationId), {
      withUser: senderId, 
      withUserName: senderName,
      unread: true
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error("Error sending outfit message:", error);
    return false;
  }
};

/**
 * Set the typing status for a user in a conversation
 */
export const setTypingStatus = async (userId, conversationId, isTyping) => {
  if (!userId || !conversationId) {
    console.error("Missing userId or conversationId for typing status");
    return false;
  }
  
  try {
    console.log(`Setting typing status for ${userId} to ${isTyping ? 'typing' : 'not typing'}`);
    
    const conversationRef = doc(db, 'conversations', conversationId);
    
    // First check if the conversation document exists
    const conversationDoc = await getDoc(conversationRef);
    
    if (!conversationDoc.exists()) {
      // Create it first with basic data
      await setDoc(conversationRef, {
        typingUsers: isTyping ? [userId] : [],
        lastActivity: serverTimestamp()
      });
    } else {
      // Update the existing document
      await setDoc(conversationRef, {
        typingUsers: isTyping ? arrayUnion(userId) : arrayRemove(userId),
        lastActivity: serverTimestamp()
      }, { merge: true });
    }
    
    return true;
  } catch (error) {
    console.error("Error setting typing status:", error);
    return false;
  }
};

/**
 * Listen for typing status changes in a conversation
 */
export const listenToTypingStatus = (conversationId, currentUserId, callback) => {
  const conversationRef = doc(db, 'conversations', conversationId);
  
  return onSnapshot(conversationRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      const typingUsers = data.typingUsers || [];
      
      // Check if someone other than current user is typing
      const isOtherUserTyping = typingUsers.some(id => id !== currentUserId);
      
      callback(isOtherUserTyping);
    } else {
      callback(false);
    }
  });
};