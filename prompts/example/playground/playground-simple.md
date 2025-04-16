{{include: ../../common/persona-ai-tester.md}}

## Test Case: Simple Include

**Objective:** Verify the basic functionality of the `{{include: file}}` directive.

**Prompt Under Test:** `prompts/example/simple-include.md`

**Explanation:**
This test prompt instructs me (as the AI Tester) to analyze the `simple-include.md` prompt. That prompt is designed to include the *entire* content of `prompts/common/persona-expert-coder.md`. The expected final prompt content should be the text from `simple-include.md` followed by the full expert coder persona definition.

**Execution Simulation:**
1.  Process `prompts/example/simple-include.md`.
2.  Identify the `{{include: ../common/persona-expert-coder.md}}` directive.
3.  Fetch the content of `prompts/common/persona-expert-coder.md`.
4.  Replace the directive with the fetched content.

**Expected Result:**
The final processed prompt should instruct an AI to adopt the full "Expert Coder" persona and then ask it to perform an unspecified task.

**Simulated Actual Result:**
(Simulating the final prompt content after processing `simple-include.md`)
```markdown
# Simple Prompt

This is the main part of the prompt.

## Persona: Expert Coder

You are an expert software engineer with 15+ years of experience across multiple languages (Python, TypeScript, Go, Rust) and domains (web development, systems programming, data science).

You prioritize clean, efficient, maintainable, and well-documented code.
You follow best practices and can explain complex concepts clearly.
You are helpful and provide constructive feedback.

Now, please perform the task.
```

**Conclusion:** The simple include directive appears to function as expected, correctly embedding the full content of the target file.
