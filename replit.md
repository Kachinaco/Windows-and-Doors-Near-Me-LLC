# Windows & Doors Near Me LLC - Business Website

## Overview

This is a modern business website for Windows & Doors Near Me LLC, a window and door installation company serving Gilbert, Arizona and surrounding areas. The application is built as a full-stack web application with a React frontend and Express.js backend, featuring a professional marketing website with contact form functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Comprehensive shadcn/ui component system with Radix UI primitives

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Schema Validation**: Zod for runtime type validation
- **Session Management**: Built-in session handling for future authentication needs

### Development Environment
- **Platform**: Replit with PostgreSQL 16 module
- **Development Server**: Vite dev server with hot module replacement
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users Table**: Basic user authentication structure (id, username, password)
- **Contact Submissions Table**: Stores form submissions (name, contact info, project details, timestamps)
- **Type Safety**: Drizzle-zod integration for runtime validation and TypeScript types

### API Endpoints (`server/routes.ts`)
- `POST /api/contact`: Handles contact form submissions with validation
- `GET /api/contact-submissions`: Admin endpoint to retrieve all submissions
- Error handling with proper HTTP status codes and validation feedback

### Frontend Pages
- **Home Page**: Single-page application with all business sections
- **Component Structure**: Modular components for Header, Hero, Services, Products, Gallery, Testimonials, About, Service Areas, Contact, and Footer
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Storage Layer (`server/storage.ts`)
- **Interface-Based Design**: IStorage interface for flexible implementation
- **Memory Storage**: In-memory implementation for development (ready for database integration)
- **Future Database Integration**: Structure prepared for PostgreSQL with Drizzle ORM

## Data Flow

1. **Contact Form Submission**:
   - User fills out contact form on frontend
   - React Hook Form handles client-side validation
   - TanStack Query mutation sends data to `/api/contact`
   - Backend validates with Zod schema
   - Data stored in database via storage layer
   - Success/error feedback displayed to user

2. **Page Navigation**:
   - Single-page application with smooth scrolling navigation
   - Wouter handles any future multi-page routing needs
   - Header navigation scrolls to sections within the page

3. **Component Communication**:
   - Props-based data flow between components
   - Shared types from schema ensure type safety
   - TanStack Query manages server state and caching

## External Dependencies

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library with Radix UI
- **Lucide React**: Icon library for consistent iconography
- **React Icons**: Additional icons (specifically for social media)

### Form Handling
- **React Hook Form**: Form state management and validation
- **@hookform/resolvers**: Integration with Zod validation

### Database and Validation
- **Drizzle ORM**: Type-safe database operations
- **Drizzle-zod**: Schema validation integration
- **Zod**: Runtime type validation
- **@neondatabase/serverless**: PostgreSQL connection (ready for Neon DB)

### Development Tools
- **TypeScript**: Static type checking
- **Vite**: Build tool and dev server
- **esbuild**: Fast JavaScript bundler for production
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Static Assets**: Served directly by Express in production

### Environment Configuration
- **Development**: `npm run dev` runs tsx with hot reload
- **Production**: `npm start` runs compiled JavaScript
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Port**: Application runs on port 5000, exposed as port 80
- **Build**: Automated build process for deployments
- **Autoscale**: Configured for automatic scaling

## Changelog

Changelog:
- June 17, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.