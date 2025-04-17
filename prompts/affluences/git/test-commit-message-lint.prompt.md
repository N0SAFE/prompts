# Test Commit Message Against Linter (Temporary Workflow)

## Objective

This prompt outlines the steps to test a Git commit message against the project's configured commit linter (e.g., commitlint via Husky hooks) without creating a permanent entry in the Git history. This is useful for verifying message format compliance before finalizing a commit.

## Prerequisites

- A Git repository with a commit message linting tool configured (e.g., Husky + commitlint).
- Changes staged or ready to be staged.

## Steps

1.  **Create a Temporary Branch:**
    Switch to a new temporary branch. This isolates the test commit.
    ```bash
    git checkout -b temp-lint-test
    ```

2.  **Stage Changes:**
    Ensure all the changes you intend to include in the commit are staged. If not already staged, use:
    ```bash
    git add .
    ```
    *(Or specify individual files instead of `.`).*

3.  **Attempt the Commit:**
    Execute the commit command with the message you want to test. Replace `"your commit message"` with the actual message.
    ```bash
    git commit -m "your commit message"
    ```

4.  **Observe Linter Output:**
    The commit hook should trigger the linter. Observe the terminal output:
    - **Success:** If the message is valid, the commit will succeed (though we'll undo it).
    - **Failure:** If the message is invalid, the linter will output errors, and the commit will likely be aborted.

5.  **Undo the Temporary Commit:**
    Reset the HEAD back one step, effectively undoing the commit but keeping the changes staged.
    ```bash
    git reset --soft HEAD~1
    ```

6.  **Return to Original Branch:**
    Switch back to the branch you were working on previously.
    ```bash
    git checkout -
    ```
    *(The `-` is a shortcut for the previous branch).*

7.  **Delete Temporary Branch:**
    Clean up by deleting the temporary branch.
    ```bash
    git branch -D temp-lint-test
    ```

## Outcome

After following these steps, you will have tested your commit message against the linter. Your working directory and staging area will be preserved as they were before step 3 (or after step 2 if you staged changes), and you will be back on your original branch. You can now proceed to make the actual commit with a validated message.
