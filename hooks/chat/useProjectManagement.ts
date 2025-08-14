"use client";

import { useState,useCallback } from 'react';

export const useProjectManagement = (chats,connectedSessions) => {
  const [selectedProject,setSelectedProject] = useState(null);
  const [projectStats,setProjectStats] = useState({});

  // Get all unique projects from chats
  const getProjects = useCallback(() => {
    const projects = new Map();

    chats.forEach(chat => {
      if (chat.projectKey && chat.isWebSocketChat) {
        const projectKey = chat.projectKey;
        const projectName = chat.projectName || projectKey;

        if (!projects.has(projectKey)) {
          projects.set(projectKey,{
            projectKey,
            projectName,
            totalSessions: 0,
            activeSessions: 0,
            unreadCount: 0,
            lastActivity: null
          });
        }

        const project = projects.get(projectKey);
        project.totalSessions += 1;
        project.unreadCount += (chat.unreadCount || 0);

        // Check if session is currently connected
        const sessionKey = `${projectKey}_${chat.sessionId}`;
        if (connectedSessions.has(sessionKey)) {
          project.activeSessions += 1;
        }

        // Update last activity
        if (!project.lastActivity || chat.lastActivity > project.lastActivity) {
          project.lastActivity = chat.lastActivity;
        }
      }
    });

    return Array.from(projects.values()).sort((a,b) => {
      if (!a.lastActivity) return 1;
      if (!b.lastActivity) return -1;
      return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
    });
  },[chats,connectedSessions]);

  // Get sessions for a specific project
  const getSessionsForProject = useCallback((projectKey) => {
    return chats
      .filter(chat => chat.projectKey === projectKey && chat.isWebSocketChat)
      .sort((a,b) => {
        const aTime = new Date(a.lastActivity).getTime();
        const bTime = new Date(b.lastActivity).getTime();
        return bTime - aTime;
      });
  },[chats]);

  // Select a project to view its sessions
  const selectProject = useCallback((projectKey) => {
    setSelectedProject(projectKey);
  },[]);

  // Get session status (connected/disconnected)
  const getSessionStatus = useCallback((projectKey,sessionId) => {
    const sessionKey = `${projectKey}_${sessionId}`;
    return connectedSessions.has(sessionKey) ? 'connected' : 'disconnected';
  },[connectedSessions]);

  return {
    selectedProject,
    projectStats,
    getProjects,
    getSessionsForProject,
    selectProject,
    getSessionStatus
  };
};
