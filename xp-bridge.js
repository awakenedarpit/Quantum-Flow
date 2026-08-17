/* QuantumFlow V2 XP bridge. Loaded after app.js so existing UI logic remains intact. */
(function(){
  const award=async(key,source,points)=>{try{if(!window.currentUser||!window.supabaseClient)return;const {error}=await window.supabaseClient.rpc('grant_xp',{p_event_key:key,p_source_id:source,p_points:points});if(error)console.warn('XP:',error.message)}catch(e){console.warn('XP bridge:',e)}};
  const wait=()=>{if(typeof window.toggleHabit!=='function'||typeof window.addStudy!=='function'||typeof window.advanceGoal!=='function'){setTimeout(wait,100);return}
    const oldToggle=window.toggleHabit;
    window.toggleHabit=async function(id){const h=window.state?.habits?.find(x=>x.id===id);const wasDone=!!(h&&typeof window.done==='function'&&window.done(h));await oldToggle(id);const after=window.state?.habits?.find(x=>x.id===id);const isDone=!!(after&&typeof window.done==='function'&&window.done(after));if(!wasDone&&isDone)await award('habit_complete:'+id+':'+new Date().toISOString().slice(0,10),id,10)};
    const oldStudy=window.addStudy;
    window.addStudy=async function(){const before=window.state?.study?.length||0;await oldStudy();const list=window.state?.study||[];if(list.length>before){const s=list[0];if(s?.id)await award('study_session_complete',s.id,Math.min(100,20+Math.floor((Number(s.duration_minutes)||0)/30)*10))}};
    const oldGoal=window.advanceGoal;
    window.advanceGoal=async function(id,current){await oldGoal(id,current);const g=window.state?.goals?.find(x=>x.id===id);if(g&&Number(g.progress)>=100)await award('goal_complete',id,50)};
    window.qfAwardXP=award;
  };wait();
})();