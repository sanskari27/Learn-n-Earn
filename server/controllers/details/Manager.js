const Manager = require('../../models/users/Manager');
const Target = require('../../models/reports/Target');
const CompanyDetail = require('../../models/reports/CompanyDetail');
const CandidateDetails = require('../../models/users/CandidateDetails');
const Candidate = require('../../models/users/Candidate');
const Team = require('../../models/users/Team');
const Examination = require('../../models/exam/Examination');
const Interview = require('../../models/exam/Interview');
const Question = require('../../models/exam/Question');
const OfferLetter = require('../../models/exam/OfferLetter');
const fs = require('fs');
const {
	CandidateStatus,
	InterviewStatus,
	ExaminationStatus,
	OfferLetterStatus,
} = require('../../utils/Enums');

exports.MyDashboard = async (req, res) => {
	const date = new Date();
	const start = new Date(date.getFullYear(), date.getMonth(), 1);
	start.setHours(0, 0, 0, 0);
	const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
	end.setHours(23, 59, 59, 999);

	try {
		const header = {
			registration: 0,
			exam: 0,
			interview: 0,
			offer_letter_issued: 0,
			joined: 0,
		};
		const startOfToday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		header.registration = await CandidateDetails.countDocuments({
			createdAt: { $gte: startOfToday },
		});
		header.exam = await Examination.countDocuments({
			createdAt: { $gte: startOfToday },
		});
		header.interview = await Interview.countDocuments({
			updatedAt: { $gte: startOfToday },
		});
		header.offer_letter_issued = await OfferLetter.countDocuments({
			issue_date: { $eq: startOfToday.toDateString() },
		});
		header.joined = await OfferLetter.countDocuments({
			issue_date: { $eq: startOfToday.toDateString() },
			status: { $eq: OfferLetterStatus.JOINED },
		});

		const registration = {
			convinced: 0,
			registered: 0,
		};
		registration.convinced = await Target.countDocuments({
			response: 'Convinced',
		});
		registration.registered = await CandidateDetails.countDocuments();

		const call_target = {
			total: 0,
			achived: 0,
		};
		call_target.total = await Target.countDocuments();
		call_target.achived = await Target.countDocuments({
			response: { $exists: true, $ne: null },
		});

		const exam_report = {
			total: 0,
			attended: 0,
			pending: 0,
			pass: 0,
			fail: 0,
		};
		exam_report.total = registration.registered;
		exam_report.attended = await Examination.countDocuments();
		exam_report.pending = await CandidateDetails.countDocuments({
			status: CandidateStatus.ELIGIBLE,
		});
		exam_report.pass = await Examination.countDocuments({
			status: { $eq: ExaminationStatus.PASS },
		});
		exam_report.fail = await Examination.countDocuments({
			status: { $eq: ExaminationStatus.FAIL },
		});
		const interview_report = {
			total: 0,
			attended: 0,
			pending: 0,
			pass: 0,
			fail: 0,
		};

		interview_report.total = await Interview.countDocuments();
		interview_report.attended = await Interview.countDocuments({
			status: { $in: [InterviewStatus.PASS, InterviewStatus.FAIL] },
		});
		interview_report.pending = interview_report.total - interview_report.attended;
		interview_report.pass = await Interview.countDocuments({
			status: InterviewStatus.PASS,
		});
		interview_report.fail = await Interview.countDocuments({
			status: InterviewStatus.FAIL,
		});

		const offer_letter = {
			total: 0,
			issued: 0,
			pending: 0,
		};
		offer_letter.total = await OfferLetter.countDocuments();
		offer_letter.issued = await OfferLetter.countDocuments({
			status: OfferLetterStatus.ISSUED,
		});
		offer_letter.pending = await OfferLetter.countDocuments({
			status: OfferLetterStatus.NOT_ISSUED,
		});

		const joining_report = {
			total: 0,
			joined: 0,
			pending: 0,
		};
		joining_report.total = offer_letter.issued;
		joining_report.joined = await OfferLetter.countDocuments({
			status: OfferLetterStatus.JOINED,
		});
		joining_report.pending = joining_report.total - joining_report.joined;

		res.status(200).json({
			success: true,
			header,
			registration,
			call_target,
			exam_report,
			interview_report,
			offer_letter,
			joining_report,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.Teams = async (req, res) => {
	const project = {
		_id: 1,
		name: 1,
		mobile: 1,
		email: 1,
		admission_allowded: 1,
		student_count: { $size: '$students' },
		appointed_at: 1,
	};
	try {
		const teams = await Team.aggregate([
			{
				$lookup: {
					from: CandidateDetails.collection.name,
					localField: '_id',
					foreignField: 'referred_by',
					as: 'students',
				},
			},
			{ $project: project },
		]);
		res.status(200).json({
			success: true,
			teams,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.Students = async (req, res) => {
	const project = {
		_id: 1,
		aadhaar: 1,
		backlog: 1,
		cgpa: 1,
		college: 1,
		diploma: 1,
		district: 1,
		fname: 1,
		gender: 1,
		height: 1,
		name: 1,
		opportunity: 1,
		pincode: 1,
		plant_worked: 1,
		pwd: 1,
		qualification: 1,
		state: 1,
		status: 1,
		weight: 1,
		work_experience: 1,
		exam_attempt_remaining: 1,
		y_o_p: 1,
		mobile: 1,
		email: 1,
		DOB: 1,
		registration_date: 1,
		examination: 1,
		offer_letter: 1,
		interview: 1,
		'team.name': 1,
		'team._id': 1,
	};
	try {
		const students = await CandidateDetails.aggregate([
			{
				$lookup: {
					from: Candidate.collection.name,
					localField: 'candidate',
					foreignField: '_id',
					as: 'details',
				},
			},
			{ $addFields: { details: { $arrayElemAt: ['$details', 0] } } },
			{ $addFields: { mobile: '$details.mobile' } },
			{ $addFields: { email: '$details.email' } },
			{ $addFields: { registration_date: '$details.createdAt' } },
			{
				$lookup: {
					from: Examination.collection.name,
					localField: '_id',
					foreignField: 'candidate',
					as: 'examination',
				},
			},
			{ $addFields: { examination: { $arrayElemAt: ['$examination', 0] } } },
			{ $addFields: { examination: '$examination.status' } },
			{
				$lookup: {
					from: Interview.collection.name,
					localField: '_id',
					foreignField: 'candidate',
					as: 'interview',
				},
			},
			{ $addFields: { interview: { $arrayElemAt: ['$interview', 0] } } },
			{ $addFields: { interview: '$interview.status' } },
			{
				$lookup: {
					from: OfferLetter.collection.name,
					localField: '_id',
					foreignField: 'candidate',
					as: 'offerletter',
				},
			},
			{ $addFields: { offerletter: { $arrayElemAt: ['$offerletter', 0] } } },
			{ $addFields: { offer_letter: '$offerletter.status' } },
			{
				$lookup: {
					from: Team.collection.name,
					localField: 'referred_by',
					foreignField: '_id',
					as: 'team',
				},
			},
			{ $addFields: { team: { $arrayElemAt: ['$team', 0] } } },
			{ $match: { name: { $exists: true, $ne: null } } },
			{ $sort: { createdAt: -1 } },
			{ $project: project },
		]);
		res.status(200).json({
			success: true,
			students,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.UpdateCandidatesDetail = async (req, res) => {
	const { details } = req.body;
	try {
		if (!details) {
			res.status(400).json({
				success: false,
				message: 'Invalid Candidate Id',
			});
		}
		const candidate = await CandidateDetails.findById(details._id);
		if (!candidate) {
			res.status(400).json({
				success: false,
				message: 'Invalid Candidate Id',
			});
		}

		const user = await Candidate.findById(candidate.candidate);
		user.email = details.email;
		user.mobile = details.mobile;
		await user.save();

		candidate.name = details.name;
		candidate.fname = details.fname;
		candidate.gender = details.gender;
		candidate.aadhaar = details.aadhaar;
		candidate.qualification = details.qualification;
		candidate.diploma = details.diploma;
		candidate.y_o_p = details.y_o_p;
		candidate.cgpa = details.cgpa;
		candidate.backlog = details.backlog;
		candidate.college = details.college;
		candidate.height = details.height;
		candidate.weight = details.weight;
		candidate.plant_worked = details.plant_worked;
		candidate.pwd = details.pwd;
		candidate.work_experience = details.work_experience;
		candidate.status = details.status;
		candidate.exam_attempt_remaining = details.exam_attempt_remaining;
		await candidate.save();
		return res.status(201).json({
			success: true,
			message: 'Candidate details updated',
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.UpdateCandidatesTeam = async (req, res) => {
	const { team_id, candidates } = req.body;
	try {
		if (team_id && candidates.length > 0) {
			await CandidateDetails.updateMany({ _id: { $in: candidates } }, { referred_by: team_id });
			return res.status(201).json({
				success: true,
				message: 'Team Assignment successful',
			});
		}
		res.status(400).json({
			success: false,
			message: 'Team id is invalid',
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.DownloadOfferLetter = async (req, res) => {
	const id = req.params.id;
	try {
		const offer = await OfferLetter.findOne({ candidate: id });
		if (!offer || !offer.application_id) {
			return res.status(404).json({
				success: false,
				message: 'Offer letter not generated yet',
			});
		}
		try {
			const fileName = 'Offer-Letter.pdf';
			const fileURL = __basedir + '/static/offer-letters/' + offer.application_id + '.pdf';
			const stream = fs.createReadStream(fileURL);
			res.set({
				'Content-Disposition': `attachment; filename='${fileName}'`,
				'Content-Type': 'application/pdf',
			});
			stream.pipe(res);
		} catch (e) {
			console.error(e);
			res.status(500).end();
		}
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.UpdateTeam = async (req, res) => {
	const { id, info } = req.body;
	try {
		const team = await Team.findById(id);
		team.admission_allowded = info;
		await team.save();

		res.status(201).json({
			success: true,
			message: 'Team Updated',
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.FetchProfile = async (req, res) => {
	const team = req.user;
	const profile = {
		name: team.name,
		photo: team.photo,
		mobile: team.mobile,
		email: team.email,
	};
	res.status(200).json({
		success: true,
		profile,
	});
};

exports.UpdateProfile = async (req, res) => {
	const { name, mobile, current, password } = req.body;
	try {
		const team = await Manager.findById(req.user._id).select('password');
		team.name = name;
		team.mobile = mobile;
		if (current) {
			const matched = await team.verifyPassword(current);
			if (matched) {
				team.password = password;
			} else {
				return res.status(403).json({
					status: false,
					message: 'Invalid Password',
				});
			}
		}
		await team.save();

		res.status(201).json({
			success: true,
			message: 'Profile Updated',
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.UpdateProfileImage = async (req, res) => {
	const { photo } = req.body;
	try {
		const team = await Manager.findById(req.user._id);
		team.photo = photo;
		await team.save();

		res.status(201).json({
			success: true,
			message: 'Profile Photo Updated',
			photo,
		});
	} catch (err) {
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.CreateQuestion = async (req, res) => {
	const { id, section, type, imagePath, question, options, answer } = req.body;

	const option = [options.a, options.b, options.c, options.d];
	try {
		if (id) {
			const _question = await Question.findById(id);
			if (!_question) {
				return res.status(404).json({
					success: false,
					message: 'Invalid Question ID',
				});
			}
			_question.type = type;
			_question.image = imagePath;
			_question.text = question;
			_question.subject = section;
			_question.options = option;
			_question.answer = answer;
			await _question.save();
		} else {
			await Question.create({
				type: type,
				image: imagePath,
				text: question,
				subject: section,
				options: option,
				answer: answer,
			});
		}

		res.status(201).json({
			success: true,
			message: 'Question Created',
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.FetchQuestion = async (req, res) => {
	try {
		const _question = await Question.findById(req.params.id).select(
			'_id subject type image text answer options'
		);
		if (!_question) {
			return res.status(404).json({
				success: false,
				message: 'Invalid Question ID',
			});
		}
		const question = {
			id: _question._id,
			section: _question.subject,
			type: _question.type,
			imagePath: _question.image,
			question: _question.text,
			options: {
				a: _question.options[0],
				b: _question.options[1],
				c: _question.options[2],
				d: _question.options[3],
			},
			answer: _question.answer,
		};
		res.status(201).json({
			success: true,
			question,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.ExportQuestion = async (req, res) => {
	try {
		const _question = await Question.find().select('_id subject type image text answer options');

		const path = __basedir + '/static/assets/questions.csv';
		let data = 'ID,Type,Subject,Text,Image,Option1,Option2,Option3,Option4,Answer';
		for (const q of _question) {
			data += '\n';
			data += `"${q._id}",`;
			data += `"${q.type}",`;
			data += `"${q.subject}",`;
			data += `"${q.text}",`;
			data += `${q.image ? 'https://api.factory-jobs.com/images/' + q.image : ''},`;
			data += `"${q.options[0]}",`;
			data += `"${q.options[1]}",`;
			data += `"${q.options[2]}",`;
			data += `"${q.options[3]}",`;
			data += `"${q.answer}"`;
		}
		const writeToFile = (path, data, callback) => {
			fs.writeFile(path, data, 'utf8', (err) => {
				// JSON.stringify(data, null, 2) help you to write the data line by line
				if (!err) {
					callback(true);
					// successfull
				} else {
					callback(false);
					// some error (catch this error)
				}
			});
		};
		writeToFile(path, data, (result) => {
			if (result) {
				try {
					const fileName = 'questions.csv';
					const path = __basedir + '/static/assets/questions.csv';

					const stream = fs.createReadStream(path);
					res.set({
						'Content-Disposition': `attachment; filename='${fileName}'`,
						'Content-Type': 'text/csv',
					});
					stream.pipe(res);
				} catch (e) {
					console.error(e);
					res.status(500).end();
				}
			} else {
				res.status(500).json({
					success: false,
					message: 'Unable to export Question',
				});
			}
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.CreateTargetRecord = async (req, res) => {
	const { team_id, targets } = req.body;

	try {
		const team = Team.findById(team_id);
		if (!team) {
			return res.status(404).json({
				success: false,
				message: 'Team not found',
			});
		}

		const data = [];
		targets.forEach((e) => {
			const target = {
				team: team_id,
				name: e[0],
				gender: e[1],
				fname: e[2],
				dob: e[3],
				mobile1: e[4],
				mobile2: e[5],
				aadhaar: e[6],
				email: e[7],
				district: e[8],
				state: e[9],
				qualification: e[10],
				y_o_p: e[11],
				pincode: e[12],
				source: e[13],
			};
			data.push(target);
		});
		await Target.insertMany(data)
			.then(function () {
				res.status(201).json({
					success: true,
					message: 'Target Saved',
				}); // Success
			})
			.catch(function (error) {
				console.log(error);
				return res.status(400).json({
					success: false,
					message: 'Unable to save few targets',
				});
			});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

//---------------------------------------Report---------------------------------------------------------
exports.ExamWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		'examinations.status': 1,
		'candidates._id': 1,
		'candidates.status': 1,
	};
	try {
		const teams = await Team.aggregate([
			{
				$lookup: {
					from: CandidateDetails.collection.name,
					localField: '_id',
					foreignField: 'referred_by',
					as: 'candidates',
				},
			},
			{
				$lookup: {
					from: Examination.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'examinations',
				},
			},
			{ $project: project },
		]);

		for (const team of teams) {
			const candidates = team.candidates;
			const examinations = team.examinations;
			let eligible = 0;
			candidates.forEach((candidate) => {
				if (candidate.status === CandidateStatus.ELIGIBLE) {
					eligible++;
				}
			});
			let pass = 0;
			let fail = 0;
			examinations.forEach((examination) => {
				if (examination.status === ExaminationStatus.PASS) {
					pass++;
				}
				if (examination.status === ExaminationStatus.FAIL) {
					fail++;
				}
			});
			const attended = examinations.length;
			team.candidates = undefined;
			team.examinations = undefined;
			team.eligible = eligible;
			team.pass = pass;
			team.fail = fail;
			team.attended = attended;
		}

		res.status(200).json({
			success: true,
			teams,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.InterviewWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		'interviews.status': 1,
		'candidates.status': 1,
	};
	try {
		const teams = await Team.aggregate([
			{
				$lookup: {
					from: CandidateDetails.collection.name,
					localField: '_id',
					foreignField: 'referred_by',
					as: 'candidates',
				},
			},
			{
				$lookup: {
					from: Interview.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'interviews',
				},
			},
			{ $project: project },
		]);

		for (const team of teams) {
			const interviews = team.interviews;
			const candidates = team.candidates;
			let scheduled = 0;
			let not_scheduled = 0;
			let pass = 0;
			let fail = 0;
			let not_responding = 0;
			interviews.forEach((interview) => {
				if (interview.status === InterviewStatus.PASS) {
					pass++;
				}
				if (interview.status === InterviewStatus.FAIL) {
					fail++;
				}
				if (interview.status === InterviewStatus.SCHEDULED) {
					scheduled++;
				}
				if (interview.status === InterviewStatus.NOT_SCHEDULED) {
					not_scheduled++;
				}
			});
			candidates.forEach((candidate) => {
				if (candidate.status === CandidateStatus.NOT_RESPONDING_INTERVIEW) {
					not_responding++;
				}
			});
			team.interviews = undefined;
			team.candidates = undefined;
			team.scheduled = scheduled;
			team.not_scheduled = not_scheduled;
			team.pass = pass;
			team.fail = fail;
			team.not_responding = not_responding;
		}

		res.status(200).json({
			success: true,
			teams,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.AdmissionWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		'offer_letters.status': 1,
		'candidates.status': 1,
	};
	try {
		const teams = await Team.aggregate([
			{
				$lookup: {
					from: CandidateDetails.collection.name,
					localField: '_id',
					foreignField: 'referred_by',
					as: 'candidates',
				},
			},
			{
				$lookup: {
					from: OfferLetter.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'offer_letters',
				},
			},
			{ $project: project },
		]);

		for (const team of teams) {
			const offer_letters = team.offer_letters;
			const candidates = team.candidates;
			let issued = 0;
			let not_issued = 0;
			let joined = 0;
			let not_responding = 0;
			offer_letters.forEach((offer_letter) => {
				if (offer_letter.status === OfferLetterStatus.ISSUED) {
					issued++;
				}
				if (offer_letter.status === OfferLetterStatus.NOT_ISSUED) {
					not_issued++;
				}
				if (offer_letter.status === OfferLetterStatus.JOINED) {
					joined++;
				}
			});
			candidates.forEach((candidate) => {
				if (candidate.status === CandidateStatus.NOT_RESPONDING_ADMISSION) {
					not_responding++;
				}
			});
			team.offer_letters = undefined;
			team.candidates = undefined;
			team.issued = issued;
			team.not_issued = not_issued;
			team.joined = joined;
			team.not_responding = not_responding;
		}

		res.status(200).json({
			success: true,
			teams,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.StateWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		date: 1,
		state: 1,
	};

	const states = {
		'Andhra Pradesh': [],
		'Andaman and Nicobar Islands': [],
		'Arunachal Pradesh': [],
		Assam: [],
		Bihar: [],
		Chandigarh: [],
		Chhattisgarh: [],
		'Dadra and Nagar Haveli': [],
		'Daman and Diu': [],
		Delhi: [],
		Goa: [],
		Gujarat: [],
		Haryana: [],
		'Himachal Pradesh': [],
		'Jammu and Kashmir': [],
		Jharkhand: [],
		Karnataka: [],
		Kerala: [],
		Lakshadweep: [],
		'Madhya Pradesh': [],
		Maharashtra: [],
		Manipur: [],
		Meghalaya: [],
		Mizoram: [],
		Nagaland: [],
		Odisha: [],
		Puducherry: [],
		Punjab: [],
		Rajasthan: [],
		Sikkim: [],
		'Tamil Nadu': [],
		Telangana: [],
		Tripura: [],
		'Uttar Pradesh': [],
		Uttarakhand: [],
		'West Bengal': [],
	};
	try {
		const state_wise_report = await CandidateDetails.aggregate([
			{
				$lookup: {
					from: OfferLetter.collection.name,
					localField: '_id',
					foreignField: 'candidate',
					as: 'offer_letters',
				},
			},
			{ $match: { 'offer_letters.status': { $eq: OfferLetterStatus.JOINED } } },
			{ $addFields: { date: '$offer_letters.updatedAt' } },
			{ $addFields: { date: { $arrayElemAt: ['$date', 0] } } },
			{ $project: project },
		]);
		for (const e of state_wise_report) {
			states[e.state].push(e.date);
		}

		res.status(200).json({
			success: true,
			states,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.IndustryWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		date: 1,
		industry: 1,
	};

	const industry = {};

	const industries = await CompanyDetail.find({}, { _id: 0, company_name: 1 });
	for (const e of industries) {
		industry[e.company_name] = [];
	}

	try {
		const industry_wise_report = await CandidateDetails.aggregate([
			{
				$lookup: {
					from: OfferLetter.collection.name,
					localField: '_id',
					foreignField: 'candidate',
					as: 'offer_letters',
				},
			},
			{ $match: { 'offer_letters.status': { $eq: OfferLetterStatus.JOINED } } },
			{ $addFields: { industry: '$offer_letters.industry' } },
			{ $addFields: { industry: { $arrayElemAt: ['$industry', 0] } } },
			{ $addFields: { date: '$offer_letters.updatedAt' } },
			{ $addFields: { date: { $arrayElemAt: ['$date', 0] } } },
			{ $project: project },
		]);

		for (const e of industry_wise_report) {
			industry[e.industry].push(e.date);
		}

		res.status(200).json({
			success: true,
			industry,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.AssignedTargets = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		date: 1,
		team: 1,
		mobile1: 1,
		qualification: 1,
		state: 1,
		fname: 1,
		email: 1,
		mobile1: 1,
		mobile2: 1,
		qualification: 1,
		aadhaar: 1,
		district: 1,
		pincode: 1,
		state: 1,
		source: 1,
		gender: 1,
		dob: 1,
		y_o_p: 1,
	};

	try {
		const target = await Target.aggregate([
			{
				$lookup: {
					from: Team.collection.name,
					localField: 'team',
					foreignField: '_id',
					as: 'team',
				},
			},
			{ $addFields: { team: '$team.name' } },
			{ $addFields: { date: '$createdAt' } },
			{ $project: project },
		]);
		return res.status(200).json({
			success: true,
			targets: target,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.CallWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		response: 1,
		// 'call_response.call_type': 1,
		// 'call_response.interested': 1,
		// 'call_response.createdAt': 1,
	};

	try {
		const teams = {};

		const _teams = await Team.find({}, { _id: 0, name: 1 });
		for (const e of _teams) {
			teams[e.name] = {
				total: 0,
				achieved: 0,
				interested: 0,
				convinced: 0,
			};
		}
		const call_wise_report = await Target.aggregate([
			{
				$lookup: {
					from: Team.collection.name,
					localField: 'team',
					foreignField: '_id',
					as: 'team',
				},
			},
			{ $addFields: { team: { $arrayElemAt: ['$team', 0] } } },
			{ $addFields: { name: '$team.name' } },
			{ $project: project },
		]);

		for (const e of call_wise_report) {
			if (!teams[e.name]) {
				continue;
			}
			teams[e.name].total++;
			if (e.response) {
				teams[e.name].achieved++;
				if (e.response === 'Interested') {
					teams[e.name].interested++;
				}
				if (e.response === 'Convinced') {
					teams[e.name].convinced++;
				}
			}
		}
		const entries = Object.entries(teams);
		const call_report = entries.map((e) => {
			const temp = {
				name: '',
				total: '',
				achieved: 0,
				interested: 0,
				convinced: 0,
			};
			temp.name = e[0];
			temp.total = e[1].total;
			temp.achieved = e[1].achieved;
			temp.interested = e[1].interested;
			temp.convinced = e[1].convinced;
			return temp;
		});
		res.status(200).json({
			success: true,
			call_wise_report: call_report,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.SourceWiseReport = async (req, res) => {
	const project = {
		_id: 0,
		opportunity: 1,
	};
	const opportunity = {
		'News Paper': 0,
		Pamphlet: 0,
		'School / College': 0,
		'Employment Exchange Office': 0,
		'E-Mail': 0,
		'Friends / Relatives': 0,
		FaceBook: 0,
		SMS: 0,
		'Tele Caller': 0,
		'NTTF Trainee Reference': 0,
		'www.nttftrg.com': 0,
		YouTube: 0,
		'Any Other': 0,
	};
	try {
		let source_wise_report = await CandidateDetails.aggregate([{ $project: project }]);
		for (const e of source_wise_report) {
			opportunity[e.opportunity]++;
		}
		source_wise_report = await Target.find();
		for (const e of source_wise_report) {
			opportunity[e.source]++;
		}

		res.status(200).json({
			success: true,
			source_wise_report: opportunity,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.MIS_Report = async (req, res) => {
	const project = {
		_id: 0,
		name: 1,
		'candidates.status': 1,
		'examinations.status': 1,
		'interviews.status': 1,
		'interviews.ignou': 1,
		'offerletters.status': 1,
	};

	try {
		const report = await Team.aggregate([
			{
				$lookup: {
					from: CandidateDetails.collection.name,
					localField: '_id',
					foreignField: 'referred_by',
					as: 'candidates',
				},
			},
			{
				$lookup: {
					from: Examination.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'examinations',
				},
			},
			{
				$lookup: {
					from: Interview.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'interviews',
				},
			},
			{
				$lookup: {
					from: OfferLetter.collection.name,
					localField: 'candidates._id',
					foreignField: 'candidate',
					as: 'offerletters',
				},
			},
			{ $project: project },
		]);

		for (const team of report) {
			const candidates = team.candidates;
			const examinations = team.examinations;
			const interviews = team.interviews;
			const offerletters = team.offerletters;
			team.candidates = undefined;
			team.examinations = undefined;
			team.interviews = undefined;
			team.offerletters = undefined;
			let exam_attended = 0;
			let exam_not_responding = 0;
			let exam_pass = 0;
			let exam_fail = 0;
			let exam_due = 0;
			let interview_pass = 0;
			let interview_fail = 0;
			let interview_due = 0;
			let interview_not_responding = 0;
			let admission_joined = 0;
			let admission_joining_soon = 0;
			let admission_not_responding = 0;
			let ignou_completed = 0;
			let ignou_due = 0;
			for (const candidate of candidates) {
				if (candidate.status === CandidateStatus.NOT_RESPONDING_EXAM) {
					exam_not_responding++;
				}
				if (candidate.status === CandidateStatus.ELIGIBLE) {
					exam_due++;
				}
				if (candidate.status === CandidateStatus.NOT_RESPONDING_INTERVIEW) {
					interview_not_responding++;
				}
				if (candidate.status === CandidateStatus.NOT_RESPONDING_ADMISSION) {
					admission_not_responding++;
				}
			}
			for (const exam of examinations) {
				if (exam.status === ExaminationStatus.PASS) {
					exam_pass++;
				}
				if (exam.status === ExaminationStatus.FAIL) {
					exam_fail++;
				}
				exam_attended++;
			}
			for (const interview of interviews) {
				if (interview.status === InterviewStatus.PASS) {
					interview_pass++;
				} else if (interview.status === InterviewStatus.FAIL) {
					interview_fail++;
				} else if (
					interview.status === InterviewStatus.NOT_SCHEDULED ||
					interview.status === InterviewStatus.SCHEDULED
				) {
					interview_due++;
				} else if (!interview.status) {
					interview_due++;
				}
				if (interview.ignou) {
					if (interview.ignou === 'Accepted' || interview.ignou === 'Already Student') {
						ignou_completed++;
					} else if (interview.ignou === 'Not Accepted') {
						ignou_due++;
					}
				}
			}
			for (const offerletter of offerletters) {
				if (offerletter.status === OfferLetterStatus.JOINED) {
					admission_joined++;
				} else if (
					offerletter.status === OfferLetterStatus.ISSUED ||
					offerletter.status === OfferLetterStatus.NOT_ISSUED
				) {
					admission_joining_soon++;
				}
			}

			team.exam_attended = exam_attended;
			team.exam_not_responding = exam_not_responding;
			team.exam_pass = exam_pass;
			team.exam_fail = exam_fail;
			team.exam_due = exam_due;
			team.interview_pass = interview_pass;
			team.interview_fail = interview_fail;
			team.interview_due = interview_due;
			team.interview_not_responding = interview_not_responding;
			team.admission_joined = admission_joined;
			team.admission_joining_soon = admission_joining_soon;
			team.admission_not_responding = admission_not_responding;
			team.ignou_completed = ignou_completed;
			team.ignou_due = ignou_due;
		}
		let data =
			'Name,Online Test Attended,Not Responding for Online Test,Online Test Pass,Online Test Fail,Online Test Due,Interview Pass,Interview Fail,Interview Due,Interview Not Responding,Joined,Joining Soon,Not Responding for Admission,IGNOU Completed,IGNOU reg Due';
		for (const team of report) {
			data += '\n';
			data += `"${team.name}",`;
			data += `"${team.exam_attended}",`;
			data += `"${team.exam_not_responding}",`;
			data += `"${team.exam_pass}",`;
			data += `"${team.exam_fail}",`;
			data += `"${team.exam_due}",`;
			data += `"${team.interview_pass}",`;
			data += `"${team.interview_fail}",`;
			data += `"${team.interview_due}",`;
			data += `"${team.interview_not_responding}",`;
			data += `"${team.admission_joined}",`;
			data += `"${team.admission_joining_soon}",`;
			data += `"${team.admission_not_responding}",`;
			data += `"${team.ignou_completed}",`;
			data += `"${team.ignou_due}"`;
		}

		const path = __basedir + '/static/assets/mis_report.csv';
		const writeToFile = (path, data, callback) => {
			fs.writeFile(path, data, 'utf8', (err) => {
				// JSON.stringify(data, null, 2) help you to write the data line by line
				if (!err) {
					callback(true);
					// successfull
				} else {
					callback(false);
					// some error (catch this error)
				}
			});
		};

		writeToFile(path, data, (result) => {
			if (result) {
				try {
					const fileName = 'MIS_Report.csv';
					const stream = fs.createReadStream(path);
					res.set({
						'Content-Disposition': `attachment; filename='${fileName}'`,
						'Content-Type': 'text/csv',
					});
					stream.pipe(res);
				} catch (e) {
					console.error(e);
					res.status(500).end();
				}
			} else {
				res.status(500).json({
					success: false,
					message: 'Unable to export MIS report',
				});
			}
		});
	} catch (e) {
		console.error(e);
		res.status(500).end();
	}
};
//---------------------------------------Company Detail---------------------------------------------------------
exports.CompanyDetails = async (req, res) => {
	try {
		const industries = await CompanyDetail.find();
		res.status(201).json({
			success: true,
			industries,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};

exports.CreateCompany = async (req, res) => {
	const { details } = req.body;
	try {
		let id = '';
		if (details._id) {
			const company = await CompanyDetail.findById(details._id);
			if (company) {
				id = details._id;
				company.company_name = details.company_name;
				company.state = details.state;
				company.term = details.term;
				company.rope_in_1 = details.rope_in_1;
				company.rope_in_2 = details.rope_in_2;
				company.rope_in_3 = details.rope_in_3;
				company.rope_in_4 = details.rope_in_4;
				company.rope_in_location = details.rope_in_location;
				company.rope_in_assistance = details.rope_in_assistance;
				company.practical_1 = details.practical_1;
				company.practical_2 = details.practical_2;
				company.practical_3 = details.practical_3;
				company.practical_4 = details.practical_4;
				await company.save();
			} else {
				return res.status(400).json({
					success: false,
					message: 'Invalid Company Id.',
				});
			}
		} else {
			const { _id } = await CompanyDetail.create({
				company_name: details.company_name,
				state: details.state,
				term: details.term,
				rope_in_1: details.rope_in_1,
				rope_in_2: details.rope_in_2,
				rope_in_3: details.rope_in_3,
				rope_in_4: details.rope_in_4,
				rope_in_location: details.rope_in_location,
				rope_in_assistance: details.rope_in_assistance,
				practical_1: details.practical_1,
				practical_2: details.practical_2,
				practical_3: details.practical_3,
				practical_4: details.practical_4,
			});
			id = _id;
		}
		return res.status(201).json({
			success: true,
			message: id,
		});
	} catch (err) {
		console.log(err);
		return res.status(500).json({
			success: false,
			message: 'Server Error',
		});
	}
};
