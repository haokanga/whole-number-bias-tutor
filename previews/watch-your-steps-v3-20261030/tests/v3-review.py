#!/usr/bin/env python3
"""Check the v3 game through visible controls, including tablet layouts."""
import argparse,asyncio,hashlib,json,os
from pathlib import Path
from datetime import datetime,timezone
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'evidence'/'v3-review'
SIZES=[(768,1024),(1024,768),(820,1180),(1180,820),(834,1194),(1194,834),(800,600),(640,480),(390,844),(319,723),(825,722),(1063,722)]
FILES=['index.html','app.js','scene.js','styles.css','scene.css','lesson.js','practice.css']
DISARM='This is not an increasing sequence. Do not continue—disarm the trap.'
REPORT={'version':'3.0','startedAt':datetime.now(timezone.utc).isoformat(),'checks':[],'layouts':[],'errors':[],'screenshots':[]}
def timestamped(row):
 try:return datetime.fromisoformat(row['at'].replace('Z','+00:00')).tzinfo is not None
 except (KeyError,ValueError,TypeError):return False
def check(name,condition,details=None,defer=False):
 row={'name':name,'passed':bool(condition)}
 if details is not None:row['details']=details
 REPORT['checks'].append(row)
 if not condition and not defer:raise AssertionError(name+(': '+json.dumps(details,ensure_ascii=False) if details is not None else ''))

