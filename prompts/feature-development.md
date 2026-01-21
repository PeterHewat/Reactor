# Feature Development

Implement this feature following these guidelines:

- **Requirements Analysis**: Break down the feature into clear, testable requirements
- **Component Design**: Create reusable, composable components using our design system
- **Data Flow**: Use Convex useQuery/useMutation hooks, avoid fetch/axios/useEffect for data
- **State Management**: Use Convex for server state, Zustand for complex client state, useState for local UI state
- **Authentication**: Integrate with Clerk using useConvexAuth() where needed
- **Styling**: Use Tailwind CSS with our cn() utility for class merging
- **Type Safety**: Strict TypeScript, use Convex schema validation with v.object({})
- **Error Handling**: Proper error states, loading states, and user feedback
- **Accessibility**: Semantic HTML, ARIA attributes, keyboard navigation
- **Testing**: Write unit tests (Vitest) and E2E tests (Playwright) alongside implementation
- **Documentation**: Update relevant docs in docs/ folder for architectural changes

Ensure the implementation:

- Follows the monorepo structure (apps/web/, packages/ui/, packages/utils/)
- Adheres to React 19 patterns and best practices
- Is mobile-responsive and follows our design system
- Handles loading and error states gracefully
