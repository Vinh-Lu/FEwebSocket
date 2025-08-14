"use client";

import React,{ useState } from 'react';
import { Button,Card,Switch,Input,Typography,Space,Divider,Upload } from 'antd';
import { useChat } from './ChatContext';
import {
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  DeleteOutlined,
  ExportOutlined,
  ImportOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title,Text } = Typography;

const ChatSettings = ({ onClose }) => {
  const { chats,messages } = useChat();
  const [settings,setSettings] = useState({
    notifications: true,
    soundEnabled: true,
    darkMode: false,
    autoSave: true,
    enterToSend: true
  });

  const handleSettingChange = (key,value) => {
    setSettings(prev => ({ ...prev,[key]: value }));
    // Save to localStorage
    localStorage.setItem('chat-settings',JSON.stringify({ ...settings,[key]: value }));
  };

  const exportChatData = () => {
    const data = {
      chats,
      messages,
      settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data,null,2)],{ type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `futa-chat-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importChatData = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.chats && data.messages) {
            localStorage.setItem('futa-chats',JSON.stringify(data.chats));
            localStorage.setItem('futa-messages',JSON.stringify(data.messages));
            if (data.settings) {
              localStorage.setItem('chat-settings',JSON.stringify(data.settings));
              setSettings(data.settings);
            }
            alert('Dữ liệu đã được nhập thành công! Vui lòng làm mới trang.');
          }
        } catch (error) {
          alert('Lỗi khi nhập dữ liệu. Vui lòng kiểm tra file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tất cả dữ liệu chat? Hành động này không thể hoàn tác.')) {
      localStorage.removeItem('futa-chats');
      localStorage.removeItem('futa-messages');
      localStorage.removeItem('chat-settings');
      alert('Dữ liệu đã được xóa. Vui lòng làm mới trang.');
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} className="m-0 flex items-center">
          <SettingOutlined className="mr-2" />
          Cài đặt Chat
        </Title>
        {onClose && (
          <Button type="text" size="small" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Notification Settings */}
      <Card title={
        <span className="flex items-center">
          <BellOutlined className="mr-2" />
          Thông báo
        </span>
      } size="small">
        <Space direction="vertical" className="w-full">
          <div className="flex items-center justify-between">
            <Text>Bật thông báo</Text>
            <Switch
              checked={settings.notifications}
              onChange={(checked) => handleSettingChange('notifications',checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Text>Âm thanh thông báo</Text>
            <Switch
              checked={settings.soundEnabled}
              onChange={(checked) => handleSettingChange('soundEnabled',checked)}
            />
          </div>
        </Space>
      </Card>

      {/* Appearance Settings */}
      <Card title={
        <span className="flex items-center">
          <SunOutlined className="mr-2" />
          Giao diện
        </span>
      } size="small">
        <div className="flex items-center justify-between">
          <Text>Chế độ tối</Text>
          <Switch
            checked={settings.darkMode}
            onChange={(checked) => handleSettingChange('darkMode',checked)}
          />
        </div>
      </Card>

      {/* Chat Behavior Settings */}
      <Card title="Hành vi Chat" size="small">
        <Space direction="vertical" className="w-full">
          <div className="flex items-center justify-between">
            <Text>Tự động lưu</Text>
            <Switch
              checked={settings.autoSave}
              onChange={(checked) => handleSettingChange('autoSave',checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Text>Enter để gửi</Text>
            <Switch
              checked={settings.enterToSend}
              onChange={(checked) => handleSettingChange('enterToSend',checked)}
            />
          </div>
        </Space>
      </Card>

      <Divider />

      {/* Data Management */}
      <Card title="Quản lý dữ liệu" size="small">
        <Space direction="vertical" className="w-full">
          <Button
            block
            icon={<ExportOutlined />}
            onClick={exportChatData}
          >
            Xuất dữ liệu chat
          </Button>

          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={(file) => {
              const event = { target: { files: [file] } };
              importChatData(event);
              return false;
            }}
          >
            <Button block icon={<ImportOutlined />}>
              Nhập dữ liệu chat
            </Button>
          </Upload>

          <Button
            block
            danger
            icon={<DeleteOutlined />}
            onClick={clearAllData}
          >
            Xóa tất cả dữ liệu
          </Button>
        </Space>
      </Card>

      {/* Statistics */}
      <Card title="Thống kê" size="small">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <Text type="secondary" className="block text-sm">Số cuộc trò chuyện</Text>
            <Title level={4} className="m-0">{chats.length}</Title>
          </div>
          <div className="text-center">
            <Text type="secondary" className="block text-sm">Tổng tin nhắn</Text>
            <Title level={4} className="m-0">{messages.length}</Title>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChatSettings;
