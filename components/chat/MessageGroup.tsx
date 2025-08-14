"use client";

import React,{ useState,useEffect } from 'react';
import { Avatar,Typography,Space,Button,Input,Dropdown } from 'antd';
import { format } from 'date-fns';
import { MoreHorizontal,Edit3,Check,X,Reply,Trash2 } from 'lucide-react';
import { useChat } from './ChatContext';
import { useFontConfig } from '@/hooks/use-font-config';

const { Text } = Typography;

// Component for editable message
const EditableMessage = ({ message,index,totalMessages,isUser,onEdit,onReply,onDelete,primaryColor,onScrollToReply }) => {
  const [isEditing,setIsEditing] = useState(false);
  const [editText,setEditText] = useState(message.text);

  const handleSave = () => {
    if (editText.trim() !== message.text.trim()) {
      onEdit(message.id,editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(message.text);
    setIsEditing(false);
  };

  const dropdownItems = [
    {
      key: 'reply',
      label: (
        <span className="flex items-center gap-2">
          <Reply size={14} />
          Trả lời
        </span>
      ),
      onClick: () => onReply(message)
    },
    {
      key: 'edit',
      label: (
        <span className="flex items-center gap-2">
          <Edit3 size={14} />
          Chỉnh sửa
        </span>
      ),
      onClick: () => setIsEditing(true)
    },
    {
      key: 'delete',
      label: (
        <span className="flex items-center gap-2 text-red-500">
          <Trash2 size={14} />
          Xóa
        </span>
      ),
      onClick: () => onDelete(message.id),
      danger: true
    }
  ];

  if (isEditing) {
    return (
      <div className="relative group flex items-start gap-2">
        <div
          className="flex-1"
          style={{
            backgroundColor: isUser ? primaryColor : '#f0f0f0',
            borderRadius: getBorderRadius(index,totalMessages,isUser),
            padding: '8px'
          }}
        >
          <Input.TextArea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            autoSize={{ minRows: 1,maxRows: 4 }}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: isUser ? 'white' : 'black',
              resize: 'none'
            }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />
          <div className="flex gap-1 mt-2">
            <Button
              type="text"
              size="small"
              icon={<Check size={12} />}
              onClick={handleSave}
              style={{ color: isUser ? 'white' : 'inherit' }}
            />
            <Button
              type="text"
              size="small"
              icon={<X size={12} />}
              onClick={handleCancel}
              style={{ color: isUser ? 'white' : 'inherit' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group flex items-center gap-2">
      {/* Edit menu - only show for user messages and not deleted */}
      {isUser && message.sender === 'user' && !message.deleted && (
        <Dropdown
          menu={{ items: dropdownItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            size="small"
            icon={<MoreHorizontal size={14} />}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white hover:bg-opacity-20"
            style={{
              color: isUser ? 'white' : '#666',
              padding: '4px',
              height: '24px',
              width: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          />
        </Dropdown>
      )}

      <div
        className="flex-1 transition-all duration-200 hover:shadow-lg"
        style={{
          background: isUser
            ? `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
            : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: getBorderRadius(index,totalMessages,isUser),
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: isUser ? 'none' : '1px solid rgba(0,0,0,0.05)'
        }}
        data-message-text={message.deleted ? '' : message.text}
      >
        {message.replyTo && !message.deleted && (
          <div
            className="transition-all duration-200 hover:bg-opacity-20 rounded-lg"
            style={{
              borderLeft: `4px solid ${isUser ? 'rgba(255,255,255,0.6)' : primaryColor}`,
              paddingLeft: 8,
              paddingTop: 4,
              paddingBottom: 4,
              marginBottom: 6,
              backgroundColor: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)',
              borderRadius: '0 8px 8px 0',
              cursor: 'pointer'
            }}
            onClick={() => onScrollToReply && onScrollToReply(message.replyTo)}
            title="Click để chuyển đến tin nhắn gốc"
          >
            <Text
              style={{
                fontSize: 11,
                color: isUser ? 'rgba(255,255,255,0.9)' : '#555',
                fontWeight: 500,
                letterSpacing: '0.3px'
              }}
            >
              {message.replyTo}
            </Text>
          </div>
        )}
        {message.deleted ? (
          <Text
            style={{
              color: isUser ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)',
              fontStyle: 'italic',
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: '0.3px'
            }}
          >
            🗑️ Tin nhắn đã xóa
          </Text>
        ) : (
          <Text
            style={{
              color: isUser ? 'white' : '#2c3e50',
              fontSize: 14,
              lineHeight: '1.5',
              fontWeight: 400,
              letterSpacing: '0.2px'
            }}
          >
            {message.text}
          </Text>
        )}
        {message.edited && !message.deleted && (
          <div className="flex items-center mt-1">
            <Text
              style={{
                fontSize: 10,
                color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                fontStyle: 'italic',
                fontWeight: 300,
                letterSpacing: '0.5px'
              }}
            >
              ✏️ đã chỉnh sửa
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

const MessageGroupComponent = ({
  group,
  showAvatar,
  onScrollToReply
}) => {
  const { editMessage,replyToMessage,deleteMessage } = useChat();
  const isUser = group.sender === 'user';

  const { themeConfig } = useFontConfig();
  const primaryColor = themeConfig.token.colorPrimary;

  const handleEdit = async (messageId,newText) => {
    try {
      await editMessage(messageId,newText);
    } catch (error) {
      console.error('Failed to edit message:',error);
    }
  };

  const handleDelete = async (messageId) => {
    if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
      try {
        await deleteMessage(messageId);
      } catch (error) {
        console.error('Failed to delete message:',error);
      }
    }
  };

  const handleReply = (message) => {
    replyToMessage(message);
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-1`}>
      <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Assistant messages with avatar */}
        {!isUser && (
          <div className="flex items-start space-x-2">
            {(showAvatar && !isUser) && (
              <Avatar
                style={{
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}aa 100%)`,
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '2px solid white'
                }}
                size={28}
              >
                <span style={{ fontWeight: 600,fontSize: '11px' }}>F</span>
              </Avatar>
            )}
            {(!showAvatar || isUser) && <div style={{ width: 28 }} />}

            <div className="flex-1">
              {/* Show user name and timestamp only for first message in group */}
              {(showAvatar && !isUser) && (
                <div className="flex items-center gap-2 mb-0.5">
                  <Text strong style={{ fontSize: 13 }}>FUTA Assistant</Text>
                  <Text type="secondary" style={{
                    fontSize: 10,
                    fontStyle: 'italic',
                    opacity: 0.7
                  }}>
                    {format(new Date(group.messages[group.messages.length - 1].timestamp),'HH:mm')}
                  </Text>
                </div>
              )}

              <Space direction="vertical" size={1}>
                {group.messages.map((message,index) => (
                  <EditableMessage
                    key={message.id}
                    message={message}
                    index={index}
                    totalMessages={group.messages.length}
                    isUser={false}
                    onEdit={handleEdit}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    primaryColor={primaryColor}
                    onScrollToReply={onScrollToReply}
                  />
                ))}
              </Space>
            </div>
          </div>
        )}

        {/* User messages */}
        {isUser && (
          <div className="flex items-start space-x-2 justify-end">
            <div className="flex-1 text-right">
              {/* Show user name and timestamp only for first message in group */}
              {(showAvatar && isUser) && (
                <div className="flex items-center justify-end gap-2 mb-0.5">
                  <Text type="secondary" style={{
                    fontSize: 10,
                    fontStyle: 'italic',
                    opacity: 0.7
                  }}>
                    {format(new Date(group.messages[group.messages.length - 1].timestamp),'HH:mm')}
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>User</Text>
                </div>
              )}

              <Space direction="vertical" size={1} align="end">
                {group.messages.map((message,index) => (
                  <EditableMessage
                    key={message.id}
                    message={message}
                    index={index}
                    totalMessages={group.messages.length}
                    isUser={true}
                    onEdit={handleEdit}
                    onReply={handleReply}
                    onDelete={handleDelete}
                    primaryColor={primaryColor}
                    onScrollToReply={onScrollToReply}
                  />
                ))}
              </Space>
            </div>

            {(showAvatar && isUser) && (
              <Avatar
                style={{
                  background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                  flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '2px solid white'
                }}
                size={28}
              >
                <span style={{ fontWeight: 600,fontSize: '11px' }}>U</span>
              </Avatar>
            )}
            {(!showAvatar || !isUser) && <div style={{ width: 28 }} />}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to get border radius for grouped messages
const getBorderRadius = (messageIndex,totalMessages,isUser) => {
  if (totalMessages === 1) return '12px';

  const isFirst = messageIndex === 0;
  const isLast = messageIndex === totalMessages - 1;

  if (isUser) {
    if (isFirst) return '12px 12px 4px 12px';
    if (isLast) return '12px 4px 12px 12px';
    return '12px 4px 4px 12px';
  } else {
    if (isFirst) return '12px 12px 12px 4px';
    if (isLast) return '4px 12px 12px 12px';
    return '4px 12px 12px 4px';
  }
};

export default MessageGroupComponent;
