/* Reference knowledge for the volleyball training app: extra muscle detail, programme logic and session guides.
   Plain data only. General education, not a diagnosis; persistent pain should be assessed by a clinician. */
window.VB_MUSCLE_MORE = {
  ant_delt: {
    origin: "Front of the outer third of the collarbone.",
    insertion: "Deltoid tuberosity, a rough patch halfway down the outside of the upper arm bone.",
    phases: [
      { skill: "Block", role: "Raises the arms fast and presses them forward over the net during the penetration phase." },
      { skill: "Spike", role: "Lifts the hitting arm in the upward arm swing and helps drive it forward through acceleration." },
      { skill: "Set", role: "Holds the hands above the forehead and extends the arms on release." },
      { skill: "Jump", role: "Powers the upward arm swing that adds height to the take-off." }
    ],
    selfTest: "Stand with heels, hips and upper back on a wall and raise both arms overhead. Poor: thumbs cannot reach the wall without the ribs flaring or the low back arching, or one side aches at the front.",
    stretch: "Doorway stretch with the hand low at hip height, turn the chest away: 2 x 30 s each side.",
    injury: { name: "Front-of-shoulder impingement pain", signs: "Pinching at the front of the shoulder when reaching up or across, worse after high-volume hitting or blocking.", prevent: "Balance pressing with at least as much pulling and external rotation work; keep overhead range and thoracic extension." },
    pairs: ["pec_major", "serratus", "supraspinatus"]
  },
  mid_delt: {
    origin: "Outer edge of the acromion, the bony tip of the shoulder.",
    insertion: "Deltoid tuberosity on the outside of the upper arm bone.",
    phases: [
      { skill: "Block", role: "Keeps the arms high and wide during the reach and hang phase of the block." },
      { skill: "Spike", role: "Holds the elbow at or above shoulder height through cocking so the arm can whip from a strong position." },
      { skill: "Set", role: "Supports the elbows out to the side while the hands wait for the ball." }
    ],
    selfTest: "Hold both arms straight out to the side at shoulder height, thumbs up, for 45 s. Poor: one shoulder hikes to the ear, the arm drops, or it burns far sooner than the other side.",
    stretch: "Cross-body arm pull with the shoulder blade kept down: 2 x 30 s each side.",
    injury: { name: "Subacromial impingement", signs: "A painful arc when lifting the arm sideways between roughly shoulder height and overhead; ache when lying on that side.", prevent: "Strengthen the cuff and scapular upward rotators so the deltoid does not pull the ball of the joint upward unopposed." },
    pairs: ["supraspinatus", "upper_traps", "serratus"]
  },
  post_delt: {
    origin: "Spine of the shoulder blade, the ridge across its back.",
    insertion: "Deltoid tuberosity on the outside of the upper arm bone.",
    phases: [
      { skill: "Spike", role: "Draws the elbow back in the cocking phase, then brakes the arm during follow-through." },
      { skill: "Serve", role: "Helps slow the arm after contact, sharing the deceleration load with the rotator cuff." },
      { skill: "Block", role: "Pulls the arms back and down under control when landing from a press over the net." }
    ],
    selfTest: "Lie face down, arm out to the side in a T, thumb up, and lift it 15 times. Poor: you cannot lift without shrugging or rolling the trunk, or one side tires clearly earlier.",
    stretch: "Sleeper-style cross-body stretch lying on your side, gentle pressure only: 2 x 30 s each side.",
    injury: { name: "Posterior shoulder tightness and overload", signs: "Ache at the back of the shoulder after hitting; hitting arm reaches less far across the chest than the other arm.", prevent: "Regular rows, face pulls and reverse flys plus cross-body stretching to keep the back of the shoulder strong and supple." },
    pairs: ["infraspinatus", "rhomboids", "lower_traps"]
  },
  supraspinatus: {
    origin: "Hollow on top of the shoulder blade, above its spine.",
    insertion: "Top facet of the greater tubercle on the head of the upper arm bone.",
    phases: [
      { skill: "Spike", role: "Centres the ball of the joint in the socket through cocking and acceleration as the arm passes overhead." },
      { skill: "Serve", role: "Starts the arm lift and resists the arm being pulled out of the socket after contact." },
      { skill: "Block", role: "Stabilises the raised shoulder when the ball strikes the hands." }
    ],
    selfTest: "Raise both arms slowly out to the side and overhead, then lower. Poor: a painful catch in the middle of the arc, a shrug to get past it, or weakness holding the arm at 90 degrees thumb-down.",
    stretch: "Pendulum swings: lean on a table and let the arm hang and circle loosely for 60 s each direction.",
    injury: { name: "Rotator cuff tendinopathy", signs: "Dull ache on the outside of the upper arm after hitting, pain reaching overhead or behind the back, night ache.", prevent: "Progressive cuff loading in the scapular plane, controlled weekly hitting volume and good scapular upward rotation." },
    pairs: ["infraspinatus", "mid_delt", "serratus"]
  },
  infraspinatus: {
    origin: "Back surface of the shoulder blade below its spine, and its outer border for teres minor.",
    insertion: "Back facets of the greater tubercle on the head of the upper arm bone.",
    phases: [
      { skill: "Spike", role: "Rotates the arm back in cocking, then works eccentrically to brake it in the deceleration phase." },
      { skill: "Serve", role: "Decelerates the arm after contact, with the highest demand in jump and float serves hit hard." },
      { skill: "Set", role: "Keeps the ball of the shoulder centred while the hands absorb and release the ball overhead." }
    ],
    selfTest: "Elbows tucked at your sides, bent 90 degrees, rotate both forearms outward. Compare sides, and look at the back of the shoulder blade in a mirror. Poor: less range, weakness, or a visible hollow.",
    stretch: "Cross-body stretch with the shoulder blade pinned against a wall: 3 x 30 s on the hitting arm.",
    injury: { name: "Suprascapular nerve entrapment with infraspinatus wasting", signs: "Often painless: a hollow below the spine of the hitting-side shoulder blade and weak outward rotation; sometimes a deep ache.", prevent: "Year-round external rotation strength work, monitor side-to-side strength, and have any visible wasting assessed early." },
    pairs: ["supraspinatus", "post_delt", "lower_traps"]
  },
  subscapularis: {
    origin: "Front surface of the shoulder blade, facing the ribs.",
    insertion: "Lesser tubercle on the front of the head of the upper arm bone.",
    phases: [
      { skill: "Spike", role: "Is stretched in late cocking, protecting the front of the joint, then rotates the arm inward in acceleration." },
      { skill: "Serve", role: "Adds inward rotation speed to the arm just before contact." },
      { skill: "Block", role: "Stabilises the front of the shoulder when a hard-hit ball forces the arm backward." }
    ],
    selfTest: "Place the back of your hand on your low back and lift it away from the body. Poor: you cannot lift the hand off without moving the elbow or trunk, or it is painful at the front of the shoulder.",
    stretch: "Lying on your back, arm out at 90 degrees, let the forearm fall back toward the floor: 2 x 30 s, no forcing.",
    injury: { name: "Anterior shoulder instability or internal impingement", signs: "Deep pain at the back or front of the shoulder in the fully cocked position; a feeling the arm goes dead on hard swings.", prevent: "Strengthen inward and outward rotators together, keep scapular control, and avoid forcing extra layback with passive stretching." },
    pairs: ["pec_major", "lats", "infraspinatus"]
  },
  serratus: {
    origin: "Outer surfaces of the upper eight or nine ribs at the side of the chest.",
    insertion: "Front of the inner border of the shoulder blade.",
    phases: [
      { skill: "Spike", role: "Rotates the shoulder blade upward during the arm lift so the socket faces up at contact." },
      { skill: "Block", role: "Pushes the shoulder blades forward and up to gain reach and penetration over the net." },
      { skill: "Set", role: "Keeps the shoulder blades flat on the ribs so the arms extend from a stable base." },
      { skill: "Pass", role: "Reaches the shoulders forward to build and hold the platform away from the body." }
    ],
    selfTest: "Do a slow wall push-up while someone watches your back, or film it. Poor: the inner edge of a shoulder blade lifts off the ribs (winging), especially while lowering.",
    stretch: "Child's pose with a side reach, breathing into the stretched ribs: 5 slow breaths each side.",
    injury: { name: "Scapular dyskinesis", signs: "Shoulder blade winging or shrugging early when lifting the arm, clicking, hitting power fading as the session goes on.", prevent: "Push-up plus, wall slides and overhead reaches done with control; train the scapula before and alongside cuff work." },
    pairs: ["lower_traps", "upper_traps", "ant_delt"]
  },
  pec_major: {
    origin: "Inner half of the collarbone, the breastbone and the cartilage of the upper ribs.",
    insertion: "Outer lip of the groove on the front of the upper arm bone, just below the shoulder.",
    phases: [
      { skill: "Spike", role: "Stretches as the arm cocks, then pulls it forward and across the body in the acceleration phase." },
      { skill: "Serve", role: "Drives the arm forward to contact, working with the lats for arm speed." },
      { skill: "Dig", role: "Absorbs the floor contact through the arms in a dive or sprawl." }
    ],
    selfTest: "Lie on your back, hands behind the head, and let the elbows fall toward the floor. Poor: an elbow stays well off the floor or the front of the shoulder rolls forward on one side.",
    stretch: "Doorway stretch with the elbow at shoulder height, step through gently: 2 x 30 s each side.",
    injury: { name: "Rounded-shoulder posture contributing to impingement", signs: "Shoulders sit forward at rest, tight chest after hitting, pinching at the front of the shoulder when the arm is overhead.", prevent: "Pair every pressing set with a pulling set, stretch the chest after hitting, and train thoracic extension." },
    pairs: ["lats", "ant_delt", "subscapularis"]
  },
  biceps: {
    origin: "Long head from the top rim of the shoulder socket; short head from the coracoid process of the shoulder blade.",
    insertion: "Bump on the radius just below the elbow, plus a sheet of fascia into the forearm.",
    phases: [
      { skill: "Spike", role: "Bends the elbow in cocking, then brakes elbow extension and steadies the shoulder in follow-through." },
      { skill: "Serve", role: "Decelerates the forearm after contact so the elbow does not snap into full extension." },
      { skill: "Dig", role: "Holds the elbows firm when the forearms take a hard-driven ball." }
    ],
    selfTest: "Press a fingertip into the groove at the front of the shoulder, then raise the straight arm forward, palm up, against light resistance. Poor: sharp, pinpoint pain in that groove.",
    stretch: "Stand with the arm straight behind you, palm on a wall, thumb down, and turn away: 2 x 30 s each side.",
    injury: { name: "Long head of biceps tendinopathy or SLAP irritation", signs: "Pain at the front of the shoulder with hitting, clicking deep in the joint, ache when carrying with a straight arm.", prevent: "Slow eccentric curls, strong rotator cuff and scapular muscles, and no sudden spikes in hitting or serving volume." },
    pairs: ["triceps", "supraspinatus", "forearm_flex"]
  },
  triceps: {
    origin: "Long head from below the shoulder socket; other two heads from the back of the upper arm bone.",
    insertion: "Olecranon, the point of the elbow on the ulna.",
    phases: [
      { skill: "Spike", role: "Extends the elbow explosively in late acceleration to reach high contact with a straight arm." },
      { skill: "Set", role: "Extends the elbows to push the ball out on release; decides setting distance." },
      { skill: "Block", role: "Locks the elbows so the arms stay rigid when the ball hits." },
      { skill: "Dig", role: "Controls the lowering of the chest to the floor in a sprawl or dive." }
    ],
    selfTest: "Do as many strict push-ups as you can with elbows close to the ribs. Poor: elbows flare wide straight away, hips sag, or you cannot lock out the last repetitions.",
    stretch: "Overhead triceps stretch, elbow pointing up and gently pulled behind the head: 2 x 30 s each side.",
    injury: { name: "Posterior elbow overload from repeated hard extension", signs: "Ache at the point of the elbow after serving or hitting, pain when locking the elbow out forcefully.", prevent: "Build triceps strength gradually with full-range extensions and contact the ball with a tall but not violently locked elbow." },
    pairs: ["ant_delt", "lats", "biceps"]
  },
  forearm_flex: {
    origin: "Mostly the bony bump on the inside of the elbow, with deeper parts on the forearm bones.",
    insertion: "Palm side of the wrist bones and fingers.",
    phases: [
      { skill: "Spike", role: "Snaps the wrist over the ball at contact to add topspin and direct the shot." },
      { skill: "Set", role: "Finger flexors absorb the ball and then spring it out in the contact and release phase." },
      { skill: "Block", role: "Holds the fingers strong and spread so the ball does not bend them back." },
      { skill: "Serve", role: "Firm wrist for a float serve, active snap for a topspin serve at contact." }
    ],
    selfTest: "Palms together in a prayer position at chest height, lower the hands while keeping the palms touching. Poor: palms peel apart early, or pain on the inside of the elbow when gripping hard.",
    stretch: "Arm straight, palm up, pull the fingers back toward you with the other hand: 2 x 30 s each side.",
    injury: { name: "Finger sprains and medial elbow tendon pain", signs: "Swollen or stiff finger joint after a block, or an ache on the inside of the elbow with gripping and wrist snap.", prevent: "Grip and finger strength work, blocking with spread firm fingers and thumbs up, and taping a previously sprained finger." },
    pairs: ["forearm_ext", "triceps"]
  },
  forearm_ext: {
    origin: "Mostly the bony bump on the outside of the elbow.",
    insertion: "Back of the hand bones and fingers.",
    phases: [
      { skill: "Block", role: "Holds the wrists back and the fingers open and stiff as the hands press over the net." },
      { skill: "Set", role: "Cocks the wrists back to shape the hands before the ball arrives." },
      { skill: "Spike", role: "Cocks the wrist before contact so it has range to snap, then steadies it afterwards." },
      { skill: "Pass", role: "Pulls the wrists down to lock the elbows and flatten the platform." }
    ],
    selfTest: "Arm straight, palm down, make a fist and bend the wrist down using the other hand. Poor: marked tightness or pain on the outside of the elbow, or a clear difference between sides.",
    stretch: "Arm straight, palm down, bend the wrist down and gently turn it outward: 2 x 30 s each side.",
    injury: { name: "Lateral elbow tendinopathy and wrist extensor overload", signs: "Tender outer elbow, pain shaking hands or lifting a bottle with the palm down, weak grip after long sessions.", prevent: "Slow wrist extension lowering with a light weight, balanced grip training, and gradual increases in setting volume." },
    pairs: ["forearm_flex", "triceps"]
  },
  upper_traps: {
    origin: "Base of the skull and the ligament down the back of the neck.",
    insertion: "Outer third of the collarbone and the tip of the shoulder.",
    phases: [
      { skill: "Block", role: "Lifts the shoulder girdle to add reach at the top of the block." },
      { skill: "Spike", role: "Helps turn the shoulder blade upward as the arm rises to contact." },
      { skill: "Set", role: "Supports the raised arms; it should assist, not dominate, during repeated sets." }
    ],
    selfTest: "Tilt one ear toward the shoulder without lifting the other shoulder, then compare sides. Poor: a clear side difference, or shoulders that creep up toward the ears whenever you raise your arms.",
    stretch: "Sit on one hand, tilt the ear to the opposite shoulder and breathe slowly: 2 x 30 s each side.",
    injury: { name: "Neck and upper shoulder tension from an upper-trap-dominant pattern", signs: "Tight, sore band from neck to shoulder after training, headaches, shrugging at the start of every arm raise.", prevent: "Strengthen lower trapezius and serratus so the three share upward rotation; use loaded carries and shrugs for capacity." },
    pairs: ["serratus", "lower_traps", "mid_delt"]
  },
  lower_traps: {
    origin: "Spines of the upper-back vertebrae, from the base of the neck to the lowest ribs.",
    insertion: "Spine of the shoulder blade and its inner end.",
    phases: [
      { skill: "Spike", role: "Tilts the shoulder blade back in cocking and anchors it while the arm decelerates." },
      { skill: "Serve", role: "Holds the shoulder blade steady so the cuff has a stable base through contact and follow-through." },
      { skill: "Block", role: "Keeps the shoulder blades down and back so reach comes without the shoulders rolling forward." },
      { skill: "Pass", role: "Sets the shoulder blades so the platform angle stays constant on contact." }
    ],
    selfTest: "Lie face down, arms overhead in a Y, thumbs up, and lift both arms for 10 slow repetitions. Poor: arms barely leave the floor, shoulders shrug to the ears, or the low back arches to help.",
    stretch: "Thread the needle on hands and knees, reaching one arm under the body: 8 slow repetitions each side.",
    injury: { name: "Scapular dyskinesis linked to shoulder impingement", signs: "Shoulder blade tips forward or sits lower on the hitting side, with ache around the shoulder as hitting volume rises.", prevent: "Prone Y and T raises, face pulls and wall slides two or three times a week, progressed slowly and done without shrugging." },
    pairs: ["serratus", "rhomboids", "infraspinatus"]
  },
  rhomboids: {
    origin: "Spines of the lowest neck and upper four or five upper-back vertebrae.",
    insertion: "Inner border of the shoulder blade.",
    phases: [
      { skill: "Spike", role: "Pulls the shoulder blade back in the cocking phase to open the chest, then controls its forward glide." },
      { skill: "Serve", role: "Retracts the shoulder blade during the wind-up so the arm starts from a loaded position." },
      { skill: "Dig", role: "Holds the upper back firm when reaching for a ball outside the body line." }
    ],
    selfTest: "Stand against a wall and squeeze the shoulder blades together for 10 s without arching the low back. Poor: you cannot feel the muscles between the blades work, or the shoulders shrug instead.",
    stretch: "Hug yourself or hold a post, round the upper back and let the shoulder blades spread: 2 x 30 s.",
    injury: { name: "Mid-back overload and scapular fatigue", signs: "Burning ache between the shoulder blades late in sessions, shoulders rounding forward, hitting arm feeling heavy.", prevent: "Rows through full range with a pause, kept in balance with pressing volume, and thoracic mobility work." },
    pairs: ["lower_traps", "post_delt", "lats"]
  },
  lats: {
    origin: "Lower spine, back of the pelvis and lower ribs, via a broad sheet of fascia across the low back.",
    insertion: "Floor of the groove on the front of the upper arm bone.",
    phases: [
      { skill: "Spike", role: "Pulls the arm down and through in the acceleration phase; a major source of arm speed." },
      { skill: "Serve", role: "Drives the arm from the cocked position to contact in jump and topspin serves." },
      { skill: "Jump", role: "Swings the arms down and back in the countermovement to load the take-off." },
      { skill: "Block", role: "Pulls the arms down quickly to clear the net and prepare for landing." }
    ],
    selfTest: "Lie on your back, knees bent, low back flat, and take both straight arms overhead. Poor: the arms stop short of the floor or the ribs lift and the low back arches to get them there.",
    stretch: "Kneeling bench or chair lat stretch, elbows up and hips sitting back: 2 x 40 s.",
    injury: { name: "Restricted overhead reach loading the shoulder and low back", signs: "Arching the low back to reach contact height, tight feeling under the armpit, shoulder pinch at full reach.", prevent: "Keep overhead range with lat stretching after pulling work and train pull-ups through a full hang to full pull." },
    pairs: ["pec_major", "rectus_abs", "triceps"]
  },
  erectors: {
    origin: "Back of the pelvis, the sacrum and the spines of the lower vertebrae.",
    insertion: "Ribs and vertebrae higher up the spine, as far as the base of the skull.",
    phases: [
      { skill: "Pass", role: "Holds a flat, forward-leaning trunk through the ready position and platform contact." },
      { skill: "Jump", role: "Keeps the trunk stiff so leg force reaches the upper body during the drive phase." },
      { skill: "Spike", role: "Arches the back in the cocking phase to create the bow shape before the trunk snaps forward." },
      { skill: "Landing", role: "Stops the trunk folding forward as the legs absorb the landing." }
    ],
    selfTest: "Lie face down, hips on the floor or a bench edge, and hold the chest just off the ground for 60 s. Poor: shaking or dropping before 30 s, or pinching pain in the low back.",
    stretch: "Cat-camel on hands and knees, moving slowly through the whole spine: 10 repetitions.",
    injury: { name: "Low back pain, including stress reaction of the lumbar spine in young players", signs: "Ache across the low back after serving or hitting, pain when arching backward, stiffness the morning after.", prevent: "Hip hinge strength, trunk endurance, hip and thoracic mobility so the arch is not all taken from the lumbar spine." },
    pairs: ["glute_max", "rectus_abs", "tva"]
  },
  rectus_abs: {
    origin: "Pubic bone at the front of the pelvis.",
    insertion: "Lower end of the breastbone and the cartilage of ribs five to seven.",
    phases: [
      { skill: "Spike", role: "Lengthens under tension in cocking, then snaps the trunk forward in acceleration to add ball speed." },
      { skill: "Serve", role: "Flexes the trunk into contact in the jump serve; limits the back arch in the toss phase." },
      { skill: "Block", role: "Pikes the trunk slightly to press the hands over the net without touching it." },
      { skill: "Landing", role: "Braces the trunk so the landing force is taken by the legs, not the low back." }
    ],
    selfTest: "Lie on your back, low back pressed flat, and slowly lower both straight legs. Poor: the low back lifts off the floor before the legs are halfway down.",
    stretch: "Lying press-up (cobra) with hips on the floor, only as far as is comfortable: 8 slow repetitions.",
    injury: { name: "Abdominal muscle strain on the non-hitting side", signs: "Sharp or pulling pain in the abdominal wall on hard swings or serves, sore to cough, sneeze or sit up.", prevent: "Train anti-extension strength and eccentric trunk control, and build serving and hitting volume up gradually." },
    pairs: ["obliques", "lats", "hip_flexors"]
  },
  obliques: {
    origin: "Outer surfaces of the lower ribs (external) and the rim of the pelvis and low-back fascia (internal).",
    insertion: "Midline sheath of the abdomen, the pelvis and the lower ribs.",
    phases: [
      { skill: "Spike", role: "Rotates the trunk toward the ball in acceleration, passing hip rotation on to the shoulder." },
      { skill: "Serve", role: "Uncoils the trunk from the wind-up into contact." },
      { skill: "Dig", role: "Controls side-bending and rotation when reaching low and wide for a ball." },
      { skill: "Landing", role: "Stops the trunk tipping sideways in off-balance and one-leg landings." }
    ],
    selfTest: "Side plank on the elbow, body straight, each side. Poor: hips sag or rotate before 45 s, or one side lasts much less than the other.",
    stretch: "Open book: lie on your side, knees bent, rotate the top arm and chest open: 8 slow repetitions each side.",
    injury: { name: "Oblique (side) strain", signs: "Sudden or building pain at the side of the trunk or lower ribs on the non-hitting side during hard swings.", prevent: "Anti-rotation holds and controlled rotational throws, progressed in speed, with hitting volume increased in steps." },
    pairs: ["rectus_abs", "glute_max", "lats"]
  },
  tva: {
    origin: "Inside of the lower ribs, the low-back fascia and the rim of the pelvis.",
    insertion: "Midline sheath at the front of the abdomen and the pubic bone.",
    phases: [
      { skill: "Landing", role: "Tightens just before ground contact to stiffen the trunk as the legs absorb force." },
      { skill: "Jump", role: "Braces the trunk in the countermovement so force is not lost between legs and arms." },
      { skill: "Pass", role: "Keeps the pelvis and spine still while the legs and shoulders move the platform." }
    ],
    selfTest: "Lie on your back, hips and knees at 90 degrees, and slowly lower one heel to the floor. Poor: the low back arches or the belly domes outward as the leg lowers.",
    stretch: "Crocodile breathing: lie face down and breathe into the belly and low back for 10 slow breaths.",
    injury: { name: "Non-specific low back pain", signs: "Low back tiring or aching in long sessions, losing the ready posture late in sets, back arching on landings.", prevent: "Dead bug, bird dog and plank progressions, then bracing practised under load in squats, carries and landings." },
    pairs: ["obliques", "erectors", "glute_med"]
  },
  glute_max: {
    origin: "Back of the pelvis, the sacrum and the tailbone.",
    insertion: "Iliotibial band on the outer thigh and a ridge on the back of the upper thigh bone.",
    phases: [
      { skill: "Jump", role: "Extends the hips powerfully in the drive phase of take-off." },
      { skill: "Landing", role: "Absorbs force at the hip and stops the knee collapsing inward during the lowering phase." },
      { skill: "Spike", role: "Converts the horizontal approach into lift during the plant step." },
      { skill: "Dig", role: "Holds the low defensive posture and drives the first step out of it." }
    ],
    selfTest: "Single-leg glute bridge, 10 slow repetitions each side. Poor: the hamstring cramps, the pelvis drops or twists, or you feel it mainly in the low back rather than the buttock.",
    stretch: "Figure-four stretch lying on your back, pulling the knee toward the opposite shoulder: 2 x 40 s each side.",
    injury: { name: "Knee and low back overload from weak hip extension", signs: "Knees drifting forward and inward on jumps, quads doing all the work, low back tightness after jump sessions.", prevent: "Heavy hip thrusts, hinges and split squats through full range, and landing practice that sits back into the hips." },
    pairs: ["vastus_lat", "biceps_fem", "glute_med"]
  },
  glute_med: {
    origin: "Outer surface of the pelvis below its rim.",
    insertion: "Greater trochanter, the bony point on the outside of the hip.",
    phases: [
      { skill: "Landing", role: "Holds the pelvis level and the knee over the foot at ground contact, above all on one leg." },
      { skill: "Movement", role: "Pushes off and stabilises in shuffle and crossover steps along the net and in defence." },
      { skill: "Block", role: "Controls the hip during lateral block moves and the landing that follows." },
      { skill: "Jump", role: "Keeps the knees tracking over the toes in the countermovement and plant." }
    ],
    selfTest: "Stand on one leg and do 5 slow small single-leg squats facing a mirror. Poor: the opposite hip drops, the trunk leans over, or the knee caves in toward the big toe.",
    stretch: "Seated or lying cross-leg glute stretch with the trunk turned toward the raised knee: 2 x 30 s each side.",
    injury: { name: "Knee valgus collapse linked to ACL and patellofemoral injury", signs: "Knee falling inward on landings or single-leg squats, hip dropping when tired, ache around the kneecap.", prevent: "Side planks, band walks and single-leg squats, plus landing drills coached for knee-over-toe alignment." },
    pairs: ["glute_max", "adductors", "peroneals"]
  },
  hip_flexors: {
    origin: "Front of the lower spine (psoas) and the inner bowl of the pelvis (iliacus).",
    insertion: "Lesser trochanter, a small bump on the inside of the upper thigh bone.",
    phases: [
      { skill: "Movement", role: "Recovers the leg quickly in the first steps toward the ball and in the approach." },
      { skill: "Jump", role: "Pulls the hips into the countermovement quickly so the extensors are loaded fast." },
      { skill: "Spike", role: "Stretches as the hips extend and the body bows in cocking, then helps fold the trunk forward." }
    ],
    selfTest: "Lie on the edge of a bed, hug one knee to the chest and let the other leg hang (Thomas test). Poor: the hanging thigh sits above horizontal or the knee straightens out.",
    stretch: "Half-kneeling hip flexor stretch with the buttock squeezed and pelvis tucked: 2 x 40 s each side.",
    injury: { name: "Hip flexor tightness adding to low back extension pain", signs: "Pinching at the front of the hip in deep squats, low back arching when standing or hitting, tight front thigh.", prevent: "Stretch after sitting and before hitting, strengthen the flexors in a raised-knee position, and train glutes." },
    pairs: ["rectus_fem", "rectus_abs", "glute_max"]
  },
  adductors: {
    origin: "Pubic bone and the lower ring of the pelvis.",
    insertion: "Along the back and inner side of the thigh bone, down to just above the knee.",
    phases: [
      { skill: "Movement", role: "Push and pull the body sideways in shuffle steps and brake wide lateral lunges." },
      { skill: "Dig", role: "Lengthen under load in the wide low stance and pull the body back up out of a lunge." },
      { skill: "Block", role: "Close the legs and stabilise the pelvis in the push-off of lateral block moves." },
      { skill: "Landing", role: "Help control the pelvis and thigh on wide or single-leg landings." }
    ],
    selfTest: "Lie on your back, knees bent, and squeeze a ball or fist between the knees hard for 5 s. Poor: groin pain on the squeeze, or one side clearly weaker in a side-lying inner-leg raise.",
    stretch: "Kneeling adductor rock-back with one leg out to the side: 10 slow rocks each side.",
    injury: { name: "Adductor (groin) strain", signs: "Tight or sore inner thigh after lateral work, pain squeezing the knees together or on the first wide lunges.", prevent: "Copenhagen plank progressions and lateral lunges, with wide-stance defensive work increased gradually." },
    pairs: ["glute_med", "medial_hams", "glute_max"]
  },
  rectus_fem: {
    origin: "Front of the pelvis just above the hip socket.",
    insertion: "Kneecap, and through the patellar tendon to the bump at the top of the shin.",
    phases: [
      { skill: "Jump", role: "Extends the knee in the drive phase and passes hip power down to the knee." },
      { skill: "Landing", role: "Works eccentrically to brake knee bend in the absorption phase." },
      { skill: "Block", role: "Produces repeated quick knee extension from a shallow bend in block jumps." },
      { skill: "Movement", role: "Lifts the thigh in the first step and the approach." }
    ],
    selfTest: "Lie face down and pull one heel toward the buttock. Poor: the heel stays more than a hand-width away, the hip lifts off the floor, or one side is clearly tighter.",
    stretch: "Couch stretch, back foot on a wall or sofa, pelvis tucked: 2 x 45 s each side.",
    injury: { name: "Patellar tendinopathy (jumper's knee)", signs: "Pinpoint pain just below the kneecap at the start of jumping that eases when warm and returns after sessions.", prevent: "Slow heavy knee extensor loading, managed weekly jump counts, quad flexibility and landings shared with the hips." },
    pairs: ["vastus_lat", "vmo", "hip_flexors"]
  },
  vastus_lat: {
    origin: "Outer and front surfaces of the thigh bone.",
    insertion: "Kneecap, and through the patellar tendon to the bump at the top of the shin.",
    phases: [
      { skill: "Jump", role: "Produces most of the knee extension force in the drive phase of take-off." },
      { skill: "Landing", role: "Absorbs landing force by controlling knee bend eccentrically." },
      { skill: "Block", role: "Extends the knees fast from the loaded ready position, over and over." },
      { skill: "Dig", role: "Holds the deep knee bend of the defensive stance." }
    ],
    selfTest: "Wall sit with thighs parallel to the floor. Poor: less than 45 s, or pain at the front of the knee. Also compare single-leg sit-to-stand from a chair, 5 each side.",
    stretch: "Side-lying quad stretch, heel to buttock with the knee drawn slightly back: 2 x 40 s each side.",
    injury: { name: "Patellar tendinopathy (jumper's knee)", signs: "Stiff, sore tendon below the kneecap the morning after jumping; pain on stairs, squats or prolonged sitting.", prevent: "Heavy slow squats and leg press, isometric holds for sore tendons, and stepwise increases in jump volume." },
    pairs: ["glute_max", "vmo", "gastroc"]
  },
  vmo: {
    origin: "Inner surface of the thigh bone, with its lowest fibres arising near the adductor tendon.",
    insertion: "Inner border of the kneecap and, through the patellar tendon, the top of the shin.",
    phases: [
      { skill: "Landing", role: "Helps guide the kneecap and control knee bend in the absorption phase." },
      { skill: "Jump", role: "Finishes knee extension in the last part of the drive phase." },
      { skill: "Block", role: "Stabilises the knee during quick, shallow, repeated take-offs and landings." }
    ],
    selfTest: "Slow step-down from a low step, 5 each leg, watching the knee. Poor: the knee wobbles or drifts inward, the hip drops, or there is pain around or behind the kneecap.",
    stretch: "Standing quad stretch holding the ankle, knees together and hips pushed forward: 2 x 30 s each side.",
    injury: { name: "Patellofemoral pain", signs: "Dull ache around or behind the kneecap with stairs, squatting or sitting long with bent knees; grinding without pain is common.", prevent: "Step-downs and split squats with strict knee alignment, hip abductor strength, and gradual changes in training load." },
    pairs: ["vastus_lat", "glute_med", "rectus_fem"]
  },
  biceps_fem: {
    origin: "Sitting bone (long head) and the back of the thigh bone (short head).",
    insertion: "Head of the fibula on the outside of the knee.",
    phases: [
      { skill: "Jump", role: "Assists hip extension in the drive phase and passes force between hip and knee." },
      { skill: "Landing", role: "Co-contracts with the quadriceps to steady the knee at ground contact." },
      { skill: "Spike", role: "Brakes the body on the plant step of the approach." },
      { skill: "Movement", role: "Drives the hips forward when sprinting to chase a ball." }
    ],
    selfTest: "Lie on your back and raise one straight leg with the other flat. Poor: well short of about 70 degrees, a clear side difference, or cramping in a single-leg bridge held for 20 s.",
    stretch: "Lying hamstring floss: hold behind the thigh and straighten and bend the knee, 12 repetitions each side.",
    injury: { name: "Hamstring strain", signs: "Tightness or a grabbing feeling high in the back of the thigh when sprinting or reaching forward, sore to stretch.", prevent: "Nordic curls and Romanian deadlifts weekly, some fast running in training, and a full warm-up before maximal efforts." },
    pairs: ["medial_hams", "glute_max", "gastroc"]
  },
  medial_hams: {
    origin: "Sitting bone at the base of the pelvis.",
    insertion: "Upper inner shin bone, just below the knee.",
    phases: [
      { skill: "Landing", role: "Resists the shin sliding forward and the knee caving inward at ground contact, sparing the ACL." },
      { skill: "Jump", role: "Assists hip extension in the drive phase of take-off." },
      { skill: "Dig", role: "Controls the hip and knee in deep, forward-leaning defensive positions." },
      { skill: "Movement", role: "Decelerates the leg and body when stopping or changing direction." }
    ],
    selfTest: "Single-leg bridge with the heel on a chair, repetitions to fatigue each side. Poor: fewer than about 15, cramping, or a clear difference between legs.",
    stretch: "Seated straddle hamstring stretch reaching to one foot with a long spine: 2 x 30 s each side.",
    injury: { name: "ACL injury risk from poor knee control on landing", signs: "Knees collapsing inward on landing, stiff upright landings, a quad-dominant squat; often no pain beforehand.", prevent: "Hamstring strengthening, landing technique practice and a structured neuromuscular warm-up done every week." },
    pairs: ["biceps_fem", "glute_max", "adductors"]
  },
  gastroc: {
    origin: "Back of the thigh bone just above the knee, by two heads.",
    insertion: "Heel bone, through the Achilles tendon.",
    phases: [
      { skill: "Jump", role: "Delivers the final push through the ankle at the end of the drive phase." },
      { skill: "Block", role: "Powers quick, low-amplitude repeat jumps where the ankle does much of the work." },
      { skill: "Landing", role: "Lowers the heel under control as the forefoot touches down first." },
      { skill: "Movement", role: "Pushes off in the split step and first step." }
    ],
    selfTest: "Single-leg heel raises with a straight knee, full height, steady tempo. Poor: fewer than about 20, losing height early, or a clear difference between legs.",
    stretch: "Straight-knee calf stretch against a wall, heel down: 2 x 40 s each side.",
    injury: { name: "Calf strain and Achilles tendinopathy", signs: "Morning stiffness in the Achilles, tenderness mid-tendon, or a tight knot in the upper calf after jump sessions.", prevent: "Heavy slow calf raises with straight and bent knee, gradual plyometric progression, and no sudden surface or shoe change." },
    pairs: ["soleus", "vastus_lat", "foot"]
  },
  soleus: {
    origin: "Back of the upper shin bone and fibula, below the knee.",
    insertion: "Heel bone, through the Achilles tendon.",
    phases: [
      { skill: "Landing", role: "Absorbs force at the ankle and controls the shin moving forward in the lowering phase." },
      { skill: "Jump", role: "Stores and returns elastic energy through the Achilles in the countermovement and push-off." },
      { skill: "Movement", role: "Supports the bent-knee ready posture and the push in short shuffle steps." },
      { skill: "Block", role: "Provides ankle stiffness for quick rebounds off the floor in repeat block jumps." }
    ],
    selfTest: "Knee-to-wall test: foot flat, drive the knee to the wall without the heel lifting. Poor: big toe closer than about a hand-width to the wall, or a clear difference between sides.",
    stretch: "Bent-knee calf stretch against a wall, heel down and knee over the toes: 2 x 40 s each side.",
    injury: { name: "Achilles tendinopathy", signs: "Achilles stiff for the first steps in the morning, sore to pinch, warming up during play and aching afterwards.", prevent: "Bent-knee calf raises loaded heavily, ankle dorsiflexion mobility, and jump volume increased in small steps." },
    pairs: ["gastroc", "tib_ant", "foot"]
  },
  tib_ant: {
    origin: "Outer surface of the upper two-thirds of the shin bone.",
    insertion: "Inner side of the midfoot and the base of the first foot bone.",
    phases: [
      { skill: "Landing", role: "Sets the foot before contact and controls its lowering so landing is not flat or stiff." },
      { skill: "Movement", role: "Lifts the toes to clear the floor in quick shuffle and crossover steps." },
      { skill: "Jump", role: "Pulls the shin forward over the foot in the countermovement to load the calf." }
    ],
    selfTest: "Stand with your back against a wall, heels a foot-length out, and lift the toes repeatedly. Poor: fewer than about 20 repetitions, or burning in the shin very early.",
    stretch: "Kneel and sit back on the heels with the tops of the feet flat: 2 x 30 s, cushion under the ankles if needed.",
    injury: { name: "Shin pain (medial tibial stress syndrome)", signs: "Diffuse ache along the inner or front shin that starts with jumping or running and lingers after training.", prevent: "Increase jump and running volume gradually, strengthen calves and shin muscles, and avoid sudden changes to hard floors." },
    pairs: ["soleus", "peroneals", "foot"]
  },
  peroneals: {
    origin: "Outer surface of the fibula, the thin bone on the outside of the lower leg.",
    insertion: "Underside of the inner midfoot (longus) and the base of the fifth foot bone (brevis).",
    phases: [
      { skill: "Landing", role: "React to stop the foot rolling inward at ground contact, above all when landing on another foot." },
      { skill: "Movement", role: "Stabilise the outer ankle during lateral push-offs and cutting steps." },
      { skill: "Block", role: "Steady the ankle on crowded landings at the net, where most ankle sprains happen." }
    ],
    selfTest: "Stand on one leg, eyes closed, hands on hips. Poor: you cannot hold 10 s without touching down or hopping, or a previously sprained side is much worse than the other.",
    stretch: "Seated ankle inversion stretch: cross the leg and gently turn the sole upward, 2 x 30 s each side.",
    injury: { name: "Lateral ankle sprain", signs: "Ankle giving way or feeling unstable on landings, lingering swelling or stiffness after an earlier sprain.", prevent: "Balance board and single-leg landing drills, band eversion strength, net-landing technique, and bracing or taping after a sprain." },
    pairs: ["glute_med", "tib_ant", "foot"]
  },
  foot: {
    origin: "Heel bone and the bones of the midfoot.",
    insertion: "Toes and the tissue supporting the arches.",
    phases: [
      { skill: "Jump", role: "Stiffen the arch so the foot acts as a rigid lever in the final push-off." },
      { skill: "Landing", role: "Help the arch give and recoil to spread force at ground contact." },
      { skill: "Movement", role: "Grip and balance on the floor during quick direction changes." }
    ],
    selfTest: "Standing barefoot, lift only the big toe while the other four stay down, then the reverse. Poor: you cannot separate them, or the arch collapses in a single-leg stand.",
    stretch: "Roll the sole over a ball for 60 s each foot, then stretch the big toe back for 30 s.",
    injury: { name: "Plantar fascia pain", signs: "Heel or arch pain with the first steps in the morning or after sitting, sore after long jump sessions.", prevent: "Short-foot drills, calf raises with the toes extended on a towel roll, calf mobility, and shoes that still cushion." },
    pairs: ["soleus", "peroneals", "gastroc"]
  }
};

