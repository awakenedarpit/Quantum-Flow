/* QuantumFlow Groups Create UI + RPC-independent creation */
(function(){
  const wait=()=>{
    if(!window.supabaseClient || !window.qfOpenGroup || !window.showToast){setTimeout(wait,150);return;}
    const client=window.supabaseClient;
    const toast=m=>window.showToast(m);
    const esc=window.esc||((s)=>String(s??'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m])));
    const code=()=>Math.random().toString(36).slice(2,12).toUpperCase();
    window.qfCreateGroup=()=>{
      const old=document.getElementById('qfCreateGroupModal'); if(old) old.remove();
      const modal=document.createElement('div'); modal.id='qfCreateGroupModal'; modal.className='qf-modal-backdrop';
      modal.innerHTML=`<div class="qf-create-modal" role="dialog" aria-modal="true" aria-labelledby="qfCreateTitle">
        <button class="qf-modal-close" aria-label="Close" onclick="document.getElementById('qfCreateGroupModal')?.remove()">×</button>
        <div class="qf-create-orb">👥</div>
        <div class="badge">⚛️ COMMUNITY BUILDER</div>
        <h2 id="qfCreateTitle">Create your group</h2>
        <p class="muted">Build a focused community for habits, study and challenges.</p>
        <label>Group name<input id="qfCgName" maxlength="80" placeholder="e.g. Quantum Coders" autocomplete="off"></label>
        <label>Description <span class="muted">optional</span><textarea id="qfCgDesc" maxlength="240" placeholder="What is this group about?"></textarea><small id="qfCgCount">0 / 240</small></label>
        <label>Group icon<input id="qfCgIcon" maxlength="2" value="👥" class="qf-icon-input"></label>
        <div class="qf-choice-label">Visibility</div>
        <div class="qf-choice-grid">
          <button type="button" class="qf-choice active" data-vis="public"><b>🌍 Public</b><span>Anyone can discover and join.</span></button>
          <button type="button" class="qf-choice" data-vis="private"><b>🔐 Private</b><span>Hidden from discovery.</span></button>
        </div>
        <div id="qfJoinModeWrap" class="qf-hidden"><div class="qf-choice-label">How should people join?</div><div class="qf-choice-grid">
          <button type="button" class="qf-choice active" data-mode="invite"><b>🔑 Invite only</b><span>Only people with your code can join.</span></button>
          <button type="button" class="qf-choice" data-mode="approval"><b>🛡️ Approval</b><span>People request access first.</span></button>
        </div></div>
        <div class="qf-create-preview"><span id="qfCgPreviewIcon">👥</span><div><b id="qfCgPreviewName">Your group</b><small id="qfCgPreviewType">🌍 Public · Open</small></div></div>
        <button id="qfCgSubmit" class="btn qf-create-submit">Create Group <span>→</span></button>
      </div>`;
      document.body.appendChild(modal);
      let visibility='public', mode='open';
      const name=modal.querySelector('#qfCgName'), desc=modal.querySelector('#qfCgDesc'), icon=modal.querySelector('#qfCgIcon');
      const update=()=>{modal.querySelector('#qfCgPreviewIcon').textContent=icon.value.trim()||'👥';modal.querySelector('#qfCgPreviewName').textContent=name.value.trim()||'Your group';modal.querySelector('#qfCgPreviewType').textContent=(visibility==='private'?'🔐 Private':'🌍 Public')+' · '+(mode==='invite'?'Invite only':mode==='approval'?'Approval':'Open');modal.querySelector('#qfCgCount').textContent=desc.value.length+' / 240';};
      name.oninput=update;desc.oninput=update;icon.oninput=update;
      modal.querySelectorAll('[data-vis]').forEach(b=>b.onclick=()=>{visibility=b.dataset.vis;mode=visibility==='private'?'invite':'open';modal.querySelectorAll('[data-vis]').forEach(x=>x.classList.toggle('active',x===b));modal.querySelector('#qfJoinModeWrap').classList.toggle('qf-hidden',visibility!=='private');update();});
      modal.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;modal.querySelectorAll('[data-mode]').forEach(x=>x.classList.toggle('active',x===b));update();});
      modal.querySelector('#qfCgSubmit').onclick=async()=>{
        const u=await client.auth.getUser(); const user=u.data?.user;
        if(!user){toast('🔐 Please log in before creating a group.');return;}
        const n=name.value.trim(); if(n.length<2){name.focus();toast('Enter a group name (at least 2 characters).');return;}
        const btn=modal.querySelector('#qfCgSubmit');btn.disabled=true;btn.innerHTML='Creating…';
        try{
          const invite=visibility==='private'?code():null;
          const g=await client.from('groups').insert({name:n,description:desc.value.trim(),visibility,join_mode:mode,owner_id:user.id,invite_code:invite,icon:icon.value.trim()||'👥'}).select('id').single();
          if(g.error) throw g.error;
          const m=await client.from('group_members').insert({group_id:g.data.id,user_id:user.id,role:'owner',status:'active'});
          if(m.error){await client.from('groups').delete().eq('id',g.data.id).eq('owner_id',user.id);throw m.error;}
          modal.remove();toast('✨ Your group is ready!');window.qfGroupSection='detail';window.qfOpenGroup(g.data.id);
        }catch(e){console.error(e);toast('❌ '+(e.message||'Unable to create group. Check your connection and permissions.'));btn.disabled=false;btn.innerHTML='Create Group <span>→</span>';}
      };
      update();setTimeout(()=>name.focus(),50);
    };
  };
  wait();
})();
