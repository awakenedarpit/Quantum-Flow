/* QuantumFlow Join Code UI v1 — polished invite-code modal */
(function(){
  const wait=()=>{
    if(!window.supabaseClient || !window.render || !window.qfGroupSection){setTimeout(wait,100);return;}
    let open=false;
    const esc=window.esc||((s)=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m])));
    const toast=(m)=>window.showToast?window.showToast(m):alert(m);
    function close(){document.getElementById('qfJoinModal')?.remove();open=false;}
    function modal(){
      if(open)return; open=true;
      const wrap=document.createElement('div'); wrap.id='qfJoinModal'; wrap.className='qf-modal-backdrop';
      wrap.innerHTML=`<div class="qf-join-modal" role="dialog" aria-modal="true" aria-labelledby="qfJoinTitle">
        <button class="qf-modal-close" id="qfJoinClose" aria-label="Close">×</button>
        <div class="qf-join-orb">🔑</div>
        <div class="badge">COMMUNITY ACCESS</div>
        <h2 id="qfJoinTitle">Join a Group</h2>
        <p class="muted qf-join-sub">Enter the invite code shared by your group owner or admin.</p>
        <label class="qf-field-label" for="qfInviteCode">Invite code</label>
        <div class="qf-code-wrap"><input id="qfInviteCode" maxlength="40" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="e.g. QF-7X4K-92"/><button id="qfPasteCode" class="qf-paste" type="button">📋 Paste</button></div>
        <div id="qfJoinHint" class="qf-join-hint">Codes are case-insensitive. Remove spaces if you copied them from a message.</div>
        <div id="qfJoinError" class="qf-join-error" hidden></div>
        <button id="qfJoinSubmit" class="btn qf-join-submit" type="button">Join Group <span>→</span></button>
        <button id="qfJoinCancel" class="qf-cancel" type="button">Cancel</button>
      </div>`;
      document.body.appendChild(wrap);
      const input=wrap.querySelector('#qfInviteCode'), submit=wrap.querySelector('#qfJoinSubmit'), error=wrap.querySelector('#qfJoinError');
      const setError=(msg)=>{error.textContent=msg;error.hidden=!msg;};
      const normalize=()=>{input.value=input.value.replace(/\s+/g,'').toUpperCase();};
      input.addEventListener('input',normalize); setTimeout(()=>input.focus(),30);
      wrap.querySelector('#qfJoinClose').onclick=close; wrap.querySelector('#qfJoinCancel').onclick=close;
      wrap.addEventListener('click',e=>{if(e.target===wrap)close();});
      document.addEventListener('keydown',function key(e){if(!open)return;if(e.key==='Escape'){close();document.removeEventListener('keydown',key);}else if(e.key==='Enter'&&document.activeElement===input)submit.click();});
      wrap.querySelector('#qfPasteCode').onclick=async()=>{try{const text=await navigator.clipboard.readText();input.value=text||'';normalize();input.focus();}catch{setError('Clipboard access is unavailable. Paste the code into the field.');}};
      submit.onclick=async()=>{
        normalize(); const code=input.value.trim(); setError('');
        if(!code){setError('Enter an invite code to continue.');input.focus();return;}
        if(code.length<4){setError('That code looks too short. Check the invite and try again.');input.focus();return;}
        submit.disabled=true; submit.innerHTML='<span class="qf-spinner"></span> Joining…';
        try{
          const {data,error:rpcError}=await window.supabaseClient.rpc('join_group_by_invite',{p_code:code});
          if(rpcError){
            const msg=String(rpcError.message||'');
            if(/function .* does not exist|schema cache/i.test(msg)) throw new Error('The invite service is temporarily unavailable. Please try again after the latest QuantumFlow update is loaded.');
            throw new Error(msg);
          }
          const id=typeof data==='string'?data:data?.id||data?.group_id||data;
          if(!id)throw new Error('The invite was accepted, but no group was returned. Please refresh and check My Groups.');
          close(); toast('🎉 You joined the group!'); window.qfOpenGroup(id);
        }catch(err){setError(err?.message||'Unable to join this group. Check the code and try again.');submit.disabled=false;submit.innerHTML='Join Group <span>→</span>';}
      };
    }
    window.qfJoinInvite=modal;
  };
  wait();
})();
