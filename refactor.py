import os
import re
import glob

files = glob.glob('client/src/app/(main)/**/page.tsx', recursive=True)

def refactor_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'MainLayout' in content:
        return False

    # Add import
    import_statement = "import { MainLayout } from '@/components/layout/main-layout';\n"
    # Find last import
    last_import_idx = content.rfind("import ")
    if last_import_idx != -1:
        end_of_line = content.find("\n", last_import_idx)
        content = content[:end_of_line+1] + import_statement + content[end_of_line+1:]
    else:
        content = import_statement + content

    # Find the return statement
    return_idx = content.find("  return (")
    if return_idx == -1: return False
    
    # We assume the structure is:
    # return (
    #   <div className="...">
    #     <div className="...">
    #       <div> / <div className="...">
    #         <h1 className="...">Title</h1>
    #         <p className="...">Desc</p>
    #       </div>
    #       {optional buttons}
    #     </div>
    
    # regex to find title and desc
    title_match = re.search(r'<h1[^>]*>(.*?)</h1>', content[return_idx:])
    desc_match = re.search(r'<p[^>]*text-gray-500[^>]*>(.*?)</p>', content[return_idx:])
    
    title = title_match.group(1).strip() if title_match else "Page"
    desc = desc_match.group(1).strip() if desc_match else ""
    
    # Find the top level <div ...> right after return (
    start_div_match = re.search(r'return\s*\(\s*(<div[^>]*>)', content)
    if not start_div_match: return False
    
    # We will just replace the start_div with MainLayout
    # Wait, it's safer to just replace it manually.
    
    return True

for f in files:
    refactor_file(f)

