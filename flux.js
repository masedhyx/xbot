(function(){
try{
const FLUX_URL='https://flux.edhymaster70.workers.dev';
const prevFetch=window.fetch;
window.fetch=async function(input,init){
  try{
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(/\/chat(\?|$)/.test(url)&&init&&typeof init.body==='string'&&init.body.indexOf('"image_gen":true')>-1){
      let b=null;try{b=JSON.parse(init.body)}catch(e){}
      /* hanya teks -> gambar (bukan edit foto, karena Flux schnell tidak menerima foto) */
      if(b&&b.image_gen&&!b.image&&Array.isArray(b.messages)&&b.messages.length){
        let p=String(b.messages[b.messages.length-1].content||'').replace(/^\s*\/gambar\s+/i,'').trim();
        if(p&&p.indexOf('Edit foto ini:')!==0){
          try{
            const r=await prevFetch(FLUX_URL,{method:'POST',headers:{'Content-Type':'application/json'},signal:init.signal,body:JSON.stringify({prompt:p})});
            const d=await r.json();
            const im=d&&d.result&&d.result.image;
            if(im){
              const line=JSON.stringify({text:'',image:'data:image/jpeg;base64,'+im})+'\n';
              return new Response(line,{status:200,headers:{'Content-Type':'application/x-ndjson'}});
            }
          }catch(e){if(e&&e.name==='AbortError')throw e}
          /* Flux gagal -> lanjut ke jalur lama */
        }
      }
    }
  }catch(e){if(e&&e.name==='AbortError')throw e}
  return prevFetch.apply(this,arguments);
};
}catch(e){try{console.warn('Flux tidak aktif:',e)}catch(_){}}
})();
