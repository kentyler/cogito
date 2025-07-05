#!/usr/bin/env python3

import sys
import subprocess

# Try to extract text from PDF using various methods
pdf_path = "/mnt/c/Users/Ken/Desktop/claudestuff/Group Chat with Cogito Claude - 2025_06_24 13_52 EDT - Notes by Gemini (1).pdf"

# Method 1: Try using strings command as a fallback
try:
    result = subprocess.run(['strings', pdf_path], capture_output=True, text=True)
    if result.returncode == 0:
        # Filter for readable text
        lines = result.stdout.split('\n')
        readable_lines = []
        for line in lines:
            # Filter lines that look like actual text content
            if len(line) > 10 and not line.startswith('%') and not line.startswith('<<'):
                # Basic check for readable ASCII text
                if all(ord(c) < 128 or c.isspace() for c in line[:50]):
                    readable_lines.append(line)
        
        print('\n'.join(readable_lines))
    else:
        print("Error reading PDF file")
except Exception as e:
    print(f"Error: {e}")