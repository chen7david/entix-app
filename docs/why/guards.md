# Why use Guards?

Guards provide a declarative way to handle authorization and data requirements.

## Benefits
1. **Security by Default**: Wrapping a set of routes in a guard ensures no sub-route is accidentally left public.
2. **Simplified Components**: Components don't need to check for sessions or memberships themselves; they can assume the data is present.
3. **UX**: Guards handle redirects and loading states in one place, providing a consistent experience.

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
