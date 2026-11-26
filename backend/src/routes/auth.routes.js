import crypto from "crypto";
import { Router } from "express";
import passport from "passport";
import {
  getMeController,
  googleCallbackController,
  loginController,
  logoutController,
  registerController,
} from "../controllers/auth.controller.js";
import {
  registerValidator,
  loginValidator,
} from "../validator/auth.validation.js";
import { identifyUser } from "../middlewares/auth.middleware.js";

const authRouter = Router();

const OAUTH_STATE_COOKIE = "oauth_state";
const getFrontendLoginErrorUrl = () =>
  `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=google_failed`;

const getStateCookieOptions = () => ({
  httpOnly: true,
  maxAge: 5 * 60 * 1000,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
});

authRouter.post("/register", registerValidator, registerController);
authRouter.post("/login", loginValidator, loginController);
authRouter.get("/get-me", identifyUser, getMeController);
authRouter.get("/logout", identifyUser, logoutController);

authRouter.get("/google", (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie(OAUTH_STATE_COOKIE, state, getStateCookieOptions());

    return passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
      state,
    })(req, res, (err) => {
      if (err) {
        return res.redirect(getFrontendLoginErrorUrl());
      }
      return next();
    });
  } catch {
    return res.redirect(getFrontendLoginErrorUrl());
  }
});

authRouter.get("/google/callback", (req, res, next) => {
  const failureRedirect = getFrontendLoginErrorUrl();
  try {
    const queryState = req.query?.state;
    const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];

    res.clearCookie(OAUTH_STATE_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (
      typeof queryState !== "string" ||
      typeof cookieState !== "string" ||
      !queryState ||
      queryState.length !== cookieState.length ||
      !crypto.timingSafeEqual(
        Buffer.from(queryState, "utf8"),
        Buffer.from(cookieState, "utf8"),
      )
    ) {
      return res.redirect(failureRedirect);
    }

    return passport.authenticate(
      "google",
      { session: false, failureRedirect },
      (err, user) => {
        if (err || !user) {
          return res.redirect(failureRedirect);
        }
        req.user = user;
        return googleCallbackController(req, res, next);
      },
    )(req, res, next);
  } catch {
    return res.redirect(failureRedirect);
  }
});

export default authRouter;
