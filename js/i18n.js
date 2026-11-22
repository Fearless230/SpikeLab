/* i18n.js: interface translation. The app's interface strings are translated as the page renders: exact matches from
   the dictionary (i18n-fr.js), patterns for phrases with numbers and names, and " · "-separated labels piece by piece.
   Training content (exercise and drill instructions) stays in its original language. */
(function(){
"use strict";
const VB=window.VB=window.VB||{};
let lang="en";try{lang=localStorage.getItem("vbj-lang")||((navigator.language||"").toLowerCase().startsWith("fr")?"fr":"en");}catch(e){}
VB.lang=lang;document.documentElement.lang=lang;
const D=lang==="fr"?(window.VB_I18N_FR||{}):null;
const SK={Passing:"Réception",Setting:"Passe",Serving:"Service",Attacking:"Attaque",Blocking:"Contre",Digging:"Défense",Transition:"Transition","Team play":"Jeu d'équipe"};
const P=s=>D[s]||s;
/* patterns: [regex, (match groups) => French] */
const RULES=[
 [/^(\d+) muscles · (\d+) exercises · (\d+) drills · (\d+) faults tracked$/,m=>`${m[1]} muscles · ${m[2]} exercices · ${m[3]} ateliers · ${m[4]} erreurs suivies`],[/^(\d+) techniques · (\d+) drills · (\d+) levels$/,m=>`${m[1]} techniques · ${m[2]} ateliers · ${m[3]} niveaux`],
 [/^Tracked automatically on (\d+) frames \((\d+) per second(.*?)\)(.*)$/,m=>`Suivi automatique sur ${m[1]} images (${m[2]} par seconde${m[3].replace(", slow motion ×",", ralenti ×").replace(", tracking confidence "," , confiance du suivi ")})${m[4].replace(" Take-off at "," Décollage à ").replace(", landing at ",", réception à ")}`],
 [/^You fill (\d+)% of the frame height$/,m=>`Vous occupez ${m[1]} % de la hauteur de l'image`],[/^Frame rate (\d+) per second$/,m=>`Fréquence ${m[1]} images par seconde`],[/^Tracking confidence (\d+)%$/,m=>`Confiance du suivi ${m[1]} %`],
 [/^Tracking your body, (\d+)%$/,m=>`Suivi du corps, ${m[1]} %`],[/^Recording… (\d+)%$/,m=>`Enregistrement… ${m[1]} %`],
 [/^(\d+) swings?$/,m=>`${m[1]} frappe${m[1]==="1"?"":"s"}`],[/^(\d+) serves?$/,m=>`${m[1]} service${m[1]==="1"?"":"s"}`],[/^History$/,()=>"Historique"],[/^(\d+) sessions?$/,m=>`${m[1]} séance${m[1]==="1"?"":"s"}`],
 [/^Your reflections$/,()=>"Vos bilans"],[/^Reaction test$/,()=>"Test de réaction"],[/^(\d+) clips? kept on this device(.*)$/,m=>`${m[1]} vidéo${m[1]==="1"?"":"s"} gardée${m[1]==="1"?"":"s"} sur cet appareil${m[2].replace(" MB used"," Mo utilisés").replace("They never leave this device."," Elles ne quittent jamais cet appareil.")}`],
 [/^Session (\d+) is ready: about (\d+) minutes, (\d+) items\. ?(.*)$/,m=>`La séance ${m[1]} est prête : environ ${m[2]} minutes, ${m[3]} éléments. ${tr(m[4])||m[4]}`],
 [/^(\w+), session (\d+) is ready: about (\d+) minutes, (\d+) items\. ?(.*)$/,m=>`${m[1]}, la séance ${m[2]} est prête : environ ${m[3]} minutes, ${m[4]} éléments. ${tr(m[5])||m[5]}`],
 [/^Finish · (\d+) of (\d+) done$/,m=>`Terminer · ${m[1]} sur ${m[2]} faits`],[/^(\d+) of (\d+) done$/,m=>`${m[1]} sur ${m[2]} faits`],[/^of (\d+) done$/,m=>`sur ${m[1]} faits`],
 [/^Done set (\d+) of (\d+)$/,m=>`Série ${m[1]} sur ${m[2]} terminée`],[/^Next: set (\d+) of (\d+)$/,m=>`Ensuite : série ${m[1]} sur ${m[2]}`],[/^Set (\d+) of (\d+)$/,m=>`Série ${m[1]} sur ${m[2]}`],
 [/^Start (\d+) s hold · set (\d+)$/,m=>`Tenir ${m[1]} s · série ${m[2]}`],[/^Start (\d+) min timer$/,m=>`Lancer la minuterie de ${m[1]} min`],
 [/^(\d+) of (\d+) · (.+)$/,m=>`${m[1]} sur ${m[2]} · ${tr(m[3])||m[3]}`],
 [/^Mark (.+) done$/,m=>`Marquer « ${m[1]} » comme fait`],[/^Remove (.+) from focus$/,m=>`Retirer « ${m[1]} » des priorités`],[/^Add (.+) to focus$/,m=>`Ajouter « ${m[1]} » aux priorités`],
 [/^(.+): looping demo of the movement$/,m=>`${m[1]} : démonstration en boucle du mouvement`],[/^How did (.+) feel\?$/,m=>`Comment s'est passé « ${m[1]} »?`],
 [/^Priority (\d) of 5$/,m=>`Priorité ${m[1]} sur 5`],[/^(\d+) in focus$/,m=>`${m[1]} en priorité`],
 [/^Hit (\d+) sessions to start one$/,m=>`Faites ${m[1]} séances pour en commencer une`],[/^Hit (\d+) sessions this week to start one$/,m=>`Faites ${m[1]} séances cette semaine pour en commencer une`],
 [/^About (\d+) min$/,m=>`Environ ${m[1]} min`],[/^(\d+) min · level (\d+)$/,m=>`${m[1]} min · niveau ${m[2]}`],[/^Week (\d+) of your program$/,m=>`Semaine ${m[1]} de votre programme`],
 [/^(\w+(?: \w+)?), level (\d) of (\d)$/,m=>`${SK[m[1]]||m[1]}, niveau ${m[2]} sur ${m[3]}`],[/^(\w+(?: \w+)?) · L(\d)$/,m=>`${SK[m[1]]||m[1]} · N${m[2]}`],
 [/^Your (\w+) level is (\d+)\. This drill is at your level\.$/,m=>`Votre niveau en ${(SK[m[1][0].toUpperCase()+m[1].slice(1)]||m[1]).toLowerCase()} est ${m[2]}. Cet atelier est à votre niveau.`],
 [/^(.+) is one of your goals$/,m=>`${tr(m[1])||m[1]} fait partie de vos objectifs`],
 [/^(Week (\d+) · |\/ (\d+) · )(Build|Push|Deload and retest)$/,m=>(m[2]?`Semaine ${m[2]} · `:`/ ${m[3]} · `)+({Build:"Construction",Push:"Intensification","Deload and retest":"Décharge et nouveau test"})[m[4]]],
 [/^Plan created for (.+), (\d+) sessions a week, equipment: (.+)\.$/,m=>`Plan créé : ${m[2]} séances par semaine.`],
 [/^(.+) · step (\d+) · (no equipment|needs (.+)) · works (.+)$/,m=>`${m[1]} · étape ${m[2]} · ${m[4]?"nécessite : "+m[4]:"sans équipement"} · muscles : ${m[5]}`],
 [/^No\. (\d+)$/,m=>`N° ${m[1]}`],[/^(.+) · No\. (\d+)$/,m=>`${tr(m[1])||m[1]} · N° ${m[2]}`],[/^(.+) session (\d+) is ready: about (\d+) minutes, (\d+) items\. ?(.*)$/,m=>`${m[1]} séance ${m[2]} prête : environ ${m[3]} minutes, ${m[4]} éléments. ${tr(m[5])||m[5]}`],
 [/^(\d) sessions? to go$/,m=>`Encore ${m[1]} séance${m[1]>1?"s":""}`],[/^(\d+)% of your (\d+) sessions(.*)$/,m=>`${m[1]} % de vos ${m[2]} séances${m[3]?" · entraîné aujourd'hui":""}`],
 [/^Next check-in test in (\d+) days?\.$/,m=>`Prochain test dans ${m[1]} jour${m[1]>1?"s":""}.`],[/^On track\. (\d+) days to go\.$/,m=>`Dans les temps. Encore ${m[1]} jours.`],
 [/^Wk (\d+)-(\d+)$/,m=>`Sem. ${m[1]}-${m[2]}`],[/^Week (\d+)$/,m=>`Semaine ${m[1]}`],[/^(\d+)% skills$/,m=>`${m[1]} % technique`],
 [/^(\d+) progressions · (\d+) sets in 28 days$/,m=>`${m[1]} progressions · ${m[2]} séries en 28 jours`],[/^One of your goals · (\d+) progressions · (\d+) sets in 28 days$/,m=>`Un de vos objectifs · ${m[1]} progressions · ${m[2]} séries en 28 jours`],
 [/^(\d+) × (\d+) each side$/,m=>`${m[1]} × ${m[2]} de chaque côté`],[/^(\d+) of (\d+) min$/,m=>`${m[1]} sur ${m[2]} min`],[/^\/ (\d+) sessions$/,m=>`/ ${m[1]} séances`],
 [/^of (\d+)$/,m=>`sur ${m[1]}`],[/^due (.+) · (\d+) of (\d+) done$/,m=>`échéance ${m[1]} · ${m[2]} sur ${m[3]} faits`],[/^(.+) · due (.+)$/,m=>`${m[1]} · échéance ${m[2]}`],[/^Due (.+)$/,m=>`Échéance ${m[1]}`],
 [/^In (\d+) days$/,m=>`Dans ${m[1]} jours`],[/^Next (\w+)$/,m=>`Prochain ${({match:"match",tournament:"tournoi",tryout:"essai"})[m[1]]||m[1]}`],
 [/^(.+): (None|A little|Sore|Painful)$/,m=>`${P(m[1])} : ${P(m[2])}`],
];
function tr(s){if(!D||!s)return null;const k=s.replace(/\s+/g," ").trim();if(!k||!/[A-Za-z]/.test(k))return null;if(D[k])return D[k];
  for(const [re,f] of RULES){const m=k.match(re);if(m)return f(m);}
  if(k.includes(" · ")){const parts=k.split(" · ");let hit=false;const out=parts.map(p=>{const t=D[p]||(RULES.some(([re])=>re.test(p))?tr(p):null);if(t){hit=true;return t;}return p;});if(hit)return out.join(" · ");}
  return null;}
VB.t=s=>tr(s)||s;
if(!D)return;
const ATTR=["placeholder","aria-label","title"];
function doText(n){const v=n.nodeValue;if(!v||n.__tr===v)return;const t=tr(v);if(t){const lead=v.match(/^\s*/)[0],trail=v.match(/\s*$/)[0];n.nodeValue=lead+t+trail;n.__tr=n.nodeValue;}}
function doEl(el){for(const a of ATTR){const v=el.getAttribute&&el.getAttribute(a);if(v){const t=tr(v);if(t&&t!==v)el.setAttribute(a,t);}}}
function walk(root){if(root.nodeType===3){doText(root);return;}if(root.nodeType!==1||root.closest&&root.closest("script,style,[data-notr]"))return;doEl(root);
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);let n;while(n=w.nextNode()){if(n.nodeType===3)doText(n);else{if(n.tagName==="SCRIPT"||n.tagName==="STYLE"){continue;}doEl(n);}}}
const q=new Set();let sched=0;
function flush(){sched=0;q.forEach(n=>{if(n.isConnected!==false)walk(n);});q.clear();}
new MutationObserver(ms=>{ms.forEach(m=>{if(m.type==="characterData")q.add(m.target);else if(m.type==="attributes")q.add(m.target);else m.addedNodes.forEach(n=>q.add(n));});if(!sched)sched=requestAnimationFrame(flush);})
  .observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTR});
const go=()=>walk(document.body);if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",go);else go();
})();
