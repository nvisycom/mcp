# Contributing

Thank you for your interest in contributing to the Nvisy MCP server.

## Requirements

- Node.js 24.0.0 or higher
- TypeScript 5.9.0 or higher
- npm

## Development Setup

```bash
git clone https://github.com/your-username/mcp.git
cd mcp
npm install
```

## Development

### Scripts

- `npm run build` - Build the package for production
- `npm run dev` - Build in watch mode for development
- `npm test` - Run test suite
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:watch` - Run tests in watch mode
- `npm run inspect` - Run the server under the MCP Inspector
- `npm run lint` - Check code style and quality
- `npm run format` - Format code with Biome
- `npm run check` - Run all linting and formatting checks
- `npm run typecheck` - Verify TypeScript types
- `npm run clean` - Remove build artifacts

### Manual Testing

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) provides a
UI for calling tools against a running server:

```bash
npm run build
NVISY_API_TOKEN=your-api-token npm run inspect
```

### Quality Checks

Before submitting changes:

```bash
npm run check    # Lint, format, and type check
npm test         # Run test suite
npm run build    # Verify build works
```

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run quality checks: `npm run check`
6. Submit a pull request

### Pull Request Checklist

- [ ] Tests pass
- [ ] Code follows project style
- [ ] TypeScript types are correct
- [ ] Documentation updated if needed
- [ ] No breaking changes (or documented)

## Code Standards

- Follow existing TypeScript patterns
- Use native JavaScript private fields (`#`)
- Write tests for new features
- Include JSDoc for public APIs
- Follow semantic versioning for changes

## License

By contributing, you agree your contributions will be licensed under the MIT
License.
