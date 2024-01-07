import generateRandomString from "../../utils/generateRandomString.js";
import exchangeAuthCodeForTokenRequest from "../../helpers/exchangeAuthCodeForTokenRequest.js";
import request from "request";
import cache from "../redis.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const login = (req, res) => {
  const state = generateRandomString(16);

  res.cookie(process.env.STATE_KEY, state);
  res.redirect(
    "https://accounts.spotify.com/authorize" +
      `?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=${process.env.RESPONSE_TYPE}&scope=${process.env.SCOPE}&state=${state}`
  );
};

const callback = (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const client_redirect = process.env.CLIENT_REDIRECT;

  if (!state) {
    res.redirect(`${client_redirect}/#error=state_mismatch`);
  } else {
    res.clearCookie(process.env.STATE_KEY);

    request.post(exchangeAuthCodeForTokenRequest(code), (err, response, body) => {
      if (!err && response.statusCode === 200) {
        const session = uuidv4();
        const token = jwt.sign({ session: session }, process.env.JWT_SECRET, { expiresIn: "1h" });

        cache.setex(session, 60 * 60, body.access_token);

        res.cookie("madnessifySession", token, {
          httpOnly: true,
          sameSite: "lax",
          maxAge: 1000 * 60 * 60, //1000ms * 60s * 60m = 1h
          //secure: true,
          //signed: true,
        });

        res.redirect(`${client_redirect}`);
      } else {
        res.redirect(`${client_redirect}/#error="invalid_token"`);
      }
    });
  }
};

const check = (req, res) => {
  const madnessifyJwt = req.cookies.madnessifySession;

  if (madnessifyJwt) {
    return res.sendStatus(200);
  }

  res.sendStatus(401);
};

export { login, callback, check };