window.VB_PROGRAMS = {
  jump: {
    name: "Vertical jump",
    tagline: "Stronger legs first, then faster and more elastic take-offs.",
    summary: "Builds the leg and hip strength that sets your force ceiling, then teaches you to apply it quickly through jumps and reactive plyometrics. Strength work raises how much force you can produce; plyometrics improve how fast you produce it and how well tendons store and return energy. Each session puts the fastest work first while you are fresh, and quality of every jump matters more than quantity.",
    principles: [
      "Do jumps and plyometrics first in the session, then heavy strength, then accessory work; never plyometrics in a tired state.",
      "Every jump is a maximal effort with full recovery: rest 1-2 minutes between sets of 3-6 jumps. If height drops, stop the set.",
      "Start low on ground contacts (around 40-60 per session for beginners) and add slowly; count court jumps in the same weekly budget.",
      "Earn intensity: master landing and squat technique before depth jumps, and keep heavy strength work to 3-6 repetitions per set.",
      "Train jumping two or three times a week with at least 48 hours between hard lower-body sessions."
    ],
    phases: [
      { name: "Build", focus: "Learn the movements. Moderate loads, submaximal jumps with stuck landings, low contact count." },
      { name: "Build", focus: "Add a set to the main strength lifts and a little load. Jumps become maximal countermovement efforts." },
      { name: "Push", focus: "Heaviest strength loads and the most intense plyometrics of the block, with fewer total repetitions." },
      { name: "Deload and retest", focus: "Cut sets by about half, keep some speed work, then retest jump height fresh at the end of the week." }
    ],
    test: {
      name: "Standing vertical jump (countermovement jump with arm swing)",
      how: "Mark standing reach on a wall with a flat foot, then jump from standing with a free arm swing and mark the highest touch. Best of three, with a minute between attempts. Height is the gap between the marks.",
      good: "Progress, not a single number: a gain of a few centimetres over a 4-week block is good for a trained player; beginners often gain more. Retest at the same time of day.",
      source: ""
    },
    mistakes: [
      "Adding lots of extra jumps on top of a full week of practice instead of replacing some volume.",
      "Skipping heavy strength work and only jumping, which stalls progress once technique is learned.",
      "Testing or doing plyometrics when tired, then chasing volume instead of height."
    ]
  },
  hitting: {
    name: "Hitting power",
    tagline: "Arm speed built from the ground up: hips, trunk, then shoulder.",
    summary: "Develops the chain that produces a hard swing: hip and trunk rotation, a strong pull from the lats and chest, and fast elbow extension. Most ball speed comes from passing energy up the body, so trunk and rotational power sit beside upper-body strength. Pulling and decelerating strength is trained as much as pressing, because the arm can only be accelerated as hard as it can safely be slowed down.",
    principles: [
      "Throw light and fast: medicine ball throws of roughly 2-4 kg for 3-5 repetitions per set, full effort, with about a minute of rest.",
      "Match every pressing set with at least one pulling set, and include external rotation work in every upper-body session.",
      "Do power work before strength work, and schedule heavy upper-body lifting away from your highest-volume hitting day.",
      "Train rotation from the hips: the pelvis turns first, the trunk follows, the arm comes last.",
      "Keep overhead range: thoracic extension and lat length are trained every week, not only when stiff."
    ],
    phases: [
      { name: "Build", focus: "Technique in presses, pulls and throws. Moderate loads, slow lowering, learn hip-led rotation." },
      { name: "Build", focus: "Add load to presses and pulls, add a set of throws, introduce eccentric arm-deceleration drills." },
      { name: "Push", focus: "Heaviest pulls and presses at low repetitions; throws at maximum intent with slightly lighter balls." },
      { name: "Deload and retest", focus: "Halve the sets, keep a few fast throws, then retest throw distance and note how the shoulder feels." }
    ],
    test: {
      name: "Seated or kneeling overhead medicine ball throw",
      how: "Kneel or sit against a wall with a 2-3 kg ball, throw it forward from overhead with both hands as far as possible. Measure to where it lands; best of three. Use the same ball and position each time.",
      good: "Distance rising from block to block with the same ball, with no shoulder pain during or the day after. Compare only with your own earlier results.",
      source: ""
    },
    mistakes: [
      "Training only the muscles that speed the arm up and neglecting those that slow it down.",
      "Using medicine balls so heavy that the throw becomes slow and stops resembling a swing.",
      "Lifting heavy overhead the day before a high-volume hitting or serving session."
    ]
  },
  armcare: {
    name: "Arm care",
    tagline: "A shoulder that can tolerate a season of swings and serves.",
    summary: "Builds the capacity of the rotator cuff and the muscles that control the shoulder blade, and keeps the range a hitting shoulder tends to lose. Overhead athletes commonly develop weaker external rotation relative to internal rotation and tightness at the back of the shoulder. The programme uses low-load, high-control work done often, progressing to faster deceleration drills that mimic the follow-through.",
    principles: [
      "Little and often: 10-15 minutes, three or four times a week, works better than one long session.",
      "Cuff work is controlled and fairly light: 2-3 sets of 10-15 repetitions, stopping short of failure, with no shrugging.",
      "Train the shoulder blade first (serratus and lower trapezius), then the cuff, then faster eccentric and catching drills.",
      "Finish hitting days with gentle cross-body stretching; do not force the shoulder into extra layback.",
      "Count swings and serves. A sudden jump in weekly overhead volume is the usual trigger for shoulder pain."
    ],
    phases: [
      { name: "Build", focus: "Activation and control: slow tempo, light bands, learn to move the arm without the shoulder hiking." },
      { name: "Build", focus: "Add resistance and a set; start external rotation with the arm raised to shoulder height." },
      { name: "Push", focus: "Add eccentric emphasis and light, fast deceleration or catching drills in the hitting position." },
      { name: "Deload and retest", focus: "Drop to two short sessions of easy activation, then retest rotation strength and cross-body range." }
    ],
    test: {
      name: "Side-lying external rotation repetitions, both arms",
      how: "Lie on your side, top elbow on a rolled towel at the waist and bent 90 degrees. With a light dumbbell (1-3 kg) rotate the forearm up at a steady tempo to technical failure. Test both sides with the same weight.",
      good: "The hitting arm matches or beats the non-hitting arm, with the same range and no pain. A hitting side that is clearly weaker is a flag to prioritise this programme.",
      source: ""
    },
    mistakes: [
      "Only doing arm care once the shoulder already hurts, then stopping when the pain settles.",
      "Going too heavy on cuff exercises so the deltoid and upper trapezius take over.",
      "Stretching the front of the shoulder aggressively while ignoring the tight back of the shoulder."
    ]
  },
  landing: {
    name: "Landing and knee health",
    tagline: "Soft, quiet, aligned landings and tendons that tolerate jump load.",
    summary: "Teaches the body to absorb force through hips, knees and ankles together, and strengthens the tissues that take the load: quadriceps and patellar tendon, hamstrings, calves and the ankle stabilisers. Ankle sprains and jumper's knee are the classic volleyball injuries, and both respond to training. Technique and balance work reduce sprain and knee injury risk; heavy slow strength work builds tendon capacity.",
    principles: [
      "Land on two feet where you can, forefoot first, knees over toes, hips back, and quietly. Noise is a sign of poor absorption.",
      "Balance and single-leg control work is done every week all season, not only after an injury.",
      "Load tendons slowly and heavily: 3-4 sets of 6-8 slow repetitions or 30-45 s isometric holds, two or three times a week.",
      "Progress landings from two legs to one, from stuck to rebounding, and from planned to off-balance or after a movement.",
      "Tendon soreness that settles within 24 hours is acceptable; pain that is worse the next morning means reduce the load."
    ],
    phases: [
      { name: "Build", focus: "Landing technique from low heights, static balance, and slow strength work at moderate load." },
      { name: "Build", focus: "Add single-leg landings and balance with perturbation; add load to tendon and hamstring work." },
      { name: "Push", focus: "Lateral and off-balance landings, drop landings from higher boxes, heaviest slow strength of the block." },
      { name: "Deload and retest", focus: "Reduce landing and strength volume by half, then retest single-leg control and balance on both sides." }
    ],
    test: {
      name: "Single-leg squat and single-leg balance check",
      how: "Film 5 slow single-leg squats to a chair-height box on each leg from the front. Then stand on one leg, eyes closed, hands on hips, and time how long you hold without touching down.",
      good: "Knee stays in line with the second toe, pelvis stays level, trunk stays upright, and both sides look and time alike. Aim for a steady hold of 20 s or more with eyes closed.",
      source: ""
    },
    mistakes: [
      "Treating landing drills as a warm-up to rush through rather than skill practice.",
      "Resting completely for a sore tendon, then returning to full jumping with no reloading in between.",
      "Dropping balance work as soon as a sprained ankle stops hurting."
    ]
  },
  core: {
    name: "Core and trunk",
    tagline: "A trunk that transfers force and resists unwanted movement.",
    summary: "Trains the trunk to stay stiff when it must and to rotate powerfully when it should. In volleyball the core links the legs to the arm in a spike, protects the low back from repeated arching in serving and hitting, and steadies the body on landing. The programme progresses from resisting movement (anti-extension, anti-rotation, side bending) to producing fast rotation with throws.",
    principles: [
      "Resist before you produce: own planks, side planks and dead bugs before adding rotational throws.",
      "Quality over duration: sets of 20-40 s holds or 6-10 controlled repetitions beat multi-minute planks.",
      "Train all directions each week: anti-extension, anti-rotation, side bending and rotation power.",
      "Brace and breathe: keep the ribs down over the pelvis, especially in overhead and arched positions.",
      "Rotational power work is done fresh, at full speed, for 3-5 repetitions per side."
    ],
    phases: [
      { name: "Build", focus: "Static holds and slow control drills. Learn the ribs-down brace in every position." },
      { name: "Build", focus: "Longer levers and added load or instability; introduce slow resisted rotation." },
      { name: "Push", focus: "Hardest anti-extension variations and maximal-speed rotational throws." },
      { name: "Deload and retest", focus: "Two short maintenance sessions, then retest side plank and front plank holds on fresh days." }
    ],
    test: {
      name: "Side plank hold, both sides",
      how: "Side plank on the elbow with feet stacked and body in a straight line. Time until the hips drop or rotate. Rest a few minutes and test the other side.",
      good: "Left and right within roughly 10 percent of each other and trending up across blocks. A large side difference matters more than the absolute time.",
      source: ""
    },
    mistakes: [
      "Doing hundreds of sit-ups and no anti-rotation or side-bending work.",
      "Holding planks for minutes with a sagging back instead of making them harder and shorter.",
      "Arching the low back during overhead and throwing drills rather than moving through the hips and upper back."
    ]
  },
  defense: {
    name: "Defensive movement",
    tagline: "Stay low for longer and reach the ball in fewer, faster steps.",
    summary: "Develops the leg strength-endurance to hold a low posture, the hip strength for lateral push-off, and the reactive first step that decides whether you reach the ball. Defensive movement in volleyball is short, a few steps at most, so acceleration and deceleration over 2-5 metres matter far more than top speed. Adductors and hip abductors are trained deliberately because wide lunges and shuffles load them heavily.",
    principles: [
      "Keep speed work short: efforts of 2-6 seconds over a few metres, with 30-60 seconds of rest so each one is fast.",
      "Train to stop as well as start: every lateral drill ends with a controlled, balanced deceleration.",
      "Build the low position with strength (split squats, lateral lunges, holds) rather than only by standing low in drills.",
      "Strengthen adductors progressively; add wide-stance and lunge volume in steps, not all at once.",
      "Make drills reactive once the movement is clean: respond to a call, a point or a ball rather than a set pattern."
    ],
    phases: [
      { name: "Build", focus: "Footwork patterns at controlled speed, low-position holds, and basic hip and adductor strength." },
      { name: "Build", focus: "Full-speed planned shuffles and crossovers, more load on lateral lunges and single-leg work." },
      { name: "Push", focus: "Reactive drills with a signal or ball, the highest intensity lateral bounds, short sets." },
      { name: "Deload and retest", focus: "Fewer sets with full speed kept, then retest the agility drill fresh at the end of the week." }
    ],
    test: {
      name: "Volleyball T-style agility drill on court lines",
      how: "Start at the middle of the end line. Sprint to the attack line, shuffle to one sideline, shuffle across to the other, shuffle back to centre and backpedal to the start. Time the best of three.",
      good: "Your own time falling from block to block on the same court and layout, with the same quality of low posture. Layouts differ, so do not compare with published T-test norms.",
      source: ""
    },
    mistakes: [
      "Turning agility work into conditioning with long efforts and short rests, so nothing is fast.",
      "Practising only planned patterns and never reacting to a signal or ball.",
      "Ignoring the groin until it is strained by a sudden increase in defensive lunging."
    ]
  },
  mobility: {
    name: "Mobility",
    tagline: "The range volleyball needs: ankles, hips, upper back and shoulders.",
    summary: "Restores and keeps the range that good technique depends on. Ankle dorsiflexion allows soft landings and a deep approach, hip mobility allows a low defensive stance, and thoracic and shoulder range allow a high contact point without the low back taking the arch. Mobility gained by stretching is kept only if it is then used under control, so each drill is paired with an active or loaded movement.",
    principles: [
      "Short and frequent: 5-10 minutes most days is more effective than one long weekly session.",
      "Use dynamic drills before training; save long static holds of 30-60 s for after training or separate sessions.",
      "Follow a stretch with an active movement into the new range, such as a deep squat hold or an overhead reach.",
      "Target what is limited: test ankle, hip, thoracic and shoulder range and spend the time where you fall short.",
      "Stretch to mild tension, never pain, and never force the hitting shoulder further into layback."
    ],
    phases: [
      { name: "Build", focus: "Test all four areas, learn the drills, and settle a daily routine of a few minutes." },
      { name: "Build", focus: "Add time in end ranges and pair each stretch with an active control drill." },
      { name: "Push", focus: "Loaded mobility: deep goblet squat holds, loaded calf stretch, overhead reaches with light load." },
      { name: "Deload and retest", focus: "Keep the short daily routine, then retest the four ranges and reset priorities for the next block." }
    ],
    test: {
      name: "Knee-to-wall ankle test and wall overhead reach",
      how: "Ankle: foot flat, find the furthest distance from toe to wall at which the knee still touches with the heel down. Shoulder: back and hips on a wall, raise both arms and see whether the thumbs reach it.",
      good: "Both ankles alike and around 10 cm or more from the wall, and thumbs reaching the wall without the ribs flaring or the low back leaving it.",
      source: "Weight-bearing lunge test; about 10 cm is a common clinical reference point, not a volleyball-specific norm"
    },
    mistakes: [
      "Long static stretching straight before maximal jumping instead of a dynamic warm-up.",
      "Stretching everything equally rather than the one or two areas that are actually limited.",
      "Gaining range with stretches but never strengthening in the new range, so it is lost again."
    ]
  }
};

