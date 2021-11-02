import UserModel from "../models/user.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

import { validationResult } from "express-validator";

dotenv.config();

class UserController {
	// POST /auth/signup
	signup = (req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			const err = new Error("Validation fail");
			err.statusCode = 422;
			err.data = errors.array();
			throw err;
		}

		const email = req.body.email;
		const name = req.body.name;
		const password = req.body.password;

		//hash pw
		bcrypt
			.hash(password, 12)
			.then((hashPassword) => {
				const user = new UserModel({
					email: email,
					name: name,
					password: hashPassword,
				});
				return user.save();
			})
			.then((result) => {
				res.status(200).json({
					message: "Signup successful",
					userId: result._id,
				});
			})
			.catch((err) => {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			});
	};

	login = (req, res, next) => {
		const email = req.body.email;
		const password = req.body.password;

		let loadedUser;

		UserModel.findOne({ email: email })
			.then((user) => {
				if (!user) {
					const err = new Error("Wrong email address");
					err.statusCode = 400;
					throw err;
				}
				loadedUser = user;

				return bcrypt.compare(password,loadedUser.password);
			})
			.then((result) => {
				if (!result) {
					const err = new Error("Wrong password");
					err.statusCode = 400;
					throw err;
				}

				// generate token
				const token = jwt.sign(
					{
						email: loadedUser.email,
						userId: loadedUser._id.toString(),
					},
					process.env.JWT_SECRET_KEY,
					{ expiresIn: "1h" },
				);

				res.status(200).json({
					token,
					userId: loadedUser._id.toString(),
				})

			})
			.catch((err) => {
				if (!err.statusCode) {
					err.statusCode = 500;
				}
				next(err);
			});
	};
}

export default UserController;
