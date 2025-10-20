# Mente Maestra Landing

A minimalist Next.js landing page featuring a full-screen Spline 3D scene and projects showcase.

## Features

- **Full-screen Spline Integration**: Immersive 3D experience using Spline design
- **Minimalist Design**: Clean, modern interface with no top navigation
- **Preloader**: Elegant loading screen with progress indicator
- **Projects Page**: Dedicated page for showcasing projects
- **Responsive Design**: Optimized for all screen sizes
- **TypeScript**: Full type safety throughout the application

## Tech Stack

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Spline 3D integration

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Landing page with Spline scene
│   ├── projects/
│   │   └── page.tsx      # Projects showcase page
│   ├── layout.tsx        # Root layout with preloader
│   └── globals.css       # Global styles
└── components/
    ├── Preloader.tsx     # Loading screen component
    └── ClientWrapper.tsx # Client-side wrapper for preloader
```

## Customization

- **Spline Scene**: Update the iframe src in `src/app/page.tsx`
- **Preloader**: Modify `src/components/Preloader.tsx` for different loading styles
- **Projects**: Add your projects in `src/app/projects/page.tsx`
- **Styling**: Update `src/app/globals.css` for global style changes

## Deployment

The project is ready for deployment on Vercel, Netlify, or any other Next.js-compatible platform.
