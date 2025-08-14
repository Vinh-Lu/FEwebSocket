"use client";

import React from 'react';
import { Typography,Avatar } from 'antd';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useFontConfig } from '../../hooks/use-font-config';

const { Text } = Typography;

const ChatBubble = ({
  message,
  isGrouped = false,
  showAvatar = true
}) => {
  const { themeConfig } = useFontConfig();
  const primaryColor = themeConfig.token.colorPrimary;
  const isUser = message.sender === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-3'}`}>
      <div className={`flex items-end space-x-2 max-w-[75%] ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {showAvatar && !isGrouped && (
          <Avatar
            size={28}
            style={{
              background: isUser
                ? 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)'
                : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
            }}
          >
            {isUser ? 'U' : 'F'}
          </Avatar>
        )}

        {/* Spacer when grouped */}
        {isGrouped && showAvatar && (
          <div className="w-7 h-7 flex-shrink-0" />
        )}

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div
            className={`px-3 py-2 rounded-lg shadow-sm transition-all duration-200 hover:shadow-md ${isUser
                ? 'rounded-br-sm'
                : 'rounded-bl-sm'
              }`}
            style={{
              background: isUser
                ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
                : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
              border: isUser ? 'none' : '1px solid rgba(0,0,0,0.05)'
            }}
          >
            {/* Message Content */}
            <Text
              className="text-sm leading-relaxed whitespace-pre-wrap block"
              style={{
                color: isUser ? 'white' : '#1f2937',
                margin: 0,
                wordBreak: 'break-word'
              }}
            >
              {message.text}
            </Text>

            {/* Message Meta */}
            <div className={`flex items-center justify-between mt-1 ${isUser ? 'text-white/70' : 'text-gray-500'
              }`}>
              <Text
                className="text-xs"
                style={{
                  color: isUser ? 'rgba(255,255,255,0.8)' : '#6b7280',
                  margin: 0
                }}
              >
                {format(new Date(message.timestamp),'HH:mm',{ locale: vi })}
              </Text>

              {/* Message Status (for user messages) */}
              {isUser && (
                <div className="flex items-center ml-2">
                  <Clock size={10} style={{ color: 'rgba(255,255,255,0.7)' }} />
                </div>
              )}
            </div>
          </div>

          {/* Typing Indicator */}
          {message.text === '...' && !isUser && (
            <div className="flex items-center space-x-2 mt-2 px-3">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
              <Text className="text-xs text-gray-500 ml-2">Đang nhập...</Text>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
