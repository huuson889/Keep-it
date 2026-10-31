const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

const root = path.join(__dirname, "..");
const helper = fs.readFileSync(path.join(root, "js/dashboard/reveal-effects.js"), "utf8");
const dashboard = fs.readFileSync(path.join(root, "js/dashboard/dashboard.js"), "utf8");
const highlightsNotes = fs.readFileSync(path.join(root, "js/dashboard/highlights-notes.js"), "utf8");
const dashboardHtml = fs.readFileSync(path.join(root, "pages/dashboard.html"), "utf8");
const standaloneHtml = fs.readFileSync(path.join(root, "pages/highlights-notes.html"), "utf8");

test("All Dashboard reveal orchestration uses one shared module loaded before its consumers", () => {
  assert.match(helper, /globalThis\.KeepitDashboardReveal=Object\.freeze\(\{createScope,prefersReducedMotion\}\)/);
  assert.match(helper, /function createScope\(\)/);
  assert.match(helper, /function observe\(/);
  assert.match(helper, /function sequence\(/);
  assert.match(helper, /function schedule\(/);
  assert.match(helper, /function cancel\(/);
  assert.doesNotMatch(dashboard, /new IntersectionObserver/);
  assert.doesNotMatch(highlightsNotes, /new IntersectionObserver/);
  const dashboardHelperIndex = dashboardHtml.indexOf("../js/dashboard/reveal-effects.js");
  const dashboardConsumerIndex = dashboardHtml.indexOf("../js/dashboard/dashboard.js");
  const notesConsumerIndex = dashboardHtml.indexOf("../js/dashboard/highlights-notes.js");
  assert.ok(dashboardHelperIndex >= 0 && dashboardHelperIndex < dashboardConsumerIndex);
  assert.ok(dashboardHelperIndex < notesConsumerIndex);
  const standaloneHelperIndex = standaloneHtml.indexOf("../js/dashboard/reveal-effects.js");
  const standaloneConsumerIndex = standaloneHtml.indexOf("../js/dashboard/highlights-notes.js");
  assert.ok(standaloneHelperIndex >= 0 && standaloneHelperIndex < standaloneConsumerIndex);
});

test("Shared observer applies DOM order, panel start time, and one cadence across viewport batches", () => {
  let now = 1000;
  let observerInstance;
  let nextId = 0;
  const timeouts = new Map();
  class FakeIntersectionObserver {
    constructor(callback, options) { this.callback = callback; this.options = options; this.targets = new Set(); observerInstance = this; }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.targets.clear(); }
    reveal(targets) { this.callback(targets.map(target => ({ target, isIntersecting:true })), this); }
  }
  const fakeWindow = {
    IntersectionObserver:FakeIntersectionObserver,
    matchMedia:()=>({ matches:false }),
    setTimeout:(callback,delay)=>{ const id=++nextId;timeouts.set(id,{callback,delay});return id; },
    clearTimeout:id=>timeouts.delete(id),
    requestAnimationFrame:callback=>{ const id=++nextId;timeouts.set(id,{callback,delay:0,frame:true});return id; }
  };
  const context = {
    window:fakeWindow,
    IntersectionObserver:FakeIntersectionObserver,
    performance:{ now:()=>now },
    cancelAnimationFrame:id=>timeouts.delete(id),
    globalThis:null
  };
  context.globalThis=context;
  vm.runInNewContext(helper,context);
  const scope=context.KeepitDashboardReveal.createScope();
  const rootElement={},targets=[{id:"first"},{id:"second"},{id:"third"},{id:"later"}],calls=[];
  const watch=scope.observe({
    root:rootElement,targets:targets.slice(0,3),threshold:.08,rootMargin:"0px 0px -4% 0px",
    key:rootElement,step:180,lead:80,startAt:()=>1350,
    onTarget:(target,delay,index,revealAt)=>calls.push({id:target.id,index,delay,revealAt})
  });
  assert.equal(observerInstance.options.root,rootElement);
  observerInstance.reveal([targets[2],targets[0],targets[1]]);
  assert.deepEqual(calls.map(({id,index,revealAt})=>[id,index,revealAt]),[
    ["first",0,1350],["second",1,1530],["third",2,1710]
  ]);
  watch.observe([targets[3]]);
  now=1600;
  observerInstance.reveal([targets[3]]);
  assert.deepEqual(calls.at(-1),{id:"later",index:0,delay:290,revealAt:1890});
  watch.disconnect();
  assert.equal(observerInstance.targets.size,0);
  scope.cancel();
});

test("Highlights & Notes chart cards use the shared reveal lifecycle and run their chart fills", () => {
  const embeddedCss = fs.readFileSync(path.join(root, "css/dashboard/highlights-notes-embedded.css"), "utf8");
  assert.match(dashboardHtml, /class="old-stats-section old-activity dashboard-reveal"/);
  assert.match(dashboardHtml, /class="old-stats-section old-distribution dashboard-reveal"/);
  assert.match(dashboard, /dashboardHighlightsNotesView\.querySelectorAll\("\.dashboard-reveal"\)/);
  assert.match(highlightsNotes, /if\(target\.matches\('\.old-activity,\.old-distribution'\)\)lhnChartRevealScope\.schedule\(delay,\(\)=>runLhnStatsChart\(target,true\)/);
  assert.match(highlightsNotes, /function runLhnStatsChart\(section,force=false\)[\s\S]*?section\.classList\.remove\('ov-chart-running'\)[\s\S]*?section\.classList\.add\('ov-chart-running'\)/);
  assert.match(highlightsNotes, /function animateLhnDistributionBars\(section\)[\s\S]*?\(now-startedAt\)\/2000[\s\S]*?Math\.pow\(1-progress,4\)/);
  assert.match(highlightsNotes, /runLhnStatsChart\(host\.closest\('\.old-activity'\)\)/);
  assert.match(highlightsNotes, /runLhnStatsChart\(host\.closest\('\.old-distribution'\)\)/);
  assert.match(embeddedCss, /\.old-activity\.ov-chart-running \.old-heat-cell \{ opacity:1;scale:1 \}/);
  assert.match(embeddedCss, /\.old-distribution\.ov-chart-running \.old-dist-fill \{ transform:scaleX\(1\) \}/);
  assert.match(embeddedCss, /\.old-dist-fill \{[^}]*transform:scaleX\(0\);transform-origin:left center;transition:none/);
  assert.match(embeddedCss, /prefers-reduced-motion:reduce[\s\S]*?\.old-activity \.old-heat-cell \{ transition:none!important;opacity:1!important;scale:1!important; \}[\s\S]*?\.old-distribution \.old-dist-fill \{ transition:none!important;transform:scaleX\(1\)!important; \}/);
});
