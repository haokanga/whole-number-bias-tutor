(function () {
  'use strict';
  const ground = 360, pitFloor = 510, roomHeight = 376, pitHeight = 532;
  const positions = [{x:94,y:ground},{x:230,y:300},{x:355,y:255},{x:480,y:210},{x:605,y:165}];
  const treadWidth = 125, spriteScale = .30, fallScale = .13;
  const timings = {entry:1700,approach:440,lift:660,contact:180,push:580,hold:300,ghost:460,falling:1100,landed:700,exit:700};
  const frames = [
    {column:0,row:0,anchorX:350,anchorY:495},{column:1,row:0,anchorX:210,anchorY:492},
    {column:2,row:0,anchorX:275,anchorY:436},{column:0,row:1,anchorX:386,anchorY:477},
    {column:1,row:1,anchorX:282,anchorY:477},{column:2,row:1,anchorX:207,anchorY:480}
  ];
  const cache = new WeakMap();
  const clamp = value => Math.max(0,Math.min(1,Number(value)||0));
  const smooth = value => {const p=clamp(value);return p*p*(3-2*p);};
  const mix = (a,b,p) => a+(b-a)*p;
  const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function stagesFor(trap){
    const stages=[{phase:'entry',step:-1,duration:timings.entry}];
    for(let step=0;step<4;step++){
      for(const phase of ['approach','lift'])stages.push({phase,step,duration:timings[phase]});
      if(trap&&step===2){for(const phase of ['ghost','falling','landed'])stages.push({phase,step,duration:timings[phase]});break;}
      for(const phase of ['contact','push'])stages.push({phase,step,duration:timings[phase]});
      if(step<3)stages.push({phase:'hold',step,duration:timings.hold});
    }
    if(!trap)stages.push({phase:'exit',step:3,duration:timings.exit});
    return stages;
  }
  const timelines={safe:stagesFor(false),trap:stagesFor(true)};
  function duration(trap){return timelines[trap?'trap':'safe'].reduce((sum,s)=>sum+s.duration,0);}
  function progressAfterStep(index,trap){
    const list=timelines[trap?'trap':'safe'];let elapsed=0;
    for(const s of list){elapsed+=s.duration;if(s.step===index&&(['hold','landed'].includes(s.phase)||(index===3&&s.phase==='push')))return (elapsed-1)/duration(trap);}
    return 1;
  }
  function atProgress(progress,trap){
    const stages=timelines[trap?'trap':'safe'];let elapsed=clamp(progress)*duration(trap);
    for(let i=0;i<stages.length;i++){const s=stages[i];if(elapsed<s.duration||i===stages.length-1)return {...s,p:clamp(elapsed/s.duration)};elapsed-=s.duration;}
  }
  function numberLineMarkup(mode,accepted){
    if(!['trap','corrected'].includes(mode))return '';
    const corrected=mode==='corrected',minimum=0,maximum=1,chartHeight=332;
    const values=corrected?['0.3','0.5','0.7',...(accepted?['0.9']:[])]:['0.7','0.9','0.11'];
    const offset=value=>(Number(value)-minimum)/(maximum-minimum)*100;
    const tickValues=['0','1'];
    const ticks=Array.from({length:Math.round((maximum-minimum)*10)+1},(_,i)=>{
      const value=(minimum+i/10).toFixed(1),label=tickValues.find(v=>Math.abs(Number(v)-Number(value))<.001);
      return '<div class="number-line-tick'+(label?' number-line-major':'')+'" data-value="'+value+'" style="bottom:'+offset(value)+'%">'+(label?'<span class="number-line-tick-label">'+label+'</span>':'')+'</div>';
    }).join('');
    const points=values.map((value,i)=>'<div class="number-line-step'+(!corrected&&i===2?' number-line-false':'')+'" data-value="'+value+'" data-number-y="'+(chartHeight*(1-offset(value)/100))+'" style="bottom:'+offset(value)+'%"><span class="number-line-guide" aria-hidden="true"></span><span class="number-line-point" aria-hidden="true"></span><span class="number-line-value">'+value+'</span></div>').join('');
    const description='Number line from 0 to 1. '+(corrected?'The known route increases from 0.3 to 0.5 to 0.7.'+(accepted?' The accepted continuation is 0.9.':''):'The value 0.11 is below 0.7 and 0.9, just above 0.1.');
    return '<aside class="number-line-panel" data-number-line="'+mode+'" data-line-min="'+minimum+'" data-line-max="'+maximum+'" aria-label="'+description+'"><h3>Number line</h3><div class="number-line-chart" role="img" aria-label="'+description+'"><div class="number-line-axis" aria-hidden="true"></div>'+ticks+points+'</div></aside>';
  }
  function numberFit(value){return String(value).length>4?' textLength="104" lengthAdjust="spacingAndGlyphs"':'';}
  function markup(config){
    config=config||{};
    const values=Array.from({length:4},(_,i)=>String((config.values||[])[i]??'?'));
    config={...config,values};
    const practice=!!config.practice,trap=!!config.trap&&!practice;
    const stairs=values.map((value,i)=>{
      const {x,y}=positions[i+1],left=x-treadWidth/2,right=x+treadWidth/2,display=i===3?'?':value;
      return '<g class="up-step" data-step="'+i+'" data-value="'+escape(display)+'"><g class="up-step-structure"><path class="up-step-face" d="M'+left+' '+(y+3)+'H'+right+'V'+ground+'H'+left+'Z"/><path class="up-stone-seam" d="M'+left+' '+(y+61)+'H'+right+'M'+(left+61)+' '+(y+4)+'V'+ground+'"/><path class="up-tread" d="M'+(left-3)+' '+y+'H'+right+'V'+(y+7)+'H'+(left-3)+'Z"/><text class="up-step-number" x="'+x+'" y="'+(y+28)+'"'+numberFit(display)+'>'+escape(display)+'</text></g><path class="up-step-trace" d="M'+left+' '+y+'H'+right+'V'+ground+'H'+left+'Z"/><text class="up-step-number up-ghost-number" x="'+x+'" y="'+(y+28)+'"'+numberFit(display)+'>'+escape(display)+'</text><g class="up-step-feedback" transform="translate('+(right-33)+' '+(y-31)+')" aria-hidden="true"><path class="up-safe-check" d="M2 14L11 23 29 2"/><path class="up-trap-cross" d="M4 3L27 26M27 3L4 26"/></g>'+((i===1||i===2)?'<rect class="up-pair-outline" x="'+(left-4)+'" y="'+(y-4)+'" width="133" height="61" rx="5"/>':'')+'</g>';
    }).join('');
    return '<svg id="tower-scene" class="tower-scene upstairs-numbered-scene adventure-room'+(config.highlightedPair?' up-highlighted-pair':'')+'" viewBox="0 0 800 '+roomHeight+'" style="aspect-ratio:800 / '+roomHeight+';--scene-view-height:'+roomHeight+'" role="img" aria-labelledby="up-scene-title up-scene-description" data-scene-values="'+escape(JSON.stringify(values))+'" data-scene-trap="'+trap+'" data-practice="'+practice+'" data-practice-status="'+escape(config.practiceStatus||'')+'" data-scene-mode="'+escape(config.mode||'ready')+'" data-scene-compact="'+!!config.compact+'" data-scene-frame="room" data-ground-y="'+ground+'" data-pit-floor-y="'+pitFloor+'" data-entry-committed="false" data-number-line-visible="false" data-withheld="'+!!config.withheld+'" data-comparison-mode="'+escape(config.numberLine||'')+'"><title id="up-scene-title">Specter’s hideout: watch Flint enter a number and climb</title><desc id="up-scene-description">Flint starts beside the entrance door. Four numbered stairs lead to a closed upper door.</desc><defs><linearGradient id="up-wall" x2="0" y2="1"><stop stop-color="#254d51"/><stop offset="1" stop-color="#102e36"/></linearGradient><linearGradient id="up-stone" x2="0" y2="1"><stop stop-color="#426d67"/><stop offset="1" stop-color="#24484b"/></linearGradient><linearGradient id="up-safe-stone" x2="0" y2="1"><stop stop-color="#31745c"/><stop offset="1" stop-color="#214c43"/></linearGradient><linearGradient id="up-door" x2="1" y2="0"><stop stop-color="#354949"/><stop offset=".5" stop-color="#52635a"/><stop offset="1" stop-color="#2a4043"/></linearGradient><radialGradient id="up-light"><stop stop-color="#f2c878" stop-opacity=".22"/><stop offset="1" stop-color="#f2c878" stop-opacity="0"/></radialGradient><pattern id="up-blocks" width="160" height="100" patternUnits="userSpaceOnUse"><path d="M0 0H160V100H0ZM80 0V50M0 50H160" fill="none" stroke="#9bb2a1" stroke-opacity=".13" stroke-width="2"/></pattern></defs><g class="up-world"><rect width="800" height="'+pitHeight+'" fill="url(#up-wall)"/><rect width="800" height="360" fill="url(#up-blocks)"/><path d="M10 12H790V354H10Z" fill="none" stroke="#a3b19a" stroke-opacity=".2" stroke-width="8"/><ellipse cx="680" cy="92" rx="210" ry="185" fill="url(#up-light)"/>'+door('entrance',34,ground,96,150)+door('exit',704,165,82,150)+'<g class="up-wall-message" transform="rotate(-3 280 70)"><text x="285" y="58">Catch me upstairs!</text><text class="up-wall-signature" x="330" y="117">— Specter</text></g><g class="up-lantern" transform="translate(663 37)"><path d="M0 0V17"/><rect x="-10" y="17" width="20" height="32" rx="5"/><path d="M-11 24H11M-10 41H10"/><rect class="up-lantern-glow" x="-6" y="23" width="12" height="21" rx="3"/></g><rect x="0" y="'+ground+'" width="800" height="'+(pitHeight-ground)+'" fill="#10272e"/><path class="up-floor-intact" d="M12 '+ground+'H790"/><path class="up-floor-open" d="M12 '+ground+'H390M560 '+ground+'H790"/><g class="up-pit" opacity="0"><path d="M390 '+ground+'H560V'+pitFloor+'H390Z" fill="#06191f"/><path d="M390 '+ground+'V'+pitFloor+'H560V'+ground+'" fill="none" stroke="#65796c" stroke-width="5"/><path d="M405 381H546M405 410H546M405 439H546M405 468H546" fill="none" stroke="#4f6b65" stroke-opacity=".25" stroke-width="2"/></g><g class="up-stairs">'+stairs+'</g><g class="up-upper-landing"><path d="M668 165H795V178H668Z" fill="#8fa98b"/><path d="M672 178H792V194H672Z" fill="#2d5052"/></g><ellipse class="up-ground-shadow" cx="94" cy="362" rx="22" ry="4" fill="#031015" opacity=".45"/><g id="flint-actor" class="up-agent" transform="translate(94 '+ground+')"><svg class="up-agent-art" x="-62" y="-144" width="154" height="154" viewBox="1024 512 512 512" overflow="hidden" aria-hidden="true"><image class="up-agent-sheet" href="assets/agent-poses-v1.png" width="1536" height="1024"/></svg></g><g class="up-entry-plate" opacity="0"><rect x="-70" y="-32" width="140" height="64" rx="8"/><text class="up-entry-value" x="0" y="1"'+numberFit(values[3])+'>'+escape(values[3])+'</text></g><g class="up-dust" opacity="0" fill="#aab79c"><ellipse cx="0" cy="-3" rx="25" ry="5"/><ellipse cx="-19" cy="-8" rx="11" ry="7"/><ellipse cx="21" cy="-7" rx="12" ry="8"/></g></g></svg>';
  }
  function door(kind,x,base,width,doorHeight){
    return '<g class="up-'+kind+'-door" data-open="false"><path class="up-door-frame" d="M'+(x-7)+' '+base+'V'+(base-doorHeight+20)+'Q'+(x+width/2)+' '+(base-doorHeight-27)+' '+(x+width+7)+' '+(base-doorHeight+20)+'V'+base+'Z"/><path class="up-door-dark" d="M'+x+' '+base+'V'+(base-doorHeight+22)+'Q'+(x+width/2)+' '+(base-doorHeight-15)+' '+(x+width)+' '+(base-doorHeight+22)+'V'+base+'Z"/><path class="up-door-leaf" d="M'+x+' '+base+'V'+(base-doorHeight+22)+'Q'+(x+width/2)+' '+(base-doorHeight-15)+' '+(x+width)+' '+(base-doorHeight+22)+'V'+base+'Z"/><path class="up-door-detail" d="M'+(x+width*.25)+' '+(base-doorHeight+28)+'V'+(base-7)+'M'+(x+width*.65)+' '+(base-doorHeight+20)+'V'+(base-7)+'M'+x+' '+(base-42)+'H'+(x+width)+'"/><circle class="up-door-knob" cx="'+(x+width*.81)+'" cy="'+(base-54)+'" r="5"/></g>';
  }
  function nodesFor(svg){
    let n=cache.get(svg);if(!n){n={actor:svg.querySelector('.up-agent'),art:svg.querySelector('.up-agent-art'),sheet:svg.querySelector('.up-agent-sheet'),world:svg.querySelector('.up-world'),shadow:svg.querySelector('.up-ground-shadow'),dust:svg.querySelector('.up-dust'),description:svg.querySelector('#up-scene-description'),entryPlate:svg.querySelector('.up-entry-plate'),pit:svg.querySelector('.up-pit'),exit:svg.querySelector('.up-exit-door'),entrance:svg.querySelector('.up-entrance-door'),steps:[...svg.querySelectorAll('.up-step')].map(step=>({step,structure:step.querySelector('.up-step-structure'),labels:[...step.querySelectorAll('.up-step-number')]}))};cache.set(svg,n);}return n;
  }
  function sprite(n,index,scale){const f=frames[index];n.sheet.setAttribute('href','assets/agent-poses-v1.png');n.sheet.setAttribute('width','1536');n.sheet.setAttribute('height','1024');n.art.setAttribute('viewBox',(f.column*512)+' '+(f.row*512)+' 512 512');n.art.setAttribute('x',String(-f.anchorX*scale));n.art.setAttribute('y',String(-f.anchorY*scale));n.art.setAttribute('width',String(512*scale));n.art.setAttribute('height',String(512*scale));n.art.dataset.frame=String(index);}
  function fallSprite(n,landed){const left=landed?940:0,width=landed?834:940,anchorX=landed?1370:450,anchorY=landed?842:779;n.sheet.setAttribute('href','assets/agent-fall-v1.png');n.sheet.setAttribute('width','1774');n.sheet.setAttribute('height','887');n.art.setAttribute('viewBox',left+' 0 '+width+' 887');n.art.setAttribute('x',String(-(anchorX-left)*fallScale));n.art.setAttribute('y',String(-anchorY*fallScale));n.art.setAttribute('width',String(width*fallScale));n.art.setAttribute('height',String(887*fallScale));n.art.dataset.frame=landed?'landed':'falling';}
  function update(svg,options){
    if(!svg)return null;options=options||{};
    const n=nodesFor(svg),practice=svg.dataset.practice==='true',practiceStatus=options.practiceStatus||svg.dataset.practiceStatus;
    const progress=practice&&['unanswered','wrong','disarmed'].includes(practiceStatus)?0:practice&&practiceStatus==='passed'?1:clamp(options.progress);
    const trap=!practice&&(typeof options.trap==='boolean'?options.trap:svg.dataset.sceneTrap==='true');
    const stage=progress===0?{phase:'standing',step:-1,p:0}:atProgress(progress,trap),{phase,step,p}=stage;
    const revealPit=trap&&['ghost','falling','landed'].includes(phase);
    const viewHeight=revealPit?(phase==='ghost'?mix(roomHeight,pitHeight,smooth(p)):pitHeight):roomHeight;
    const viewHeightText=viewHeight.toFixed(2);
    if(svg.dataset.viewHeight!==viewHeightText){
      svg.setAttribute('viewBox','0 0 800 '+viewHeightText);
      svg.style.aspectRatio='800 / '+viewHeightText;
      svg.style.setProperty('--scene-view-height',viewHeightText);
      svg.dataset.viewHeight=viewHeightText;
    }
    svg.dataset.sceneFrame=revealPit?(phase==='ghost'?'pit-reveal':'pit'):'room';
    const from=positions[Math.max(0,step)],to=positions[Math.max(0,step+1)],edge=to.x-treadWidth/2;
    const contacted=!['standing','entry','approach','lift'].includes(phase),contactStep=step<0?-1:step-(contacted?0:1),falseContact=trap&&contactStep>=2,vanished=falseContact&&['falling','landed'].includes(phase),terminal=progress===1;
    const values=JSON.parse(svg.dataset.sceneValues),entryCommitted=svg.dataset.withheld!=='true'&&phase!=='standing'&&(phase!=='entry'||p>=.72)&&values[3]!=='?';
    let x=positions[0].x,y=ground,angle=0,frame=5,actorOpacity=1;
    if(phase==='approach'){x=mix(from.x,edge-27,smooth(p));y=from.y;frame=p<.2||p>.8?0:4;}
    else if(phase==='lift'){x=edge-27+Math.sin(p*Math.PI)*2;y=from.y;frame=1;}
    else if(['contact','ghost'].includes(phase)){x=edge+33;y=to.y;frame=2;}
    else if(phase==='push'){if(p<.7){const transfer=p/.7;frame=transfer<.35?2:transfer<.7?3:4;x=to.x-32+smooth(transfer)*20;}else{frame=5;x=mix(to.x-28,to.x,smooth(p));}y=to.y;}
    else if(phase==='hold'){x=to.x;y=to.y;frame=5;}
    else if(phase==='exit'){x=mix(positions[4].x,742,smooth(p));y=positions[4].y;frame=0;actorOpacity=1-clamp((p-.65)/.35);}
    else if(phase==='falling'){x=positions[3].x-treadWidth/2+33;y=mix(positions[3].y,pitFloor,p*p);angle=Math.sin(p*Math.PI*2)*8;}
    else if(phase==='landed'){x=positions[3].x-treadWidth/2+33;y=pitFloor;}
    const landed=phase==='landed';
    if(phase==='falling'||phase==='landed'){fallSprite(n,landed);if(landed){x=positions[3].x-treadWidth/2+33;y=pitFloor;angle=0;}}else sprite(n,frame,spriteScale);
    n.actor.setAttribute('transform','translate('+x.toFixed(2)+' '+y.toFixed(2)+') rotate('+angle.toFixed(2)+')');n.actor.setAttribute('opacity',String(actorOpacity));Object.assign(n.actor.dataset,{phase,x:x.toFixed(2),y:y.toFixed(2)});
    n.shadow.setAttribute('cx',String(x));n.shadow.setAttribute('cy',String(vanished?pitFloor:ground+2));n.shadow.setAttribute('opacity',vanished?'.4':y===ground?'.45':'.08');
    n.steps.forEach(({step:element,structure,labels},i)=>{
      const display=i===3&&(svg.dataset.withheld==='true'||practiceStatus==='disarmed')?'—':i===3&&!entryCommitted?'?':values[i];element.dataset.value=display;labels.forEach(label=>{if(label.textContent!==display)label.textContent=display;if(display.length>4){label.setAttribute('textLength','104');label.setAttribute('lengthAdjust','spacingAndGlyphs');}else{label.removeAttribute('textLength');label.removeAttribute('lengthAdjust');}});
      const touched=i<=contactStep;element.classList.toggle('up-safe',touched&&!(trap&&i>=2));element.classList.toggle('up-bad',(falseContact||practice&&practiceStatus==='disarmed')&&i===2);element.classList.toggle('up-vanished',vanished&&i===2);
      const flicker=falseContact&&i===2&&phase==='ghost'?(p<.33?1:p<.5?.18:p<.66?.7:Math.max(.08,(1-p)*.5)):1;structure.setAttribute('opacity',String(flicker));
    });
    const entering=svg.dataset.withheld!=='true'&&phase==='entry'&&values[3]!=='?';n.entryPlate.setAttribute('opacity',entering?'1':'0');
    const placement=smooth((p-.25)/.47),plateX=mix(130,positions[4].x-9,placement),plateY=mix(266,positions[4].y+28,placement)-Math.sin(placement*Math.PI)*80;
    n.entryPlate.setAttribute('transform','translate('+plateX.toFixed(2)+' '+plateY.toFixed(2)+') scale('+(1-.08*placement).toFixed(2)+')');
    if(entering&&entryCommitted)n.entryPlate.setAttribute('opacity','0');
    n.entrance.dataset.open=String(progress>0&&(phase==='entry'||(step===0&&phase==='approach')));n.exit.dataset.open=String(!trap&&(phase==='exit'||terminal));n.pit.setAttribute('opacity',vanished?'1':'0');svg.classList.toggle('up-pit-open',vanished);
    const numberLineVisible=!practice&&(svg.dataset.comparisonMode==='corrected'||svg.dataset.comparisonMode==='trap'||falseContact);
    n.dust.setAttribute('transform','translate('+(positions[3].x-treadWidth/2+33)+' '+pitFloor+') scale('+(1+p*1.5)+' '+(1+p*.3)+')');n.dust.setAttribute('opacity',phase==='landed'?String((1-p)*.55):'0');
    n.world.setAttribute('transform','translate(0 0)');
    let description='A stone stairwell has a lower entrance and an upper exit. The route is labeled '+values.slice(0,3).join(', ')+(entryCommitted?', '+values[3]:', followed by an empty next slot')+'. ';
    if(practice&&practiceStatus==='disarmed')description+='The decrease from '+values[1]+' to '+values[2]+' is marked. The trap is disarmed and Flint waits safely beside the entrance. The fourth slot is unused.';else if(phase==='standing')description+='Flint waits beside the entrance.';else if(phase==='entry')description+=entryCommitted?'Flint entered '+values[3]+' before climbing.':'Flint places the numbered plate in the next slot.';else if(phase==='ghost')description+='The false step marked '+values[2]+' turns red beneath Flint’s boot.';else if(phase==='falling')description+='The false tread disappears. Flint falls vertically into the pit beneath that tread.';else if(phase==='landed')description+='Flint is in the pit below the main floor, directly beneath the missing tread. The fourth step was not reached.';else if(phase==='exit')description+='Flint walks through the open upper door after reaching every numbered step.';else description+='Flint climbs the numbered treads. Safe landings turn green and show a checkmark.';
    if(numberLineVisible)description+=svg.dataset.comparisonMode==='corrected'?' A separate number line from 0 to 1 shows the different route at true numerical positions.':' A separate number line from 0 to 1 places 0.11 just above 0.1 and below 0.9. The pit depth does not represent a decimal value.';
    if(!trap&&terminal)description+=' The upper exit door is open.';
    n.description.textContent=description;
    Object.assign(svg.dataset,{practiceStatus,sceneProgress:String(progress),phase,contactStep:String(contactStep),failed:String(vanished),complete:String(terminal),entryCommitted:String(entryCommitted),numberLineVisible:String(numberLineVisible)});
    return {phase,stepIndex:step,contactStep,failed:vanished,complete:terminal,entryCommitted,numberLineVisible};
  }
  window.UpstairsScene=Object.freeze({markup,update,duration,progressAfterStep,numberLineMarkup});
}());
