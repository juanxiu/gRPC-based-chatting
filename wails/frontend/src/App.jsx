import React, { useState } from 'react';
import './App.css'; // Keep general app styles if any
import { v4 as uuidv4 } from 'uuid';
import LoginExit from './components/LoginExit';
import RoomList from './components/RoomList';
import ChatRoom from './components/ChatRoom';
import { Quit, EventsOn, EventsOff } from '../wailsjs/runtime/runtime';
import { SetUserId, GetUserId, StartChat, Close, CloseChat, SendChatMessage } from '../wailsjs/go/client/Client'
import { useEffect } from 'react';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 현재 사용자가 보고 있는 컴포넌트
  const [activeRoom, setActiveRoom] = useState(); // 현재 사용자가 위치하는 채팅방
  const [joinedRooms, setJoinedRooms] = useState([]); // 사용자가 들어간 채팅방
  const [rooms, setRooms] = useState([]); // 존재하는 채팅방
  const [messages, setMessages] = useState([]);

  // room state는 { id: _, name: _, userCount: _ } 구조

  useEffect(() => {
    EventsOn("newMessage", handleReceiveMessage);
    console.log("Message listener registered.");

    return () => {
      EventsOff("newMessage");
      console.log("Message listener unregistered.");
    };
  }, []);
  
  // Handlers
  const handleLogin = () => {
    SetUserId();
    setCurrentView('roomList');
  };
  
  const handleExit = () => {
    Close()
    Quit();
  };

  const handleBackToLogin = () => {
    setCurrentView('login');
  };
  
  const handleCreateRoom = () => {
    // 새로운 채팅방 생성
    const newRoomId = uuidv4() // 채팅방ID는 uuid 기반
    const newRoomName = `채팅방 ${rooms.length + 1}`;
    const newRoom = { id: newRoomId, name: newRoomName, userCount: 0 };
    setRooms([...rooms, newRoom]);
    handleJoinRoom(newRoomId); // 생성 후 Join
  };
  
  const handleJoinRoom = (roomId) => {
    const roomToJoin = rooms.find(room => room.id === roomId);
    if (!roomToJoin) return;
    
    // 이미 가입한 방인지 확인
    const alreadyJoined = joinedRooms.some(room => room.id === roomId);
    if (!alreadyJoined) {
      setJoinedRooms(prev => [
        ...prev,
        { id: roomToJoin.id, name: roomToJoin.name } // joinedRooms에서는 userCount를 추적하지 않아도 됨
      ]);

      // rooms 상태 업데이트: userCount 증가
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === roomId ? { ...room, userCount: (room.userCount || 0) + 1 } : room
        )
      );

      StartChat(); // gRPC StartChat 호출
    }

    setActiveRoom(roomToJoin);
    setMessages([]);
    setCurrentView('chatRoom');
  };

  const handleSendMessage = (messageText) => {
    const timestamp = new Date(Date.now()).toISOString();
    const uuid = GetUserId()
    const newMessage = {
      channel: activeRoom.id,
      sender: uuid,
      content: messageText,
      timestamp: timestamp
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    SendChatMessage(newMessage)
  };

  const handleReceiveMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  // 채팅방 이동
  const handleMoveRoom = () => {
    setActiveRoom(null);
    setMessages([]);
    setCurrentView('roomList');
  };

  const handleExitRoom = (roomId) => {
    setActiveRoom(null);
    setMessages([]);
    CloseChat(roomId) // gRPC CloseChat 호출

    // rooms 상태 업데이트: userCount 감소
    setRooms(prevRooms =>
      prevRooms.map(room =>
        room.id === roomId ? { ...room, userCount: Math.max(0, (room.userCount || 0) - 1) } : room // userCount가 0 미만이 되지 않도록 처리
      )
    );

    setCurrentView('roomList');
  }

  // Render the appropriate component based on the current view
  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <LoginExit onLogin={handleLogin} onExit={handleExit} />;
      case 'roomList':
        return <RoomList rooms={rooms} onJoinRoom={handleJoinRoom} onCreateRoom={handleCreateRoom} onBackToLogin={handleBackToLogin} />;
      case 'chatRoom':
        return <ChatRoom roomName={activeRoom?.name} messages={messages} onSendMessage={handleSendMessage} onMoveToRoomList={handleMoveRoom} onLeaveChatRoom={() => handleExitRoom(activeRoom?.id)} />;
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
