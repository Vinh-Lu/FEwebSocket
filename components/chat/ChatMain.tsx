"use client";

import React,{ useEffect,useState } from 'react';
import { Typography,Space } from 'antd';
import { useChat } from './ChatContext';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { MessageCircle } from 'lucide-react';
import { useFontConfig } from '@/hooks/use-font-config';

const { Title,Text } = Typography;

const ChatMain = ({ selectedChatId }) => {
  const { chats,loadInitialMessages } = useChat();
  const { themeConfig } = useFontConfig();

  const primaryColor = themeConfig.token.colorPrimary;

  const selectedChat = chats.find(chat => chat.id === selectedChatId);

  // Load messages when chat is selected
  useEffect(() => {
    if (selectedChatId) {
      loadInitialMessages(selectedChatId);
    }
  },[selectedChatId]); // Remove loadInitialMessages from dependencies

  if (!selectedChatId || !selectedChat) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-white to-slate-50 relative overflow-hidden">
        {/* Floating decoration elements */}
        <div
          className="absolute top-1/5 left-1/5 w-50 h-50 rounded-full blur-3xl animate-pulse"
          style={{
            background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <div
          className="absolute bottom-1/5 right-1/5 w-38 h-38 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${primaryColor}10 0%, transparent 70%)`,
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />

        <Space direction="vertical" align="center" size="large" className="z-10">
          <div
            className="rounded-full p-6 animate-pulse"
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              boxShadow: `0 16px 48px ${primaryColor}33`,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            <MessageCircle size={48} color="white" />
          </div>
          <div className="text-center max-w-md">
            <Title
              level={2}
              className="text-gray-800 mb-4 font-bold tracking-wide"
            >
              Chào mừng đến với FUTA Chat
            </Title>
            <Text className="text-base text-gray-500 leading-relaxed block">
              Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo mới để bắt đầu.
            </Text>
          </div>
        </Space>

        <style jsx>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-white to-slate-50 rounded-xl overflow-hidden shadow-lg">
      {/* Chat Header */}
      <ChatHeader chat={selectedChat} />

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ChatMessages chatId={selectedChatId} />
      </div>

      {/* Chat Input */}
      <ChatInput chatId={selectedChatId} />
    </div>
  );
};

export default ChatMain;
