import React,{ useState,useRef,useEffect } from 'react';
import { Button,Input,Badge,Avatar,Typography,Space,Divider } from 'antd';
import {
  MessageOutlined,
  CloseOutlined,
  SendOutlined,
  MinusOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons';
import { useChatWidget } from '../hooks/useChatWidget';
import type { ProjectConfig } from '../types';

const { Text } = Typography;
const { TextArea } = Input;

interface ProjectChatWidgetProps {
  projectConfig: ProjectConfig;
  className?: string;
  style?: React.CSSProperties;
}

const ProjectChatWidget: React.FC<ProjectChatWidgetProps> = ({
  projectConfig,
  className = "",
  style = {}
}) => {
  const {
    isOpen,
    isMinimized,
    messages,
    unreadCount,
    sendUserMessage,
    openChat,
    closeChat,
    minimizeChat,
    toggleChat,
    sessionId,
    isConnected,
    isTyping,
    connectionStatus,
    startTyping,
    stopTyping
  } = useChatWidget(projectConfig);

  const [inputValue,setInputValue] = useState('');
  const [isUserTyping,setIsUserTyping] = useState(false);
  const messagesEndRef = useRef < HTMLDivElement > (null);
  const typingTimeoutRef = useRef < NodeJS.Timeout > (null);
  const primaryColor = projectConfig.projectColor || '#1890ff';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  },[messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      sendUserMessage(inputValue.trim());
      setInputValue('');
      stopTyping();
      setIsUserTyping(false);
    }
  };

  const handleInputChange = (value) => {
    setInputValue(value);

    // Handle typing indicator
    if (value.length > 0 && !isUserTyping) {
      setIsUserTyping(true);
      startTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsUserTyping(false);
      stopTyping();
    },1000);
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'OPEN': return '#52c41a';
      case 'CONNECTING': return '#faad14';
      case 'ERROR': return '#ff4d4f';
      default: return '#d9d9d9';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'OPEN': return 'Đang trực tuyến';
      case 'CONNECTING': return 'Đang kết nối...';
      case 'ERROR': return 'Lỗi kết nối';
      default: return 'Ngoại tuyến';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN',{
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={className} style={style}>
      {/* Chat Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '24px',
            width: '320px',
            height: '384px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50,
            animation: 'slideInFromBottom 0.3s ease-out'
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px',
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              color: 'white'
            }}
          >
            <div style={{ display: 'flex',alignItems: 'center',gap: '8px' }}>
              <Avatar
                size={32}
                icon={<CustomerServiceOutlined />}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
              <div>
                <Text strong style={{ color: 'white',display: 'block',fontSize: '14px' }}>
                  {projectConfig.projectName}
                </Text>
                {/* <div style={{ display: 'flex',alignItems: 'center',gap: '4px' }}>
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: getConnectionStatusColor(),
                      marginRight: '4px'
                    }}
                  />
                  <Text style={{ color: 'white',fontSize: '12px',opacity: 0.9 }}>
                    {getConnectionStatusText()} • Session: {sessionId.slice(-6)}
                  </Text>
                </div> */}
              </div>
            </div>
            <Space>
              <Button
                type="text"
                size="small"
                icon={<MinusOutlined />}
                onClick={minimizeChat}
                style={{
                  color: 'white',
                  border: 'none',
                  background: 'transparent'
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={closeChat}
                style={{
                  color: 'white',
                  border: 'none',
                  background: 'transparent'
                }}
              />
            </Space>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ maxWidth: '240px' }}>
                  {message.sender === 'admin' && (
                    <div style={{ display: 'flex',alignItems: 'center',gap: '4px',marginBottom: '4px' }}>
                      <Avatar size={20} icon={<CustomerServiceOutlined />} />
                      <Text style={{ fontSize: '12px',color: '#6b7280' }}>
                        {projectConfig.projectName}
                      </Text>
                    </div>
                  )}
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: message.sender === 'user' ? primaryColor : '#f3f4f6',
                      color: message.sender === 'user' ? 'white' : '#374151',
                      borderBottomRightRadius: message.sender === 'user' ? '2px' : '8px',
                      borderBottomLeftRadius: message.sender === 'admin' ? '2px' : '8px'
                    }}
                  >
                    <Text style={{ color: message.sender === 'user' ? 'white' : '#374151' }}>
                      {message.text}
                    </Text>
                  </div>
                  <Text style={{ fontSize: '12px',color: '#9ca3af',marginTop: '4px',display: 'block' }}>
                    {formatTime(message.timestamp)}
                  </Text>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div style={{ display: 'flex',justifyContent: 'flex-start' }}>
                <div style={{ maxWidth: '240px' }}>
                  <div style={{ display: 'flex',alignItems: 'center',gap: '4px',marginBottom: '4px' }}>
                    <Avatar size={20} icon={<CustomerServiceOutlined />} />
                    <Text style={{ fontSize: '12px',color: '#6b7280' }}>
                      {projectConfig.projectName}
                    </Text>
                  </div>
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: '#f3f4f6',
                      borderBottomLeftRadius: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex',gap: '2px' }}>
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#9ca3af',
                        animation: 'typing 1.4s infinite ease-in-out'
                      }} />
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#9ca3af',
                        animation: 'typing 1.4s infinite ease-in-out 0.2s'
                      }} />
                      <div style={{
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: '#9ca3af',
                        animation: 'typing 1.4s infinite ease-in-out 0.4s'
                      }} />
                    </div>
                    <Text style={{ fontSize: '12px',color: '#6b7280',marginLeft: '4px' }}>
                      đang nhập...
                    </Text>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* Input */}
          <div style={{ padding: '12px' }}>
            <div style={{ display: 'flex',gap: '8px' }}>
              <TextArea
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Nhập tin nhắn..."
                autoSize={{ minRows: 1,maxRows: 3 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                style={{ flex: 1 }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim() || !isConnected}
                loading={connectionStatus === 'CONNECTING'}
                style={{
                  backgroundColor: primaryColor,
                  alignSelf: 'flex-end'
                }}
                title={!isConnected ? 'Chưa kết nối WebSocket' : 'Gửi tin nhắn'}
              />
            </div>
            {!isConnected && (
              <Text style={{ fontSize: '12px',color: '#ff4d4f',marginTop: '4px',display: 'block' }}>
                Chế độ offline - tin nhắn sẽ được mô phỏng
              </Text>
            )}
          </div>
        </div>
      )}

      {/* Minimized Window */}
      {isMinimized && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '24px',
            width: '256px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
            animation: 'slideInFromBottom 0.3s ease-out'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '8px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              color: 'white',
              cursor: 'pointer'
            }}
            onClick={openChat}
          >
            <div style={{ display: 'flex',alignItems: 'center',gap: '8px' }}>
              <Avatar
                size={24}
                icon={<CustomerServiceOutlined />}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
              />
              <div>
                <Text strong style={{ color: 'white',display: 'block',fontSize: '14px' }}>
                  {projectConfig.projectName}
                </Text>
                {unreadCount > 0 && (
                  <Text style={{ color: 'white',fontSize: '12px' }}>
                    {unreadCount} tin nhắn mới
                  </Text>
                )}
              </div>
            </div>
            <div style={{ display: 'flex',alignItems: 'center',gap: '4px' }}>
              {unreadCount > 0 && (
                <Badge count={unreadCount} size="small" />
              )}
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  closeChat();
                }}
                style={{
                  color: 'white',
                  border: 'none',
                  background: 'transparent'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && !isMinimized && (
        <div style={{ position: 'fixed',bottom: '24px',left: '24px',zIndex: 50 }}>
          <Badge count={unreadCount} offset={[-5,5]}>
            <Button
              type="primary"
              shape="circle"
              size="small"
              icon={<MessageOutlined />}
              onClick={toggleChat}
              style={{
                backgroundColor: primaryColor,
                border: 'none',
                width: 40,
                height: 40,
                fontSize: '20px',
                boxShadow: `0 4px 20px ${primaryColor}40`,
                animation: unreadCount > 0 ? 'bounce 1s infinite' : 'none'
              }}
              title={`Chat với ${projectConfig.projectName}`}
            />
          </Badge>
        </div>
      )}

      {/* Inline CSS for animations */}
      <style>{`
        @keyframes slideInFromBottom {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translateY(0);
          }
          40%, 43% {
            transform: translateY(-6px);
          }
          70% {
            transform: translateY(-3px);
          }
        }
        
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-6px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default ProjectChatWidget;
