import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { CircularProgress} from '@material-ui/core';
import { useAuth0 } from "@auth0/auth0-react";
import SemesterTable from './SemesterTable';
import Grid from '@material-ui/core/Grid';
import Container from '@material-ui/core/Container';
import { useQuery, useQueryClient, useMutation } from 'react-query';
import TreeKey from './TreeKey';
import Box from '@material-ui/core/Box';
import {updateJ} from './Game';

const useStyles = makeStyles((theme) => ({
	table: {
		minWidth: 100,
	},
	root: {
		paddingTop: theme.spacing(2)
	}
}));



let ID: number = -1
export interface Cards {
	id: number,
	index: number,
	className: any,
	classNum: any,
	grade: any,
	elec: boolean,
	cred: number,
	acceptableElec: number[]
}

export interface Course {
	subject: string,
	num: string
  };

export interface CardState {
	cards: Cards[]
}

export function isElectiveRequirement(requirement: Cards): requirement is Cards{
	return requirement.elec;
  }


export function updateMoveID(val: number): void {
	ID = val
}


export interface Curriculum {
	semester: number,
	subject: any,
	num: any,
	elecType: number
}

export interface CurrState {
	curr: Curriculum[]
}

var FullCurriculum: Curriculum[] = []
var sem1: Curriculum[] = []
var sem2: Curriculum[] = []
var sem3: Curriculum[] = []
var sem4: Curriculum[] = []
var sem5: Curriculum[] = []
var sem6: Curriculum[] = []
var sem7: Curriculum[] = []
var sem8: Curriculum[] = []


