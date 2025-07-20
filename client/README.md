# School Management System - Frontend

A modern, responsive frontend application for managing educational institutions built with Next.js, TypeScript, Redux Toolkit, and Tailwind CSS.

## Features

- **User Authentication**: Registration, login, logout with JWT tokens stored in secure cookies
- **School Registration**: Complete school and campus setup during owner registration
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript implementation
- **State Management**: Redux Toolkit for predictable state management
- **Modern UI Components**: Reusable component library

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Redux Toolkit
- **HTTP Client**: Axios with interceptors
- **Authentication**: JWT tokens with js-cookie
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Backend API running on `http://localhost:8000` (Django)

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Create environment file:
```bash
cp .env.example .env.local
```

3. Update environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME="School Management System"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Start the development server:
```bash
pnpm dev
```

5. Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard page
│   ├── login/            # Login page
│   ├── register/         # Registration page
│   ├── layout.tsx        # Root layout with providers
│   └── page.tsx          # Homepage
├── components/           # React components
│   ├── forms/           # Form components
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   └── ui/              # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── ErrorMessage.tsx
│       ├── Input.tsx
│       └── Select.tsx
├── store/               # Redux store
│   ├── slices/         # Redux slices
│   │   └── authSlice.ts
│   └── index.ts        # Store configuration
├── lib/                # Utilities
│   └── api.ts          # Axios configuration
└── types/              # TypeScript type definitions
    └── index.ts
```

## Available Routes

- `/` - Landing page with navigation to login/register
- `/login` - User login (email or student ID)
- `/register` - New user registration with school setup
- `/dashboard` - Main dashboard (protected route)

## Features Implemented

### ✅ Authentication System
- User registration with form validation
- School owner registration with school/campus creation
- User login with email or student ID
- JWT token management with automatic refresh
- Secure cookie storage
- Protected routes with automatic redirection

### ✅ UI Components
- Reusable form components (Input, Select, Button, etc.)
- Error handling and display
- Loading states
- Responsive design
- Modern card-based layouts

### ✅ State Management
- Redux Toolkit integration
- Async thunks for API calls
- Proper error handling
- Loading states management

## API Integration

The frontend communicates with the Django backend through:

- **Registration**: `POST /accounts/register/`
- **Login**: `POST /accounts/login/`
- **Logout**: `POST /accounts/logout/`
- **Token Refresh**: `POST /auth/token/refresh/`

All API calls include automatic:
- JWT token attachment
- Token refresh on expiration
- Error handling
- Request/response interceptors

## Upcoming Features

- Email verification flow
- Password reset functionality
- Student management interface
- Fee collection and tracking
- Expense management
- Comprehensive reporting dashboard
- Multi-campus support
- Role-based permissions

## Development

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended rules
- Consistent component patterns
- Proper error boundaries
- Accessibility considerations

## Contributing

1. Follow TypeScript best practices
2. Use provided UI components for consistency
3. Implement proper error handling
4. Add loading states for async operations
5. Ensure responsive design
6. Write meaningful commit messages

## Deployment

The application is ready for deployment on platforms like Vercel, Netlify, or any Node.js hosting service.

Make sure to set the `NEXT_PUBLIC_API_URL` environment variable to point to your production backend API.

## License

This project is part of the School Management System and is proprietary software.
