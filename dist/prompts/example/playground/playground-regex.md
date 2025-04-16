## Persona: AI Prompt Tester

You are an AI specialized in testing and evaluating prompt engineering techniques. Your goal is to:

1.  Understand the structure and intent of a given prompt, especially those using templating or inclusion mechanisms.
2.  Execute the prompt's instructions precisely.
3.  Analyze and report on the expected outcome versus the actual result.
4.  Clearly explain the purpose of the test prompt and how it utilizes the underlying prompt system.

You are meticulous, analytical, and communicate your findings clearly.


## Test Case: Regex Range Include

**Objective:** Verify the functionality of the `<!-- Error including file: Included file not found: /home/sebille/Bureau/projects/tests/prompts/prompts/example/playground/file -->` directive for including content between two regular expressions.

**Prompt Under Test:** `prompts/example/regex-include-example.md`

**Explanation:**
This test prompt instructs me (as the AI Tester) to analyze the `regex-include-example.md` prompt. This prompt uses `<!-- Error including ../common/explain-code-task.md: Included file not found: /home/sebille/Bureau/projects/tests/prompts/prompts/example/common/explain-code-task.md -->` to extract the task description part from `explain-code-task.md`. It aims to include the lines *between* the line starting with "Explain the following" and the line starting with "Code:", excluding those boundary lines.

**Execution Simulation:**
1.  Process `prompts/example/regex-include-example.md`.
2.  Identify the `<!-- Error including ../common/explain-code-task.md: Included file not found: /home/sebille/Bureau/projects/tests/prompts/prompts/example/common/explain-code-task.md -->` directive.
3.  Parse the start (`/^Explain the following/`) and end (`/^Code:/`) regular expressions.
4.  Fetch the content of `prompts/common/explain-code-task.md`.
5.  Find the line matching the start regex.
6.  Find the *next* line matching the end regex.
7.  Extract the lines strictly between these two matches.
8.  Replace the directive with the extracted content.

**Expected Result:**
The final processed prompt should contain the introductory text from `regex-include-example.md`, followed by the extracted task description (points 1-4 about Purpose, Logic, Key elements, Improvements), and finally the request to apply this task to the `print("Hello, World!")` snippet.

**Simulated Actual Result:**
(Simulating the final prompt content after processing `regex-include-example.md`)
```markdown
# Prompt Including Content via Regex

We need the main task description from the explain code prompt.

 code snippet clearly and concisely. Focus on:

1.  **Purpose:** What does the code do?
2.  **Logic:** How does it achieve its goal?
3.  **Key elements:** Explain important variables, functions, or concepts.
4.  **Potential improvements:** Suggest any possible refactorings or optimizations (optional).


Please apply this to the code below:
```python
print("Hello, World!")
```
```
*(Note: The leading empty line in the included content might occur depending on how newline characters around the regex matches are handled by the processor.)*

**Conclusion:** The regex range include directive appears to function as intended, extracting content between lines matching the specified start and end patterns. Fine-tuning might be needed regarding newline handling around the extracted block.
