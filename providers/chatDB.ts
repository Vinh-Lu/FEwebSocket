import { openDB } from 'idb';

const DB_NAME = 'FutaChatDB';
const DB_VERSION = 4; // bump to ensure stores exist
const CHAT_STORE = 'chats';
const MESSAGE_STORE = 'messages';
const ADMIN_MESSAGE_STORE = 'admin_messages';

export async function initChatDB() {
  return openDB(DB_NAME,DB_VERSION,{
    upgrade(db,oldVersion) {
      console.log('Upgrading ChatDB from version',oldVersion,'to',DB_VERSION);

      // Create chats store
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        const chatStore = db.createObjectStore(CHAT_STORE,{ keyPath: 'id' });
        chatStore.createIndex('lastActivity','lastActivity',{ unique: false });
        console.log('Created chats store');
      }

      // Create messages store
      if (!db.objectStoreNames.contains(MESSAGE_STORE)) {
        const messageStore = db.createObjectStore(MESSAGE_STORE,{ keyPath: 'id' });
        messageStore.createIndex('chatId','chatId',{ unique: false });
        messageStore.createIndex('timestamp','timestamp',{ unique: false });
        messageStore.createIndex('chatId_timestamp',['chatId','timestamp'],{ unique: false });
        console.log('Created messages store');
      }

      // Create admin messages store for WebSocket messages
      if (!db.objectStoreNames.contains(ADMIN_MESSAGE_STORE)) {
        const adminMessageStore = db.createObjectStore(ADMIN_MESSAGE_STORE,{ keyPath: 'id' });
        adminMessageStore.createIndex('projectKey','projectKey',{ unique: false });
        adminMessageStore.createIndex('sessionId','sessionId',{ unique: false });
        adminMessageStore.createIndex('timestamp','timestamp',{ unique: false });
        adminMessageStore.createIndex('receivedAt','receivedAt',{ unique: false });
        adminMessageStore.createIndex('type','type',{ unique: false });
        adminMessageStore.createIndex('read','read',{ unique: false });
        adminMessageStore.createIndex('projectKey_sessionId',['projectKey','sessionId'],{ unique: false });
        adminMessageStore.createIndex('projectKey_timestamp',['projectKey','timestamp'],{ unique: false });
        console.log('Created admin_messages store');
      }
    },
  });
}

export { DB_NAME,CHAT_STORE,MESSAGE_STORE,ADMIN_MESSAGE_STORE };
