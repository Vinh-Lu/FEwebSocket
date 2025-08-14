"use client";

import Chat from '@/components/chat/Chat';

const ChatPage = () => {
  return (
    <div className="h-screen bg-gray-50">
      <Chat
        height="100vh"
        className="w-full"
      />
    </div>
  );
};

export default ChatPage;
