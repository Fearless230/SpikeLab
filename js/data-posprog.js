/* data-posprog.js: 16-week position programs. Four 4-week phases each (foundation, strength and skill volume,
   power and speed, peak and compete). Each phase sets pillar emphasis, skill share, jump/power volume, the skills
   to drill and the drills pinned into sessions. The session builder reads the phase for the current week. */
(function(){
const P=[];
const ph=(from,to,name,focus,o)=>Object.assign({from,to,name,focus},o);
P.push({id:"pos_outside",pos:"outside",name:"Outside hitter: 16-week build",tag:"16 weeks · position program",weeks:16,
  desc:"For the player who passes and attacks every rotation. Build legs and a resilient shoulder first, then turn it into approach speed, a bigger arm and serve receive that holds up late in matches.",
  best:"Outside hitters, and any all-round player who passes and hits.",
  phases:[
    ph(1,4,"Foundation","Squat, hinge and single-leg strength, landing mechanics, shoulder stability. Approach footwork and platform angles, slow and correct.",
      {w:{landing:.7,core:.6,armcare:.7,mobility:.5,jump:.3},skill:.35,power:0,vol:0,skills:["pass","attack","serve"],drills:["approach_footwork","wall_passing","partner_toss_pass","wall_spiking","partner_down_ball"],train:["strength","stability","armcare","mobility"],week:"3 sessions: 2 strength + skill, 1 skill + mobility"}),
    ph(5,8,"Strength and volume","Heavier lower body, rotational core, more passing and hitting reps against a feed.",
      {w:{jump:.6,hitting:.6,core:.6,armcare:.5,landing:.5},skill:.4,power:1,vol:1,skills:["pass","attack","serve","block"],drills:["short_deep_passing","self_toss_hitting","hitting_lines","serve_receive_triples","progressive_distance_serving"],train:["strength","core","plyo","armcare"],week:"3 to 4 sessions: 2 heavy legs, 2 skill-led"}),
    ph(9,12,"Power and speed","Loaded and approach jumps, med-ball throws, fast arm. Hitting lines and angles off a real set.",
      {w:{jump:1,hitting:.8,landing:.45,armcare:.45},skill:.45,power:2,vol:0,skills:["attack","pass","block","transition"],drills:["line_and_angle_hitting","exchange_cross_court","block_to_approach_footwork","hitter_coverage","servers_vs_passers"],train:["power","plyo","strength","armcare"],week:"3 sessions: power first, skills second, full rest between jumps"}),
    ph(13,16,"Peak and compete","Lower volume, high quality. Game-like drills, serve under pressure, retest vertical and film your swing.",
      {w:{hitting:.6,jump:.6,armcare:.6,landing:.5,mobility:.3},skill:.55,power:1,vol:-1,skills:["attack","pass","serve","transition"],drills:["hitter_vs_double_block","continuous_transition","serving_ladder","wash_drill"],train:["power","armcare","mobility"],week:"2 to 3 sessions, fresher legs, one retest"})]});
P.push({id:"pos_opposite",pos:"opposite",name:"Opposite: 16-week build",tag:"16 weeks · position program",weeks:16,
  desc:"Right-side scoring and blocking the other team's best hitter. Strength and shoulder health first, then a heavier arm, back-row attack timing and a block that seals.",
  best:"Opposites and right-side hitters.",
  phases:[
    ph(1,4,"Foundation","Strength base, landing control, scapular and rotator cuff work. Footwork for both the right-side approach and the block.",
      {w:{landing:.7,armcare:.8,core:.6,mobility:.5},skill:.35,power:0,vol:0,skills:["attack","block","serve"],drills:["approach_footwork","wall_block_jumps","wall_spiking","toss_and_catch","partner_block_press"],train:["strength","stability","armcare","mobility"],week:"3 sessions: 2 strength + skill, 1 skill + mobility"}),
    ph(5,8,"Strength and volume","Heavier legs, rotational power, block footwork volume, serving reps for a weapon serve.",
      {w:{jump:.6,hitting:.7,core:.6,armcare:.6},skill:.4,power:1,vol:1,skills:["attack","block","serve"],drills:["blocking_footwork_ladder","self_toss_hitting","mirror_blocking","around_the_world_serving","hitting_lines"],train:["strength","core","plyo","armcare"],week:"3 to 4 sessions: 2 heavy legs, 2 skill-led"}),
    ph(9,12,"Power and speed","Approach and depth jumps, throws, back-row attack timing, hitting high and hard off a high set.",
      {w:{jump:1,hitting:1,landing:.4,armcare:.5},skill:.45,power:2,vol:0,skills:["attack","block","transition"],drills:["line_and_angle_hitting","block_vs_box_hitter","block_to_approach_footwork","hitting_lines_transition"],train:["power","plyo","strength","armcare"],week:"3 sessions: power first, skills second"}),
    ph(13,16,"Peak and compete","Sharp, lower volume. Score against a double block, serve to zones, retest and film.",
      {w:{hitting:.7,jump:.6,armcare:.6,landing:.5},skill:.55,power:1,vol:-1,skills:["attack","block","serve"],drills:["hitter_vs_double_block","jump_float_target_series","continuous_transition","two_on_six"],train:["power","armcare","mobility"],week:"2 to 3 sessions, one retest"})]});
P.push({id:"pos_middle",pos:"middle",name:"Middle blocker: 16-week build",tag:"16 weeks · position program",weeks:16,
  desc:"Jumping the most of anyone on the court. Tendons and landings first, then fast lateral movement, quick attack timing and closing the block.",
  best:"Middle blockers and anyone who blocks a lot.",
  phases:[
    ph(1,4,"Foundation","Calf, tendon and landing work, hip strength, ankle stability. Block footwork patterns at walking speed.",
      {w:{landing:.9,core:.6,mobility:.5,jump:.3,defense:.3},skill:.35,power:0,vol:0,skills:["block","attack","transition"],drills:["wall_block_jumps","blocking_footwork_ladder","stick_the_landing","approach_footwork","partner_block_press"],train:["strength","stability","plyo","mobility"],week:"3 sessions: 2 strength + skill, 1 landing and mobility"}),
    ph(5,8,"Strength and volume","Heavy squats and hinges, lateral bounds, block reps against a hitter, quick-set timing.",
      {w:{jump:.8,landing:.6,core:.5,defense:.4},skill:.4,power:1,vol:1,skills:["block","attack","transition"],drills:["mirror_blocking","block_vs_box_hitter","block_to_approach_footwork","self_toss_hitting"],train:["strength","plyo","core","stability"],week:"3 to 4 sessions: 2 heavy legs, 2 skill-led"}),
    ph(9,12,"Power and speed","Reactive and repeat jumps, lateral power, close the double block, transition off the net into the quick.",
      {w:{jump:1,defense:.5,landing:.5,core:.4},skill:.45,power:2,vol:0,skills:["block","transition","attack"],drills:["middle_close_double_block","hitting_lines_transition","free_ball_transition","exchange_cross_court"],train:["power","plyo","strength"],week:"3 sessions: power first, cap total jumps"}),
    ph(13,16,"Peak and compete","Fewer jumps, every one fast. Game-like blocking, serve, retest your vertical.",
      {w:{jump:.7,landing:.6,armcare:.4,mobility:.4},skill:.55,power:1,vol:-1,skills:["block","transition","serve"],drills:["setter_choice_vs_block","continuous_transition","serving_ladder","virus"],train:["power","stability","mobility"],week:"2 to 3 sessions, fresh legs"})]});
P.push({id:"pos_setter",pos:"setter",name:"Setter: 16-week build",tag:"16 weeks · position program",weeks:16,
  desc:"Hands, feet and decisions. Build wrist, finger and shoulder strength and a stable base, then get to the ball early, jump set and choose the right hitter.",
  best:"Setters and players learning to set.",
  phases:[
    ph(1,4,"Foundation","Grip, wrist and shoulder strength, core, ankle stability. Hand shape and wall setting every session.",
      {w:{armcare:.7,core:.7,mobility:.5,landing:.4,defense:.3},skill:.45,power:0,vol:0,skills:["set","dig","serve"],drills:["wall_setting","self_set_squat","partner_setting_distance","toss_and_catch","pepper"],train:["strength","core","armcare","mobility"],week:"3 sessions: hands every day, 2 strength"}),
    ph(5,8,"Strength and volume","Footwork to target, setting volume to front and back, digging the second ball.",
      {w:{core:.6,defense:.6,jump:.4,armcare:.5},skill:.5,power:1,vol:1,skills:["set","dig","block"],drills:["setter_front_back_targets","wall_jump_setting","dig_lines_to_target","partner_block_press"],train:["strength","core","plyo","armcare"],week:"3 to 4 sessions: 2 strength, setting in all"}),
    ph(9,12,"Power and speed","Jump set timing, out-of-system sets, quick movement after the first contact.",
      {w:{jump:.6,defense:.7,core:.5,armcare:.4},skill:.55,power:1,vol:0,skills:["set","transition","dig"],drills:["out_of_system_setting","dig_set_hit","two_hit_pepper","free_ball_transition"],train:["power","plyo","core"],week:"3 sessions: movement quality first"}),
    ph(13,16,"Peak and compete","Decision-making against a block, tempo with your hitters, serve consistency.",
      {w:{defense:.6,armcare:.5,core:.5,mobility:.4},skill:.6,power:0,vol:-1,skills:["set","serve","team"],drills:["setter_choice_vs_block","continuous_transition","serving_ladder","queen_of_the_court"],train:["armcare","core","mobility"],week:"2 to 3 sessions, high-quality reps"})]});
P.push({id:"pos_libero",pos:"libero",name:"Libero: 16-week build",tag:"16 weeks · position program",weeks:16,
  desc:"The back row belongs to you. Low, fast and durable: hip and ankle strength, then reading the hitter, platform control, sprawls and running the defence.",
  best:"Liberos and defensive specialists.",
  phases:[
    ph(1,4,"Foundation","Hip, groin and ankle strength, core, mobility for a low base. Platform angles and wall digs.",
      {w:{defense:.7,core:.7,mobility:.7,landing:.4},skill:.45,power:0,vol:0,skills:["pass","dig","serve"],drills:["wall_passing","self_pass_shuffle","partner_toss_pass","wall_reaction_digs","pepper"],train:["strength","stability","mobility","core"],week:"3 sessions: 2 strength + skill, 1 mobility + ball control"}),
    ph(5,8,"Strength and volume","Lateral strength, conditioning, serve receive volume, digging hard-driven balls.",
      {w:{defense:1,core:.6,mobility:.5},skill:.5,power:1,vol:1,skills:["pass","dig","set"],drills:["short_deep_passing","butterfly","dig_lines_to_target","sprawl_progression"],train:["strength","stability","core","plyo"],week:"3 to 4 sessions, ball control every time"}),
    ph(9,12,"Power and speed","First-step speed, sprawl and pancake, overhead passing, setting from the back row.",
      {w:{defense:1,core:.5,jump:.3,mobility:.4},skill:.55,power:1,vol:0,skills:["dig","pass","set","transition"],drills:["over_the_net_pepper","dig_set_hit","serve_receive_triples","out_of_system_setting"],train:["power","plyo","stability"],week:"3 sessions: speed first, then reps"}),
    ph(13,16,"Peak and compete","Game reading, communication, serve receive under pressure.",
      {w:{defense:.8,mobility:.5,core:.5},skill:.6,power:0,vol:-1,skills:["pass","dig","team"],drills:["servers_vs_passers","wash_drill","hitter_coverage","bingo_bango_bongo"],train:["stability","core","mobility"],week:"2 to 3 sessions, sharp and short"})]});
P.forEach(p=>{const f=p.phases[0];p.w=f.w;p.skill=f.skill;p.power=f.power;p.skills=f.skills;p.drills=f.drills;
  p.outline=p.phases.map(x=>`Weeks ${x.from} to ${x.to}, ${x.name}: ${x.focus}`);p.position=true;});
window.VB_POSPROG=P;
})();
