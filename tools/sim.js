const p=require('puppeteer-core') /* uso: node tools/sim.js '{"2":{"speed":5,"power":7,"health":9}}' 200 0 2   (índices dos personagens) */;(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});const pg=await b.newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8931/?'+Date.now());await new Promise(r=>setTimeout(r,800));
const st=JSON.parse(process.argv[2]||'null');const N=+process.argv[3]||40;const A=+(process.argv[4]||0),B=+(process.argv[5]||1);
const r=await pg.evaluate((st,N,A,B)=>{Audio8.say=()=>{};Audio8.startMusic=()=>{};if(st){for(const k in st)CHARACTERS[k].stats=st[k];}
const res={0:0,1:0,rounds:[0,0],hp:[]};const orig=window.setTimeout;window.setTimeout=(f,t)=>orig(f,0);
for(let m=0;m<N;m++){const sw=m%2;game.mode='free';game.sel=sw?[B,A]:[A,B];game.diff=1;game.ladderPos=0;game.startMatch();
 const lv=4,fix=()=>{game.p.forEach(f=>{if(!(f.ctrl instanceof CPUController))f.ctrl=new CPUController(lv)})};fix();
 let R=game.round,fr=0;while(fr++<60*60*4){if(game.round!==R||game.p[0].ctrl.constructor!==CPUController){fix();R=game.round;}SCREENS[game.screen]();if(game.wins[0]>=2||game.wins[1]>=2||game.screen!=='fight')break;}
 const w=game.wins[0]>game.wins[1]?0:1;const who=sw?1-w:w;res[who]++;res.rounds[sw?1:0]+=game.wins[0];res.rounds[sw?0:1]+=game.wins[1];}
return res;},st,N,A,B);console.log(JSON.stringify(r),errs.slice(0,3));await b.close();})();
