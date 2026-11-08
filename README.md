# Grapnel

> **Self-Hosted LAN File Explorer & Media Streaming Hub**

Grapnel turns any Windows PC into an intranet file server and private streaming cloud. Connect smartphones, tablets, laptops, and smart TVs on your local Wi-Fi to browse storage drives, stream media directly, upload documents, and generate time-limited expiring share links — with zero internet connection required and zero data routed through third-party servers.

---

## Architecture Overview

```
                      +---------------------------------------+
                      |         LAN Clients & Devices         |
                      |   (Mobile Phones, Tablets, Laptops)   |
                      +-------------------+-------------------+
                                          |
                       HTTP Requests (LAN | Port 3000 / 3001)
                                          v
+---------------------------------------------------------------------------------+
| Host Machine (Windows)                                                          |
|                                                                                 |
|   +--------------------------------+   +------------------------------------+   |
|   |   Vite Client Server           |   |    Express.js Backend Server       |   |
|   |   Port: 3000 (0.0.0.0)         |   |    Port: 3001 (0.0.0.0)            |   |
|   |   - React 18 SPA               |   |    - Dynamic Disk Explorer         |   |
|   |   - Tailwind CSS               |   |    - Scrypt & Session Engine       |   |
|   |   - Reverse Proxy (/api->3001) |   |    - Range-Supported Streaming     |   |
|   |   - History API Fallback       |   |    - Archiver ZIP Streamer         |   |
|   +---------------+----------------+   |    - Multer Disk Upload Engine     |   |
|                   |                    |    - Expiring Token Vault          |   |
|                   +--- Proxy Forward ->+-----------------+------------------+   |
|                                                          |                      |
|                                                          v                      |
|                                        +------------------------------------+   |
|                                        | Windows Host File System           |   |
|                                        | - Drives: C:\, D:\, E:\, etc.      |   |
|                                        | - User Libraries: Downloads, Docs  |   |
|                                        +------------------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## Key Features

- **Zero-Setup LAN Discovery**: Automatically detects non-internal local IPv4 addresses and displays a scannable pairing QR code in the UI. Scan with your phone's camera to connect instantly.
- **Range-Supported Media Streaming**: Stream high-bitrate video (`.mp4`, `.mkv`, `.webm`) and audio (`.mp3`, `.flac`, `.wav`) directly in browser with full timeline scrubbing via HTTP 206 Partial Content range requests.
- **Multi-Format In-Browser Previews**:
  - **Images**: High-resolution gallery viewer with responsive scaling.
  - **PDFs**: Embedded in-browser document reader.
  - **Code & Text**: Integrated viewer for `.js`, `.py`, `.json`, `.md`, `.txt`, and more with one-click code copy and a 2MB browser-safety cap.
- **Dual-Role Access Control**:
  - **Master Role**: Full access to all logical system drives (`C:`, `D:`, `E:`), file modifications, and administrative tasks.
  - **Guest / Standard Role**: Scoped access restricted to external partitions (`E:\`) and safe media folders (`Downloads`, `Pictures`, `Videos`, `Music`, `Desktop`), preventing guest access to Windows system files or primary user roots.
- **Doom Password Deletion Guard**: Destructive deletions require entering the Master authorization password to prevent accidental data loss across shared network clients.
- **Expiring Public Share Links**: Share individual files with customizable Time-To-Live (1 hour, 6 hours, 24 hours, 7 days) via unique cryptographic tokens that bypass the login wall while keeping the rest of your storage private.
- **On-the-Fly ZIP Downloads**: Download any directory as a compressed `.zip` archive on the fly without consuming host disk space.
- **Multi-File Uploads**: Drag-and-drop or select multiple files simultaneously to upload directly into the active viewing directory.
- **Responsive Dark Theme**: Modern glassmorphism UI built with React 18, Tailwind CSS, and Lucide icons, with mobile navigation drawers and quick-access docks.

---

## Tech Stack

- **Backend**: Node.js (ES Modules), Express 4, Multer, Archiver, Mime-Types, QRCode, Cookie-Parser, CORS
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React
- **Testing**: Vitest 2, Supertest 7
- **Security**: Node native `crypto.scryptSync` with 16-byte random salts, `crypto.timingSafeEqual`, HTTP-only session cookies

---

## Project Structure

```
Grapnel/
├── index.html                  # HTML entry point with dynamic SVG favicon
├── package.json                # Dependencies, project metadata, and test scripts
├── start-grapnel.bat           # One-click Windows batch launcher
├── vite.config.js              # Vite server & reverse proxy configuration
├── vitest.config.js            # Vitest test runner configuration
│
├── server/                     # Backend Express Application (Port 3001)
│   ├── app.js                  # Express application factory & middleware stack
│   ├── index.js                # Server entry point & network listener on 0.0.0.0
│   ├── middleware/
│   │   └── auth.js             # Session validation & 403 path isolation rules
│   ├── routes/
│   │   ├── auth.js             # Setup, login, session status, and logout endpoints
│   │   ├── files.js            # Browsing, download, range stream, preview, mkdir, rename, delete, zip
│   │   ├── share.js            # Public time-limited file share tokens & downloads
│   │   ├── system.js           # LAN IPs, pairing QR data URL, hardware stats
│   │   └── upload.js           # Multi-file disk storage upload endpoint
│   └── utils/
│       ├── authStore.js        # Salted Scrypt hashing, verify, and session map manager
│       ├── fileHelpers.js      # Windows WMIC drive detector, MIME resolver, byte formatter
│       └── network.js          # IPv4 interface detector & QR code generator
│
├── src/                        # Frontend React 18 SPA (Port 3000)
│   ├── App.jsx                 # Route switcher (/share/:token vs MainApp) & provider tree
│   ├── context/
│   │   ├── AuthContext.jsx     # Authentication state, role, login/setup handlers
│   │   └── FileContext.jsx     # File navigation, directory items, breadcrumbs, search, modals
│   └── components/
│       ├── ActionModals.jsx    # New Folder, Rename, and Doom Password Delete modals
│       ├── ConnectionModal.jsx # Device QR code pairing & active LAN links
│       ├── FileCard.jsx        # File/folder tile and row layouts with context menu
│       ├── FileGrid.jsx        # Directory view, empty states, search results
│       ├── FileViewerModal.jsx # Multi-type inline viewer (Video, Audio, Image, PDF, Code)
│       ├── LoginWall.jsx       # Initial setup wall & single-input login gatekeeper
│       ├── ShareLinkModal.jsx  # Token generation dialog with TTL presets
│       ├── SharePage.jsx       # Public recipient landing page with live countdown
│       ├── Sidebar.jsx         # Storage drives, quick access folders, favorites
│       └── TopCapsuleDock.jsx  # Navigation dock with role badge & controls
│
└── tests/                      # Automated Test Suite (Vitest + Supertest)
    ├── auth.test.js            # Setup, login, role issuance, session validation, logout
    ├── path-isolation.test.js  # 403 Forbidden enforcement & drive-level permissions
    ├── range-requests.test.js  # HTTP 206 partial content streaming & byte slicing
    └── share-expiry.test.js    # Time-limited tokens, early revocation, rolling purge
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- Windows host machine (for native Windows drive and path resolution)

