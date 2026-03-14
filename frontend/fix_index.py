import re

with open('d:/Ruben/Sublab/frontend/src/index.css', 'r', encoding='utf-8') as f:
    content = f.read()

# removing everything after the .gap-lg block until the end, and then we will re-add .glass but without the dark mode wrapper

# Actually, I can just use string slicing since I know exactly what was added.

base_idx = content.find('@media (prefers-color-scheme: dark)')
if base_idx != -1:
    clean_content = content[:base_idx].strip()
    
    # Add back the .glass without the dark mode
    clean_content += '\n\n.glass {\n  background: rgba(255, 255, 255, 0.15);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-top: 1px solid rgba(255, 255, 255, 0.2);\n}\n'
    
    with open('d:/Ruben/Sublab/frontend/src/index.css', 'w', encoding='utf-8') as f:
        f.write(clean_content)
    print("Fixed!")
else:
    print("Not found.")
