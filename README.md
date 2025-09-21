# Web OS Project

A Web OS-style application built with Next.js and Node.js for group collaboration. Features a desktop-like interface with draggable windows, a taskbar, and multiple applications.

## Features

- 🖥️ Desktop-like UI with wallpaper background
- 📱 Draggable, minimizable, and closable windows
- 📋 Taskbar with start menu and running apps
- 📝 Built-in applications (Notes, Browser, Settings)
- 🔗 RESTful API for user and file management
- ⚡ Real-time state management with React Context

## Tech Stack

- **Frontend**: Next.js 13+, React 18, Tailwind CSS
- **Backend**: Node.js, Express
- **Language**: JavaScript
- **State Management**: React Context API

## Project Structure

```
web-os-project/
├── package.json
├── next.config.js
├── jsconfig.json
├── public/                 # Static assets
├── src/
│   ├── pages/              # Next.js routes
│   │   ├── _app.js
│   │   ├── index.js        # Desktop home screen
│   │   └── apps/           # Application pages
│   ├── components/         # UI Components
│   │   ├── Desktop.js
│   │   ├── Taskbar.js
│   │   ├── Window.js
│   │   └── AppIcon.js
│   ├── context/            # React Context
│   │   └── AppContext.js
│   ├── styles/             # CSS files
│   │   └── globals.css
│   └── server/             # Express backend
│       ├── index.js
│       ├── routes/
│       └── db/
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/codehubbers/OrbitOS
   cd OrbitOS
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development servers**

   **Option 1: Run both servers simultaneously**

   ```bash
   npm run dev:all
   ```

   **Option 2: Run servers separately**

   Terminal 1 (Frontend):

   ```bash
   npm run dev
   ```

   Terminal 2 (Backend):

   ```bash
   npm run server
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build the Next.js application
- `npm run start` - Start Next.js production server
- `npm run server` - Start Express API server
- `npm run dev:all` - Start both frontend and backend concurrently

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login

### Files

- `GET /api/files` - List all files
- `POST /api/files/upload` - Upload file
- `DELETE /api/files/:id` - Delete file

### Health Check

- `GET /api/health` - Server health status

## Applications

### Notes App

- A feature-rich rich text editor with a professional, self-contained UI.
- **Developer:** @Gordon.H
- **Rich Text Formatting:** Includes support for headers, bold, italics, lists, and links.
- **File System Integration:** Standalone file save (to `.html`) and load functionality using browser APIs.
- **Advanced Editing Tools:** Features a toggleable find-and-replace panel.
- **Dynamic UI:** A floating element displays a real-time word count, ensuring visibility regardless of window size.
- **About Panel:** Includes an "About" modal with version and developer information.

### Browser App

- Basic web browser with URL input
- Uses iframe for web content display

### Settings App

- System configuration interface
- Theme, notifications, and auto-save settings

## Contributing

### For Group Members

1. **Fork the repository** and create your feature branch

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Follow the coding standards**
   - Use JavaScript (not TypeScript)
   - Follow existing component structure
   - Use Tailwind CSS for styling
   - Keep components small and focused

3. **Adding New Applications**
   - Create new app component in `src/pages/apps/`
   - Add app definition to `desktopApps` in `Desktop.js`
   - Register component in `appComponents` object

4. **API Development**
   - Add new routes in `src/server/routes/`
   - Follow RESTful conventions
   - Include proper error handling
   - Return consistent JSON responses

5. **Testing Your Changes**

   ```bash
   npm run dev:all
   ```

6. **Submit Pull Request**
   - Ensure code works locally
   - Write clear commit messages
   - Include description of changes

### Code Style Guidelines

- Use functional components with hooks
- Implement proper error boundaries
- Follow React best practices
- Use semantic HTML elements
- Ensure responsive design
- Add proper accessibility attributes

## Deployment

### Frontend (Vercel)

```bash
npm run build
```

### Backend (Node.js hosting)

```bash
cd src/server
node index.js
```

## Future Enhancements

- [ ] User authentication with JWT
- [ ] Real database integration (MongoDB/PostgreSQL)
- [ ] File system with actual file storage
- [ ] Real-time collaboration features
- [ ] Plugin system for custom apps
- [ ] Mobile responsive design
- [ ] Dark/light theme switching
- [ ] Notification system

## License

MIT License - feel free to use this project for learning and development.

## Support

For questions or issues, please create an issue in the repository or contact the development team.
