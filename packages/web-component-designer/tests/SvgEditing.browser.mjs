import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

let browser, bundle;
const packageRoot = fileURLToPath(new URL('..', import.meta.url));
before(async () => {
  const result = await build({ absWorkingDir: packageRoot,
    stdin: { contents: `
      import { DesignerView } from './src/elements/widgets/designerView/designerView.ts';
      import { createDefaultServiceContainer } from './src/elements/services/DefaultServiceBootstrap.ts';
      import { beginSvgPointEditing } from './src/elements/widgets/designerView/extensions/svg/SvgEditingContext.ts';
      import { NamedTools } from './src/elements/widgets/designerView/tools/NamedTools.ts';
      import { CommandType } from './src/commandHandling/CommandType.ts';
      window.createDesigner = async () => {
        const view = new DesignerView();
        view.style.cssText = 'display:block;width:1000px;height:700px';
        document.body.append(view);
        view.initialize(createDefaultServiceContainer());
        await view.designerCanvas.whenReady();
        view.designerWidth = '2000px'; view.designerHeight = '1600px';
        window.view = view; window.canvas = view.designerCanvas;
        await view.parseDesignerHTML('');
        canvas.setViewport(1, {x:0,y:0});
        canvas.alignOnGrid = false; canvas.alignOnSnap = true;
        window.setTool = name => canvas.executeCommand({type:CommandType.setTool, parameter:NamedTools[name]});
        window.command = name => canvas.executeCommand({type:CommandType[name]});
        window.edit = selector => beginSvgPointEditing(canvas, canvas.rootDesignItem.querySelectorAll(selector)[0].__designItem);
        window.toScreen = point => {
          const origin = canvas.getNormalizedEventCoordinates({clientX:0,clientY:0});
          return {x:(point.x-origin.x)*canvas.zoomFactor, y:(point.y-origin.y)*canvas.zoomFactor};
        };
      };`, resolveDir: packageRoot }, bundle:true, write:false, format:'iife', platform:'browser' });
  bundle = result.outputFiles[0].text;
  browser = await chromium.launch({headless:true});
});
after(async () => browser?.close());
async function setup(t, html='') {
  const page = await browser.newPage({viewport:{width:1200,height:850}});
  t.after(() => page.close());
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  t.after(()=>assert.deepEqual(errors, []));
  await page.route('http://designer.test/**', async route => {
    if (route.request().url().endsWith('shapes/library.json')) return route.fulfill({contentType:'application/json',body:await readFile(new URL('../assets/shapes/library.json',import.meta.url))});
    await route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"></body></html>'});
  });
  await page.goto('http://designer.test/');
  await page.addScriptTag({content:bundle});
  await page.evaluate(()=>createDesigner());
  if(html) await page.evaluate(html=>view.parseDesignerHTML(html),html);
  return page;
}
async function openShapes(page) {
  const button=page.getByRole('button',{name:/^(DrawLine|DrawPath|DrawShape|DrawRect|DrawEllipsis|PickColor)$/}).first();
  const box=await button.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down();await page.waitForTimeout(240);await page.mouse.up();
  await page.getByRole('button',{name:'Shape library…',exact:true}).click();
}
async function point(page,x,y) {return page.evaluate(p=>toScreen(p),{x,y});}
async function click(page,x,y,options) {const p=await point(page,x,y);await page.mouse.click(p.x,p.y,options);}
async function paths(page) {return page.evaluate(()=>[...canvas.rootDesignItem.querySelectorAll('svg path')].map(p=>({d:p.getAttribute('d'),data:p.getPathData({normalize:true}),svg:p.ownerSVGElement.outerHTML})));}
const fixture='<svg style="position:absolute;left:100px;top:150px;width:300px;height:250px;stroke:black;fill:none" viewBox="0 0 300 250"><path id="path" d="M 10 10 L 100 10 L 100 100"/></svg>';

