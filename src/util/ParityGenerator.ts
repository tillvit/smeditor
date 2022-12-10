export {}
// const LAYOUT = {
//   "dance-single": [
//     [-1,0],[0,-1],[0,1],[1,0]
//   ]
// }
// const PENALTY = {
//   DOUBLESTEP: 5,
//   CROSSOVER: 2,
//   JACK: 1,
// }

// const SEARCH_DEPTH = 5

// let testnotedata = [[]]


// function getPossibleMoves(layout, cols) {
//   let moves = {}
//   let permutations = permutate(cols)
//   for (let leftNum = 0; leftNum < 3; leftNum++) {
//     if (leftNum > cols.length) break
//     for (let rightNum = 0; rightNum < 3; rightNum++) {
//       if (leftNum + rightNum > cols.length) break
//       if (leftNum + rightNum < cols.length) continue
//       for (let p of permutations) {
//         let leftCols = p.slice(0,leftNum).sort()
//         let rightCols = p.slice(leftNum, leftNum+rightNum).sort()
//         let key = leftCols.join("") + "," + rightCols.join("")
//         if (!(key in moves) && bracketCheck(layout,leftCols) && bracketCheck(layout,rightCols)) {
//           moves[key] = key
//           console.log(key)
//           let leftPos = getPosition(layout,leftCols)
//           let rightPos = getPosition(layout,rightCols)
//           console.log(leftPos,rightPos,getPlayerAngle(leftPos,rightPos)/Math.PI*180)
//         }
//       }
//     }
//   }
// }

// function permutate(arr) {
//   let result = [];
//   const permute = (arr, m = []) => {
//     if (arr.length === 0) {
//       result.push(m)
//     } else {
//       for (let i = 0; i < arr.length; i++) {
//         let curr = arr.slice();
//         let next = curr.splice(i, 1);
//         permute(curr.slice(), m.concat(next))
//      }
//    }
//  }
//  permute(arr)
//  return result;
// }

// function bracketCheck(layout, cols) {
//   if (cols.length != 2) return true
//   let pos = LAYOUT[layout]
//   let p1 = pos[cols[0]]
//   let p2 = pos[cols[1]]
//   return getDistanceSq(p1, p2) <= 2
// }

// function getDistanceSq(p1, p2) {
//   return (p1[1]-p2[1])*(p1[1]-p2[1])+(p1[0]-p2[0])*(p1[0]-p2[0])
// }

// function getPosition(layout, cols) {
//   if (cols.length == 0) return undefined
//   if (cols.length == 1) return LAYOUT[layout][cols[0]]
//   let pos = LAYOUT[layout]
//   let p1 = pos[cols[0]]
//   let p2 = pos[cols[1]]
//   return [(p1[0]+p2[0])/2,(p1[1]+p2[1])/2]
// }

// function getPlayerAngle(left, right) {
//   if (!left || !right) return undefined
//   let x1 = right[0] - left[0]
//   let y1 = right[1] - left[1]
//   let x2 = 1
//   let y2 = 0
//   let dot = x1*x2 + y1*y2     
//   let det = x1*y2 - y1*x2     
//   return Math.atan2(det, dot) 
// }