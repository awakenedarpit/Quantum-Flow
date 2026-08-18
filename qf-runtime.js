/* QuantumFlow runtime bridge: reliable admin navigation + auth UX restoration. */
(function(){
  let adminState=false;
  const expose=()=>{
    if(typeof state==='undefined'||typeof render!=='function'||typeof shell!=='function'||typeof esc!=='function'||typeof toast!=='function'){
      setTimeout(expose,50); return;
    }
    try{Object.defineProperty(window,'state',{configurable:true,get:()=>state});}catch(e){window.state=state;}
    try{Object.defineProperty(window,'currentUser',{configurable:true,get:()=>currentUser});}catch(e){window.currentUser=currentUser;}
    try{Object.defineProperty(window,'supabaseClient',{configurable:true,get:()=>supabaseClient});}catch(e){window.supabaseClient=window.qfSupabaseClient||supabaseClient;}
    window.render=render; window.shell=shell; window.esc=esc; window.showToast=toast;
    window.qfRuntimeReady=true;
    initAdminNav();
    syncAuthChrome();
  };

  function syncAuthChrome(){
    const nav=document.getElementById('nav');
    if(nav){
      nav.classList.toggle('qf-nav-hidden',!window.currentUser);
      nav.setAttribute('aria-hidden',window.currentUser?'false':'true');
    }
    if(window.currentUser){
      refreshAdminNav();
    }else{
      adminState=false;
      removeAdminButton();
    }
  }

  async function checkAdmin(){
    const client=window.supabaseClient, user=window.currentUser;
    if(!client||!user){adminState=false;return false;}
    try{
      const a=await client.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
      if(!a.error && a.data?.user_id===user.id){adminState=true;return true;}
      const p=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
      if(!p.error && String(p.data?.role||'').toLowerCase()==='admin'){adminState=true;return true;}
      try{const r=await client.rpc('is_quantumflow_admin');if(!r.error&&r.data===true){adminState=true;return true;}}catch(e){}
    }catch(e){console.warn('QuantumFlow admin check failed:',e);}
    adminState=false;return false;
  }

  function addAdminButton(){
    if(adminState!==true||!window.currentUser)return;
    const nav=document.getElementById('nav'); if(!nav)return;
    nav.classList.remove('qf-nav-hidden');
    if(nav.querySelector('[data-qf-admin]'))return;
    const b=document.createElement('button'); b.type='button'; b.className='nav-btn qf-admin-nav'; b.dataset.qfAdmin='true';
    b.innerHTML='<span>🛡️</span><span>Admin</span>'; b.title='Admin Dashboard';
    b.onclick=()=>{window.location.href='./admin.html';}; nav.appendChild(b);
  }
  function removeAdminButton(){document.querySelectorAll('[data-qf-admin]').forEach(el=>el.remove());}

  async function refreshAdminNav(){
    if(!window.currentUser){adminState=false;removeAdminButton();syncAuthChrome();return;}
    await checkAdmin(); if(adminState)addAdminButton(); else removeAdminButton();
    syncAuthChrome();
  }

  function initAdminNav(){
    if(window.qfAdminNavInitialized)return; window.qfAdminNavInitialized=true;
    const style=document.createElement('style'); style.id='qf-runtime-nav-style';
    if(!document.getElementById(style.id)){style.textContent='.qf-nav-hidden{display:none!important}.qf-admin-nav{order:99!important}';document.head.appendChild(style);}
    const observer=new MutationObserver(()=>{syncAuthChrome();if(adminState===true&&window.currentUser)addAdminButton();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('quantumflow:admin-refresh',refreshAdminNav);
    if(window.supabaseClient?.auth) window.supabaseClient.auth.onAuthStateChange(()=>setTimeout(syncAuthChrome,0));
    syncAuthChrome(); refreshAdminNav();
    setTimeout(refreshAdminNav,500); setTimeout(refreshAdminNav,1500); setTimeout(refreshAdminNav,4000);
  }

  function initAuthRobot(){
    const style=document.createElement('style'); style.id='qf-auth-robot-style';
    if(!document.getElementById(style.id)){style.textContent=`
      .qf-auth-robot{width:92px;height:92px;margin:0 auto 14px;display:grid;place-items:center;border-radius:28px;background:linear-gradient(145deg,rgba(99,102,241,.22),rgba(34,211,238,.12));border:1px solid rgba(125,211,252,.28);box-shadow:0 12px 40px rgba(0,0,0,.18);font-size:54px;animation:qfRobotFloat 3s ease-in-out infinite}
      .qf-auth-robot span{filter:drop-shadow(0 6px 14px rgba(34,211,238,.35))}
      @keyframes qfRobotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
      @media(prefers-reduced-motion:reduce){.qf-auth-robot{animation:none}}
    `;document.head.appendChild(style);}
    const decorate=()=>{
      const card=document.querySelector('.auth .card.hero');
      if(!card||card.querySelector('.qf-auth-robot'))return;
      const brand=card.querySelector('.brand');
      const robot=document.createElement('div'); robot.className='qf-auth-robot'; robot.setAttribute('aria-hidden','true'); robot.innerHTML='<span>🤖</span>';
      if(brand) brand.insertAdjacentElement('beforebegin',robot); else card.prepend(robot);
    };
    decorate(); new MutationObserver(decorate).observe(document.body,{childList:true,subtree:true});
  }

  // Start auth UI decoration immediately; don't wait for the authenticated app runtime.
  initAuthRobot();
  expose();
})();