LAYOUT_JS=r'''() => {
 const box=e=>{const r=e.getBoundingClientRect();return{left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
 const shown=e=>{if(!e)return false;for(let p=e;p&&p.nodeType===1;p=p.parentElement){const s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||Number(s.opacity)<.04)return false;}const r=box(e);return r.width>0&&r.height>0};
 const contains=(a,b)=>a.left>=b.left-1&&a.top>=b.top-1&&a.right<=b.right+1&&a.bottom<=b.bottom+1;
 const fonts=[];const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
 while(walker.nextNode()){
  const node=walker.currentNode,e=node.parentElement,text=node.textContent.trim();
  if(!text||!e||!shown(e)||e.closest('script,style,title,desc,noscript')||!/[\p{L}\p{N}]/u.test(text))continue;
  const s=getComputedStyle(e);let scale=1;if(e instanceof SVGElement&&e.getScreenCTM){const m=e.getScreenCTM();if(m)scale=Math.hypot(m.b,m.d);}
  const r=document.createRange();r.selectNodeContents(node);const b=r.getBoundingClientRect();if(!b.width||!b.height)continue;
  fonts.push({text:text.slice(0,160),font:parseFloat(s.fontSize)*scale,box:{left:b.left,top:b.top,right:b.right,bottom:b.bottom},tag:e.tagName,class:e.className.baseVal??e.className});
 }
 const all=[...document.querySelectorAll('button,input:not([type=radio]),select,.choice-card,.dialogue-copy,#feedback,.entry-summary,.telecom-caption,.number-line-panel,.number-line-value,.number-line-step,.up-step-number')].filter(shown);
 const clipped=[];
 for(const e of all){if(e.closest('.mission-log'))continue;const b=box(e);
  if(e.namespaceURI==='http://www.w3.org/1999/xhtml'&&e.clientWidth&&e.scrollWidth>e.clientWidth+1)clipped.push({text:e.textContent.slice(0,120),reason:'own horizontal overflow',box:b});
  for(let p=e.parentElement;p&&p!==document.body&&p!==document.documentElement;p=p.parentElement){const s=getComputedStyle(p),a=box(p);if((['hidden','clip'].includes(s.overflowX)&&(b.left<a.left-1||b.right>a.right+1))||(['hidden','clip'].includes(s.overflowY)&&(b.top<a.top-1||b.bottom>a.bottom+1))){clipped.push({text:e.textContent.slice(0,120),reason:'clipped by '+(p.className.baseVal??p.className),box:b,ancestor:a});break;}}
 }
 const buttons=[...document.querySelectorAll('button,input:not([type=radio]),select,.choice-card')].filter(shown).map(e=>({text:e.textContent.slice(0,100)||e.id,width:box(e).width,height:box(e).height}));
 const headings=[...document.querySelectorAll('.mission-kicker,.mission-log h2,.dialogue-content h2')].filter(shown).map(e=>({text:e.textContent,font:parseFloat(getComputedStyle(e).fontSize)}));
 const line=document.querySelector('.number-line-panel'),stairs=document.querySelector('#tower-scene');
 const overlap=line&&stairs&&shown(line)?(()=>{const a=box(line),b=box(stairs);return Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2})():false;
 const images=[...document.images].filter(e=>!e.complete||!e.naturalWidth).map(e=>e.src);
 const neg=[...document.querySelectorAll('.math-keyword')].filter(shown).filter(e=>/not.*increasing/i.test(e.textContent)).map(e=>({text:e.textContent,decrease:e.classList.contains('math-keyword-decrease'),textContent:e.textContent}));
 return {transcript:{heading:document.querySelector('.mission-heading')?.innerText||'',dialogue:document.querySelector('.dialogue-panel')?.innerText||'',entry:document.querySelector('.entry-summary')?.innerText||'',log:document.querySelector('.mission-log')?.innerText||'',inputs:[...document.querySelectorAll('input:not([type=radio])')].map(e=>({label:e.labels?.[0]?.textContent||e.id,value:e.value}))},viewport:[innerWidth,innerHeight],mode:window.UpstairsPreview.getState().mode,horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,documentHeight:document.documentElement.scrollHeight,fonts,clipped,buttons,headings,overlap,images,neg,numberLineVisible:shown(line),entry:document.querySelector('.entry-summary')?.textContent.trim()||''};
}'''
SCENE_JS=r'''() => {
 const s=document.getElementById('tower-scene'),a=document.getElementById('flint-actor');if(!s)return null;
 const shown=e=>!!e&&getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden'&&Number(getComputedStyle(e).opacity)>.04&&e.getBoundingClientRect().width>0;
 return {phase:s.dataset.phase,contact:Number(s.dataset.contactStep??-1),progress:Number(s.dataset.sceneProgress||0),x:Number(a?.dataset.x),y:Number(a?.dataset.y),ground:Number(s.dataset.groundY),pitFloor:Number(s.dataset.pitFloorY),entry:s.dataset.entryCommitted==='true',summary:document.querySelector('.entry-summary')?.textContent.trim()||'',summaryVisible:shown(document.querySelector('.entry-summary')),line:shown(document.querySelector('.number-line-panel')),reveal:shown(document.querySelector('.specter-reveal')),speech:shown(document.querySelector('.dialogue-copy')),actions:shown(document.querySelector('.actions')),steps:[...s.querySelectorAll('.up-step')].map(e=>({value:e.dataset.value,safe:e.classList.contains('up-safe'),bad:e.classList.contains('up-bad'),vanished:e.classList.contains('up-vanished')}))};
}'''
async def state(page):return await page.evaluate('window.UpstairsPreview.getState()')
async def scene(page):return await page.evaluate(SCENE_JS)
async def click(page,action):
 control=page.locator('[data-action="'+action+'"]')
 if await page.evaluate('navigator.maxTouchPoints>0'):await control.tap()
 else:await control.click()
 await page.wait_for_timeout(25)
