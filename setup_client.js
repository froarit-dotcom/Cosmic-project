const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir);
}

const packageJson = {
    "name": "cosmic-erp-client",
    "private": true,
    "version": "0.0.0",
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "react": "^18.2.0",
        "react-dom": "^18.2.0",
        "react-router-dom": "^6.22.0",
        "axios": "^1.6.0",
        "lucide-react": "^0.312.0"
    },
    "devDependencies": {
        "@types/react": "^18.2.43",
        "@types/react-dom": "^18.2.17",
        "@vitejs/plugin-react": "^4.2.1",
        "autoprefixer": "^10.4.17",
        "postcss": "^8.4.33",
        "tailwindcss": "^3.4.1",
        "vite": "^5.0.10"
    }
};

fs.writeFileSync(path.join(clientDir, 'package.json'), JSON.stringify(packageJson, null, 2));

const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
fs.writeFileSync(path.join(clientDir, 'tailwind.config.js'), tailwindConfig);

const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
fs.writeFileSync(path.join(clientDir, 'postcss.config.js'), postcssConfig);

const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})`;
fs.writeFileSync(path.join(clientDir, 'vite.config.js'), viteConfig);

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>COSMIC ERP</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`;
fs.writeFileSync(path.join(clientDir, 'index.html'), indexHtml);

fs.mkdirSync(path.join(clientDir, 'src'));

const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
fs.writeFileSync(path.join(clientDir, 'src', 'main.jsx'), mainJsx);

const appJsx = `function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <h1 className="text-4xl font-bold text-blue-600">COSMIC ERP Initialized</h1>
    </div>
  )
}
export default App`;
fs.writeFileSync(path.join(clientDir, 'src', 'App.jsx'), appJsx);

const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
fs.writeFileSync(path.join(clientDir, 'src', 'index.css'), indexCss);

console.log("Client scaffolded successfully!");
