export const groupMessagesBySender = (messages) => {
  if (messages.length === 0) return [];

  const groups = [];
  let currentGroup = [];
  let currentSender = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const prevMessage = messages[i - 1];

    // Convert timestamp to Date if it's a string
    const messageTime = new Date(message.timestamp);
    const prevMessageTime = prevMessage ? new Date(prevMessage.timestamp) : null;

    // Check if we should start a new group
    const shouldStartNewGroup =
      currentSender !== message.sender || // Different sender
      (prevMessageTime &&
        messageTime.getTime() - prevMessageTime.getTime() > 300000); // More than 5 minutes apart

    if (shouldStartNewGroup && currentGroup.length > 0) {
      // Finish the current group
      groups.push({
        id: `group-${currentGroup[0].id}`,
        sender: currentSender,
        messages: [...currentGroup],
        timestamp: new Date(currentGroup[0].timestamp),
        isFirstInGroup: true,
        isLastInGroup: true
      });
      currentGroup = [];
    }

    // Add message to current group
    currentGroup.push(message);
    currentSender = message.sender;
  }

  // Add the last group
  if (currentGroup.length > 0) {
    groups.push({
      id: `group-${currentGroup[0].id}`,
      sender: currentSender,
      messages: [...currentGroup],
      timestamp: new Date(currentGroup[0].timestamp),
      isFirstInGroup: true,
      isLastInGroup: true
    });
  }

  return groups;
};

export const shouldShowTimestamp = (currentGroup,prevGroup) => {
  if (!prevGroup) return true;

  // Check if the messages are from different days
  const currentDate = new Date(currentGroup.timestamp);
  const prevDate = new Date(prevGroup.timestamp);

  // Compare year, month, and date
  return (
    currentDate.getFullYear() !== prevDate.getFullYear() ||
    currentDate.getMonth() !== prevDate.getMonth() ||
    currentDate.getDate() !== prevDate.getDate()
  );
};

export const shouldShowAvatar = (group) => {
  return group.isFirstInGroup && group.sender === 'assistant';
};

export const getMessageGroupClassName = (group) => {
  const baseClass = group.sender === 'user' ? 'justify-end' : 'justify-start';
  return `flex ${baseClass}`;
};

export const getMessageBubbleClassName = (message,messageIndex,totalMessages) => {
  return `p-2 inline-block max-w-full break-words`;
};
