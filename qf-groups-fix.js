/* QuantumFlow Groups reliability + UX patch v2 */
(function(){
  const wait=()=>{
    const client=window.qfSupabaseClient||window.supabaseClient;
    if(!client||!window.showToast){ setTimeout(wait,150); return; }
    const toast=m=>window.showToast(m);
    const makeCode=()=>{try{return crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase()}catch(_){return Math.random().toString(36).slice(2,12).toUpperCase()}};
    window.qfCreateGroup=async function(form){
      const btn=form?.querySelector('[data-create-group-submit]');
      const setBusy=b=>{if(btn){btn.disabled=b;btn.dataset.original=btn.dataset.original||btn.textContent;btn.textContent=b?'Creating…':btn.dataset.original;}};
      try{
        const {data:{user},error:authError}=await client.auth.getUser();
        if(authError||!user){toast('🔐 Please sign in before creating a group.');return false;}
        const fd=form?new FormData(form):null;
        const name=(fd?.get('name')||'').toString().trim();
        const description=(fd?.get('description')||'').toString().trim();
        const icon=((fd?.get('icon')||'👥').toString().trim()||'👥').slice(0,8);
        const visibility=(fd?.get('visibility')||'public').toString();
        const joinMode=(fd?.get('join_mode')||'open').toString();
        if(name.length<2||name.length>60){toast('⚠️ Group name must be 2–60 characters.');return false;}
        if(description.length>500){toast('⚠️ Description must be 500 characters or less.');return false;}
        setBusy(true);
        const rpc=await client.rpc('create_group',{p_name:name,p_description:description,p_visibility:visibility,p_join_mode:joinMode,p_icon:icon});
        if(!rpc.error&&rpc.data){
          const id=typeof rpc.data==='string'?rpc.data:rpc.data.id;
          toast('✨ Group created successfully!');
          if(window.qfOpenGroup&&id) window.qfOpenGroup(id); else if(window.render) window.render();
          return true;
        }
        const inviteCode=visibility==='private'?makeCode():null;
        const g=await client.from('groups').insert({name,description,visibility,join_mode:joinMode,owner_id:user.id,invite_code:inviteCode,icon}).select('id').single();
        if(g.error){
          console.error('QuantumFlow group create RPC/direct insert',rpc.error,g.error);
          const raw=g.error.message||rpc.error?.message||'Unable to create group';
          const friendly=raw.includes('row-level security')?'You do not have permission to create groups. Please sign in again.':raw.includes('schema cache')?'The database API is still updating. Please refresh QuantumFlow once and try again.':raw;
          toast('❌ '+friendly);
          return false;
        }
        const id=g.data.id;
        const m=await client.from('group_members').insert({group_id:id,user_id:user.id,role:'owner',status:'active'});
        if(m.error){
          await client.from('groups').delete().eq('id',id).eq('owner_id',user.id);
          console.error('QuantumFlow group owner membership',m.error);
          toast('❌ Group could not finish setup. Please try again.');
          return false;
        }
        toast('✨ Group created successfully!');
        if(window.qfOpenGroup) window.qfOpenGroup(id); else if(window.render) window.render();
        return true;
      }catch(e){console.error('QuantumFlow create group',e);toast('❌ '+(e?.message||'Could not create the group. Please try again.'));return false;}
      finally{setBusy(false);}
    };
  };
  wait();
})();
