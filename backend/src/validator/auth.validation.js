import { body, validationResult } from "express-validator";

const validation = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Showing error using error handler
    const error = new Error("Validation failed!");
    error.status = 400;
    error.errors = errors.array();

    next(error);
  }

  next();
};

export const registerValidator = [
  body("username").trim().notEmpty().withMessage("Username is required"),

  body("email").trim().isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  validation,
];

export const loginValidator = [
  body("email").trim().isEmail().withMessage("Invalid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  validation,
];

export const resetPasswordValidator = [
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  validation,
];
