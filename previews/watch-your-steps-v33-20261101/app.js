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
  function comparisonData(left,right){
    left=String(left);right=String(right);
    if(!/^\d+\.\d+$/.test(left)||!/^\d+\.\d+$/.test(right))return null;
    const [lw,lf]=left.split('.'),[rw,rf]=right.split('.');
    let place,li,ri,match;
    if(lw!==rw){
      if(lw.length!==rw.length)return null;
      const index=[...lw].findIndex((digit,i)=>digit!==rw[i]);
      place=['ones','tens','hundreds'][lw.length-index-1];li=ri=index;
      match='Compare the '+place+' digits first.';
    }else{
      const index=[...lf.padEnd(Math.max(lf.length,rf.length),'0')].findIndex((digit,i)=>digit!==(rf[i]||'0'));
      if(index<0||index>=lf.length||index>=rf.length||index>2)return null;
      place=['tenths','hundredths','thousandths'][index];li=lw.length+1+index;ri=rw.length+1+index;
      match=index===0?'Both numbers have '+lw+' in the ones place.':index===1?'The ones and tenths digits match.':'The ones, tenths, and hundredths digits match.';
      match+=' Compare the '+place+' digits—the '+['first','second','third'][index]+' digits after the decimal point.';
    }
    if(!place)return null;
    return {left,right,place,li,ri,ld:left[li],rd:right[ri],match,increasing:L.compareDecimals(left,right)<0};
  }
  function markedValue(value,index,place){
    const raw=String(value);
    return '<span class="decimal-value" data-value="'+esc(raw)+'">'+esc(raw.slice(0,index))+'<span class="place-value-digit'+(place==='tenths'?' tenths-digit':'')+'" data-place="'+place+'">'+esc(raw[index])+'</span>'+esc(raw.slice(index+1))+'</span>';
  }
  function comparisonMarkup(left,right,compact=false){
    const c=comparisonData(left,right);if(!c)return '';
    const symbol=c.increasing?'&lt;':'&gt;',a=markedValue(c.left,c.li,c.place),b=markedValue(c.right,c.ri,c.place);
    const attrs=' data-left="'+esc(c.left)+'" data-right="'+esc(c.right)+'" data-place="'+c.place+'"';
    if(compact){const match=c.place==='ones'?'Compare ones first.':c.place==='tenths'?'Ones digits match.':c.place==='hundredths'?'Ones and tenths digits match.':'Ones, tenths, and hundredths digits match.';return '<div class="place-comparison compact-comparison"'+attrs+'><p>'+match+' <strong>'+c.place[0].toUpperCase()+c.place.slice(1)+':</strong> '+a+' '+symbol+' '+b+' <span class="digit-comparison">('+c.ld+' '+symbol+' '+c.rd+')</span></p></div>';}
    return '<section class="place-comparison"'+attrs+'><p class="comparison-values">'+a+' <span aria-hidden="true">→</span> '+b+'</p><p>'+esc(c.match)+'</p><p><strong>'+c.ld+' '+symbol+' '+c.rd+'</strong>, so <strong>'+esc(c.left)+' '+symbol+' '+esc(c.right)+'</strong>. This step '+(c.increasing?'increases':'decreases')+'.</p></section>';
  }
  function givenPracticeComparisons(includeNext=false,compact=false){
    const values=[...currentPractice().sequence];if(includeNext&&currentPractice().nextAnswer)values.push(currentPractice().nextAnswer);
    return values.slice(1).map((value,i)=>comparisonMarkup(values[i],value,compact)).join('');
  }
  function feedbackMarkup(text){
    if(state.feedbackKind==='validation')return esc(text);
    if(state.mode==='pair'){
      const pair=state.attempts.pair.at(-1)?.input===0?['1.7','1.9']:['1.9','1.11'];
      return (state.pairPassed?'<p>Correct. You found the decrease.</p>':'')+comparisonMarkup(...pair)+(state.pairPassed?'<p>Flint must not continue on this route.</p>':'<p>The first pair increases. Now compare the second pair:</p>'+comparisonMarkup('1.9','1.11',true)+'<p>This second step decreases. Select the pair that contains the decrease.</p>');
    }
    if(state.mode==='decision')return comparisonMarkup('1.9','1.11')+'<p>This sequence is not increasing. Adding 1.13 cannot remove the earlier decrease. Do not continue. Choose the option that disarms the trap, then select “Check my choice”.</p>';
    if(state.mode==='practice'){
      const p=currentPractice(),passed=state.practicePassed[state.practiceIndex];
      if(!p.nextAnswer)return (passed?'<p>Correct. You chose to disarm the trap.</p>':'')+comparisonMarkup('1.98','1.100')+'<p>This sequence contains a decrease. Adding another number cannot remove that earlier decrease. '+(passed?'Flint stays safely at the entrance.':'Do not continue. Disarm the trap.')+'</p>';
      const comparisons=givenPracticeComparisons(passed,true);
      return '<p>Compare from left to right. The highlighted digits are the first digits that differ. The tenths place is the first place after the decimal point; the thousandths place is the third.</p>'+comparisons+'<p>Each step increases by <strong>0.002</strong>. '+(passed?(state.practiceAnimating?'Watch Flint enter <strong>1.102</strong> and climb.':'Flint climbed all four steps and reached the upper door.'):'Add 0.002 to 1.100 and enter the next number to continue this route.')+'</p>';
    }
    return esc(text);
  }
  function markedLogText(text){
    const place=/thousandths/i.test(text)?'thousandths':/hundredths/i.test(text)&&!/tenths/i.test(text)?'hundredths':/tenths/i.test(text)?'tenths':'';
    const index=['tenths','hundredths','thousandths'].indexOf(place);
    return esc(text).replace(/\b\d+\.\d+\b/g,value=>{
      if(index<0||!['1.7','1.9','1.11','1.98','1.100','1.096','1.098','1.102','2.1','2.3'].includes(value))return value;
      const at=value.indexOf('.')+1+index;return at<value.length?markedValue(value,at,place):value;
    });
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
    const context=character==='Specter'?'Incoming transmission':character==='Flint'?'Recovered recording':state.mode==='complete'?'Mission complete':practiceScene()?'Live practice':'';
    return '<aside class="telecom-panel" data-character="'+character+'" aria-label="'+character+' speaking"><div class="telecom-screen"><img class="telecom-portrait" src="assets/'+portrait+'" alt="'+character+'"></div><div class="telecom-caption"><strong>'+character+'</strong>'+(context?'<small>'+context+'</small>':'')+(character==='Specter'?'<span class="laugh-cloud">HA! HA! HA!</span>':'')+'</div></aside>';
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
      return rows;
    }
    const values=sceneConfig().values,rows=[];
    if(finalRoute())rows.push({kind:'note',text:'New route: 1.7 → 1.9 → 2.1.'});
    else if(view.entryCommitted)rows.push({kind:'note',text:'Flint entered '+values[3]+' before climbing.'});
    if(view.contactStep>=0){rows.push({kind:'safe',text:'Flint reached '+values[0]+'.'});
      for(let i=1;i<=Math.min(view.contactStep,3);i++){if(values[i]==='?')break;const increasing=L.compareDecimals(values[i-1],values[i])===-1;rows.push({kind:increasing?'safe':'trap',comparison:[values[i-1],values[i]],text:values[i-1]+' → '+values[i]+': '+(increasing?'increases.':'decreases. The false step disappears.')});}}
    if(state.decisionPassed&&!finalRoute())rows.push({kind:'note',text:'You chose not to continue with 1.13. Trap disarmed.'});
    return rows;
  }
  function updateLog(view){
    const list=document.getElementById('mission-log-items');if(!list)return;
    const rows=logRows(view),key=JSON.stringify(rows);
    list.closest('.mission-log').hidden=!rows.length;
    document.querySelector('.mission-sidebar')?.classList.toggle('has-mission-log',rows.length>0);
    if(list.dataset.rows===key)return;
    const follow=list.scrollHeight-list.scrollTop-list.clientHeight<30;
    list.innerHTML=rows.map(row=>'<li class="log-'+row.kind+'"><span class="log-icon" aria-hidden="true">'+(row.kind==='safe'?'✓':row.kind==='trap'?'✕':'•')+'</span><div class="log-text">'+(row.comparison&&comparisonData(...row.comparison)?comparisonMarkup(...row.comparison,true)+(row.kind==='trap'?'<span>The false step disappears.</span>':''):emphasizeTerms(markedLogText(row.text),true))+'</div></li>').join('');
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
    if(label){
      label.textContent=state.paused?(activePlayback?.practice?'CLIMB PAUSED':'RECORDING PAUSED'):practiceScene()&&!state.practiceAnimating?(state.practicePassed[state.practiceIndex]?(currentPractice().nextAnswer?'FLINT REACHED THE UPPER DOOR':'TRAP DISARMED'):'FLINT WAITS'):view.phase==='entry'?'FLINT ENTERS A NUMBER':view.phase==='ghost'?'TRAP SPRUNG':view.phase==='falling'?'FLINT FALLS INTO THE PIT':view.phase==='exit'?(view.complete?'FLINT REACHED THE UPPER DOOR':'FLINT ENTERS THE UPPER DOOR'):(state.mode==='running'||activePlayback)?'FLINT IS CLIMBING':state.decisionPassed?'TRAP DISARMED':'';
      label.hidden=!label.textContent;
      const recording=document.querySelector('.recording-label');
      document.querySelector('.scene-strip').hidden=!label.textContent&&!recording.textContent;
    }
    if(view.entryCommitted&&activePlayback&&!activePlayback.replay&&!activePlayback.entryLogged){activePlayback.entryLogged=true;record('candidate_entered',{...(activePlayback.practice?{practiceId:currentPractice().id}:{flight:currentFlight().id}),value:config.values[3]});}
    updateEntrySummary(view);updateLog(view);return view;
  }
  function scene(){
    let controls='';
    if(state.mode==='running'||state.practiceAnimating)controls=button(state.paused?'Resume':'Pause','pause','scene-control')+button('Skip animation',state.practiceAnimating?'practice:skip':'skip','scene-control');
    else if(['success','trap'].includes(state.mode))controls=button('↻ Replay','replay','scene-control');
    const config=sceneConfig(),lineMode=numberLineMode()||(config.trap?'trap':''),recording=practiceScene()?'LIVE PRACTICE':isRepair()?'':state.mode==='intro'?'MISSION BRIEFING':'RECOVERED RECORDING';
    return '<section class="scene-card'+(practiceScene()?' practice-scene':'')+'" aria-label="Specter’s stairwell"><div class="scene-strip"><span class="recording-label"'+(recording?'':' hidden')+'>'+recording+'</span><span id="scene-status-label" hidden></span></div><div class="scene-art"><div class="scene-stage"><div class="stairs-viewport">'+S.markup(config)+'</div>'+(lineMode?S.numberLineMarkup(lineMode,state.correctedPassed):'')+'</div></div><p class="entry-summary" aria-live="polite" hidden></p><div class="motion-controls">'+controls+'</div></section>';
  }
  function missionLog(){return '<section class="mission-log" aria-labelledby="log-title" hidden><h2 id="log-title">Mission log</h2><ol id="mission-log-items" role="log" tabindex="0" aria-live="polite" aria-relevant="additions text"></ol></section>';}
  function decisionForm(){
    const option=(value,text)=>'<label class="choice-card" data-selected="'+(state.decisionChoice===value)+'"><input type="radio" name="route-decision" value="'+value+'"'+(state.decisionChoice===value?' checked':'')+'><span class="option-label">'+emphasizeTerms(text)+'</span></label>';
    return '<form id="decision-form" novalidate><fieldset class="choice-set"><legend>Choose one option. Then check your choice.</legend>'+option('continue','Add 1.13 and continue')+option('disarm',disarmLabel)+'</fieldset><button class="primary-button" type="submit">Check my choice →</button></form>';
  }
  function completionScreen(){
    const stop='<section class="summary-route summary-route-stop" aria-labelledby="route-stop-title"><h3 id="route-stop-title">1.96 → 1.98 → 1.100</h3><div class="summary-route-body" tabindex="0" aria-label="Why the first sequence must stop">'+comparisonMarkup('1.98','1.100')+'<p>This sequence contains a decrease, so it is <strong>not an increasing sequence</strong>. Another number at the end cannot remove that decrease.</p></div><p class="summary-action"><strong>Do not continue. Disarm the trap.</strong></p></section>';
    const go='<section class="summary-route summary-route-continue" aria-labelledby="route-continue-title"><h3 id="route-continue-title">1.096 → 1.098 → 1.100</h3><div class="summary-route-body" tabindex="0" aria-label="Why the second sequence can continue"><p>This <strong>is an increasing sequence</strong>. Compare the first digits that differ in each pair:</p>'+givenPracticeComparisons(true,true)+'<p>Each number is greater than the number before it, and each step increases by <strong>0.002</strong>.</p></div><p class="summary-action"><strong>Continue with 1.102.</strong></p></section>';
    return '<section class="completion-screen" aria-labelledby="dialogue-title"><div class="completion-heading">'+telecom()+'<h2 id="dialogue-title" tabindex="-1">Compare the two sequences</h2></div><div class="completion-summary">'+emphasizeTerms(stop+go)+'</div><p class="completion-rule">Before adding another number, check that the whole sequence increases.</p><p class="button-note">Mission complete. Use Restart to play again.</p></section>';
  }
  function dialogue(){
    const f=currentFlight();let title='',copy='',controls='',tip='';
    if(state.mode==='intro'){
      const rule='each number on a safe route must be greater than the number before it, and the increase must be the same each time.';
      title='Watch Flint’s climb';copy=esc(L.COPY.introduction).replace(rule,'<strong>'+rule+'</strong>');controls=button('Open the recording →','start');
    }else if(['ready','running'].includes(state.mode)){
      title='Flint’s recorded choice';copy='“'+esc(f.flintLine)+'”';controls=state.mode==='running'?'':button('Watch Flint enter and climb →','run');
    }else if(state.mode==='success'){
      title='The way is open!';copy=esc(f.feedback);controls=button('Keep climbing →','next');if(state.flight===1){copy=copy.replace(/1\.[1357]/g,value=>markedValue(value,2,'tenths'))+'<p>All four numbers have 1 in the ones place. Compare the tenths digits—the first digits after the decimal point: <strong>1 &lt; 3 &lt; 5 &lt; 7</strong>.</p>';tip=L.COPY.decimalReflection;}
    }else if(state.mode==='trap'){
      title='The trap springs!';copy='“HA! HA! HA! Flint chose <strong>1.13</strong>, but the step marked <strong>1.11</strong> was my trap!”';controls=button('Work with Bellum to check the sequence →','inspect');tip='The recording has stopped. The number line shows where the numbers belong.';
    }else if(state.mode==='pair'){
      title='Which neighboring pair decreases?';copy='Use the number line. Select the pair in which the second number is smaller.';controls='<div class="pair-choices">'+button('1.7 → 1.9','pair:0','pair-button')+button('1.9 → 1.11','pair:1','pair-button')+'</div>';
      if(state.feedback)copy='';if(state.pairPassed)controls=button('Choose whether to continue →','decision');
    }else if(state.mode==='decision'){
      title='Should Flint continue?';copy=state.feedback?'':comparisonMarkup('1.9','1.11')+'<p>This is not an increasing sequence. Adding 1.13 cannot remove the earlier decrease. Should Flint continue or disarm the trap?</p>';controls=decisionForm();
    }else if(state.mode==='disarmed'){
      title='Trap disarmed!';copy=comparisonMarkup('1.9','1.11')+'<p>The original route contains a decrease. You correctly chose <strong>not to continue with 1.13</strong> and disarmed the trap. Bellum will offer a different route.</p>';controls=button('Try a different route →','corrected');
    }else if(state.mode==='corrected'){
      title='A different route: 1.7, 1.9, 2.1';copy='<p>Bellum changed the third number from <strong>1.11 to 2.1</strong>. Check this different route:</p>'+comparisonMarkup('1.7','1.9',true)+comparisonMarkup('1.9','2.1',true)+(state.correctedPassed?comparisonMarkup('2.1','2.3',true)+'<p><strong>2.1 + 0.2 = 2.3.</strong> Each number is <strong>0.2 greater than the number before it</strong>, so Flint can follow this route to the upper door.</p>':'<p>This different route increases by <strong>0.2</strong>. What comes next?</p>');
      controls=state.correctedPassed?button('Check two new routes →','complete'):'<form id="answer-form" class="number-form" novalidate><div class="number-field"><label for="next-reading">Next number</label><input id="next-reading" name="next-reading" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="43" aria-describedby="dialogue-title'+(state.feedback?' feedback':'')+'"></div><button class="primary-button" type="submit">Check number</button></form>';
    }else if(state.mode==='practice'){
      const passed=state.practicePassed[state.practiceIndex];title='Check a new route: '+(state.practiceIndex+1)+' of '+L.PRACTICES.length;
      copy=state.feedback?'':'Check the whole sequence. Enter the next number if every step increases by the same amount. Otherwise, disarm the trap.';
      controls=state.practiceAnimating?'<p class="button-note">You can continue when Flint reaches the upper door.</p>':passed?button(state.practiceIndex<L.PRACTICES.length-1?'Check the next route →':'Complete the mission →',state.practiceIndex<L.PRACTICES.length-1?'practice:next':'practice:finish'):
        '<div class="practice-choices"><form id="practice-answer-form" class="number-form" novalidate><div class="number-field"><label for="practice-next-reading">Next number</label><input id="practice-next-reading" name="practice-next-reading" inputmode="decimal" autocomplete="off" spellcheck="false" maxlength="43" aria-describedby="dialogue-title'+(state.feedback?' feedback':'')+'"></div><button class="primary-button" type="submit">Continue with this number</button></form><p class="practice-or">or</p>'+button(disarmLabel,'practice:reject','secondary-button')+'</div>';
    }
    const special=/^(?:<div class="pair-choices|<form|<div class="practice-choices)/.test(controls),speaker=state.mode==='trap'?'Specter':['ready','running'].includes(state.mode)?'Flint':'Bellum';
    const showFeedback=state.feedback&&!(state.mode==='corrected'&&state.correctedPassed);
    const finishedPractice=state.mode==='practice'&&state.practicePassed[state.practiceIndex]&&currentPractice().nextAnswer&&!state.practiceAnimating;
    const feedbackText=finishedPractice?'Correct. '+[...currentPractice().sequence,currentPractice().nextAnswer].join(' < ')+'. Each number is '+currentPractice().step+' greater than the number before it, so Flint climbed all four steps and reached the upper door.':state.feedback;
    const tipMarkup=tip?tip.split('\n\n').map((paragraph,index)=>'<p class="lesson-tip">'+emphasizeTerms(index?'<strong>'+esc(paragraph)+'</strong>':esc(paragraph))+'</p>').join(''):'';
    return '<section class="dialogue-panel" aria-labelledby="dialogue-title">'+telecom()+'<div class="dialogue-content'+(controls?'':' without-actions')+'"><h2 id="dialogue-title" tabindex="-1">'+emphasizeTerms(title)+'</h2><div class="dialogue-reading" tabindex="0" aria-label="'+speaker+'’s message"><div class="dialogue-copy'+(state.mode==='trap'?' speech-bubble':'')+'">'+emphasizeTerms(copy,['success','pair','decision','disarmed','complete'].includes(state.mode))+'</div>'+(showFeedback?'<div id="feedback" class="feedback '+(state.feedbackKind==='success'?'success':'')+'" role="status" tabindex="-1">'+emphasizeTerms(feedbackMarkup(feedbackText),true)+'</div>':'')+tipMarkup+'</div>'+(controls?'<div class="dialogue-actions">'+(special?controls:'<div class="actions">'+controls+'</div>')+'</div>':'')+'</div></section>';
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
    app.classList.toggle('showing-completion',state.mode==='complete');
    app.innerHTML=state.mode==='complete'?completionScreen():'<section class="mission">'+scene()+'<div class="mission-sidebar">'+dialogue()+missionLog()+'</div></section>';
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
      document.querySelector('.recording-label').textContent='REPLAYING RECORDING';document.getElementById('dialogue-title').textContent='Flint’s recorded choice';
      const copy=document.querySelector('.dialogue-copy');copy.classList.remove('speech-bubble');copy.textContent='“'+f.flintLine+'”';
      document.querySelectorAll('.lesson-tip').forEach(tip=>tip.remove());
      const tip=document.createElement('p');tip.className='lesson-tip';tip.textContent='The replay returns to the result.';document.querySelector('.dialogue-reading').appendChild(tip);
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
    if(name==='pause'&&activePlayback){state.paused=!state.paused;document.getElementById('tower-scene').classList.toggle('paused',state.paused);document.querySelector('[data-action="pause"]').textContent=state.paused?'Resume':'Pause';document.querySelector('.recording-label').textContent=activePlayback.practice?'LIVE PRACTICE':activePlayback.replay?'REPLAYING RECORDING':'RECOVERED RECORDING';const note=document.querySelector('.button-note');if(note)note.textContent=state.paused?(activePlayback.practice?'Flint’s climb is paused.':'Recording paused.'):(activePlayback.practice?'You can continue when Flint reaches the upper door.':'');positionActor(activePlayback.progress);return;}
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
    const data={activity:'flint-upstairs',version:'3.3',local_review:true,completed:state.mode==='complete'&&state.practicePassed.every(Boolean),attempts,practiceCases,events:state.events};
    const href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=href;a.download='watch-your-steps-responses.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
  });
  window.UpstairsPreview=Object.freeze({getState:snapshot});fitGame();reset();
}());
