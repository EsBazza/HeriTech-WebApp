/**
 * Runs in <head> before first paint and decides whether the intro may play.
 * It plays once per browser session, on the first load of the landing page, so
 * refreshing during a demo goes straight to the content. Working pages such as
 * the scanner, handover or a scanned /verify pass open immediately, and people
 * who prefer reduced motion never see it. Kept out of the client component so
 * the server layout can inline it as a plain string.
 */
export const INTRO_HEAD_SCRIPT = `try{var d=document.documentElement,p=location.pathname,k='heritech_intro_seen';if(p!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem(k)){d.classList.add('no-intro')}else{sessionStorage.setItem(k,'1');d.classList.add('intro-on')}}catch(e){document.documentElement.classList.add('no-intro')}`;
