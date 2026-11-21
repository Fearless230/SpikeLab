/* data-tech-more.js: more attacking and defensive techniques, each with its own 3D clip (see tools/blender/anim/research_more.py).
   Same format and scene coordinates as data-tech.js: metres, net at x = 0, our side negative; z across the court, our left negative. */
(function(){
const T=window.VB_TECHS=window.VB_TECHS||[];
const after=(id,e)=>{const i=T.findIndex(t=>t.id===id);T.splice(i<0?T.length:i+1,0,e);};
const SETTER={x:-1,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter"};

/* ------------------------------------------------------------ QUICK */
after("spike",{id:"quick_attack", name:"Quick attack (1, 31 and back 1)", kind:"Skill", level:"Advanced", skill:"attack",
 sum:"The middle's fastest attack: the hitter is in the air before the setter touches the ball and swings at a set that travels less than a metre.",
 why:"A quick forces the opposing middle blocker to commit to the middle hitter every time, which leaves the outside and right-side hitters facing one blocker. Even as a decoy, a quick that is run hard on every pass keeps the block honest.",
 phases:[
  {name:"Start", points:[
   "Begin about 3 m off the net and a step to the left of where the setter will set.",
   "Watch the pass, not the setter. Leave as the ball reaches the peak of its arc on the way to the setter.",
   "Left-handers: start a step to the right of the setter and approach left, right."]},
  {name:"Two-step approach", points:[
   "Right then left for a right-hander: one long directional step and a quick close.",
   "Plant square to the net, about an arm's length off it, with the hips under the shoulders.",
   "Arms swing back only a little. There is no time for a full arm swing."]},
  {name:"Take-off", points:[
   "Jump before the set. You should be rising as the setter's hands touch the ball.",
   "Lift the hitting arm early, elbow high, so the hand is already waiting at the top.",
   "For a 1 the ball is set just above and in front of the setter; a 31 is 2 to 3 m toward zone 4; a back 1 is just behind the setter."]},
  {name:"Contact", points:[
   "Short, fast arm: snap the forearm and wrist rather than a long swing from the shoulder.",
   "Hit the ball at the top of your reach. The setter puts it in your hand, so do not chase it.",
   "Most quick kills go into the seam between blockers, straight down, or cut back sharply across the body."]},
  {name:"After", points:[
   "Land on two feet facing the net and turn straight back into blocking.",
   "If you were a decoy, you still land ready to cover the hitter who got the ball."]}],
 cues:["Go on the pass","Up before the set","Arm up early","Short, fast arm","Hit the seam"],
 errors:[
  {error:"Leaving late, when the setter touches the ball", why:"The setter has to wait or loop the ball higher, and the middle blocker gets there in time.", fix:"Coach calls 'go' as the pass peaks. Reps against a tossed pass until leaving on the pass is automatic."},
  {error:"Full arm swing on the approach", why:"The arm is still coming up when the ball arrives, so contact is late and behind the head.", fix:"Approach with arms only to the hips and lift the hitting elbow on take-off. Practise with the arm already up."},
  {error:"Drifting into the setter or the net", why:"The approach angle is too flat, so the hitter collides with the setter or touches the net.", fix:"Mark the take-off spot with tape an arm's length off the net and approach straight to it."},
  {error:"Swinging at the ball instead of being in its path", why:"The hitter chases a set that was already on the hand and mistimes it.", fix:"Setter tosses into a still, raised hand first; add the swing only when the timing is right."}],
 target:"From a perfect pass, 7 of 10 quicks contacted at the top of the jump, landing inside the court, with no net or centre-line faults.",
 faults:["slow_last_steps","low_elbow","contact_behind","forward_drift"],
 scene:{cam:[-8,4.8,6.2], look:[-0.5,2,0],
  players:[
   {x:-0.9,z:0.15,pose:"swing",lift:0.6,me:true,label:"You",note:"Already in the air in front of the setter when the ball is set: a 1."},
   Object.assign({},SETTER,{note:"Delivers the ball barely a metre, straight into the hitter's hand."}),
   {x:-3.6,z:-3.8,pose:"ready",team:true,label:"Outside",note:"Approaching for a high ball. If the middle blocker jumps with the quick, this hitter faces one blocker."},
   {x:0.5,z:0.3,pose:"block",lift:0.3,opp:true,label:"Middle blocker",note:"Must jump with the quick hitter or the quick scores. That is what frees the other hitters."},
   {x:0.5,z:-3.2,pose:"block",lift:0.1,opp:true,label:"Right blocker",note:"Stays out wide on the outside hitter, too far to help on the quick."},
   {x:6,z:-1.2,pose:"platform",low:true,opp:true,label:"Digger",note:"Has almost no time to read a quick. The seams either side of the middle are open."}],
  steps:[{x:-2.35,z:0.5,n:1},{x:-1.4,z:0.3,n:2}],
  paths:[
   {a:[-6,0.9,0],b:[-1,2.4,1.2],arc:2.2,seq:true,label:"Pass"},
   {a:[-1,2.4,1.2],b:[-0.75,3,0.15],arc:0.2,seq:true,label:"1 set"},
   {a:[-0.75,3,0.15],b:[3.8,0,-1.4],arc:0.1,seq:true,fast:true,label:"Seam"},
   {a:[-0.75,3,0.15],b:[2.6,0,3],arc:0.1,alt:true,fast:true,label:"Cut back"},
   {a:[-1,2.4,1.2],b:[-0.8,3,-2.2],arc:0.6,alt:true,label:"31 set"}],
  zones:[{x:-1.35,z:0.3,w:1.2,d:1.2,label:"Take-off"},{x:3.8,z:-1.4,w:2.2,d:2.2,label:"Seam"}]}});

/* ------------------------------------------------------------ SHOOT / GO */
after("quick_attack",{id:"shoot_go", name:"Shoot and go (fast sets to the pins)", kind:"Skill", level:"Advanced", skill:"attack",
 sum:"A fast, flat set to the antenna (a go or shoot to zone 4, a red or back-shoot to zone 2) hit by an outside or opposite with a quicker, shorter approach.",
 why:"A high ball to the pin gives the block time to form two or three hands. A shoot reaches the antenna in under a second, so the hitter often faces a single blocker or a block that is still closing, with a seam between the hands.",
 phases:[
  {name:"Start", points:[
   "Start wider than for a high ball, just outside the court, about 3.5 m off the net.",
   "Leave as the setter touches the ball, not after you see the set: the approach is timed with the setter's hands.",
   "Left-handers on the right side: the shoot (red) to zone 2 is the same skill mirrored."]},
  {name:"Three-step approach", points:[
   "Left, right, left for a right-hander: drop the first step of the four-step approach.",
   "Stay on a straight line to the take-off spot near the antenna; a looping approach is too slow.",
   "Open the hips toward the setter on the plant so the ball arrives in front of the hitting shoulder."]},
  {name:"Take-off and arm", points:[
   "Jump when the ball is about halfway to you. It travels flat, so the timing window is short.",
   "Bow and arrow quickly: elbow high, non-hitting arm points at the ball.",
   "Contact in front of the hitting shoulder; a flat set that is behind you is a free ball."]},
  {name:"Shot", points:[
   "Hit before the block closes: through the seam between the blockers or high off the outside hand.",
   "Line is open when the outside blocker is late; sharp cross is open when the middle has not arrived."]},
  {name:"Finish", points:[
   "Land on two feet, then cover or transition back to defence."]}],
 cues:["Go with the setter's hands","Three fast steps","Open to the setter","Hit before the block","Seam or line"],
 errors:[
  {error:"Approaching at high-ball speed", why:"The set arrives before the hitter is ready and the ball is played late and behind the shoulder.", fix:"Setter throws flat balls to the pin and the hitter must catch them at the top of the jump before hitting any."},
  {error:"Starting too close to the setter", why:"The hitter is squeezed inside the antenna and has no room for the line shot.", fix:"Mark a start spot outside the sideline and approach to a take-off spot about a metre inside the antenna."},
  {error:"Swinging across the body every time", why:"The block only has to defend cross-court and closes the seam.", fix:"Alternate line and seam targets on every set in practice."}],
 target:"7 of 10 shoot sets attacked in front of the hitting shoulder, landing in, against a two-person block that starts in the middle.",
 faults:["slow_last_steps","contact_behind","low_elbow"],
 scene:{cam:[-7.5,5,-9.5], look:[0.5,1.6,-1.8],
  players:[
   {x:-1.1,z:-3.6,pose:"swing",lift:0.65,me:true,label:"You",note:"Three-step approach started with the setter's hands, already in the air as the flat set arrives."},
   Object.assign({},SETTER,{note:"Pushes a fast, flat ball to the antenna instead of a high looping set."}),
   {x:-0.9,z:0.2,pose:"swing",lift:0.4,team:true,label:"Middle",note:"Runs a quick first to hold the opposing middle blocker in the middle."},
   {x:0.5,z:-3.3,pose:"block",lift:0.45,opp:true,label:"Right blocker",note:"Alone on the hitter: the middle blocker cannot get across in time."},
   {x:0.5,z:-1.1,pose:"block",lift:0.15,opp:true,label:"Middle blocker",note:"Still closing from the quick hitter. The seam between the two blockers is open."},
   {x:6.2,z:2.2,pose:"platform",low:true,opp:true,label:"Cross digger",note:"Set deep for a high ball. A hard seam shot gets past before they move."}],
  steps:[{x:-3.6,z:-4.3,n:1},{x:-2.3,z:-3.8,n:2},{x:-1.8,z:-4,n:3}],
  paths:[
   {a:[-1,2.3,1.2],b:[-0.9,3.1,-3.6],arc:0.45,seq:true,fast:true,label:"Shoot set"},
   {a:[-0.9,3.1,-3.6],b:[5.4,0,-0.6],arc:0.25,seq:true,fast:true,label:"Seam"},
   {a:[-0.9,3.1,-3.6],b:[7.2,0,-3.9],arc:0.3,alt:true,fast:true,label:"Line"}],
  zones:[{x:5.4,z:-0.6,w:2.4,d:2,label:"Seam"},{x:7.2,z:-3.8,w:2.6,d:1.2,label:"Line"}]}});

/* ------------------------------------------------------------ ROLL SHOT */
after("tip_roll",{id:"roll_shot", name:"Roll shot", kind:"Skill", level:"Intermediate", skill:"attack",
 sum:"An off-speed attack swung at reduced speed with an open hand that rolls up and over the ball, so topspin carries it over the block and drops it into the middle or deep court.",
 why:"Defenders who read a hard swing sit deep and low. A roll shot lands in the open middle of the court, in front of them, or deep in a corner they have left, and it is safer than a tip against a big block because it travels higher and farther.",
 phases:[
  {name:"Disguise", points:[
   "Full approach, full arm lift and a high elbow. Nothing should look different until the last moment.",
   "Read the defence on the approach: deep defenders mean the middle of the court is open."]},
  {name:"Swing", points:[
   "Swing at about half speed with a loose, open hand.",
   "Contact below the centre of the ball, slightly in front of the hitting shoulder."]},
  {name:"Roll", points:[
   "Roll the wrist and fingers up and over the ball so it leaves with topspin.",
   "Finish with the fingers pointing at the floor on the target side.",
   "Aim high enough to clear the block's hands; topspin brings it down quickly."]},
  {name:"Targets", points:[
   "Centre of the court (zone 6, short) when defenders are deep.",
   "Deep corner when a defender has moved up to cover tips.",
   "Over the middle blocker when the block is late or short."]},
  {name:"Finish", points:[
   "Land balanced and cover: a roll shot is often dug, so be ready for the next attack."]}],
 cues:["Sell the swing","Half speed","Under, then over","Topspin","Hit the hole"],
 errors:[
  {error:"Slowing the approach to set up the shot", why:"The defence reads it early and moves up into the middle of the court.", fix:"Coach calls 'swing' or 'roll' after take-off so every approach must look the same."},
  {error:"Contact on top of the ball", why:"The ball goes down into the block or the net.", fix:"Self-toss and roll against a wall: hand under the ball first, then over."},
  {error:"No wrist roll, the ball floats", why:"Without topspin the ball hangs in the air and defenders run it down.", fix:"Roll shots to a partner who catches; they should feel the ball dip and spin."}],
 target:"7 of 10 roll shots from a full approach clear a two-person block and land untouched in the called zone.",
 faults:["low_elbow","contact_behind","forward_drift"],
 scene:{cam:[-7,5,-9.5], look:[1.5,1.4,-1.5],
  players:[
   {x:-1.1,z:-3.4,pose:"swing",lift:0.65,me:true,label:"You",note:"Full approach and high elbow, then a slower swing that rolls over the top of the ball."},
   Object.assign({},SETTER,{note:"A good set the block has read well is a good time for the roll shot."}),
   {x:0.5,z:-3.3,pose:"block",lift:0.45,opp:true,label:"Blocker",note:"Formed and on time, so a hard swing would be blocked."},
   {x:0.5,z:-2.3,pose:"block",lift:0.45,opp:true,label:"Middle",note:"Closes the block. The ball has to go over both sets of hands."},
   {x:6.8,z:-3.2,pose:"platform",low:true,opp:true,label:"Line digger",note:"Deep for a hard-driven ball; the roll lands in front of them."},
   {x:6.6,z:2.2,pose:"platform",low:true,opp:true,label:"Cross digger",note:"Also deep. The middle of the court is open."}],
  steps:[{x:-4.4,z:-4.1,n:1},{x:-3.4,z:-3.9,n:2},{x:-2.2,z:-3.6,n:3},{x:-1.8,z:-3.9,n:4}],
  paths:[
   {a:[-1,2.2,1.2],b:[-0.9,3,-3.4],arc:2,seq:true,label:"Set"},
   {a:[-0.9,3,-3.4],b:[4.6,0,0.2],arc:1.3,seq:true,label:"Roll shot"},
   {a:[-0.9,3,-3.4],b:[7.8,0,3.6],arc:1.9,alt:true,label:"Deep corner"}],
  zones:[{x:4.6,z:0.2,w:2.6,d:2.6,label:"Open middle"},{x:7.8,z:3.6,w:1.6,d:1.6,label:"Corner"}]}});

/* ------------------------------------------------------------ CUT SHOT */
after("roll_shot",{id:"cut_shot", name:"Cut shot (sharp angle)", kind:"Skill", level:"Advanced", skill:"attack",
 sum:"A sharp cross-court attack: the hand contacts the outside of the ball and the arm and wrist cut across the body, so the ball drops short near the opposite sideline, inside the block.",
 why:"Blockers who take away line and the main cross angle leave the short sharp angle open. The cut shot travels too short for back-row defenders and too wide for the middle blocker, and it is one of the main shots of middles and outside hitters.",
 phases:[
  {name:"Approach", points:[
   "Normal approach, but let the last steps drift slightly outside the ball so it ends up in front of the hitting shoulder.",
   "Show line with the shoulders as long as possible. The block will protect it."]},
  {name:"Contact", points:[
   "Contact the outside (the side away from your body) and the top of the ball.",
   "The arm swings across the body and the forearm turns over (pronates) hard at contact.",
   "The wrist snaps down and across; the palm finishes facing away from you."]},
  {name:"Target", points:[
   "Inside the 3 m line near the opposite sideline, past the end of the block.",
   "Shorter and softer is safer: the angle does the work, not the power."]},
  {name:"Finish", points:[
   "Land on two feet, then transition. The cut shot pulls defenders forward for the next ball."]}],
 cues:["Show line","Outside of the ball","Turn the hand over","Short and sharp","Past the block"],
 errors:[
  {error:"Turning the shoulders early", why:"The block reads the cross-court angle and seals it.", fix:"Keep the chest facing line until the arm swing starts; video from behind to check."},
  {error:"Too much power", why:"A hard ball on a sharp angle lands wide of the sideline.", fix:"Hit at 70% to a target the size of a towel inside the 3 m line."},
  {error:"Ball too far inside the body", why:"The hitter cannot reach round the outside of it and the cut becomes a roll into the block.", fix:"Approach so the ball is in front of the hitting shoulder; drift the last two steps outside the set."}],
 target:"6 of 10 cut shots land inside the opposite 3 m box near the sideline, with a block in front.",
 faults:["contact_behind","no_trunk_rotation","low_elbow"],
 scene:{cam:[-7.5,5.5,7.5], look:[1,1.4,0],
  players:[
   {x:-1.1,z:-3.4,pose:"swing",lift:0.65,me:true,label:"You",note:"Shows line, then contacts the outside of the ball and cuts it sharp across the court."},
   Object.assign({},SETTER,{note:"A set slightly inside lets the hitter cut it."}),
   {x:0.5,z:-3.4,pose:"block",lift:0.45,opp:true,label:"Blocker",note:"Takes away the line shot."},
   {x:0.5,z:-2.4,pose:"block",lift:0.45,opp:true,label:"Middle",note:"Takes the main cross angle. The sharp angle is past the end of the block."},
   {x:6.4,z:2.6,pose:"platform",low:true,opp:true,label:"Cross digger",note:"Deep in the corner for the hard cross: too far back to reach the short angle."}],
  steps:[{x:-4.4,z:-4.3,n:1},{x:-3.4,z:-4.1,n:2},{x:-2.2,z:-3.9,n:3},{x:-1.8,z:-4.1,n:4}],
  paths:[
   {a:[-1,2.2,1.2],b:[-0.9,3.1,-3.4],arc:2,seq:true,label:"Set"},
   {a:[-0.9,3.1,-3.4],b:[2.2,0,3.4],arc:0.15,seq:true,fast:true,label:"Cut shot"},
   {a:[-0.9,3.1,-3.4],b:[6.4,0,2.6],arc:0.3,alt:true,fast:true,label:"Main cross"}],
  zones:[{x:2,z:3.4,w:2.2,d:1.6,label:"Sharp angle"}]}});

/* ------------------------------------------------------------ TOOL */
after("cut_shot",{id:"tool_shot", name:"Tooling the block (wipe and high hands)", kind:"Skill", level:"Advanced", skill:"attack",
 sum:"Using the block to score: the hitter aims at the outside edge or top of the blocker's hands so the ball deflects out of bounds.",
 why:"On a tight set or against a big block a full swing into the court is often stuffed. A ball that touches the block and lands out is the attacker's point, so the block becomes the target instead of the obstacle.",
 phases:[
  {name:"Read the block", points:[
   "On the approach, see where the outside blocker's hands are and how far they are from the antenna.",
   "A tight set or a blocker who has not sealed the antenna invites the wipe."]},
  {name:"Wipe", points:[
   "Contact the ball with a firm hand and drive it into the outside half of the outside blocker's hand.",
   "Turn the wrist and hand slightly outward so the ball skims off sideways toward the antenna and out.",
   "Stay inside the antenna: hitting the antenna is the attacker's fault."]},
  {name:"High hands", points:[
   "Against a short or late block, swing high at the top of the blocker's fingers.",
   "The ball deflects up and deep behind the court where nobody can play it."]},
  {name:"Finish", points:[
   "Land, cover the block. A tool that stays in becomes a free ball for the other team if you are not ready."]}],
 cues:["See the hands","Aim at the outside hand","High and off","Stay inside the antenna","Cover"],
 errors:[
  {error:"Hitting straight into the middle of the block", why:"Two hands meet the ball squarely and it comes straight back down.", fix:"Tape a target on the outside edge of a blocking board and hit only at that edge."},
  {error:"Tool goes into the antenna", why:"The hitter aimed too wide and the ball touches the antenna: point to the other team.", fix:"Aim at the blocker's outside hand, not the gap between the hand and the antenna."},
  {error:"Swinging soft at the block", why:"A soft ball off the hands drops on the hitter's side or stays in court.", fix:"The tool needs speed: full arm swing, the angle comes from the wrist."}],
 target:"From tight sets with a blocker in front, 6 of 10 attacks touch the block and land out of play.",
 faults:["low_elbow","contact_behind"],
 scene:{cam:[-6,4.5,-11], look:[0.5,2,-3.5],
  players:[
   {x:-1.1,z:-3.4,pose:"swing",lift:0.7,me:true,label:"You",note:"A tight set near the antenna. Aims at the blocker's outside hand, not the court."},
   Object.assign({},SETTER,{note:"The set is a little tight: the blocker is right in front of the hitter."}),
   {x:0.45,z:-3.8,pose:"block",lift:0.5,opp:true,label:"Blocker",note:"Has not turned the outside hand in toward the court. The ball off that hand goes out."},
   {x:0.5,z:-2.8,pose:"block",lift:0.45,opp:true,label:"Middle",note:"Closes the inside, so the court is shut."}],
  steps:[{x:-4.4,z:-4.1,n:1},{x:-3.4,z:-3.9,n:2},{x:-2.2,z:-3.6,n:3},{x:-1.8,z:-3.9,n:4}],
  paths:[
   {a:[-1,2.2,1.2],b:[-0.9,3.15,-3.4],arc:1.8,seq:true,label:"Tight set"},
   {a:[-0.9,3.15,-3.4],b:[0.3,3,-3.9],arc:0,seq:true,fast:true,label:"Wipe"},
   {a:[0.3,3,-3.9],b:[2.6,0,-6.4],arc:0.6,seq:true,label:"Off the hands, out"},
   {a:[-0.9,3.15,-3.4],b:[-1.5,0,-9.5],arc:2.4,alt:true,label:"High hands, deep out"}],
  zones:[{x:2.6,z:-6.2,w:2,d:1.6,label:"Out"}]}});

/* ------------------------------------------------------------ SETTER DUMP */
after("jump_set",{id:"setter_dump", name:"Setter dump (second-ball attack)", kind:"Skill", level:"Advanced", skill:"set",
 sum:"A front-row setter attacks the second ball instead of setting it: the jump set disguise, then the near hand drops and the far (left) hand pushes the ball over into the space behind the block.",
 why:"A setter who can score on two forces the opposing middle or right-side blocker to stay with them, which opens the middle of the net for the quick and the slide. It is a key weapon when the pass is tight and the block jumps with the hitters.",
 phases:[
  {name:"Rules first", points:[
   "Only a front-row setter may attack a ball that is completely above the net. In the back row, a dump above the net is a fault.",
   "The ball must be on your side of the net (or crossing it) when you play it."]},
  {name:"Disguise", points:[
   "Jump set every pass that is within about a metre of the net and above it, so the dump and the set look the same.",
   "Hands up early in the setting window, ball above the forehead, square to the left pin."]},
  {name:"Dump", points:[
   "At the last moment the hand nearest the net (the right for most setters) drops away.",
   "The left hand pushes or flicks the ball down and over the net with stiff fingers.",
   "Left-handers: you can attack with your dominant hand, which is the hand away from the net when facing left front."]},
  {name:"Targets", points:[
   "Just over the net behind the blockers when the block jumps with the quick.",
   "Deep into zone 5 or 1 with a flick when defenders creep forward.",
   "On two with the right hand (a swing) into zone 4 when the opposite blocker turns away."]},
  {name:"After", points:[
   "Land balanced and cover: the dump is often dug and the next ball is yours to set."]}],
 cues:["Front row only","Look like a set","Drop the near hand","Push with the far hand","Behind the block"],
 errors:[
  {error:"Dumping from the back row", why:"Attacking a ball completely above the net as a back-row player is a fault.", fix:"Know the rotation: say 'front' or 'back' to yourself as the serve goes up."},
  {error:"Different posture before the dump", why:"Turning toward the net early tells the block it is coming.", fix:"Coach tosses tight balls; setter decides late and only on a signal given after the toss."},
  {error:"Dumping every tight pass", why:"The middle blocker stays home and the dump is blocked.", fix:"Use it when the block jumps with the quick or slide, about one in eight tight passes."},
  {error:"Caught or thrown ball", why:"A long push that rests in the hand is a lift.", fix:"Short, stiff-fingered contact; practise flicks off a ball held by a partner."}],
 target:"From tight passes, 6 of 10 dumps land in the called target untouched, with no back-row or lift faults.",
 faults:["low_set_contact","no_leg_drive_set"],
 scene:{cam:[-6.5,4.2,-3.5], look:[0,1.9,1.4],
  players:[
   {x:-0.8,z:1.1,pose:"set",face:1.5708,me:true,label:"You",note:"Front-row setter. Jump sets a tight pass and pushes it over with the left hand."},
   {x:-0.9,z:2.6,pose:"swing",lift:0.3,team:true,label:"Middle",note:"Runs the slide behind the setter, pulling the opposing middle blocker with them."},
   {x:-3.6,z:-3.8,pose:"ready",team:true,label:"Outside",note:"Calls for the high ball to the left and keeps the right blocker wide."},
   {x:0.5,z:2.4,pose:"block",lift:0.4,opp:true,label:"Middle blocker",note:"Jumped with the slide. Nobody is left in front of the setter."},
   {x:0.5,z:-3.3,pose:"block",lift:0.1,opp:true,label:"Right blocker",note:"Wide on the outside hitter."},
   {x:5.5,z:-1,pose:"platform",low:true,opp:true,label:"Digger",note:"Deep in base defence, too far back for a ball that drops just over the net."}],
  paths:[
   {a:[-5.5,0.9,0],b:[-0.8,2.6,1.1],arc:2.4,seq:true,label:"Tight pass"},
   {a:[-0.8,2.6,1.1],b:[1.4,0,0.2],arc:0.35,seq:true,label:"Dump"},
   {a:[-0.8,2.6,1.1],b:[6.8,0,2.8],arc:0.6,alt:true,fast:true,label:"Flick deep"}],
  zones:[{x:1.4,z:0.2,w:1.6,d:1.8,label:"Behind the block"}]}});

/* ------------------------------------------------------------ COLLAPSE DIG */
after("dig",{id:"collapse_dig", name:"Collapse dig", kind:"Skill", level:"Intermediate", skill:"dig",
 sum:"For a hard ball that drops short and low in front: step under it, drop the hips and sit down through the ball with the platform angled up, then rock back onto the feet.",
 why:"A ball below the knees cannot be passed from a normal low base, and diving forward takes too long when it is close. Collapsing puts the platform under the ball fast and safely, sending it up rather than forward.",
 phases:[
  {name:"Read", points:[
   "Start in a low defensive base, weight on the toes, split step as the hitter swings.",
   "A ball heading for the floor just in front of you is a collapse ball, not a dive."]},
  {name:"Step and drop", points:[
   "Take one short step toward the ball with the foot on that side.",
   "Drop the hips straight down and back as if sitting on a low chair, keeping the chest up.",
   "Get the platform out early, arms straight and joined, angled up toward the setter."]},
  {name:"Contact", points:[
   "Play the ball off the forearms as the seat goes toward the floor; arms stay still.",
   "The ball goes up first. Height gives the setter time, direction is a bonus."]},
  {name:"Land and recover", points:[
   "Sit down onto the back of the thigh and the seat, then roll back slightly and rock forward onto the feet.",
   "Do not reach back with the hands to catch yourself; that is how wrists get hurt.",
   "Back in base before the next ball."]}],
 cues:["Short ball: sit","Step and drop","Chest up","Platform first","Ball up, not forward"],
 errors:[
  {error:"Bending at the waist instead of the knees", why:"The platform points at the floor and the ball goes forward into the net or out.", fix:"Collapse onto a mat with a coach tossing low balls; keep the chest up and look at the ball."},
  {error:"Swinging the arms", why:"A hard ball plus a swing goes over the net.", fix:"Hold the platform still; the drop of the body absorbs the speed."},
  {error:"Putting a hand down to break the fall", why:"Wrist and elbow injuries.", fix:"Practise the sit and roll without a ball until the hands stay on the platform."}],
 target:"8 of 10 short hard balls dug up above head height to the middle of the court from a collapse.",
 faults:["upright_posture","swinging_platform","bent_elbows_platform"],
 scene:{cam:[-10.5,4.5,5], look:[-4,0.8,0],
  players:[
   {x:-5.2,z:-0.4,pose:"platform",low:true,me:true,label:"You",note:"The ball is short and low in front: step, drop and sit through it."},
   {x:1,z:-3,pose:"swing",lift:0.6,opp:true,label:"Hitter",note:"A hard, steep ball over a short block."},
   {x:-2.4,z:1.2,pose:"ready",team:true,label:"Setter",note:"Comes off the net for the dug ball."},
   {x:-0.5,z:-3,pose:"block",lift:0.35,team:true,label:"Blocker",note:"Short block: the ball goes over the hands and steeply down."}],
  paths:[
   {a:[0.8,3,-3],b:[-5,0.5,-0.4],arc:0.1,seq:true,fast:true,label:"Steep spike"},
   {a:[-5,0.5,-0.4],b:[-2.4,2.6,1.2],arc:2.4,seq:true,label:"Dig up"}],
  zones:[{x:-2.4,z:1.2,w:2,d:2,label:"Target"}]}});

/* ------------------------------------------------------------ SIDE DIVE */
after("sprawl_pancake",{id:"side_dive", name:"Side dive and roll (lateral extension)", kind:"Skill", level:"Advanced", skill:"dig",
 sum:"For a ball wide to the side: a long lunge step, a low lay-out along the floor with the near arm reaching, a one-hand pancake or forearm, then a roll or push-up back to the feet.",
 why:"Balls deflected off the block or hit into the seam often land a metre or two to the side. Moving the feet first and then extending sideways adds reach without the injury risk of falling on an elbow or shoulder.",
 phases:[
  {name:"Move first", points:[
   "Split step, then push off the far foot. Use a shuffle or crossover while there is time.",
   "Extend only when the ball cannot be reached on the feet."]},
  {name:"Lunge and lay out", points:[
   "The last step is long and low toward the ball, knee over the foot.",
   "Stay low: the hip and thigh should be close to the floor before the body leaves the lunge.",
   "Reach with the near arm, palm flat for a pancake or with a one-arm platform."]},
  {name:"Contact", points:[
   "Pancake: hand flat on the floor, palm down, timed so the ball bounces off the back of the hand.",
   "One arm: contact on the forearm with the wrist cocked, aiming up toward the middle of the court."]},
  {name:"Land and roll", points:[
   "Land on the side of the thigh, hip and the side of the back, never on the elbow or the point of the shoulder.",
   "Either roll over the far shoulder (a shoulder roll) or push up with the free hand straight back to the feet.",
   "Back in base for the next ball."]}],
 cues:["Feet first","Long, low step","Reach with the near arm","Land on the hip","Roll and up"],
 errors:[
  {error:"Diving from standing height", why:"The fall is long and hard, usually onto the elbow or knee.", fix:"Teach from kneeling, then from a low lunge, then on the move. Use mats at first."},
  {error:"Extending too early", why:"The player is on the floor before the ball arrives and cannot adjust.", fix:"Coach tosses wide balls; the player must take two steps before any extension."},
  {error:"Reaching with the far arm", why:"Shoulder and face end up toward the floor and the ball goes backward.", fix:"Near arm reaches, far arm stays free to protect and push up."}],
 target:"7 of 10 balls tossed 2 m to the side kept up and playable, with safe landings on both sides.",
 faults:["narrow_base","weight_back"],
 scene:{cam:[-11,4.5,-2], look:[-4.5,0.7,1.6],
  players:[
   {x:-5.6,z:1.1,pose:"platform",low:true,me:true,label:"You",note:"Starts in base, lunges right and lays out with a one-hand pancake."},
   {x:1,z:-3,pose:"swing",lift:0.6,opp:true,label:"Hitter",note:"The ball is deflected off the block and is heading wide."},
   {x:-0.5,z:-2.8,pose:"block",lift:0.45,team:true,label:"Blocker",note:"Touches the ball, which slows and widens its path."},
   {x:-2.2,z:1.2,pose:"ready",team:true,label:"Setter",note:"Moves toward the save."}],
  paths:[
   {a:[0.8,3,-3],b:[-5.6,0.05,2.6],arc:0.6,seq:true,label:"Deflection, wide"},
   {a:[-5.6,0.05,2.6],b:[-2.8,2.4,1.0],arc:1.8,seq:true,label:"Pancake up"}],
  zones:[{x:-5.6,z:2.6,w:1.4,d:1.4,label:"Save"}]}});

/* ------------------------------------------------------------ OVERHEAD DIG */
after("side_dive",{id:"overhead_dig", name:"Overhead dig (tomahawk and beach dig)", kind:"Skill", level:"Intermediate", skill:"dig",
 sum:"For a hard ball at the face or just over the shoulder: hands joined above the forehead (fists together, a tomahawk with palms together, or the beach-style open hands) and a firm push up.",
 why:"A defender in base is often hit high: there is no time to drop under the ball, and a forearm pass at face height sends it backward. A firm overhead contact keeps the ball in play and up.",
 phases:[
  {name:"Read", points:[
   "Low base, weight forward, split step as the hitter swings.",
   "A ball at the chest or above, coming fast, is an overhead dig."]},
  {name:"Hands", points:[
   "Bring the hands up together in front of the forehead, elbows slightly bent and in front of the body.",
   "Tomahawk: palms together, thumbs crossed. Fists: knuckles side by side. Indoor referees judge a hard-driven ball generously, but the contact must be quick.",
   "Wrists and fingers firm. A soft hand lets the ball through."]},
  {name:"Contact", points:[
   "Play the ball in front of the forehead with a short push up and toward the middle of the court.",
   "Use the legs to lift; do not reach back over the head."]},
  {name:"Finish", points:[
   "Back to base. Height is the goal: the setter or another player chases it."]}],
 cues:["High ball: hands up","Hands together","Firm wrists","In front of the forehead","Up, not back"],
 errors:[
  {error:"Forearm pass at face height", why:"The platform faces backward and the ball goes over your head out of the court.", fix:"Partner throws balls at the face; dig them only with joined hands until it is automatic."},
  {error:"Hands apart", why:"The ball goes between them or spins off one hand.", fix:"Clap the hands together on the split step before the ball arrives."},
  {error:"Contact behind the head", why:"No control; the ball goes backward.", fix:"Step back half a step on the read so contact is in front of the forehead."}],
 target:"7 of 10 hard balls hit at head height kept up above the net height inside the court.",
 faults:["low_set_contact","weight_back"],
 scene:{cam:[-11,4.6,4], look:[-4.5,1.6,0],
  players:[
   {x:-5.6,z:-0.6,pose:"set",me:true,label:"You",note:"The ball is coming at the face: hands up and together."},
   {x:1,z:-3,pose:"swing",lift:0.6,opp:true,label:"Hitter",note:"Hits flat and hard over a late block."},
   {x:-2.4,z:1.2,pose:"ready",team:true,label:"Setter",note:"Will chase the high dig."}],
  paths:[
   {a:[0.8,3,-3],b:[-5.6,2.2,-0.6],arc:0.05,seq:true,fast:true,label:"Hard at the face"},
   {a:[-5.6,2.2,-0.6],b:[-2.6,3,0.8],arc:2.6,seq:true,label:"Up"}],
  zones:[{x:-2.6,z:0.8,w:2,d:2,label:"Target"}]}});
})();
