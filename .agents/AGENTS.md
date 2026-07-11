# Project Rules and Conventions

## Backend
- **Routing**: RESTful routes should be defined under `/api/{resource}`.
- **Architecture**: Keep controllers thin and services thick. Business logic belongs in the `services/` layer.
- **Error Handling**: Async errors must be handled via a centralized error-handling middleware. Do not use unhandled `try/catch` per route.
- **Models**: Define Mongoose schemas in `src/models` with TypeScript-style JSDoc or interfaces for better type hinting.

## Auth
- **Tokens**: Use JWT stored in an `httpOnly` cookie.
- **Roles**: The `role` field on `User` must be one of `"tenant" | "owner" | "admin"`.
- **Middleware**: Use `protect()` to ensure the user is authenticated, and `authorize(...roles)` for route guards.

## Frontend
- **Components**: Use functional components and hooks only (no class components).
- **Styling**: Use TailwindCSS for all styling.
- **API Requests**: Create and use an Axios instance with the `baseURL` configured from the environment (`import.meta.env`).
- **State Management**: Use React Context for authentication state.

## Git
- Use conventional commits (`feat:`, `fix:`, `chore:`, etc.).

## Security
- **NEVER** hardcode secrets in the source code. Always use `process.env`.
