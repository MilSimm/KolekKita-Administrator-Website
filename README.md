# KolekKita - Junk Collection Management System

A comprehensive platform for managing junk pickup bookings, real-time collector tracking, and recycling operations.

## System Architecture

### User Hierarchy
1. **Admin** - Platform oversight, user verification, system analytics
2. **Junk Shop Owner** - Business management, collector oversight
3. **Collector** - Pickup operations, customer interactions
4. **Customer/Residence** - Service requests, reviews, tracking

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Database**: PostgreSQL (Neon) + Firestore (real-time)
- **Storage**: Firebase Storage
- **Authentication**: Firebase Auth
- **UI**: shadcn/ui + Tailwind CSS

## Features

### For Customers
- Schedule junk pickup with material type selection
- Real-time tracking of collectors
- Chat with assigned collectors
- Rate and review service

### For Collectors
- View assigned pickups
- Update pickup status in real-time
- Navigate with GPS integration
- Chat with customers

### For Junk Shop Owners
- Manage collector fleet
- Monitor pickup operations
- View business analytics
- Broadcast announcements

### For Admins
- User verification and management
- System-wide analytics
- Platform oversight
- Content moderation

## Quick Start

1. **Environment Setup**
   ```bash
   npm install
   npm run dev
   ```

2. **Firebase Configuration**
   - Set up Firebase project with Firestore and Storage
   - Configure environment variables for Firebase credentials
   - Deploy Firestore security rules from `firestore.rules`

3. **Database Setup**
   ```bash
   npm run db:push
   ```

4. **Initialize Sample Data**
   - Use the "Initialize Data" button in the dashboard (development only)

## Security Rules

The application uses Firebase security rules to ensure:
- Users can only access their own data
- Role-based permissions for administrative functions
- Secure communication between users

## API Endpoints

All API routes are defined in `server/routes.ts` with proper validation and error handling.

## Development Guidelines

- Follow TypeScript strict mode
- Use Zod for runtime validation
- Implement proper error handling
- Test with real Firebase data
- Update `replit.md` for architectural changes

## Production Deployment

<<<<<<< HEAD
The application is configured for deployment on Replit with automatic environment variable management."# decentralized-app" 
=======
The application is configured for deployment on Replit with automatic environment variable management.
>>>>>>> 2e5495c (1st Commit)
