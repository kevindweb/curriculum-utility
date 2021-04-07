import {Cards, Curriculum} from './Semesters'

let j = -1
let elec = false
export function canMoveKnight(toX: number, pos: Cards[], fullCurr: Curriculum[]): boolean {
 	let ret: boolean = true
	let savedI : number = -1
	if(elec == false) {
		return false 
	}
	else{
		for(let i = 0; i< pos.length; i++) {
			if(toX ==pos[i].index - pos[0].index){
				savedI = i
			}
 			if(toX == pos[i].index- pos[0].index && pos[i].className != "NONE"){
				ret = false
			}
		}
	}
	console.log(j)
	console.log(toX)
	console.log(pos)
	for(let i = 0; i< pos.length; i++) {
		if(pos[i].id == j)
		{
			for(let z = 0; z<pos[i].acceptableElec.length; z++){
				console.log("here")
				console.log("acceptable")
				console.log(pos[i].acceptableElec[z])
				console.log("targer")
				console.log(fullCurr[toX].elecType)
				if(pos[i].acceptableElec[z] == fullCurr[toX].elecType && pos[savedI].className == "NONE"){
					return true
				}
			}
			console.log("finish")
			return false
		}
	}
	return (ret)
}

export function updateJ(val: number, el: boolean): void {
	j = val
	elec = el
}


