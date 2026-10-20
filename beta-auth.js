/* CRI Beta V2: Supabase passwordless authentication (optional configuration).
   Existing analytical functions, GIS, Action Center matching and data are untouched. */
(function(){
 const config=window.CRI_SUPABASE||{};
 if(!config.url||!config.publishableKey) return; // Existing prototype mode, clearly labeled.
 if(!window.supabase?.createClient){console.error('Supabase library unavailable');return;}
 const client=window.supabase.createClient(config.url,config.publishableKey);
 const $=id=>document.getElementById(id);
 const status=$('authMessage');
 const helper=document.querySelector('#authModal .field-help');
 if(helper) helper.textContent='Secure passwordless sign-in: enter your email and receive a one-time login link. Check your inbox.';
 const pw=$('authPassword');if(pw)pw.parentElement.style.display='none';
 const tabs=document.querySelector('#authModal .auth-tabs');if(tabs)tabs.style.display='none';
 if($('authSubmit'))$('authSubmit').textContent='Email me a login link';
 if($('authTitle'))$('authTitle').textContent='Secure email sign-in';
 const originalOpen=window.openAuthModal;
 window.openAuthModal=function(page='action'){
   originalOpen(page);
   if($('authTitle'))$('authTitle').textContent='Secure email sign-in';
   if($('authSubmit'))$('authSubmit').textContent='Email me a login link';
 };
 const originalGet=window.getAuthSession;
 let sessionUser=null;
 window.getAuthSession=function(){return sessionUser};
 window.isAuthenticated=function(){return !!sessionUser};
 function sync(user){
   sessionUser=user?{name:user.user_metadata?.name||user.email?.split('@')[0]||'Member',email:user.email,role:user.user_metadata?.role||'Researcher'}:null;
   if(sessionUser)localStorage.setItem('cri_user',JSON.stringify(sessionUser));
   try{updateAuthNav();updateActionUserStatus()}catch(e){console.warn(e)}
 }
 client.auth.getUser().then(({data,error})=>{if(!error)sync(data.user)});
 client.auth.onAuthStateChange((_event,session)=>{
   sync(session?.user||null);
   if(session?.user){
     try{closeAuthModal();if(window.criPendingPage==='action')openProtectedPage('action')}catch(e){console.warn(e)}
   }
 });
 window.submitAuth=async function(){
   const email=$('authEmail')?.value.trim().toLowerCase();
   if(!email||!/^\S+@\S+\.\S+$/.test(email)){status.textContent='Please enter a valid email address.';return}
   status.textContent='Sending secure sign-in link…';
   const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});
   status.textContent=error?'Could not send link: '+error.message:'Check your email for the sign-in link, then return to this website.';
 };
 window.logoutCRI=async function(){await client.auth.signOut();sync(null);if(document.querySelector('#action.page.active'))showPage('landing')};
})();
