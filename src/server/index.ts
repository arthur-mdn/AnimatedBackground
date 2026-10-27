import {createApplication} from './app';
const application=await createApplication({publicUrl:process.env.PUBLIC_URL});
const server=application.app.listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log('AnimatedBackground prêt sur le port '+(process.env.PORT||3001)));
let stopping=false;
async function shutdown(){if(stopping)return;stopping=true;await application.close();server.close(()=>process.exit());const timer=setTimeout(()=>process.exit(1),8000);timer.unref();}
process.on('SIGTERM',()=>void shutdown());process.on('SIGINT',()=>void shutdown());
