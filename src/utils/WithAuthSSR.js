import jwt from "jsonwebtoken";
import axios from "axios";

export const withAuthSSR = async (context) => {
  const { req } = context;
  const cookies = req.headers.cookie || "";

  const cookieObj = cookies.split(";").reduce((acc, cookie) => {
    const [name, value] = cookie.trim().split("=");
    acc[name] = decodeURIComponent(value);
    return acc;
  }, {});

  const accessToken = cookieObj["refresh_token"] || null;
  let jwtPayload = null;
  if (accessToken) {
    try {
      jwtPayload = jwt.verify(
        accessToken,
        process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN
      );
      if (jwtPayload?.partner) {
        try {
          const response = await axios({
            method: "GET",
            url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}/role/all/${jwtPayload.email}`,
          });

          jwtPayload = {
            ...jwtPayload,
            application: response.data.toa,
          };
        } catch (error) {
          console.error(
            "Failed to fetch application data:",
            error.response?.data || error.message
          );
          jwtPayload.application = null;
        }
      }
    } catch (error) {
      console.error("JWT verification failed:", error);
      jwtPayload = null;
    }
  }

  return {
    props: {
      jwtPayload,
      accessToken,
    },
  };
};
