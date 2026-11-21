/* Technique library. Plain data only.
   Scene coords in metres: x along the court (net at 0, athlete's side negative), y up,
   z across the court (for the athlete's team facing the net, left is negative z, right is positive z). */
window.VB_TECHS = [

 /* ---------------------------------------------------------------- PASS */
 {id:"pass", name:"Forearm pass", kind:"Skill", level:"Foundation", skill:"pass",
  sum:"Turns a serve or free ball into a high, calm ball the setter can run the full offence from.",
  why:"Every side-out starts here: a pass that lets the setter use all hitters forces the block to guess. Top teams build serve receive on a still, early platform and angle control, not on arm swing.",
  phases:[
   {name:"Ready", points:[
    "Feet wider than shoulders, right foot slightly ahead, knees inside the toes, weight on the balls of the feet.",
    "Arms relaxed and apart in front of the body so you can move freely. Do not join the hands yet.",
    "Read the server: toss position, shoulder line and hand contact tell you depth and direction early."]},
   {name:"Move", points:[
    "Shuffle or take one crossover so the ball arrives at the midline or just inside your left hip.",
    "Keep the head level while you move. Bobbing up and down changes how you see the ball's flight.",
    "Arrive and be stopped before contact, feet set and shoulders forward over the knees."]},
   {name:"Platform", points:[
    "Join the hands late, heels of the hands together, thumbs parallel and pointed at the floor.",
    "Lock the elbows and roll the shoulders forward so the forearms make one flat board.",
    "Present the board early and tilt it toward the target by dropping the inside shoulder."]},
   {name:"Contact", points:[
    "Meet the ball on the forearms a hand-width above the wrists, well out in front of the body.",
    "Hold the angle and let the ball rebound. On a hard serve, absorb. On a soft ball, add a small leg push.",
    "Arms stay below shoulder height. Eyes follow the ball onto the platform."]},
   {name:"Finish", points:[
    "Freeze the platform on the target line for a count of one, then release the hands.",
    "Move straight to your attack or cover position. The pass is not finished until you are ready again."]}],
  cues:["Beat the ball to the spot","Thumbs down, elbows locked","Angle, don't swing","Quiet platform","Hold your finish"],
  errors:[
   {error:"Swinging the arms up at the ball", why:"Adds speed you cannot control, so the pass flies over the net or tight to the tape.", fix:"Pass with the arms held still against a wall or partner. Only the platform angle and legs change."},
   {error:"Bent elbows or hands joined unevenly", why:"The ball hits two different surfaces and spins off sideways.", fix:"Press the heels of the hands together and reach the thumbs to the floor until the elbows lock."},
   {error:"Reaching sideways instead of moving the feet", why:"The platform faces the wrong way and the ball leaves along your arms, not toward the target.", fix:"Shuffle-and-freeze drill: two steps, stop, then pass. No pass counts unless the feet were set."},
   {error:"Standing up through contact", why:"The platform rises and tilts back, sending the ball low and flat at the setter.", fix:"Stay at the same head height from ready position until after the ball has left your arms."},
   {error:"Weight on the heels", why:"First step is late and short serves drop in front of you.", fix:"Lean until the heels feel light. A partner should be able to slide paper under them."}],
  target:"8 of 10 served balls land in a 2 m target at the setter spot, peaking between 3 and 4 m high.",
  faults:["bent_elbows_platform","swinging_platform","narrow_base","weight_back","upright_posture"],
  scene:{cam:[-12,6.5,7.5], look:[-3,1,0],
   players:[
    {x:-6,z:0.3,pose:"platform",low:true,me:true,label:"You",note:"Stopped behind the ball with the platform already angled at the setter before contact."},
    {x:-6,z:-2.6,pose:"ready",team:true,label:"Passer",note:"Not playing this ball: opens toward you and calls 'yours' early."},
    {x:-1,z:1.2,pose:"ready",face:1.5708,team:true,label:"Setter",note:"Waits at the target, right shoulder to the net, and sets from wherever the pass peaks."},
    {x:9.6,z:-2,pose:"swing",opp:true,label:"Server",note:"Watch the toss and the shoulder line: they show direction before the ball is hit."}],
   paths:[
    {a:[9.4,2.6,-2],b:[-6,0.6,0.3],arc:1.7,seq:true,label:"Serve"},
    {a:[-6,0.6,0.3],b:[-1,2.6,1.2],arc:2.2,seq:true,label:"Pass"}],
   zones:[{x:-1.2,z:1.2,w:2,d:2,label:"Target"}]}},

 /* ------------------------------------------------------- OVERHEAD PASS */
 {id:"overhead_pass", name:"Overhead receive and tomahawk", kind:"Skill", level:"Intermediate", skill:"pass",
  sum:"Takes a high, flat serve or deep ball with the hands above the head instead of backing up to forearm pass it.",
  why:"Against deep float serves it lets passers start further forward and cut the ball off before it moves late. The tomahawk is the emergency version for a ball that is already past your forehead.",
  phases:[
   {name:"Read", points:[
    "Decide early: a ball arriving above the shoulders is a hands ball, below the chest is a platform ball.",
    "Start a step shallower than for forearm passing so high serves come to your forehead, not over it.",
    "Call it. A late switch between platform and hands is where most errors come from."]},
   {name:"Set the base", points:[
    "Stop with feet staggered and wide, knees bent, hips behind the ball's line.",
    "Raise the hands early to just above the forehead, elbows out, fingers spread wider than for setting.",
    "Stiffen the wrists and fingers. A serve carries far more pace than a pass does."]},
   {name:"Contact", points:[
    "Take the ball in front of the forehead on all finger pads with both hands at the same instant.",
    "Use a short, firm push with almost no give. Long contact is called a lift.",
    "Push up as well as forward so the ball climbs to the setter instead of driving at them."]},
   {name:"Tomahawk", points:[
    "When the ball is behind your head, clasp the hands together above it with thumbs side by side and crossed.",
    "Contact on the heels or outer edges of the joined hands with firm wrists, and lift upward.",
    "Use it only to keep the ball alive high in the middle of the court. It is not an accurate pass."]},
   {name:"Finish", points:[
    "Hold the hands toward the target for a moment, then get to your attack or cover position.",
    "If you fell back at contact, recover forward at once: the next ball is often a tip or an overpass."]}],
  cues:["High ball, high hands","Strong fingers","Short and firm","Push it up","Call hands early"],
  errors:[
   {error:"Soft, setting-style hands on a hard serve", why:"The ball slides through the fingers or is held too long and called.", fix:"Receive firm partner throws with locked wrists first, then build up to served balls."},
   {error:"Contact above or behind the head", why:"The ball goes straight up or backward with no control of direction.", fix:"Take one drop step so the forehead is behind the ball. If you cannot, switch to a tomahawk."},
   {error:"Deciding late between platform and hands", why:"Hands arrive half-formed and the ball is shanked or doubled across two actions.", fix:"Shoulder rule in every rep: call 'hands' or 'arms' aloud before the ball crosses the net."},
   {error:"Falling backward at contact", why:"Power goes up instead of forward and the pass drops short of the setter.", fix:"Keep the front foot planted and finish with weight moving toward the target."}],
  target:"7 of 10 deep float serves taken overhead reach the setter zone at or above net height with no handling call.",
  faults:["low_set_contact","weight_back","narrow_base"],
  scene:{cam:[-11.5,5.5,7], look:[-3,1.6,0.5],
   players:[
    {x:-5,z:0.5,pose:"set",me:true,label:"You",note:"Starts shallow and takes the head-high serve with firm hands in front of the forehead."},
    {x:-6.2,z:-2.6,pose:"platform",low:true,team:true,label:"Passer",note:"Stays deeper to cover the ball that drops short of head height in the seam."},
    {x:-1,z:1.2,pose:"ready",face:1.5708,team:true,label:"Setter",note:"Expects a faster, flatter pass than usual and is ready to move off the net."},
    {x:9.6,z:1,pose:"swing",opp:true,label:"Server",note:"Hits a flat, deep float aimed at shoulder height to jam the passer."}],
   paths:[
    {a:[9.3,2.6,1],b:[-5,1.9,0.5],arc:1.2,seq:true,label:"Deep float"},
    {a:[-5,1.9,0.5],b:[-1,2.6,1.2],arc:1.8,seq:true,label:"Overhead pass"}],
   zones:[{x:-1.2,z:1.2,w:2,d:2,label:"Target"}]}},

 /* ----------------------------------------------------------------- SET */
 {id:"set", name:"Overhead set", kind:"Skill", level:"Foundation", skill:"set",
  sum:"Delivers a clean, repeatable ball to the place and height where the hitter contacts at full reach.",
  why:"The second contact decides whether the hitter faces one blocker or two. Elite setters look identical on every set, so location and tempo come from the legs and the release, not from a visible change in posture.",
  phases:[
   {name:"Get there", points:[
    "Sprint to the target first, then read the pass. Arrive early enough to be stopped under the ball.",
    "Right foot slightly ahead and nearest the net, hips and shoulders square to the left antenna.",
    "Knees bent, back tall, weight balanced so you can go forward or back without a tell."]},
   {name:"Shape", points:[
    "Hands up early above the hairline, elbows out at about eye level, wrists cocked back.",
    "Thumbs and index fingers frame a window you watch the ball through. Fingers are spread and relaxed.",
    "The ball should be falling toward your forehead. If it is not, move the feet, not the hands."]},
   {name:"Contact", points:[
    "Take the ball on the pads of all ten fingers at once. Thumbs, index and middle fingers carry the load.",
    "Let the wrists give a little, then spring back. It is one quick motion, never a catch.",
    "Both hands leave the ball together so it flies without spin."]},
   {name:"Extend", points:[
    "Drive from the legs through the hips, elbows and wrists in one line toward the target.",
    "Finish with arms long, hands open toward the target and held for a beat.",
    "Distance comes from the legs. Height comes from the angle of the release."]},
   {name:"Follow", points:[
    "Step after your set and cover your hitter low, eyes on the blockers' hands.",
    "Note where the ball landed against where you aimed and adjust the next one."]}],
  cues:["Feet to the ball","Hands high and early","Forehead window","Legs and arms together","Hold the finish"],
  errors:[
   {error:"Taking the ball at the chin or chest", why:"Elbows drop, the release slows and referees see a carry.", fix:"Wall sets with the hands starting above the forehead. If the ball drops lower, let it go and reset."},
   {error:"One hand ahead of the other", why:"The ball spins sideways and may be called a double contact.", fix:"Set to yourself lying on your back, then seated, watching for a ball with no rotation."},
   {error:"Setting with arms only", why:"Sets to the pins fall short and inside, pulling the hitter under the ball.", fix:"Start each rep in a half squat and release as the legs finish straightening."},
   {error:"Arriving late and setting on the move", why:"Shoulders are not square, so the set drifts with your momentum.", fix:"Beat the pass: run, stop on right foot then left-right, and only then lift the hands."},
   {error:"Leaning or arching early for a chosen set", why:"Blockers read the direction before the ball leaves your hands.", fix:"Film from the blocker's side and keep the same neutral posture until the release."}],
  target:"8 of 10 outside sets drop inside a 1.5 m square, 0.5 to 1 m off the net, with no visible spin.",
  faults:["low_set_contact","no_leg_drive_set"],
  scene:{cam:[-9,5.5,6.5], look:[-1,2,-1],
   players:[
    {x:-1,z:1.2,pose:"set",face:1.5708,me:true,label:"You",note:"Square to the left antenna, ball above the forehead, legs and arms finishing together."},
    {x:-5,z:0,pose:"platform",low:true,team:true,label:"Passer",note:"A pass that peaks above the net here gives the setter every option."},
    {x:-3.4,z:-3.6,pose:"ready",team:true,label:"Outside",note:"Waits until the ball leaves the setter's hands, then starts the approach."},
    {x:0.5,z:-3.2,pose:"block",opp:true,label:"Blocker",note:"Reads the setter's shoulders and hips. A neutral posture keeps this blocker guessing."}],
   paths:[
    {a:[-5,0.6,0],b:[-1,2.2,1.2],arc:2,seq:true,label:"Pass"},
    {a:[-1,2.2,1.2],b:[-0.9,3.1,-3.5],arc:2.2,seq:true,label:"Set"}],
   zones:[{x:-1,z:-3.5,w:1.6,d:1.6,label:"Hitter contact"}]}},

 /* ------------------------------------------------------------ BACK SET */
 {id:"back_set", name:"Back set", kind:"Skill", level:"Intermediate", skill:"set",
  sum:"Sends the ball behind the setter to the right-side hitter from the same posture as a front set.",
  why:"It makes the opponent's middle blocker defend both pins and frees the opposite one on one. It only works if the setter gives nothing away before release, so the disguise matters as much as the location.",
  phases:[
   {name:"Same start", points:[
    "Arrive exactly as for a front set: right foot forward, square to the left antenna, hands above the forehead.",
    "Know where the net and right antenna are before the ball arrives. You will not see your target.",
    "Take the ball in the same forehead window. Do not let it drift back over the head."]},
   {name:"Contact", points:[
    "Receive the ball on all ten finger pads with the same hand shape as a front set.",
    "As the ball enters the hands, push the hips forward toward the left pin.",
    "Wrists roll back so the thumbs finish pointing up and behind you."]},
   {name:"Extend", points:[
    "Drive the arms up along the line of your ears, not backward over the shoulders.",
    "Legs finish at the same moment as the arms. The arch is small and comes from the hips.",
    "Head stays neutral. Throwing the head back early tells the block and drops the elbows."]},
   {name:"Finish", points:[
    "Hold the hands high for a beat, then turn toward the hitter and follow to cover.",
    "Check the landing spot: the ball should drop 0.5 to 1 m off the net, inside the right antenna."]}],
  cues:["Same look as the front set","Hips forward","Hands to the ceiling","Thumbs back","Turn and cover"],
  errors:[
   {error:"Leaning or arching back before contact", why:"The middle blocker reads it and gets a full double block to the right side.", fix:"Alternate front and back sets on a coach's late call so the start position has to match."},
   {error:"Letting the ball get behind the head", why:"The set flies flat and long past the antenna or over the net.", fix:"Contact in the forehead window every time. Move the feet back if the pass is tight."},
   {error:"Pushing backward with the arms only", why:"The ball has no height and drifts tight to the net.", fix:"Think up first: extend the legs and send the hands at the ceiling, and let the hips direct the ball."},
   {error:"Losing track of the net", why:"Sets wander over the tape or 2 m inside, where the opposite cannot swing freely.", fix:"Set with the right foot on a line 1 m from the net and check the landing spot after each rep."}],
  target:"7 of 10 back sets land in a 1.5 m square at the right pin, 0.5 to 1 m off the net, from an unchanged start posture.",
  faults:["low_set_contact","no_leg_drive_set"],
  scene:{cam:[-9.5,5.5,-5], look:[-1,2,1.5],
   players:[
    {x:-1,z:1.2,pose:"set",face:1.5708,me:true,label:"You",note:"Faces the left pin exactly as for a front set and releases behind with the hips driving forward."},
    {x:-5.2,z:-0.5,pose:"platform",low:true,team:true,label:"Passer",note:"A pass to the target keeps both pins available."},
    {x:-1.2,z:3.6,pose:"swing",lift:0.6,team:true,label:"Opposite",note:"Approaches behind the setter and attacks the ball at the right antenna."},
    {x:-3.3,z:-3.5,pose:"ready",team:true,label:"Outside",note:"Approaches hard as a live option so the blockers cannot leave early."},
    {x:0.5,z:0.2,pose:"block",opp:true,label:"Middle",note:"Must wait for the release. Any early lean from the setter sends this blocker the right way."}],
   paths:[
    {a:[-5.2,0.6,-0.5],b:[-1,2.3,1.2],arc:2,seq:true,label:"Pass"},
    {a:[-1,2.3,1.2],b:[-0.9,3.1,3.5],arc:1.4,seq:true,label:"Back set"},
    {a:[-1,2.3,1.2],b:[-0.9,3.1,-3.5],arc:2.2,alt:true,label:"Front option"}],
   zones:[{x:-1,z:3.5,w:1.6,d:1.6,label:"Right pin"}]}},

 /* ------------------------------------------------------------ JUMP SET */
 {id:"jump_set", name:"Jump set", kind:"Skill", level:"Advanced", skill:"set",
  sum:"Sets the ball at the top of a jump to speed up the offence and threaten a setter attack.",
  why:"Contacting half a metre higher shortens every set's flight, so blockers get less time to move. A front-row setter in the air can also dump or attack, which holds the middle blocker in place.",
  phases:[
   {name:"Approach", points:[
    "Get to the target early and read the pass: jump set only balls that will peak above the tape near you.",
    "Final steps are left then right, with the right foot nearest the net and slightly ahead.",
    "Stop the forward momentum with the last step so the jump goes straight up, not into the net."]},
   {name:"Jump", points:[
    "Take off from two feet with a short, quick dip. Height matters less than timing.",
    "Bring the hands up through the centre of the body to the forehead as you leave the floor.",
    "Shoulders stay square to the left antenna in the air. No twist toward the pass."]},
   {name:"Contact", points:[
    "Meet the ball at the peak of the jump, above the forehead, while you are neither rising nor falling.",
    "With no legs to help, power comes from a fast elbow and wrist extension and a firm core.",
    "Use the same hand shape and release for every option, including the dump."]},
   {name:"Land", points:[
    "Land on both feet in the spot you left, knees soft, clear of the centre line and the net.",
    "Turn at once to cover the hitter you set."]}],
  cues:["Stop, then jump","Straight up","Set at the peak","Quick wrists","Land on two"],
  errors:[
   {error:"Jumping while still running forward", why:"You drift into the net or under it, and the set is pushed tight.", fix:"Brake with the last step and practise jumping and landing inside a taped 60 cm box."},
   {error:"Contacting on the way down", why:"Release is low and slow, which removes the whole advantage of jumping.", fix:"Jump later than feels natural. Toss to yourself and set only at the top."},
   {error:"Jump setting every ball", why:"Low or off-net passes become errors when a standing set was the safe play.", fix:"Rule: jump only when the pass peaks above the tape within a step of the target."},
   {error:"Weak core in the air", why:"The body folds at contact and long sets to the pin fall short.", fix:"Brace the trunk on take-off and add medicine-ball overhead throws from a jump in training."},
   {error:"Landing on one foot or twisted", why:"Loads one knee and ankle and delays the move to cover.", fix:"Finish every rep with a two-foot landing held for one second before moving."}],
  target:"8 of 10 jump sets on good passes reach the called hitter with release at or above the top of the tape and a two-foot landing.",
  faults:["low_set_contact","forward_drift","one_leg_landing"],
  scene:{cam:[-7.5,4.6,6.8], look:[-0.8,2.2,0],
   players:[
    {x:-0.6,z:1.2,pose:"set",lift:0.45,face:1.5708,me:true,label:"You",note:"In the air and square to the left pin, releasing at the peak so every option stays hidden."},
    {x:-5.5,z:-0.5,pose:"platform",low:true,team:true,label:"Passer",note:"A pass that peaks above the tape near the net makes the jump set possible."},
    {x:-1,z:0.1,pose:"swing",lift:0.6,team:true,label:"Middle",note:"Already in the air for the quick. The jump set gets the ball there before the block."},
    {x:-3.3,z:-3.6,pose:"ready",team:true,label:"Outside",note:"Leaves earlier than usual because the faster release shortens the set's flight."},
    {x:0.5,z:0.4,pose:"block",opp:true,label:"Middle",note:"Has to respect the quick and the dump at once, so is late to either pin."}],
   steps:[{x:-1.6,z:2.2,n:1},{x:-1.2,z:1.35,n:2},{x:-0.85,z:1.1,n:3}],
   paths:[
    {a:[-5.5,0.6,-0.5],b:[-0.55,2.75,1.2],arc:1.8,seq:true,label:"Pass"},
    {a:[-0.55,2.75,1.2],b:[-0.9,2.95,0.2],arc:0.25,seq:true,label:"Quick"},
    {a:[-0.55,2.75,1.2],b:[-0.9,3.1,-3.5],arc:1.3,alt:true,label:"Fast outside"},
    {a:[-0.55,2.75,1.2],b:[1.6,0,0.2],arc:0.2,alt:true,label:"Dump"}],
   zones:[{x:1.7,z:0.2,w:1.6,d:1.8,label:"Dump zone"}]}},

 /* --------------------------------------------------------------- FLOAT */
 {id:"float", name:"Standing float serve", kind:"Skill", level:"Foundation", skill:"serve",
  sum:"A spinless serve that swerves or drops late, hit from the floor with a repeatable toss and a firm hand.",
  why:"It is the lowest-error way to put a passer under pressure and to aim at a seam or a weak receiver. Without spin the ball's path is unstable, so even a medium-pace float is awkward to read.",
  phases:[
   {name:"Setup", points:[
    "Stand with the left foot forward, pointing at the target, weight on the back foot, hips half open.",
    "Hold the ball in the left hand at shoulder height, in front of the hitting shoulder.",
    "Draw the right elbow back high with the hand open near the ear before the toss.",
    "Left-handers: right foot forward, ball in the right hand, in front of the left shoulder."]},
   {name:"Toss", points:[
    "Lift the ball with a straight arm about half a metre above its starting point. No spin, no wrist flick.",
    "Place it in front of the hitting shoulder so that, left alone, it would land just ahead of your front foot.",
    "The toss is the serve. If it is off, catch it and start again."]},
   {name:"Step and swing", points:[
    "Take a short step onto the front foot as the ball peaks and shift the weight forward.",
    "Hips then shoulders rotate to the target and the elbow leads the hand through, staying above the shoulder.",
    "Keep the swing compact and quick. A long wind-up makes contact inconsistent."]},
   {name:"Contact", points:[
    "Strike the centre of the ball with the heel and palm of a stiff, flat hand, arm almost straight.",
    "Contact slightly in front of the body at full comfortable reach, wrist locked.",
    "Stop the hand right after contact, like a punch or a high five. Follow-through adds spin."]},
   {name:"Enter", points:[
    "Let the weight carry you into the court and go straight to your defensive base.",
    "Watch the ball's flight and the passer's reaction to judge the next serve."]}],
  cues:["Low toss, same spot","Elbow high","Firm hand, centre of ball","Pop and stop","Step into court"],
  errors:[
   {error:"Toss too high, too far back or drifting", why:"You adjust the swing to chase it, so contact point and direction change every time.", fix:"Toss-and-drop drill: 10 tosses must land on a mark just ahead of the front foot before you serve."},
   {error:"Wrist snap or long follow-through", why:"Puts spin on the ball, which then flies straight and is easy to pass.", fix:"Freeze the hand at contact height. Listen for a short, hard 'pop' rather than a slap."},
   {error:"Dropping the elbow", why:"Contact gets low and the ball goes into the net or loops softly.", fix:"Start with the elbow already above the shoulder and serve from there with no backswing."},
   {error:"Soft or cupped hand", why:"Contact is not clean, so the ball spins slightly and loses pace.", fix:"Spread the fingers and tense the hand. Serve at a wall from 4 m, aiming for zero rotation."},
   {error:"Contacting off centre", why:"A hit below centre sails long, above centre goes into the net, and to the side adds sidespin.", fix:"Mark the ball's valve as the centre and hit with it facing you until contact is consistent."}],
  target:"8 of 10 serves in play with no spin, and 5 of 10 inside the 3 m by 3 m zone you named.",
  faults:["toss_off","low_elbow","bent_arm_contact","no_trunk_rotation"],
  scene:{cam:[-14,5.5,6.5], look:[0,1.5,0],
   players:[
    {x:-9.5,z:2,pose:"swing",me:true,label:"You",note:"Left foot forward behind the end line, low toss in front of the hitting shoulder, hand stops at contact."},
    {x:6,z:-2.8,pose:"platform",low:true,opp:true,label:"Passer",note:"A deep-corner serve makes this passer move back and across at once."},
    {x:6.4,z:0,pose:"platform",low:true,opp:true,label:"Passer",note:"The seams either side of this passer are the best float-serve targets."},
    {x:6,z:2.8,pose:"platform",low:true,opp:true,label:"Passer",note:"Starts deep, so a short serve in front forces a long run forward."},
    {x:1,z:-1.2,pose:"ready",opp:true,label:"Setter",note:"A serve that pulls the passer off balance drags this setter away from the net."}],
   paths:[
    {a:[-9.2,2.5,2],b:[7.5,0,-3],arc:1.9,seq:true,label:"Deep corner"},
    {a:[-9.2,2.5,2],b:[7.5,0,3],arc:1.9,alt:true,label:"Line"},
    {a:[-9.2,2.5,2],b:[3,0,0.2],arc:3,alt:true,label:"Short"}],
   zones:[{x:7.5,z:-3,w:3,d:3,label:"Deep corner"},{x:7.5,z:3,w:3,d:3,label:"Deep line"},{x:3,z:0.2,w:2.4,d:3,label:"Short"}]}},

 /* ---------------------------------------------------------- JUMP FLOAT */
 {id:"jump_float", name:"Jump float serve", kind:"Skill", level:"Intermediate", skill:"serve",
  sum:"A float serve struck in the air from a short approach, giving a higher, flatter and faster spinless ball.",
  why:"A higher contact point lets the ball cross low over the tape and reach the passer sooner while keeping the float's late movement. It is the standard serve in the high-level women's game and a control option for men.",
  phases:[
   {name:"Start", points:[
    "Stand two to three steps behind the end line, facing your target, ball held in both hands or the left hand.",
    "Hitting elbow lifts early so the arm is loaded before you leave the floor.",
    "Pick the target zone before you move. The approach line points at it."]},
   {name:"Toss and approach", points:[
    "Step left and lift a low toss forward, about a metre above head height, with no spin.",
    "Follow with a quick right-left plant, feet behind the line, and jump mostly upward.",
    "The toss must stay in front of the hitting shoulder. Never chase it sideways.",
    "Left-handers: mirror the feet, stepping right, then a quick left-right plant."]},
   {name:"Contact", points:[
    "Elbow is high and back as you leave the floor. The swing is short: elbow, then a firm flat hand.",
    "Hit the centre of the ball with the palm at full reach, in front of the hitting shoulder.",
    "Lock the wrist and stop the hand at contact so no spin is added."]},
   {name:"Landing", points:[
    "Land on two feet inside the court, knees soft, balanced enough to move in any direction.",
    "Move to your base position while watching the passer's platform."]}],
  cues:["Low toss out front","Quick last two steps","High elbow early","Firm hand, pop","Land and defend"],
  errors:[
   {error:"Toss too high or behind the shoulder", why:"Timing breaks down and contact drops behind the head, sending the ball long or into the net.", fix:"Approach and catch the toss at full reach in front. Ten clean catches before adding the swing."},
   {error:"Broad jumping into the court", why:"The body is still travelling at contact, so the hand slides across the ball and adds spin.", fix:"Jump up from a short, quick plant and land within about half a metre of the take-off point."},
   {error:"Big arm swing as for a spike", why:"Wrist snap and follow-through create topspin, and the float is lost.", fix:"Start with the elbow already up. Think 'block the ball forward' with a stiff hand."},
   {error:"Slow, even approach steps", why:"No lift from the floor and a low contact, so the serve loops and is easy to read.", fix:"Count the rhythm aloud: slow step, then quick-quick on the plant."},
   {error:"Stepping on the line at take-off", why:"Foot fault and a lost point.", fix:"Measure the approach from the line backward and mark your start spot in every gym."}],
  target:"8 of 10 jump floats in play with no spin, 5 of 10 in the called zone, crossing within a ball's width of the tape.",
  faults:["toss_off","slow_last_steps","low_elbow","forward_drift"],
  scene:{cam:[-15.5,4.8,6.5], look:[-4,1.6,0.5],
   players:[
    {x:-9.6,z:1,pose:"swing",lift:0.35,me:true,label:"You",note:"Takes off behind the line from a quick plant and meets a low toss with a stiff, flat hand."},
    {x:6.2,z:-2.8,pose:"platform",low:true,opp:true,label:"Passer",note:"Deep-corner target. A flat ball arriving at the shoulders is the hardest for this passer to judge."},
    {x:6.4,z:0.2,pose:"platform",low:true,opp:true,label:"Passer",note:"The seam between two passers creates hesitation over who takes the ball."},
    {x:6,z:2.8,pose:"platform",low:true,opp:true,label:"Passer",note:"A short serve in front of this passer pulls a front-row hitter out of the approach."}],
   steps:[{x:-11.7,z:0.8,n:1},{x:-10.7,z:1.2,n:2},{x:-10.2,z:0.8,n:3}],
   paths:[
    {a:[-11.4,1.3,1],b:[-9.3,2.9,1],arc:1,seq:true,label:"Toss"},
    {a:[-9.3,2.9,1],b:[7.6,0,-2.8],arc:1.5,seq:true,label:"Deep float"},
    {a:[-9.3,2.9,1],b:[3.2,0,2.5],arc:2.6,alt:true,label:"Short"}],
   zones:[{x:7.5,z:-2.9,w:3,d:3,label:"Deep corner"},{x:3.2,z:2.5,w:2.4,d:3,label:"Short"}]}},

 /* ---------------------------------------------------------- JUMP SERVE */
 {id:"jumpserve", name:"Jump topspin serve", kind:"Skill", level:"Advanced", skill:"serve",
  sum:"A full spike approach and swing from behind the end line that sends a heavy topspin ball diving into the court.",
  why:"Speed and topspin cut the passer's reaction time and produce aces or free balls. It carries a higher error rate, so strong servers choose it when the scoring gain is worth the risk and keep a safer serve in reserve.",
  phases:[
   {name:"Toss", points:[
    "Start four approach steps behind the line. Toss with the hitting hand or both hands as you take the first step.",
    "Send the ball high and forward with forward rotation so it would land about a metre inside the court.",
    "The toss must travel along your approach line. Sideways drift ruins the swing."]},
   {name:"Approach", points:[
    "Four steps for a right-hander: right, left, then a fast, long right and a quick left plant.",
    "Accelerate through the steps. The last two land almost together with the left foot slightly ahead.",
    "Both arms swing back on the third step and drive up on the plant. Take off behind the line.",
    "Left-handers: mirror it, stepping left, right, then a fast left-right plant."]},
   {name:"Arm swing", points:[
    "Rise with both arms, then draw the hitting elbow back high while the left arm points at the ball.",
    "Hips and shoulders open on the way up and rotate into the ball. The trunk supplies most of the power.",
    "Keep the ball in front of the hitting shoulder all the way up."]},
   {name:"Contact", points:[
    "Hit at full reach, slightly in front, with an open hand contacting the back and top of the ball.",
    "Snap the wrist over the ball so the fingers roll over the top and create topspin.",
    "Aim to clear the tape by about a ball's width. Topspin brings it down inside the end line."]},
   {name:"Landing", points:[
    "Land on both feet inside the court, absorbing through ankles, knees and hips.",
    "Run to your defensive position. A jump server who watches the serve is out of the next play."]}],
  cues:["Toss on your line","Slow to fast","Reach high out front","Snap over the top","Land and go"],
  errors:[
   {error:"Toss too low, too far back or off line", why:"You jump under the ball or reach sideways, losing power and hitting long or into the net.", fix:"Toss-only reps: the ball must land in a hoop 1 m inside the line, on your approach line."},
   {error:"Flat contact with no wrist snap", why:"Without topspin a hard ball does not dip and sails past the end line.", fix:"Standing topspin serves from the attack line toward the far court, watching the ball's forward rotation."},
   {error:"Contact behind the head", why:"The ball goes up instead of forward, and the shoulder takes extra strain.", fix:"Toss further forward and take off later so the ball is in front of the hitting shoulder."},
   {error:"Taking off on or over the end line", why:"Foot fault and a lost point.", fix:"Measure your approach from the line and start from a fixed mark every time."},
   {error:"Swinging at full power on every ball", why:"Error rate climbs past what the aces pay back.", fix:"Train a 90 percent serve with heavy spin and track serves in play against aces and errors."}],
  target:"7 of 10 serves in play with clear topspin, including at least 3 that a receiver cannot pass to the setter zone.",
  faults:["toss_off","contact_behind","slow_last_steps","stiff_landing","no_arm_swing"],
  scene:{cam:[-16,4.5,6.5], look:[-4,1.5,0],
   players:[
    {x:-9.6,z:0,pose:"swing",lift:0.6,me:true,label:"You",note:"Takes off behind the line, contacts over the court at full reach and lands inside it."},
    {x:6,z:-2.6,pose:"platform",low:true,opp:true,label:"Passer",note:"Has under a second to react, so pace at the body or the seam is enough."},
    {x:6.3,z:0.6,pose:"platform",low:true,opp:true,label:"Passer",note:"Shares the deep seam with a neighbour. That gap is the main target."},
    {x:6,z:3,pose:"platform",low:true,opp:true,label:"Passer",note:"Topspin makes the ball drop sharply in front of a passer who has stood too deep."}],
   steps:[{x:-12.8,z:0.25,n:1},{x:-11.8,z:-0.2,n:2},{x:-10.7,z:0.25,n:3},{x:-10.2,z:-0.15,n:4}],
   paths:[
    {a:[-12.4,1.2,0],b:[-9.3,3.2,0],arc:2.6,seq:true,label:"Toss"},
    {a:[-9.3,3.2,0],b:[6.6,0,1.8],arc:1.5,seq:true,fast:true,label:"Topspin serve"}],
   zones:[{x:6.6,z:1.8,w:3,d:2.4,label:"Deep seam"}]}},

 /* --------------------------------------------------------------- SPIKE */
 {id:"spike", name:"Spike approach and arm swing", kind:"Skill", level:"Intermediate", skill:"attack",
  sum:"Converts a fast four-step approach into a high jump and a whip-like swing at full reach.",
  why:"It is the main point-scoring skill. At a high level the approach rhythm and a high, in-front contact decide whether you hit over or around the block, and the arm only finishes what the legs and trunk start.",
  phases:[
   {name:"Ready", points:[
    "Wait behind the attack line, outside the court on the left, weight forward and able to see passer and setter.",
    "Read the set's height and distance from the net before committing. Leave when the ball leaves the setter.",
    "Aim to take off about an arm's length behind where the ball will come down."]},
   {name:"Approach", points:[
    "Four steps for a right-hander: a small right, a longer left, then a fast, long right and a quick left.",
    "Build speed through the steps. Step three is long and low and lands on the heel to brake.",
    "Both arms reach straight back behind the hips on step three.",
    "Left-handers: mirror it, stepping left, right, then a fast left-right plant."]},
   {name:"Plant and jump", points:[
    "The last two feet land almost together, left foot slightly ahead and turned in, hips half open to the setter.",
    "Drive both arms forward and up hard as the legs extend. The arm swing lifts you.",
    "Convert forward speed to height. Land no more than half a metre in front of take-off."]},
   {name:"Arm swing", points:[
    "Both arms go up. The left stays high toward the ball while the right elbow draws back above the shoulder.",
    "Rotate hips, then shoulders, then let elbow, forearm and hand follow in order.",
    "Pull the left arm down into the body as the hitting arm comes through."]},
   {name:"Contact and landing", points:[
    "Contact at full reach, about 30 cm in front of the hitting shoulder, with an open, firm hand.",
    "Hit the top back of the ball and snap the wrist to add topspin. Hand direction decides line or cross.",
    "Land on both feet with soft knees, balanced, clear of the net and the centre line."]}],
  cues:["Slow to fast","Big third step","Arms back, arms up","Elbow high, reach","Land on two"],
  errors:[
   {error:"Leaving too early and running under the ball", why:"Contact ends up above or behind the head, so you can only hit flat or deep.", fix:"Wait until the set has peaked on high balls. Catch the ball in front at full reach to feel the right spot."},
   {error:"Slow or evenly paced last two steps", why:"Forward speed is not converted, so jump height drops by many centimetres.", fix:"Clap or call the rhythm: 'one, two, three-four'. Approach over a low line on step three."},
   {error:"No double-arm backswing", why:"The jump loses lift and timing with the legs.", fix:"Approach jumps without a ball, touching both hands to a wall mark behind the hips on step three."},
   {error:"Dropped elbow and bent-arm contact", why:"Contact is lower and slower, and the ball is pushed into the block.", fix:"Throw a tennis ball over the net from a high elbow, then hit off a held ball at full stretch."},
   {error:"Floating forward into the net", why:"Net touch, centre-line fault or a ball set tight that cannot be hit.", fix:"Start the approach further back and plant with a braking heel on the third step."}],
  target:"7 of 10 attacks off a good set land in the called zone, with take-off behind a mark 1.5 m from the net and a two-foot landing.",
  faults:["slow_last_steps","no_arm_swing","low_elbow","contact_behind","forward_drift"],
  scene:{cam:[-7.5,4.5,-10], look:[0.5,1.6,-1.5],
   players:[
    {x:-1.1,z:-3.4,pose:"swing",lift:0.7,me:true,label:"You",note:"At the top of the jump with the ball in front of the hitting shoulder and the left arm pulling down."},
    {x:-1,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter",note:"Delivers a ball that drops about a metre off the net, inside the antenna."},
    {x:-4.5,z:-1.5,pose:"ready",low:true,team:true,label:"Cover",note:"Crouches behind the hitter to play any ball that comes back off the block."},
    {x:0.5,z:-3.2,pose:"block",lift:0.4,opp:true,label:"Blocker",note:"Lines up on the hitting shoulder. Look for the hands and hit past or off them."},
    {x:6,z:1.8,pose:"platform",low:true,opp:true,label:"Digger",note:"Covers the cross-court. A sharp angle inside or a line shot beats this defender."}],
   steps:[{x:-4.4,z:-4.1,n:1},{x:-3.4,z:-3.9,n:2},{x:-2.2,z:-3.6,n:3},{x:-1.8,z:-3.9,n:4}],
   paths:[
    {a:[-1,2.2,1.2],b:[-0.9,3.15,-3.4],arc:2,seq:true,label:"Set"},
    {a:[-0.9,3.15,-3.4],b:[6,0,2.5],arc:0.3,seq:true,fast:true,label:"Cross-court"},
    {a:[-0.9,3.15,-3.4],b:[7.2,0,-3.9],arc:0.35,alt:true,fast:true,label:"Line"}],
   zones:[{x:6,z:2.5,w:2.6,d:2.6,label:"Cross"},{x:7.2,z:-3.8,w:2.6,d:1.2,label:"Line"}]}},

 /* ------------------------------------------------------------ TIP ROLL */
 {id:"tip_roll", name:"Tip (dink)", kind:"Skill", level:"Intermediate", skill:"attack",
  sum:"An off-speed attack pushed with stiff fingertips over or beside the block into open court, from a full approach, when the hard swing is not on.",
  why:"Defenders set their feet for a driven ball, so a disguised soft shot lands in front of them or behind the block. It also saves a tight or low set and keeps a well-formed block from scoring.",
  phases:[
   {name:"Approach", points:[
    "Use the same four-step approach, speed and arm lift as a full spike. The disguise is the whole skill.",
    "Check the defence during the approach: where is the block, who is deep, is the middle of the court open.",
    "Left-handers: mirror the footwork, stepping left, right, then a fast left-right plant."]},
   {name:"Disguise", points:[
    "Draw the elbow back high exactly as for a hard swing. The blockers must jump to stop a spike.",
    "Decide late, at the top of the jump, and slow only the last part of the arm.",
    "Keep the contact high and in front. A dropped shoulder gives the shot away."]},
   {name:"Tip", points:[
    "Contact with the pads of stiff, spread fingers at full reach, wrist firm. It is a short push, not a carry.",
    "Direct the ball just over or beside the block to the floor inside the attack line.",
    "The ball must not come to rest in the hand or change direction during contact."]},
   {name:"Targets", points:[
    "Short, just behind the block, when the defence is deep.",
    "To the middle of the court (zone 3 on their side) when the middle blocker has jumped with a quick.",
    "Deep corner with a longer push when a defender has crept forward. For a harder off-speed ball use the roll shot."]},
   {name:"Landing", points:[
    "Land on two feet, balanced, and be ready to block or cover: soft shots are often dug.",
    "Mix it in sparingly. One tip in four or five swings keeps the defence honest."]}],
  cues:["Look like a swing","High and in front","Stiff fingers","Over, not into, the hands","Hit the open floor"],
  errors:[
   {error:"Slowing the approach or dropping the elbow early", why:"Defenders read it, step forward and dig an easy ball into transition.", fix:"Coach calls 'swing' or 'tip' only after take-off, so every approach has to look the same."},
   {error:"Soft, floppy fingers on the tip", why:"The ball is carried or thrown and the referee calls a fault.", fix:"Fingertip push-ups against a wall and tips off a held ball with a locked wrist."},
   {error:"Tipping straight into the blocker's hands", why:"The ball is pressed back down at your feet.", fix:"Contact at full reach and send it up and over, or sideways past the outside hand."},
   {error:"Tipping to the same spot every time", why:"A defender is moved there and the shot becomes a free ball.", fix:"Train three targets: behind the block, the centre of the court and the deep corner."}],
  target:"7 of 10 tips from a full approach land in the called open zone without being playable by a defender in base.",
  faults:["forward_drift","contact_behind","slow_last_steps","low_elbow"],
  scene:{cam:[-7,5,-9.5], look:[1.5,1.4,-1.5],
   players:[
    {x:-1.1,z:-3.4,pose:"swing",lift:0.65,me:true,label:"You",note:"Full approach and high elbow, then stiff fingers push the ball over the block at the last moment."},
    {x:-1,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter",note:"A tight or low set is a good time for the off-speed shot."},
    {x:0.5,z:-3.3,pose:"block",lift:0.45,opp:true,label:"Blocker",note:"Has to jump for the hard swing, which opens the floor directly behind."},
    {x:0.5,z:-2.3,pose:"block",lift:0.45,opp:true,label:"Middle",note:"Closes the block, leaving the centre of the court to the back-row defenders."},
    {x:6.5,z:-3.2,pose:"platform",low:true,opp:true,label:"Line digger",note:"Set deep for a driven ball, so cannot reach a tip behind the block."},
    {x:6.2,z:2.2,pose:"platform",low:true,opp:true,label:"Cross digger",note:"Weight is back for the spike. A tip to the middle lands in front."}],
   steps:[{x:-4.4,z:-4.1,n:1},{x:-3.4,z:-3.9,n:2},{x:-2.2,z:-3.6,n:3},{x:-1.8,z:-3.9,n:4}],
   paths:[
    {a:[-1,2.2,1.2],b:[-0.9,3,-3.4],arc:2,seq:true,label:"Set"},
    {a:[-0.9,3,-3.4],b:[2.2,0,-1.8],arc:0.9,seq:true,label:"Tip"},
    {a:[-0.9,3,-3.4],b:[3.2,0,0.8],arc:1.1,alt:true,label:"Tip to the middle"}],
   zones:[{x:2.2,z:-1.8,w:1.8,d:2.2,label:"Behind block"},{x:3.2,z:0.8,w:2.2,d:2.2,label:"Middle"}]}},

 /* --------------------------------------------------------------- SLIDE */
 {id:"slide", name:"Slide attack", kind:"Skill", level:"Advanced", skill:"attack",
  sum:"A one-foot take-off attack run behind the setter, with the hitter travelling along the net to the right pin.",
  why:"The hitter's sideways speed lets a middle outrun the opposing middle blocker and attack a late-arriving block. It is a core play in the women's game because it stretches the block from antenna to antenna.",
  phases:[
   {name:"Start", points:[
    "Begin near the middle of the court, a step or two off the net, as if approaching for a quick in front.",
    "Watch the pass. When it reaches the setter's hands, turn and run toward the right pin.",
    "Keep the first movement believable as a quick. That holds the middle blocker."]},
   {name:"Run", points:[
    "Run behind the setter, close to parallel with the net, about a metre off it.",
    "The last three steps for a right-hander are left, right, left, getting quicker each time.",
    "Arms pump as in a run, then both swing up on the last step.",
    "Left-handers: the true slide runs toward the left pin, taking off from the right foot."]},
   {name:"Take-off", points:[
    "Plant the left foot and drive the right knee up hard, like a basketball lay-up.",
    "Jump up and along the net. The body keeps drifting toward the antenna in the air.",
    "Take off early enough to meet the set. The ball should come down in front of you."]},
   {name:"Swing", points:[
    "The lifted knee and both arms rise together. The hitting elbow draws back high as the trunk opens.",
    "Rotate the shoulders to face the court and contact at full reach in front of the hitting shoulder.",
    "Hit down the line with the body's momentum, or turn the hand over to cut the ball back cross-court."]},
   {name:"Landing", points:[
    "Bring the second foot down quickly so both feet share the landing, knees bent.",
    "Land inside the sideline and clear of the centre line, then turn back in to block."]}],
  cues:["Chase the ball","Left, right, left","Knee up","Reach and turn","Two feet down"],
  errors:[
   {error:"Running a curved path away from the net", why:"The hitter arrives late and far off the net, so the ball is hit flat or into the tape.", fix:"Run along a taped line 1 m from the net. The set should be placed on that line."},
   {error:"Leaving late and jumping after the ball has passed", why:"Contact drops behind the shoulder, which leaves only a weak line shot.", fix:"Go when the setter touches the ball and aim to be in the air as the set arrives."},
   {error:"Taking off from two feet", why:"Sideways speed is lost and the middle blocker catches up.", fix:"Lay-up footwork without a ball, then with a self-toss, driving the right knee each time."},
   {error:"No knee drive", why:"The jump is low and the body does not rotate into the ball.", fix:"Touch the lifted right knee with the left hand on take-off in warm-up reps."},
   {error:"Landing on the take-off leg alone", why:"Repeated one-leg landings with sideways drift load the knee and ankle heavily.", fix:"Finish every rep by bringing the right foot down fast and holding a two-foot landing."}],
  target:"6 of 10 slides off a back set are hit at full reach into the called zone, with take-off from the left foot and a two-foot landing.",
  faults:["one_leg_landing","forward_drift","low_elbow","contact_behind"],
  scene:{cam:[-8,5,9.5], look:[0.5,1.6,1.8],
   players:[
    {x:-1.2,z:3.4,pose:"swing",lift:0.6,me:true,label:"You",note:"Off the left foot with the right knee driving up, drifting toward the antenna to meet the back set."},
    {x:-1,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter",note:"Pushes a low, quick back set along the net so the hitter can run onto it."},
    {x:-5.5,z:-1,pose:"platform",low:true,team:true,label:"Passer",note:"The slide needs a pass close to the target so the setter can set behind."},
    {x:0.5,z:0.2,pose:"block",opp:true,label:"Middle",note:"Held by the first step toward a quick, then has to chase the hitter along the net."},
    {x:0.5,z:3.2,pose:"block",lift:0.4,opp:true,label:"Left blocker",note:"Often blocks alone. Hit past the outside hand down the line or cut back inside."}],
   steps:[{x:-2.4,z:0.5,n:1},{x:-1.9,z:1.6,n:2},{x:-1.5,z:2.7,n:3}],
   paths:[
    {a:[-5.5,0.6,-1],b:[-1,2.3,1.2],arc:2,seq:true,label:"Pass"},
    {a:[-1,2.3,1.2],b:[-0.9,2.95,3.5],arc:0.7,seq:true,label:"Back set"},
    {a:[-0.9,2.95,3.5],b:[6.6,0,3.7],arc:0.3,seq:true,fast:true,label:"Line"},
    {a:[-0.9,2.95,3.5],b:[4,0,-1.5],arc:0.5,alt:true,fast:true,label:"Cut back"}],
   zones:[{x:6.6,z:3.7,w:2.6,d:1.4,label:"Line"},{x:4,z:-1.5,w:2.2,d:2.4,label:"Cut back"}]}},

 /* ----------------------------------------------------- BACK ROW ATTACK */
 {id:"back_row_attack", name:"Back-row attack (pipe and D)", kind:"Skill", level:"Advanced", skill:"attack",
  sum:"A full swing by a back-row player who takes off behind the attack line and contacts the ball over the front zone.",
  why:"It adds a fourth attacker, so the block cannot commit to the front-row hitters. The pipe through the middle works best behind a quick attack that has already pulled the middle blocker into the air.",
  phases:[
   {name:"Ready", points:[
    "After passing or digging, get to a start 5 to 6 m from the net and call for the ball early.",
    "For the pipe, line up just to the side of the setter-middle line. For the D, line up near the right sideline.",
    "Know where the attack line is without looking down."]},
   {name:"Approach", points:[
    "Use the normal four steps but start earlier and run faster than at the net.",
    "Right-handers go right, left, then a long right and a quick left, planting fully behind the line.",
    "Both arms swing back on the third step, as in any spike approach.",
    "Left-handers: mirror it, stepping left, right, then a fast left-right plant."]},
   {name:"Take-off", points:[
    "Jump forward as well as up. A broad jump of a metre or more carries you over the front zone legally.",
    "The last foot must leave the floor behind the line. Touching the line is a fault.",
    "The set should peak 1.5 to 2.5 m off the net so you fly onto it."]},
   {name:"Contact", points:[
    "Reach high and in front, hitting the top back of the ball with strong topspin.",
    "The ball is further from the net, so aim deep: seams, corners and high off the blockers' hands.",
    "Use a fast arm and full wrist snap. The ball must clear the tape and still come down in."]},
   {name:"Landing", points:[
    "Land on two feet in the front zone with knees bent, absorbing the forward momentum.",
    "Stop short of the net, then retreat quickly to your back-row defensive position."]}],
  cues:["Call it early","Plant behind the line","Jump out, not just up","Reach and snap","Hit deep"],
  errors:[
   {error:"Stepping on or over the attack line at take-off", why:"Back-row attack fault and a lost point, however good the hit.", fix:"Mark a take-off stripe 30 cm behind the line and plant on it in every rep."},
   {error:"Jumping straight up", why:"Contact is 3 m or more from the net and the ball is hit flat into the tape or out.", fix:"Broad-jump approaches over a 1 m gap marked on the floor, landing balanced."},
   {error:"Starting late or too close", why:"The approach is short and slow, and the hitter reaches the ball behind the head.", fix:"Transition to at least 5 m off the net before the setter touches the ball."},
   {error:"Hitting sharply downward", why:"From this distance a steep ball goes into the net or the block.", fix:"Aim at the far end line's last 3 m with topspin and let the spin bring it down."},
   {error:"Stiff landing with forward lean", why:"High loads on the knees and a stumble toward the net.", fix:"Stick-the-landing reps: hold a quiet two-foot landing for one second after each swing."}],
  target:"6 of 10 pipe attacks land in the back 3 m of the opponent's court with a legal take-off behind the attack line.",
  faults:["contact_behind","shallow_dip","slow_last_steps","stiff_landing"],
  scene:{cam:[-10.5,5.5,7], look:[-1,1.8,0],
   players:[
    {x:-2.5,z:0,pose:"swing",lift:0.7,me:true,label:"You",note:"Left the floor behind the attack line and is flying forward to contact the ball over the front zone."},
    {x:-1,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter",note:"Puts the pipe about 2 m off the net, straight behind the quick hitter."},
    {x:-0.9,z:0.4,pose:"swing",lift:0.3,team:true,label:"Middle",note:"Jumps for the quick first. This decoy pulls the opposing middle blocker up early."},
    {x:-3.4,z:-3.6,pose:"ready",team:true,label:"Outside",note:"Stays a live option on the left so the outside blocker cannot help inside."},
    {x:0.5,z:0.3,pose:"block",lift:0.2,opp:true,label:"Middle",note:"Already coming down from the quick when the pipe hitter swings."},
    {x:6.5,z:-0.5,pose:"platform",low:true,opp:true,label:"Digger",note:"Deep middle defender. The seams on either side are the best pipe targets."}],
   steps:[{x:-6.5,z:0.25,n:1},{x:-5.5,z:-0.15,n:2},{x:-4.3,z:0.25,n:3},{x:-3.8,z:-0.15,n:4}],
   paths:[
    {a:[-1,2.3,1.2],b:[-2.2,3.2,0],arc:0.9,seq:true,label:"Pipe set"},
    {a:[-2.2,3.2,0],b:[7.2,0,-2.6],arc:0.5,seq:true,fast:true,label:"Deep seam"},
    {a:[-1,2.3,1.2],b:[-2.2,3.2,3.3],arc:1.2,alt:true,label:"D set"}],
   zones:[{x:-3.7,z:0,w:1.2,d:1.8,label:"Take-off"},{x:7.2,z:-2.6,w:3,d:2.6,label:"Deep seam"}]}},

 /* --------------------------------------------------------------- BLOCK */
 {id:"block", name:"Block", kind:"Skill", level:"Intermediate", skill:"block",
  sum:"Puts firm hands across the net in the hitter's path to stuff the ball or channel it to the defence.",
  why:"The block is the first line of defence and tells the back row where to stand. Good blockers follow an eye sequence and press over the net, since a well-placed hand matters more than a high reach.",
  phases:[
   {name:"Ready", points:[
    "Stand about half an arm's length from the net, feet shoulder width, knees slightly bent.",
    "Hands open at head height in front of the shoulders, elbows in, palms facing the net.",
    "Eye sequence: ball, setter, ball, hitter. Shift to the hitter once the set's direction is known."]},
   {name:"Move", points:[
    "For short distances use one or two shuffle steps, staying square to the net.",
    "Line up with your inside hand on the ball and your body on the hitter's hitting shoulder.",
    "Arrive balanced and stopped. A drifting block opens seams and lands on teammates."]},
   {name:"Jump", points:[
    "Load with a short knee bend and jump straight up. On a high outside set, go just after the hitter does.",
    "Hands travel up from the shoulders close to the net. No big backswing in a static block.",
    "The further off the net the set is, the later you jump."]},
   {name:"Press", points:[
    "Reach over the tape, not just up. Shrug the shoulders and lock the elbows.",
    "Fingers spread and stiff, thumbs up, hands less than a ball's width apart.",
    "Angle the outside hand in toward the court and watch the hitter's arm, not the ball."]},
   {name:"Landing", points:[
    "Pull the hands back on your own side and land on two feet with knees bent, hips back.",
    "Turn to find the ball as you land and step off the net to transition."]}],
  cues:["Ball, setter, ball, hitter","Front the hitting shoulder","Jump straight up","Press over, not up","Land on two"],
  errors:[
   {error:"Dropping the arms and swinging them up from the hips", why:"Hands arrive late and often clip the net on the way up.", fix:"Start with hands at head height and block along a wall or the net without touching it."},
   {error:"Reaching up but not across the net", why:"The ball drops between the hands and the tape on your own side.", fix:"Block against a ball held 20 cm over the net and push it down into the far court."},
   {error:"Drifting sideways in the air", why:"Opens a seam, risks a net touch and a collision with the next blocker.", fix:"Stop the feet before jumping and land in a taped box under your take-off spot."},
   {error:"Watching the ball instead of the hitter", why:"You jump at the wrong time and place, and are fooled by tips and angle changes.", fix:"Call out the hitter's approach angle on every rep to force the eyes onto the attacker."},
   {error:"Soft hands or fingers pointing back", why:"The ball deflects off the fingers out of bounds, which is a tool for the hitter.", fix:"Stiffen wrists and fingers before contact and turn the outside palm toward the middle of the court."}],
  target:"Touch or stuff 5 of 10 controlled attacks, with both hands across the net and a balanced two-foot landing on every jump.",
  faults:["block_arm_drop","no_penetration","forward_drift","stiff_landing","knee_valgus"],
  scene:{cam:[-5.5,3.6,5.5], look:[0,2,0],
   players:[
    {x:-0.5,z:0,pose:"block",lift:0.45,me:true,label:"You",note:"Hands pressed over the tape in front of the hitting shoulder, fingers wide and stiff."},
    {x:-0.5,z:1.1,pose:"block",lift:0.45,team:true,label:"Blocker",note:"Closes hip to hip so no seam is left between the two pairs of hands."},
    {x:-5.5,z:-2.6,pose:"platform",low:true,team:true,label:"Digger",note:"Stands in the lane the block leaves open, not behind the blockers' hands."},
    {x:1,z:0.3,pose:"swing",lift:0.7,opp:true,label:"Hitter",note:"Watch the approach angle and the hitting shoulder. They show where the ball will go."},
    {x:1,z:-1.4,pose:"set",opp:true,label:"Setter",note:"Second stop in the eye sequence: body lean and release show the set's direction."}],
   steps:[{x:-0.9,z:-1.5,n:1},{x:-0.9,z:-0.8,n:2},{x:-0.9,z:-0.1,n:3}],
   paths:[
    {a:[1,2.4,-1.4],b:[0.9,3.1,0.3],arc:0.9,seq:true,label:"Set"},
    {a:[0.9,3.1,0.3],b:[-0.2,2.75,0.15],arc:0,seq:true,fast:true,label:"Attack"},
    {a:[-0.2,2.75,0.15],b:[2.3,0,0.6],arc:0.1,seq:true,label:"Stuff"}],
   zones:[{x:2.3,z:0.6,w:2,d:2,label:"Stuff"}]}},

 /* --------------------------------------------------------- SWING BLOCK */
 {id:"swing_block", name:"Crossover and swing block", kind:"Skill", level:"Advanced", skill:"block",
  sum:"Covers several metres along the net with crossover footwork and an arm swing, arriving with a higher jump.",
  why:"Fast offences force middles to travel pin to pin, and shuffling is too slow. Running the footwork with an arm swing adds jump height and reach over the net, at the cost of needing precise timing to square up.",
  phases:[
   {name:"Read", points:[
    "Start in base: hands high, weight even, eyes on the setter until the ball is released.",
    "Do not guess. Push off the instant you see the set's direction and speed.",
    "Judge the distance: a short move is a shuffle, anything over about 2 m is step-crossover-close."]},
   {name:"Footwork", points:[
    "Moving right: open with a right step along the net, hips turning toward the run.",
    "Cross the left foot over in a long, fast stride. This step covers the distance.",
    "Plant the right foot beyond it, toes turning back to the net, so the last two steps brake and square the hips.",
    "Moving left, mirror it: left step, right crossover, left foot closes."]},
   {name:"Arm swing", points:[
    "Let the arms drop and swing back beside the hips during the crossover, elbows slightly bent.",
    "Drive them up as the feet plant, close to the body so the hands rise along the net, not into it.",
    "Shoulders turn square to the net on the way up."]},
   {name:"Seal", points:[
    "Reach across the tape as early as possible, inside hand to the ball, hands wide and firm.",
    "Close the gap to the pin blocker's hands. Jump up, not along the net.",
    "If late, reach with the nearest hand and take away the cross-court lane rather than floating."]},
   {name:"Landing", points:[
    "Land on two feet facing the net, knees bent and tracking over the toes.",
    "Keep the elbows in on the way down to avoid the net and your teammate, then open to the court."]}],
  cues:["See it, then go","Step, cross, close","Arms back, arms up","Square and seal","Up, not sideways"],
  errors:[
   {error:"Still drifting sideways at take-off", why:"You fly past the hitter, hit the pin blocker and land on one leg.", fix:"Make the last step a hard brake with the outside foot turned in. Land inside a taped box."},
   {error:"Arms swinging out wide or forward", why:"Hands hit the net on the way up or reach the tape late.", fix:"Swing the elbows back and brush the hips, then send the hands up along the plane of the net."},
   {error:"Hips still open to the sideline at contact", why:"Only one hand gets over and the ball deflects out for a tool.", fix:"Shadow reps without jumping: finish each run with chest, hips and both palms square to the net."},
   {error:"Leaving before the setter releases", why:"A good setter sends the ball the other way and the hitter gets a free swing.", fix:"Read drills with a live setter: no step is allowed until the ball has left the hands."},
   {error:"Leaving a gap to the pin blocker", why:"The hitter aims through the seam, where no defender is waiting.", fix:"The pin blocker sets the spot. The middle's outside foot lands beside the pin blocker's inside foot."}],
  target:"From base, close to the pin and get both hands over the net, square, on 7 of 10 high outside sets, with a two-foot landing.",
  faults:["no_penetration","forward_drift","one_leg_landing","knee_valgus"],
  scene:{cam:[-6.5,4.2,-3.5], look:[0,1.9,1.8],
   players:[
    {x:-0.5,z:2.4,pose:"block",lift:0.45,me:true,label:"You",note:"Started in the middle, ran step-crossover-close and squared up beside the pin blocker."},
    {x:-0.5,z:3.3,pose:"block",lift:0.45,team:true,label:"Right blocker",note:"Sets the block on the hitter's shoulder and holds still so the middle can close."},
    {x:-6,z:-1.5,pose:"platform",low:true,team:true,label:"Digger",note:"Defends the cross-court lane outside the middle blocker's inside hand."},
    {x:1,z:-1.2,pose:"set",opp:true,label:"Setter",note:"Wait for the release. Only the ball leaving the hands tells you where to run."},
    {x:1,z:3,pose:"swing",lift:0.7,opp:true,label:"Hitter",note:"Receives a high outside set, which gives the middle time for the full footwork."}],
   steps:[{x:-0.8,z:0.7,n:1},{x:-0.95,z:1.7,n:2},{x:-0.65,z:2.55,n:3}],
   paths:[
    {a:[1,2.4,-1.2],b:[0.9,3.1,3],arc:1.6,seq:true,label:"Outside set"},
    {a:[0.9,3.1,3],b:[-0.2,2.8,2.6],arc:0,seq:true,fast:true,label:"Attack"},
    {a:[-0.2,2.8,2.6],b:[2.2,0,2.2],arc:0.1,seq:true,label:"Stuff"}],
   zones:[{x:-0.8,z:0,w:1,d:1.2,label:"Base"}]}},

 /* ----------------------------------------------------------------- DIG */
 {id:"dig", name:"Dig", kind:"Skill", level:"Intermediate", skill:"dig",
  sum:"Controls a hard-driven attack so it rises high in the middle of your own court for a transition set.",
  why:"A dig that stays on your side and off the net turns the opponent's best swing into your attack. High-level defenders are in the right spot and stopped before contact, so reading the hitter matters more than reaction speed.",
  phases:[
   {name:"Base and read", points:[
    "Start in your base, then move to your defensive spot as the set goes up.",
    "Read in order: set location and tightness, hitter's approach angle, shoulder and arm, then the ball.",
    "Position yourself outside the block's shadow, where you can see the ball and the hitter's arm."]},
   {name:"Stop low", points:[
    "Be stopped as the hitter's arm comes forward. A small split step lands you balanced.",
    "Feet wide, knees ahead of the toes, chest over the knees, weight on the inside balls of the feet.",
    "Arms loose and apart in front of the knees, ready to go either way or up for a high ball."]},
   {name:"Contact", points:[
    "Get the platform behind and under the ball with the shortest possible movement.",
    "Do not swing. Give with the arms or pull the shoulders back a little to take pace off.",
    "Tilt the platform up and toward the centre of the court. For balls outside the body, drop the inside shoulder."]},
   {name:"Target", points:[
    "Aim high to the middle of the court around the attack line, never tight to the net.",
    "Height buys time: a dig that peaks 5 to 6 m lets the setter get under it and hitters get off the net."]},
   {name:"Recover", points:[
    "Follow the ball with your eyes and get back to your feet and into your attack or cover role at once.",
    "If you could not get two arms there, use one arm or a closed fist to keep the ball up."]}],
  cues:["Read the hitter","Stopped at contact","Low and forward","Cushion it","High and off the net"],
  errors:[
   {error:"Still moving when the hitter contacts", why:"You cannot change direction, and balls a metre away fall untouched.", fix:"Coach hits only when the defender is still. Train the split step on the hitter's arm swing."},
   {error:"Swinging the platform at a hard ball", why:"Adds speed, so the dig goes back over the net or into the rafters.", fix:"Dig with the arms held still and let the ball's pace do the work. Aim for a soft, high rebound."},
   {error:"Standing tall with weight on the heels", why:"The ball arrives below the platform and hits the legs or floor.", fix:"Start low enough to touch the floor with the fingertips, shoulders in front of the knees."},
   {error:"Hiding behind the block", why:"You defend a zone the ball cannot reach while the open lane is empty.", fix:"Find the gap where you can see the hitter's arm past the blockers, then set your feet there."},
   {error:"Digging tight to the net", why:"The setter is trapped at the tape or the ball goes over as a free attack for the opponent.", fix:"Target a hoop on the attack line in the centre of the court, not the setter's normal spot."}],
  target:"6 of 10 hard-driven balls are dug above net height to a 3 m zone around the centre of the attack line.",
  faults:["upright_posture","weight_back","swinging_platform","narrow_base"],
  scene:{cam:[-11,5,-4.5], look:[-3,1.2,1],
   players:[
    {x:-6,z:2.8,pose:"platform",low:true,me:true,label:"You",note:"Stopped and low in the cross-court lane, outside the block, with the platform angled to mid-court."},
    {x:-0.5,z:-3.2,pose:"block",lift:0.4,team:true,label:"Blocker",note:"Takes away the line so the defence knows the ball is coming cross-court."},
    {x:-0.5,z:-2.3,pose:"block",lift:0.4,team:true,label:"Middle",note:"Closes the block. Its inside hand marks the edge of the open lane."},
    {x:-2,z:1.8,pose:"ready",team:true,label:"Setter",note:"Releases from defence to the middle of the court to set the dug ball."},
    {x:1,z:-3.2,pose:"swing",lift:0.7,opp:true,label:"Hitter",note:"Approach angle and a dropped or open shoulder show the shot before contact."}],
   paths:[
    {a:[0.9,3.1,-3.2],b:[-6,0.5,2.8],arc:0.4,seq:true,fast:true,label:"Cross-court"},
    {a:[-6,0.5,2.8],b:[-3,2.4,0.5],arc:2.4,seq:true,label:"Dig"}],
   zones:[{x:-3,z:0.5,w:2.6,d:2.6,label:"Dig target"}]}},

 /* ------------------------------------------------------ SPRAWL PANCAKE */
 {id:"sprawl_pancake", name:"Sprawl, pancake and roll", kind:"Skill", level:"Advanced", skill:"dig",
  sum:"Emergency floor defence that reaches balls out of range of a standing dig and gets you back up safely.",
  why:"Tips, deflections off the block and balls hit away from the body land a body length from the defender. Learning to go to the floor from a low position extends your range and protects knees, hips and chin.",
  phases:[
   {name:"Low start", points:[
    "Begin from a low defensive posture. Going to the floor from standing tall is slow and hurts.",
    "Take one or two fast steps toward the ball first. The floor is the last option, not the first.",
    "Finish with a long lunge, the front knee turned out and the hips already close to the ground."]},
   {name:"Sprawl", points:[
    "Push off the lunging leg and reach both arms forward under the ball, platform angled up.",
    "Play the ball first, then let the body slide out along the floor on the thigh, stomach and chest.",
    "Turn the lead knee outward so it does not hit the floor, and keep the chin up and to one side."]},
   {name:"Pancake", points:[
    "When two arms cannot get there, slide one hand along the floor, palm down and fingers spread.",
    "Press the hand flat and firm under the spot where the ball will land so it bounces off the back of the hand.",
    "Reach with the arm on the ball's side and time the slide to arrive just before the ball."]},
   {name:"Roll", points:[
    "For balls to the side, lunge sideways, play the ball with one or two arms low to the floor.",
    "Sit onto the outside of the hip and roll across the back to the opposite shoulder.",
    "Tuck the knees and come over the shoulder back onto the feet facing the court."]},
   {name:"Recover", points:[
    "Push up with the hands and get to your feet within a second. The rally is still on.",
    "Find the ball and move to cover or to your next defensive base."]}],
  cues:["Steps first, floor last","Stay low, reach long","Play the ball, then slide","Flat hand, palm down","Up in one second"],
  errors:[
   {error:"Diving from an upright stance", why:"The body drops from height onto knees, hips or chin.", fix:"Progress from kneeling to a low lunge, then to one step plus a lunge, before adding a live ball."},
   {error:"Going to the floor before moving the feet", why:"You land short of the ball that two more steps would have reached standing.", fix:"Run-through drills: play the ball on the move and stay on your feet whenever you can."},
   {error:"Landing on the knee or elbow", why:"Bruising and joint injury, and the player starts avoiding the floor.", fix:"Turn the lead knee out and slide on the long surfaces: thigh, hip and chest, with knee pads on."},
   {error:"Pancake hand cupped, lifted or late", why:"The ball hits the floor beside the hand or skids off at a low angle.", fix:"Slide the flat hand to a marked spot as a partner drops the ball from knee height, then from a tip."},
   {error:"Staying down to watch the result", why:"The team defends the next contact with five players.", fix:"Every rep ends standing in base. Time the recovery and aim for under two seconds."}],
  target:"Keep 6 of 10 balls tipped 2 to 3 m away playable for a teammate, and be back on your feet within 2 seconds each time.",
  faults:["upright_posture","weight_back","narrow_base"],
  scene:{cam:[-9,4.5,-7.5], look:[-2.5,0.8,-1],
   players:[
    {x:-4,z:-1.3,pose:"platform",low:true,face:0.35,me:true,label:"You",note:"Two quick steps and a long, low lunge put a flat hand or platform under the ball as it lands."},
    {x:-0.5,z:-3.1,pose:"block",lift:0.4,team:true,label:"Blocker",note:"The tip clears these hands, so the ball drops in the space behind the block."},
    {x:-2.2,z:1.4,pose:"ready",team:true,label:"Setter",note:"Moves toward the ball. A floor save comes up low and close, so stay near."},
    {x:-6.5,z:2.6,pose:"ready",low:true,team:true,label:"Defender",note:"Backs up the play in case the save goes long or sideways."},
    {x:1,z:-3,pose:"swing",lift:0.6,opp:true,label:"Hitter",note:"A slowing arm and an open hand at the top of the swing mean a tip is coming."}],
   steps:[{x:-5.4,z:-0.8,n:1},{x:-4.7,z:-1.1,n:2},{x:-3.8,z:-1.4,n:3}],
   paths:[
    {a:[0.8,2.9,-3],b:[-3.2,0.05,-1.5],arc:0.8,seq:true,label:"Tip"},
    {a:[-3.2,0.05,-1.5],b:[-2.8,2.2,0.6],arc:1.5,seq:true,label:"Pancake up"}],
   zones:[{x:-3.2,z:-1.5,w:1.4,d:1.4,label:"Save"}]}},

 /* ---------------------------------------------------------- TRANSITION */
 {id:"transition", name:"Block-to-attack transition", kind:"Skill", level:"Advanced", skill:"transition",
  sum:"Gets a blocker from the net back behind the attack line in three quick steps so a full approach is still possible.",
  why:"Most rallies are won in transition, where there is under two seconds between landing a block and hitting. Hitters who get off the net fast and face the setter keep their jump and their range of shots.",
  phases:[
   {name:"Land", points:[
    "Come down from the block on two feet, knees bent, hands back on your side of the net.",
    "Find the ball as you land by turning the head toward the court. Do not watch the hitter.",
    "Decide at once: if the ball was dug, you are a hitter. Go."]},
   {name:"Turn and run", points:[
    "From the left pin, open to the inside of the court with a right-foot drop step so you can see the dig.",
    "Run, do not backpedal: three fast steps, right, left, right, angling out toward the sideline.",
    "Stay low and push hard on the first step. Arms pump as in a sprint.",
    "Left-handers: on the right pin, mirror it, opening with the left foot and running left, right, left."]},
   {name:"Brake and face", points:[
    "On the last step, brake behind the attack line and pivot to face the setter, left foot forward.",
    "Arrive with weight forward on the balls of the feet so the first approach step is the right foot.",
    "Be there before the setter contacts the ball. If not, shorten to a two- or three-step approach."]},
   {name:"Approach", points:[
    "Call for the ball and attack with your normal approach rhythm, slow to fast.",
    "With little time, keep the last two steps and the double-arm lift. They produce most of the jump.",
    "Land on two feet and get ready to block again."]}],
  cues:["Land and find the ball","Turn and run","Three steps off","Face the setter","Be early, then go"],
  errors:[
   {error:"Backpedalling off the net", why:"Too slow to reach the attack line, and the weight is on the heels when the set goes up.", fix:"Open the hips and run. Race a partner from the net to a cone at 3.5 m after a block jump."},
   {error:"Watching the ball instead of moving", why:"The hitter is still at the net when the set arrives and can only jump straight up.", fix:"Rule in drills: the feet must be past the attack line before the setter touches the ball."},
   {error:"Stopping too close to the net", why:"The approach is one step, the jump is low and the ball ends up behind the head.", fix:"Mark a start zone behind the attack line and outside the sideline, and get both feet in it."},
   {error:"Arriving square to the net, not open to the setter", why:"You lose sight of the set and the approach angle closes off the cross-court shot.", fix:"Finish the transition with the left foot forward and the chest toward the setter."},
   {error:"Landing from the block off balance or on one leg", why:"The first step is delayed and the landing knee takes the load.", fix:"Block jump, hold a two-foot landing, then transition. Remove the pause as it becomes automatic."}],
  target:"After a block jump, get both feet behind the attack line and facing the setter before setter contact on 8 of 10 reps.",
  faults:["slow_last_steps","shallow_dip","no_arm_swing","stiff_landing","one_leg_landing"],
  scene:{cam:[-9.5,6,-10], look:[-2,1.2,-1.5],
   players:[
    {x:-3.8,z:-4.2,pose:"ready",face:-0.6,me:true,label:"You",note:"Off the net in three steps, behind the attack line, left foot forward and open to the setter."},
    {x:-0.5,z:-2.4,pose:"block",team:true,label:"Middle",note:"Lands, opens to the court and backs off the net for a quick or as a decoy."},
    {x:-6,z:1.5,pose:"platform",low:true,team:true,label:"Digger",note:"Sends the dig high to mid-court. That height is what gives the hitters time."},
    {x:-1.2,z:1.2,pose:"set",face:1.5708,team:true,label:"Setter",note:"Sets the hitter who got off the net early and is calling for the ball."},
    {x:1,z:-3.2,pose:"swing",lift:0.5,opp:true,label:"Hitter",note:"The attack went past the block. Stop watching this player the moment you land."}],
   steps:[{x:-0.9,z:-3.4,n:1},{x:-1.8,z:-3.7,n:2},{x:-2.8,z:-4,n:3},{x:-3.7,z:-4.3,n:4}],
   paths:[
    {a:[0.9,3.1,-3.2],b:[-6,0.5,1.5],arc:0.4,seq:true,fast:true,label:"Attack"},
    {a:[-6,0.5,1.5],b:[-1.2,2.4,1.2],arc:2.4,seq:true,label:"Dig"},
    {a:[-1.2,2.4,1.2],b:[-0.9,3.15,-3.5],arc:2.2,seq:true,label:"Set"}],
   zones:[{x:-3.9,z:-4.2,w:1.4,d:1.4,label:"Off the net"}]}},

 /* ------------------------------------------------------------- RECEIVE */
 {id:"receive", name:"Serve receive seams", kind:"Objective", level:"Team", skill:"team",
  sum:"Three passers share the court with clear rules for the gaps between them, so every serve has one owner.",
  why:"Good servers aim at seams and at the space between a passer and the sideline, because doubt costs more points than poor technique. Agreed seam rules and early calls remove that doubt and keep the offence in system.",
  phases:[
   {name:"Formation", points:[
    "Three passers form a shallow arc 5.5 to 6.5 m from the net, each responsible for about 3 m of width.",
    "The setter and other non-passers stand clear of the passing lanes and of the passers' sight of the server.",
    "Shift the whole unit a step toward the server's tendencies: deep for a jump server, up for a short float."]},
   {name:"Before the serve", points:[
    "Agree seam ownership aloud. A common rule: the passer moving toward the target takes the seam.",
    "Short balls belong to the passer in front of them, deep balls to the passer who can stay behind them.",
    "Everyone watches the server's toss and shoulders, weight forward, ready to move on contact."]},
   {name:"Call", points:[
    "Call 'mine' before the ball crosses the net. An early call is worth more than a loud late one.",
    "The neighbour answers 'yours' or 'out', opens toward the passer and gets out of the lane.",
    "If two players call, the one with seam priority keeps it and the other pulls away at once."]},
   {name:"Pass and cover", points:[
    "The passer plays the ball to the target: just right of centre, about a metre off the net, 3 m or more high.",
    "Non-passers turn and face the passer, ready for a shank, then release to their attack routes.",
    "After the rally, reset the formation and fix any seam that caused doubt before the next serve."]}],
  cues:["Seams decided before the serve","Call early","Open to the passer","Short is front, deep is back","Same target every time"],
  errors:[
   {error:"Two passers watching a seam ball drop", why:"An ace with no touch, and trust between the passers falls.", fix:"Set a seam rule for every rotation and rehearse it with serves aimed only at seams."},
   {error:"Late or silent calls", why:"Both passers move, then both stop, and the ball is played off balance.", fix:"Score the call: a pass counts in drills only if 'mine' came before the ball crossed the net."},
   {error:"Standing too deep", why:"Short serves and tape rollers land in front, and long passes drop short of the setter.", fix:"Start with the heels around 6 m and trust the overhead pass for high, deep balls."},
   {error:"Non-passers freezing or blocking the lane", why:"The passer plays around a teammate, and no one covers a mishit.", fix:"Everyone not passing takes one step away and turns the chest to the passer on every serve."},
   {error:"The whole unit leaning toward one zone", why:"A sideline or deep corner is left open for the server.", fix:"Check spacing against floor marks before each serve, and move as a unit, not individually."}],
  target:"The unit averages 2.2 or better on a 0 to 3 passing scale over 30 serves, with no untouched ball landing in a seam.",
  faults:["narrow_base","weight_back","swinging_platform","upright_posture"],
  scene:{cam:[-13,10,0.01], look:[-2.5,0,0],
   players:[
    {x:-6.6,z:0,pose:"platform",low:true,me:true,label:"You",note:"Middle passer: owns the seam on the side where moving to the ball takes you toward the target."},
    {x:-6,z:-2.8,pose:"platform",low:true,team:true,label:"Left passer",note:"Takes the left third and the sideline, and calls 'yours' on a seam ball that is not theirs."},
    {x:-6,z:2.8,pose:"platform",low:true,team:true,label:"Right passer",note:"Takes the right third. Opens toward the middle passer when the ball goes to the seam."},
    {x:-1,z:1.2,pose:"ready",face:1.5708,team:true,label:"Setter",note:"Waits at the target, out of the passing lanes, and calls the play once the pass is up."},
    {x:-2.6,z:-3.6,pose:"ready",team:true,label:"Hitter",note:"A front-row player outside the passing lanes, ready to approach when the pass is good."},
    {x:9.6,z:1,pose:"swing",opp:true,label:"Server",note:"Aims between two passers on purpose. Read the toss and shoulders for the direction."}],
   paths:[
    {a:[9.3,2.6,1],b:[-6.2,0.6,-1.3],arc:1.7,seq:true,label:"Seam serve"},
    {a:[-6.2,0.6,-1.3],b:[-1,2.6,1.2],arc:2.3,seq:true,label:"Pass"},
    {a:[9.3,2.6,1],b:[-6.2,0.6,1.4],arc:1.7,alt:true,label:"Other seam"}],
   zones:[{x:-6.2,z:-1.4,w:3.2,d:0.9,label:"Seam"},{x:-6.2,z:1.4,w:3.2,d:0.9,label:"Seam"},{x:-1.2,z:1.2,w:2,d:2,label:"Target"}]}}
];