test('native double-click finishes a horizontal/vertical path once; drawing is one undo step',async t=>{
  const page=await setup(t);
  await page.evaluate(()=>setTool('DrawPath'));
  await click(page,120,200);await click(page,260,200);await click(page,260,340,{clickCount:2});
  let result=await paths(page);
  assert.equal(result.length,1);assert.equal(result[0].data.length,3);
  assert.equal(result[0].data[0].values[1],result[0].data[1].values[1]);
  assert.equal(result[0].data[1].values[0],result[0].data[2].values[0]);
  assert.match(result[0].svg,/viewBox=/);
  await page.evaluate(()=>command('undo'));assert.equal((await paths(page)).length,0);
  await page.evaluate(()=>command('redo'));assert.equal((await paths(page)).length,1);
});

test('Enter finishes, clicking the first node closes, Backspace removes a node, Escape cancels',async t=>{
  const page=await setup(t);
  await page.evaluate(()=>setTool('DrawPath'));
  await click(page,120,200);await click(page,260,200);await click(page,280,340);
  await page.keyboard.press('Backspace');await page.keyboard.press('Enter');
  assert.equal((await paths(page))[0].data.length,2);
  await page.evaluate(()=>setTool('DrawPath'));
  await click(page,400,200);await click(page,550,200);await click(page,550,340);await click(page,400,200);
  assert.match((await paths(page))[1].d,/Z\s*$/i);
  await page.evaluate(()=>setTool('DrawPath'));
  await click(page,650,200);await click(page,750,300);await page.keyboard.press('Escape');
  assert.equal((await paths(page)).length,2);
  assert.equal(await page.getByRole('toolbar',{name:'Path drawing'}).count(),0);
});

test('SVG clicks select the resizable object; double-click opens nodes and Done exits',async t=>{
  const page=await setup(t,fixture);
  await click(page,150,160);
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.localName),'svg');
  await click(page,150,160,{clickCount:2});
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.localName),'path');
  await page.getByRole('button',{name:'Done (Esc)',exact:true}).click();
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.localName),'svg');
});

test('shape palette searches all categories and inserts a painted, resizable, editable shape',async t=>{
  const page=await setup(t);
  await openShapes(page);
  await page.getByLabel('Shape category').selectOption({label:'Electronics (17)'});
  assert.ok(await page.getByRole('group',{name:'Predefined shapes'}).getByRole('button').count()>0);
  if (process.env.SVG_REVIEW_SCREENSHOTS) await page.screenshot({path:process.env.SVG_REVIEW_SCREENSHOTS+'/svg-library.png'});
  await page.getByLabel('Search shapes').fill('star');
  const stars=page.getByRole('group',{name:'Predefined shapes'}).getByRole('button');
  assert.ok(await stars.count()>0);await stars.first().click();
  const a=await point(page,150,180), b=await point(page,350,380);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:8});await page.mouse.up();
  assert.equal((await paths(page)).length,1);
  const toolbar=page.getByRole('toolbar',{name:'SVG editing'});
  await toolbar.getByLabel('Stroke width',{exact:true}).fill('5');await toolbar.getByLabel('Stroke width',{exact:true}).press('Tab');
  await toolbar.getByRole('button',{name:'Dashed stroke',exact:true}).click();
  await toolbar.getByRole('button',{name:'Round cap',exact:true}).click();
  await toolbar.getByRole('button',{name:'Bevel join',exact:true}).click();
  const style=await page.evaluate(()=>{const p=canvas.rootDesignItem.querySelectorAll('svg path')[0];const s=getComputedStyle(p);return{width:s.strokeWidth,dash:s.strokeDasharray,cap:s.strokeLinecap,join:s.strokeLinejoin};});
  assert.equal(style.width,'5px');assert.equal(style.dash,'20px, 20px');assert.equal(style.cap,'round');assert.equal(style.join,'bevel');
  await toolbar.getByLabel('Stroke width',{exact:true}).fill('10');await toolbar.getByLabel('Stroke width',{exact:true}).press('Tab');
  assert.equal(await page.evaluate(()=>getComputedStyle(canvas.rootDesignItem.querySelectorAll('svg path')[0]).strokeDasharray),'40px, 40px');
  await page.evaluate(()=>command('undo'));
  assert.equal(await page.evaluate(()=>getComputedStyle(canvas.rootDesignItem.querySelectorAll('svg path')[0]).strokeDasharray),'20px, 20px');
  await toolbar.getByRole('button',{name:'Edit points',exact:true}).click();
  if (process.env.SVG_REVIEW_SCREENSHOTS) await page.screenshot({path:process.env.SVG_REVIEW_SCREENSHOTS+'/svg-editing.png'});
  await page.getByLabel('Path node').selectOption('1');
  await page.getByLabel('Path node').press('Escape');
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.localName),'svg');
  const saved=await page.evaluate(()=>view.getDesignerHTML());
  await page.evaluate(html=>view.parseDesignerHTML(html),saved);
  assert.match((await paths(page))[0].svg,/viewBox=/);
  assert.equal(await page.evaluate(()=>getComputedStyle(canvas.rootDesignItem.querySelectorAll('svg path')[0]).strokeLinecap),'round');
});

