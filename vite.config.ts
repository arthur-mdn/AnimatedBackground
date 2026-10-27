import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {clientBackgroundVersion} from './src/server/clientBackgroundVersion';
export default defineConfig(async()=>({define:{__CLIENT_BACKGROUND_VERSION__:JSON.stringify(await clientBackgroundVersion())},plugins:[react()],root:'.',build:{outDir:'dist/web',rollupOptions:{input:{main:'index.html',confidentialite:'confidentialite/index.html',mentionsLegales:'mentions-legales/index.html'}}},server:{proxy:{'/api':'http://127.0.0.1:3001','/client-backgrounds':'http://127.0.0.1:3001'}}}));
