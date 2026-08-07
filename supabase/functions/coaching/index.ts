const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0a0714">
<title>Grace Coaching — GFA VRCC</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,650&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{
  --void:#0a0714; --panel:#140e22; --panel2:#1b1230; --edge:#2a1d47;
  --purple:#8f5ff3; --purple-soft:#b79cf8; --ink:#efeaf9; --dim:#9a8fc0;
  --live:#4ade80; --amber:#f5c04e; --rose:#f47f9d;
  --r:18px; --tap:56px;
}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:var(--void);color:var(--ink);font:16px/1.5 "Outfit",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
h1,h2,h3{font-family:"Fraunces",serif;font-weight:650;letter-spacing:.01em}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
input,textarea,select{font:inherit;color:var(--ink);background:var(--panel2);border:1px solid var(--edge);border-radius:12px;padding:14px;width:100%}
input:focus,textarea:focus,select:focus,button:focus-visible{outline:2px solid var(--purple);outline-offset:2px}
::placeholder{color:var(--dim)}
#app{max-width:680px;margin:0 auto;min-height:100%;display:flex;flex-direction:column}
main{flex:1;padding:16px 16px 96px}
.topbar{display:flex;align-items:center;gap:12px;padding:14px 16px;position:sticky;top:0;background:linear-gradient(var(--void) 70%,transparent);z-index:5}
.topbar h1{font-size:20px;flex:1}
.brand-dot{width:12px;height:12px;border-radius:50%;background:var(--purple);box-shadow:0 0 14px var(--purple)}
.bell{position:relative;width:44px;height:44px;display:grid;place-items:center;border-radius:12px}
.bell .n{position:absolute;top:4px;right:4px;min-width:18px;height:18px;border-radius:9px;background:var(--rose);color:#1c0512;font-size:11px;font-weight:700;display:grid;place-items:center;padding:0 4px}
.card{background:var(--panel);border:1px solid var(--edge);border-radius:var(--r);padding:16px;margin-bottom:14px}
.card h3{font-size:18px;margin-bottom:6px}
.muted{color:var(--dim);font-size:14px}
.small{font-size:13px}
.row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.grow{flex:1}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:var(--tap);padding:0 20px;border-radius:14px;font-weight:600;background:var(--panel2);border:1px solid var(--edge);width:100%}
.btn.primary{background:var(--purple);color:#120826;border-color:var(--purple)}
.btn.live{background:var(--live);color:#04220f;border-color:var(--live);font-size:17px}
.btn.ghost{background:none}
.btn.sm{min-height:44px;width:auto;font-size:14px}
.btn:disabled{opacity:.45;cursor:default}
.chip{border:1px solid var(--edge);background:var(--panel2);border-radius:999px;padding:10px 16px;font-size:14px;min-height:44px}
.chip.sel{border-color:var(--purple);background:rgba(143,95,243,.18);color:var(--purple-soft)}
.status{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:4px 10px;border-radius:999px}
.s-requested{background:rgba(154,143,192,.15);color:var(--dim)}
.s-times_suggested,.s-counter_proposed{background:rgba(245,192,78,.15);color:var(--amber)}
.s-confirmed{background:rgba(74,222,128,.14);color:var(--live)}
.s-completed{background:rgba(143,95,243,.16);color:var(--purple-soft)}
.s-cancelled{background:rgba(244,127,157,.14);color:var(--rose)}
.pair{display:flex;align-items:center;gap:0;margin:10px 0 4px;height:34px}
.node{width:14px;height:14px;border-radius:50%;background:var(--purple);flex:none}
.node.you{background:var(--purple-soft)}
.filament{flex:1;height:0;border-top:2px dashed var(--edge);position:relative}
.pair.confirmed .filament{border-top:2px solid var(--purple)}
.pair.live .filament{border-top:2px solid var(--live)}
.pair.live .node{background:var(--live);box-shadow:0 0 12px var(--live)}
.pair .pulse{position:absolute;top:-4px;left:0;width:6px;height:6px;border-radius:50%;background:var(--purple-soft);opacity:0}
.pair.confirmed .pulse{animation:travel 3.2s linear infinite;opacity:1}
@keyframes travel{from{left:0}to{left:calc(100% - 6px)}}
@media (prefers-reduced-motion:reduce){.pair .pulse{animation:none;opacity:0}}
.pairlabels{display:flex;justify-content:space-between;font-size:12px;color:var(--dim)}
.tabs{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;background:rgba(10,7,20,.92);backdrop-filter:blur(8px);border-top:1px solid var(--edge);padding-bottom:env(safe-area-inset-bottom)}
.tabs .in{display:flex;width:100%;max-width:680px}
.tab{flex:1;min-height:64px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:var(--dim);font-size:12px;font-weight:600}
.tab.on{color:var(--purple-soft)}
.tab .ic{font-size:20px}
.msgs{display:flex;flex-direction:column;gap:8px;padding-bottom:8px}
.msg{max-width:82%;padding:12px 14px;border-radius:16px;background:var(--panel2);border:1px solid var(--edge)}
.msg.me{align-self:flex-end;background:rgba(143,95,243,.22);border-color:rgba(143,95,243,.4)}
.msg time{display:block;font-size:11px;color:var(--dim);margin-top:4px}
.composer{position:sticky;bottom:80px;display:flex;gap:8px}
.composer textarea{min-height:52px;max-height:120px;resize:none;border-radius:16px}
.center{min-height:70vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:24px}
.center h2{font-size:28px}
.field{margin-bottom:14px}
.field label{display:block;font-size:14px;font-weight:600;margin-bottom:6px;color:var(--purple-soft)}
.timegrid{display:flex;flex-direction:column;gap:8px}
.notif{border-left:3px solid var(--purple);padding:12px 14px;background:var(--panel);border-radius:0 12px 12px 0;margin-bottom:10px}
.notif.unread{background:var(--panel2)}
.toast{position:fixed;left:50%;transform:translateX(-50%);bottom:104px;background:var(--purple);color:#120826;font-weight:600;padding:12px 20px;border-radius:14px;z-index:20;box-shadow:0 8px 30px rgba(143,95,243,.45)}
.empty{padding:30px 16px;text-align:center;color:var(--dim)}
.empty .glyph{font-size:34px;margin-bottom:8px}
a{color:var(--purple-soft)}
.seg{display:flex;background:var(--panel2);border:1px solid var(--edge);border-radius:14px;padding:4px;margin-bottom:14px}
.seg button{flex:1;min-height:44px;border-radius:10px;font-weight:600;color:var(--dim)}
.seg button.on{background:var(--purple);color:#120826}
</style>
</head>
<body>
<div id="app"><div class="center"><div class="brand-dot"></div><p class="muted">Opening Grace Coaching…</p></div></div>
<script type="module">
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
var SB_URL = "https://ykykeioydvtxpyreshhs.supabase.co";
var SB_KEY = "sb_publishable_9NOklH5Dvj3PcQs2dCLdpg_zx4txe8a";
var sb = createClient(SB_URL, SB_KEY);
var $ = function(s){ return document.querySelector(s); };
var app = $("#app");
var me = null, myProfile = null, view = "sessions", threadWith = null, dmChannel = null;
var TYPES = { peer_support:"Peer support", recovery_coach:"Recovery coaching", life_coach:"Life coaching", navigation:"Resource navigation", needs_assessment:"Needs assessment" };
var STATUS = { requested:"Waiting for a coach", times_suggested:"Time proposed", counter_proposed:"New times offered", confirmed:"Confirmed", completed:"Completed", cancelled:"Cancelled" };

function esc(s){ var d=document.createElement("div"); d.textContent=(s==null?"":String(s)); return d.innerHTML; }
function fmt(iso){ if(!iso) return ""; var d=new Date(iso);
  return d.toLocaleString([], {weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"}); }
function toast(t){ var el=document.createElement("div"); el.className="toast"; el.textContent=t;
  document.body.appendChild(el); setTimeout(function(){el.remove();},2800); }
function isStaff(){ return myProfile &&
    ["coach","navigator","admin"].indexOf(myProfile.role)>=0; }
function soonState(iso){ if(!iso) return ""; var diff=new Date(iso)-Date.now();
  if(diff < 60*60000 && diff > -90*60000) return "live"; return "confirmed"; }

async function boot(){
  var s = await sb.auth.getSession();
  if(!s.data.session){ renderAuth(); return; }
  me = s.data.session.user;
  var p = await sb.from("v2_profiles").select("*").eq("id", me.id).maybeSingle();
  if(!p.data){
    var name = (me.user_metadata && me.user_metadata.full_name) || me.email.split("@")[0];
    await sb.from("v2_profiles").insert({ id: me.id, role:"participant", display_name:name });
    p = await sb.from("v2_profiles").select("*").eq("id", me.id).maybeSingle();
  }
  myProfile = p.data;
  view = isStaff() ? "pool" : "sessions";
  render();
  setInterval(refreshBell, 60000);
}
function renderAuth(){
  app.innerHTML =
   '<div class="center"><div class="brand-dot"></div>'+
   '<h2>Grace Coaching</h2>'+
   '<p class="muted">No fees. No stigma. Just grace.<br>Sign in to connect with your coach.</p>'+
   '<div style="width:100%;max-width:360px;text-align:left">'+
   '<div class="field"><label for="em">Email</label><input id="em" type="email" autocomplete="email"></div>'+
   '<div class="field"><label for="pw">Password</label><input id="pw" type="password" autocomplete="current-password"></div>'+
   '<button class="btn primary" id="si">Sign in</button>'+
   '<p class="small muted" style="margin-top:10px;text-align:center">New here? <a href="#" id="su">Create your account</a></p>'+
   '</div></div>';
  $("#si").onclick = async function(){
    var r = await sb.auth.signInWithPassword({ email:$("#em").value.trim(), password:$("#pw").value });
    if(r.error){ toast(r.error.message); return; } boot();
  };
  $("#su").onclick = async function(e){ e.preventDefault();
    var em=$("#em").value.trim(), pw=$("#pw").value;
    if(!em||pw.length<8){ toast("Enter your email and a password of 8+ characters"); return; }
    var r = await sb.auth.signUp({ email:em, password:pw });
    if(r.error){ toast(r.error.message); return; }
    toast("Account created — signing you in"); boot();
  };
}

function shell(title, inner, tabs){
  var t = tabs.map(function(x){
    return '<button class="tab '+(view===x.id?"on":"")+'" data-v="'+x.id+'"><span class="ic">'+x.ic+'</span>'+x.label+'</button>';
  }).join("");
  app.innerHTML =
   '<div class="topbar"><div class="brand-dot"></div><h1>'+esc(title)+'</h1>'+
   '<button class="bell" id="bell" aria-label="Notifications">🔔<span class="n" id="bellN" hidden></span></button>'+
   '<button class="btn ghost sm" id="out">Sign out</button></div>'+
   '<main id="main">'+inner+'</main>'+
   '<nav class="tabs"><div class="in">'+t+'</div></nav>';
  $("#out").onclick = async function(){ await sb.auth.signOut(); location.reload(); };
  $("#bell").onclick = function(){ view="alerts"; render(); };
  document.querySelectorAll(".tab").forEach(function(b){ b.onclick=function(){ view=b.dataset.v; threadWith=null; render(); }; });
  refreshBell();
}
async function refreshBell(){
  var r = await sb.from("v2_notifications").select("id",{count:"exact",head:true}).is("read_at",null).eq("recipient_id",me.id);
  var n = $("#bellN"); if(!n) return;
  if(r.count>0){ n.hidden=false; n.textContent = r.count>9?"9+":r.count; } else n.hidden=true;
}

function pairHTML(state, left, right){
  return '<div class="pair '+state+'"><div class="node you"></div><div class="filament"><div class="pulse"></div></div><div class="node"></div></div>'+
         '<div class="pairlabels"><span>'+esc(left)+'</span><span>'+esc(right)+'</span></div>';
}

function sessionCard(sr, names, forCoach){
  var other = forCoach ? (names[sr.participant_id]||"Participant") : (names[sr.coach_id]||"Any Grace coach");
  var mine = myProfile.display_name || "You";
  var st = sr.status;
  var pairState = st==="confirmed" ? soonState(sr.scheduled_at) : "";
  var h = '<div class="card" data-id="'+sr.id+'">'+
    '<div class="row"><h3 class="grow">'+esc(TYPES[sr.session_type]||"Session")+'</h3>'+
    '<span class="status s-'+st+'">'+esc(STATUS[st]||st)+'</span></div>'+
    '<p class="muted small">'+esc(sr.topic||"")+'</p>'+
    pairHTML(pairState, mine, other);
  if(st==="confirmed"){
    h+='<p style="margin:10px 0 12px;font-weight:600">'+fmt(sr.scheduled_at)+'</p>';
    if(sr.meeting_url){
      var live = pairState==="live";
      h+='<a class="btn '+(live?"live":"primary")+'" href="'+esc(sr.meeting_url)+'" target="_blank" rel="noopener">'+(live?"Join session now":"Join session")+'</a>';
    } else h+='<p class="small muted">Your join link will appear here.</p>';
    if(new Date(sr.scheduled_at) < Date.now()){
      h+='<div class="row" style="margin-top:10px"><button class="btn sm act" data-act="complete">Mark completed</button></div>';
    }
  }
  var iAmCoach = sr.coach_id===me.id;
  if(st==="times_suggested" && !iAmCoach){
    h+='<p class="small" style="margin:8px 0">'+esc(other)+' proposed:</p><div class="timegrid">'+
      (sr.suggested_times||[]).map(function(t){return '<button class="btn act" data-act="accept" data-t="'+esc(t)+'">'+fmt(t)+'</button>';}).join("")+
      '</div><button class="btn ghost sm act" data-act="counter" style="margin-top:8px">None of these work — offer other times</button>';
  }
  if(st==="counter_proposed" && iAmCoach){
    h+='<p class="small" style="margin:8px 0">'+esc(other)+' offered:</p><div class="timegrid">'+
      (sr.preferred_times||[]).map(function(t){return '<button class="btn act" data-act="accept" data-t="'+esc(t)+'">'+fmt(t)+'</button>';}).join("")+
      '</div><button class="btn ghost sm act" data-act="propose" style="margin-top:8px">Suggest different times</button>';
  }
  if(st==="requested" && iAmCoach){
    h+='<button class="btn primary act" data-act="propose" style="margin-top:8px">Propose times</button>';
  }
  if(st==="requested" && !forCoach){
    h+='<p class="small muted" style="margin-top:8px">Preferred: '+(sr.preferred_times||[]).map(fmt).join(" · ")+'</p>';
  }
  if(st!=="cancelled"&&st!=="completed"){
    h+='<div class="row" style="margin-top:10px"><button class="btn ghost sm act" data-act="cancel">Cancel</button></div>';
  }
  if(st==="completed"){
    h+='<button class="btn sm act" data-act="feedback" style="margin-top:8px">Share how it went</button>';
  }
  return h+"</div>";
}
function timePickers(n){
  var h=""; for(var i=0;i<n;i++) h+='<input type="datetime-local" class="tp" style="margin-bottom:8px">';
  return h;
}
function collectTimes(){
  var out=[]; document.querySelectorAll(".tp").forEach(function(i){ if(i.value) out.push(new Date(i.value).toISOString()); });
  return out;
}
async function nameMap(ids){
  ids = ids.filter(function(x,i){ return x && ids.indexOf(x)===i; });
  if(!ids.length) return {};
  var r = await sb.from("v2_profiles").select("id,display_name").in("id",ids);
  var m={}; (r.data||[]).forEach(function(p){ m[p.id]=p.display_name; }); return m;
}
function wireSessionActions(container, reload){
  container.querySelectorAll(".act").forEach(function(b){
    b.onclick = async function(){
      var card = b.closest(".card"), id = card.dataset.id, act = b.dataset.act;
      if(act==="accept"){
        var r = await sb.rpc("accept_session_proposal", { p_request_id:id, p_selected_time:b.dataset.t });
        if(r.error){ toast(r.error.message); return; }
        if(!r.data || !r.data.ok){ toast((r.data&&r.data.message)||"That time is no longer available"); reload(); return; }
        toast("Session confirmed"); reload();
      }
      if(act==="counter"||act==="propose"){
        if(card.querySelector(".pickwrap")) return;
        card.insertAdjacentHTML("beforeend",
          '<div class="pickwrap" style="margin-top:10px"><p class="small" style="margin-bottom:6px">Offer up to 3 times that work for you:</p>'+
          timePickers(3)+'<button class="btn primary sendtimes">Send times</button></div>');
        card.querySelector(".sendtimes").onclick = async function(){
          var ts = collectTimes(); if(!ts.length){ toast("Pick at least one time"); return; }
          var patch = act==="counter"
            ? { status:"counter_proposed", preferred_times:ts, last_actor:me.id }
            : { status:"times_suggested", suggested_times:ts, coach_id:me.id, last_actor:me.id };
          var r = await sb.from("v2_session_requests").update(patch).eq("id",id);
          if(r.error){ toast(r.error.message); return; }
          toast("Times sent"); reload();
        };
      }
      if(act==="cancel"){
        if(!confirm("Cancel this session?")) return;
        await sb.from("v2_session_requests").update({ status:"cancelled", last_actor:me.id }).eq("id",id);
        reload();
      }
      if(act==="complete"){
        await sb.from("v2_session_requests").update({ status:"completed", last_actor:me.id }).eq("id",id); reload();
      }
      if(act==="feedback"){
        if(card.querySelector("#fbsend")) return;
        card.insertAdjacentHTML("beforeend",
          '<div style="margin-top:10px"><div class="row" id="stars">'+
          [1,2,3,4,5].map(function(i){return '<button class="chip" data-s="'+i+'">'+i+'★</button>';}).join("")+
          '</div><textarea id="fb" placeholder="What helped? Anything for next time?" style="margin:8px 0"></textarea>'+
          '<button class="btn primary" id="fbsend">Send</button></div>');
        var rating=5;
        card.querySelectorAll("#stars .chip").forEach(function(c){ c.onclick=function(){ rating=+c.dataset.s;
          card.querySelectorAll("#stars .chip").forEach(function(x){x.classList.remove("sel");}); c.classList.add("sel"); };});
        card.querySelector("#fbsend").onclick = async function(){
          await sb.from("v2_session_feedback").insert({ session_id:id, author_id:me.id, rating:rating, what_helped:card.querySelector("#fb").value });
          toast("Thank you — noted with grace"); reload();
        };
      }
    };
  });
}

async function vSessions(){
  var r = await sb.from("v2_session_requests").select("*").eq("participant_id",me.id).neq("status","cancelled").order("created_at",{ascending:false});
  var rows = r.data||[];
  var names = await nameMap(rows.map(function(x){return x.coach_id;}));
  var up = rows.filter(function(x){return x.status==="confirmed";});
  var open = rows.filter(function(x){return ["requested","times_suggested","counter_proposed"].indexOf(x.status)>=0;});
  var done = rows.filter(function(x){return x.status==="completed";}).slice(0,5);
  var h = "";
  if(!rows.length) h='<div class="empty"><div class="glyph">◦—◦</div><p>No sessions yet.<br>When you request one, a Grace coach will pick it up.</p></div>';
  if(up.length){ h+='<h2 style="margin:6px 0 12px">Upcoming</h2>'+up.map(function(s){return sessionCard(s,names,false);}).join(""); }
  if(open.length){ h+='<h2 style="margin:16px 0 12px">In motion</h2>'+open.map(function(s){return sessionCard(s,names,false);}).join(""); }
  if(done.length){ h+='<h2 style="margin:16px 0 12px">Recent</h2>'+done.map(function(s){return sessionCard(s,names,false);}).join(""); }
  return h;
}
function vRequest(){
  var typeChips = Object.keys(TYPES).map(function(k){
    return '<button class="chip tchip" data-k="'+k+'">'+TYPES[k]+'</button>';
  }).join("");
  return '<h2 style="margin:6px 0 12px">Request a session</h2><div class="card">'+
   '<div class="field"><label>What kind of support?</label><div class="row">'+typeChips+'</div></div>'+
   '<div class="field"><label>How would you like to meet?</label><div class="row">'+
     '<button class="chip mchip sel" data-m="video">Video</button><button class="chip mchip" data-m="phone">Phone</button><button class="chip mchip" data-m="in_person">In person</button></div></div>'+
   '<div class="field"><label for="topic">What would you like to focus on?</label><textarea id="topic" placeholder="Whatever you want to bring — it all belongs here."></textarea></div>'+
   '<div class="field"><label>A few times that could work (optional)</label>'+timePickers(3)+'</div>'+
   '<button class="btn primary" id="send">Send request</button>'+
   '<p class="small muted" style="margin-top:10px">Your request goes to your coach if you have one — otherwise every Grace coach can see it and pick it up.</p></div>';
}
async function wireRequest(){
  var stype="recovery_coach", mode="video";
  document.querySelectorAll(".tchip").forEach(function(c){ if(c.dataset.k===stype) c.classList.add("sel");
    c.onclick=function(){ stype=c.dataset.k; document.querySelectorAll(".tchip").forEach(function(x){x.classList.remove("sel");}); c.classList.add("sel"); };});
  document.querySelectorAll(".mchip").forEach(function(c){ c.onclick=function(){ mode=c.dataset.m;
    document.querySelectorAll(".mchip").forEach(function(x){x.classList.remove("sel");}); c.classList.add("sel"); };});
  $("#send").onclick = async function(){
    var topic = $("#topic").value.trim() || TYPES[stype];
    var a = await sb.from("v2_coach_assignments").select("coach_id").eq("participant_id",me.id).eq("is_active",true).maybeSingle();
    var r = await sb.from("v2_session_requests").insert({
      participant_id:me.id, coach_id:(a.data?a.data.coach_id:null), status:"requested",
      mode:mode, topic:topic, session_type:stype, preferred_times:collectTimes(), suggested_times:[], last_actor:me.id });
    if(r.error){ toast(r.error.message); return; }
    toast(a.data ? "Sent to your coach" : "Sent — a coach will pick this up");
    view="sessions"; render();
  };
}

async function vMessages(){
  var pairs;
  if(isStaff()){
    var r = await sb.from("v2_coach_assignments").select("participant_id").eq("coach_id",me.id).eq("is_active",true);
    pairs = (r.data||[]).map(function(x){return x.participant_id;});
  } else {
    var r2 = await sb.from("v2_coach_assignments").select("coach_id").eq("participant_id",me.id).eq("is_active",true);
    pairs = (r2.data||[]).map(function(x){return x.coach_id;});
  }
  if(!pairs.length) return '<div class="empty"><div class="glyph">✉</div><p>'+(isStaff()?"Messages open when you connect with a participant.":"Messaging opens once a coach connects with you. Request a session to get started.")+'</p></div>';
  if(!threadWith && pairs.length===1) threadWith = pairs[0];
  if(!threadWith){
    var names = await nameMap(pairs);
    return '<h2 style="margin:6px 0 12px">Messages</h2>'+pairs.map(function(id){
      return '<button class="card thread" style="width:100%;text-align:left" data-id="'+id+'"><h3>'+esc(names[id]||"…")+'</h3><p class="muted small">Open conversation</p></button>';
    }).join("");
  }
  var pid = isStaff()?threadWith:me.id, cid = isStaff()?me.id:threadWith;
  var m = await sb.from("v2_direct_messages").select("*").eq("participant_id",pid).eq("coach_id",cid).order("created_at").limit(200);
  var names2 = await nameMap([threadWith]);
  var msgs = (m.data||[]).map(function(x){
    return '<div class="msg '+(x.sender_id===me.id?"me":"")+'">'+esc(x.body)+'<time>'+fmt(x.created_at)+'</time></div>';
  }).join("");
  return '<h2 style="margin:6px 0 12px">'+esc(names2[threadWith]||"Conversation")+'</h2>'+
   '<div class="msgs" id="msgs">'+(msgs||'<p class="empty">Say hello — this space is yours.</p>')+'</div>'+
   '<div class="composer"><textarea id="dmtext" placeholder="Write a message…"></textarea><button class="btn primary sm" id="dmsend" style="min-height:52px">Send</button></div>';
}
function wireMessages(){
  document.querySelectorAll(".thread").forEach(function(b){ b.onclick=function(){ threadWith=b.dataset.id; render(); };});
  var send = $("#dmsend"); if(!send) return;
  var pid = isStaff()?threadWith:me.id, cid = isStaff()?me.id:threadWith;
  send.onclick = async function(){
    var t = $("#dmtext").value.trim(); if(!t) return;
    var r = await sb.from("v2_direct_messages").insert({ participant_id:pid, coach_id:cid, sender_id:me.id, body:t });
    if(r.error){ toast(r.error.message); return; }
    $("#dmtext").value=""; render();
  };
  if(dmChannel) sb.removeChannel(dmChannel);
  dmChannel = sb.channel("dm-"+pid+"-"+cid)
    .on("postgres_changes",{event:"INSERT",schema:"public",table:"v2_direct_messages",filter:"participant_id=eq."+pid},function(){ if(view==="messages") render(); })
    .subscribe();
  var box=$("#msgs"); if(box) box.scrollTop=box.scrollHeight;
}

async function vPool(){
  var r = await sb.from("v2_session_requests").select("*").is("coach_id",null).eq("status","requested").order("created_at");
  var rows=r.data||[];
  var names = await nameMap(rows.map(function(x){return x.participant_id;}));
  var mine = await sb.from("v2_session_requests").select("*").eq("coach_id",me.id).in("status",["requested","times_suggested","counter_proposed"]).order("created_at");
  var h='<h2 style="margin:6px 0 12px">Open requests</h2>';
  if(!rows.length) h+='<div class="empty"><div class="glyph">◦</div><p>The pool is clear. Every request has a coach.</p></div>';
  h+=rows.map(function(sr){
    return '<div class="card" data-id="'+sr.id+'" data-p="'+sr.participant_id+'">'+
     '<div class="row"><h3 class="grow">'+esc(names[sr.participant_id]||"Participant")+'</h3><span class="status s-requested">Unclaimed</span></div>'+
     '<p class="muted small">'+esc(TYPES[sr.session_type])+' · '+esc(sr.mode)+' — “'+esc(sr.topic)+'”</p>'+
     ((sr.preferred_times||[]).length?'<p class="small muted" style="margin-top:6px">Their times: '+(sr.preferred_times||[]).map(fmt).join(" · ")+'</p>':"")+
     '<button class="btn primary pickup" style="margin-top:10px">Pick up this participant</button></div>';
  }).join("");
  if((mine.data||[]).length){
    var n2 = await nameMap(mine.data.map(function(x){return x.participant_id;}));
    h+='<h2 style="margin:16px 0 12px">Needs your reply</h2>'+mine.data.map(function(s){return sessionCard(s,n2,true);}).join("");
  }
  return h;
}
function wirePool(){
  document.querySelectorAll(".pickup").forEach(function(b){
    b.onclick = async function(){
      var card=b.closest(".card"), id=card.dataset.id;
      var r = await sb.rpc("claim_coaching_request", { p_request_id:id });
      if(r.error){ toast(r.error.message); render(); return; }
      if(!r.data || !r.data.ok){ toast((r.data&&r.data.message)||"Another coach just picked this up"); render(); return; }
      toast("They're with you now"); render();
    };
  });
}
async function vCoachSessions(){
  var r = await sb.from("v2_session_requests").select("*").eq("coach_id",me.id).in("status",["confirmed","completed"]).order("scheduled_at",{ascending:true});
  var rows=r.data||[];
  var names = await nameMap(rows.map(function(x){return x.participant_id;}));
  var up=rows.filter(function(x){return x.status==="confirmed";});
  var done=rows.filter(function(x){return x.status==="completed";}).slice(-5).reverse();
  var h='<h2 style="margin:6px 0 12px">Upcoming sessions</h2>';
  if(!up.length) h+='<div class="empty"><div class="glyph">◦—◦</div><p>Nothing scheduled yet.</p></div>';
  h+=up.map(function(s){return sessionCard(s,names,true);}).join("");
  if(done.length) h+='<h2 style="margin:16px 0 12px">Recent</h2>'+done.map(function(s){return sessionCard(s,names,true);}).join("");
  return h;
}
async function vRoster(){
  var parts = await sb.from("v2_profiles").select("id,display_name,county").eq("role","participant").order("display_name");
  var asg = await sb.from("v2_coach_assignments").select("participant_id,coach_id,is_active").eq("is_active",true);
  var coaches = await sb.from("v2_profiles").select("id,display_name").in("role",["coach","navigator","admin"]);
  var cmap={}; (coaches.data||[]).forEach(function(c){cmap[c.id]=c.display_name;});
  var amap={}; (asg.data||[]).forEach(function(a){amap[a.participant_id]=a.coach_id;});
  var admin = ["navigator","admin"].indexOf(myProfile.role)>=0;
  var h='<h2 style="margin:6px 0 12px">Participants</h2>';
  h+=(parts.data||[]).map(function(p){
    var c=amap[p.id];
    var line = c ? (c===me.id?'<span class="status s-confirmed">With you</span>':'<span class="status s-completed">'+esc(cmap[c]||"Assigned")+'</span>')
                 : '<span class="status s-requested">Unassigned</span>';
    var btns="";
    if(!c) btns='<button class="btn sm claim" data-p="'+p.id+'">Assign to me</button>';
    if(c===me.id) btns='<button class="btn sm gomsg" data-p="'+p.id+'">Message</button> <button class="btn ghost sm newsess" data-p="'+p.id+'">Set up session</button>';
    if(admin) btns+=' <button class="btn ghost sm adassign" data-p="'+p.id+'">Assign…</button>';
    return '<div class="card"><div class="row"><h3 class="grow">'+esc(p.display_name)+'</h3>'+line+'</div>'+
      (p.county?'<p class="small muted">'+esc(p.county)+' County</p>':"")+
      '<div class="row" style="margin-top:10px">'+btns+'</div></div>';
  }).join("");
  if(admin){
    var opts=(coaches.data||[]).map(function(c){return '<option value="'+c.id+'">'+esc(c.display_name)+'</option>';}).join("");
    h+='<template id="coachopts">'+opts+'</template>';
  }
  return h;
}
function wireRoster(){
  document.querySelectorAll(".claim").forEach(function(b){ b.onclick=async function(){
    var r=await sb.rpc("assign_participant_to_coach",{p_participant_id:b.dataset.p,p_coach_id:me.id});
    if(r.error){ toast(r.error.message); } else if(!r.data||!r.data.ok){ toast((r.data&&r.data.message)||"They were just assigned"); } else toast("They're with you now");
    render(); };});
  document.querySelectorAll(".gomsg").forEach(function(b){ b.onclick=function(){ threadWith=b.dataset.p; view="messages"; render(); };});
  document.querySelectorAll(".newsess").forEach(function(b){ b.onclick=async function(){
    var card=b.closest(".card");
    if(card.querySelector(".sendnew")) return;
    card.insertAdjacentHTML("beforeend",'<div style="margin-top:10px"><p class="small" style="margin-bottom:6px">Propose up to 3 times — they can accept or offer others:</p>'+timePickers(3)+
      '<input id="ntopic" placeholder="Focus (e.g. weekly check-in)" style="margin-bottom:8px"><button class="btn primary sendnew">Send invitation</button></div>');
    card.querySelector(".sendnew").onclick=async function(){
      var ts=collectTimes(); if(!ts.length){ toast("Pick at least one time"); return; }
      var r=await sb.from("v2_session_requests").insert({ participant_id:b.dataset.p, coach_id:me.id, status:"times_suggested",
        mode:"video", topic:card.querySelector("#ntopic").value||"Coaching session", session_type:"recovery_coach",
        preferred_times:[], suggested_times:ts, last_actor:me.id });
      if(r.error){ toast(r.error.message); return; }
      toast("Invitation sent"); render();
    };
  };});
  document.querySelectorAll(".adassign").forEach(function(b){ b.onclick=async function(){
    var card=b.closest(".card"), opts=$("#coachopts").innerHTML;
    if(card.querySelector(".doassign")) return;
    card.insertAdjacentHTML("beforeend",'<div class="row" style="margin-top:10px"><select class="pickcoach" style="flex:1">'+opts+'</select><button class="btn sm doassign">Assign</button></div>');
    card.querySelector(".doassign").onclick=async function(){
      var cid=card.querySelector(".pickcoach").value;
      var r=await sb.rpc("assign_participant_to_coach",{p_participant_id:b.dataset.p,p_coach_id:cid});
      if(r.error){ toast(r.error.message); return; }
      if(!r.data||!r.data.ok){ toast((r.data&&r.data.message)||"Could not assign"); return; }
      toast("Assigned"); render();
    };
  };});
}

async function vAlerts(){
  var r = await sb.from("v2_notifications").select("*").eq("recipient_id",me.id).order("created_at",{ascending:false}).limit(40);
  var rows=r.data||[];
  if(!rows.length) return '<div class="empty"><div class="glyph">🔔</div><p>All quiet. You will hear from us here.</p></div>';
  var h='<h2 style="margin:6px 0 12px">Notifications</h2>'+rows.map(function(n){
    return '<div class="notif '+(n.read_at?"":"unread")+'"><strong>'+esc(n.title)+'</strong><p class="small muted">'+esc(n.body)+'</p><p class="small muted">'+fmt(n.created_at)+'</p></div>';
  }).join("");
  sb.from("v2_notifications").update({read_at:new Date().toISOString()}).eq("recipient_id",me.id).is("read_at",null).then(refreshBell);
  return h;
}

async function render(){
  var tabs = isStaff()
   ? [{id:"pool",ic:"◦",label:"Requests"},{id:"csessions",ic:"◦—◦",label:"Sessions"},{id:"roster",ic:"☰",label:"Participants"},{id:"messages",ic:"✉",label:"Messages"}]
   : [{id:"sessions",ic:"◦—◦",label:"Sessions"},{id:"request",ic:"＋",label:"Request"},{id:"messages",ic:"✉",label:"Messages"}];
  var inner="";
  if(view==="sessions") inner=await vSessions();
  else if(view==="request") inner=vRequest();
  else if(view==="messages") inner=await vMessages();
  else if(view==="pool") inner=await vPool();
  else if(view==="csessions") inner=await vCoachSessions();
  else if(view==="roster") inner=await vRoster();
  else if(view==="alerts") inner=await vAlerts();
  shell(isStaff()?"Grace Coaching · Coach":"Grace Coaching", inner, tabs);
  var main=$("#main");
  if(view==="request") wireRequest();
  if(view==="messages") wireMessages();
  if(view==="pool"){ wirePool(); wireSessionActions(main, render); }
  if(view==="roster") wireRoster();
  if(view==="sessions"||view==="csessions") wireSessionActions(main, render);
}
boot();
</script>
</body>
</html>`;
Deno.serve((req: Request) => {
  return new Response(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
});
