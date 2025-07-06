import requests
import os
from datetime import datetime
api_key = os.environ['CLAUDE']
def ask_claude_for_fix(code_to_fix, problem_description=""):
    message = f"""
    Please fix this code and provide the complete corrected version:
    Problem: {problem_description}
    Code:
    {code_to_fix}
    Please respond with just the fixed code, no explanations.
    """
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 4000,
            "messages": [{"role": "user", "content": message}]
        }
    )
    return response.json()['content'][0]['text']
def save_suggestion(original_file, fixed_code, problem=""):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    suggestion_file = f"claude_suggestion_{timestamp}.jsx"
    with open(suggestion_file, 'w') as f:
        f.write(f"// Claude's suggestion for: {original_file}\n")
        f.write(f"// Problem: {problem}\n")
        f.write(f"// Generated: {timestamp}\n\n")
        f.write(fixed_code)
    print(f"Suggestion saved to: {suggestion_file}")
    return suggestion_file
def fix_my_code(filename, problem_description=""):
    with open(filename, 'r') as f:
        current_code = f.read()
    print("Asking Claude to fix your code...")
    fixed_code = ask_claude_for_fix(current_code, problem_description)
    suggestion_file = save_suggestion(filename, fixed_code, problem_description)
    print(f"Original file: {filename}")
    print(f"Suggestion file: {suggestion_file}")
    print("Review the suggestion file, then copy what you like!")

fix_my_code("project-table.tsx", "Fix React performance issues, split into smaller components, add proper error handling, and follow React best practices")