async function dragNode(page,index,x,y,modifiers=[]) {
  const handle=page.locator('circle.svg-path').nth(index);
  const box=await handle.boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  for(const modifier of modifiers) await page.keyboard.down(modifier);
  await page.mouse.down();
  const end=await point(page,x,y);
  await page.mouse.move(end.x,end.y,{steps:5});
  const guides=await page.locator('.svg-point-guide').count();
  await page.mouse.up();
  for(const modifier of modifiers) await page.keyboard.up(modifier);
  return guides;
}

test('node snapping follows axes, midpoints and centers at different zooms; Alt bypasses and drag undo restores',async t=>{
  const page=await setup(t,fixture+'<svg style="position:absolute;left:400px;top:150px;width:200px;height:200px"><rect x="0" y="0" width="100" height="120"/></svg>');
  await click(page,150,160,{clickCount:2});
  const before=(await paths(page))[0].d;
  assert.ok(await dragNode(page,2,447,302)>0);
  let endpoint=(await paths(page))[0].data.at(-1).values;
  assert.equal(endpoint[0],350); // The other rectangle's horizontal center in this path's user space.
  await page.evaluate(()=>command('undo'));
  assert.equal((await paths(page))[0].d,before);
  await page.evaluate(()=>command('redo'));
  assert.equal((await paths(page))[0].data.at(-1).values[0],350);
  await page.evaluate(()=>command('undo'));
  assert.equal(await dragNode(page,2,447,302,['Alt']),0);
  assert.equal((await paths(page))[0].data.at(-1).values[0],347);
  await page.evaluate(()=>{command('undo');canvas.setViewport(2,{x:-150,y:-100});});
  assert.ok(await dragNode(page,2,449,302)>0);
  assert.equal((await paths(page))[0].data.at(-1).values[0],350);
});

test('Shift locks a node axis, Escape rolls a live drag back, and H/V segments retain their axis',async t=>{
  const page=await setup(t,fixture);
  await click(page,150,160,{clickCount:2});
  const before=(await paths(page))[0].d;
  await dragNode(page,2,270,265,['Shift']);
  assert.equal((await paths(page))[0].data.at(-1).values[1],100);
  await page.evaluate(()=>command('undo'));
  const box=await page.locator('circle.svg-path').nth(2).boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  const end=await point(page,320,320);await page.mouse.move(end.x,end.y,{steps:5});
  await page.keyboard.press('Escape');await page.mouse.up();
  assert.equal((await paths(page))[0].d,before);
  await page.getByLabel('Path node').selectOption('1');
  await page.getByLabel('Segment type').selectOption('H');
  await dragNode(page,1,270,230,['Alt']);
  const nodes=(await paths(page))[0].data;
  assert.equal(nodes[0].values[1],nodes[1].values[1]);
});

