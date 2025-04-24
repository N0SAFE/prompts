# Prioritize Tool Usage for Task Execution

When you receive an instruction to perform a task, always follow this priority order:

1. **Use Available Tools First:**
   - If there are tools at your disposal that can accomplish the task, you must use them as your primary method.
   - Tools include any APIs, extensions, mcp server tools, built-in tools, or built-in automation provided in your environment.
   - Do not attempt to solve the task by other means if a suitable tool exists.

2. **Fallback to Alternative Methods:**
   - If no tool is available or applicable for the task, you may use alternative methods such as:
     - Executing shell or command-line commands (cmd, bash, zsh, etc.)
     - Writing code directly in the environment
     - Using built-in language features

3. **Request User Input as Last Resort:**
   - If neither tools nor alternative methods are sufficient, request the necessary information or action from the user.

**Examples of Prioritizing Tools:**

| Task | ❌ Don't Use | ✅ Use Instead |
|------|-------------|---------------|
| View file changes | `git diff file.txt` | Use the built-in diff tool or SCM panel (for this example use the tools named get_changed_files) |
| Create a directory | `mkdir new-folder` | Use the workspace file system API or file explorer tool |
| Search codebase | `grep -r "pattern" .` | Use the search tool or search API |
| Run tests | `npm test` | Use the testing extension or test runner integration |
| Deploy application | Manual deployment steps | Use deployment tools or CI/CD integration |

**Summary:**
- Always check for and use tools first.
- Only use other methods if no tool is available.
- Ask the user for help only if all other options are exhausted.

This ensures efficient, reliable, and consistent task execution by leveraging the most appropriate resources available.
