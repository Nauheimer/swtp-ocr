const TaskReviewingArea = ({task, setTask, taskId, hover}) => {
	const setPoints = (points) =>{
		let n = task.clone()
		n.points = points
		setTask(n)
	}

	return(
		<div className={"task"} onMouseOver={()=>{hover(taskId)}}>

		<div className="form" key={"task-form-div"+taskId}>
			<div className="answers">
				<table>
					<thead>
						<td>
							Correct: 
						</td>
						<td>
							Student:
						</td>
					</thead>
					<tbody>
						<tr>
							<td>{task.expectedAnswer}</td>
							<td>{task.actualAnswer}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<input type="number" value={task.points} size="2" onChange={(e) => {setPoints(parseFloat(e.target.value))}} />/{task.maxPoints}

		</div>
			

	</div>
	)
}
export default TaskReviewingArea