test('adding a curve node preserves its shape; node coordinates and deletion remain undoable',async t=>{
  const html=fixture.replace('M 10 10 L 100 10 L 100 100','M 10 10 C 30 110 120 110 160 10 Q 200 120 250 40');
  const page=await setup(t,html);
  // The explicit action is also usable without hitting a thin stroke.
  await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.setSelectedElements([canvas.rootDesignItem.children().next().value]));
  await page.getByRole('button',{name:'Edit points',exact:true}).click();
  const sample=()=>page.evaluate(()=>{const p=canvas.rootDesignItem.querySelectorAll('#path')[0],length=p.getTotalLength();return Array.from({length:21},(_,i)=>{const q=p.getPointAtLength(length*i/20);return{x:q.x,y:q.y};});});
  await page.evaluate(()=>canvas.serviceContainer.options.roundPixelsToDecimalPlaces=3);
  const before=await sample();
  await page.getByRole('button',{name:'Add node',exact:true}).click();
  const after=await sample();
  for(let i=0;i<before.length;i++) assert.ok(Math.hypot(before[i].x-after[i].x,before[i].y-after[i].y)<0.15);
  assert.equal((await paths(page))[0].data.length,4);
  await page.evaluate(()=>command('undo'));assert.equal((await paths(page))[0].data.length,3);
  await page.getByLabel('Path node').selectOption('1');
  await page.getByLabel('Node X',{exact:true}).fill('180');await page.getByLabel('Node X',{exact:true}).press('Tab');
  assert.equal((await paths(page))[0].data[1].values.at(-2),180);
  await page.getByLabel('Node X',{exact:true}).press('Backspace');
  assert.equal((await paths(page))[0].data.length,3); // Editing an input must not delete a path node.
  await page.getByRole('button',{name:'Delete node',exact:true}).click();
  assert.equal((await paths(page))[0].data.length,2);
  await page.evaluate(()=>command('undo'));assert.equal((await paths(page))[0].data.length,3);
});


test('an ordinary SVG object resize scales the complete figure and undo restores its dimensions',async t=>{
  const page=await setup(t,fixture);
  await click(page,150,160);
  const box=await page.evaluate(()=>{const c=[...canvas.overlayLayer.shadowRoot.querySelectorAll('circle')].find(c=>c.style.cursor==='se-resize');if(!c)return null;const b=c.getBoundingClientRect();return{x:b.x+b.width/2,y:b.y+b.height/2};});
  assert.ok(box,'A selected SVG exposes a resize handle');
  const before=await page.evaluate(()=>canvas.rootDesignItem.querySelectorAll('#path')[0].getBoundingClientRect().width);
  await page.mouse.move(box.x,box.y);await page.mouse.down();await page.mouse.move(box.x+150,box.y+125,{steps:8});await page.mouse.up();
  const after=await page.evaluate(()=>canvas.rootDesignItem.querySelectorAll('#path')[0].getBoundingClientRect().width);
  assert.ok(after>before*1.4);
  await page.evaluate(()=>command('undo'));
  assert.ok(Math.abs(await page.evaluate(()=>canvas.rootDesignItem.querySelectorAll('#path')[0].getBoundingClientRect().width)-before)<0.01);
});


test('compound-shape subpaths keep independent closure and keyboard deletion follows the selected node',async t=>{
  const page=await setup(t,fixture.replace('M 10 10 L 100 10 L 100 100','M10 10 L100 10 L100 100 Z M150 10 L220 10 L220 100 Z'));
  await click(page,150,160,{clickCount:2});
  await page.getByRole('button',{name:'Open path',exact:true}).click();
  assert.equal((await paths(page))[0].data.filter(segment=>segment.type==='Z').length,1);
  await page.getByLabel('Path node').selectOption('4');
  await page.keyboard.press('Delete');
  const nodes=(await paths(page))[0].data;
  assert.equal(nodes.filter(segment=>segment.type==='M').length,2);
  assert.equal(nodes.length,6);
  await page.evaluate(()=>command('undo'));
  assert.equal((await paths(page))[0].data.length,7);
});

test('rectangle, ellipse and line share drawing style, resizing, undo and cancellation',async t=>{
  const page=await setup(t);
  for (const [name,tag] of [['DrawRect','rect'],['DrawEllipsis','ellipse'],['DrawLine','line']]) {
    await page.evaluate(name=>{canvas.serviceContainer.globalContext.strokeDasharray='1 3';canvas.serviceContainer.globalContext.strokeLinecap='round';setTool(name);},name);
    const a=await point(page,150,200),b=await point(page,300,340);
    await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:4});await page.mouse.up();
    const data=await page.evaluate(tag=>{const p=canvas.rootDesignItem.querySelectorAll('svg '+tag)[0];return{dash:getComputedStyle(p).strokeDasharray,width:parseFloat(getComputedStyle(p).strokeWidth),viewBox:p.ownerSVGElement.getAttribute('viewBox')};},tag);
    assert.deepEqual(data.dash.match(/[\d.]+/g).map(Number).map(value=>value/data.width),[1,3]);assert.ok(data.viewBox);
    await page.evaluate(()=>command('undo'));
    assert.equal(await page.evaluate(()=>canvas.rootDesignItem.querySelectorAll('svg').length),0);
    await page.evaluate(name=>setTool(name),name);
    await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y);await page.keyboard.press('Escape');await page.mouse.up();
    assert.equal(await page.evaluate(()=>canvas.rootDesignItem.querySelectorAll('svg').length),0);
  }
});


