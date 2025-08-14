"use client";

import { ProjectChatWidget } from "@/packages/chat-widget/src";

function AdminLayout() {

  // Demo project config cho chat widget
  const demoProjectConfig = {
    projectKey: 'futa-test',
    projectName: 'Admin Demo Chat',
    projectColor: '#1890ff',
    customGreeting: 'Chào admin! Đây là demo chat widget'
  };


  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      <ProjectChatWidget projectConfig={demoProjectConfig} />
    </div>

  );
}

export default AdminLayout;
