"use client";

import React,{ useState } from 'react';
import { Button,Input,Badge,Space,Typography } from 'antd';
import { useChat } from './ChatContext';
import { useFontConfig } from '../../hooks/use-font-config';
import {
  Plus,
  Search,
  Trash2,
  MessageCircle,
  MoreHorizontal,
  Users,
  Settings,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Title,Text } = Typography;

const ChatSidebar = ({ selectedChatId,onSelectChat,selectedInbox }) => {
  const {
    chats,
    addChat,
    deleteChat,
    wsConnected,
    activeProductKeys
  } = useChat();
  const { themeConfig } = useFontConfig();
  const primaryColor = themeConfig.token.colorPrimary;
  const [searchTerm,setSearchTerm] = useState('');
  const [newChatTitle,setNewChatTitle] = useState('');
  const [showNewChatInput,setShowNewChatInput] = useState(false);
  const [viewMode,setViewMode] = useState('all'); // 'all', 'projects', 'project-sessions'

  // Filter chats based on selected inbox
  const getFilteredChats = () => {
    let baseChats = chats.filter(chat =>
      chat.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If no inbox selected, show all chats
    if (!selectedInbox) return baseChats;

    // Filter based on inbox type
    switch (selectedInbox.section) {
      case 'projects':
        // Filter by specific project
        return baseChats.filter(chat => chat.projectKey === selectedInbox.projectKey);
      case 'my-inbox':
        // Filter based on inbox status
        return baseChats.filter(chat => {
          switch (selectedInbox.key) {
            case 'open':
              return chat.status === 'open';
            case 'pending':
              return chat.status === 'pending';
            case 'unassigned':
              return chat.status === 'unassigned';
            case 'processing':
              return chat.status === 'processing';
            default:
              return true;
          }
        });
      case 'team-inbox':
        // Filter team-related chats
        return baseChats.filter(chat => chat.isTeamChat);
      case 'bots':
        // Filter bot conversations
        return baseChats.filter(chat => chat.isBot);
      default:
        // If no specific section, but we have active product keys, limit to those
        if (Array.isArray(activeProductKeys) && activeProductKeys.length > 0) {
          return baseChats.filter(chat => !chat.projectKey || activeProductKeys.includes(chat.projectKey));
        }
        return baseChats;
    }
  };

  const filteredChats = getFilteredChats();

  const getHeaderTitle = () => {
    if (!selectedInbox) return 'Tin nhắn';

    if (selectedInbox.section === 'projects') {
      return `📋 ${selectedInbox.label}`;
    }

    return `${selectedInbox.label} (${selectedInbox.section})`;
  };

  const handleCreateChat = async () => {
    if (newChatTitle.trim()) {
      try {
        const chatId = await addChat(newChatTitle.trim());
        onSelectChat(chatId);
        setNewChatTitle('');
        setShowNewChatInput(false);
      } catch (error) {
        console.error('Error creating chat:',error);
      }
    }
  };

  const handleDeleteChat = async (chatId,e) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
      try {
        await deleteChat(chatId);
        if (selectedChatId === chatId) {
          onSelectChat(chats.length > 1 ? chats[0].id : '');
        }
      } catch (error) {
        console.error('Error deleting chat:',error);
      }
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-white to-slate-50 border-r border-gray-200">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4 px-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-gray-800 font-bold tracking-wide"
            >
              {getHeaderTitle()}
            </span>
            {/* WebSocket Status Indicator */}
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}
                title={wsConnected ? 'WebSocket đã kết nối' : 'WebSocket chưa kết nối'}
              />
              <Text type="secondary" className="text-xs">
                {wsConnected ? 'Live' : 'Offline'}
              </Text>
            </div>
          </div>
          <Button
            type="primary"
            shape="circle"
            size="small"
            icon={<Plus size={16} />}
            onClick={() => setShowNewChatInput(!showNewChatInput)}
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              border: 'none',
              boxShadow: `0 4px 12px ${primaryColor}33`
            }}
            className="hover:scale-110 transition-all duration-200"
          />
        </div>

        {/* New Chat Input */}
        {showNewChatInput && (
          <Space.Compact direction="vertical" className="w-full mb-3">
            <Input
              placeholder="Tên cuộc trò chuyện..."
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onPressEnter={handleCreateChat}
              autoFocus
            />
            <Space>
              <Button type="primary" size="small" onClick={handleCreateChat}>
                Tạo
              </Button>
              <Button
                size="small"
                onClick={() => {
                  setShowNewChatInput(false);
                  setNewChatTitle('');
                }}
              >
                Hủy
              </Button>
            </Space>
          </Space.Compact>
        )}

        {/* Search */}
        <Input
          placeholder="Tìm kiếm cuộc trò chuyện..."
          prefix={<Search size={16} />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-3"
        />

        {/* View Mode Controls */}
        {/* <div className="mb-3">
          <Space wrap className="w-full">
            <Button
              size="small"
              type={viewMode === 'all' ? 'primary' : 'default'}
              onClick={() => {
                setViewMode('all');
                selectProject(null);
              }}
            >
              Tất cả
            </Button>
            <Button
              size="small"
              type={viewMode === 'projects' ? 'primary' : 'default'}
              onClick={() => setViewMode('projects')}
            >
              Projects
            </Button>
            {selectedProject && (
              <Button
                size="small"
                type={viewMode === 'project-sessions' ? 'primary' : 'default'}
                onClick={() => setViewMode('project-sessions')}
              >
                {selectedProject}
              </Button>
            )}
          </Space>
        </div> */}
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={48} className="mb-2" />
            <Text type="secondary">Chưa có cuộc trò chuyện nào</Text>
          </div>
        ) : (
          <Space direction="vertical" size={4} className="w-full">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${selectedChatId === chat.id
                  ? 'border-blue-400 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Text strong className="block truncate">
                        {chat.title}
                      </Text>
                      {/* WebSocket per-chat status removed in single-connection mode */}
                    </div>
                    {chat.projectName && (
                      <Text type="secondary" className="block text-xs truncate">
                        📋 {chat.projectName}
                      </Text>
                    )}
                    {chat.lastMessage && (
                      <Text type="secondary" className="block text-xs mt-1 truncate">
                        {chat.lastMessage.sender === 'user' ? '👤 User: ' : '🔧 Admin: '}
                        {chat.lastMessage.text}
                      </Text>
                    )}
                    <Text type="secondary" className="block text-xs mt-1">
                      {formatDistanceToNow(new Date(chat.lastActivity),{
                        addSuffix: true,
                        locale: vi
                      })}
                    </Text>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {chat.unreadCount > 0 && (
                      <Badge count={chat.unreadCount} size="small" />
                    )}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<Trash2 size={12} />}
                      onClick={(e) => handleDeleteChat(chat.id,e)}
                      className="opacity-50 hover:opacity-100 transition-opacity duration-200"
                    />
                  </div>
                </div>
              </div>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
