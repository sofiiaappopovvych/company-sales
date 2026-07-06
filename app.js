const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const todayKey = () => new Date().toISOString().slice(0,10);
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2,8);

const DEFAULT_TASKS = [
  'Review 20–30 Facebook groups',
  'Find 10–15 relevant posts asking for animators, cake, decor, photographer, venue, catering, balloons, or event help',
  'Send personalized messages to each relevant lead',
  'Add 20 new contacts to CRM',
  'Make 15–20 new outreach touches',
  'Complete 30 follow-ups',
  'Update CRM after each contact',
  'Find 3–5 new opportunities: grand openings, schools, churches, daycares, festivals, partners',
  'Submit daily report'
];
const TEMPLATES = [
  {title:'Facebook Parent Lead', body:'Hi! I saw your post about planning a birthday party. We provide fun event entertainment programs for kids and family events. I’d love to send you a few package options if you’re still looking.'},
  {title:'Grand Opening Outreach', body:'Hi! Congratulations on your upcoming opening. We help businesses create memorable grand opening experiences with entertainment that attracts families, photos, and attention. Would you like me to send a few ideas?'},
  {title:'School / Daycare Outreach', body:'Hi! We work with schools and daycares to bring interactive entertainment programs for kids’ events, family nights, graduations, and seasonal celebrations. Who would be the best person to contact about upcoming events?'},
  {title:'Church Outreach', body:'Hi! We help with family-friendly entertainment for church events, kids ministry celebrations, community days, and holiday programs. I’d love to share options for your next event.'},
  {title:'Follow-up', body:'Hi! Just following up on my previous message. Would you like me to send our event entertainment options and pricing for your upcoming event?'}
];
const PLAYBOOK = [
  ['Sales Workflow','Find lead → qualify need → send personalized message → add to CRM → follow up → send proposal → close booking → ask for referral.'],
  ['Lead Sources','Facebook groups, Instagram, cold calls, referrals, partners, schools, daycares, churches, city events, grand openings, museums, restaurants, coffee shops, fitness centers, dental offices.'],
  ['Daily Standard','Minimum 15–20 new touches, 20 CRM contacts, 30 follow-ups, and a daily report.'],
  ['Qualification Questions','Event date, city, guest count, age group, event type, budget range, decision maker, preferred package, timeline.'],
  ['Objection Handling','Price: explain value and options. Need to think: set next follow-up. Already booked: ask for future events/referrals. No answer: follow-up sequence.']
];

const state = {
  user: JSON.parse(localStorage.getItem('sp_user')||'{"name":"Sales Manager","role":"manager"}'),
  leads: JSON.parse(localStorage.getItem('sp_leads')||'[]'),
  reports: JSON.parse(localStorage.getItem('sp_reports')||'{}'),
  tasks: JSON.parse(localStorage.getItem('sp_tasks')||'{}'),
  page:'dashboard', firebase:false, db:null
};

function saveLocal(){
  localStorage.setItem('sp_user', JSON.stringify(state.user));
  localStorage.setItem('sp_leads', JSON.stringify(state.leads));
  localStorage.setItem('sp_reports', JSON.stringify(state.reports));
  localStorage.setItem('sp_tasks', JSON.stringify(state.tasks));
}

async function initFirebase(){
  try{
    if(window.FIREBASE_ENABLED && window.firebase){
      firebase.initializeApp(firebaseConfig);
      state.db = firebase.firestore();
      state.firebase = true;
      $('#syncDot').classList.add('online');
      $('#syncTitle').textContent = 'Cloud Sync Ready';
      $('#syncText').textContent = 'Connected to Firebase. Data can sync across users.';
      await loadCloud();
    }
  }catch(e){ console.warn('Firebase not connected', e); }
}
async function loadCloud(){
  if(!state.firebase) return;
  const snap = await state.db.collection('companyData').doc('main').get();
  if(snap.exists){
    const d = snap.data(); state.leads=d.leads||[]; state.reports=d.reports||{}; state.tasks=d.tasks||{}; saveLocal();
  }
}
async function saveCloud(){
  saveLocal();
  if(state.firebase){
    await state.db.collection('companyData').doc('main').set({leads:state.leads,reports:state.reports,tasks:state.tasks,updatedAt:new Date().toISOString()},{merge:true});
  }
}

