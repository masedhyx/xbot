// Notifikasi (dari versi sebelumnya)
const CACHE='edhyx-shell-v1';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>l.length?l[0].focus():self.clients.openWindow('./')))});
// Offline: simpan halaman utama saat online, pakai salinan itu saat tidak ada koneksi.
// Hanya GET dari domain yang sama untuk navigasi halaman. Permintaan lain (API, model) tidak diubah.
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET'||req.mode!=='navigate'||new URL(req.url).origin!==self.location.origin) return;
  e.respondWith(
    fetch(req).then(res=>{
      if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});}
      return res;
    }).catch(()=>caches.open(CACHE).then(c=>c.match(req).then(r=>r||c.match('./')||c.match('./x11151_offline.html')||Response.error())))
  );
});
