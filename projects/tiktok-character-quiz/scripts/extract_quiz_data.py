# extract_quiz_data.py
# Extract and analyze quiz data from Effect House subgraph files
# This helps understand the data structure before automation

import struct
import zlib
import json
import os
import sys

def extract_strings_from_binary(filepath):
    """Extract readable strings from binary file"""
    strings = []
    current = []
    with open(filepath, 'rb') as f:
        byte = f.read(1)
        while byte:
            if 32 <= ord(byte) <= 126:
                current.append(byte.decode('ascii'))
            else:
                if len(current) > 4:  # Only keep strings > 4 chars
                    strings.append(''.join(current))
                current = []
            byte = f.read(1)
    return strings

def try_parse_subgraph(filepath):
    """Try to parse subgraph file as JSON or decompress"""
    with open(filepath, 'rb') as f:
        data = f.read()

    # Try zlib decompression
    try:
        decompressed = zlib.decompress(data)
        print(f"[+] Decompressed {len(data)} bytes -> {len(decompressed)} bytes")
        return decompressed
    except:
        pass

    # Try reading as text
    try:
        text = data.decode('utf-8')
        if '{' in text:
            print(f"[+] File contains JSON-like structure")
            # Find JSON objects
            start = text.find('{')
            if start != -1:
                json_str = text[start:]
                try:
                    obj = json.loads(json_str)
                    print(f"[+] Parsed as JSON!")
                    return obj
                except:
                    pass
    except:
        pass

    return None

def analyze_subgraph(filepath):
    """Analyze subgraph file structure"""
    print(f"\n{'='*60}")
    print(f"ANALYZING: {filepath}")
    print(f"{'='*60}")

    filesize = os.path.getsize(filepath)
    print(f"File size: {filesize:,} bytes")

    # Extract strings
    strings = extract_strings_from_binary(filepath)
    print(f"\nExtracted {len(strings)} string fragments")

    # Look for interesting patterns
    keywords = ['question', 'answer', 'result', 'quiz', 'score', 'type', 'label', 'text']
    found = {}
    for s in strings:
        lower = s.lower()
        for kw in keywords:
            if kw in lower:
                if kw not in found:
                    found[kw] = []
                found[kw].append(s)

    print("\nKeywords found:")
    for kw, matches in found.items():
        print(f"  {kw}: {len(matches)} occurrences")
        for m in matches[:5]:
            print(f"    - {m[:80]}")

    # Try parsing
    parsed = try_parse_subgraph(filepath)
    if parsed:
        if isinstance(parsed, dict):
            print("\n[+] JSON Structure:")
            print(json.dumps(parsed, indent=2)[:2000])
        else:
            # Try to find strings in decompressed data
            try:
                text = parsed.decode('utf-8', errors='ignore')
                print("\n[+] Decompressed text preview:")
                print(text[:2000])
            except:
                pass

def main():
    if len(sys.argv) < 2:
        print("""
EFFECT HOUSE SUBGRAPH ANALYZER
==============================
Usage: python extract_quiz_data.py <subgraph_file>

Example:
  python extract_quiz_data.py "QuizGame.ssubgraph"
        """)
        return

    filepath = sys.argv[1]
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    analyze_subgraph(filepath)

if __name__ == "__main__":
    main()