test('page-sized artwork keeps independent drawing selection and Done removes its point handles',async t=>{
  const page=await setup(t,'<svg style="position:absolute;left:0;top:0;width:100%;height:100%;stroke:black;fill:none"><path id="legacy" d="M100 150 L250 150 L250 300"/></svg>');
  await click(page,180,150);
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.id),'legacy');
  assert.equal(await page.locator('circle.svg-path').count(),0);
  await page.getByRole('button',{name:'Edit points',exact:true}).click();
  assert.ok(await page.locator('circle.svg-path').count()>0);
  await page.getByRole('button',{name:'Done (Esc)',exact:true}).click();
  assert.equal(await page.locator('circle.svg-path').count(),0);
  await page.getByRole('button',{name:'Edit points',exact:true}).click();
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('circle.svg-path').count(),0);
});


test('clicking a node highlights the exact handle immediately, without moving it or creating undo',async t=>{
  const page=await setup(t,fixture);
  await click(page,150,160,{clickCount:2});
  await page.evaluate(()=>canvas.instanceServiceContainer.undoService.clear());
  const handles=page.locator('circle.svg-path');
  await handles.nth(2).click();
  assert.equal(await handles.nth(2).evaluate(c=>c.classList.contains('svg-path-selected-part')),true);
  assert.equal(await handles.nth(1).evaluate(c=>c.classList.contains('svg-path-selected-part')),false);
  assert.notEqual(await handles.nth(1).evaluate(c=>getComputedStyle(c).fill),await handles.nth(2).evaluate(c=>getComputedStyle(c).fill));
  assert.equal(await page.getByLabel('Path node').inputValue(),'2');
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.undoService.undoCount),0);
});

test('Shift, Alt and Ctrl transitions update a stationary node drag and release restores the ordinary drag',async t=>{
  const page=await setup(t,fixture+'<svg style="position:absolute;left:400px;top:150px;width:200px;height:200px"><rect width="100" height="120"/></svg>');
  await click(page,150,160,{clickCount:2});
  let box=await page.locator('circle.svg-path').nth(2).boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();
  let target=await point(page,447,302);await page.mouse.move(target.x,target.y);
  assert.equal((await paths(page))[0].data.at(-1).values[0],350);
  await page.keyboard.down('Alt');assert.equal((await paths(page))[0].data.at(-1).values[0],347);
  await page.keyboard.down('Control');assert.notEqual((await paths(page))[0].data[0].values[0],10);
  await page.keyboard.up('Control');assert.equal((await paths(page))[0].data[0].values[0],10);
  await page.keyboard.up('Alt');assert.equal((await paths(page))[0].data.at(-1).values[0],350);
  await page.keyboard.down('Shift');assert.equal((await paths(page))[0].data.at(-1).values[1],100);
  await page.keyboard.up('Shift');assert.equal((await paths(page))[0].data.at(-1).values[1],152);
  await page.keyboard.press('Escape');await page.mouse.up();
});

test('shape popup owns touchpad scrolling, including overscroll, instead of moving the canvas',async t=>{
  const page=await setup(t);
  await openShapes(page);
  await page.getByLabel('Shape category').selectOption('');
  const grid=page.getByRole('group',{name:'Predefined shapes'});
  const before=await page.evaluate(()=>({...canvas.canvasOffset}));
  await grid.hover();await page.mouse.wheel(0,240);
  await page.waitForFunction(()=>document.querySelector('node-projects-designer-view').shadowRoot.querySelector('node-projects-designer-toolbar').shadowRoot.querySelector('node-projects-svg-shape-library').shadowRoot.querySelector('#grid').scrollTop>0);
  assert.deepEqual(await page.evaluate(()=>({...canvas.canvasOffset})),before);
  await grid.evaluate(el=>el.scrollTop=el.scrollHeight);
  await page.mouse.wheel(0,500);await page.waitForTimeout(100);
  assert.deepEqual(await page.evaluate(()=>({...canvas.canvasOffset})),before);
});

