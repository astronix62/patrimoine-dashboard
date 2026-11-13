const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless:true, args:['--no-sandbox']});
  const page = await browser.newPage({ignoreHTTPSErrors:true,viewport:{width:1440,height:1000}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route(url => url.href.includes('@supabase/supabase-js'), route => route.fulfill({contentType:'application/javascript',body:`
    let session = null, listener;
    const query = new Proxy(function(){}, {get: (_,key) => key === 'then' ? (resolve) => Promise.resolve({data:[],error:null}).then(resolve) : () => query, apply: () => query});
    window.supabase = {createClient: () => ({from: () => query, rpc: async()=>({data:[],error:null}), auth: {
      getSession: async()=>({data:{session}}),
      onAuthStateChange: cb => {listener=cb},
      signInWithPassword: async()=>{session={user:{id:'returning',email:'test@example.com',user_metadata:{}}};listener('SIGNED_IN',session);return {data:session}},
      signUp: async()=>{session={user:{id:'new',email:'new@example.com',user_metadata:{welcome_pending:true}}};listener('SIGNED_IN',session);return {data:{...session,session}}},
      updateUser: async ({data})=>{Object.assign(session.user.user_metadata,data);listener('USER_UPDATED',session);return {data:{user:session.user}}},
      signOut: async()=>{session=null;listener('SIGNED_OUT',null);return {}},
    }})};
  `}));
  await page.goto('http://127.0.0.1:8000');
  await page.waitForFunction(()=>typeof window.refreshAuthUI==='function');
  // Isolate authentication from production data. No real account or financial writes.
  await page.evaluate(()=>{window.onUserLoggedIn=async()=>{window.loads=(window.loads||0)+1};window.checkEvolutionMonthlyReminder=()=>{}});
  assert(await page.locator('#authModal').isVisible());
  await page.keyboard.press('Escape');
  assert(await page.locator('#authModal').isVisible());
  assert(await page.locator('#closeAuth').isHidden());
  await page.locator('#loginEmail').fill('test@example.com');
  await page.locator('#loginPassword').fill('password');
  await page.locator('#loginBtn').click();
  await page.locator('.desktop-welcome:not([hidden])').waitFor();
  assert.equal(await page.locator('.desktop-welcome-title').textContent(),'Bon retour');
  await page.waitForTimeout(1500);
  await page.screenshot({path:'/tmp/patrimoine-welcome.png'});
  await page.locator('.desktop-welcome').waitFor({state:'hidden'});
  assert(await page.locator('#authModal').isHidden());
  assert(await page.locator('#page-overview').isVisible());
  assert.equal(await page.evaluate(()=>window.loads),1);
  await page.locator('#logoutBtn').click();
  await page.locator('#authModal').waitFor({state:'visible'});
  assert.equal(await page.locator('#loginEmail').inputValue(),'');
  await page.locator('[data-auth-target="signupBox"]').click();
  await page.locator('#signupEmail').fill('new@example.com');
  await page.locator('#signupPassword').fill('password');
  await page.locator('#acceptTerms').check();
  await page.locator('#signupBtn').click();
  await page.locator('.desktop-welcome:not([hidden])').waitFor();
  assert.equal(await page.locator('.desktop-welcome-title').textContent(),'Bienvenue');
  await page.locator('.desktop-welcome').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(async()=> (await supabaseClient.auth.getSession()).data.session.user.user_metadata.welcome_seen),true);
  await page.evaluate(()=>window.logoutCurrentUser());
  await page.locator('#authModal').waitFor({state:'visible'});
  await page.locator('[data-auth-target="loginBox"]').click();
  await page.locator('#loginEmail').fill('test@example.com');
  await page.locator('#loginPassword').fill('password');
  await page.locator('#loginBtn').click();
  await page.locator('.desktop-welcome:not([hidden])').waitFor();
  await page.evaluate(()=>window.logoutCurrentUser());
  await page.waitForTimeout(3500);
  assert(await page.locator('#authModal').isVisible());
  assert(await page.locator('.desktop-welcome').isHidden());
  assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#loginEmail').fill('test@example.com');
  await page.locator('#loginPassword').fill('password');
  await page.locator('#loginBtn').click();
  await page.locator('.desktop-welcome:not([hidden])').waitFor();
  await page.locator('.desktop-welcome').waitFor({state:'hidden'});
  assert(await page.locator('#page-overview').isVisible());
  await page.evaluate(()=>window.logoutCurrentUser());
  await page.locator('#authModal').waitFor({state:'visible'});
  await page.evaluate(()=>{window.savedSignIn=supabaseClient.auth.signInWithPassword;supabaseClient.auth.signInWithPassword=async()=>({error:{message:'Invalid login credentials'}})});
  await page.locator('#loginEmail').fill('test@example.com');
  await page.locator('#loginPassword').fill('incorrect');
  await page.locator('#loginBtn').click();
  await page.waitForFunction(()=>document.getElementById('loginMessage').classList.contains('error'));
  assert(await page.locator('.desktop-welcome').isHidden());
  assert(await page.locator('#authModal').isVisible());
  // Changing to a mobile viewport must release the desktop-only gate.
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(()=>{supabaseClient.auth.signInWithPassword=window.savedSignIn});
  await page.locator('#loginBtn').click();
  await page.locator('#authModal').waitFor({state:'hidden'});
  assert(await page.locator('.desktop-welcome').isHidden());
  assert.equal(await page.locator('.app').evaluate(el=>el.inert),false);
  await page.setViewportSize({width:1440,height:1000});
  await page.evaluate(()=>window.logoutCurrentUser());
  await page.locator('#authModal').waitFor({state:'visible'});
  // Simulate a session arriving from an email-confirmation link, outside the form.
  await page.evaluate(()=>supabaseClient.auth.signUp());
  await page.locator('.desktop-welcome:not([hidden])').waitFor();
  assert.equal(await page.locator('.desktop-welcome-title').textContent(),'Bienvenue');
  await page.locator('.desktop-welcome').waitFor({state:'hidden'});
  assert.deepEqual(errors,[]);
  console.log('PASS: desktop gate, Escape, returning login, signup, account marker, single data load, logout, cancellation, reduced motion, failed login, mobile login, confirmation-link session; no browser errors.');
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
