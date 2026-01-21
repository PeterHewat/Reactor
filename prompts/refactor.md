# Refactor

Refactor this code comprehensively, prioritizing improvement over preservation:

## Core Principles

- **Don't preserve buggy structure** - Rebuild problematic patterns rather than patching them
- **Identify and eliminate anti-patterns** - Detect common code smells and architectural issues
- **Prioritize clarity over familiarity** - Choose better patterns even if they require more changes
- **Strong emphasis on simplicity and elegance** - Favor readable, maintainable solutions

## Areas of Focus

### Code Quality & Architecture

- **Modularity and separation of concerns** - Each module should have a single, well-defined responsibility
- **Code readability and maintainability** - Clear naming, logical organization, comprehensive comments
- **Type safety and error handling** - Strict TypeScript usage, proper error boundaries and validation
- **Performance and efficiency** - Optimize re-renders, bundle size, and data fetching patterns
- **Design patterns** - Apply appropriate patterns (composition over inheritance, dependency injection, etc.)

### Tech Stack Compliance

- **React 19 best practices** - Modern hooks usage, proper component patterns, performance optimizations
- **Convex integration** - Use useQuery/useMutation exclusively, avoid fetch/axios/useEffect for data
- **TypeScript optimization** - Leverage advanced types, strict configuration, proper inference
- **Tailwind CSS** - Consistent utility usage with cn() helper, responsive design patterns
- **Monorepo structure** - Proper package boundaries, shared utilities, consistent patterns

### Anti-Pattern Detection & Elimination

- **React anti-patterns** - Unnecessary useEffect, prop drilling, component bloat, missing memoization
- **State management issues** - Mixed state concerns, improper lifting, side effect leaks
- **Data fetching problems** - Race conditions, stale closures, inefficient queries, missing error handling
- **TypeScript violations** - any usage, unsafe assertions, missing validations, weak typing
- **Performance bottlenecks** - Expensive operations in render, memory leaks, unnecessary re-renders
- **Security vulnerabilities** - XSS risks, improper validation, exposed secrets, unsafe operations

### Structural Improvements

- **Component decomposition** - Break down large components into focused, reusable pieces
- **Custom hooks extraction** - Extract reusable logic into well-tested hooks
- **Utility functions** - Create pure, testable utility functions for complex operations
- **Error boundaries** - Implement proper error handling and user feedback
- **Loading states** - Add skeleton screens and progressive loading
- **Accessibility** - Ensure WCAG 2.1 compliance and keyboard navigation

### Cleanup & Organization

- **Dead code removal** - Eliminate unused imports, variables, functions, and components
- **Dependency optimization** - Remove unused dependencies, update outdated packages
- **File organization** - Logical folder structure, consistent naming conventions
- **Import/export cleanup** - Organize imports, use barrel exports, avoid default exports where inappropriate
- **Documentation updates** - Add JSDoc comments, update README files, document breaking changes

## Refactoring Strategy

1. **Analyze the current structure** - Identify pain points, bottlenecks, and anti-patterns
2. **Design the improved architecture** - Plan the target state before implementing changes
3. **Refactor incrementally** - Make focused changes that can be tested and validated
4. **Ensure backward compatibility** - Unless explicitly breaking changes, maintain API compatibility
5. **Add comprehensive tests** - Cover new functionality and prevent regressions
6. **Update documentation** - Reflect architectural changes and new patterns

## Success Criteria

- Code is more readable and self-documenting
- Components are smaller, focused, and reusable
- Performance has improved or remained stable
- Type safety has increased
- Technical debt has decreased
- Test coverage has improved
- Team velocity should increase over time