### Installation & Launch

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nitinvishway/Grapnel.git
   cd Grapnel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   # Run via npm:
   npm run dev

   # Or double-click the Windows batch launcher:
   start-grapnel.bat
   ```

4. **Access the application:**
   - **Host PC**: Open [http://localhost:3000](http://localhost:3000)
   - **Mobile / LAN Devices**: Check the console output or scan the QR code in the UI to open `http://<YOUR_LAN_IP>:3000`.

---

## Security & Setup

On your first launch, Grapnel presents an initial setup screen:

1. **Master Password**: Grants full access to all system drives (`C:`, `D:`, `E:`) and authorizes file deletions ("Doom Password").
2. **Guest Password (Optional)**: Provides scoped access to `E:\` and media directories while locking down system partitions.

*All password hashes and session data are stored locally on your machine in `server/data/` using salted Scrypt key derivation. Runtime credential files are excluded from git.*

---

## Testing

Grapnel includes a test suite covering critical backend security and streaming functionality built with **Vitest** and **Supertest**.

```bash
# Run all tests once
npm test

# Run tests in interactive watch mode
npm run test:watch
```

### Test Coverage Highlights

| Test Module | Coverage |
| :--- | :--- |
| **`tests/auth.test.js`** | Status detection, credential setup, master/standard login, session cookie issuance, logout, protection against reconfiguration |
| **`tests/path-isolation.test.js`** | Unit checks on path filters, HTTP 403 Forbidden enforcement on restricted drives (`C:`, `D:`, system root), drive lock annotations |
| **`tests/range-requests.test.js`** | Full file delivery (200), byte range slicing (206 Partial Content), `Content-Range` headers, open-ended ranges, 404 handling |
| **`tests/share-expiry.test.js`** | Share token generation, TTL bounds enforcement, metadata inspection, direct streaming download, manual revocation, rolling expired token purge |

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/auth/status` | Returns `{ isConfigured, authenticated, role }` |
| `POST` | `/api/auth/setup` | Configures Master and optional Standard password |
| `POST` | `/api/auth/login` | Validates password and sets session cookie |
| `POST` | `/api/auth/logout` | Terminates active session |

