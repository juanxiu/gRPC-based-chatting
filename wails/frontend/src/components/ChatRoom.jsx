import React, { useState, useEffect, useRef } from 'react';
import { GetUserId } from '../../wailsjs/go/client/Client'

import '../styles/ChatRoom.css';

function ChatRoom({
  roomName,
  messages,
  onSendMessage,
  onLeaveChatRoom // Prop for leaving the current chat room
}) {
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState('');
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  useEffect(() => {
    GetUserId().then(id => setUserId(id));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (event) => {
    setNewMessage(event.target.value);
  };

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault(); // Prevent default form submission
      handleSendMessage();
    }
  };

  return (
    <div className="chat-room-container chat-room-main">
      <div className="chat-header">
        <h2>{roomName}</h2>
        <div className="chat-header-buttons">
          {onLeaveChatRoom && (
            <button className="btn danger" onClick={onLeaveChatRoom}>Leave Room</button>
          )}        
        </div>
      </div>
      <div className="chat-messages hide-scrollbar">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.sender === userId ? 'sent' : 'received'}`}> 
              <div className="message-sender">{message.sender}:</div>
              <div className="message-text">{message.content}</div>
            </div>
          ))
        ) : (
          <div className="no-messages">Start a conversation!</div> 
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          placeholder="Enter message..." 
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button className="btn primary" onClick={handleSendMessage}>Send</button> 
      </div>
    </div>
  );
}

export default ChatRoom;