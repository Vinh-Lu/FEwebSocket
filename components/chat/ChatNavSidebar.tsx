"use client";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  MessageOutlined,
  MoreOutlined,
  ProjectOutlined,
  RobotOutlined,
  TeamOutlined,
  WifiOutlined,
  SearchOutlined,
  FilterOutlined,
  SettingOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Collapse,
  Typography,
  Input,
  Button,
  Dropdown,
  Switch,
  Space,
  Tooltip
} from 'antd';
import { List } from 'lucide-react';
import { useEffect,useState } from 'react';
import { useChat } from './ChatContext';
import { DEFAULT_PRODUCT_KEY,DEFAULT_PRODUCT_LABEL } from '@/utils/const';

const { Text,Title } = Typography;
const { Panel } = Collapse;

const ChatNavSidebar = ({ onSelectInbox,selectedInbox }) => {
  const [activeKey,setActiveKey] = useState(['1','2','3','4']); // All panels open by default
  const [projectStats,setProjectStats] = useState({});
  const [newKey,setNewKey] = useState('');
  const [newLabel,setNewLabel] = useState('');

  // Get data from ChatContext (single WS model)
  const chatCtx = useChat();
  const { wsConnected,chats } = chatCtx;

  // Aggregate unread per project
  const projectUnreadMap = new Map < string,number> ();
  (Array.isArray(chats) ? chats : []).forEach((c: any) => {
    const key = c.projectKey || 'unknown';
    const prev = projectUnreadMap.get(key) || 0;
    const add = typeof c.unreadCount === 'number' ? c.unreadCount : 0;
    projectUnreadMap.set(key,prev + add);
  });

  const baseProjects = [
    {
      key: 'admin-dashboard',
      name: 'Admin Dashboard',
      isConnected: true,
      menus: [
        { key: 'admin-dashboard',label: 'Danh sách',icon: <List className="text-orange-500" />,color: 'orange',count: 0 },
      ]
    },
    {
      key: DEFAULT_PRODUCT_KEY,
      name: DEFAULT_PRODUCT_LABEL,
      isConnected: true,
      menus: [
        { key: DEFAULT_PRODUCT_KEY,label: 'Danh sách',icon: <List className="text-orange-500" />,color: 'orange',count: projectUnreadMap.get(DEFAULT_PRODUCT_KEY) || 0 },
      ]
    }
  ];

  const mappedProjects = chatCtx.productKeys.map((k: any) => ({
    key: k.key,
    name: k.label || k.key,
    isConnected: true,
    unread: projectUnreadMap.get(k.key) || 0,
    menus: [
      { key: k.key,label: 'Danh sách',icon: <List className="text-orange-500" />,color: 'orange',count: projectUnreadMap.get(k.key) || 0 },
    ]
  }));

  // Deduplicate by key (prefer mapped info over base if duplicated)
  const projectsMap = new Map < string,any> ();
  [...baseProjects,...mappedProjects].forEach(p => {
    projectsMap.set(p.key,p);
  });
  const projects = Array.from(projectsMap.values()).map((p: any) => ({
    ...p,
    unread: p.unread ?? (projectUnreadMap.get(p.key) || 0)
  }));

  // Header uses wsConnected from context

  const handleQuickAddProductKey = async () => {
    const key = (newKey || '').trim();
    const label = (newLabel || '').trim();
    if (!key) return;
    try {
      await chatCtx.addOrUpdateKey?.({ key,label: label || key,active: true });
      setNewKey('');
      setNewLabel('');
    } catch (e) {
      // noop
    }
  };

  const handleItemClick = (item,projectKey,section) => {
    // Khi click menu, truyền đúng projectKey và section 'projects' để filter
    onSelectInbox?.({
      ...item,
      projectKey,
      section: 'projects',
      key: projectKey // key để ChatSidebar filter chính xác
    });
  };

  const renderProjectAvatar = (project) => (
    <div>
      <Avatar
        size={20}
        style={{
          backgroundColor: '#1890ff',
          fontSize: '12px'
        }}
      >
        {project.name.charAt(0).toUpperCase()}
      </Avatar>
    </div>
  );

  const renderMenuItem = (item,projectKey,section) => (
    <div
      key={item.key}
      className={`flex items-center justify-between p-2 mx-2 rounded cursor-pointer transition-all duration-200 hover:bg-gray-100 ${selectedInbox?.key === item.key ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        }`}
      onClick={() => handleItemClick(item,projectKey,section)}
    >
      <div className="flex items-center space-x-2 flex-1">
        {item.icon}
        <Text className="text-sm">{item.label}</Text>
      </div>
      <div className="flex items-center gap-1">
        {item.count > 0 && (
          <Badge
            count={item.count}
            size="small"
            style={{
              backgroundColor:
                item.color === 'red' ? '#ff4d4f' :
                  item.color === 'orange' ? '#fa8c16' :
                    item.color === 'blue' ? '#1890ff' :
                      item.color === 'green' ? '#52c41a' :
                        item.color === 'purple' ? '#722ed1' : '#d9d9d9'
            }}
          />
        )}
      </div>
    </div>
  );

  const renderProjectPanel = (project) => (
    <Panel
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {renderProjectAvatar(project)}
            <div className="flex flex-col">
              <Text strong className="text-sm">{project.name}</Text>
              {/* <Text className="text-xs text-gray-500">
                {project.chats} chats • {project.isConnected ? 'Live' : 'Offline'}
              </Text> */}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {project.unread > 0 && (
              <Badge count={project.unread} size="small" />
            )}
          </div>
        </div>
      }
      key={`project-${project.key}`}
      className="border-0"
    >
      <div className="space-y-1 pb-2">
        {project.menus.map(menu => renderMenuItem(menu,project.key,'project'))}
      </div>
    </Panel>
  );

  // Additional menu sections (bots, team inbox, etc.)
  const botItems = [
    {
      key: 'futa-assistant',
      icon: <Avatar size={20} style={{ backgroundColor: '#1890ff' }}>F</Avatar>,
      label: 'FUTA Assistant',
      count: 0,
      isBot: true
    }
  ];

  // Auto-select first key on mount or when projects list changes
  useEffect(() => {
    if (!selectedInbox && Array.isArray(chatCtx.productKeys) && chatCtx.productKeys.length > 0) {
      const firstKey = chatCtx.productKeys[0].key;
      const proj = projects.find((p: any) => p.key === firstKey);
      if (proj && proj.menus && proj.menus[0]) {
        handleItemClick(proj.menus[0],proj.key,'project');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[projects.length,chatCtx.productKeys?.length]);

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          {/* <Title level={5} className="m-0 text-gray-700">=
            futa-staging
          </Title> */}
          {/* <div className="flex items-center gap-1">
            <WifiOutlined style={{ color: wsConnected ? '#52c41a' : '#ff4d4f' }} />
            <Text style={{ fontSize: '10px',color: wsConnected ? '#52c41a' : '#ff4d4f' }}>
              {wsConnected ? 'Live' : 'Offline'}
            </Text>
          </div> */}
        </div>

        {/* Project Summary */}
        <div style={{
          backgroundColor: '#f0f8ff',
          border: '1px solid #1890ff',
          borderRadius: '4px',
          padding: '8px',
          marginTop: '8px'
        }}>
          <div style={{ display: 'flex',alignItems: 'center',gap: '6px' }}>
            <ProjectOutlined style={{ color: '#1890ff',fontSize: '12px' }} />
            <Text style={{ fontSize: '11px',color: '#1890ff',fontWeight: 'bold' }}>
              Quản lý module chat
            </Text>
          </div>
          {/* <Text style={{ fontSize: '10px',color: '#666' }}>
            {projects.length} Projects Configured
          </Text> */}
        </div>
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto">
        <Collapse
          activeKey={activeKey}
          onChange={setActiveKey}
          ghost
          expandIconPosition="right"
          className="border-0"
        >
          {/* PROJECTS */}
          {projects.map(project => renderProjectPanel(project))}

          {/* QUICK ADD PRODUCT KEY */}
          {/* <Panel
            header={
              <div className="flex items-center space-x-2">
                <FilterOutlined className="text-blue-600" />
                <Text strong className="text-blue-600 text-sm uppercase tracking-wide">
                  Add Product Key
                </Text>
              </div>
            }
            key="add-product-key"
            className="border-0"
          >
            <div className="px-2 pb-2 space-y-2">
              <Input
                size="small"
                placeholder="product_key (ví dụ: futa-test)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
              <Input
                size="small"
                placeholder="Label (tùy chọn)"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />
              <div className="flex gap-2">
                <Button size="small" type="primary" onClick={handleQuickAddProductKey}>
                  Thêm
                </Button>
                <Button size="small" onClick={() => { setNewKey(''); setNewLabel(''); }}>
                  Xóa nhập
                </Button>
              </div>
            </div>
          </Panel> */}

          {/* BOTS */}
          {/* <Panel
            header={
              <div className="flex items-center space-x-2">
                <RobotOutlined className="text-green-600" />
                <Text strong className="text-green-600 text-sm uppercase tracking-wide">
                  BOTS
                </Text>
              </div>
            }
            key="bots"
            className="border-0"
          >
            <div className="space-y-1 pb-2">
              {botItems.map(item => renderMenuItem(item,null,'bots'))}
            </div>
          </Panel> */}
        </Collapse>
      </div>
    </div>
  );
};

export default ChatNavSidebar;
