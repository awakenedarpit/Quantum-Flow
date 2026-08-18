// QuantumFlow live achievement engine
(() => {
  const KEY = 'qf-unlocked-achievements';
  const getUnlocked = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
  const saveUnlocked = x => localStorage.setItem(KEY, JSON.stringify(x));
  const esc = s => String(s ?? '').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
  const client = () => window.qfSupabaseClient || window.supabaseClient;
  const user = () => window.currentUser || null;
  const toast = (title, text, icon='🏆') => {
    let el=document.getElementById('qfAchievementToast');
    if(!el){el=document.createElement('div');el.id='qfAchievementToast';document.body.appendChild(el)}
    el.innerHTML=`<div class="qf-ach-toast-icon">${icon}</div><div><div class="qf-ach-toast-kicker">ACHIEVEMENT UNLOCKED</div><strong>${esc(title)}</strong><span>${esc(text)}</span></div>`;
    el.classList.remove('show');void el.offsetWidth;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),5200);
  };
  const unlock = async (id,title,text,icon,bonus=0) => {
    const u=getUnlocked();
    if(u[id]) return false;
    u[id]=Date.now();saveUnlocked(u);
    toast(title, bonus?`${text} • +${bonus} XP` : text, icon);
    if(bonus && client() && user()) {
      try { await client().rpc('grant_xp',{p_event_key:'achievement',p_source_id:id,p_points:bonus}); } catch(e) { console.debug('achievement XP',e); }
    }
    return true;
  };
  const streakFrom = days => {
    const set=new Set(days||[]);let n=0,d=new Date();
    while(set.has(d.toISOString().slice(0,10))){n++;d.setDate(d.getDate()-1)}
    return n;
  };
  async function checkHabit(id){
    const c=client(),u=user();if(!c||!u||!id)return;
    const {data}=await c.from('habit_completions').select('completed_on').eq('habit_id',id).eq('user_id',u.id).order('completed_on',{ascending:false});
    const streak=streakFrom((data||[]).map(x=>x.completed_on));
    const h=window.__qfLastHabitName||'Habit';
    if(streak>=3)await unlock(`habit3:${id}`,'3-Day Streak',`${h} • 3 days in a row`,'🔥',15);
    if(streak>=7)await unlock(`habit7:${id}`,'7-Day Streak',`${h} • 7 days in a row`,'🔥',30);
    if(streak>=14)await unlock(`habit14:${id}`,'14-Day Streak',`${h} • 14 days in a row`,'⚡',50);
    if(streak>=30)await unlock(`habit30:${id}`,'30-Day Streak',`${h} • 30 days in a row`,'💎',100);
  }
  async function checkStudy(){
    const c=client(),u=user();if(!c||!u)return;
    const {data}=await c.from('study_sessions').select('id,completed').eq('user_id',u.id).eq('completed',true);
    const n=(data||[]).length;
    if(n>=1)await unlock('study1','First Study Session','You completed your first study session.','📚',10);
    if(n>=5)await unlock('study5','Study Streak','5 study sessions completed.','🧠',25);
    if(n>=10)await unlock('study10','Deep Focus','10 study sessions completed.','🚀',50);
    if(n>=25)await unlock('study25','Scholar Mode','25 study sessions completed.','🎓',100);
  }
  function hook(){
    const originalHabit=window.toggleHabit;
    if(typeof originalHabit==='function'&&!originalHabit.__qfAchievementHook){
      const wrapped=async function(id){
        const h=(window.state?.habits||[]).find(x=>x.id===id);window.__qfLastHabitName=h?.name||'Habit';
        const before=h?.days?.includes?.(new Date().toISOString().slice(0,10));
        const result=await originalHabit.apply(this,arguments);
        if(!before) await checkHabit(id);
        return result;
      };wrapped.__qfAchievementHook=true;window.toggleHabit=wrapped;
    }
    const originalSave=window.saveFocusSession;
    if(typeof originalSave==='function'&&!originalSave.__qfAchievementHook){
      const wrapped=async function(){const result=await originalSave.apply(this,arguments);await checkStudy();return result};wrapped.__qfAchievementHook=true;window.saveFocusSession=wrapped;
    }
    const originalAdd=window.addStudy;
    if(typeof originalAdd==='function'&&!originalAdd.__qfAchievementHook){
      const wrapped=async function(){const result=await originalAdd.apply(this,arguments);await checkStudy();return result};wrapped.__qfAchievementHook=true;window.addStudy=wrapped;
    }
  }
  const ready=()=>{hook();setTimeout(hook,700);setInterval(hook,1200)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  window.qfAchievementCheck=()=>{hook();checkStudy()};
})();
