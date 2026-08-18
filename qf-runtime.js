/* QuantumFlow runtime bridge + admin navigation. */
(function(){
  let adminState='unknown';
  const expose=()=>{
    if(typeof state==='undefined'||typeof render!=='function'||typeof shell!=='function'||typeof esc!=='function'||typeof toast!=='function'){
      setTimeout(expose,50); return;
    }
    try{Object.defineProperty(window,'state',{configurable:true,get:()=>state});}catch(e){window.state=state;}
    try{Object.defineProperty(window,'currentUser',{configurable:true,get:()=>currentUser});}catch(e){window.currentUser=currentUser;}
    try{Object.defineProperty(window,'supabaseClient',{configurable:true,get:()=>supabaseClient});}catch(e){window.supabaseClient=window.qfSupabaseClient||supabaseClient;}
    window.render=render;
    window.shell=shell;
    window.esc=esc;
    window.showToast=toast;
    window.qfRuntimeReady=true;
    window.dispatchEvent(new CustomEvent('quantumflow:runtime-ready'));
    initAdminNav();
  };

  async function checkAdmin(){
    try{
      const client=window.supabaseClient;
      const user=window.currentUser;
      if(!client||!user){adminState='false';return false;}
      const {data,error}=await client.rpc('is_quantumflow_admin');
      if(error){console.warn('QuantumFlow admin check:',error.message);adminState='false';return false;}
      adminState=data===true;
      return adminState;
    }catch(e){console.warn('QuantumFlow admin check failed:',e);adminState='false';return false;}
  }

  function addAdminButton(){
    if(adminState!==true)return;
    const nav=document.getElementById('nav');
    if(!nav||nav.querySelector('[data-qf-admin]'))return;
    const b=document.createElement('button');
    b.type='button';
    b.className='nav-btn qf-admin-nav';
    b.dataset.qfAdmin='true';
    b.innerHTML='<span>🛡️</span><span>Admin</span>';
    b.title='Admin Dashboard';
    b.onclick=()=>{window.location.href='admin.html';};
    nav.appendChild(b);
  }

  function removeAdminButton(){
    document.querySelectorAll('[data-qf-admin]').forEach(el=>el.remove());
  }

  async function refreshAdminNav(){
    if(!window.currentUser){adminState='false';removeAdminButton();return;}
    await checkAdmin();
    if(adminState===true)addAdminButton();else removeAdminButton();
  }

  function initAdminNav(){
    if(window.qfAdminNavInitialized)return;
    window.qfAdminNavInitialized=true;
    const observer=new MutationObserver(()=>{if(adminState===true)addAdminButton();});
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('quantumflow:admin-refresh',refreshAdminNav);
    refreshAdminNav();
    setTimeout(refreshAdminNav,1000);
    setTimeout(refreshAdminNav,3000);
  }

  expose();
})();
