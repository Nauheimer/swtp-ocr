import React from "react"
import Cropper from "./Cropper"
import TaskEditingAreas from "./TaskEditingAreas"
import Rectangle from "./Rectangle"
import { useRef, useState } from "react"
import "./TaskSelector.css"
import { ExamContainer, Task } from "./ExamContainer"
import {
	convertNaturalToCrop as _convertTaskToCrop,
	convertCropToNatural as _convertCropToTask,
} from "./CropConverter"

function TaskSelector({
	exam,
	setExam,
	examContainer,
	setExamContainer,
	setStudentExams,
	leave,
}) {
	const [reviewing, setReviewing] = useState(false)
	const [hoverIndex, setHoverIndex] = useState(-1)

	const [crop, setCrop] = useState({})
	const resetCrop = () => {
		setCrop({ ...crop, x: 0, y: 0, width: 0, height: 0 })
	}
	const [editing, setEditing] = useState(false)
	const [submitText, setSubmitText] = useState("")

	const setTasks = (newTasks) => {
		const exam_clone = exam.clone()
		exam_clone.tasks = newTasks
		setExam(exam_clone)
	}

	const croppingArea = useRef()
	const imageElementRef = useRef()
	const convertCropToTask = (crop) => {
		return _convertCropToTask(crop, imageElementRef, croppingArea)
	}
	const convertTaskToCrop = (crop) => {
		return _convertTaskToCrop(crop, imageElementRef, croppingArea)
	}

	const imageElement = (
		<img
			ref={imageElementRef}
			alt={"Correct Exam"}
			id="p1"
			src={exam.image}
			className="exame"
		/>
	)

	const loadTaskInCroppingArea = (index) => {
		setCrop(convertTaskToCrop(exam.tasks[index]))
	}

	const deleteTask = (index) => {
		let tasks = exam.clone().tasks
		tasks = tasks.filter((item) => item !== exam.tasks[index])
		setTasks(tasks)
	}

	const saveCropInNewTask = (crop) => {
		const taskCrop = convertCropToTask(crop)
		const task = new Task(
			taskCrop.x,
			taskCrop.y,
			taskCrop.width,
			taskCrop.height
		)
		const tasks = exam.clone().tasks
		tasks.push(task)
		setTasks(tasks)
		resetCrop()
	}

	const saveCropInExistingTask = (index, crop) => {
		const tasks = exam.clone().tasks
		const task = tasks[index]
		const { x, y, width, height } = convertCropToTask(crop)
		task.x = x
		task.y = y
		task.width = width
		task.height = height
		tasks[index] = task
		setTasks(tasks)
		resetCrop()
	}

	const AddOnClick = () => {
		saveCropInNewTask(crop)
		resetCrop()
	}
	const IsAddEnabled = () => {
		return crop.width > 0 && crop.height > 0 && !editing
	}
	const setPdfAsImage = (pdf) => {
		fetch("/web-backend/pdf2img/", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ pdf: pdf }),
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error(`Backend responses: ${res.status}`)
				}
				return res.json()
			})
			.then((json) => {
				setExamImage(json.img)
			})
			.catch((err) => {
				console.log("that didnt work" + err)
				alert("Beim Konvertieren ist leider etwas schief gegangen :/")
			})
	}
	const setExamImage = (image) => {
		const newExam = exam.clone()
		newExam.image = image
		setExam(newExam)
	}
	const onSelectFile = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			const file = e.target.files[0]
			if (file.type === "application/pdf") {
				//convert
				const reader = new FileReader()
				reader.addEventListener("load", () =>
					setPdfAsImage(reader.result)
				)
				reader.readAsDataURL(file)
			} else {
				const reader = new FileReader()
				reader.addEventListener("load", () =>
					setExamImage(reader.result)
				)
				reader.readAsDataURL(file)
			}
		}
	}

	const handleFileChosen = async (file) => {
		return new Promise((resolve, reject) => {
			const fileReader = new FileReader()
			fileReader.onload = () => {
				resolve(fileReader.result)
			}
			fileReader.onerror = reject
			fileReader.readAsDataURL(file)
		})
	}

	const onSelectExams = async (e) => {
		const files = [...e.target.files]
		const results = await Promise.all(
			files.map(async (file) => {
				const fileContents = await handleFileChosen(file)
				return fileContents
			})
		)
		const filenames = files.map((file) => {
			return file.name
		})
		setStudentExams(results, filenames)
	}

	async function sendToBackend() {
		setSubmitText("...")
		const response = await fetch(
			"/web-backend/analyze_correct_exam/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(examContainer),
			}
		)
		if (!response.ok) {
			setSubmitText("failed to reach the backend")
		}
		const examContainer_json = await response.json()
		setSubmitText("Successful")
		setExamContainer(ExamContainer.fromJSON(examContainer_json))
		setReviewing(true)
	}

	async function btn_next() {
		setSubmitText("...")
		const response = await fetch(
			"/web-backend/analyze_student_exams/",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(examContainer),
			}
		)
		if (!response.ok) {
			setSubmitText("failed to reach the backend")
		}
		const examContainer_json = await response.json()
		setSubmitText("Successful")
		setExamContainer(ExamContainer.fromJSON(examContainer_json))
		leave()
	}

	return (
		<div className="TaskSelector">
			<div className={"column column-left"}>
				<input
					type="file"
					accept="image/*,application/pdf"
					onChange={onSelectFile}
				/>
				<div className="imageArea">
					{exam.tasks.map((task, index) => {
						const crop = convertTaskToCrop(task)
						return (
							<Rectangle
								key={"rect" + index}
								width={crop.width}
								height={crop.height}
								x={crop.x}
								y={crop.y}
								className={
									hoverIndex === index ? " hover" : "no-hover"
								}
							/>
						)
					})}
					{examContainer.correctExam.image ? (
						<Cropper
							disabled={false}
							crop={crop}
							component={imageElement}
							onChange={(newCrop_px) => {
								setCrop(newCrop_px)
							}}
							ref={croppingArea}
						/>
					) : (
						<div>
							Please select the corrected Exam from your computer
						</div>
					)}
				</div>
			</div>
			{examContainer.correctExam.image && (
				<div className={"column column-right"}>
					<button
						onClick={() => AddOnClick()}
						disabled={!IsAddEnabled()}
					>
						Add
					</button>
					<TaskEditingAreas
						tasks={exam.tasks}
						setTasks={setTasks}
						loadCroppingArea={loadTaskInCroppingArea}
						deleteTask={deleteTask}
						saveCropInTask={(index) => {
							saveCropInExistingTask(index, crop)
						}}
						editing={editing}
						setEditing={setEditing}
						canEditAnswer={reviewing}
						setHoverIndex={setHoverIndex}
					/>
					{exam.tasks.length > 0 && !reviewing && (
						<div>
							<button onClick={sendToBackend}>Submit</button>
							<pre>{submitText}</pre>
						</div>
					)}
					{reviewing && (
						<div>
							select documents to correct
							<br />
							<input
								type="file"
								accept="image/*,application/pdf"
								multiple="multiple"
								onChange={onSelectExams}
							/>
						</div>
					)}
					{reviewing && examContainer.studentExams.length > 0 && (
						<button onClick={btn_next}>Next</button>
					)}
				</div>
			)}
		</div>
	)
}

export default TaskSelector
