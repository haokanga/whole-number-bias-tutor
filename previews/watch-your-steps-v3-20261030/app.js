(function () {
  'use strict';
  const L=window.UpstairsLesson,S=window.UpstairsScene,app=document.getElementById('app');
  const disarmLabel=L.COPY.disarmLabel;
  let state,animation=null,activePlayback=null,activeReveal=null,generation=0;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function emphasizeTerms(html,icons=false){
    let placed=false;
    const terms=/\b(?:not an increasing sequence|not increasing|do not keep increasing|does not keep increasing|contains? a decrease|decreasing|decreases?|increasing|increases?|greater than|smaller than)\b/gi;
    return html.split(/(<[^>]+>)/g).map(part=>part.startsWith('<')?part:part.replace(terms,text=>{
      const kind=/^(?:not |do not |does not |contain|decreas|smaller)/i.test(text)?'decrease':'increase';
      const direction=icons&&!placed&&!/^(?:not |do not |does not |greater|smaller)/i.test(text);
      if(direction)placed=true;
      return (direction?'<span class="direction-icon math-keyword-'+kind+'" aria-hidden="true">'+(kind==='increase'?'↑':'↓')+'</span> ':'')+'<span class="math-keyword math-keyword-'+kind+'">'+text+'</span>';
    })).join('');
  }
  function freshState(){return {mode:'intro',flight:0,level:1,progress:0,paused:false,pairPassed:false,decisionPassed:false,decisionChoice:null,correctedPassed:false,
    practiceIndex:0,practicePassed:L.PRACTICES.map(()=>false),practiceHintRevealed:L.PRACTICES.map(()=>false),practiceAnimating:false,practiceProgress:0,
    feedback:'',feedbackKind:'',attempts:{pair:[],decision:[],corrected:[],practice:[]},events:[],replays:0};}
  function practiceSummaries(){return L.PRACTICES.map((practice,index)=>{const attempts=state.attempts.practice.filter(row=>row.practiceIndex===index);return {practiceIndex:index,practiceId:practice.id,sequence:[...practice.sequence],passed:state.practicePassed[index],first:attempts[0]||null,last:attempts.at(-1)||null,attempts};});}
  function snapshot(){return JSON.parse(JSON.stringify({...state,practiceCases:practiceSummaries()}));}
  function record(type,details){state.events.push({type,at:new Date().toISOString(),...details});}
  function cancelAnimation(){generation++;if(animation!==null)cancelAnimationFrame(animation);animation=null;activePlayback=null;if(activeReveal){activeReveal.cancel();activeReveal=null;}}
  function fitGame(){
    const frame=document.getElementById('game-frame'),layout=innerWidth<640?'portrait':innerWidth<960?'compact-landscape':'desktop';
    frame.classList.toggle('portrait-layout',layout==='portrait');frame.classList.toggle('compact-landscape',layout==='compact-landscape');
    frame.dataset.layout=layout;frame.dataset.scale='1';
  }
  function reset(options){cancelAnimation();state=freshState();render(options);}
  function moveTo(mode,options){state.mode=mode;state.feedback='';state.feedbackKind='';state.paused=false;render(options||{focus:true});}
  function currentFlight(){return L.FLIGHTS[state.flight];}
  function currentPractice(){return L.PRACTICES[state.practiceIndex];}
  function practiceScene(){return ['practice','complete'].includes(state.mode);}
  function isRepair(){return ['pair','decision','disarmed','corrected'].includes(state.mode);}
  function finalRoute(){return state.mode==='corrected';}
  function numberLineMode(){if(activePlayback?.replay||practiceScene())return '';return finalRoute()?'corrected':isRepair()||state.mode==='trap'?'trap':'';}
  function button(label,action,kind){return '<button type="button" class="'+(kind||'primary-button')+'" data-action="'+action+'">'+emphasizeTerms(label)+'</button>';}
  function telecom(forceFlint){
    const character=forceFlint||['ready','running'].includes(state.mode)?'Flint':state.mode==='trap'?'Specter':'Bellum';
    const portrait=character==='Specter'?'specter.png':character==='Flint'?'flint-portrait.png':state.decisionPassed?'bellum-success.png':'bellum-explain.png';
    const context=character==='Specter'?'Incoming transmission':character==='Flint'?'Recovered recording':practiceScene()?'Live practice':isRepair()?'Repair simulation':'Mission briefing';
    return '<aside class="telecom-panel" data-character="'+character+'" aria-label="'+character+' speaking"><div class="telecom-screen"><img class="telecom-portrait" src="assets/'+portrait+'" alt="'+character+'"></div><div class="telecom-caption"><strong>'+character+'</strong><small>'+context+'</small>'+(character==='Specter'?'<span class="laugh-cloud">HA! HA! HA!</span>':'')+'</div></aside>';
  }
  function sceneConfig(){
    if(practiceScene()){
      const p=currentPractice(),passed=state.practicePassed[state.practiceIndex];
      return {values:[...p.sequence,passed&&p.nextAnswer?p.nextAnswer:'?'],trap:false,practice:true,
        practiceStatus:state.practiceAnimating?'running':passed?(p.nextAnswer?'passed':'disarmed'):state.practiceHintRevealed[state.practiceIndex]?'wrong':'unanswered',
        mode:state.mode,numberLine:'',withheld:passed&&!p.nextAnswer};
    }
    const f=currentFlight();return {values:[...(finalRoute()?L.CORRECTED_ROUTE.sequence:f.sequence),finalRoute()?(state.correctedPassed?'2.3':'?'):(f.nextAnswer||f.baitAnswer)],
      trap:f.isTrap&&!finalRoute(),mode:state.mode,numberLine:numberLineMode(),highlightedPair:['pair','decision'].includes(state.mode)&&state.pairPassed,withheld:state.mode==='disarmed'};
  }
  function sceneProgress(){
    if(practiceScene())return state.practiceAnimating?state.practiceProgress:state.practicePassed[state.practiceIndex]&&currentPractice().nextAnswer?1:0;
    if(finalRoute())return state.correctedPassed?1:S.progressAfterStep(2,false);
    if(['success','trap','pair','decision','disarmed'].includes(state.mode))return 1;
    return state.mode==='running'?state.progress:0;
  }
  function logRows(view){
    if(practiceScene()){
      const summaries=practiceSummaries(),visible=state.mode==='complete'?summaries:[summaries[state.practiceIndex]],rows=[];
      for(const summary of visible){rows.push({kind:'note',text:'Route '+(summary.practiceIndex+1)+': '+summary.sequence.join(' → ')+'.'});
        for(const attempt of summary.attempts){rows.push({kind:'note',text:'Attempt '+attempt.attemptNumber+': '+(attempt.decision==='reject'?'chose to disarm the trap.':'entered '+attempt.input+'.')});
          for(const sentence of attempt.feedback.split(/(?<=\.)\s+(?=[A-Z0-9])/))rows.push({kind:attempt.correct?'safe':'trap',text:sentence.trim()});}}
      if(!visible.some(summary=>summary.attempts.length))rows.push({kind:'note',text:'Flint waits for a number or a decision to disarm the trap.'});
      return rows;
    }
    const values=sceneConfig().values,rows=[];
    if(finalRoute())rows.push({kind:'note',text:'New route: 1.7 → 1.9 → 2.1.'});
    else if(view.entryCommitted)rows.push({kind:'note',text:'Flint entered '+values[3]+' before climbing.'});
    if(view.contactStep>=0){rows.push({kind:'safe',text:'Flint reached '+values[0]+'.'});
      for(let i=1;i<=Math.min(view.contactStep,3);i++){if(values[i]==='?')break;const increasing=L.compareDecimals(values[i-1],values[i])===-1;rows.push({kind:increasing?'safe':'trap',text:values[i-1]+' → '+values[i]+': '+(increasing?'increases.':'decreases. The false step disappears.')});}}
    if(state.decisionPassed&&!finalRoute())rows.push({kind:'note',text:'1.13 left unused. Trap disarmed.'});
    if(!rows.length)rows.push({kind:'note',text:'Watch Flint enter a number, then climb.'});return rows;
  }
  function updateLog(view){
    const list=document.getElementById('mission-log-items');if(!list)return;
    const rows=logRows(view),key=JSON.stringify(rows);if(list.dataset.rows===key)return;
    const follow=list.scrollHeight-list.scrollTop-list.clientHeight<30;
    list.innerHTML=rows.map(row=>'<li class="log-'+row.kind+'"><span class="log-icon" aria-hidden="true">'+(row.kind==='safe'?'✓':row.kind==='trap'?'✕':'•')+'</span><span class="log-text">'+emphasizeTerms(esc(row.text),true)+'</span></li>').join('');
    list.dataset.rows=key;list.style.paddingBottom='0px';
    if(follow){const items=[...list.children];let occupied=0,first=items.length;while(first>0&&occupied+items[first-1].offsetHeight<=list.clientHeight){first--;occupied+=items[first].offsetHeight;}
      list.style.paddingBottom=Math.max(0,list.clientHeight-occupied)+'px';list.scrollTop=first<items.length?items[first].offsetTop-items[0].offsetTop:0;}
  }
  function updateEntrySummary(view){
    const el=document.querySelector('.entry-summary');if(!el)return;
    let text='',value=sceneConfig().values[3];
    if(practiceScene()){
      if(currentPractice().nextAnswer&&(state.practiceAnimating||state.practicePassed[state.practiceIndex]))text=(view.entryCommitted?'Flint entered ':'Flint enters ')+value;
    }else if(['pair','decision','disarmed'].includes(state.mode)&&!activePlayback?.replay)text='Recorded entry: Flint entered 1.13';
    else if(finalRoute()){if(state.correctedPassed)text='Your entry: 2.3';}
    else if(view.entryCommitted||view.phase==='entry')text=(view.entryCommitted?'Flint entered ':'Flint enters ')+value;
    el.hidden=!text;el.textContent=text;el.dataset.committed=String(!!text&&view.entryCommitted);el.dataset.value=text?value:'';
  }
  function positionActor(progress){
    const svg=document.getElementById('tower-scene');if(!svg)return;
    const config=sceneConfig(),view=S.update(svg,{progress,trap:config.trap});
    const line=document.querySelector('.number-line-panel'),lineVisible=!practiceScene()&&view.numberLineVisible;
    if(line){line.hidden=!lineVisible;line.setAttribute('aria-hidden',String(!lineVisible));}
    document.querySelector('.scene-stage')?.classList.toggle('has-number-line',lineVisible);
    const label=document.getElementById('scene-status-label');
    if(label)label.textContent=state.paused?'RECORDING PAUSED':practiceScene()&&!state.practiceAnimating?(state.practicePassed[state.practiceIndex]?(currentPractice().nextAnswer?'ROUTE OPEN':'TRAP DISARMED'):'FLINT WAITS'):view.phase==='entry'?'FLINT ENTERS A NUMBER':view.phase==='ghost'?'TRAP SPRUNG':view.phase==='falling'?'FLINT FALLS INTO THE PIT':view.phase==='exit'?'FLINT ENTERS THE UPPER DOOR':(state.mode==='running'||activePlayback)?'FLINT IS CLIMBING':state.mode==='success'?'EXIT OPEN':state.decisionPassed?'TRAP DISARMED':state.mode==='trap'||isRepair()?'CHECK THE VALUES':'STAIRWAY READY';
    if(view.entryCommitted&&activePlayback&&!activePlayback.replay&&!activePlayback.entryLogged){activePlayback.entryLogged=true;record('candidate_entered',{...(activePlayback.practice?{practiceId:currentPractice().id}:{flight:currentFlight().id}),value:config.values[3]});}
    updateEntrySummary(view);updateLog(view);return view;
  }
  function scene(){
    let controls='';
    if(state.mode==='running'||state.practiceAnimating)controls=button(state.paused?'Resume':'Pause','pause','scene-control')+button('Skip animation',state.practiceAnimating?'practice:skip':'skip','scene-control');
    else if(['success','trap'].includes(state.mode))controls=button('↻ Replay','replay','scene-control');
    const config=sceneConfig(),lineMode=numberLineMode()||(config.trap?'trap':'');
    return '<section class="scene-card'+(practiceScene()?' practice-scene':'')+'" aria-label="Specter’s stairwell"><div class="scene-strip"><span class="recording-label">'+(practiceScene()?'LIVE PRACTICE':isRepair()?'REPAIR SIMULATION':state.mode==='intro'?'MISSION BRIEFING':'RECOVERED RECORDING')+'</span><span id="scene-status-label">STAIRWAY READY</span></div><div class="scene-art"><div class="scene-stage"><div class="stairs-viewport">'+S.markup(config)+'</div>'+(lineMode?S.numberLineMarkup(lineMode,state.correctedPassed):'')+'</div></div><p class="entry-summary" aria-live="polite" hidden></p><div class="motion-controls">'+controls+'</div><section class="mission-log" aria-labelledby="log-title"><h2 id="log-title">Mission log</h2><ol id="mission-log-items" role="log" tabindex="0" aria-live="polite" aria-relevant="additions text"></ol></section></section>';
  }
  function decisionForm(){
    const option=(value,text)=>'<label class="choice-card" data-selected="'+(state.decisionChoice===value)+'"><input type="radio" name="route-decision" value="'+value+'"'+(state.decisionChoice===value?' checked':'')+'><span class="option-label">'+emphasizeTerms(text)+'</span></label>';
    return '<form id="decision-form" novalidate><fieldset class="choice-set"><legend>Choose one option. Then check your choice.</legend>'+option('continue','Add 1.13 and continue')+option('disarm',disarmLabel)+'</fieldset><button class="primary-button" type="submit">Check my choice →</button></form>';
  }
  function dialogue(){
    const f=currentFlight();let title='',copy='',controls='',tip='';
    if(state.mode==='intro'){
      title='Keep climbing upstairs';copy='Specter left a challenge. Like a regular staircase, <strong>each number on a safe route must be greater than the number before it, and the increase must be the same each time.</strong> Watch Flint enter a number and climb, then help repair the final route.';controls=button('Open the recording →','start');
    }else if(['ready','running'].includes(state.mode)){
      title='Flint’s recorded choice';copy='“'+esc(f.flintLine)+'”';controls=state.mode==='running'?'<p class="button-note">'+(state.paused?'Recording paused.':'Watch the number entry and the climb.')+'</p>':button('Watch Flint enter and climb →','run');
    }else if(state.mode==='success'){
      title='The way is open!';copy=esc(f.feedback);controls=button('Keep climbing →','next');if(state.flight===1)tip='Flint’s shortcut gave the correct answer on this decimal sequence.';
    }else if(state.mode==='trap'){
      title='The trap springs!';copy='“HA! HA! HA! Flint chose <strong>1.13</strong>, but the step marked <strong>1.11</strong> was my trap!”';controls=button('Work with Bellum to check the sequence →','inspect');tip='The recording has stopped. The number line shows where the numbers belong.';
    }else if(state.mode==='pair'){
      title='Which neighboring pair decreases?';copy='Use the number line. Select the pair in which the second number is smaller.';controls='<div class="pair-choices">'+button('1.7 → 1.9','pair:0','pair-button')+button('1.9 → 1.11','pair:1','pair-button')+'</div>';
      if(state.pairPassed){copy='Both numbers have 1 in the ones place. Compare the tenths: <strong>9 &gt; 1</strong>, so <strong>1.9 &gt; 1.11</strong>. This move decreases.';controls=button('Choose whether to continue →','decision');}
    }else if(state.mode==='decision'){
      title='Should Flint continue?';copy=state.feedback?'':'The move <strong>1.9 → 1.11 decreases</strong>. Putting 1.13 at the end cannot change that earlier decrease.';controls=decisionForm();
    }else if(state.mode==='disarmed'){
      title='Trap disarmed!';copy='You left <strong>1.13 unused</strong>. The original route still contains a decrease. Bellum will offer a different route.';controls=button('Try a different route →','corrected');
    }else if(state.mode==='corrected'){
      title='A different route: 1.7, 1.9, 2.1';copy=state.feedbackKind==='error'?'':'Bellum changed the third number from <strong>1.11 to 2.1</strong>. This different route increases by <strong>0.2</strong>. What comes next?';
      controls=state.correctedPassed?button('Check two new routes →','complete'):'<form id="answer-form" class="number-form" novalidate><div class="number-field"><label for="next-reading">Next number</label><input id="next-reading" name="next-reading" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="43" aria-describedby="dialogue-title'+(state.feedback?' feedback':'')+'"></div><button class="primary-button" type="submit">Check number</button></form>';
    }else if(state.mode==='practice'){
      const passed=state.practicePassed[state.practiceIndex];title='Check a new route: '+(state.practiceIndex+1)+' of '+L.PRACTICES.length;
      copy=state.practiceAnimating?'Your number is correct. Watch Flint enter the number and climb.':state.feedback?'':'Check the whole sequence. Enter the next number if every step increases by the same amount. Otherwise, disarm the trap.';
      controls=state.practiceAnimating?'<p class="button-note">Flint is climbing. The next route becomes available after the climb.</p>':passed?button(state.practiceIndex<L.PRACTICES.length-1?'Check the next route →':'Complete the mission →',state.practiceIndex<L.PRACTICES.length-1?'practice:next':'practice:finish'):
        '<div class="practice-choices"><form id="practice-answer-form" class="number-form" novalidate><div class="number-field"><label for="practice-next-reading">Next number</label><input id="practice-next-reading" name="practice-next-reading" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="43" aria-describedby="dialogue-title'+(state.feedback?' feedback':'')+'"></div><button class="primary-button" type="submit">Continue with this number</button></form><p class="practice-or">or</p>'+button(disarmLabel,'practice:reject','secondary-button')+'</div>';
    }else if(state.mode==='complete'){
      title='Watch every step!';copy='You disarmed <strong>1.96, 1.98, 1.100</strong> because the sequence contains a decrease. The different route <strong>1.096, 1.098, 1.100</strong> continues with <strong>1.102</strong>. Check the whole sequence before entering another number.';controls='<p class="button-note">Mission complete. Use Restart to play again.</p>';
    }
    const special=/^(?:<div class="pair-choices|<form|<div class="practice-choices)/.test(controls),speaker=state.mode==='trap'?'Specter':['ready','running'].includes(state.mode)?'Flint':'Bellum';
    return '<section class="dialogue-panel" aria-labelledby="dialogue-title">'+telecom()+'<div class="dialogue-content"><h2 id="dialogue-title" tabindex="-1">'+emphasizeTerms(title)+'</h2><p class="speaker">'+speaker+' says:</p><p class="dialogue-copy'+(state.mode==='trap'?' speech-bubble':'')+'">'+emphasizeTerms(copy,['success','pair','decision','disarmed','complete'].includes(state.mode))+'</p>'+(special?controls:'<div class="actions">'+controls+'</div>')+(state.feedback?'<p id="feedback" class="feedback '+(state.feedbackKind==='success'?'success':'')+'" role="status" tabindex="-1">'+emphasizeTerms(esc(state.feedback),true)+'</p>':'')+(tip?'<p class="lesson-tip">'+emphasizeTerms(tip)+'</p>':'')+'</div></section>';
  }
  function revealSpecter(){
    if(state.mode!=='trap')return;
    const portrait=document.querySelector('.telecom-portrait'),overlay=document.createElement('div');overlay.className='specter-reveal';overlay.setAttribute('aria-hidden','true');
    overlay.innerHTML='<div class="specter-reveal-card"><div class="reveal-laugh">HA! HA! HA!</div><img src="assets/specter.png" alt=""></div>';document.body.appendChild(overlay);
    const speech=document.querySelector('.dialogue-content');speech.classList.add('awaiting-speech');const pending=[...speech.querySelectorAll('button')];pending.forEach(b=>b.disabled=true);portrait.classList.add('awaiting-dock');
    const card=overlay.firstElementChild,w=Math.min(innerWidth*.78,520),h=Math.min(innerHeight*.72,530),x=(innerWidth-w)/2,y=(innerHeight-h)/2;
    Object.assign(card.style,{width:w+'px',height:h+'px',left:x+'px',top:y+'px'});overlay.dataset.phase='center';overlay.dataset.holdMs='2500';
    const token=generation,animations=[],timers=[];let canceled=false;
    const cleanup=()=>{portrait.classList.remove('awaiting-dock');speech.classList.remove('awaiting-speech');pending.forEach(b=>b.disabled=false);overlay.remove();activeReveal=null;};
    const entrance=card.animate([{opacity:0,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:160,fill:'forwards',easing:'ease-out'});animations.push(entrance);
    timers.push(setTimeout(()=>{if(canceled)return;overlay.dataset.phase='shake';const shake=card.animate([{transform:'translateX(0)'},{transform:'translateX(-5px)'},{transform:'translateX(5px)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:280,easing:'ease-in-out'});animations.push(shake);shake.finished.then(()=>{if(!canceled)overlay.dataset.phase='hold';}).catch(()=>{});},190));
    timers.push(setTimeout(()=>{
      if(canceled||token!==generation)return;overlay.dataset.phase='dock';
      document.querySelector('.dialogue-panel').scrollIntoView({block:'start',behavior:'instant'});
      const dest=portrait.getBoundingClientRect(),dx=dest.left-x,dy=dest.top-y,sx=dest.width/w,sy=dest.height/h;
      const dock=card.animate([{transform:'translate(0,0) scale(1)'},{transform:'translate('+dx+'px,'+dy+'px) scale('+sx+','+sy+')'}],{duration:800,fill:'forwards',easing:'cubic-bezier(.2,.7,.25,1)'});animations.push(dock);
      animations.push(card.querySelector('.reveal-laugh').animate([{opacity:1},{opacity:0}],{duration:300,fill:'forwards'}));
      dock.finished.then(()=>{if(!canceled&&token===generation){cleanup();document.getElementById('dialogue-title').focus({preventScroll:true});}}).catch(()=>{});
    },2660));
    activeReveal={cancel:()=>{canceled=true;timers.forEach(clearTimeout);animations.forEach(a=>a.cancel());cleanup();}};
  }
  function focusVisible(element){if(!element)return;element.focus({preventScroll:true});const r=element.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)element.scrollIntoView({block:'center',behavior:'instant'});}
  function render(options){
    app.innerHTML='<section class="mission"><div class="mission-heading"><p class="mission-kicker">SPECTER’S CHALLENGE</p><h1>Watch Your Steps</h1></div>'+scene()+dialogue()+'</section>';
    document.documentElement.dataset.stage=state.mode;document.documentElement.dataset.flight=String(state.flight+1);positionActor(sceneProgress());
    if(options?.focusAction)focusVisible(app.querySelector('[data-action="'+options.focusAction+'"]'));
    else if(options?.focus)focusVisible(document.getElementById('dialogue-title'));
    if(options?.reveal)revealSpecter();
  }
  function animateClimb(replay,practice=false){
    cancelAnimation();const token=generation,f=currentFlight(),trap=!practice&&f.isTrap;let prior=0,elapsed=0;
    if(practice){state.practiceAnimating=true;state.practiceProgress=0;state.paused=false;render({focusAction:'pause'});record('practice_climb_started',{practiceId:currentPractice().id});}
    else if(!replay){state.mode='running';state.progress=0;state.paused=false;render({focusAction:'pause'});record('recorded_flight_started',{flight:f.id,fromLevel:f.fromLevel});}
    else{
      state.paused=false;state.replays++;record('animation_replayed',{flight:f.id});
      document.querySelector('.telecom-panel').outerHTML=telecom(true);document.getElementById('tower-scene').dataset.comparisonMode='';
      document.querySelector('.motion-controls').innerHTML=button('Pause','pause','scene-control')+button('Skip replay','skip-replay','scene-control');
      document.querySelector('.recording-label').textContent='REPLAYING RECORDING';document.querySelector('.speaker').textContent='Flint says:';document.getElementById('dialogue-title').textContent='Flint’s recorded choice';
      const copy=document.querySelector('.dialogue-copy');copy.classList.remove('speech-bubble');copy.textContent='“'+f.flintLine+'”';
      const tip=document.querySelector('.lesson-tip');if(tip)tip.textContent='Watch Flint enter a number and climb. The replay returns to the result.';
    }
    function finish(){
      if(token!==generation)return;if(animation!==null)cancelAnimationFrame(animation);animation=null;activePlayback=null;state.paused=false;
      if(practice){state.practiceAnimating=false;state.practiceProgress=1;record('practice_climb_completed',{practiceId:currentPractice().id});render({focus:true});return;}
      if(replay){render({focus:true,reveal:trap});return;}
      state.progress=1;state.level=trap?4:f.toLevel;record(trap?'recorded_trap_triggered':'recorded_flight_completed',{flight:f.id,...(trap?{value:f.baitAnswer}:{toLevel:f.toLevel})});state.mode=trap?'trap':'success';render({focus:true,reveal:trap});
    }
    function frame(time){if(token!==generation)return;if(!prior)prior=time;if(!state.paused)elapsed+=Math.min(time-prior,80);prior=time;
      const progress=Math.min(1,elapsed/S.duration(trap));activePlayback.progress=progress;if(practice)state.practiceProgress=progress;else if(!replay)state.progress=progress;
      positionActor(progress);if(progress>=1){finish();return;}animation=requestAnimationFrame(frame);}
    activePlayback={finish,replay:!!replay,practice,progress:0,entryLogged:false};positionActor(0);animation=requestAnimationFrame(frame);
  }
  function storeAttempt(kind,input,result){const row={input,correct:result.correct,feedback:result.feedback,at:new Date().toISOString()};state.attempts[kind].push(row);record('student_response',{task:kind,...row});state.feedback=result.feedback;state.feedbackKind=result.correct?'success':'error';}
  function submitDecision(){
    if(!state.decisionChoice){state.feedback='Choose one option before checking your choice.';state.feedbackKind='validation';render();focusVisible(document.querySelector('[name="route-decision"]'));return;}
    const result=L.gradeTrapDecision(state.decisionChoice);storeAttempt('decision',state.decisionChoice,result);
    if(result.correct){state.decisionPassed=true;state.level=5;record('trap_disarmed',{});moveTo('disarmed');}else{render();focusVisible(document.getElementById('feedback'));}
  }
  function submitPractice(choice,value){
    if(state.mode!=='practice'||state.practicePassed[state.practiceIndex])return;const result=L.gradePracticeAnswer(state.practiceIndex,choice,value);
    if(result.validResponse){const prior=state.attempts.practice.filter(row=>row.practiceIndex===state.practiceIndex);const row={practiceIndex:state.practiceIndex,practiceId:currentPractice().id,decision:choice==='disarm'?'reject':'number',action:choice,input:choice==='disarm'?null:value,correct:result.correct,feedback:result.feedback,at:new Date().toISOString(),firstAttempt:prior.length===0,attemptNumber:prior.length+1};
      state.attempts.practice.push(row);record('student_response',{task:'practice',...row});state.practiceHintRevealed[state.practiceIndex]=true;
      if(result.correct){state.practicePassed[state.practiceIndex]=true;record('practice_completed',{practiceIndex:state.practiceIndex,practiceId:currentPractice().id});}}
    state.feedback=result.feedback;state.feedbackKind=result.correct?'success':result.validResponse?'error':'validation';
    if(result.correct&&currentPractice().nextAnswer){animateClimb(false,true);return;}
    render(result.correct?{focus:true}:{});
    if(!result.correct&&choice==='continue'){const input=document.getElementById('practice-next-reading');input.value=value;focusVisible(input);}else if(!result.correct)focusVisible(document.getElementById('feedback'));
  }
  function presentPractice(index){cancelAnimation();state.practiceIndex=index;state.practiceAnimating=false;state.practiceProgress=0;record('practice_presented',{practiceIndex:index,practiceId:currentPractice().id,sequence:[...currentPractice().sequence]});moveTo('practice');}
  function action(name){
    if(name==='start'&&state.mode==='intro'){moveTo('ready');return;}
    if(name==='run'&&state.mode==='ready'){animateClimb(false);return;}
    if(name==='next'&&state.mode==='success'&&state.flight<3){cancelAnimation();state.flight++;state.progress=0;moveTo('ready');return;}
    if(name==='replay'&&['success','trap'].includes(state.mode)&&animation===null){animateClimb(true);return;}
    if(name==='pause'&&activePlayback){state.paused=!state.paused;document.getElementById('tower-scene').classList.toggle('paused',state.paused);document.querySelector('[data-action="pause"]').textContent=state.paused?'Resume':'Pause';document.querySelector('.recording-label').textContent=state.paused?'RECORDING PAUSED':activePlayback.replay?'REPLAYING RECORDING':activePlayback.practice?'LIVE PRACTICE':'RECOVERED RECORDING';const note=document.querySelector('.button-note');if(note)note.textContent=state.paused?'Recording paused.':'Watch the number entry and the climb.';positionActor(activePlayback.progress);return;}
    if(name==='skip-replay'&&activePlayback?.replay){record('replay_skipped',{flight:currentFlight().id});activePlayback.finish();return;}
    if(name==='practice:skip'&&activePlayback?.practice){record('practice_animation_skipped',{practiceId:currentPractice().id});activePlayback.finish();return;}
    if(name==='skip'&&state.mode==='running'){record('animation_skipped',{flight:currentFlight().id});activePlayback?.finish();return;}
    if(name==='inspect'&&state.mode==='trap'&&!activeReveal){cancelAnimation();record('repair_started',{});moveTo('pair');return;}
    if(name.startsWith('pair:')&&state.mode==='pair'&&!state.pairPassed){const value=Number(name.split(':')[1]),result=L.gradeRepairPair(value);storeAttempt('pair',value,result);state.pairPassed=result.correct;render(result.correct?{focus:true}:{focusAction:name});return;}
    if(name==='decision'&&state.mode==='pair'&&state.pairPassed){moveTo('decision');return;}
    if(name==='corrected'&&state.mode==='disarmed'){moveTo('corrected');return;}
    if(name==='complete'&&state.mode==='corrected'&&state.correctedPassed){record('independent_practice_started',{});presentPractice(0);return;}
    if(name==='practice:reject'&&state.mode==='practice'){submitPractice('disarm',null);return;}
    if(name==='practice:next'&&state.mode==='practice'&&!state.practiceAnimating&&state.practicePassed[state.practiceIndex]&&state.practiceIndex<L.PRACTICES.length-1){presentPractice(state.practiceIndex+1);return;}
    if(name==='practice:finish'&&state.mode==='practice'&&!state.practiceAnimating&&state.practicePassed.every(Boolean)){record('activity_completed',{practiceCount:L.PRACTICES.length});moveTo('complete');}
  }
  app.addEventListener('click',event=>{const c=event.target.closest('button[data-action]');if(c&&!c.disabled)action(c.dataset.action);});
  app.addEventListener('change',event=>{if(event.target.name==='route-decision'){state.decisionChoice=event.target.value;app.querySelectorAll('.choice-card').forEach(card=>card.dataset.selected=String(card.querySelector('input').checked));}});
  app.addEventListener('submit',event=>{
    if(event.target.id==='decision-form'){event.preventDefault();submitDecision();return;}
    if(event.target.id==='practice-answer-form'){event.preventDefault();submitPractice('continue',document.getElementById('practice-next-reading').value);return;}
    if(event.target.id!=='answer-form')return;event.preventDefault();if(state.mode!=='corrected'||state.correctedPassed)return;
    const value=document.getElementById('next-reading').value,result=L.gradeCorrectedAnswer(value);storeAttempt('corrected',value,result);state.correctedPassed=result.correct;render({focus:result.correct});if(!result.correct){const input=document.getElementById('next-reading');input.value=value;focusVisible(input);}
  });
  document.getElementById('restart').addEventListener('click',()=>{reset({focus:true});scrollTo({top:0,behavior:'instant'});});
  window.addEventListener('resize',fitGame);
  document.querySelector('.skip-link').addEventListener('click',event=>{event.preventDefault();focusVisible(document.getElementById('dialogue-title'));});
  document.getElementById('export-responses').addEventListener('click',()=>{
    const attempts=Object.fromEntries(Object.entries(state.attempts).map(([task,rows])=>[task,{first:rows[0]||null,last:rows.at(-1)||null,attempts:rows}])),practiceCases=practiceSummaries();attempts.practice.cases=practiceCases;
    const data={activity:'flint-upstairs',version:'3.0',local_review:true,completed:state.mode==='complete'&&state.practicePassed.every(Boolean),attempts,practiceCases,events:state.events};
    const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=href;a.download='watch-your-steps-responses.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  });
  window.UpstairsPreview=Object.freeze({getState:snapshot});fitGame();reset();
}());
