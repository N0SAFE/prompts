# Search for Issues or Merge Requests

When you see a reference like `JIRA:Something`, `GITHUB:Something`, `GITLAB:Something`, or `FIGMA:Something`, you should search the appropriate provider for the issue, merge request, or design to help resolve the conversation. 

## General Behavior

These references act like links to external data where you can search to have more information about the context of the conversation.
When collecting data from external sources, prioritize maximizing efficiency by retrieving the maximum amount of results allowed in a single request. For example, when fetching issues from a JIRA epic or GitHub repository, use pagination parameters to request the highest permissible number of items per page to minimize the number of API calls needed. If the number of results is equal to the maximum number of items per page, you should assume that there are more results and continue to paginate until you reach the end of the results.

When you receive links to any supported service (JIRA, GitHub, GitLab, Figma, Confluence) in the response from a tool call, you should call additional appropriate tools to gather more information from those links as needed. This allows you to follow references across different systems to build comprehensive context.

## GitHub Search Behavior

When encountering a GitHub reference (e.g., `GITHUB:1234`):
- By default, search for both issues AND pull requests with the provided ID, unless specifically requested otherwise
- Repository search logic:
  - If no repository is specified:
    1. First, try to guess the repository from the current codebase context
    2. If not found, search through the user's owned repositories
    3. Use conversation context and recent activity to identify the most relevant repository
  - If a repository name is provided without an author:
    - Search exclusively within the user's own repositories using the provided name unless the user specifies otherwise or the conversation context indicates a different repository
    - Example: If user mentions "myapp", search in user's repository named "myapp"
  - If a GitHub username is mentioned without a repository:
    - Analyze the conversation context to determine the most likely repository
    - Consider user's recent activity and repository interactions
    - Look for repository references in the current codebase
    - Example: If discussing "octocat's authentication system", look for repositories related to authentication
  - If you do not know the current user or organization, search through the user's owned repositories or request it from the user

Examples:
- `GITHUB:1234` - Search for both issue and PR #1234 in the most relevant repository based on context
- `GITHUB:myapp/1234` - Search in user's own "myapp" repository for issue/PR #1234
- `GITHUB:octocat/1234` - When discussing a GitHub user, determine the most relevant repository based on context

## GitLab Search Behavior

When encountering a GitLab reference (e.g., `GITLAB:5678`):
- Search within the codebase for relevant information
- If no repository name is specified:
  - Attempt to identify the relevant repository within the organization's projects
  - Use context clues from the conversation to narrow down the search

Example: `GITLAB:5678` will search for issue or merge request #5678 in the most relevant repository.

## JIRA Search Behavior

When encountering a JIRA reference (e.g., `JIRA:PR-1212`):
- Search for the ticket with the specified ID in the connected JIRA instance
- Retrieve detailed ticket information including status, assignee, and description
- If the ticket is part of an epic, retrieve the epic information
- Retrieve all related tickets or linked issues to provide context
- Retrieve the history of the ticket to understand its evolution
- Retrieve all links inside the ticket to provide context
- If no JIRA instance is connected, prompt the user to provide the necessary connection details
- If the ticket ID is not in the expected format, prompt the user to clarify the ticket ID

Example: `JIRA:PR-1212` will fetch information about ticket PR-1212 from JIRA.

## Confluence Search Behavior

When encountering a Confluence reference (e.g., `CONFLUENCE:PageTitle` or `CONFLUENCE:spaceKey/PageTitle`):
- Search for the specified page in the connected Confluence instance
- Retrieve full page content, including formatted text, tables, and lists
- Fetch metadata such as creator, last modifier, and creation/modification dates
- Identify and retrieve information about any child pages or related content
- Extract any embedded JIRA tickets, GitHub issues, or other cross-references
- If a space key is provided, limit the search to that specific Confluence space
- If no Confluence instance is connected, prompt the user for connection details

Example: `CONFLUENCE:DEV/Architecture` will fetch the "Architecture" page from the "DEV" space in Confluence.

## Figma Search Behavior

When encountering a Figma reference (e.g., `FIGMA:designID` or `FIGMA:fileName`):
- Connect to the Figma API with the provided credentials
- Search for the specified design file by ID or name
- Retrieve file metadata including version history, collaborators, and last modified date
- Extract all frames, components, and design elements with their properties
- Capture design system information such as color styles, text styles, and component variants
- Download image renderings of key frames for visual reference
- Parse any embedded documentation or annotations within the design
- If only a partial identifier is provided, search across the user's recent or starred files
- If no Figma credentials are available, prompt the user to provide them

Examples:
- `FIGMA:Xyzabc123` - Retrieve design file with ID "Xyzabc123"
- `FIGMA:Mobile App Redesign` - Search for file with name "Mobile App Redesign"

## Additional Context

Please use the appropriate tools and APIs provided by JIRA, GitHub, GitLab, Confluence, or Figma to fetch the relevant information. The search should be intelligent and context-aware, attempting to find the most relevant information based on:

1. Current workspace context
2. User's repositories, organizations, or spaces
3. Conversation context
4. Recent activity
5. Repository/project relationships and dependencies

When you discover links to other services within retrieved content (e.g., a JIRA ticket contains a Figma link, or a GitHub issue references a Confluence page), you should automatically fetch that additional information using the appropriate tools to build complete context. Follow these cross-service references to gather all relevant information needed to provide comprehensive assistance.

This helps ensure that the most relevant results are returned even when minimal information is provided in the reference.
