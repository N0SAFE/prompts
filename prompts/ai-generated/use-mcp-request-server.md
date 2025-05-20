# Using the MCP Request Server for Interactive Workflows

You have access to an MCP request server that allows you to interactively gather information or actions from users or systems. Use this server whenever you need additional context, clarification, or user input that cannot be determined from the current data or codebase alone.

## When to Use the MCP Request Server

Use the MCP request server in the following scenarios:

- When you need to prompt the user for information (e.g., preferences, missing parameters, choices).
- When you need to orchestrate a sequence of user/system actions that require responses.
- When you want to group multiple related requests and manage them as a batch.

## How to Use the MCP Request Server

Follow this process to interact with the MCP request server:

1. **Register a Request:**
   - Use the appropriate tool (e.g., `register_request`) to create a prompt or action for the user/system. This returns a request ID.
2. **Register a Container (if needed):**
   - If you need to group multiple requests, use a container tool (e.g., `register_container`).
3. **Wait for Completion:**
   - Use the corresponding wait tool (e.g., `request_wait` or `container_wait`) with the returned ID to block until the request or container is completed or an error occurs.
   - For convenience, you can use `register_request_wait` or `register_container_wait` to both register and wait for completion in a single step.
4. **Provide Valid Input:**
   - Always provide valid input objects as described in the tool schemas.
5. **Handle Errors:**
   - Handle errors as returned by the tool responses.

## Example Workflow

1. Register a request for missing user input using `register_request`.
2. Wait for the user's response with `request_wait`.
3. If multiple related requests are needed, group them with `register_container` and wait for all with `container_wait`.
4. Process the results or handle any errors as needed.

## Summary

Use the MCP request server to gather missing information, prompt users, or coordinate multi-step workflows. Register requests or containers as needed, wait for their completion, and process the results or errors accordingly. This enables robust, interactive, and user-driven automation in your workflows.
