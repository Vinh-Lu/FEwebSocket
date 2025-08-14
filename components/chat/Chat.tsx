"use client";

import React,{ useState } from 'react';
import { ConfigProvider,Layout } from 'antd';
import viVN from 'antd/locale/vi_VN';
import ChatNavSidebar from './ChatNavSidebar';
import ChatSidebar from './ChatSidebar';
import ChatMain from './ChatMain';
import { ChatProvider } from './ChatContext';

const { Sider,Content } = Layout;

const Chat = ({
  className = "",
  style = {},
  height = "100vh"
}) => {
  const [selectedChatId,setSelectedChatId] = useState(null);

  const [selectedInbox,setSelectedInbox] = useState(null);

  const handleSelectInbox = (inbox) => {
    console.log(inbox);

    setSelectedInbox(inbox);
    console.log('Selected inbox:',inbox);
  };

  return (
    <ConfigProvider locale={viVN}>
      <ChatProvider>
        <Layout
          className={`${className}`}
          style={{ height,...style }}
        >
          {/* Navigation Sidebar */}
          <Sider
            width={256}
            className="bg-white border-r border-gray-200"
            collapsed={false}
          >
            <ChatNavSidebar
              onSelectInbox={handleSelectInbox}
              selectedInbox={selectedInbox}
            />
          </Sider>

          {/* Chat List Sidebar */}
          <Sider
            width={320}
            className="bg-white border-r border-gray-200"
            collapsed={false}
          >
            <ChatSidebar
              selectedChatId={selectedChatId}
              onSelectChat={setSelectedChatId}
              selectedInbox={selectedInbox}
            />
          </Sider>

          {/* Main Chat Area */}
          <Layout>
            <Content className="flex flex-col h-full">
              <ChatMain
                selectedChatId={selectedChatId}
              />
            </Content>
          </Layout>
        </Layout>
      </ChatProvider>
    </ConfigProvider>
  );
};

export default Chat;
