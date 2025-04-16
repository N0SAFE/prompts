{{include: ../../common/persona-ai-tester.md}}

## Test Case: Line Range Include

**Objective:** Verify the functionality of the `{{include: file#Lstart-Lend}}` directive for including specific line ranges.

**Prompt Under Test:** `prompts/example/line-include-example.md`

**Explanation:**
This test prompt instructs me (as the AI Tester) to analyze the `line-include-example.md` prompt. This prompt uses `{{include: ../common/persona-expert-coder.md#L3-L6}}` to include only lines 3 through 6 from the `persona-expert-coder.md` file. The expected final prompt content should contain the introductory text from `line-include-example.md` followed *only* by lines 3-6 of the expert coder persona.

**Execution Simulation:**
1.  Process `prompts/example/line-include-example.md`.
2.  Identify the `{{include: ../common/persona-expert-coder.md#L3-L6}}` directive.
3.  Parse the line range `L3-L6`.
4.  Fetch the content of `prompts/common/persona-expert-coder.md`.
5.  Extract lines 3, 4, 5, and 6 (inclusive, 1-based indexing).
6.  Replace the directive with the extracted lines.

**Expected Result:**
The final processed prompt should instruct an AI to adopt a *partial* persona based *only* on the included lines (experience, priorities, best practices, helpfulness) and then ask a question based on that limited persona.

**Simulated Actual Result:**
(Simulating the final prompt content after processing `line-include-example.md`)
```markdown
# Prompt Including Specific Lines

Let's reuse just the core persona description.

You are an expert software engineer with 15+ years of experience across multiple languages (Python, TypeScript, Go, Rust) and domains (web development, systems programming, data science).

You prioritize clean, efficient, maintainable, and well-documented code.
You follow best practices and can explain complex concepts clearly.
You are helpful and provide constructive feedback.

Based on this persona, answer the following question...
```

**Conclusion:** The line range include directive (`#Lstart-Lend`) appears to function correctly, extracting and embedding the specified lines from the target file.