test('SVG color controls provide no paint, while stroke icons and the dock remain above hover outlines',async t=>{
  const page=await setup(t,fixture);
  await click(page,150,160);
  const toolbar=page.getByRole('toolbar',{name:'SVG editing'});
  await toolbar.getByRole('button',{name:'Fill color',exact:true}).click();
  await page.getByRole('button',{name:'No paint',exact:true}).click();
  assert.equal(await page.evaluate(()=>getComputedStyle(canvas.rootDesignItem.querySelectorAll('#path')[0]).fill),'none');
  await page.keyboard.press('Escape');
  const targetBox=await toolbar.getByRole('button',{name:'Dashed stroke',exact:true}).boundingBox();
  await page.evaluate(box=>{
    const a=canvas.getNormalizedEventCoordinates({clientX:box.x,clientY:box.y+box.height/2});
    const b=canvas.getNormalizedEventCoordinates({clientX:box.x+box.width,clientY:box.y+box.height/2});
    const line=document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',a.x);line.setAttribute('y1',a.y);line.setAttribute('x2',b.x);line.setAttribute('y2',b.y);
    line.style.cssText='stroke:red;stroke-width:10;pointer-events:auto';
    canvas.overlayLayer.addOverlay('HoverOverlapRegression',line,30);
  },targetBox);
  await toolbar.getByRole('button',{name:'Dashed stroke',exact:true}).click();
  assert.equal(await toolbar.getByRole('button',{name:'Dashed stroke',exact:true}).getAttribute('aria-pressed'),'true');
  const bottom=(await toolbar.boundingBox()).y+(await toolbar.boundingBox()).height;
  assert.ok(await page.evaluate(()=>canvas.shadowRoot.querySelector('#node-projects-designer-canvas-outercanvas2').getBoundingClientRect().top)>=bottom);
  await toolbar.hover();
  assert.equal(await page.locator('.svg-rect-hover').count(),0);
  await page.evaluate(()=>canvas.setSvgEditingToolbarVisible(false));
  assert.equal(await toolbar.isVisible(),false);
  await page.evaluate(()=>canvas.setSvgEditingToolbarVisible(true));
  assert.equal(await toolbar.isVisible(),true);
});


test('content mode edits painted geometry directly and hides only its toolbar when disabled',async t=>{
  const page=await setup(t,fixture);
  await page.evaluate(()=>canvas.serviceContainer.options.svgEditingMode='content');
  await click(page,150,160);
  assert.equal(await page.evaluate(()=>canvas.instanceServiceContainer.selectionService.primarySelection.element.id),'path');
  assert.equal(await page.locator('circle.svg-path').count(),3);
  assert.equal(await page.getByRole('button',{name:'Edit points',exact:true}).count(),0);
  await page.evaluate(()=>canvas.setSvgEditingToolbarVisible(false));
  assert.equal(await page.getByRole('toolbar',{name:'SVG editing'}).isVisible(),false);
  await page.locator('circle.svg-path').nth(1).click();
  assert.equal(await page.locator('circle.svg-path-selected-part').count(),1);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('circle.svg-path').count(),0);
});


test('a constrained path preset accepts a dragged first leg without becoming freehand',async t=>{
  const page=await setup(t);
  await page.evaluate(()=>{
    const Tool=canvas.serviceContainer.designerTools.get('DrawPath').constructor;
    canvas.serviceContainer.designerTools.set('Fence',new Tool({freehand:false,angleStep:45,strokeColor:'green',strokeThickness:'5'}));
    canvas.executeCommand({type:'setTool',parameter:'Fence'});
  });
  const a=await point(page,160,200),b=await point(page,340,200);
  await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:10});await page.mouse.up();
  assert.equal((await paths(page)).length,0);
  await page.keyboard.press('Enter');
  const result=(await paths(page))[0];
  assert.equal(result.data.length,2);
  assert.equal(result.data[0].values[1],result.data[1].values[1]);
});
