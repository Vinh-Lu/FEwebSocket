"use client";

import React,{ useState,useRef,useEffect } from 'react';
import { Button,Input,Space,Card,Typography } from 'antd';
import { useChat } from './ChatContext';
import { useFontConfig } from '@/hooks/use-font-config';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X
} from 'lucide-react';

const { TextArea } = Input;
const { Text } = Typography;

const ChatInput = ({ chatId }) => {
  const { sendMessage,replyingTo,cancelReply } = useChat();
  const [message,setMessage] = useState('');
  const [isRecording,setIsRecording] = useState(false);
  const textareaRef = useRef(null);

  const { themeConfig } = useFontConfig();
  const primaryColor = themeConfig.token.colorPrimary;

  const handleSend = async () => {
    if (message.trim()) {
      try {
        await sendMessage(chatId,message.trim());
        setMessage('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } catch (error) {
        console.error('Error sending message:',error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="p-3 border-t bg-gradient-to-r from-gray-50 to-white">
      {/* Reply Preview */}
      {replyingTo && (
        <div
          className="mb-2 border-0"
          style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            padding: '8px 12px'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#6c757d',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                💬 Đang trả lời
              </Text>
              <div
                className="transition-all duration-200 hover:bg-opacity-10 rounded-lg p-1"
                style={{
                  borderLeft: `4px solid ${primaryColor}`,
                  marginTop: 4,
                  backgroundColor: 'rgba(0,0,0,0.02)'
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    color: '#495057',
                    display: 'block',
                    maxHeight: '40px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontWeight: 400,
                    lineHeight: '1.4'
                  }}
                >
                  {replyingTo.text}
                </Text>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<X size={14} />}
              onClick={cancelReply}
              style={{ padding: 0,minWidth: 24 }}
            />
          </div>
        </div>
      )}

      {/* Input Area */}
      <div
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)',
          padding: '8px'
        }}
      >
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Nhập tin nhắn..."
            autoSize={{ minRows: 1,maxRows: 4 }}
            style={{
              resize: 'none',
              borderRadius: '12px',
              border: '1px solid #e1e5e9',
              fontSize: '14px',
              lineHeight: '1.5'
            }}
          />

          <Button
            type="text"
            icon={<Paperclip size={16} />}
            className="hover:bg-gray-100 transition-all duration-200"
            style={{ borderRadius: '8px' }}
          />
          <Button
            type="text"
            icon={<Smile size={16} />}
            className="hover:bg-gray-100 transition-all duration-200"
            style={{ borderRadius: '8px' }}
          />

          {message.trim() ? (
            <Button
              type="primary"
              icon={<Send size={16} />}
              onClick={handleSend}
              style={{
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
                boxShadow: `0 4px 12px ${primaryColor}33`,
                border: 'none',
                fontWeight: 500
              }}
              className="hover:scale-105 transition-all duration-200"
            />
          ) : (
            <Button
              type={isRecording ? "primary" : "text"}
              danger={isRecording}
              icon={<Mic size={16} />}
              onClick={toggleRecording}
              className={`transition-all duration-200 ${isRecording ? 'animate-pulse' : 'hover:bg-gray-100'}`}
              style={{
                borderRadius: '12px',
                ...(isRecording && {
                  background: 'linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%)',
                  boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)'
                })
              }}
            />
          )}
        </Space.Compact>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="flex items-center justify-center text-red-500 mb-2">
          <Space>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Đang ghi âm...</span>
          </Space>
        </div>
      )}

    </div>
  );
};

export default ChatInput;
