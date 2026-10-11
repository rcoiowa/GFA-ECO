const workflow = new DemoWorkflow();
let actor = 'Executive';
const byId = id => document.getElementById(id);
const profiles = {
  'Executive': {description:'Decisions, relationships, and capacity.', priorities:[['Deliver','Move one accepted funding or strategy action.'],['Return','Fulfill or renegotiate one partner promise.'],['Protect','Keep a break and a definite ending time.']], routine:['Check urgent matters and actual coverage.','Choose one deliverable and one relationship.','Make necessary decisions; keep each owner clear.','Confirm outcomes, accepted handoffs, and the next check.'], week:['Monday: coverage and accepted priorities','Tuesday: funding and finance','Wednesday: partners and reentry','Thursday: service and product bottlenecks','Friday: closure and governance']},
  'Data administrator': {description:'Reliable records and useful exceptions.', priorities:[['Resolve','Route one service-blocking data exception.'],['Verify','Check the period, denominator, and source for a due report.'],['Simplify','Remove one duplicate capture or improve one procedure.']], routine:['Check failed saves, access issues, and due reports.','Prioritize exceptions that prevent service.','Ask source owners; never invent completion evidence.','Return corrections, set next checks, and verify saves.'], week:['Monday: commitment queue','Tuesday: consent and unique-count quality','Wednesday: service and meeting evidence','Thursday: access and workflow tests','Friday: verified aggregate snapshot']},
  'House manager': {description:'Resident support and accepted shift continuity.', priorities:[['Protect','Perform actual required house checks.'],['Support','Move one chosen practical resident commitment.'],['Handoff','Confirm the next duty person accepts essential actions.']], routine:['Select assigned residence and acknowledge prior handoff.','Do required physical checks; respond to actual concerns.','Provide chosen support within policy and consent.','Obtain incoming human acceptance before duty ends.'], week:['Monday: coverage and resident commitments','Tuesday: facilities and supplies','Wednesday: scheduled house meeting or Circle','Thursday: intake and authorized practical follow-through','Friday: next coverage and operational exceptions']},
  'AI consultant': {description:'Reduce admin work while preserving human authority.', priorities:[['Inspect','Reproduce one accepted workflow problem.'],['Demonstrate','Verify a small improvement using synthetic cases.'],['Handoff','Provide limitations, verification, and rollback.']], routine:['Check scope, current target, and release holds.','Use synthetic data and the smallest reviewable change.','Test ordinary failures and denied access.','Return results to the delivery owner; record next step.'], week:['Work themes only; hours unconfirmed','Triage accepted issue','Implement and verify','Demonstrate with affected role','Return release state and rollback']}
};
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function button(label,handler){const el=element('button',label,'small');el.type='button';el.addEventListener('click',()=>{try{handler();}catch(e){notify(e.message);}});return el;}
function notify(message){byId('feedback').textContent=message;}
function modal(title,help,fields,onSubmit){
  byId('dialogTitle').textContent=title;byId('dialogHelp').textContent=help;byId('fields').replaceChildren();byId('error').hidden=true;
  for(const f of fields){const label=element('label',f.label);label.htmlFor='field-'+f.key;let input;
    if(f.options){input=element('select');for(const v of f.options){const option=element('option',v);option.value=v;input.append(option);}}
    else input=element(f.multiline?'textarea':'input');
    input.id='field-'+f.key;input.name=f.key;if(f.type)input.type=f.type;input.required=f.required!==false;if(f.value!==undefined)input.value=f.value;input.maxLength=1200;
    byId('fields').append(label,input);
  }
  byId('form').onsubmit=e=>{e.preventDefault();try{const values=Object.fromEntries(new FormData(e.target));onSubmit(values);byId('dialog').close();render();notify('Demo change saved in memory only.');}catch(error){byId('error').textContent=error.message;byId('error').hidden=false;}};
  byId('dialog').showModal();
}
function promote(note){modal('Turn note into one commitment','The creator accepts initial ownership. This does not grant consent or authority in a live system.',[
  {key:'beneficiary',label:'Person or capability served'},{key:'action',label:'One next action',value:note.text},{key:'outcome',label:'Definition of done'},{key:'permission',label:'Authority or permission, synthetic only',value:'Synthetic operational demonstration'},{key:'due',label:'Next check date, America/Chicago',type:'date'}
],v=>workflow.promote(note.id,actor,v));}
function requestHandoff(c){modal('Request a handoff','You stay responsible until the receiving demo role accepts.',[{key:'receiver',label:'Receiving role',options:ROLES.filter(r=>r!==actor)}],v=>workflow.proposeHandoff(c.id,actor,v.receiver));}
function closeCommitment(c){modal('Close with an honest disposition','Evidence must match the result. Record the return to the person, or why a return could not happen.',[
  {key:'disposition',label:'Disposition',options:CLOSED},{key:'evidence',label:'Completion or disposition evidence',multiline:true},{key:'returnRecord',label:'Relational return or why it was not possible',multiline:true}
],v=>workflow.close(c.id,actor,v.disposition,v.evidence,v.returnRecord));}
function continueCommitment(c){modal('Set the next check','Waiting and blocked work stay owned.',[
  {key:'status',label:'Current state',options:['open','waiting','blocked'],value:c.status},{key:'due',label:'Next check date',type:'date',value:c.due},{key:'reason',label:'What happens next',value:c.action}
],v=>workflow.continue(c.id,actor,v.status,v.due,v.reason));}
function render(){
  const profile=profiles[actor];byId('roleDescription').textContent=profile.description;
  byId('dayLabel').textContent=new Intl.DateTimeFormat('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/Chicago'}).format(new Date())+' · America/Chicago';
  byId('priorities').replaceChildren();profile.priorities.forEach(([title,body],i)=>{const row=element('div',undefined,'priority');const text=element('div');text.append(element('strong',title),element('p',body));row.append(element('span',String(i+1),'number'),text);byId('priorities').append(row);});
  byId('routine').replaceChildren(...profile.routine.map((text,i)=>{const li=element('li');li.append(element('strong',i===0?'Opening':i===3?'Closing':'During the day'),element('span',text));return li;}));
  byId('week').replaceChildren(...profile.week.map(t=>element('p',t,'muted')));
  const notes=workflow.notes.filter(n=>n.author===actor&&(byId('showArchived').checked||!n.archived)).sort((a,b)=>Number(b.pinned)-Number(a.pinned));
  byId('notes').replaceChildren();if(!notes.length)byId('notes').append(element('p','No notes for this demo role. Capture only what is useful.','empty'));
  notes.forEach(n=>{const card=element('article',undefined,'note'+(n.commitmentId?' linked':''));card.append(element('h3',(n.pinned?'Pinned · ':'')+(n.archived?'Archived · ':'')+'Private demo capture'));
    if(!n.collapsed)card.append(element('p',n.text));
    if(n.commitmentId){const linked=workflow.commitments.find(c=>c.id===n.commitmentId);card.append(element('p','Linked commitment: '+linked.status+'. Archiving this note does not change it.','muted'));}
    const actions=element('div',undefined,'actions');
    actions.append(button(n.collapsed?'Expand':'Collapse',()=>{workflow.toggleNote(n.id,actor,'collapsed');render();}),button(n.pinned?'Unpin':'Pin',()=>{workflow.toggleNote(n.id,actor,'pinned');render();}),button(n.archived?'Restore':'Archive',()=>{workflow.toggleNote(n.id,actor,'archived');render();}));
    if(!n.commitmentId)actions.append(button('Edit',()=>modal('Edit private demo note','Keep this capture short.',[{key:'text',label:'Note',multiline:true,value:n.text}],v=>workflow.editNote(n.id,actor,v.text))),button('Make commitment',()=>promote(n)));
    card.append(actions);byId('notes').append(card);
  });
  byId('commitments').replaceChildren();const visible=workflow.visible(actor);
  if(!visible.length)byId('commitments').append(element('p','No commitments or handoff requests for this demo role.','empty'));
  visible.forEach(c=>{const closed=CLOSED.includes(c.status);const card=element('article',undefined,'task'+(closed?' closed':''));card.append(element('div',c.status,'status'),element('h3',c.action),element('p','Serves: '+c.beneficiary),element('p','Owner: '+c.owner+' · Next check: '+c.due),element('p','Done means: '+c.outcome),element('p','Authority: '+c.permission));
    const actions=element('div',undefined,'actions');
    if(c.proposedOwner){card.append(element('p','Handoff awaiting '+c.proposedOwner+'. Sender is still owner.'));if(c.proposedOwner===actor)actions.append(button('Accept handoff',()=>{workflow.respondHandoff(c.id,actor,true);render();}),button('Decline handoff',()=>{workflow.respondHandoff(c.id,actor,false);render();}));}
    if(c.owner===actor&&!closed){actions.append(button('Next check',()=>continueCommitment(c)));if(!c.proposedOwner)actions.append(button('Request handoff',()=>requestHandoff(c)),button('Close loop',()=>closeCommitment(c)));}
    if(c.closure)card.append(element('p','Evidence: '+c.closure.evidence),element('p','Return: '+c.closure.returnRecord));
    const details=element('details');details.append(element('summary','Transition history'));details.append(...c.history.map(h=>element('p',h.event+' · '+h.actor)));card.append(actions,details);byId('commitments').append(card);
  });
  byId('dayClose').hidden=true;byId('tomorrow').value='';
}
byId('role').addEventListener('change',e=>{actor=e.target.value;render();notify('Demo role changed. No live sign-in occurred.');});
byId('showArchived').addEventListener('change',render);
byId('newNote').addEventListener('click',()=>modal('Make a note of it','Private to this demo role in the interface. In-memory demonstration only; use invented details.',[{key:'text',label:'What moved or what needs remembering?',multiline:true}],v=>workflow.capture(actor,v.text)));
byId('cancel').addEventListener('click',()=>byId('dialog').close());
byId('endDay').addEventListener('click',()=>{const s=workflow.endDay(actor);byId('closeSummary').textContent=`${s.closed} closed dispositions · ${s.open} open commitments · ${s.pendingHandoffs} pending handoffs visible to this demo role.`;byId('dayClose').hidden=false;byId('dayClose').scrollIntoView({behavior:'smooth'});});
byId('finishDay').addEventListener('click',()=>{const action=byId('tomorrow').value.trim();if(!action){notify('Choose tomorrow’s first action before finishing the demo day.');byId('tomorrow').focus();return;}workflow.capture(actor,'Tomorrow: '+action);render();notify('Demo day finished. Tomorrow’s first action is a private in-memory note; no live logout or duty transfer occurred.');});
workflow.capture('Executive','Demo partner requested a one-page scope draft. Confirm the next action and a realistic return date.');
workflow.capture('Data administrator','Demo report needs a defined period and verified denominator before external use.');
workflow.capture('House manager','Demo next duty person needs to accept the shift handoff before it is complete.');
workflow.capture('AI consultant','Demo release checklist should distinguish source integration from live verification.');
render();
