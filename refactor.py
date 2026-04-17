import os, re, json

with open('frontend/src/App.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

app_body = ''.join(lines[493:1714])

def get_exports(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    funcs = re.findall(r'export (?:async )?function ([A-Za-z0-9_]+)', content)
    consts = re.findall(r'export const ([A-Z0-9_a-z]+)', content)
    return set(funcs + consts)

file_exports = {}
file_exports['constants.js'] = get_exports('frontend/src/constants.js')
file_exports['utils.js'] = get_exports('frontend/src/utils.js')

for root, dirs, files in os.walk('frontend/src/components'):
    for file in files:
        if file.endswith('.jsx'):
            file_exports['components/' + file] = get_exports(os.path.join(root, file))

imports_str = 'import React, { useEffect, useState } from "react";\nimport LandingPage from "./LandingPage";\nimport "./landing.css";\n'

for fpath, exp_set in file_exports.items():
    used = [e for e in exp_set if re.search(r'\b' + e + r'\b', app_body)]
    if used:
        used.sort()
        imports_str += f'import {{ {", ".join(used)} }} from "./{fpath}";\n'

new_app = imports_str + '\n' + app_body

with open('frontend/src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(new_app)

print('App.jsx refactored!')
