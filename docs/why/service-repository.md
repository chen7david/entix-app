# Why use the Service-Repository pattern?

We use this pattern to separate business logic from data access.

## Reasons
1. **Decoupling**: The Service doesn't care if data comes from D1, a cache, or a mock.
2. **Testability**: You can unit test Service logic by passing a mock Repository.
3. **Consistency**: Changes to the DB schema only require updates to the Repository, not the entire app.
4. **Clean Handlers**: HTTP handlers stay slim, only handling input parsing and output formatting.

Last updated: 2026-03-12
[Back to Documentation Guide](../how-to-write-docs.md)
