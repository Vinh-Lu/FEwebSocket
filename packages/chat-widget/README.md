# @futa/chat-widget

A flexible, project-based chat widget for external websites with real-time WebSocket messaging and analytics.

## Features

- 🎯 **Project-based Grouping**: Organize chats by project with unique identification
- 💬 **Real-time WebSocket Messaging**: Live messaging with free WebSocket endpoints
- 🔗 **Auto Fallback**: Automatically falls back to simulation mode if WebSocket unavailable
- ⌨️ **Typing Indicators**: Real-time typing status with animated indicators
- 📊 **Analytics & Reporting**: Track sessions, messages, and user engagement
- 🎨 **Customizable Branding**: Project-specific colors and greetings
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔧 **Easy Integration**: Simple NPM package installation

## Installation

```bash
npm install @futa/chat-widget
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom antd dayjs
```

## Quick Start

### Basic Usage

```jsx
import { ProjectChatWidget } from '@futa/chat-widget'

function App() {
  return (
    <ProjectChatWidget
      projectKey='my-website'
      projectName='My Website'
      projectColor='#1890ff'
      customGreeting='Xin chào! Tôi có thể giúp gì cho bạn?'
    />
  )
}
```

### With Custom Styling

```jsx
import { ProjectChatWidget } from '@futa/chat-widget'

function App() {
  return (
    <ProjectChatWidget
      projectKey='ecommerce-site'
      projectName='E-commerce Platform'
      projectColor='#52c41a'
      customGreeting='Chào mừng bạn đến với cửa hàng của chúng tôi!'
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 1000,
      }}
    />
  )
}
```

## WebSocket Configuration

### Using Custom WebSocket Endpoint

```jsx
import { ProjectChatWidget, createChatWebSocket } from '@futa/chat-widget'

// For admin/server-side WebSocket handling
const wsService = createChatWebSocket({
  url: 'wss://your-websocket-server.com',
  projectKey: 'my-project',
  sessionId: 'session-123',
  onMessage: (message) => {
    console.log('Received:', message)
  },
  onConnect: () => {
    console.log('WebSocket connected')
  },
  onDisconnect: () => {
    console.log('WebSocket disconnected')
  },
})

// Connect to WebSocket
await wsService.connect()

// Send admin message
wsService.sendAdminMessage('Hello from admin!')
```

### Free WebSocket Endpoints

The widget includes several free WebSocket endpoints for testing:

```jsx
import { FREE_WEBSOCKET_ENDPOINTS } from '@futa/chat-widget'

// Available endpoints:
// - FREE_WEBSOCKET_ENDPOINTS.ECHO_WEBSOCKET (Recommended)
// - FREE_WEBSOCKET_ENDPOINTS.WEBSOCKET_KING
```

### Auto Fallback Mode

If WebSocket connection fails, the widget automatically falls back to simulation mode:

- ✅ Chat interface remains functional
- ✅ Simulated admin responses continue working
- ✅ All analytics and logging still work
- ⚠️ Real-time features disabled until connection restored

| Prop             | Type          | Required | Default                                       | Description                                |
| ---------------- | ------------- | -------- | --------------------------------------------- | ------------------------------------------ |
| `projectKey`     | string        | ✅       | -                                             | Unique identifier for your project         |
| `projectName`    | string        | ✅       | -                                             | Display name for your project              |
| `projectColor`   | string        | ❌       | "#1890ff"                                     | Primary color for the widget               |
| `customGreeting` | string        | ❌       | "Xin chào! Chúng tôi có thể giúp gì cho bạn?" | Initial greeting message                   |
| `style`          | CSSProperties | ❌       | -                                             | Custom CSS styles for the widget container |
| `className`      | string        | ❌       | -                                             | Custom CSS class name                      |

## Analytics & Reporting

### Using the Reporting Component

```jsx
import { ChatReporting } from '@futa/chat-widget'

function AdminDashboard() {
  return (
    <div>
      <h1>Chat Analytics</h1>
      <ChatReporting />
    </div>
  )
}
```

### Using the Hook for Custom Analytics

```jsx
import { useChatWidget } from '@futa/chat-widget'

function CustomAnalytics() {
  const { logs, exportLogs, clearLogs } = useChatWidget()

  return (
    <div>
      <p>Total messages: {logs.length}</p>
      <button onClick={exportLogs}>Export Data</button>
      <button onClick={clearLogs}>Clear Logs</button>
    </div>
  )
}
```

## Data Tracking

The widget automatically tracks:

- **Session Information**: Unique session IDs, timestamps
- **Project Details**: Project key, name, and configuration
- **Message Data**: User and admin messages with timestamps
- **User Context**: Page URL, user agent, referrer
- **Engagement Metrics**: Session duration, message counts

Data is stored in `localStorage` and can be exported as CSV for analysis.

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Integration Examples

### React Application

```jsx
import React from 'react'
import { ProjectChatWidget } from '@futa/chat-widget'

function App() {
  return (
    <div className='app'>
      {/* Your app content */}
      <main>
        <h1>Welcome to My Website</h1>
        <p>Some content here...</p>
      </main>

      {/* Chat Widget */}
      <ProjectChatWidget
        projectKey='my-react-app'
        projectName='My React Application'
        projectColor='#722ed1'
      />
    </div>
  )
}

export default App
```

### Next.js Application

```jsx
// pages/_app.js or app/layout.jsx
import { ProjectChatWidget } from '@futa/chat-widget'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ProjectChatWidget
          projectKey='nextjs-site'
          projectName='Next.js Website'
          projectColor='#000000'
        />
      </body>
    </html>
  )
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
  <head>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/antd@5/dist/antd.min.js"></script>
    <script src="https://unpkg.com/@futa/chat-widget/dist/index.umd.js"></script>
  </head>
  <body>
    <div id="chat-widget"></div>

    <script>
      const { ProjectChatWidget } = FutaChatWidget

      ReactDOM.render(
        React.createElement(ProjectChatWidget, {
          projectKey: 'vanilla-site',
          projectName: 'Vanilla JS Site',
          projectColor: '#fa541c',
        }),
        document.getElementById('chat-widget')
      )
    </script>
  </body>
</html>
```

## Development

### Building the Package

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Build in watch mode
npm run build:watch
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Reference

### ProjectChatWidget Component

The main chat widget component that provides a floating chat interface.

**Props:**

- `projectKey: string` - Unique project identifier
- `projectName: string` - Project display name
- `projectColor?: string` - Widget theme color
- `customGreeting?: string` - Initial admin message
- `style?: CSSProperties` - Custom styles
- `className?: string` - Custom CSS class

### ChatReporting Component

Analytics dashboard component for viewing chat statistics and exporting data.

**Features:**

- Session overview table
- Message statistics
- Project filtering
- Date range filtering
- CSV export functionality

### useChatWidget Hook

Custom hook for managing chat state and analytics.

**Returns:**

```typescript
{
  logs: ChatLog[],
  exportLogs: () => void,
  clearLogs: () => void,
  getSessionStats: (sessionId: string) => SessionStats,
  getProjectStats: (projectKey: string) => ProjectStats
}
```

## Support

For issues, feature requests, or questions:

1. Check the [documentation](https://github.com/your-org/chat-widget)
2. Search [existing issues](https://github.com/your-org/chat-widget/issues)
3. Create a [new issue](https://github.com/your-org/chat-widget/issues/new)

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Changelog

### v1.0.0

- Initial release
- Project-based chat widget
- Analytics and reporting
- Cross-platform compatibility
- TypeScript support
