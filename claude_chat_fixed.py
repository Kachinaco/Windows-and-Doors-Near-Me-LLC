import requests
# Get your API key from console.anthropic.com
import os
api_key = os.environ['CLAUDE']

def talk_to_claude(message):
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
      headers={
          "x-api-key": api_key,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
      },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1000,
            "messages": [{"role": "user", "content": message}]
        }
    )
    return response.json()

# Test it out!
# Breaking the long string into a more readable format and fixing the division by zero bug
code_to_analyze = """def calculate_average(numbers): 
    if not numbers:  # Fix: Handle empty list to prevent division by zero
        return 0
    total = 0
    for num in numbers: 
        total += num
    return total / len(numbers)

my_list = [1, 2, 3, 4, 5]
print(calculate_average(my_list))"""

result = talk_to_claude(f"Can you find and fix any bugs in this Python code: {code_to_analyze}")
print(result)