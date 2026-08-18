/* QuantumFlow runtime bridge: exposes the main SPA runtime to feature modules safely. */
(function(){
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
  };
  expose();
})();
