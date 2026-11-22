/* data-rules.js: the Rules and terms tool (#tools/rules). Replaces the short rule list in data-extras.js.
   Based on the FIVB Official Volleyball Rules 2025-2028. Where USA Volleyball (2025-2027 rulebook), school or college rules
   differ in ways players meet often, the rule says so. Leagues change details: the league's own rulebook decides. */
(function(){
window.VB_RULE_CATS=[["match","Scoring and the match"],["positions","Rotation and positions"],["serve","Serving"],["contacts","Playing the ball"],["net","Net and centre line"],["attack","Attack and block"],["libero","Libero"],["subs","Substitutions and time-outs"],["conduct","Conduct and sanctions"],["court","Court and equipment"]];

window.VB_RULES=[
 /* ---- scoring and the match */
 {c:"match",t:"Rally scoring",b:"Every rally wins a point, whoever served. The team that wins the rally also serves next."},
 {c:"match",t:"Winning a set",b:"A set goes to 25 points and must be won by 2, with no cap (26-24, 31-29). The deciding set (the fifth in a best-of-five match) goes to 15, still won by 2. Many school and recreational leagues play best of three, with the third set to 15."},
 {c:"match",t:"Winning the match",b:"Best of five: the first team to win three sets. Teams change ends after every set. In the deciding set they change ends as soon as one team reaches 8 points, and the players keep the same positions."},
 {c:"match",t:"Coin toss",b:"Before the match, and again before a deciding set, a toss decides who serves first and who chooses the side."},

 /* ---- positions */
 {c:"positions",t:"Rotation",b:"When a team wins back the right to serve, its six players rotate one position clockwise. The player who moves from right front (zone 2) to right back (zone 1) serves. The serving order must always follow the line-up sheet."},
 {c:"positions",t:"Positions of the receiving team at the serve",b:"At the moment the server hits the ball, the receiving team must be in rotational order. Front to back: each front-row player must have at least part of one foot closer to the centre line than both feet of the back-row player behind them (4 ahead of 5, 3 ahead of 6, 2 ahead of 1). Side to side, within each row: the left and right players must each have part of a foot closer to their own sideline than the feet of the middle player (4 left of 3, 3 left of 2; 5 left of 6, 6 left of 1). Only the feet in contact with the floor count. Diagonal players (for example 4 and 6) have no rule between them."},
 {c:"positions",t:"Positions of the serving team (changed in 2025)",b:"Under the FIVB 2025-2028 rules, the players of the serving team, apart from the server, may stand anywhere on their own court at the serve: there is no overlap fault for the serving team. The serving order still applies. USA Volleyball's 2025-2027 rules and many school and college rule sets still require the serving team to be in rotational order, so check which rules your league uses.",tag:"new"},
 {c:"positions",t:"After the serve",b:"Once the ball is served, players of both teams may move anywhere on their own court and the free zone. This is when teams 'switch' to their specialist positions. Back-row players stay back-row players for attacking and blocking even if they stand at the net."},
 {c:"positions",t:"Positional and rotation faults",b:"A positional (overlap) fault at the serve gives the point and the serve to the other team. A rotation fault (the wrong player serves) also gives a point and serve to the opponent; the scorer corrects the order, and any points the faulty team scored since the wrong server started are cancelled."},
 {c:"positions",t:"Being tested in 2026: free movement for the receiving team",b:"In some 2026 FIVB competitions the receiving team only has to be in rotational order at the referee's whistle and may move once the serving action starts. This is a test, not a rule. Normal competitions use the rule above.",tag:"test"},

 /* ---- serving */
 {c:"serve",t:"Eight seconds",b:"The server must hit the ball within 8 seconds of the first referee's whistle."},
 {c:"serve",t:"Toss and hit",b:"The ball must be hit with one hand or any part of the arm after being tossed or released. Only one toss is allowed: a toss that falls to the floor without being hit is a service fault under FIVB rules. USA Volleyball allows one re-toss per service for players 14 and under; some school rules also allow one."},
 {c:"serve",t:"Service zone and foot faults",b:"The service zone is the full 9 m width behind the end line. At the moment of the hit the server may not touch the court (the end line included) or the floor outside the zone. Jump servers may take off from the zone and land inside the court."},
 {c:"serve",t:"Serve touching the net",b:"A serve that touches the net and goes over into the opponent's court is in play. It is a fault if it touches a player of the serving team, fails to cross through the crossing space, or lands out."},
 {c:"serve",t:"Screening",b:"The serving team may not hide the server or the flight of the ball from the receivers. Since 2025 (FIVB, and USA Volleyball 2025-2027), players of the serving team may not raise their hands above their heads during the serve, until the ball passes the net. Waving the arms, jumping or moving sideways to hide the serve is also screening.",tag:"new"},

 /* ---- contacts */
 {c:"contacts",t:"Three contacts",b:"Each team has up to three contacts to send the ball back. A block touch does not count as one of the three, so after a block touch the team still has three."},
 {c:"contacts",t:"Same player twice",b:"A player may not touch the ball twice in a row, except after a block touch or when the first team contact hits two parts of the body in one action."},
 {c:"contacts",t:"Any part of the body",b:"The ball may touch any part of the body, feet included."},
 {c:"contacts",t:"Catching and throwing",b:"The ball must be hit cleanly. It may not be caught, held or thrown; it may rebound in any direction."},
 {c:"contacts",t:"Double contacts",b:"Consecutive contacts are allowed on the first team contact if they happen in one action (for example a dig that hits both forearms one after the other). On other contacts they are a fault. Recent tests and USA Volleyball's 2025-2027 rules allow a double contact on an overhand set to a teammate in one action; check your league.",tag:"new"},
 {c:"contacts",t:"Assisted hit",b:"A player may not use a teammate or any structure to reach the ball. A teammate may hold a player back to stop them touching the net or crossing the centre line."},
 {c:"contacts",t:"Simultaneous contacts",b:"Two teammates touching the ball at the same time count as two contacts (except on a block). If two opponents touch it at the same time above the net, play continues and the team receiving the ball has three more contacts."},

 /* ---- net */
 {c:"net",t:"Touching the net",b:"Touching the net between the antennae during the action of playing the ball is a fault. The action includes the take-off, the hit or attempt, and the landing. Touching the net outside the antennae, or touching it when not playing the ball, is not a fault unless it interferes with play. A ball driven into the net that makes the net touch a player is not a fault."},
 {c:"net",t:"Centre line",b:"A foot or feet may touch the opponent's court if part of the foot stays in contact with, or directly above, the centre line. Any other part of the body may touch the opponent's court as long as it does not interfere with the opponents."},
 {c:"net",t:"Reaching over the net",b:"Blockers may reach over the net to block, as long as they do not touch the ball before or during the opponent's attack hit. Attackers may follow through over the net after hitting the ball on their own side."},
 {c:"net",t:"Antennae and crossing space",b:"The ball must cross the net inside the antennae (and their imaginary extension up to the ceiling). A ball touching an antenna is out."},
 {c:"net",t:"Playing a ball back from outside the antennae",b:"A first team contact that sends the ball into the opponent's free zone outside the antennae may be chased and played back by the same team, through the same outside space, as long as the player does not touch the opponent's court. Since 2025, a ball sent outside the antennae on the second or third contact cannot be played back and is out as soon as it crosses the plane of the net.",tag:"new"},

 /* ---- attack and block */
 {c:"attack",t:"What counts as an attack",b:"Every action that sends the ball toward the opponent, except a serve and a block, is an attack hit. It is completed when the ball fully crosses the plane of the net or is touched by an opponent."},
 {c:"attack",t:"Back-row attack",b:"A back-row player may complete an attack from any height if they take off from behind the attack (3 m) line, and may land in front of it. In front of the line, they may only attack if part of the ball is below the top of the net when they hit it."},
 {c:"attack",t:"Attacking the serve",b:"It is a fault to complete an attack on the opponent's serve while the ball is in the front zone and entirely above the top of the net."},
 {c:"attack",t:"Blocking",b:"Only front-row players may complete a block. A block touch does not count as a team contact, and any player, including the blocker, may make the next contact. Several blockers touching the ball in one action count as one block."},
 {c:"attack",t:"Blocking the serve",b:"It is a fault to block the opponent's serve. (Sitting volleyball is the exception: blocking the serve is allowed there.)"},
 {c:"attack",t:"Off-speed attacks",b:"Tips and roll shots are legal attacks indoors as long as the ball is hit cleanly and not caught or thrown. Some 2026 FIVB test events apply the catching and pushing rule strictly to attacks, allowing only a very short tip.",tag:"test"},

 /* ---- libero */
 {c:"libero",t:"Who the libero is",b:"A defensive specialist who plays only in the back row and wears a different-coloured shirt. Most rule sets allow a team to name two liberos, with one on court at a time."},
 {c:"libero",t:"Libero restrictions",b:"The libero may not block or attempt to block, and may not complete an attack from anywhere when the ball is entirely above the net. If the libero sets with the fingers from in front of the attack line, a teammate may not attack that ball above the net. The same set from behind the line is fine."},
 {c:"libero",t:"Libero replacements",b:"The libero can replace any back-row player. Replacements are unlimited and do not count as substitutions, but the libero can only be replaced by the player they replaced, there must be a completed rally between two libero replacements, and replacements happen while the ball is out of play, before the whistle for the serve, through the replacement zone on the bench-side sideline between the attack line and the end line."},
 {c:"libero",t:"Can the libero serve?",b:"Under FIVB rules, no: when the player the libero replaced rotates to serve, they come back on and serve. Under USA Volleyball, NCAA and US high-school rules the libero may serve in one rotation position per set."},

 /* ---- subs and time-outs */
 {c:"subs",t:"Substitutions",b:"FIVB: six substitutions per team per set. A starting player may leave and come back once per set, only to their own position in the line-up, and only in place of the substitute who replaced them. USA Volleyball's 2025-2027 rules allow 15 per set. Some 2026 FIVB test events allow eight."},
 {c:"subs",t:"Time-outs",b:"Two time-outs per team per set, 30 seconds each, under FIVB and USA Volleyball rules. School and recreational leagues may differ."},
 {c:"subs",t:"Injury",b:"An injured player who cannot continue is replaced by a legal substitution. If none is possible, an exceptional substitution by any player not on court is allowed."},
 {c:"subs",t:"Video challenge",b:"In top competitions, teams may challenge some referee decisions by video. Rules on what can be challenged and when are set per competition and are being tested and changed in 2025 and 2026.",tag:"test"},

 /* ---- conduct */
 {c:"conduct",t:"Sanctions for misconduct",b:"Minor misconduct gets a verbal or hand warning. Then: yellow card, a warning that goes on the scoresheet; red card, a penalty (point and serve to the opponent); red and yellow together in one hand, expulsion for the rest of the set; red and yellow apart, disqualification for the rest of the match."},
 {c:"conduct",t:"Delays",b:"The first delay by a team in a match (for example a late substitution request) earns a delay warning. Every later delay in the same match is a delay penalty: a point and serve to the opponent."},
 {c:"conduct",t:"Talking to referees",b:"Only the game captain may ask the referees about the application or interpretation of the rules, while the ball is out of play."},

 /* ---- court and equipment */
 {c:"court",t:"Court size",b:"18 m long and 9 m wide, divided by the centre line under the net. The attack line is 3 m from the centre line on each side. All lines are 5 cm wide and part of the area they enclose, so a ball touching a line is in."},
 {c:"court",t:"Net height",b:"2.43 m for men and 2.24 m for women, measured at the centre of the court. Youth heights vary by age group and federation (often 2.24 m or lower for girls and 2.35 m or lower for boys). The net is 1 m deep, and the antennae stand 80 cm above it."},
 {c:"court",t:"Free zone and ceiling",b:"At least 3 m of free space around the court (FIVB world events use 5 m at the sides and 6.5 m at the ends). At least 7 m of clear height above the court (12.5 m at FIVB world events). A ball that touches the ceiling or anything above the court is out under the normal rules."},
 {c:"court",t:"Ball",b:"Leather or synthetic leather, 65 to 67 cm around, 260 to 280 g, inflated to 0.30 to 0.325 kg/cm²."}
];

window.VB_RULE_CHANGES=[
 ["Serving team can stand anywhere","FIVB 2025-2028: no overlap fault for the serving team; the receiving team must still be in rotational order. Not adopted by USA Volleyball 2025-2027."],
 ["Hands down at the serve","FIVB 2025-2028 and USA Volleyball 2025-2027: serving-team players may not raise their hands above their heads until the ball passes the net."],
 ["Balls outside the antennae","FIVB 2025-2028: only a first team contact sent outside the antennae can be played back; a second or third contact sent outside is out when it crosses the net plane."],
 ["Double contact on the set","Tested by FIVB from 2025 and adopted by USA Volleyball 2025-2027: no double-contact fault on an overhand pass to a teammate in one action."],
 ["More substitutions","USA Volleyball 2025-2027: 15 substitutions per set (up from 12). FIVB 2026 test events: 8 (up from 6)."],
 ["2026 FIVB tests","Receiving team may move once the serve starts; strict catching rule on attacks; play continues after a ball touches the ceiling and stays on the same side; mid-rally challenge bookmarks. Tests only, in selected competitions."]];

window.VB_SIGNALS=[
 ["Authorisation to serve","Moves the hand to show the direction of the serve.","Serve now."],
 ["Team to serve","Extends the arm toward the team that will serve.","That team serves next."],
 ["Ball in","Points the arm and fingers at the floor on the side where it landed.","The ball landed in."],
 ["Ball out","Raises the forearms vertically, hands open, palms toward the body.","The ball landed out."],
 ["Ball touched","Brushes the fingers of one raised hand with the palm of the other.","The ball touched a player before going out."],
 ["Catch","Slowly lifts the forearm, palm facing up.","Ball caught, held or thrown."],
 ["Double contact","Raises two fingers spread apart.","One player touched the ball twice."],
 ["Four hits","Raises four fingers spread apart.","More than three team contacts."],
 ["Net touched","Points to the side of the net (or touches it) with the hand.","Net fault by a player of that team."],
 ["Reaching beyond the net","Holds a hand over the net, palm down.","Contact with the ball in the opponent's space."],
 ["Attack-hit fault","Makes a downward motion with the forearm, hand open.","Illegal back-row or libero attack, or attacking the serve."],
 ["Blocking fault or screening","Raises both arms vertically, palms forward.","Illegal block or screening at the serve."],
 ["Positional or rotation fault","Makes a circular motion with the forefinger.","Overlap or wrong server."],
 ["Crossing the centre line / foot fault","Points at the centre line or the relevant line.","Penetration into the opponent's court, or a server's foot fault."],
 ["Delay in service","Raises eight fingers spread apart.","More than 8 seconds to serve."],
 ["Double fault and replay","Raises both thumbs.","Faults by both teams at once: the rally is replayed."],
 ["Time-out","Puts the palm of one hand over the fingers of the other, held vertically (a T), then shows the team.","Time-out for that team."],
 ["Substitution","Rolls the forearms around each other.","Substitution for that team."],
 ["Change of courts","Raises the forearms in front of and behind the body and twists them around the body.","Teams change ends."],
 ["End of set or match","Crosses the forearms in front of the chest, hands open.","The set or match is over."],
 ["Cards","Yellow card: warning. Red: penalty point. Both in one hand: expulsion. Both apart: disqualification.","Misconduct sanctions."]];

window.VB_MYTHS=[
 ["You can't play the ball with your feet.",false,"Any part of the body may touch the ball, feet included."],
 ["A serve that clips the net is a fault.",false,"A serve that touches the net and goes over is in play."],
 ["The block counts as one of the three hits.",false,"Not indoors: after a block touch the team still has three contacts. On the beach, the block does count."],
 ["Touching the net anywhere is a fault.",false,"Only contact between the antennae during the action of playing the ball, or contact that interferes with play, is a fault."],
 ["Your foot can never cross the centre line.",false,"It may, as long as part of the foot stays on or above the line and you do not interfere."],
 ["A back-row player can't jump in front of the 3 m line.",false,"They can. They just cannot complete an attack on a ball that is entirely above the net from in front of the line."],
 ["The libero isn't allowed to set.",false,"The libero can set. If they set with the fingers from in front of the attack line, a teammate may not attack that ball above the net."],
 ["A ball on the line is out.",false,"The lines are part of the court: any touch of the line is in."],
 ["A ball that hits the antenna is in if it was inside the court.",false,"A ball touching the antenna is always out."],
 ["The serving team must always be in rotation order.",null,"It depends on the rules: FIVB 2025-2028 says no (only the receiving team), USA Volleyball and many school rules say yes."],
 ["You can't block or attack a serve.",true,"True: blocking the serve, or attacking it when it is in the front zone and entirely above the net, is a fault indoors."],
 ["Two players can't touch the ball at the same time.",false,"They can. It counts as two contacts for the team (one if it happens on a block)."]];

window.VB_RULE_QUIZ=[
 {q:"A serve clips the top of the net and drops into the other court.",o:["Fault, replay the serve","In play"],a:1,why:"A serve may touch the net as long as it crosses into the opponent's court through the crossing space."},
 {q:"Your blocker touches the spike, then your team plays it three more times and sends it over.",o:["Legal","Four-hit fault"],a:0,why:"A block touch is not a team contact, so the team still has three."},
 {q:"A back-row player takes off in front of the 3 m line and tips a ball that is entirely above the net into the other court.",o:["Legal tip","Back-row attack fault"],a:1,why:"Back-row players attacking from in front of the attack line may only play a ball that is at least partly below the top of the net."},
 {q:"The same back-row player, same place, but the ball is partly below the top of the net at contact.",o:["Legal","Back-row attack fault"],a:0,why:"If part of the ball is below the top of the net, a back-row player may attack it from anywhere."},
 {q:"A blocker lands with the heel over the centre line, but the toes are still on the line.",o:["Legal","Centre-line fault"],a:0,why:"Part of the foot is still in contact with the centre line, and there is no interference."},
 {q:"The receiving team's left back stands in front of the left-front player when the ball is served.",o:["Legal","Overlap fault"],a:1,why:"Left front (4) must be closer to the net than left back (5) at the serve."},
 {q:"FIVB 2025-2028 rules: the serving team's middle blocker stands in left front instead of their rotation position when their teammate serves.",o:["Legal","Overlap fault"],a:0,why:"Under the FIVB 2025-2028 rules the serving team has no positional restrictions. Under USA Volleyball 2025-2027 rules it would be a fault."},
 {q:"The libero sets with the fingers from in front of the attack line and the opposite spikes the ball from above the net.",o:["Legal","Attack-hit fault"],a:1,why:"A teammate may not complete an attack above the net from a libero's overhand finger set made in the front zone."},
 {q:"The libero makes the same set from behind the attack line and the opposite spikes it.",o:["Legal","Attack-hit fault"],a:0,why:"The restriction only applies to libero finger sets from in front of the attack line."},
 {q:"After a kill, the hitter touches the net between the antennae while landing.",o:["Point stands","Net fault"],a:1,why:"Landing is part of the action of playing the ball, so the net touch is a fault."},
 {q:"A hard serve hits the passer's left forearm, then the right forearm, in one movement.",o:["Legal","Double contact"],a:0,why:"Consecutive contacts in one action are allowed on the team's first contact."},
 {q:"The server tosses the ball, lets it drop to the floor and catches it to start again (FIVB rules).",o:["Re-serve","Service fault"],a:1,why:"Only one toss is allowed under FIVB rules. Some youth rules allow one re-toss."},
 {q:"As the ball is served, a front-row player of the serving team raises both hands above their head at the net.",o:["Legal","Screening fault"],a:1,why:"Since 2025, serving-team players must keep their hands below their heads until the ball passes the net."},
 {q:"Your spike is blocked, comes back to your side and hits the antenna.",o:["Point to your team","Point to the blocking team"],a:0,why:"A ball touching the antenna is out, and the last team to touch it was the blocking team. Out off the block is the attackers' point."},
 {q:"Your second contact goes outside the antenna into the other team's free zone. You run after it and play it back around the antenna.",o:["Legal save","Ball out"],a:1,why:"Since 2025, only a first team contact sent outside the antennae can be played back. A second or third contact is out when it crosses the plane of the net."},
 {q:"Two opponents touch the ball at the same time above the net and it drops toward your side.",o:["Play on: your team has three contacts","Replay the rally"],a:0,why:"Simultaneous contact by opponents above the net: play continues, and the team receiving the ball has three contacts."}];

window.VB_FORMATS={cols:["Indoor","Beach","Sitting"],rows:[
 ["Players per team on court","6","2","6"],
 ["Court","18 × 9 m","16 × 8 m","10 × 6 m"],
 ["Net (men / women)","2.43 / 2.24 m","2.43 / 2.24 m","1.15 / 1.05 m"],
 ["Set length","25 (deciding set 15)","21 (deciding set 15)","25 (deciding set 15)"],
 ["Change ends","After each set; at 8 in the deciding set","Every 7 points (every 5 in the deciding set)","As indoor"],
 ["Block counts as a contact","No","Yes","No"],
 ["Block the serve","No","No","Yes"],
 ["Positions at the serve","Receiving team in rotation order","Serving order only","Receiving team in order, judged by the buttocks"],
 ["Open-hand tip","Legal","Fault: knuckles or stiff fingers only","Legal"],
 ["Specialist","Libero","None","Libero"],
 ["Special rule","Back-row attack line","No centre line: you may cross under the net if you don't interfere","Part of the body between the shoulders and buttocks must touch the floor when playing the ball"]]};

/* more terms: added to the glossary in data-extras.js, sorted together */
const more=[
 ["31","A quick attack 2 to 3 m in front of the setter, between the setter and the left antenna."],
 ["Back 1","A quick set just behind the setter."],
 ["Bic","A fast back-row attack from the middle, set as the middle hitter jumps for the quick ('back-row quick')."],
 ["Block shadow","The area of the court behind the block that a hard-driven ball cannot reach. Defenders stand outside it."],
 ["Collapse dig","A dig where the player sits down under a low ball with the platform angled up."],
 ["Commit block","A blocker jumps with a particular hitter (usually the quick) before the set, guessing rather than reading."],
 ["Cover","Players crouching close around their own hitter to dig a ball that comes back off the block."],
 ["Crossing space","The part of the net plane between the antennae (and their extension upward) through which the ball must cross."],
 ["D ball","A back-row attack from the right back area (zone 1)."],
 ["Down ball","An attack hit while standing or barely jumping, usually because the set is poor. The defence can stay back."],
 ["Go","A fast, flat set to the left antenna. Also 'shoot'."],
 ["Hut","A high set to the outside (zone 4). Also '4' or 'high'."],
 ["In system","The pass or dig lets the setter set every hitter. 'Out of system' means it doesn't."],
 ["Libero replacement zone","The part of the bench-side sideline between the attack line and the end line where the libero enters and leaves."],
 ["Middle-up defence","A defence where the middle-back player plays close behind the block for tips. Also '6 up'."],
 ["Off-blocker","The front-row player who is not blocking, usually dropping back to the 3 m line to defend."],
 ["Overlap","Being out of rotational order at the serve. A fault for the receiving team."],
 ["Penetrate","The back-row setter running to the net to set ('the setter penetrates')."],
 ["Perimeter defence","A defence where the back-row players spread along the edges of the court, outside the block shadow."],
 ["Read block","A blocker who waits to see where the set goes before moving. The opposite of a commit block."],
 ["Red","A fast back set to the right antenna for the opposite."],
 ["Release","The setter moving from their receive spot to the target as the ball is served."],
 ["Rotation defence","A defence where the back row rotates toward the attack: right back moves up behind the block for tips."],
 ["Screening","Hiding the server or the ball's flight from the receivers. A fault."],
 ["Shoot","A fast set to an antenna. On the left also called a 'go'."],
 ["Slide","A one-foot take-off attack moving along the net, often by a middle blocker behind the setter."],
 ["Stack","Players standing close together, one in front of another, in serve receive while staying in rotational order."],
 ["Switch","Players moving to their specialist positions right after the serve."],
 ["Swing block","A block with an arm swing and a crossover approach, used to jump higher and travel farther."],
 ["Tandem","A play where a second hitter attacks just after and behind the quick hitter."],
 ["Target","The spot the passer aims for, about a metre off the net two thirds of the way across, where the setter sets from."],
 ["Tempo","When the hitter leaves relative to the set: first tempo (quick) is in the air before the set, second tempo leaves on the set, third tempo (high ball) leaves after it."],
 ["Tomahawk","An overhead dig or pass with the hands clasped together above the forehead."],
 ["X play","A play where the middle runs a quick and another hitter cuts across the middle's path to attack the gap."]];
const G=window.VB_GLOSSARY=window.VB_GLOSSARY||[];const have=new Set(G.map(g=>g[0].toLowerCase()));
more.forEach(m=>{if(!have.has(m[0].toLowerCase()))G.push(m);});
G.sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}));
})();
