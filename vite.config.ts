import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],root:'.',build:{outDir:'dist/web',rollupOptions:{input:{main:'index.html',confidentialite:'confidentialite/index.html',mentionsLegales:'mentions-legales/index.html'}}},server:{proxy:{'/api':'http://127.0.0.1:3001'}}});
