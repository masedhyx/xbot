/* sw.js: sama seperti sebelumnya (skipWaiting, claim, klik notifikasi) + cache offline yang aman.
   Hanya menangani 2 hal: (1) membuka halaman aplikasi, (2) pustaka CDN jsdelivr yang versinya dikunci (@angka).
   Semua yang lain (POST /chat, API, streaming, model Hugging Face, dll.) TIDAK disentuh.
   Untuk membatalkan: ganti isi file ini dengan versi lamamu. */
const PAGE='xbot-page-v1',LIB='xbot-lib-v1',LIBHOSTS=['cdn.jsdelivr.net'];
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 try{for(const k of await caches.keys())if(k.indexOf('xbot-')===0&&k!==PAGE&&k!==LIB)await caches.delete(k)}catch(_){}
 await self.clients.claim();
 try{ /* simpan halaman yang sedang terbuka, supaya kunjungan pertama pun bisa dibuka offline */
  const c=await caches.open(PAGE);
  for(const cl of await self.clients.matchAll({type:'window',includeUncontrolled:true})){
   const u=new URL(cl.url);if(u.origin!==self.location.origin)continue;u.hash='';
   try{const r=await fetch(u.href);if(r&&r.ok&&r.type==='basic')await c.put(new Request(u.href),r)}catch(_){}
  }
 }catch(_){}
})()));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():self.clients.openWindow('./')))});

async function pageFetch(req){
 const c=await caches.open(PAGE),hit=await c.match(req,{ignoreSearch:true});
 const net=fetch(req);
 const keep=r=>{try{if(r&&r.ok&&r.type==='basic')c.put(req,r.clone()).catch(()=>{})}catch(_){}return r};
 if(!hit)return keep(await net);                       /* belum pernah dibuka: langsung jaringan */
 try{
  const r=await Promise.race([net,new Promise((_,no)=>setTimeout(()=>no(new Error('lambat')),6000))]);
  return keep(r);                                      /* jaringan normal: pakai versi terbaru */
 }catch(_){net.then(keep).catch(()=>{});return hit}    /* offline/lambat: pakai salinan tersimpan */
}
async function libFetch(req){
 const c=await caches.open(LIB),hit=await c.match(req);
 if(hit)return hit;
 const r=await fetch(req);
 try{if(r&&r.ok)c.put(req,r.clone()).catch(()=>{})}catch(_){}
 return r;
}
self.addEventListener('fetch',e=>{
 const r=e.request;
 if(r.method!=='GET')return;
 let u;try{u=new URL(r.url)}catch(_){return}
 if(r.mode==='navigate'&&u.origin===self.location.origin){e.respondWith(pageFetch(r));return}
 if(LIBHOSTS.indexOf(u.host)>=0&&/@\d/.test(u.pathname)){e.respondWith(libFetch(r))}
});
