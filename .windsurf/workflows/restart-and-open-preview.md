---
description: Restart the Vite dev server on port 3001 and open the browser preview
auto_execution_mode: 3
---

1. Ensure no other dev server is running on ports 3000/3001. If one is running, stop it in the terminal.
// turbo
2. Start the Vite dev server on port 3001 with strict binding:
   - Command (from the project root):
     npx vite --port 3001 --strictPort
3. Wait until you see "Local: http://localhost:3001/" in the terminal output.
// turbo
4. Open the browser preview at:
   - http://localhost:3001
5. Verify Hot Module Replacement (HMR) is working by saving a code change and observing the live update.