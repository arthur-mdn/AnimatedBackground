import {test} from 'node:test';
import assert from 'node:assert/strict';
import {defaults,inputSchema,filename} from '../src/shared/config';
import {cycle,reveal,graphemes,typedCharacters} from '../src/video/timing';
for(const name of ['Zoé','Jean-Baptiste','Marie-Charlotte','Éléonore','Anaïs','Alexandre'])test(`Prénom : ${name}`,()=>assert.equal(inputSchema.parse({...defaults,firstName:` ${name} `}).firstName,name));
test('Rejette les données invalides',()=>{for(const patch of [{age:0},{age:121},{age:5.5},{durationSeconds:29},{durationSeconds:30.5},{durationSeconds:181},{firstName:''},{firstName:'A'.repeat(31)},{messageLine1:'A'.repeat(41)},{messageLine2:'A'.repeat(61)},{templateId:'../x'},{ornament:'inconnu'},{nocturnePalette:'inconnue'},{nocturneColor:'#12345G'},{watercolorColor:'red'},{watercolorColor:'#12345G'},{messageLine1:'a\nb'},{messageLine2:'a\nb'}])assert.equal(inputSchema.safeParse({...defaults,...patch}).success,false);});
test('Nom de fichier normalisé sans chemin utilisateur',()=>assert.equal(filename({...defaults,firstName:'Éléonore / ..'}),'anniversaire_eleonore_50ans_aquarelle_45s.mp4'));
for(const seconds of [30,31,60,90,180])test(`Boucle symétrique et raccord effectif : ${seconds}s`,()=>{const n=seconds*30;for(const [start,length]of [[0,3],[2.5,3],[5,4]]){assert.equal(reveal(0,n,start,length),0);assert.equal(reveal(n-1,n,start,length),0);assert.equal(reveal(270,n,start,length),1);for(let f=0;f<270;f++)assert.equal(reveal(f,n,start,length),reveal(n-1-f,n,start,length));}assert.ok(Math.abs(Math.sin(cycle(n-1,n))-Math.sin(cycle(0,n)))<1e-12);});

test('Durée par défaut et précision à la seconde',()=>{assert.equal(defaults.durationSeconds,45);for(const durationSeconds of [30,31,45,180])assert.equal(inputSchema.parse({...defaults,durationSeconds}).durationSeconds,durationSeconds);});
test('Typing progressif, symétrique et Unicode',()=>{assert.deepEqual(graphemes('E\u0301léonore'),['E\u0301','l','é','o','n','o','r','e']);for(const count of [0,1,8,80]){assert.equal(typedCharacters(0,900,0,3,count),0);assert.equal(typedCharacters(899,900,0,3,count),0);assert.equal(typedCharacters(270,900,0,3,count),count);let previous=0;for(let f=0;f<270;f++){const current=typedCharacters(f,900,0,3,count);assert.ok(current>=previous);assert.equal(current,typedCharacters(899-f,900,0,3,count));previous=current;}}});

test('Diffusion native déterministe et exactement inversée',async()=>{const {inkSpread,inkOutline}=await import('../src/video/RoseInk');assert.equal(inkOutline(500,3),inkOutline(500,3));for(const seconds of [30,31,60,180]){const total=seconds*30;assert.equal(inkSpread(0,total),inkSpread(total-1,total));assert.equal(inkSpread(209,total),0);assert.equal(inkSpread(210,total),0);assert.ok(inkSpread(211,total)>0);const peak=Math.floor((total-1)/2);assert.equal(inkSpread(peak,total),1);let previous=0;for(let f=0;f<=peak;f++){const value=inkSpread(f,total);assert.ok(value>=previous);assert.equal(value,inkSpread(total-1-f,total));previous=value;}}});

test('Mouvement d’eau sur place et raccord continu',async()=>{const {inkWaterMotion}=await import('../src/video/RoseInk');for(const seconds of [30,60,180]){const total=seconds*30;assert.deepEqual(inkWaterMotion(0,total),inkWaterMotion(total-1,total));assert.notDeepEqual(inkWaterMotion(90,total),inkWaterMotion(0,total));for(let frame=0;frame<=270;frame++)assert.deepEqual(inkWaterMotion(frame,total),inkWaterMotion(total-1-frame,total));const settled=inkWaterMotion(270,total);assert.equal(Math.abs(settled.x)+Math.abs(settled.y)+Math.abs(settled.phase),0);}});

