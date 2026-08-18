/* QuantumFlow runtime bridge: auth UI + admin navigation.
 * Keeps the auth screen isolated from the app shell and ensures exactly one robot.
 */
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
    ensureAuthRobot();
    observeAuthScreen();
  };

  function isAuthScreen(){
    const nav=document.getElementById('nav');
    const app=document.getElementById('app');
    const auth=document.getElementById('authScreen')||document.querySelector('[id*=auth i]');
    return !!auth && !window.currentUser && (!app || app.offsetParent===null || !app.children.length);
  }

  function syncAuthChrome(){
    const nav=document.getElementById('nav');
    if(nav){
      nav.classList.toggle('qf-nav-hidden',!window.currentUser);
      nav.setAttribute('aria-hidden',window.currentUser?'false':'true');
    }
    if(window.currentUser){
      refreshAdminNav();
      removeAuthRobots();
    }else{
      adminState=false;
      removeAdminButton();
      ensureAuthRobot();
    }
  }

  function removeAuthRobots(){
    document.querySelectorAll('[data-qf-auth-robot]').forEach(el=>el.remove());
  }

  function ensureAuthRobot(){
    if(window.currentUser) return;
    const auth=document.getElementById('authScreen')||document.querySelector('[id*=auth i]');
    if(!auth) return;
    const existing=auth.querySelectorAll('[data-qf-auth-robot]');
    existing.forEach((el,i)=>{if(i>0)el.remove();});
    if(existing.length) return;
    const robot=document.createElement('div');
    robot.dataset.qfAuthRobot='true';
    robot.setAttribute('aria-hidden','true');
    robot.textContent='🤖';
    robot.style.cssText='font-size:clamp(42px,12vw,72px);line-height:1;margin:0 auto 12px;text-align:center;filter:drop-shadow(0 8px 18px rgba(120,180,255,.25));animation:qfRobotFloat 3.2s ease-in-out infinite;';
    if(!document.getElementById('qf-robot-style')){
      const style=document.createElement('style');
      style.id='qf-robot-style';
      style.textContent='@keyframes qfRobotFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}@media(prefers-reduced-motion:reduce){[data-qf-auth-robot]{animation:none!important}}.qf-nav-hidden{display:none!important}';
      document.head.appendChild(style);
    }
    auth.prepend(robot);
  }

  function observeAuthScreen(){
    if(window.qfAuthObserver) return;
    window.qfAuthObserver=new MutationObserver(()=>{
      if(window.currentUser) removeAuthRobots();
      else ensureAuthRobot();
      syncAuthChrome();
    });
    window.qfAuthObserver.observe(document.body,{childList:true,subtree:true});
  }

  async function checkAdmin(){
    const client=window.supabaseClient, user=window.currentUser;
    if(!client||!user){adminState=false;return false;}
    try{
      const a=await client.from('admin_users').select('user_id').eq('user_id',user.id).maybeSingle();
      if(!a.error && a.data?.user_id===user.id){adminState=true;return true;}
      const p=await client.from('profiles').select('role').eq('id',user.id).maybeSingle();
      if(!p.error && String(p.data?.role||'').toLowerCase()==='admin'){adminState=true;return true;}
      const r=await client.rpc('is_quantumflow_admin');
      if(!r.error && r.data===true){adminState=true;return true;}
    }catch(e){console.warn('QuantumFlow admin check failed:',e);}
    adminState=false; return false;
  }

  async function refreshAdminNav(){
    const ok=await checkAdmin();
    if(ok) addAdminButton(); else removeAdminButton();
  }

  function addAdminButton(){
    if(document.getElementById('qf-admin-nav')) return;
    const nav=document.getElementById('nav'); if(!nav) return;
    const btn=document.createElement('button');
    btn.id='qf-admin-nav'; btn.type='button'; btn.className='nav-item'; btn.textContent='🛡️ Admin';
    btn.onclick=()=>{location.href='admin.html';};
    nav.appendChild(btn);
  }

  function removeAdminButton(){document.getElementById('qf-admin-nav')?.remove();}

  function initAdminNav(){
    if(window.supabaseClient?.auth?.onAuthStateChange){
      window.supabaseClient.auth.onAuthStateChange(()=>setTimeout(syncAuthChrome,0));
    }
  }

  expose();
})();
