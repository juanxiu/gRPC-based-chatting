import React, { useState } from 'react';
import './App.css'; // Keep general app styles if any
import { v4 as uuidv4 } from 'uuid';
import LoginExit from './components/LoginExit';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import { Quit, EventsOn, EventsOff } from '../wailsjs/runtime/runtime';
import { SetUserId, GetUserId, StartChat, Close, CloseChat, SendChatMessage, GetMessageHistory } from '../wailsjs/go/client/Client'
import { useEffect } from 'react';

function App() {
  const [currentView, setCurrentView] = useState('login');
  const [userId, setUserId] = useState('');
  const [activeRoom, setActiveRoom] = useState();
  const [joinedRooms, setJoinedRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    EventsOn("newMessage", handleReceiveMessage);
    return () => {
      EventsOff("newMessage");
    };
  }, [activeRoom]);

  // Handlers
const handleLogin = async () => {
  const uid = await SetUserId(); // Go에서 즉시 반환해도 JS에선 Promise
  setUserId(uid);
  setCurrentView('chatRoom');
};

  const handleExit = () => {
    Close();
    Quit();
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };

  // 새로운 채팅방 생성
  // 리액트 상에서만 생성, 서버와 연결하지 않음
  const handleCreateRoom = () => {
    const newRoomId = uuidv4() // 채팅방ID는 uuid 기반
    const newRoomName = `Chatroom ${rooms.length + 1}`;
    const newRoom = { id: newRoomId, name: newRoomName, userCount: 0 };
    setRooms([...rooms, newRoom]);
  };

  // 채팅방 들어가기
  const handleJoinRoom = async (roomId) => {
    // 채팅방이 존재하는지 찾기
    const roomToJoin = rooms.find(room => room.id === roomId);
    if (!roomToJoin) return;

    // 이미 가입한 방인지 확인
    const alreadyJoined = joinedRooms.some(room => room.id === roomId);
    if (!alreadyJoined) {
      setJoinedRooms(prev => [
        ...prev,
        { id: roomToJoin.id, name: roomToJoin.name }
      ]);

      setRooms(prev =>
        prev.map(room =>
          room.id === roomId
            ? { ...room, userCount: (room.userCount || 0) + 1 }
            : room
        )
      );

      StartChat(roomId); // StartChat 호출
    }

    setActiveRoom(roomToJoin);

    // 이전 메시지 불러오기
    const history = await GetMessageHistory(roomId);
    setMessages(history || []);

    setCurrentView('chatRoom');
  };

  // 메시지 송신
  const handleSendMessage = async (messageText) => {
    const timestamp = new Date(Date.now()).toISOString();
    const uuid = await GetUserId();
    const newMessage = {
      channel: activeRoom.id,
      sender: uuid,
      content: messageText,
      timestamp: timestamp
    };

    await SendChatMessage(newMessage)
  };

  // 메시지 수신
  const handleReceiveMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  // 채팅방 나가기
  const handleExitRoom = (roomId) => {
    setActiveRoom(null);
    setMessages([]);
    setJoinedRooms(prev => prev.filter(room => room.id !== roomId));
    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, userCount: Math.max(0, (room.userCount || 0) - 1) }
          : room
      )
    );

    CloseChat(roomId) // CloseChat 호출
  }

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginExit onLogin={handleLogin} onExit={handleExit} />;
      case 'chatRoom':
        return (
          <div className="main-layout">
            <RoomList
              rooms={rooms}
              onJoinRoom={handleJoinRoom}
              onCreateRoom={handleCreateRoom}
              onBackToLogin={handleBackToLogin}
            />
            {activeRoom ? (
              <ChatRoom
                roomName={activeRoom.name}
                messages={messages || []}
                onSendMessage={handleSendMessage}
                onExitRoom={() => handleExitRoom(activeRoom.id)}
                userId={userId}
              />
            ) : (
              <div className="chat-room-no-room">
              </div>
            )}
          </div>
        );
      default:
        return <LoginExit onLogin={handleLogin} onExit={handleExit} />;
    }
  };

  return (
    <div id="App">
      {renderView()}
    </div>
  );
}

export default App;
