# Tool Discovery and Enabling Process for LLMs

When starting a reasoning or task execution process, always ensure you have access to all the tools you might need. When you want to search for more information or perform a specific action, you should always first check if a tool exists for this purpose, instead of directly calling a command or writing code for this kind of work. Only use a command or code as a fallback if no suitable tool is available.

Once you have enabled the tools you need, you are allowed to use them directly in your reasoning and actions without requesting further permission from the user. You should proceed to use all enabled tools as required to accomplish your task efficiently.

When enabling tools, you should only attempt to enable the tools that are actually needed for your reasoning or task, not all available tools. Carefully determine which tools are required for your current objective, and enable only those. This ensures efficiency and avoids unnecessary activation of unrelated tools.

Follow this procedure to discover and enable tools:

## 1. Tool Discovery
* Begin by reasoning about what kind of tool could provide discovery or enabling capabilities for the type of tool you need, even if it is not explicitly named `tool_discover`.
* Sometimes, discovery tools may have names that are prefixed or suffixed by the name of the MCP server or another context-specific identifier (e.g., `mcp_tool_discover`, `tool_discover_mcp`, etc.).
* Use the context (such as tool naming conventions, prefixes, or suffixes) to infer what discovery or enabling tools might exist before calling any listing tool.
* If you find a tool that can list or enable other tools (even if not named exactly `tool_discover`), use it for discovery and enabling.
* The discovery tool should ideally provide at least two capabilities:
  1. **List all enabled and available tools** (e.g., `list_available_toolsets`, `mcp_list_available_toolsets`, etc.).
  2. **Enable new tools** (e.g., `enable_toolset`, `mcp_enable_toolset`, etc.).

## 2. Listing Tools
- Always start by listing all the toolsets or tools that can be enabled, using the appropriate listing tool.
- Retrieve the full list of both enabled and available (but not yet enabled) tools.

## 3. Enabling Tools
- Only attempt to enable tools that are directly relevant to your current task objectives.
- If after discovering available tools, none match what you need to accomplish your task, do not enable tools simply because they exist.
- Always have a clear purpose for each tool you enable - never enable tools "just because you can."
- If possible, enable all required tools in a single request.
- If not possible, make multiple requests to enable each tool until all needed ones are enabled.
- Only proceed with your main reasoning or task after all necessary tools are enabled.

## 4. Timing of Tool Discovery
- This discovery and enabling process should be performed **at the very start** of your reflection or reasoning process.
- This ensures you have access to the full set of capabilities before making decisions or taking further actions.

## 5. Example Workflow
1. Use your reasoning and context clues (including tool naming conventions and MCP server prefixes/suffixes) to identify the most likely discovery/listing tool.
2. Use this tool to list all available/enabled toolsets.
3. Identify which toolsets are not yet enabled but are needed for your task. If no listed tools match your needs, proceed without enabling anything new.
4. Use the enabling tool to activate only the required toolsets (preferably in one request).
5. Confirm that all needed tools are now enabled before proceeding.

**Summary:**
- Always check for and enable only the relevant tools needed for your specific task.
- If no discovered tools match your task requirements, proceed without enabling new tools.
- Use context clues, naming conventions, and available information to reason about what discovery/enabling tools may exist, even if their names are not exact matches.
- Use the discovery and enabling tools systematically to maximize your capabilities.
- Do not start your main reasoning or execution until you have confirmed all necessary tools are enabled.
- Never enable tools simply because they exist - each enabled tool should have a clear purpose related to your task.
