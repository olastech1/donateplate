import sys

def check_brackets(filepath):
    with open(filepath, 'r') as f:
        text = f.read()

    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    line_no = 1
    col_no = 0

    for i, char in enumerate(text):
        if char == '\n':
            line_no += 1
            col_no = 0
        else:
            col_no += 1

        if char in pairs.keys():
            stack.append((char, line_no, col_no))
        elif char in pairs.values():
            if not stack:
                print(f"Error: unmatched {char} at line {line_no}, col {col_no}")
                return
            top_char, top_line, top_col = stack.pop()
            if pairs[top_char] != char:
                print(f"Error: mismatched {char} at line {line_no}, col {col_no}. Expected {pairs[top_char]} to close {top_char} from line {top_line}")
                return

    if stack:
        print(f"Error: unclosed brackets: {stack}")
    else:
        print("All brackets match.")

check_brackets('client/src/pages/CampaignPage.jsx')
