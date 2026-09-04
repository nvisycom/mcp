# Makefile for Nvisy.com MCP server

ifneq (,$(wildcard ./.env))
	include .env
	export
endif

# Make-level logger (evaluated by make; does not invoke the shell)
define make-log
$(info [$(shell date '+%Y-%m-%d %H:%M:%S')] [MAKE] [$(MAKECMDGOALS)] $(1))
endef

# Default target
.PHONY: help
help:
	$(call make-log,Available targets:)
	@echo "  build     - Build the package"
	@echo "  test      - Run tests"
	@echo "  check     - Run lint, format and type checks"
	@echo "  inspect   - Run the server under the MCP Inspector"
	@echo "  clean     - Remove build artifacts and temporary files"

# Build the package
.PHONY: build
build:
	$(call make-log,Building...)
	@npm run build
	$(call make-log,Build complete)

# Run tests
.PHONY: test
test:
	$(call make-log,Running tests...)
	@npm run test
	$(call make-log,Tests complete)

# Run lint, format and type checks
.PHONY: check
check:
	$(call make-log,Running checks...)
	@npm run check
	@npm run typecheck
	$(call make-log,Checks complete)

# Run the server under the MCP Inspector for manual tool testing
.PHONY: inspect
inspect: build
	$(call make-log,Starting MCP Inspector...)
	@npm run inspect

# Clean build artifacts and temporary files
.PHONY: clean
clean:
	$(call make-log,Cleaning build artifacts...)
	@rm -rf dist/
	@rm -rf node_modules/.cache/
	@rm -rf coverage/
	@rm -rf docs/
	$(call make-log,Clean complete)
