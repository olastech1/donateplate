def find_mismatch(filepath):
    with open(filepath, 'r') as f:
        text = f.read()
    stack = []
    lines = text.split('\n')
    for line_idx, line in enumerate(lines):
        # strip comments to avoid false positives (very naive, but might help)
        # assuming no complex block comments across brackets
        if '//' in line:
            line = line.split('//')[0]
            
        for col_idx, char in enumerate(line):
            if char in '({':
                stack.append((char, line_idx + 1))
            elif char in ')}':
                if not stack:
                    print(f"Unexpected {char} at line {line_idx+1}")
                    continue
                top_char, top_line = stack.pop()
                if (char == ')' and top_char != '(') or (char == '}' and top_char != '{'):
                    print(f"Mismatch: found {char} at line {line_idx+1}, expected to close {top_char} from line {top_line}")
    for char, line in stack:
        print(f"Unclosed {char} from line {line}")

find_mismatch('client/src/pages/CampaignPage.jsx')
