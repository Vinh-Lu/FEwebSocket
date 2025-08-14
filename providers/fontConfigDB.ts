export const initFontConfigDB = async () => {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open('fontConfigDB',1);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      console.log('Font Config DB initialized successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target?.result;

      // Create configs object store if it doesn't exist
      if (!db.objectStoreNames.contains('configs')) {
        const configStore = db.createObjectStore('configs',{ keyPath: 'id' });

        // Add default primary color
        configStore.add({
          id: 'primary',
          value: '#1890ff',
          createdAt: new Date().toISOString()
        });

        console.log('Font Config DB schema created with default primary color');
      }
    };
  });
};
