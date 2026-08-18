/* QuantumFlow runtime bridge: auth UI + admin navigation. */
(function(){
  let adminState=false;
  const expose=()=>{
    if(typeof state==='undefined'||typeof render!=='function'||typeof shell!=='function'||typeof esc!=='function'||typeof toast!=='function'){setTimeout(expose,50);return;}
    try{Object.defineProperty(window,'state',{configurable:true,get:()=>state});}catch(e){window.state=state;}
    try{Object.defineProperty(window,'currentUser',{configurable:true,get:()=>currentUser});}catch(e){window.currentUser=currentUser;}
    try{Object.defineProperty(window,'supabaseClient',{configurable:true,get:()=>supabaseClient});}catch(e){window.supabaseClient=window.qfSupabaseClient||supabaseClient;}
    window.render=render;window.shell=shell;window.esc=esc;window.showToast=toast;window.qfRuntimeReady=true;
    initAdminNav();syncAuthChrome();observeAuthScreen();
  };
  function syncAuthChrome(){const nav=document.getElementById('nav');if(nav){nav.classList.toggle('qf-nav-hidden',!window.currentUser);nav.setAttribute('aria-hidden',window.currentUser?'false':'true')}if(window.currentUser){refreshAdminNav();removeAuthRobots()}else{adminState=false;removeAdminButton()}}
  /* Auth UI owns its robot now. Do not inject an emoji/duplicate robot into the auth DOM. */
  function removeAuthRobots(){document.querySelectorAll('[data-qf-auth-robot]').forEach(el=>el.remove())}
  function observeAuthScreen(){if(window.qfAuthObserver)return;window.qfAuthObserver=new MutationObserver(()=>{if(window.currentUser)removeAuthRobots();syncAuthChrome()});window.qfAuthObserver.observe(document.body,{childList:true,subtree:true})}
  async function checkAdmin(){const client=window.supabaseClient,user=window.currentUser;if(!client||!user){adminState=false;return false}try{const a=await client.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();if(!a.error&&a.data?.user_id===user.id){adminState=true;return true}const p=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();if(!p.error&&String(p.data?.role||'').toLowerCase()==='admin'){adminState=true;return true}const r=await client.rpc('is_quantumflow_admin');if(!r.error&&r.data===true){adminState=true;return true}}catch(e){console.warn('QuantumFlow admin check failed:',e)}adminState=false;return false}
  async function refreshAdminNav(){const ok=await checkAdmin();if(ok)addAdminButton();else removeAdminButton()}
  function addAdminButton(){if(document.getElementById('qf-admin-nav'))return;const nav=document.getElementById('nav');if(!nav)return;const btn=document.createElement('button');btn.id='qf-admin-nav';btn.type='button';btn.className='nav-item';btn.textContent='🛡️ Admin';btn.onclick=()=>{location.href='admin.html'};nav.appendChild(btn)}
  function removeAdminButton(){document.getElementById('qf-admin-nav')?.remove()}
  function initAdminNav(){if(window.supabaseClient?.auth?.onAuthStateChange){window.supabaseClient.auth.onAuthStateChange(()=>setTimeout(syncAuthChrome,0))}}
  expose();
})();
