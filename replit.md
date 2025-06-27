# Windows & Doors Near Me LLC - Business Website

## Overview

This is a comprehensive business management platform for Windows & Doors Near Me LLC, a window and door installation company serving Gilbert, Arizona and surrounding areas. The application combines a professional marketing website with a full-featured business management system including e-commerce, project management, lead tracking, job scheduling, and CRM tools. Built as a full-stack web application with React frontend and Express.js backend.

## System Architecture

### Full-Stack Python Architecture (FastAPI + Jinja2)
- **Framework**: FastAPI with async/await support and automatic API documentation
- **Templates**: Jinja2 server-side rendering for modern, responsive UI
- **Runtime**: Python 3.11 with async capabilities
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0 async ORM
- **Authentication**: JWT tokens with PassLib bcrypt password hashing
- **Authorization**: Role-based access control (customer, contractor_trial, contractor_paid, admin)
- **Real-time**: Python-SocketIO for live collaboration features
- **Validation**: Pydantic models for request/response validation
- **Styling**: Tailwind CSS with glassmorphism design and gradient themes

### Previous Architecture (Deprecated)
- **Frontend**: React 18 with TypeScript, Wouter routing, TanStack Query
- **Backend**: Express.js with TypeScript, Drizzle ORM
- **Note**: Migrated to all-Python solution for unified development experience

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
- **Development Server**: Uvicorn ASGI server with auto-reload
- **Python**: Type hints with Pydantic validation and SQLAlchemy 2.0
- **Templates**: Jinja2 with Tailwind CSS for responsive design

## Key Components

