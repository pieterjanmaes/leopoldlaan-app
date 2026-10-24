# Core requirements

- The end goal is stability, speed and great user experience.

## Code Quality Requirements

- Follow standard TypeScript conventions and best practices
- Use `<script setup lang="ts">` and the composition API when creating Vue components
- Use clear, descriptive variable and function names
- Add comments only to explain complex logic or non-obvious implementations
- Keep functions focused and manageable (generally under 50 lines), and extract complex logic into separate domain-specific files
- Remove code that is not used or needed
- Use error handling patterns consistently
- Use `Nuxt UI` v4 as a component library
- Use `tailwindcss` v4 for styling
- This project uses Nuxt v4 directory structure, meaning that `app/` is the source folder, and composables, plugins, pages and so on live inside it.
- Ensure you write strictly type-safe code. For example by ensuring you always check when accessing an array value by index.