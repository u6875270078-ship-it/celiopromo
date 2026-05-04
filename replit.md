# Overview

This is a Celio e-commerce website built with React (client-side) and Express.js (server-side). The application features a modern, responsive design inspired by Italian fashion retail websites, with a clean interface showcasing products, collaborations, deals, and promotional content. The frontend is built using React with TypeScript and styled with Tailwind CSS and shadcn/ui components, while the backend uses Express.js with a PostgreSQL database managed through Drizzle ORM.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

- **Enhanced Order Confirmation Email System (Latest)**: Created comprehensive invoice-style email confirmations using Resend that include:
  - Complete customer information (name, email, phone)
  - Detailed shipping and billing addresses
  - Professional product table with SKU codes, quantities, unit prices, and totals
  - Price breakdown with Italian VAT (22%) calculation
  - Payment method details (Carta di Credito, etc.)
  - Expected delivery dates (5-7 working days)
  - Professional invoice design with company branding
  - Customer support contact information
  - All text in Italian for brand consistency
- Fixed homepage hero carousel to display user's actual uploaded images by updating database section fields from null to 'hero'
- Enhanced ProductDetail component to properly display all product images (3 images) with thumbnail navigation and error handling
- Updated "Similar Products" section to show real database products with high-resolution images instead of placeholders
- Implemented language consistency by changing French text to Italian ("Potrebbe piacerti anche")

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in Vite development environment
- **Styling**: Tailwind CSS with custom CSS variables for design system consistency
- **Component Library**: shadcn/ui components with Radix UI primitives for accessible UI elements
- **State Management**: React Query (TanStack Query) for server state management
- **Build Tool**: Vite with custom configuration for development and production builds
- **Form Handling**: React Hook Form with Zod validation resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript support
- **Runtime**: Node.js with ESM modules
- **API Design**: RESTful API structure with route registration system
- **Storage Layer**: Abstracted storage interface with in-memory implementation (MemStorage) and database-ready structure
- **Development Setup**: Custom Vite middleware integration for hot module replacement

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM with schema-first approach
- **Schema Management**: Centralized schema definitions in shared directory with Zod validation
- **Connection Pooling**: Neon serverless connection pool with WebSocket support
- **Migration System**: Drizzle Kit for database migrations and schema management

## Authentication and Authorization
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **User Schema**: Basic user model with username/password authentication
- **Validation**: Zod schemas for input validation and type safety

## Project Structure
- **Monorepo Setup**: Client and server code in separate directories with shared schema
- **Path Aliases**: TypeScript path mapping for clean imports (@/, @shared/, @assets/)
- **Development Tools**: ESBuild for production builds, TSX for development execution
- **Code Quality**: TypeScript strict mode with comprehensive type checking

# External Dependencies

## Database and Storage
- **Neon Database**: Serverless PostgreSQL database with WebSocket support
- **Drizzle ORM**: Type-safe database access with PostgreSQL dialect
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## UI and Styling
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **shadcn/ui**: Pre-built accessible component library
- **Radix UI**: Low-level accessible UI primitives
- **Lucide React**: Icon library for consistent iconography

## Development and Build Tools
- **Vite**: Fast development server and build tool with React plugin
- **Replit Integration**: Custom Vite plugins for Replit development environment
- **TypeScript**: Static type checking with strict configuration
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer

## Frontend Libraries
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **date-fns**: Date manipulation utilities
- **class-variance-authority**: Type-safe CSS class management
- **Embla Carousel**: Carousel component for product showcases

## Validation and Data Processing
- **Zod**: Schema validation for forms and API data
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas