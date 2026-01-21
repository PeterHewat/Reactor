# Prompt Templates

This directory contains standardized prompt templates for AI-assisted development workflows. These templates ensure consistent, comprehensive guidance for common development tasks.

## Available Prompts

### Core Development

- **[refactor.md](refactor.md)** - Comprehensive code refactoring with anti-pattern detection
- **[feature-development.md](feature-development.md)** - Complete feature implementation guide
- **[bug-fix.md](bug-fix.md)** - Systematic debugging and fixing approach

### Quality Assurance

- **[code-review.md](code-review.md)** - Thorough code review criteria and checklist
- **[testing.md](testing.md)** - Testing strategy for Vitest + Playwright
- **[performance.md](performance.md)** - Performance optimization guidelines
- **[security-review.md](security-review.md)** - Security vulnerability assessment
- **[accessibility.md](accessibility.md)** - WCAG 2.1 accessibility compliance

### Documentation & Architecture

- **[documentation.md](documentation.md)** - Comprehensive documentation standards
- **[architecture-decision.md](architecture-decision.md)** - Decision-making framework for architectural choices

## How to Use

### 1. Direct Reference

Reference the relevant prompt when asking AI assistants for help:

```
Please review this code following the guidelines in prompts/code-review.md
```

### 2. Partial Usage

Reference specific sections for targeted assistance:

```
Help me refactor this component focusing on the "Anti-Pattern Detection & Elimination"
section from prompts/refactor.md
```

### 3. Team Standards

Use these prompts to establish consistent development standards across your team. They encapsulate best practices specific to our tech stack:

- **React 19** patterns and performance
- **Convex** data fetching with useQuery/useMutation
- **Clerk** authentication integration
- **TypeScript** strict typing and validation
- **Tailwind CSS** with cn() utility patterns
- **Monorepo** structure and organization

## Customization

These templates are designed for our specific tech stack but can be adapted:

1. **Fork for your stack** - Modify technology-specific sections
2. **Add project-specific rules** - Include your team's coding standards
3. **Extend with examples** - Add code examples relevant to your domain
4. **Create new templates** - Follow the same comprehensive format for other workflows

## Integration with Development Workflow

### Code Reviews

Use [code-review.md](code-review.md) as a checklist during PR reviews to ensure comprehensive coverage.

### Feature Planning

Reference [feature-development.md](feature-development.md) during sprint planning to estimate complexity and identify requirements.

### Technical Debt

Apply [refactor.md](refactor.md) during tech debt sprints to systematically improve code quality.

### Architecture Decisions

Document significant decisions using [architecture-decision.md](architecture-decision.md) and store outcomes in `docs/adr/`.

## Best Practices

1. **Be Specific** - Reference the exact prompt sections relevant to your request
2. **Combine Prompts** - Use multiple templates together (e.g., refactor + performance + security)
3. **Update Regularly** - Keep prompts current with evolving best practices and tech stack updates
4. **Share Context** - Provide relevant code, requirements, or constraints when using prompts
5. **Validate Results** - Always review AI suggestions against your project's specific needs

## Contributing

When adding new prompts:

- Follow the established format with clear sections and bullet points
- Include tech stack specific guidance
- Provide actionable, specific recommendations
- Add comprehensive coverage of the topic area
- Update this README with the new prompt description