async def mode(page,value,timeout=30000):await page.wait_for_function('(v)=>window.UpstairsPreview.getState().mode===v',arg=value,timeout=timeout)
async def settle(page):await page.wait_for_selector('.specter-reveal',state='detached',timeout=7000)
async def capture(page,name,image=False):
 await page.evaluate('document.fonts.ready');data=await page.evaluate(LAYOUT_JS);REPORT['layouts'].append({'name':name,**data});fail=[]
 if data['horizontalOverflow']:fail.append('horizontal document overflow')
 small=[x for x in data['fonts'] if x['font']<15.9]
 if small:fail.append({'smallText':small})
 if data['clipped']:fail.append({'clipped':data['clipped']})
 if any(b['height']<43.9 for b in data['buttons']):fail.append({'smallControls':data['buttons']})
 if any(h['font']<19.9 for h in data['headings']):fail.append({'smallHeadings':data['headings']})
 if data['overlap']:fail.append('number-line panel overlaps the stair SVG')
 if data['images']:fail.append({'brokenImages':data['images']})
 if any(not x['decrease'] or '↑' in x['text'] for x in data['neg']):fail.append({'negationPolarity':data['neg']})
 if image or fail:
  await page.evaluate('window.scrollTo(0,0)');filename=name+'.png';await page.screenshot(path=str(OUT/filename),full_page=True);REPORT['screenshots'].append(filename)
 check(name+': readable content, uncut text, and reachable-sized controls',not fail,fail,defer=True)
 return data
async def submit(page,selector):
 await page.locator(selector+' button[type="submit"]').click();await page.wait_for_timeout(35)
async def export(page,name):
 async with page.expect_download() as d:await page.locator('#export-responses').click()
 download=await d.value;destination=OUT/name;await download.save_as(destination);return json.loads(destination.read_text())
async def to_trap(page,captures=None):
 await click(page,'start')
 for index in range(4):
  if captures:await capture(page,f'ready-{index+1}-{captures}')
  await click(page,'run')
  if captures:await capture(page,f'running-{index+1}-{captures}')
  await click(page,'skip');await mode(page,'trap' if index==3 else 'success')
  if index==3:await settle(page)
  if captures:await capture(page,f'result-{index+1}-{captures}',index==3)
  if index<3:await click(page,'next')
async def check_line(page,corrected,label):
 panel=page.locator('.number-line-panel')
 check(label+': comparison panel is visible and separate from the stairs',await panel.is_visible() and await panel.locator('xpath=ancestor::svg[@id="tower-scene"]').count()==0)
 data=await panel.evaluate(r'''e=>{const rect=x=>{const r=x.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,height:r.height}};const chart=rect(e.querySelector('.number-line-chart'));const marks=[...e.querySelectorAll('[data-value]')].map(x=>({value:x.dataset.value,y:x.dataset.numberY||x.dataset.y||x.querySelector('circle')?.getAttribute('cy')||x.getAttribute('cy'),tag:x.tagName,class:x.className.baseVal??x.className,text:x.textContent.trim(),actualY:x.querySelector('.number-line-point')?(()=>{const r=rect(x.querySelector('.number-line-point'));return(r.top+r.bottom)/2})():null}));const labels=[...e.querySelectorAll('.number-line-value,.number-line-tick-label')].map(x=>({text:x.textContent,box:rect(x)}));const collisions=[];for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i].box,b=labels[j].box;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)collisions.push([labels[i].text,labels[j].text]);}return{min:e.dataset.lineMin,max:e.dataset.lineMax,marks,text:e.textContent,chart,collisions};}''')
 check(label+': plotted dots match the rendered scale',all(abs(x['actualY']-(data['chart']['bottom']-(float(x['value'])-float(data['min']))/(float(data['max'])-float(data['min']))*data['chart']['height']))<1 for x in data['marks'] if x['actualY'] is not None),data,defer=True)
 check(label+': value and axis labels do not overlap',not data['collisions'],data['collisions'],defer=True)
 values=[x for x in data['marks'] if x['y'] is not None]
 known=['1.7','1.9','2.1'] if corrected else ['1.7','1.9','1.11']
 positions={x['value']:float(x['y']) for x in values if x['value'] in known}
 check(label+': every known value has a true point',set(positions)==set(known),data)
 if len(positions)==3:
  ordered=sorted(positions,key=float);check(label+': point order matches numerical values',all(positions[a]>positions[b] for a,b in zip(ordered,ordered[1:])),positions)
  slopes=[(positions[b]-positions[a])/(float(b)-float(a)) for a,b in zip(ordered,ordered[1:])]
  check(label+': point spacing follows one linear scale',max(slopes)-min(slopes)<.05,slopes)
 return data