export default function Semesters() {
	const classes = useStyles();
	const queryClient = useQueryClient();
	const { getAccessTokenSilently } = useAuth0();
	
	let cards: Cards[] = []

	const curri = useQuery('curriculum', async () =>
	{
		 const accessToken = await getAccessTokenSilently({
                        audience: 'https://curriculum-utility'
                });
 
		const response = await fetch(`${window.__BACKEND_IP__}/getCurr`, {
                        method: 'GET',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`,
                        },

                });

		const ret = await response.json();

		
		return ret

	})

	if (!curri.isLoading && Object.keys(curri.data).length != 0) {
		fillCurr(curri.data);
	}


	const trans = useQuery('transcript', async() =>
		{	
      		const accessToken = await getAccessTokenSilently({
                        audience: 'https://curriculum-utility'
                });

                const response = await fetch(`${window.__BACKEND_IP__}/getTransfromAlex`, {
                        method: 'GET',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${accessToken}`,
                        },
           
                });
                const ret = await response.json();
                
		return ret
	 })
	const transMutation = useMutation((variables: {FROM: number, TO: number, transClone: any}) => 
		formSubmitted({
			FROM: variables.FROM,
			TO: variables.TO
		}), {

		onMutate: async (variables) => {
		
			await queryClient.cancelQueries('transcript')

			const prevTrans = queryClient.getQueryData('transcript')

			queryClient.setQueryData('transcript', variables.transClone)
		
			return { prevTrans }
		},

		onError: (err, variables, context: { prevTrans : any }) => {
			queryClient.setQueryData('transcript', context.prevTrans)			
		},

		onSettled: () => {
			queryClient.invalidateQueries('transcript')
			queryClient.invalidateQueries('tree', {
				refetchInactive: true
			})
		}
	})

	const clearMutation = useMutation((variables: {CLEAR: number, transClone: any}) => 
		formSubmittedClear({
			CLEAR: variables.CLEAR
		}), {

		onMutate: async (variables) => {
		
			await queryClient.cancelQueries('transcript')

			const prevTrans = queryClient.getQueryData('transcript')

			queryClient.setQueryData('transcript', variables.transClone)
		
			return { prevTrans }
		},

		onError: (err, variables, context: { prevTrans : any }) => {
			queryClient.setQueryData('transcript', context.prevTrans)			
		},

		onSettled: () => {
			queryClient.invalidateQueries('transcript')
			queryClient.invalidateQueries('tree', {
				refetchInactive: true
			})
		}
	})

	const setMutation = useMutation((variables: {pos: number, sub: string, num: string, transClone: any}) => 
	formSubmittedSet({
		POS: variables.pos,
		SUB: variables.sub,
		NUM: variables.num,
	}), {

	onMutate: async (variables) => {
	
		await queryClient.cancelQueries('transcript')

		const prevTrans = queryClient.getQueryData('transcript')

		queryClient.setQueryData('transcript', variables.transClone)
	
		return { prevTrans }
	},

	onError: (err, variables, context: { prevTrans : any }) => {
		queryClient.setQueryData('transcript', context.prevTrans)			
	},

	onSettled: () => {
		queryClient.invalidateQueries('transcript')
		queryClient.invalidateQueries('tree', {
			refetchInactive: true
		})
	}
})

        const GradeMutation = useMutation((variables: {Sub: any, Num: any, Grade: any, transClone: any}) =>
                formSubmittedGrade({
                        Sub: variables.Sub,
                        Num: variables.Num,
						Grade: variables.Grade
                }), {

                onMutate: async (variables) => {

                        await queryClient.cancelQueries('transcript')

                        const prevTrans = queryClient.getQueryData('transcript')

                        queryClient.setQueryData('transcript', variables.transClone)

                        return { prevTrans }
                },

                onError: (err, variables, context: { prevTrans : any }) => {
                        queryClient.setQueryData('transcript', context.prevTrans)
                },

                onSettled: () => {
                        queryClient.invalidateQueries('transcript')
						queryClient.invalidateQueries('tree', {
							refetchInactive: true
						})
                }
        })	
	
	if (trans.isLoading){
		return (
			<Box width="100%" height={100} py={2} display="flex" alignItems="center" justifyContent="center"> 
				<CircularProgress size={100}/>
			</Box>
		)
	}
	
	setTrans(trans.data);

	function setTrans(tran: any) {
		if (!tran) {
			console.error("404 on server side")
			return;
		} else if (tran.getTransfromAlex.length == 0) {
			console.log("no update")
			return
		} else {
			console.log("setting cards")
			if (tran.getTransfromAlex) {
				if (tran.getTransfromAlex != null) {
					let i = 0
					while (tran.getTransfromAlex[i]) {
						let newCard : Cards = {
							id : i,
							index : tran.getTransfromAlex[i].Req,
							className : tran.getTransfromAlex[i].Sub,
							classNum : tran.getTransfromAlex[i].Num,
							grade : tran.getTransfromAlex[i].Grade,
							elec : tran.getTransfromAlex[i].Elec,
							cred : tran.getTransfromAlex[i].Cred,
							acceptableElec: tran.getTransfromAlex[i].Move
						}
						cards.push(newCard)			
						i++
					}
				}

			}
		}
	}


	async function formSubmitted( data: {FROM: number, TO: number}) {
		const jsonBody = { FROM: data.FROM, TO: data.TO };
		
		const accessToken = await getAccessTokenSilently({
    			audience: 'https://curriculum-utility'
  		});

  		const response = await fetch(`${window.__BACKEND_IP__}/updateAlexTrans`, {
    			method: 'POST',
    			headers: {
      				'Content-Type': 'application/json',
      				'Authorization': `Bearer ${accessToken}`,
    			},
    			body: JSON.stringify(jsonBody)
  		});
  		const ret = await response.json();
		return ret
	}

	async function formSubmittedClear( data: {CLEAR: number}) {
		const jsonBody = { FROM: data.CLEAR};
		
		const accessToken = await getAccessTokenSilently({
    			audience: 'https://curriculum-utility'
  		});

  		const response = await fetch(`${window.__BACKEND_IP__}/clearCourse`, {
    			method: 'POST',
    			headers: {
      				'Content-Type': 'application/json',
      				'Authorization': `Bearer ${accessToken}`,
    			},
    			body: JSON.stringify(jsonBody)
  		});
  		const ret = await response.json();
		return ret
	}

	async function formSubmittedSet(data: {POS: number, SUB: string, NUM: string}) {
		const jsonBody = { FROM: data.POS, SUB: data.SUB, NUM: data.NUM};
		
		const accessToken = await getAccessTokenSilently({
    			audience: 'https://curriculum-utility'
  		});

  		const response = await fetch(`${window.__BACKEND_IP__}/setCourse`, {
    			method: 'POST',
    			headers: {
      				'Content-Type': 'application/json',
      				'Authorization': `Bearer ${accessToken}`,
    			},
    			body: JSON.stringify(jsonBody)
  		});
  		const ret = await response.json();
		return ret
	}

	async function formSubmittedGrade(data : {Sub: any, Num: any, Grade: any}) {
		const jsonBody = { Sub: data.Sub, Num: data.Num, Grade: data.Grade };
	
		const accessToken = await getAccessTokenSilently({
                        audience: 'https://curriculum-utility'
                });

	
		const response = await fetch(`${window.__BACKEND_IP__}/updateGrades`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${accessToken}`,
			},
			body: JSON.stringify(jsonBody),
		});
		const ret = await response.json();
		return ret
	}

	function changeGrade(pos: number, grade: any) {
		const transClone : any = trans.data
		for (let i = 0; i < cards.length; i++) {
			if (cards[i].index == pos) {
				transClone.getTransfromAlex[i].Grade = grade
				GradeMutation.mutate( {Sub: cards[i].className, Num: cards[i].classNum, Grade: grade, transClone: transClone} )
			}
		}
	}

	function clearCards(pos: number) {
		const transClone: any = trans.data
	
		for(let j = 0; j < cards.length; j++) {
			if(cards[j].index == pos) {
					transClone.getTransfromAlex[j].Elec = true
					transClone.getTransfromAlex[j].Sub = "NONE"
					transClone.getTransfromAlex[j].Num = "0000"
					clearMutation.mutate({CLEAR: cards[j].index, transClone: transClone})
			}
		}
	}

	function setCards(pos: number, sub: string, num: string, cred: number, move: number[]) {
		const transClone: any = trans.data
	
		for(let j = 0; j < cards.length; j++) {
			if(cards[j].index == pos) {
					transClone.getTransfromAlex[j].Elec = true
					transClone.getTransfromAlex[j].Sub = sub
					transClone.getTransfromAlex[j].Num = num
					transClone.getTransfromAlex[j].Cred = cred
					transClone.getTransfromAlex[j].Move = move
					setMutation.mutate({pos: cards[j].index, sub: sub, num: num, transClone: transClone})
			}
		}
	}

	function updateCards(pos: number) {
		const transClone: any = trans.data
		updateJ(-1, false)
		let x = -1
		let y = -1
		let z = -1
		for(let j = 0; j < cards.length; j++) {
			if(cards[j].index == pos) {
				x = j
			}
		}
		for (let i = 0; i < cards.length; i++) {
			if (cards[i].id == ID) {
				z = i

				if(x < i) {
					transClone.getTransfromAlex[x].Sub = cards[i].className
					transClone.getTransfromAlex[x].Num = cards[i].classNum
					transClone.getTransfromAlex[x].Grade = cards[i].grade
					transClone.getTransfromAlex[x].Elec = cards[i].elec
					transClone.getTransfromAlex[x].Cred = cards[i].cred
					transClone.getTransfromAlex[x].Move = cards[i].acceptableElec
					transClone.getTransfromAlex[i].Elec = true
					transClone.getTransfromAlex[i].Sub = "NONE"
					transClone.getTransfromAlex[i].Num = "0000"
					transClone.getTransfromAlex[i].Grade = "IC"
					transClone.getTransfromAlex[i].Cred = 0
					transClone.getTransfromAlex[i].Move = []
				}
				else {
					y = i
				}
			} else if (x == i && y != -1) {
				transClone.getTransfromAlex[x].Sub = cards[y].className
				transClone.getTransfromAlex[x].Num = cards[y].classNum
				transClone.getTransfromAlex[x].Grade = cards[y].grade
				transClone.getTransfromAlex[x].Elec = cards[y].elec
				transClone.getTransfromAlex[x].Cred = cards[y].cred
				transClone.getTransfromAlex[x].Move = cards[y].acceptableElec
				transClone.getTransfromAlex[y].Elec = true
				transClone.getTransfromAlex[y].Sub = "NONE"
				transClone.getTransfromAlex[y].Num = "0000"
				transClone.getTransfromAlex[y].Grade = "IC"
				transClone.getTransfromAlex[y].Cred = 0
				transClone.getTransfromAlex[i].Move = []
			}
		}
		transMutation.mutate({FROM: cards[z].index, TO: pos, transClone: transClone}) 
	}


	function fillCurr(sem: any) {

		if (!sem) {
			console.error("404 server side")
			return;
		} else if (sem1.length != 0) {
			return;
		} else {
			if (sem.getCurr) {
				if (sem.getCurr != null) {
					let i = 0
					while (sem.getCurr[i]) {
						let record: Curriculum = { semester: 1, subject: "CSCI", num: "0000", elecType: 1}
						record.semester = sem.getCurr[i].CourseSem
						record.subject = sem.getCurr[i].CourseSubject
						record.num = sem.getCurr[i].CourseNum
						record.elecType = sem.getCurr[i].ElectType

						FullCurriculum.push(record)
						if (sem.getCurr[i].CourseSem == 1) {
							sem1.push(record)
						}
						if (sem.getCurr[i].CourseSem == 2) {
							sem2.push(record)
						}
						if (sem.getCurr[i].CourseSem == 3) {
							sem3.push(record)
						}
						if (sem.getCurr[i].CourseSem == 4) {
							sem4.push(record)
						}
						if (sem.getCurr[i].CourseSem == 5) {
							sem5.push(record)
						}
						if (sem.getCurr[i].CourseSem == 6) {
							sem6.push(record)
						}
						if (sem.getCurr[i].CourseSem == 7) {
							sem7.push(record)
						}
						if (sem.getCurr[i].CourseSem == 8) {
							sem8.push(record)
						}
						i++
					}
				}
			}
		}
	}

	var niceDisplay;
	niceDisplay = <div>
		<Container className={classes.root} maxWidth={false}>
			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={1} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem1} start={0} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={2} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem2} start={0 + sem1.length} fullCurr={FullCurriculum} />
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={3} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem3} start={0 + sem1.length + sem2.length} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={4} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem4} start={0 + sem1.length + sem2.length + sem3.length} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={5} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem5} start={0 + sem1.length + sem2.length + sem3.length + sem4.length} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={6} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem6} start={0 + sem1.length + sem2.length+ sem3.length + sem4.length + sem5.length} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={7} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem7} start={0 + sem1.length + sem2.length + sem3.length + sem4.length + sem5.length + sem6.length} fullCurr={FullCurriculum}/>
				</Grid>
				<Grid item xs={12} md={6}>
					<SemesterTable semester={8} cards={cards} updateCards={updateCards} changeGrade={changeGrade} clearCard={clearCards} setCards={setCards} curr={sem8} start={0 + sem1.length + sem2.length + sem3.length + sem4.length + sem5.length + sem6.length + sem7.length} fullCurr={FullCurriculum}/>
				</Grid>

			</Grid>
		</Container>
	</div>


	return (
		<div>
		    <TreeKey />
			{niceDisplay}
		</div>
	);
}

