import jwt from "jsonwebtoken";
import axios from "axios";

export const BackDoorSSR = async (context) => {
    const DOTS_BACKEND = process.env.NEXT_PUBLIC_DOTS_BE_END_POINT;
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
      console.log("JWT Payload after verification:", jwtPayload);
      if (jwtPayload?.partner) {
        try {
            const response = await axios.get(
                `${DOTS_BACKEND}/mapping-bp-user-types?bp=${jwtPayload?.partner}&user_role=A0001&is_active=All&per_page=10`
              );
            
              const applicationData = response.data?.data ?? [];
              if (!applicationData.length) {
                return {
                    redirect: {
                        destination: '/access-denied',
                        permanent: false,
                    },
                };
            }
            
              jwtPayload.application = applicationData;
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
    },
  };
};