async def repair(page,suffix,captures=True):
 await click(page,'inspect')
 if captures:await capture(page,'pair-'+suffix)
 await click(page,'pair:0')
 if captures:await capture(page,'pair-wrong-'+suffix)
 await click(page,'pair:1')
 if captures:await capture(page,'pair-correct-'+suffix)
 await click(page,'decision');await page.mouse.move(0,0);await page.wait_for_timeout(150);before=await state(page)
 options=page.locator('#decision-form input[name="route-decision"]')
 check(suffix+': continuation is an explicit single-choice question',await options.count()==2)
 cards=await page.locator('#decision-form .choice-card').evaluate_all("es=>es.map(e=>{const s=getComputedStyle(e);return{background:s.backgroundColor,border:s.borderColor,font:s.fontSize};})")
 check(suffix+': both options have equivalent neutral card styling',len(cards)==2 and cards[0]==cards[1],cards)
 text=await page.locator('#decision-form').inner_text()
 check(suffix+': approved rejection wording stays complete',DISARM in ' '.join(text.split()),text)
 if captures:await capture(page,'decision-'+suffix,True)
 await submit(page,'#decision-form');empty=await state(page)
 check(suffix+': empty decision creates no attempt',empty['attempts']['decision']==before['attempts']['decision'])
 check(suffix+': empty decision explains how to make a choice','choose one option' in (await page.locator('#feedback').inner_text()).lower())
 if captures:await capture(page,'decision-empty-'+suffix)
 if suffix=='800x600':
  await page.locator('input[name="route-decision"][value="continue"]').focus();await page.locator('input[name="route-decision"][value="continue"]').press('Space')
 else:await page.locator('input[name="route-decision"][value="continue"]').check()
 selected=await state(page)
 check(suffix+': selecting an answer does not grade or record it',selected['attempts']['decision']==before['attempts']['decision'] and not selected['decisionPassed'])
 await submit(page,'#decision-form');wrong=await state(page)
 check(suffix+': wrong submitted continuation is recorded once',len(wrong['attempts']['decision'])==len(before['attempts']['decision'])+1 and wrong['attempts']['decision'][-1]['correct'] is False)
 check(suffix+': wrong choice remains selected for retry',await page.locator('input[name="route-decision"][value="continue"]').is_checked())
 check(suffix+': wrong-decision feedback receives readable focus',await page.locator('#feedback').evaluate('(e)=>document.activeElement===e'))
 feedback=await page.locator('#feedback').inner_text()
 check(suffix+': continuation feedback identifies comparison and decision',all(x in feedback for x in ['1.11','1.9']) and 'not an increasing sequence' in feedback.lower() and 'end' in feedback.lower(),feedback)
 if captures:await capture(page,'decision-wrong-'+suffix,True)
 await page.locator('input[name="route-decision"][value="disarm"]').check();await submit(page,'#decision-form');await mode(page,'disarmed')
 if captures:await capture(page,'disarmed-'+suffix)
 await click(page,'corrected')
 if captures:await capture(page,'corrected-'+suffix,True)
 line=await check_line(page,True,suffix+' corrected')
 check(suffix+': corrected plot withholds 2.3 before a correct answer','2.3' not in [x['value'] for x in line['marks'] if 'number-line-step' in x['class']],line)
 for answer,label in [('2..3','malformed'),('1.13','wrong'),('2.30','correct')]:
  await page.locator('#next-reading').fill(answer);await page.locator('#next-reading').press('Enter');await page.wait_for_timeout(35)
  if captures:await capture(page,'corrected-'+label+'-'+suffix)
 check(suffix+': equivalent corrected answer is accepted',(await state(page))['correctedPassed'])
 check(suffix+': correct acceptance reveals 2.3 point','2.3' in await page.locator('.number-line-panel').inner_text())
 await click(page,'complete');return await state(page)