### Database Schema (`shared/schema.ts`)
- **Users Table**: Complete user management with roles (customer, employee, admin), authentication, and profile data
- **Projects Table**: Full project lifecycle management with status tracking, assignments, and cost estimates
- **Tasks Table**: Project task management with assignments, priorities, and completion tracking
- **Project Updates Table**: Communication and activity logging for project collaboration
- **Contact Submissions Table**: Lead management system with status tracking and conversion capabilities
- **Quote Requests Table**: Online quote request system with window configurations, customer info, and status tracking
- **Quote Activities Table**: Activity logging for quote communications and status changes
- **Leads Table**: Comprehensive lead management from multiple sources (website, Yelp, Thumbtack, phone calls)
- **Jobs Table**: Job scheduling system with contractor assignments, acceptance status, and payout tracking
- **Proposals Table**: Proposal management with status tracking, file storage, and approval workflow
- **Communication Logs Table**: CRM communication tracking for calls, SMS, and emails with OpenPhone/Gmail integration
- **User Availability Table**: Crew scheduling and availability management for job assignments
- **Blog Posts Table**: Content management system for home improvement tips and company blog
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
- June 27, 2025. **MAJOR ARCHITECTURAL CHANGE**: Migrated from React/TypeScript frontend + Express.js backend to unified FastAPI + Jinja2 Templates all-Python solution with async capabilities, real-time collaboration via Python-SocketIO, and modern glassmorphism UI design
- June 27, 2025. **TRANSFORMED TO MONDAY.COM-STYLE BOARD**: Rebuilt project management interface as row-based Monday.com-style board builder with dark theme, inline editing, multiple column types (Status, People, Text, Date, Number, Tags), SQLAlchemy models for boards/columns/items/values, and real-time cell updates - complete board management system with FastAPI backend
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
- June 19, 2025. Enhanced window preview display with larger minimum sizes and accurate dimension representation for rough opening calculations
- June 20, 2025. Updated quote summary to match detailed technical specification format with comprehensive window details and professional layout
- June 20, 2025. Added installation services checkbox to quote request contact form for customer service requirements
- June 20, 2025. Replaced modern 3D window preview with consistent configurator tool preview for unified user experience
- June 21, 2025. Fixed colonial grid patterns to show separate 3x2 grids in upper and lower window sashes for accurate double-hung window representation
- June 21, 2025. Implemented comprehensive project portfolio system with three core modules: 1) Scheduling System for job assignments with contractor acceptance tracking and payout management, 2) Lead Flow Dashboard capturing leads from website, Yelp, Thumbtack, and phone calls with central routing and assignment capabilities, 3) CRM Tools foundation with communication logging structure ready for OpenPhone and Gmail integration
- June 21, 2025. Added complete database schema for business management including leads, jobs, proposals, communication logs, user availability, and blog content management
- June 21, 2025. Created scheduling interface with calendar views, crew availability tracking, and job status management (not scheduled, scheduled, completed) with contractor acceptance workflow (pending, accepted, declined)
- June 21, 2025. Implemented streamlined 11-stage project pipeline displaying count-only view: New Leads → Need Attention → Sent Estimate → Signed → Need Ordered → Ordered → Need Scheduled → Scheduled → In Progress → Complete → Follow Up
- June 21, 2025. Created comprehensive activity feed system with dedicated updates page (/updates), database table for project activities, API endpoints for fetching/creating updates, and fixed non-functional "Share something..." button on dashboard to link to activity feed
- June 21, 2025. Renamed "Activity Feed" to "Activity" and implemented Facebook-like company social feed on dashboard with post creation, sample team posts, interactive UI elements (like, comment, share buttons), and backend API endpoints for company posts functionality
- June 21, 2025. Created dedicated company feed page (/company-feed) for viewing all status updates, modified "View all activity" link to show company status updates instead of project activity, implemented real-time post display with newest posts at top
- June 21, 2025. Successfully implemented complete photo upload and emoji functionality for company social feed: added image upload with 5MB limit and preview, 12 emoji feelings selector with popover interface, enhanced database schema with image_url and feeling columns, configured multer middleware for file handling, added static file serving for uploaded images, and applied comprehensive authentication fixes for FormData requests
- June 22, 2025. Fixed lead detail pages to properly display individual lead data: corrected API query to fetch specific lead information, made all contact fields (including customer name) fully editable and saveable, added proper form validation and cache invalidation, enhanced UI with phone icons for consistency
- June 22, 2025. Implemented role-based dashboard access control: customer free accounts now only see window configuration tool, delivery info, and order tracking; contractor trial/paid accounts get full business management features including project management, calendar, leads, reports, settings, and company activity feed; updated dashboard header to dynamically display company name from company settings instead of hardcoded values
- June 22, 2025. Enhanced window configuration tool with auto-save functionality: implemented 500ms debounced auto-save for all quote changes, removed manual save button (kept "Save to Collection"), added auto-save status indicator with timestamp, fixed back button navigation to properly return to quotes manager
- June 22, 2025. Fixed mobile responsiveness issues in status updates feed: optimized post creation area with smaller elements, made action buttons mobile-friendly with icon-only display, improved image preview sizing, enhanced feeling selector grid layout for mobile devices
- June 22, 2025. Resolved FormData authentication issue preventing status update posting: modified apiRequest function to properly handle FormData uploads while maintaining authentication headers for both JSON and FormData requests
- June 22, 2025. Enhanced status updates display: limited dashboard to show only 3 most recent posts with "View all updates" button for accessing complete feed, improved mobile responsiveness across all status update elements
- June 22, 2025. Updated "Manage Leads & Forms" button design: changed to orange color scheme for better visual prominence and distinction in business dashboard layout
- June 22, 2025. Separated "Manage Leads & Forms" into distinct buttons: created separate "Manage Leads" (orange) and "Forms" (green) buttons, plus added new "Payroll" button (cyan) with comprehensive employee payment management interface
- June 22, 2025. Restored full company settings for contractors: fixed settings page to show simple profile settings for customers while giving contractors access to complete company management including API integrations (OpenPhone, Gmail, Stripe, SendGrid, Twilio), business information, and connection testing tools
- June 22, 2025. Completely redesigned project management dashboard: replaced complex Monday.com-inspired workspace layout with streamlined, optimized interface featuring compact stats cards, efficient search/filtering, loading states with skeleton animations, memoized callbacks for performance, and cleaner project cards with better visual hierarchy and responsiveness
- June 22, 2025. Transformed project management into folder-based system: implemented Monday.com-style interface where projects are organized in status folders that open into individual project dashboards with task tables, team assignments, contact information, and detailed project management views matching user's attached screenshots
- June 22, 2025. Enhanced folder-based project management with pipeline integration: organized projects into 4 strategic folders (New Leads, Active Projects, Scheduled Work, Completed) with quick action buttons linking to specialized tools, improved project cards with detailed information, and seamless navigation to existing project dashboards and workflow management systems
- June 22, 2025. Implemented comprehensive CRM with complete data synchronization between all functions: created CRMSyncService with automatic lead-to-project conversion, quote integration, customer interaction tracking, communication logging, analytics generation, and pipeline management; enhanced database schema with metrics tables (lead_metrics, project_metrics, sales_metrics, customer_interactions, pipeline_analytics); added 15 specialized API endpoints for seamless data flow including /api/crm/convert-lead-to-project, /api/crm/analytics, /api/crm/customer360, and bulk synchronization tools; built comprehensive CRM dashboard with real-time analytics, pipeline visualization, communication breakdowns, and customer 360-degree views
- June 22, 2025. Enhanced project detail page with professional color scheme: updated hero banner with blue gradient background and improved participant avatars with role indicators, redesigned activity feed with color-coded sections (blue for reply input, orange for smart files, green for recent activity), enhanced right sidebar with themed cards using amber for visibility notices, purple for client portal, green for project stage, blue for lead source, and pink for tags section, improved tab styling with individual color themes and hover effects for better visual hierarchy
- June 22, 2025. Fixed database connection issue causing app startup failure: cleared and recreated PostgreSQL schema, pushed all database tables successfully, resolved WebSocket connection problems with Neon database, created admin account with ADMIN/TEST credentials, cleared all test data per user request for clean testing environment
- June 23, 2025. Enhanced Excel-style project management interface with premium UI/UX design: implemented advanced filtering by status, sorting controls, gradient header with professional dark theme, improved row spacing and visual hierarchy, added icon badges for location and phone data, hover effects and selection states, professional footer with team avatars and statistics, enhanced empty state with clear actions, and functional row actions - ensured all buttons and links serve a real purpose and connect to existing functionality
- June 23, 2025. Transformed project management into fully editable Excel-style canvas: implemented inline editing for all fields (click any cell to edit), dynamic column visibility controls, bulk action operations for selected rows, customizable table layout with show/hide columns, real-time data saving with Enter/Escape key controls, hover indicators for editable cells, and comprehensive editing interface that serves as a blank canvas for users to customize their workflow - every element is functional and purposeful
- June 23, 2025. Enhanced main dashboard boxes with comprehensive three-dot menu system: added hover-activated dropdown menus for each dashboard box with professional options including Settings, Filter, Sort, Collapse, Group by, Duplicate column, Add AI column, Add column to the right (with submenu for Status, Text, People, Timeline, Date, Tags, Numbers), Change column type, Column extensions, Rename, and Delete; separated delete button into its own column in project table for better UX; implemented nested dropdown menus matching Monday.com-style interface for advanced project management functionality
- June 23, 2025. Implemented comprehensive archive/trash system with 30-day auto-deletion: added projectStatus, trashedAt, and archivedAt fields to database schema, created API endpoints for archive/trash/restore operations, implemented individual project dropdown menus with archive/trash/restore options in rightmost column, added bulk operations for multiple projects, projects in archive remain permanent until manually emptied while trash auto-deletes after 30 days
- June 23, 2025. Enhanced Excel-style project table with column header three-dot menus: added hover-activated three-dot dropdown menus to all column headers (Item, People, Location, Phone, Status, Measure Date, Delivery Date, Install Date, Actions) with comprehensive Monday.com-style options including Settings, Filter, Sort, Collapse, Group by, Duplicate column, Add AI column, Add column to the right, Change column type, Column extensions, Rename, and Delete - menus appear on hover with smooth transitions and professional styling
- June 24, 2025. Implemented comprehensive real-time collaboration system with live editing markers: created WebSocket server for real-time communication, added live cell editing indicators showing who is editing which cells, implemented user presence indicators with online user count, added collision detection preventing multiple users from editing same cell simultaneously, created real-time cell update broadcasting, built collaboration status indicator in toolbar showing connection state and online users, added visual editing markers with user names and animated indicators for active cell editing sessions
- June 27, 2025. Comprehensive mobile UI/UX optimization across entire application: optimized Excel-style project manager with mobile card layout for small screens, responsive toolbar with compact buttons and icons, mobile-friendly collaboration indicators, adaptive column visibility, responsive dashboard header with truncated text and flexible layouts, mobile-optimized auth pages with larger touch targets (h-11 inputs/buttons), responsive form layouts (grid-cols-1 sm:grid-cols-2), improved spacing and typography scaling, enhanced dropdown menus with proper alignment, fixed React state update warnings and TypeScript errors for better stability
- June 27, 2025. Modern sleek UI redesign for project management: transformed Excel-style interface with gradient backgrounds (slate-50 to gray-100), glassmorphism header with backdrop-blur-sm, modern card-based layout with rounded-xl corners and subtle shadows, enhanced real-time collaboration badges with emerald/red status indicators, improved mobile cards with gradient backgrounds and better visual hierarchy, modern table design with slate color scheme and alternating row colors, professional status bar with live collaboration indicators, better page sizing and modern sleek aesthetics throughout
- June 27, 2025. **COMPREHENSIVE MONDAY.COM BOARD TRANSFORMATION**: Redesigned project management into ultra-slim, sleek Monday.com-style board with collapsible groups (New Leads, Active Projects, Scheduled Work, Completed), compact headers, inline editing with color-coded status pills, darker theme (gray-950 background), automatic project grouping by status, add item buttons at bottom of each group, enhanced authentication for edit operations, live collaboration indicators, back button navigation to dashboard, and significantly reduced visual clutter for professional appearance

## User Preferences

Preferred communication style: Simple, everyday language.
Design preference: Creative and unique website design that stands out from typical business websites.
UI/UX preference: No confirmation popups for actions - provide undo functionality instead for better workflow.
Column preference: Resizable columns with drag functionality for optimal content viewing.