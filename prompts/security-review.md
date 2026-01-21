# Security Review

Analyze this code for security vulnerabilities:

- **Authentication & Authorization**: Verify proper Clerk integration and access controls
- **Data Validation**: Ensure all inputs are validated using Convex schema validation
- **XSS Prevention**: Check for potential Cross-Site Scripting vulnerabilities
- **CSRF Protection**: Verify protection against Cross-Site Request Forgery
- **SQL Injection**: Review database queries for injection vulnerabilities
- **Secrets Management**: Ensure no secrets are exposed in client-side code
- **HTTPS**: Verify all communications use secure protocols
- **Content Security Policy**: Review CSP headers and implementation
- **Dependency Vulnerabilities**: Check for known vulnerabilities in dependencies
- **Error Handling**: Ensure errors don't leak sensitive information

Frontend-specific security concerns:

- Sanitize user inputs before rendering
- Validate data from API responses
- Implement proper logout and session handling
- Secure localStorage/sessionStorage usage
- Protect against clickjacking with frame options

Backend/Convex security:

- Proper input validation in mutations and actions
- Correct use of internalQuery/internalMutation
- Rate limiting and abuse prevention
- Secure environment variable handling
- Audit logging for sensitive operations

Provide specific recommendations:

- Code changes needed to address vulnerabilities
- Security testing strategies
- Monitoring and detection mechanisms
- Documentation updates for security practices