const navItems = [
  ['dashboard','🏠 Dashboard'], ['tasks','📋 Daily Tasks'], ['leads','👥 CRM Leads'], ['followup','📞 Follow-up'], ['reports','📝 Daily Reports'], ['templates','💬 Templates'], ['playbook','📖 Sales Playbook'], ['admin','📊 Admin']
];
function renderNav(){
  $('#nav').innerHTML = navItems.map(([id,label])=>`<button class="nav-btn ${state.page===id?'active':''}" data-page="${id}">${label}</button>`).join('');
  $$('.nav-btn').forEach(b=>b.onclick=()=>{state.page=b.dataset.page; render();});
}
function setTitle(t){ $('#pageTitle').textContent=t; $('#dateLabel').textContent = new Date().toLocaleDateString(undefined,{weekday:'long',year:'numeric',month:'long',day:'numeric'}); }
function managerLeads(){ return state.user.role==='admin'?state.leads:state.leads.filter(l=>l.assignedTo===state.user.name); }
function weekLeads(){ const now=Date.now(); return managerLeads().filter(l=> now - new Date(l.createdAt).getTime() < 7*864e5); }
function todayTasks(){ const k=todayKey(); if(!state.tasks[k]) state.tasks[k]={}; return state.tasks[k]; }
function taskPct(){ const t=todayTasks(); return Math.round(DEFAULT_TASKS.filter((_,i)=>t[i]).length/DEFAULT_TASKS.length*100); }
function statusPill(s){ const cls = s.includes('Won')||s==='Booked'?'green':s.includes('Lost')?'red':s.includes('Follow')||s.includes('Proposal')?'orange':''; return `<span class="pill ${cls}">${s}</span>`; }

