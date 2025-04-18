# ShipUp Frontend

A modern React application built with TypeScript for the ShipUp delivery management platform.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Features](#features)
  - [Authentication](#authentication)
  - [User Management](#user-management)
  - [Driver Management](#driver-management)
  - [Order Management](#order-management)
  - [Real-time Tracking](#real-time-tracking)
- [API Integration](#api-integration)
- [Contribution Guide](#contribution-guide)

## Overview

The ShipUp frontend is a responsive web application that provides interfaces for users, drivers, and administrators to manage the delivery service platform. It communicates with multiple backend microservices to provide a seamless experience.

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ShipUp.git
cd ShipUp/frontend
```

2. Install dependencies:
```bash
npm install
```

### Running the Application

For development:
```bash
npm run dev
```

For production build:
```bash
npm run build
npm run preview
```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_AUTH_API_URL=http://localhost:3001/auth
VITE_USER_API_URL=http://localhost:3002/api
VITE_PARTNER_API_URL=http://localhost:3003/api
VITE_ORDER_API_URL=http://localhost:3004/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Project Structure

```
src/
├── assets/            # Static assets (images, fonts, etc.)
├── components/        # Reusable UI components
│   ├── common/        # Common components used across the app
│   ├── auth/          # Authentication related components
│   ├── user/          # User profile related components
│   ├── driver/        # Driver related components
│   ├── order/         # Order related components
│   └── admin/         # Admin dashboard components
├── contexts/          # React contexts for state management
├── hooks/             # Custom React hooks
├── layouts/           # Layout components (header, footer, sidebar)
├── pages/             # Page components corresponding to routes
├── services/          # API service functions
├── types/             # TypeScript interfaces and types
├── utils/             # Utility functions
├── App.tsx            # Main App component
└── main.tsx           # Entry point
```

## Features

### Authentication

- User registration and login
- Driver registration and login
- Social authentication with Google
- Password reset with OTP
- Token-based authentication with JWT
- Automatic token refresh

### User Management

- User profile management
- Address management
- Order history
- Payment methods

### Driver Management

- Driver profile management
- Document upload and verification
- Vehicle details management
- Online/offline status
- Order assignment and tracking

### Order Management

- Create new delivery orders
- Track order status
- View order details
- Cancel orders
- Payment processing

### Real-time Tracking

- Real-time driver location tracking
- Delivery status updates
- Estimated delivery time

## API Integration

The frontend communicates with the following backend services:

1. **Authentication Service** (port 3001)
   - User and driver authentication
   - Token management
   - OTP verification

2. **User Service** (port 3002)
   - User profile management
   - User addresses
   - File uploads

3. **Partner Service** (port 3003)
   - Driver profile management
   - Document verification
   - Vehicle management

4. **Order Service** (port 3004)
   - Order creation and management
   - Pricing calculations
   - Payment processing
   - Order tracking

Each service has its own dedicated API client in the `services` directory.

## Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request

## Code Style

This project uses ESLint and Prettier for code style enforcement. Run linting with:

```bash
npm run lint
```

Fix linting issues with:

```bash
npm run lint:fix
```

## Testing

Run tests with:

```bash
npm test
```

## Build With

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [TailwindCSS](https://tailwindcss.com/) - CSS framework
- [React Router](https://reactrouter.com/) - Routing
- [Axios](https://axios-http.com/) - HTTP client
- [React Query](https://react-query.tanstack.com/) - Data fetching and caching
- [React Hook Form](https://react-hook-form.com/) - Form validation
- [Google Maps API](https://developers.google.com/maps) - Maps and location services
