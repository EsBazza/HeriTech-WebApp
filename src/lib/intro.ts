/**
 * Runs in <head> before first paint and decides whether the intro may play.
 * It plays on every full load of the landing page (including refresh). Working
 * pages such as the scanner, handover or a scanned /verify pass open
 * immediately, and people who prefer reduced motion never see it. Kept out of
 * the client component so the server layout can inline it as a plain string.
 */
export const INTRO_HEAD_SCRIPT = `try{var d=document.documentElement,p=location.pathname;if(p!=='/'||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('no-intro')}else{d.classList.add('intro-on')}}catch(e){document.documentElement.classList.add('no-intro')}`;