function renderDashboard(){
  setTitle('Dashboard'); const leads=managerLeads(); const today=todayKey();
  const todaysLeads=leads.filter(l=>l.createdAt.slice(0,10)===today).length;
  const fu=leads.filter(l=>l.nextFollowUp && l.nextFollowUp<=today && !['Closed Won','Closed Lost'].includes(l.status)).length;
  $('#content').innerHTML = `<div class="grid cols-4">
    <div class="card metric"><strong>${todaysLeads}</strong><span>New leads today</span></div>
    <div class="card metric"><strong>${weekLeads().length}</strong><span>New leads this week</span></div>
    <div class="card metric"><strong>${fu}</strong><span>Follow-ups due</span></div>
    <div class="card metric"><strong>${taskPct()}%</strong><span>Daily checklist done</span><div class="progress"><div class="bar" style="width:${taskPct()}%"></div></div></div>
  </div>
  <div class="grid cols-2" style="margin-top:16px">
    <div class="card"><div class="section-title"><h3>Quick Add Lead</h3></div><div id="leadFormMount"></div></div>
    <div class="card"><h3>Today Focus</h3><div class="checklist">${DEFAULT_TASKS.slice(0,5).map((x,i)=>`<label class="check-item ${todayTasks()[i]?'done':''}"><input type="checkbox" data-task="${i}" ${todayTasks()[i]?'checked':''}> <span>${x}</span></label>`).join('')}</div></div>
  </div>`;
  mountLeadForm('#leadFormMount'); bindTasks();
}
function renderTasks(){
  setTitle('Daily Tasks');
  $('#content').innerHTML = `<div class="card"><div class="section-title"><h3>Daily Sales Checklist</h3><span class="pill">${taskPct()}% complete</span></div><div class="progress"><div class="bar" style="width:${taskPct()}%"></div></div><br><div class="checklist">${DEFAULT_TASKS.map((x,i)=>`<label class="check-item ${todayTasks()[i]?'done':''}"><input type="checkbox" data-task="${i}" ${todayTasks()[i]?'checked':''}> <span>${x}</span></label>`).join('')}</div></div>`;
  bindTasks();
}
function bindTasks(){ $$('input[data-task]').forEach(cb=>cb.onchange=async()=>{todayTasks()[cb.dataset.task]=cb.checked; await saveCloud(); render();}); }
function mountLeadForm(sel){
  const tpl=$('#leadFormTemplate').content.cloneNode(true); $(sel).appendChild(tpl);
  $('#leadForm').onsubmit=async e=>{e.preventDefault(); const fd=new FormData(e.target); const lead=Object.fromEntries(fd.entries()); lead.id=uid(); lead.assignedTo=state.user.name; lead.createdAt=new Date().toISOString(); state.leads.unshift(lead); await saveCloud(); render();};
}
function renderLeads(){
  setTitle('CRM Leads'); const leads=managerLeads();
  $('#content').innerHTML = `<div class="grid"><div id="leadFormMount"></div><div class="card"><div class="section-title"><h3>Leads Database</h3><button class="secondary" id="exportBtn">Export JSON</button></div><div class="table-wrap"><table class="table"><thead><tr><th>Company</th><th>City</th><th>Source</th><th>Status</th><th>Assigned</th><th>Next Follow-up</th><th>Notes</th></tr></thead><tbody>${leads.map(l=>`<tr><td><strong>${l.company||''}</strong><br><small>${l.phone||''} ${l.email||''}</small></td><td>${l.city||''}</td><td>${l.source||''}</td><td>${statusPill(l.status||'New')}</td><td>${l.assignedTo||''}</td><td>${l.nextFollowUp||''}</td><td>${l.notes||''}</td></tr>`).join('')||`<tr><td colspan="7" class="empty">No leads yet.</td></tr>`}</tbody></table></div></div></div>`;
  mountLeadForm('#leadFormMount'); $('#exportBtn').onclick=()=>download('sales-leads.json', JSON.stringify(state.leads,null,2));
}
function renderFollowup(){
  setTitle('Follow-up Queue'); const today=todayKey(); const due=managerLeads().filter(l=>l.nextFollowUp && l.nextFollowUp<=today && !['Closed Won','Closed Lost'].includes(l.status));
  $('#content').innerHTML = `<div class="card"><h3>Due Follow-ups</h3><div class="table-wrap"><table class="table"><thead><tr><th>Lead</th><th>Contact</th><th>Status</th><th>Due</th><th>Action</th></tr></thead><tbody>${due.map(l=>`<tr><td><strong>${l.company}</strong><br>${l.notes||''}</td><td>${l.phone||''}<br>${l.email||''}</td><td>${statusPill(l.status)}</td><td>${l.nextFollowUp}</td><td><button data-done="${l.id}" class="secondary">Mark contacted</button></td></tr>`).join('')||`<tr><td colspan="5" class="empty">No follow-ups due today.</td></tr>`}</tbody></table></div></div>`;
  $$('button[data-done]').forEach(b=>b.onclick=async()=>{const l=state.leads.find(x=>x.id===b.dataset.done); if(l){l.status='Follow-up'; l.nextFollowUp=''; l.notes=(l.notes||'')+'\nFollow-up completed '+todayKey(); await saveCloud(); render();}});
}
function renderReports(){
  setTitle('Daily Reports'); const k=todayKey(); const r=state.reports[k]?.[state.user.name]||{};
  $('#content').innerHTML = `<form class="card form-grid" id="reportForm"><h3>Daily Report</h3><input name="newLeads" type="number" placeholder="New leads" value="${r.newLeads||''}"><input name="touches" type="number" placeholder="New touches" value="${r.touches||''}"><input name="followups" type="number" placeholder="Follow-ups" value="${r.followups||''}"><input name="proposals" type="number" placeholder="Proposals sent" value="${r.proposals||''}"><input name="meetings" type="number" placeholder="Calls / meetings" value="${r.meetings||''}"><input name="sales" type="number" placeholder="Closed sales" value="${r.sales||''}"><textarea name="summary" placeholder="Results, objections, notes, plan for tomorrow">${r.summary||''}</textarea><button>Save Report</button></form>`;
  $('#reportForm').onsubmit=async e=>{e.preventDefault(); if(!state.reports[k]) state.reports[k]={}; state.reports[k][state.user.name]=Object.fromEntries(new FormData(e.target).entries()); await saveCloud(); alert('Report saved');};
}
function renderTemplates(){
  setTitle('Templates'); $('#content').innerHTML = `<div class="grid cols-2">${TEMPLATES.map(t=>`<div class="card"><h3>${t.title}</h3><div class="template-box">${t.body}</div></div>`).join('')}</div>`;
}
function renderPlaybook(){
  setTitle('Sales Playbook'); $('#content').innerHTML = `<div class="grid">${PLAYBOOK.map(p=>`<div class="card"><h3>${p[0]}</h3><p>${p[1]}</p></div>`).join('')}</div>`;
}
function renderAdmin(){
  setTitle('Admin Dashboard'); const by={}; state.leads.forEach(l=>{by[l.assignedTo]=by[l.assignedTo]||{total:0,won:0,follow:0}; by[l.assignedTo].total++; if(l.status==='Closed Won'||l.status==='Booked')by[l.assignedTo].won++; if(l.status==='Follow-up')by[l.assignedTo].follow++;});
  $('#content').innerHTML = `<div class="card"><h3>Company Overview</h3><div class="table-wrap"><table class="table"><thead><tr><th>Manager</th><th>Total Leads</th><th>Booked / Won</th><th>Follow-up</th></tr></thead><tbody>${Object.entries(by).map(([m,v])=>`<tr><td><strong>${m}</strong></td><td>${v.total}</td><td>${v.won}</td><td>${v.follow}</td></tr>`).join('')||`<tr><td colspan="4" class="empty">No company data yet.</td></tr>`}</tbody></table></div></div><div class="card"><h3>Firebase Setup Reminder</h3><p>To make this dashboard shared between managers, open <strong>firebase-config.js</strong>, paste your Firebase project config, and set <strong>FIREBASE_ENABLED = true</strong>.</p></div>`;
}
function download(filename, text){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'application/json'})); a.download=filename; a.click(); }
function render(){
  $('#userName').value=state.user.name; $('#roleSelect').value=state.user.role; renderNav();
  ({dashboard:renderDashboard,tasks:renderTasks,leads:renderLeads,followup:renderFollowup,reports:renderReports,templates:renderTemplates,playbook:renderPlaybook,admin:renderAdmin}[state.page]||renderDashboard)();
}
$('#saveUserBtn').onclick=async()=>{state.user={name:$('#userName').value||'Sales Manager', role:$('#roleSelect').value}; await saveCloud(); render();};
initFirebase().then(render);
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./service-worker.js').catch(()=>{}); }