### File Operations (`/api/files`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/files?path=<path>` | Lists directory contents or system drives (`path=drives`) |
| `GET` | `/api/files/download?path=<path>` | Downloads file attachment |
| `GET` | `/api/files/stream?path=<path>` | Range-supported video and audio streaming |
| `GET` | `/api/files/preview?path=<path>` | Text and code preview content (capped at 2MB) |
| `POST` | `/api/files/mkdir` | Creates a new folder `{ parentPath, folderName }` |
| `PUT` | `/api/files/rename` | Renames an item `{ oldPath, newName }` |
| `DELETE` | `/api/files/delete` | Deletes item `{ targetPath, doomPassword }` (Master auth required) |
| `POST` | `/api/files/search` | Recursive subtree file search `{ basePath, query }` |
| `GET` | `/api/files/zip?path=<path>` | Streams on-the-fly ZIP archive of folder |

### Public File Sharing (`/api/share`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/share/create` | Generates a time-limited public token `{ filePath, expiresIn }` |
| `GET` | `/api/share/:token/info` | Returns shared file metadata and remaining TTL |
| `GET` | `/api/share/:token/download` | Streams shared file directly to recipient |
| `DELETE` | `/api/share/:token` | Revokes shared link immediately |

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently runs the backend server (port 3001) and Vite frontend (port 3000) |
| `npm run server` | Runs the Express backend in watch mode |
| `npm run client` | Launches the Vite dev server bound to `0.0.0.0` |
| `npm test` | Runs the full Vitest backend test suite |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run build` | Compiles the frontend for production deployment |
| `npm run preview` | Previews the compiled production build |

---

## Firewall & Network Notes

- **Windows Defender Firewall**: When running for the first time, Windows may prompt to allow Node.js through the firewall. Ensure **Private networks** is checked so devices on your Wi-Fi can reach ports 3000 and 3001.
- **Tunneling / Remote Access**: Grapnel is configured with `allowedHosts: true` in `vite.config.js`, allowing it to work with tunneling solutions (such as Cloudflare Tunnel, ngrok, or localtunnel) if you need access outside your local network.

---

## License

This project is open-source and available under the [MIT License](LICENSE).
