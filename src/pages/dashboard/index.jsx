import React, { useState, useEffect } from "react";
import { withAuthSSR } from "../../utils/WithAuthSSR";
import { Search } from "lucide-react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import axios from "axios";
import useAxiosJWT from "../../hooks/JwtHook";
import { jwtDecode } from "jwt-decode";
import { showErrorToast } from "../../utils/toastUtils";
import { ToastContainer } from "react-toastify";
import ProfileDropdown from "./Profile";
import Head from "next/head";

const Dashboard = ({ jwtPayload, accessToken }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [token, setToken] = useState(null);
  const [expire, setExpire] = useState(null);
  const router = useRouter();
  const APIEndpoint = `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT}`;

  useEffect(() => {
    let isMounted = true;
    const refreshToken = async () => {
      if (token && expire && expire > Date.now() / 1000) {
        return;
      }

      try {
        const response = await axios.get(`${APIEndpoint}/token`, {
          withCredentials: true,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        if (isMounted) {
          const newToken = response.data.data.token;
          setToken(newToken);
          const decoded = jwtDecode(newToken);
          setExpire(decoded.exp);
        }
      } catch (error) {
        showErrorToast("Error refreshing token:", error);
        router.push("/login");
      }
    };

    refreshToken();

    return () => {
      isMounted = false;
    };
  }, []);

  const axiosJWT = useAxiosJWT({
    token,
    expire,
    setToken,
    setExpire,
    APIEndpoint,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchImage = async () => {
      if (profileImage || !token || !jwtPayload?.partner) {
        if (!jwtPayload?.partner) {
          showErrorToast(`Partner ID not available`);
        }
        return;
      }

      try {
        const response = await axiosJWT.get(
          `${APIEndpoint}/image/${jwtPayload.partner}`,
          {
            headers: {
              "Cache-Control": "max-age=3600",
            },
          }
        );

        if (
          isMounted &&
          response.status === 200 &&
          response.data?.data?.image_data
        ) {
          setProfileImage(response.data.data.image_data);
        } else {
          showErrorToast("No image data available");
        }
      } catch (error) {
        showErrorToast(`Error fetching image data: ${error}`);
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [token, jwtPayload?.partner, axiosJWT, profileImage]);

  if (!jwtPayload) {
    return (
      <div className="text-red-600 font-bold text-justify text-5xl">
        Access Denied
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      Cookies.remove("refresh_token");

      const response = await axios.delete(
        `${APIEndpoint}/logout?email=${encodeURIComponent(jwtPayload.email)}`,
        {
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        if (response.should_redirect && response.redirect_url) {
          window.location.href = data.redirect_url;
        } else {
          router.push("/login");
        }
      } else {
        showErrorToast("Failed to logout");
      }

      signOut({ callbackUrl: "/login" });
    } catch (error) {
      showErrorToast(`Error logging out: ${error}`);
    }
  };
  const filteredApps =
    jwtPayload?.application?.filter((app) =>
      app.app_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const AppCard = ({ app }) => {
    const logoMap = {
      DOTS: "/images/dots_logo.png",
      TKYC: "/images/tkyc.png",
      default: "/images/logo_tugu.png",
    };

    function parseUrl(url) {
      // Check if the URL contains '${token}'
      if (url.includes("${token}")) {
        // Replace '${token}' with actual token
        return url.replace("${token}", accessToken);
      }

      // Return the original URL if no '${token}' is found
      return url;
    }
    return (
      <div className="group">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <a
            href={parseUrl(app.app_url)}
            rel="noopener noreferrer"
            className="block p-6"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-36 h-36 mb-2 transform transition-transform duration-300 group-hover:scale-110">
                <Image
                  src={logoMap[app.app_name] || logoMap.default}
                  alt={app.app_name}
                  layout="fill"
                  objectFit="contain"
                  className="drop-shadow-xl"
                />
              </div>
              <h3 className="text-lg font-semibold text-black transition-colors duration-300 group-hover:text-blue-800">
                {app.app_name}
              </h3>
            </div>
          </a>
        </div>
      </div>
    );
  };

  if (!jwtPayload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-red-600 font-bold text-5xl animate-pulse">
          Access Denied
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>TOA | My Dashboard</title>
        <link rel="icon" href="/images/logo_tugu.png" />
        <meta name="Tugu Office Application" content="TOA APP!" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar */}
        <nav className="bg-white shadow-md z-50">
          <div className="min-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              {/* Left side */}
              <div className="flex items-center">
                <Image
                  src="/images/logo_tugu.png"
                  alt="Tugu Insurance"
                  width={90}
                  height={30}
                  className="ml-2"
                />
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center flex-1 max-w-md ml-8">
                <div className="relative w-full">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white  focus:border-transparent"
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      color: "black",
                      caretColor: "black",
                    }}
                  />
                </div>
              </div>

              <div className="flex relative items-center">
                <ProfileDropdown
                  profileImage={profileImage}
                  jwtPayload={jwtPayload}
                  isDropdownOpen={isDropdownOpen}
                  setDropdownOpen={setDropdownOpen}
                  handleLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </nav>

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#212b69] to-green-700 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {jwtPayload.name}!
            </h1>
            <p className="text-blue-100">
              Access all your Tugu applications from one place
            </p>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-grow min-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 md:mx-32 mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Your Applications
            </h2>

            {/* Mobile Search */}
            <div className="md:hidden mb-6">
              <div className="relative text-black">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="text-black placeholder-gray-500 block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-transparent"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    color: "black",
                    caretColor: "black",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredApps.length > 0 ? (
                filteredApps.map((app, index) => (
                  <AppCard key={index} app={app} />
                ))
              ) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm
                        ? "No matching applications found"
                        : "No applications available"}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm
                        ? "Try adjusting your search term"
                        : "Contact support to get access to applications"}
                    </p>
                    <a
                      href="mailto:ITF.shared.services@tugu.com"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Contact Support
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Image
                  src="/images/logo_tugu.png"
                  alt="Tugu Insurance"
                  width={80}
                  height={30}
                />
              </div>
              <p className="text-gray-500 text-sm">
                Copyright © {new Date().getFullYear()} Tugu Insurance. All
                rights reserved.
              </p>
            </div>
          </div>
        </footer>

        <ToastContainer />
      </div>
    </>
  );
};

export default Dashboard;

export const getServerSideProps = withAuthSSR;
