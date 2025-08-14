"use client";

import React,{ useEffect,useRef,useState,useCallback } from 'react';
import { Typography,Tag,Space } from 'antd';
import { useChat } from './ChatContext';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { groupMessagesBySender,shouldShowTimestamp } from '@/utils/messageGrouping';
import MessageGroupComponent from './MessageGroup';

const { Text } = Typography;


const ChatMessages = ({ chatId }) => {
  const { getMessagesForChat,markAsRead,loadInitialMessages,loadMoreMessages,isLoadingMessages,hasMoreMessages } = useChat();
  const messagesEndRef = useRef(null);
  const messagesStartRef = useRef(null);
  const [isLoadingMore,setIsLoadingMore] = useState(false);

  const messages = getMessagesForChat(chatId);

  // Group messages by sender
  const messageGroups = groupMessagesBySender(messages);

  // Function to scroll to a specific message
  const scrollToMessage = useCallback((messageText) => {
    // Find the message element by text content
    const messageElements = document.querySelectorAll('[data-message-text]');
    for (const element of messageElements) {
      if (element.getAttribute('data-message-text') === messageText) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // Add highlight effect with box-shadow instead of changing background
        const originalBoxShadow = element.style.boxShadow;
        element.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.5), 0 0 20px rgba(255, 193, 7, 0.3)';
        element.style.transition = 'box-shadow 0.3s ease';

        setTimeout(() => {
          element.style.boxShadow = originalBoxShadow;
          element.style.transition = '';
        },2000);
        break;
      }
    }
  },[]);

  // Load initial messages when chat changes
  useEffect(() => {
    if (chatId) {
      loadInitialMessages(chatId);
    }
  },[chatId]); // Remove loadInitialMessages from dependencies to avoid loop

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  },[messages]);

  // Mark as read when chat is viewed
  useEffect(() => {
    markAsRead(chatId);
  },[chatId]); // Removed markAsRead from dependencies

  // Load more messages when scrolling to top
  const handleScroll = useCallback(async (e) => {
    const { scrollTop } = e.target;

    if (scrollTop <= 100 && hasMoreMessages[chatId] && !isLoadingMessages && !isLoadingMore) {
      setIsLoadingMore(true);
      const prevScrollHeight = e.target.scrollHeight;

      await loadMoreMessages(chatId);

      // Maintain scroll position after loading more messages
      setTimeout(() => {
        const newScrollHeight = e.target.scrollHeight;
        e.target.scrollTop = newScrollHeight - prevScrollHeight;
        setIsLoadingMore(false);
      },100);
    }
  },[chatId,hasMoreMessages,isLoadingMessages,isLoadingMore,loadMoreMessages]);

  if (messages.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Space direction="vertical" align="center">
          <Text style={{ fontSize: 24 }}>👋</Text>
          <Text type="secondary">Bắt đầu cuộc trò chuyện bằng cách gửi tin nhắn đầu tiên!</Text>
        </Space>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto p-2"
      onScroll={handleScroll}
    >
      {/* Loading indicator for older messages */}
      {hasMoreMessages[chatId] && (
        <div className="flex justify-center py-1">
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isLoadingMore ? 'Đang tải thêm tin nhắn...' : 'Cuộn lên để xem tin nhắn cũ hơn'}
          </Text>
        </div>
      )}

      <div ref={messagesStartRef} />

      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {messageGroups.map((group,index) => {
          const prevGroup = messageGroups[index - 1];
          const showTimestamp = shouldShowTimestamp(group,prevGroup);

          return (
            <div key={group.id}>
              {/* Date Separator */}
              {showTimestamp && (
                <div className="flex justify-center my-4">
                  <Tag
                    color="default"
                    className="px-3 py-1 rounded-full border-0 bg-gray-100"
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6b7280'
                    }}
                  >
                    {format(group.timestamp,'EEEE, dd/MM/yyyy',{ locale: vi })}
                  </Tag>
                </div>
              )}

              {/* Message Group */}
              <MessageGroupComponent
                group={group}
                showAvatar={group.isFirstInGroup}
                onScrollToReply={scrollToMessage}
              />
            </div>
          );
        })}
      </Space>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
