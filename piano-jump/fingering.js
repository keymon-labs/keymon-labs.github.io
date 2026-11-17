// Piano Jump fingering: five-finger positions per hand, moved only when a note leaves the position.
// Steps are staff steps (middle C = 0). RH starts in C position (thumb C4), LH in C position (thumb G3).

/** notes: [{midi, step, finger?}] → [{hand, finger, move}] where move is -1/0/+1 (hand shifts down/up). */
export function assignFingers(notes){
  const thumb={R:0,L:-3};
  return notes.map(({midi,step,finger})=>{
    const hand=midi>=60?"R":"L",dir=hand==="R"?1:-1;   // fingers count up the keys in RH, down in LH
    let f=finger||1+dir*(step-thumb[hand]),at=thumb[hand];
    if(finger)at=step-dir*(finger-1);                   // explicit finger sets a new position
    else if(f<1){f=1;at=step;}                          // below/above the thumb: move the thumb there
    else if(f>5){f=5;at=step-dir*4;}                    // past the pinky: move the pinky there
    const move=Math.sign(at-thumb[hand]);thumb[hand]=at;
    return {hand,finger:f,move};
  });
}
