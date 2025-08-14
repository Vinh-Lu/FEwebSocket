# Modern Next.js Web Application

A modern, full-stack web application built with Next.js 14, TypeScript, and Ant Design. This project implements a robust architecture with state management, data fetching, and responsive design.

## 🚀 Features

- ⚡️ Next.js 14 with App Router
- 🔥 TypeScript for type safety
- 🎨 Ant Design for beautiful UI components
- 🌈 Tailwind CSS for custom styling
- 📊 ECharts for data visualization
- 🔄 React Query for efficient data fetching
- 📱 Responsive design
- 🌓 Dark/Light mode support
- 🎯 State management with Zustand

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **UI Library:** Ant Design
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** React Query
- **HTTP Client:** Axios
- **Date Handling:** date-fns, dayjs
- **Charts:** ECharts
- **Icons:** Lucide React

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🏗️ Project Structure

```
├── app/              # Next.js app directory
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── public/          # Static assets
├── store/           # Zustand store
├── styles/          # Global styles
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## 🔧 Configuration

The project uses several configuration files:

- `next.config.mjs` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `postcss.config.js` - PostCSS configuration

## 📚 API Documentation

You can explore the API using the [Swagger UI](https://api-dev.futabus.vn/phatnguoi/swagger/index.html).

## ⚙️ Environment Configuration

For development, environment variables are managed using an `.env` file. You can find the configuration file for the development environment in the following repository:

[web-dev/futa-busline-web-phatnguoi-dev - GitLab](https://gitlab.futabus.vn/app.config/web-dev/-/tree/master/futa-busline-web-phatnguoi-dev?ref_type=heads)
