import React, { useState, useEffect, useRef } from 'react';
import '../styles/ChatRoom.css';

function ChatRoom({
  roomName,
  messages,
  onSendMessage,
  onMoveToRoomList, // Prop for moving to room list
  onLeaveChatRoom // Prop for leaving the current chat room
}) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null); // Ref for auto-scrolling

  // Auto-scroll to the latest message
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
    <div className="chat-room-container">
      <div className="chat-header">
        <h2>{roomName}</h2>
        <div className="chat-header-buttons">
          {onMoveToRoomList && (
            <button className="btn secondary" onClick={onMoveToRoomList}>다른 방으로 이동</button>
          )}
          {onLeaveChatRoom && (
            <button className="btn danger" onClick={onLeaveChatRoom}>채팅방 나가기</button>
          )}\n        </div>
      </div>
      <div className="chat-messages hide-scrollbar">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className={`message ${message.isSentByCurrentUser ? 'sent' : 'received'}`}>
              <div className="message-sender">{message.sender}:</div>
              <div className="message-text">{message.text}</div>
            </div>
          ))
        ) : (
          <div className="no-messages">대화를 시작해보세요!</div>
        )}
        <div ref={messagesEndRef} /> {/* Dummy div for scrolling */}
      </div>
      <div className="chat-input-area">
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={newMessage}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button className="btn primary" onClick={handleSendMessage}>전송</button>
      </div>
    </div>
  );
}

export default ChatRoom;