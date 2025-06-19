# Windows & Doors Near Me LLC - Business Website

## Overview

This is a modern business website for Windows & Doors Near Me LLC, a window and door installation company serving Gilbert, Arizona and surrounding areas. The application is built as a full-stack web application with a React frontend and Express.js backend, featuring a professional marketing website with contact form functionality.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing with protected route authentication
- **Styling**: Tailwind CSS with shadcn/ui component library and professional blue corporate theme
- **State Management**: TanStack Query (React Query) for server state management
- **Authentication**: JWT-based authentication with localStorage token storage
- **Build Tool**: Vite for fast development and optimized builds
- **UI Components**: Comprehensive shadcn/ui component system with project management dashboard

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **Database**: PostgreSQL 16 with full project management schema
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT tokens with bcryptjs password hashing
- **Authorization**: Role-based access control (customer, employee, admin)
- **Session Management**: Express sessions with PostgreSQL storage
- **Schema Validation**: Zod for runtime type validation

### Authentication & Authorization System
- **User Profiles**: Three subscription tiers with role-based access control
  - Customer (Free): Basic project tracking for homeowners
  - Contractor (30-Day Trial): Full contractor features with trial period
  - Contractor (Paid): Full features plus premium tools and advanced capabilities
- **Subscription Management**: Trial expiration tracking, upgrade paths, and payment integration ready
- **JWT Authentication**: Secure token-based authentication system
- **Password Security**: bcryptjs hashing with salt rounds
- **Protected Routes**: Frontend route protection based on authentication status and subscription level
- **API Security**: Middleware-based endpoint protection with role verification and subscription access control

### Development Environment
- **Platform**: Replit with PostgreSQL 16 module
- **Development Server**: Vite dev server with hot module replacement
- **TypeScript**: Strict type checking across the entire codebase
- **Path Aliases**: Configured for clean imports (@/, @shared/, @assets/)

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users Table**: Complete user management with roles (customer, employee, admin), authentication, and profile data
- **Projects Table**: Full project lifecycle management with status tracking, assignments, and cost estimates
- **Tasks Table**: Project task management with assignments, priorities, and completion tracking
- **Project Updates Table**: Communication and activity logging for project collaboration
- **Contact Submissions Table**: Lead management system with status tracking and conversion capabilities
- **Quote Requests Table**: Online quote request system with window configurations, customer info, and status tracking
- **Quote Activities Table**: Activity logging for quote communications and status changes
- **Relations**: Comprehensive database relationships using Drizzle ORM relations for data integrity
- **Type Safety**: Full Drizzle-zod integration for runtime validation and TypeScript types

### API Endpoints (`server/routes.ts`)
**Authentication Endpoints:**
- `POST /api/auth/register`: User registration with role assignment
- `POST /api/auth/login`: JWT-based authentication
- `GET /api/auth/me`: Current user profile retrieval

**Project Management Endpoints:**
- `GET /api/projects`: List projects (filtered by user role and permissions)
- `POST /api/projects`: Create new projects (admin/employee only)
- `GET /api/projects/:id`: Retrieve specific project details
- `PUT /api/projects/:id`: Update project information
- `GET /api/projects/:projectId/tasks`: List tasks for a specific project
- `POST /api/tasks`: Create new tasks (admin/employee only)
- `PUT /api/tasks/:id`: Update task status and details

**Communication & Updates:**
- `GET /api/projects/:projectId/updates`: Project activity and communication log
- `POST /api/project-updates`: Add project updates and comments

**Lead Management:**
- `POST /api/contact`: Public contact form submissions
- `GET /api/contact-submissions`: Lead management (admin/employee only)
- `PUT /api/contact-submissions/:id/status`: Update lead status

**Employee Management:**
- `GET /api/employees`: List all employees (admin/employee only)

All endpoints include proper authentication middleware, role-based authorization, validation, and comprehensive error handling.

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
- June 17, 2025. Major creative redesign with unique visual elements, custom color scheme, and integrated company logo
- June 17, 2025. Fixed mobile navigation accessibility - added Login button to mobile hamburger menu for better user experience
- June 17, 2025. Implemented comprehensive consultation scheduling system with full editing capabilities and employee assignment features
- June 17, 2025. Updated project creation modal interface to match user's specified design requirements from screenshots
- June 17, 2025. Implemented three-tier subscription system: Customer (Free), Contractor (30-Day Trial), and Contractor (Paid) with role-based access control, trial expiration tracking, and subscription management interface
- June 19, 2025. Implemented professional window configuration tool with Milgard pricing based on price per square foot
- June 19, 2025. Added comprehensive online quote request system with customer portal, contractor dashboard, and activity tracking
- June 19, 2025. Updated colonial grid pattern to accurate 3x2 layout (3 columns x 2 rows) matching technical specifications
- June 19, 2025. Removed "350" and "Ultra" product lines from available options per user requirements
- June 19, 2025. Updated customer product access to V300 and V400 series only (changed V350 Tuscany to V400 Tuscany)
- June 19, 2025. Implemented CTB Quote Plus pricing structure with updated base prices, energy packages (Title 24 2019), glass options (SunGuardMAX, EdgeGuardMAX), and comprehensive pricing calculation
- June 19, 2025. Added admin view toggle allowing admin/contractor users to switch between full access and customer-restricted view for testing customer experience
- June 19, 2025. Separated EdgeGuard Max as standalone option from glass types, implemented automatic Title 24 selection (Low-E Max + EdgeGuard Max + Argon)
- June 19, 2025. Implemented frame color restrictions for V300 windows: White/Tan exteriors match interior colors, Bronze/Black exteriors allow white or matching interior colors
- June 19, 2025. Added real-time energy performance ratings (U-Factor, SHGC, VT) that update based on glass selections and show Title 24 compliance
- June 19, 2025. Restructured dimensions section with Opening Type selection (Rough Opening, Net Frame, Call Out) and implemented call out calculation where each digit × 12 gives actual measurements
- June 19, 2025. Fixed black frame pricing to $1.75 per sq ft (40% premium over standard $1.25 for tan/bronze colors)
- June 19, 2025. Moved "Add Item" button to bottom of configurator for better user workflow
- June 19, 2025. Implemented rough opening calculation adjustment - subtracts 0.5" from each dimension for actual window size since rough opening measurements are frame-to-frame

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Creative and unique website design that stands out from typical business websites.