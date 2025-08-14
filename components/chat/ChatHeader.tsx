"use client";
import React from 'react';
import { Button,Badge,Avatar,Typography,Space,Dropdown } from 'antd';
import {
  MoreVertical,
  Phone,
  Video,
  User,
  Search,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useFontConfig } from '../../hooks/use-font-config';
import { useChat } from './ChatContext';

const { Text,Title } = Typography;

interface ChatHeaderProps {
  chat: Chat;
  users?: any[];
}

const ChatHeader = ({ chat,users = [] }) => {
  const { setCurrentChat } = useChat();
  const { themeConfig } = useFontConfig();
  const primaryColor = themeConfig.token.colorPrimary;

  const handleBack = () => {
    setCurrentChat(null);
  };

  return (
    <div className="border-b border-gray-200 bg-gradient-to-br from-white to-slate-50 shadow-sm px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            type="text"
            icon={<ArrowLeft size={18} />}
            onClick={handleBack}
            className="md:hidden hover:bg-gray-100 transition-all duration-200 rounded-lg"
          />
          <Avatar
            size={36}
            style={{
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
              boxShadow: `0 4px 12px ${primaryColor}33`,
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '0.5px'
            }}
          >
            {chat.title ? chat.title.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <div>
            <Title
              level={5}
              className="m-0 text-gray-800 font-semibold tracking-wide"
            >
              {chat.title}
            </Title>
            <Text className="text-xs text-gray-500 font-normal">
              Đang hoạt động
            </Text>
          </div>
        </div>

        <Space>
          <Button
            type="text"
            icon={<Phone size={18} />}
            className="hover:bg-gray-100 transition-all duration-200 rounded-lg"
          />
          <Button
            type="text"
            icon={<Video size={18} />}
            className="hover:bg-gray-100 transition-all duration-200 rounded-lg"
          />
          <Dropdown
            menu={{
              items: [
                { key: 'info',label: 'Thông tin',icon: <User size={16} /> },
                { key: 'search',label: 'Tìm kiếm',icon: <Search size={16} /> },
                { key: 'settings',label: 'Cài đặt',icon: <Settings size={16} /> }
              ]
            }}
            trigger={['click']}
          >
            <Button
              type="text"
              icon={<MoreVertical size={18} />}
              className="hover:bg-gray-100 transition-all duration-200 rounded-lg"
            />
          </Dropdown>
        </Space>
      </div>
    </div>
  );
};

export default ChatHeader;
