/**
 * Runs in <head> before first paint and decides whether the intro may play.
 * It plays on every full page load (including refresh), but is skipped for
 * /verify deep links (a scanned pass should open the proof immediately) and
 * for people who prefer reduced motion. Kept out of the client component so the server layout can
 * inline it as a plain string.
 */
export const INTRO_HEAD_SCRIPT = `try{var d=document.documentElement,p=location.pathname;if(p.indexOf('/verify')===0||matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('no-intro')}else{d.classList.add('intro-on')}}catch(e){document.documentElement.classList.add('no-intro')}`;
