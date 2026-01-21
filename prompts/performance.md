# Performance Optimization

Optimize this code for better performance:

- **React Performance**: Minimize re-renders, use React.memo, useMemo, useCallback appropriately
- **Bundle Size**: Reduce JavaScript bundle size through code splitting and tree shaking
- **Data Fetching**: Optimize Convex queries, implement proper caching and pagination
- **Images & Assets**: Implement lazy loading, optimize image sizes and formats
- **Core Web Vitals**: Improve LCP, FID, and CLS metrics
- **Network**: Minimize HTTP requests, implement efficient data loading patterns
- **Memory Management**: Prevent memory leaks, clean up event listeners and subscriptions
- **Rendering**: Optimize CSS, reduce layout thrashing, minimize DOM manipulations
- **Loading States**: Implement skeleton screens and progressive loading
- **Caching**: Leverage browser caching and Convex's built-in caching

Specific optimizations to consider:

- Virtualization for long lists
- Debouncing/throttling for user inputs
- Prefetching for anticipated user actions
- Service workers for offline functionality
- Webpack/Vite bundle analysis and optimization

Measure performance improvements:

- Use browser DevTools Performance tab
- Lighthouse audits
- Real User Monitoring (RUM) metrics
- Bundle analyzer reports