test('Deux lignes indépendantes, chacune facultative',()=>{for(const [messageLine1,messageLine2] of [['Joyeux','Anniversaire'],['Bon anniversaire','Caroline !'],['','Anniversaire'],['Joyeux',''],['','']]){const result=inputSchema.parse({...defaults,messageLine1,messageLine2});assert.equal(result.messageLine1,messageLine1);assert.equal(result.messageLine2,messageLine2);}});

test('Pépites : dérive légère vers le bas et raccord sans saut',async()=>{const {nuggetMotion}=await import('../src/video/GoldNuggets');for(const total of [900,1800,5400])for(const index of [0,42,174,999]){assert.deepEqual(nuggetMotion(0,total,index,13),nuggetMotion(total-1,total,index,13));assert.ok(nuggetMotion(Math.floor(total/2),total,index,13).y>0);for(let frame=0;frame<total;frame+=17){const p=nuggetMotion(frame,total,index,13);assert.ok(p.y>=0&&p.y<=34);assert.ok(Math.abs(p.x)<=8);assert.ok(Math.abs(p.rotation)<=6);}}});

test('Option pépites typée et partagée',()=>{for(const showGoldNuggets of [true,false])assert.equal(inputSchema.parse({...defaults,showGoldNuggets}).showGoldNuggets,showGoldNuggets);assert.equal(inputSchema.safeParse({...defaults,showGoldNuggets:'oui'}).success,false);});
test('Ordre d’apparition et écriture rapide avant fin du fondu',async()=>{const {APPEARANCE}=await import('../src/video/timing');const stages=[APPEARANCE.line1,APPEARANCE.line2,APPEARANCE.firstName,APPEARANCE.age,APPEARANCE.years,APPEARANCE.heart];for(let i=1;i<stages.length;i++)assert.ok(stages[i].start>stages[i-1].start);for(const stage of stages)assert.ok(stage.start+stage.fade<=9);for(const stage of [APPEARANCE.line1,APPEARANCE.line2,APPEARANCE.firstName])assert.ok(stage.writing<stage.fade);assert.ok(APPEARANCE.line1.writing<APPEARANCE.line2.writing);});
test('Scintillements ponctuels, bornés et sans flash au raccord',async()=>{const {nuggetSparkle}=await import('../src/video/GoldNuggets');for(const total of [900,1800,5400]){let lit=0;for(let i=0;i<64;i++){assert.equal(nuggetSparkle(0,total,i,13),0);assert.equal(nuggetSparkle(total-1,total,i,13),0);for(let f=0;f<total;f+=5){const value=nuggetSparkle(f,total,i,13);assert.ok(value>=0&&value<=1);if(value>0)lit++;}}assert.ok(lit>0);}});

test('Mariage : ordre des prénoms, date et champs propres au modèle',async()=>{
 const {weddingNames,formatWeddingDate,isWeddingDate}=await import('../src/shared/wedding');
 const input={...defaults,templateId:'jardin-mariage' as const,brideName:'Laura',groomName:'Maxime',weddingDate:'2027-06-12'};
 assert.equal(defaults.weddingMessage,'');
 assert.deepEqual(weddingNames(input),['Laura','Maxime']);
 assert.deepEqual(weddingNames({...input,reverseNames:true}),['Maxime','Laura']);
 assert.equal(formatWeddingDate(input.weddingDate),'12 juin 2027');
 assert.equal(isWeddingDate('2024-02-29'),true);
 for(const weddingDate of ['','2025-02-29','2027-04-31','12/06/2027'])assert.equal(inputSchema.safeParse({...input,weddingDate}).success,false);
 for(const patch of [{brideName:''},{groomName:''},{weddingMessage:'X'.repeat(101)}])assert.equal(inputSchema.safeParse({...input,...patch}).success,false);
 const parsed=inputSchema.parse({...input,firstName:'',age:NaN});
 assert.equal(parsed.age,50);
 assert.equal(filename(parsed),'mariage_laura-maxime_2027-06-12_45s.mp4');
 assert.equal(filename({...parsed,reverseNames:true}),'mariage_maxime-laura_2027-06-12_45s.mp4');
 assert.equal(filename({...parsed,templateId:'sceau-voeux'}),'mariage_laura-maxime_2027-06-12_45s.mp4');
 assert.ok(inputSchema.safeParse({...input,templateId:'sceau-voeux'}).success);
 assert.equal(filename({...defaults,templateId:'ballon-enfance',firstName:'Lina',age:5}),'anniversaire_lina_5ans_enfance_45s.mp4');
});
