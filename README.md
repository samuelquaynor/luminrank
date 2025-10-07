# LuminRank - NgRx Authentication System

A production-ready Angular application with JWT authentication, role-based access control, and comprehensive testing setup using NgRx, Cypress, and Jasmine.

## Features

- 🔐 JWT-based authentication with email/password
- 👥 Role-based access control (Admin/User)
- 🏪 NgRx state management for authentication
- 🛡️ Route guards for protected and admin-only pages
- 🔄 HTTP interceptors for automatic token attachment
- 🧪 Comprehensive unit tests with Jasmine
- 🌐 End-to-end tests with Cypress
- 📱 Responsive design with modern UI
- 🚀 Production-ready architecture

## Project Structure

```
src/app/
├── core/
│   ├── guards/           # Route protection guards
│   ├── interceptors/     # HTTP interceptors
│   ├── models/          # TypeScript interfaces
│   └── services/        # Core services
├── features/
│   └── auth/
│       ├── components/  # Auth-related components
│       └── store/       # NgRx store (actions, reducer, effects, selectors)
├── shared/
│   └── components/      # Reusable components
└── store/
    └── app.state.ts     # Root application state

cypress/                 # E2E test files
├── e2e/
│   ├── auth/           # Authentication test suites
│   └── role-based-access.cy.ts
├── fixtures/           # Test data
└── support/            # Custom commands and configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:4200`

### Testing

#### Unit Tests
```bash
npm test                 # Run unit tests once
npm run test:watch      # Run unit tests in watch mode
```

#### E2E Tests
```bash
npm run e2e             # Open Cypress test runner
npm run e2e:run         # Run E2E tests headlessly
```

### Building

```bash
npm run build           # Build for production
```

## Authentication

### Mock Users

The application includes pre-configured mock users for testing:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| admin@example.com | admin123 | Admin | Full access including admin panel |
| user@example.com | user123 | User | Standard user access |
| test@example.com | test123 | User | Additional test user |

### Authentication Flow

1. **Login**: Users can login with email/password
2. **Registration**: New users can create accounts (defaults to User role)
3. **Token Storage**: JWT tokens are stored in localStorage
4. **Auto-refresh**: Tokens are automatically attached to HTTP requests
5. **Session Persistence**: Authentication state persists across page reloads

### Route Protection

- **Public Routes**: `/login`, `/register`
- **Protected Routes**: `/dashboard` (requires authentication)
- **Admin Routes**: `/admin` (requires Admin role)
- **Unauthorized**: `/unauthorized` (access denied page)

## State Management

The application uses NgRx for state management with the following structure:

### Auth State
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}
```

### Key Actions
- `login` - Initiate login process
- `loginSuccess` - Handle successful login
- `loginFailure` - Handle login errors
- `register` - Initiate registration process
- `logout` - Logout user
- `checkAuth` - Verify authentication on app init

### Selectors
- `selectIsAuthenticated` - Check if user is logged in
- `selectUser` - Get current user data
- `selectUserRole` - Get user role
- `selectIsAdmin` - Check if user is admin
- `selectIsLoading` - Check loading state
- `selectError` - Get error messages

## Testing

### Unit Tests

Comprehensive unit tests cover:
- Services (Auth, Storage)
- NgRx store (Actions, Reducer, Effects, Selectors)
- Guards (Auth, Role-based)
- Components (Login, Register)
- HTTP Interceptors

### E2E Tests

Cypress tests cover complete user workflows:
- Login flow with valid/invalid credentials
- Registration flow with validation
- Logout functionality
- Protected route access
- Role-based access control
- Session persistence

### Test Commands

```bash
# Run all unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Open Cypress test runner
npm run e2e

# Run E2E tests headlessly
npm run e2e:run
```

## Custom Cypress Commands

The project includes custom Cypress commands for easier testing:

```typescript
// Login with credentials
cy.login('user@example.com', 'user123');

// Register new user
cy.register('newuser@example.com', 'password123', 'New User');

// Logout current user
cy.logout();

// Check authentication state
cy.checkAuth();
```

## Architecture Decisions

### Why NgRx?
- Predictable state management
- Excellent debugging with Redux DevTools
- Time-travel debugging
- Consistent data flow
- Great for complex applications

### Why Functional Interceptors?
- Modern Angular approach
- Better tree-shaking
- Cleaner dependency injection
- Easier testing

### Why Standalone Components?
- Reduced bundle size
- Better lazy loading
- Simplified module system
- Future-proof architecture

## Production Considerations

### Security
- JWT tokens stored in localStorage (consider httpOnly cookies for production)
- Input validation on both client and server
- XSS protection through Angular's built-in sanitization
- CSRF protection (implement on backend)

### Performance
- Lazy-loaded routes
- OnPush change detection strategy
- Tree-shaking enabled
- Bundle optimization

### Monitoring
- Redux DevTools for state inspection
- Error handling with user-friendly messages
- Loading states for better UX

## Future Enhancements

- [ ] Password reset functionality
- [ ] Email verification
- [ ] Refresh token implementation
- [ ] Social login (Google, GitHub)
- [ ] Multi-factor authentication
- [ ] User profile management
- [ ] Audit logging
- [ ] API rate limiting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.