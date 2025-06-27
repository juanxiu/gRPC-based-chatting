import React from 'react';
import '../styles/RoomList.css';

function RoomList({
  rooms,
  onJoinRoom,
  onCreateRoom,
  onBackToLogin // Add new prop for back button handler
}) {
  return (
    <div className="room-list-container">
      <div className="room-list-header">
         <h2>채팅방 목록</h2>
      </div>

      <ul className="room-items hide-scrollbar">
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <li key={room.id} className="room-item" onClick={() => onJoinRoom(room.id)}>
              <span className="room-name">{room.name}</span>
              <span className="room-meta">
                <span className="user-count">{room.userCount || 0}</span>
                <span className="dot">•</span>
              </span>
            </li>
          ))
        ) : (
          <li className="no-rooms">채팅방을 만들고 새로운 대화를 시작해보세요!</li>
        )}
      </ul>

      <div className="room-list-buttons">
        <button className="btn primary create-room-btn" onClick={onCreateRoom}>채팅방 생성</button>
        <button className="btn secondary back-to-login-btn" onClick={onBackToLogin}>메인 화면</button>
      </div>
    </div>
  );
}

export default RoomList;