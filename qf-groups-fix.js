/* QuantumFlow Groups reliability patch */
(function(){
  const wait=()=>{
    if(!window.supabaseClient || !window.qfOpenGroup || !window.showToast){ setTimeout(wait,150); return; }
    const toast=m=>window.showToast(m);
    const client=window.supabaseClient;
    window.qfCreateGroup=async()=>{
      try{
        const {data:{user},error:authError}=await client.auth.getUser();
        if(authError||!user){toast('🔐 Please log in before creating a group.');return;}
        const name=prompt('Group name');
        if(!name||!name.trim()) return;
        if(name.trim().length>80){toast('Group name must be 80 characters or less.');return;}
        const description=prompt('Short description (optional)')||'';
        const isPrivate=confirm('Make this group PRIVATE?\n\nOK = Private\nCancel = Public');
        let joinMode='open';
        if(isPrivate){
          const inviteOnly=confirm('How should people join?\n\nOK = Invite only\nCancel = Approval required');
          joinMode=inviteOnly?'invite':'approval';
        }
        const icon=(prompt('Choose an emoji/icon','👥')||'👥').trim().slice(0,8)||'👥';
        let groupId=null;
        const rpc=await client.rpc('create_group',{p_name:name.trim(),p_description:description.trim(),p_visibility:isPrivate?'private':'public',p_join_mode:joinMode,p_icon:icon});
        if(!rpc.error && rpc.data){ groupId=typeof rpc.data==='string'?rpc.data:rpc.data.id; }
        if(!groupId){
          const inviteCode=isPrivate?(crypto?.randomUUID?crypto.randomUUID().replace(/-/g,'').slice(0,10).toUpperCase():Math.random().toString(36).slice(2,12).toUpperCase()):null;
          const g=await client.from('groups').insert({name:name.trim(),description:description.trim(),visibility:isPrivate?'private':'public',join_mode:joinMode,owner_id:user.id,invite_code:inviteCode,icon}).select('id').single();
          if(g.error){
            const msg=(rpc.error?.message||g.error.message||'Unable to create group').replace('new row violates row-level security policy for table "groups"','You do not have permission to create groups.');
            toast('❌ '+msg);return;
          }
          groupId=g.data.id;
          const m=await client.from('group_members').insert({group_id:groupId,user_id:user.id,role:'owner',status:'active'});
          if(m.error){await client.from('groups').delete().eq('id',groupId).eq('owner_id',user.id);toast('❌ Group was created but membership setup failed. Please try again.');return;}
        }
        toast('✨ Group created successfully');
        window.qfGroupSection='detail';
        window.qfOpenGroup(groupId);
      }catch(e){ console.error('QuantumFlow create group',e); toast('❌ Could not create the group. Please try again.'); }
    };
    window.qfJoinInvite=window.qfJoinInvite||(()=>{});
  };
  wait();
})();
