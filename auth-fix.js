// QuantumFlow auth UX repair. app.js owns render() lexically, so this module repairs the rendered DOM.
(() => {
  const WAIT_MS=65000; let lockedUntil=0, mode='signin';
  function repair(){
    const r=document.querySelector('#app .auth'); if(!r)return;
    const card=r.querySelector('.card.hero');
    const robots=r.querySelectorAll('[data-qf-auth-robot]'); robots.forEach((el,i)=>{if(i>0)el.remove()});
    if(!robots.length&&card){const el=document.createElement('div');el.dataset.qfAuthRobot='true';el.className='qf-auth-robot';el.setAttribute('aria-hidden','true');el.textContent='🤖';card.prepend(el)}
    const email=document.getElementById('email'),password=document.getElementById('password'); if(!email||!password)return;
    let name=document.getElementById('displayName');
    if(!name){name=document.createElement('input');name.id='displayName';name.className='input';name.type='text';name.autocomplete='name';name.placeholder='Your Name';password.parentNode.insertBefore(name,password)}
    name.hidden=mode!=='signup'; name.required=mode==='signup';
    const actions=r.querySelector('.actions'); if(!actions)return;
    let submit=actions.querySelector('#qfAuthSubmit');
    if(!submit){submit=actions.querySelector('button'); if(submit)submit.id='qfAuthSubmit'}
    if(submit){submit.textContent=mode==='signup'?'Create account':'Sign in';submit.onclick=mode==='signup'?window.signUp:window.signIn}
    let switchBtn=document.getElementById('qfAuthSwitch');
    if(!switchBtn){switchBtn=document.createElement('button');switchBtn.id='qfAuthSwitch';switchBtn.type='button';switchBtn.className='btn secondary';actions.appendChild(switchBtn)}
    switchBtn.textContent=mode==='signup'?'Back to Sign in':'Create account'; switchBtn.onclick=()=>{mode=mode==='signup'?'signin':'signup';repair()};
  }
  window.signUp=async function(){const now=Date.now();if(now<lockedUntil)return toast(`Please wait ${Math.ceil((lockedUntil-now)/1000)}s before trying again.`);const name=document.getElementById('displayName')?.value.trim()||'',email=document.getElementById('email')?.value.trim().toLowerCase()||'',password=document.getElementById('password')?.value||'',status=document.getElementById('authStatus');if(!name)return toast('Enter your name');if(!email||!email.includes('@'))return toast('Enter a valid email ID');if(password.length<6)return toast('Password must be at least 6 characters');lockedUntil=now+WAIT_MS;if(status)status.textContent='Creating your account…';try{const {data,error}=await supabaseClient.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{display_name:name,full_name:name,name}}});if(error){lockedUntil=0;const m=String(error.message||'').toLowerCase(),msg=error.status===429||m.includes('rate limit')||m.includes('rate_limit')?'Email sending limit reached. Please wait and try again.':error.message;if(status)status.textContent=msg;return toast(msg)}if(data?.session){lockedUntil=0;return bootstrap()}if(status)status.textContent='Account created. Check your email ID to confirm your account.';toast('Account created ✓ Check your email')}catch(e){lockedUntil=0;toast(e?.message||'Could not create the account.')}};
  const ob=new MutationObserver(repair);ob.observe(document.body,{childList:true,subtree:true});setTimeout(repair,0);setInterval(repair,1000);
})();