window.VB_GUIDE = {
  warmup: {
    name: "Session warm-up",
    minutes: 6,
    steps: [
      { name: "Raise", detail: "60-90 s of easy jogging, side shuffles, backpedal and skipping along the court until you are warm and breathing faster." },
      { name: "Activate hips and trunk", detail: "8 glute bridges, 8 side-lying or banded hip abductions per side and a 20 s side plank per side." },
      { name: "Activate shoulders", detail: "10 band pull-aparts, 10 band external rotations per arm and 8 push-up plus or wall slides, all without shrugging." },
      { name: "Mobilise", detail: "5 per side of world's greatest stretch with a thoracic rotation, 8 ankle knee-to-wall rocks per side, 8 arm circles each way." },
      { name: "Landing prep", detail: "2 x 5 small jumps sticking a soft, quiet two-foot landing with knees over toes, then 3 single-leg hop-and-hold per leg." },
      { name: "Potentiate", detail: "3 fast approach or block jumps at near-full effort, then 2 short sprints or reactive shuffles of about 5 m." },
      { name: "Arm build-up", detail: "If hitting or serving follows: 8-10 throws or swings building from about half effort to full over the set." }
    ]
  },
  cooldown: {
    name: "Cool-down",
    minutes: 4,
    steps: [
      { name: "Downshift", detail: "60 s of easy walking with slow nasal breathing, long exhales, until the heart rate settles." },
      { name: "Shoulder", detail: "Cross-body stretch 30 s per arm and a doorway or floor chest stretch 30 s per side, gentle tension only." },
      { name: "Hips and thighs", detail: "Half-kneeling hip flexor stretch and a quad stretch, 30 s each per side, pelvis tucked." },
      { name: "Calves and check-in", detail: "Bent- and straight-knee calf stretch 30 s each per side, then note any sore tendon or joint in your log." }
    ]
  },
  vertical: {
    note: "Heights are standing countermovement jumps with arm swing. Ranges are rough guides; jump-and-reach tests read higher than force plates or mats, so track your own change on one method.",
    rows: [
      { level: "Recreational adult", men: "30-45", women: "20-33" },
      { level: "Trained club player", men: "40-50", women: "30-38" },
      { level: "Competitive club or collegiate", men: "45-58", women: "35-45" },
      { level: "National league or professional", men: "50-65", women: "40-50" },
      { level: "International elite", men: "60-75", women: "45-58" }
    ],
    source: "Approximate coaching reference ranges, not formal norms. Anchored to Vaverka et al. 2016 (J Hum Kinet): elite Czech league men averaged about 52 cm with arm swing on a force plate. Women's ranges are estimates."
  },
  loadRules: [
    "Count jumps, not just hours: track rough weekly jump totals from practice, matches and gym, and change them gradually.",
    "Avoid sudden spikes. Raise weekly jump or hitting volume in small steps and be most careful after a break, illness or holiday.",
    "Alternate hard and easy days; keep at least 48 hours between heavy lower-body lifting or high-intensity plyometric sessions.",
    "On weeks with matches or tournaments, cut gym plyometrics and keep a short strength session rather than adding both.",
    "Schedule a lighter week about every fourth week, cutting volume by a third to a half while keeping some intensity.",
    "Let symptoms steer the plan: tendon or shoulder pain that is worse the next morning means less volume this week, not more."
  ],
  recovery: [
    "Sleep is the main recovery tool: aim for at least 8 hours a night and a regular bedtime, more for teenage players.",
    "Eat a meal or snack with carbohydrate and roughly 20-30 g of protein within a couple of hours after training.",
    "Arrive hydrated and drink to thirst during play; pale yellow urine through the day is a simple check.",
    "Take at least one full rest day a week and a lighter week about every fourth week.",
    "Easy movement such as walking, cycling or mobility on days off helps soreness more than doing nothing."
  ]
};