async def finish_practice_animation(page):
 # Accepted practice uses its own animation while mode remains practice or enters practice-running.
 skip=page.locator('[data-action="practice:skip"], [data-action="skip-practice"]')
 if await skip.count():await skip.first.click()
 else:
  await page.wait_for_function('''()=>{const s=window.UpstairsPreview.getState();return s.mode==='practice'&&!s.practiceAnimating&&!!document.querySelector('[data-action="practice:finish"],[data-action="practice:next"]');}''',timeout=25000)
async def practice(page,suffix,captures=True,verify_export=False):
 for index in range(2):
  await mode(page,'practice');before=await state(page)
  check(suffix+f': practice {index+1} starts with the right unattempted case',before['practiceIndex']==index and not before['practicePassed'][index])
  s=await scene(page);expected=['1.96','1.98','1.100','?'] if index==0 else ['1.096','1.098','1.100','?']
  check(suffix+f': practice {index+1} uses the stair scene and given labels',s is not None and [x['value'] for x in s['steps']]==expected,s)
  check(suffix+f': practice {index+1} withholds grading and movement',s['contact']<0 and not any(x['safe'] or x['bad'] for x in s['steps']) and not s['line'] and s['y']==s['ground'],s)
  check(suffix+f': practice {index+1} has no detached number board',await page.locator('.practice-board').count()==0)
  panel_text=await page.locator('.dialogue-panel').inner_text()
  check(suffix+f': practice {index+1} does not prefill or reveal 1.102','1.102' not in panel_text and await page.locator('#practice-next-reading').input_value()=='',panel_text)
  if captures:await capture(page,f'practice-{index+1}-initial-{suffix}',True)
  for value,label in [('', 'blank'),('1..102','malformed')]:
   await page.locator('#practice-next-reading').fill(value);await page.locator('#practice-next-reading').press('Enter');await page.wait_for_timeout(35)
   after=await state(page)
   check(suffix+f': practice {index+1} '+label+' input is not a decision',after['attempts']['practice']==before['attempts']['practice'] and after['practiceHintRevealed'][index] is False)
   if label=='malformed':
    feedback=await page.locator('#feedback').inner_text()
    check(suffix+f': practice {index+1} malformed feedback does not call the entry blank','blank' not in feedback.lower() and 'decimal point' in feedback.lower(),feedback)
   if captures:await capture(page,f'practice-{index+1}-{label}-{suffix}')
  if index==0:
   await page.locator('#practice-next-reading').fill('1.102');await page.locator('#practice-next-reading').press('Enter')
  else:await click(page,'practice:reject')
  await page.wait_for_timeout(35);wrong=await state(page);attempts=[x for x in wrong['attempts']['practice'] if x['practiceIndex']==index]
  check(suffix+f': practice {index+1} preserves the first wrong decision',len(attempts)==1 and attempts[0]['correct'] is False and attempts[0]['firstAttempt'] is True and timestamped(attempts[0]) and bool(attempts[0]['practiceId']),attempts)
  first=dict(attempts[0]);s=await scene(page)
  check(suffix+f': practice {index+1} wrong answer leaves Flint waiting',s['contact']<0 and s['y']==s['ground'] and not wrong['practicePassed'][index],s)
  if captures:await capture(page,f'practice-{index+1}-wrong-{suffix}',True)
  if index==0:await click(page,'practice:reject')
  else:
   answer='1.102' if suffix=='390x844' else '1.1020'
   await page.locator('#practice-next-reading').fill(answer);await page.locator('#practice-next-reading').press('Enter');await page.wait_for_timeout(35)
   await finish_practice_animation(page)
  right=await state(page);attempts=[x for x in right['attempts']['practice'] if x['practiceIndex']==index]
  check(suffix+f': practice {index+1} accepts the correct decision after retry',right['practicePassed'][index] and len(attempts)==2 and attempts[-1]['correct'] is True and attempts[0]==first,attempts)
  s=await scene(page)
  if index==0:
   check(suffix+': rejected invalid stairs remain a trap with Flint safe',s['y']==s['ground'] and s['steps'][2]['bad'] and not s['steps'][2]['safe'] and s['steps'][3]['value'] in ['?','—'],s)
  else:check(suffix+': accepted practice climbs to an open exit',await page.locator('.up-exit-door').get_attribute('data-open')=='true' and s['steps'][3]['value']=='1.102',s)
  if captures:await capture(page,f'practice-{index+1}-correct-{suffix}',True)
  if verify_export:
   data=await export(page,f'practice-{index+1}-responses.json');case=data['practiceCases'][index]
   check(suffix+': export preserves per-case first and last decisions',case['first']==attempts[0] and case['last']==attempts[-1] and case['attempts']==attempts and not data['completed'],case)
  if index==0:await click(page,'practice:next')
 await click(page,'practice:finish');await mode(page,'complete');s=await state(page)
 check(suffix+': final completion requires both practice passes',s['practicePassed']==[True,True])
 check(suffix+': Restart is the sole restart control on completion',await page.locator('button[data-action="restart"],a.wordmark,button:has-text("Play again")').count()==0)
 if captures:await capture(page,'complete-'+suffix,True)
 return s
