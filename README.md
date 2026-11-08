# Grapnel

> **Self-Hosted LAN File Explorer & Media Streaming Hub**

Grapnel turns any Windows PC into an intranet file server and private streaming cloud. Connect smartphones, tablets, laptops, and smart TVs on your local Wi-Fi to browse files, stream media directly, upload documents, and generate time-limited expiring share links — with zero internet connection required and zero data routed through third-party servers.

---

##  Key Features

-  **Zero-Setup LAN Discovery**: Automatically detects non-internal local IPv4 addresses and renders an instant QR pairing code on screen. Simply scan with your phone's camera to connect.
-  **Range-Supported Media Streaming**: Stream high-bitrate video (`.mp4`, `.mkv`, `.webm`) and audio (`.mp3`, `.flac`, `.wav`) directly in your browser with full timeline scrubbing via HTTP 206 partial content range requests.
-  **Multi-Format In-Browser Preview**:
  - **Images**: High-resolution gallery view.
  - **PDFs**: Embedded in-browser document reader.
  - **Code & Text**: Built-in syntax preview for `.js`, `.py`, `.json`, `.md`, and more with one-click code copy.
-  **Dual-Role Access Control**:
  - **Master Role**: Complete access to all logical system drives (`C:`, `D:`, `E:`), file modifications, and administrative capabilities.
  - **Guest / Standard Role**: Restricts access to external partitions (`E:\`) and safe media folders (`Downloads`, `Pictures`, `Videos`, `Music`), preventing guest access to Windows system files or primary user roots.
-  **Doom Password Deletion Guard**: Destructive deletions require entering the Master authorization password to prevent accidental data loss across shared network clients.
-  **Expiring Public Share Links**: Share individual files with customizable Time-To-Live (1 hour, 6 hours, 24 hours, 7 days) via unique cryptographic tokens that bypass the login wall while keeping the rest of your storage private.
-  **On-the-Fly ZIP Downloads**: Download any directory as a compressed `.zip` archive on the fly without consuming host disk space.
-  **Drag-and-Drop Multi-File Upload**: Upload multiple files simultaneously directly into the active viewing directory.
-  **Cyberpunk Dark Glassmorphism UI**: Built with React 18 and Tailwind CSS, featuring smooth transitions, mobile-responsive drawers, and floating quick-access controls.

---

## Tech Stack

- **Backend**: Node.js (ES Modules), Express.js, Multer, Archiver, Mime-Types, QRCode
- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide React
- **Security**: Node native `crypto.scryptSync` with unique 16-byte cryptographically secure random salts and `crypto.timingSafeEqual`

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- Windows host system (for native drive and path resolution)

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
   - **On your PC**: Open [http://localhost:3000](http://localhost:3000)
   - **On Mobile / LAN Devices**: Check the terminal output or scan the QR code in the Grapnel interface to connect via `http://<YOUR_LAN_IP>:3000`.

---

## Security & Setup

On your first launch, Grapnel will present an initial configuration wall:

1. **Master Password**: Grants full access to all system drives and enables file deletion authorization ("Doom Password").
2. **Guest Password (Optional)**: Provides scoped read/write access to `E:\` and media directories while locking down system partitions.

*All password hashes and session data are stored locally on your machine in `server/data/` using salted Scrypt key derivation.*

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Concurrently runs both the backend server (port 3001) and Vite frontend (port 3000) |
| `npm run server` | Runs the Express backend in watch mode |
| `npm run client` | Launches the Vite dev server bound to `0.0.0.0` |
| `npm run build` | Compiles the frontend for production deployment |
| `npm run preview` | Previews the compiled production build |

---

##  License

This project is open-source and available under the [MIT License](LICENSE).
