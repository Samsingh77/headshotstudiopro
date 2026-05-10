# HeadshotStudioPro

Transform casual photos into professional, studio-quality headshots. This application uses advanced AI to preserve your identity while enhancing lighting, attire, and backgrounds to create perfect corporate portraits for LinkedIn and professional branding.

## Features

- **AI-Powered Generation**: Uses Gemini flash-image models for high-fidelity headshots.
- **Credit-Based System**: Integrated wallet and credit system for unlocking high-definition results.
- **Tiered Quality**:
  - **HD**: Fast, sharp generation for quick professional updates.
  - **Super HD**: Premium studio quality with medium-format camera simulation, ray-traced lighting, and advanced skin texture rendering.
- **Interactive Studio Mode**: Real-time background and style adjustments.
- **Professional Editor**: Integrated cropping and refinement tools.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Framer Motion.
- **Backend**: Node.js, Express (Full-stack integration).
- **AI**: Google Gemini API.
- **Database**: Firebase Firestore (for user profiles and generation history).
- **Storage**: Firebase Storage (for images).
- **Authentication**: Firebase Authentication.

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Firebase Project

### Environment Variables

Create a `.env` file based on `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_key
...
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Sitemap & SEO

- `sitemap.xml` and `robots.txt` are located in the `public/` directory.

## License

MIT