async def layout_flows(browser,url,sizes):
 for w,h in sizes:
  suffix=f'{w}x{h}';page=await browser.new_page(viewport={'width':w,'height':h},has_touch=(w,h) in SIZES[:6]);page.on('pageerror',lambda e:REPORT['errors'].append(str(e)))
  await page.goto(url);await page.wait_for_function('window.UpstairsPreview');await capture(page,'intro-'+suffix,True)
  check(suffix+': plain wordmark has no logo or restart link',await page.locator('a.wordmark,.wordmark svg').count()==0)
  check(suffix+': Reduce motion remains removed',await page.locator('#motion-toggle').count()==0)
  await to_trap(page,suffix)
  log=await page.locator('.mission-log').inner_text()
  check(suffix+': the log uses separate increase and decrease arrows','↑' in log and '↓' in log,log)
  await check_line(page,False,suffix+' trap');await repair(page,suffix);await practice(page,suffix,verify_export=(w,h)==(1024,768))
  await page.close();print(json.dumps({'phase':'layout','viewport':suffix,'layouts':len(REPORT['layouts'])}),flush=True)

async def full_playback(browser,url):
 page=await browser.new_page(viewport={'width':1024,'height':768},has_touch=True);page.on('pageerror',lambda e:REPORT['errors'].append(str(e)))
 await page.goto(url);await page.wait_for_function('window.UpstairsPreview');await click(page,'start');await click(page,'run')
 await page.wait_for_function('document.getElementById("tower-scene").dataset.entryCommitted==="true"')
 early=await scene(page);check('Entry summary changes to past tense after placement',early['summaryVisible'] and 'Flint entered 7' in early['summary'],early)
 await page.wait_for_function('Number(document.getElementById("tower-scene").dataset.contactStep)>=0');await click(page,'pause');before=await state(page);pose=await scene(page);await page.wait_for_timeout(250)
 check('Pause freezes actor and playback progress',(await scene(page))==pose and (await state(page))['progress']==before['progress'])
 await page.set_viewport_size({'width':768,'height':1024});await page.wait_for_timeout(100)
 after_resize=await state(page)
 check('Tablet orientation change preserves paused state and responses',all(after_resize[k]==before[k] for k in ['mode','progress','attempts','paused']))
 await page.set_viewport_size({'width':1024,'height':768});await click(page,'pause');await mode(page,'success')
 check('Entry summary persists through a successful result','Flint entered 7' in (await scene(page))['summary'])
 saved=await state(page);await click(page,'replay');await page.wait_for_timeout(150);await click(page,'pause');pose=await scene(page);await page.wait_for_timeout(150);check('Replay can pause',(await scene(page))==pose)
 await click(page,'pause');await click(page,'skip-replay');check('Replay preserves prior responses',(await state(page))['attempts']==saved['attempts'])
 for index in [1,2]:await click(page,'next');await click(page,'run');await click(page,'skip');await mode(page,'success')
 await click(page,'next');check('New route clears old entry summary',not (await scene(page))['summaryVisible']);await click(page,'run')
 await page.wait_for_function('document.getElementById("tower-scene").dataset.phase==="ghost"');g=await scene(page);check('Trap contact reveals comparison after two safe moves',g['line'] and g['contact']==2,g)
 await page.wait_for_function('document.getElementById("tower-scene").dataset.phase==="falling"');a=await scene(page);await page.wait_for_timeout(180);b=await scene(page)
 check('Pitfall drops vertically beneath the false tread',abs(a['x']-b['x'])<.5 and b['y']>a['y'],{'a':a,'b':b})
 await mode(page,'trap');await page.wait_for_selector('.specter-reveal')
 t0=await page.evaluate('performance.now()')
 await page.evaluate(r'''()=>{window.__v3RevealAudit=[];const sample=()=>{const e=document.querySelector('.specter-reveal-card'),overlay=document.querySelector('.specter-reveal');if(!e)return;const r=e.getBoundingClientRect();window.__v3RevealAudit.push({t:performance.now(),phase:overlay.dataset.phase,x:r.x,width:r.width});requestAnimationFrame(sample)};requestAnimationFrame(sample);}''')
 initial=await page.locator('.specter-reveal-card').bounding_box();await page.wait_for_timeout(1800)
 held=await page.locator('.specter-reveal-card').bounding_box()
 check('Specter remains centered at full size for more than 1.8 seconds',held is not None and abs(held['width']-initial['width'])<initial['width']*.08 and abs(held['x']-initial['x'])<10,{'initial':initial,'held':held})
 check('Speech and next action wait while Specter is centered',not (await scene(page))['speech'] and not await page.locator('[data-action="inspect"]').is_enabled())
 await capture(page,'specter-centered-tablet',True);await settle(page);elapsed=await page.evaluate('performance.now()')-t0
 check('Specter entrance includes a 2–3 second hold before docking',elapsed>=2900 and elapsed<5000,elapsed)
 reveal=await page.evaluate('window.__v3RevealAudit');shake=[r for r in reveal if r['phase']=='shake'];dock=[r for r in reveal if r['phase']=='dock'];wide=[r for r in reveal if r['phase']!='dock' and r['width']>=held['width']*.995]
 check('Specter gives one brief gentle shake',bool(shake) and 2<max(r['x'] for r in shake)-min(r['x'] for r in shake)<16 and shake[-1]['t']-shake[0]['t']<400,shake)
 check('Specter stays full size about2.5seconds before shrinking',bool(dock) and bool(wide) and 2350<dock[0]['t']-wide[0]['t']<2800,{'fullSizeMs':dock[0]['t']-wide[0]['t'] if dock and wide else None})
 s=await scene(page);check('Flint lands in the pit and entry remains visible',s['y']>s['ground'] and abs(s['y']-s['pitFloor'])<1 and '1.13' in s['summary'],s)
 check('Specter calls the 1.11 step my trap','was my trap' in await page.locator('.dialogue-copy').inner_text())
 check('Repair action invites learner participation','Work with Bellum' in await page.locator('[data-action="inspect"]').inner_text())
 await click(page,'inspect');check('Bellum review labels the earlier input as recorded','recorded' in (await scene(page))['summary'].lower() and '1.13' in (await scene(page))['summary'])
 await page.locator('#restart').click();await click(page,'start');await click(page,'run');await page.wait_for_timeout(80);await page.locator('#restart').click();await page.wait_for_timeout(400)
 check('Restart cancels a running recording',(await state(page))['mode']=='intro' and (await state(page))['events']==[])
 await to_trap(page);await repair(page,'normal-practice',captures=False);await click(page,'practice:reject');await click(page,'practice:next')
 await page.locator('#practice-next-reading').fill('1.102');await page.locator('#practice-next-reading').press('Enter');await page.wait_for_function('window.UpstairsPreview.getState().practiceAnimating===true')
 await page.wait_for_function('document.getElementById("tower-scene").dataset.entryCommitted==="true"');entered=await scene(page)
 check('Correct practice visibly enters 1.102 before climbing',entered['contact']<0 and entered['steps'][3]['value']=='1.102' and 'Flint entered 1.102' in entered['summary'],entered)
 await page.wait_for_function('window.UpstairsPreview.getState().practiceAnimating===false',timeout=25000);finished=await scene(page)
 check('Normal practice climb reaches the open upper door',await page.locator('.up-exit-door').get_attribute('data-open')=='true' and finished['contact']==3,finished)
 await capture(page,'normal-practice-completed-tablet',True)
 await page.close();print(json.dumps({'phase':'full-playback','checks':len(REPORT['checks'])}),flush=True)
