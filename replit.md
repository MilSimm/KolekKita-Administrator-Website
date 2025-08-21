# Overview

This is a full-stack junk collection/recycling management application built with React and Express. The application serves as a comprehensive platform for managing junk pickup bookings, real-time collector tracking, chat communications, and customer reviews. It features a modern, responsive interface built with shadcn/ui components and Tailwind CSS for styling.

The system operates with a 4-tier user hierarchy (Admin → Junk Shop Owner → Collector → Customer/Residence) and focuses on administrative platform management including junk shop verification, content moderation, analytics reporting, and system oversight features.

# User Preferences

Preferred communication style: Simple, everyday language.

# Recent Changes

**August 05, 2025**: Successfully connected junk shop verification system to existing Firestore data.
- Fixed Firebase connectivity issues by implementing proper client-side Firestore integration
- Updated verification page to correctly display data from user's existing "verifications" collection
- Adapted data structure handling to match actual Firestore verification documents (document uploads, user roles, status tracking)
- Implemented approve/reject functionality for junk shop document verifications
- Added real-time data fetching using useFirestoreCollection hook
- Created comprehensive debug interface showing data structure and connection status
- Successfully displaying pending junk shop verifications with business permits and government IDs

**August 05, 2025**: Successfully migrated project from Replit Agent to standard Replit environment.
- Updated Firebase configuration with permanent API credentials (kolekkita project)
- Converted database layer from PostgreSQL/Drizzle to Firebase Firestore
- Updated server storage interface to use Firebase Admin SDK
- Modified shared schema to use native Firebase types instead of Drizzle/PostgreSQL
- Maintained all existing admin management features and UI components

**August 05, 2025**: Successfully restructured application to focus on admin management features.
- Removed pickup booking system and real-time chat functionality
- Removed live tracking, ratings/reviews, and transaction history features
- Created new admin-focused pages: Verification, Moderation, Analytics, and System Management
- Updated navigation sidebar to reflect admin-only features
- Restructured Dashboard to show platform oversight stats instead of booking data
- Applied modern gradient design system matching user's reference images
- Updated notification system to focus on verification requests and content moderation
- Maintained Firebase authentication and role-based access control
- Updated routing to include new admin pages: /verification, /moderation, /analytics, /system

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript, using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and React Context for authentication
- **UI Framework**: shadcn/ui components with Radix UI primitives and Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod validation through @hookform/resolvers

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Session Storage**: PostgreSQL-based session storage using connect-pg-simple
- **File Structure**: Modular architecture with separate routing and storage abstraction layers

## Data Storage Solutions
- **Primary Database**: PostgreSQL configured through Neon Database serverless connection
- **ORM**: Drizzle ORM with Zod integration for runtime type validation
- **File Storage**: Firebase Storage for image and document uploads
- **Real-time Data**: Firestore for real-time features like chat messages and live tracking
- **Schema**: Comprehensive database schema including users, bookings, chat messages, and reviews tables

## Authentication and Authorization
- **Authentication Provider**: Firebase Authentication with email/password
- **Session Management**: Server-side sessions stored in PostgreSQL
- **Role-based Access**: 4-tier hierarchy system:
  1. Admin - Platform oversight, user management, system analytics, verification
  2. Junk Shop Owner - Business management, collector oversight
  3. Collector - Pickup operations, customer interactions
  4. Customer/Residence - Service requests, reviews, tracking
- **Context Management**: React Context API for managing authentication state across components

## External Dependencies
- **Database Services**: 
  - Neon Database (PostgreSQL serverless)
  - Firebase Firestore (real-time data)
  - Firebase Storage (file uploads)
- **Maps Integration**: Google Maps API for live tracking and location services
- **UI Components**: Radix UI primitives for accessible component foundations
- **Development Tools**: 
  - Replit-specific plugins for development environment
  - ESBuild for server-side bundling in production
- **Real-time Features**: Firebase SDK for real-time chat and live tracking updates