async def browser_tools(browser,url):
 page=await browser.new_page(viewport={'width':1400,'height':1100});await page.goto(url.rstrip('/')+'/tests/v3-review.html')
 for kind in ['layout','playback']:
  await page.locator('#run-'+kind).click();await page.wait_for_function('''()=>['PASS','FAIL','ERROR'].includes(JSON.parse(document.getElementById('results-json').textContent).status)''',timeout=240000)
  data=json.loads(await page.locator('#results-json').text_content());(OUT/('browser-'+kind+'.json')).write_text(json.dumps(data,indent=2))
  if kind=='layout':
   transcript=[{'state':x['name'],**x.get('transcript',{})} for x in data.get('layouts',[]) if x.get('viewport')==[1024,768]]
   (OUT/'ui-transcript.json').write_text(json.dumps(transcript,indent=2,ensure_ascii=False)+'\n')
  check('In-browser '+kind+' tool passes',data['status']=='PASS',data.get('failures') or data.get('summary'))
 await page.close()
async def run(args):
 OUT.mkdir(parents=True,exist_ok=True)
 async with async_playwright() as p:
  request=await p.request.new_context()
  async def hashes():
   result={}
   for name in FILES:
    r=await request.get(args.url.rstrip('/')+'/'+name);check('Source is available: '+name,r.status==200);result[name]=hashlib.sha256(await r.body()).hexdigest()
   return result
  REPORT['sourceHashesBefore']=await hashes()
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROME_EXECUTABLE','/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'),headless=True,args=['--no-sandbox'])
  try:
   if args.pages:await browser_tools(browser,args.url)
   elif args.playback_only:await full_playback(browser,args.url)
   else:
    if not args.quick:await full_playback(browser,args.url)
    sizes=[tuple(map(int,args.size.split('x')))] if args.size else SIZES
    await layout_flows(browser,args.url,sizes)
  finally:await browser.close()
  REPORT['sourceHashesAfter']=await hashes();await request.dispose()
  check('Runtime source remains unchanged during review',REPORT['sourceHashesBefore']==REPORT['sourceHashesAfter'])
 check('No browser errors',not REPORT['errors'],REPORT['errors'])
 check('All collected checks passed',all(x['passed'] for x in REPORT['checks']))
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--url',default=os.environ.get('UPSTAIRS_URL','http://127.0.0.1:8771/'));parser.add_argument('--quick',action='store_true');parser.add_argument('--pages',action='store_true');parser.add_argument('--playback-only',action='store_true');parser.add_argument('--size');args=parser.parse_args();REPORT['url']=args.url
 try:asyncio.run(run(args));REPORT['status']='PASS'
 except Exception as e:REPORT['status']='FAIL';REPORT['failure']=str(e);raise
 finally:
  REPORT['finishedAt']=datetime.now(timezone.utc).isoformat();REPORT['summary']={'checks':len(REPORT['checks']),'failedChecks':sum(not x['passed'] for x in REPORT['checks']),'layouts':len(REPORT['layouts']),'errors':len(REPORT['errors'])}
  OUT.mkdir(parents=True,exist_ok=True);name='browser-tools-report.json' if args.pages else 'playback-report.json' if args.playback_only else 'layout-sweep.json' if args.quick else 'report.json';(OUT/name).write_text(json.dumps(REPORT,indent=2,ensure_ascii=False));print(json.dumps({'status':REPORT['status'],**REPORT['summary'],'report':str(OUT/name)}),flush=True)
