import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { showErrorToast } from "../../utils/toastUtils";
import { ToastContainer } from 'react-toastify';
import Head from "next/head";

const LoginComponent = () => {
  const router = useRouter();
  const [payload, setPayload] = useState(null);
  const [isPayloadLoaded, setIsPayloadLoaded] = useState(false);

  const base64Decode = (base64Str) => {
    try {
      return decodeURIComponent(escape(window.atob(base64Str)));
    } catch (error) {
      showErrorToast(`Error decoding Base64 string: ${error}`);
      return null;
    }
  };

  useEffect(() => {
    const query = router.query;

    if (query.redirect) {
      const decodedValue = base64Decode(query.redirect);
      setPayload(decodedValue);
    } else {
      
    }

    setIsPayloadLoaded(true);
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      signIn("azure-ad", {
        callbackUrl: payload || `${process.env.NEXTAUTH_URL}/dashboard`,
        redirect: false,
      })
        .then((result) => {
          if (result?.error) {
            showErrorToast("An error occurred during sign in");
          } else {
            router.push(`${process.env.NEXTAUTH_URL}/dashboard`);
          }
        })
        .catch((err) => {
          showErrorToast(`Error Occured: ${err}`);
        })
        .finally(() => {
          console.log("finally");
        });
    } catch (error) {
      showErrorToast("An error occurred during sign in");
    }
  };

  useEffect(() => {
    document.cookie =
      "access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0";
  }, []);

  return (
    <>
    <Head>
        <title>TOA | Login</title>
        <link rel="icon" href="/images/logo_tugu.png" />
        <meta name="Tugu Office Application" content="TOA APP!" />
    </Head>
    <div className="relative min-h-screen flex items-center justify-center bg-[url('/images/background-login.png')] bg-cover bg-center">
      <ToastContainer />
      <div className="absolute inset-0 bg-black opacity-60 p-20"></div>
      <div className="relative bg-gray-100 p-8 rounded-lg shadow-md w-96 z-10">
        <h2 className="text-xl font-bold text-center mb-6 text-black">LOGIN</h2>
        <div className="flex justify-center mb-10">
          <Image
            src={"/images/logo_tugu.png"}
            alt="Tugu Logo"
            width={150}
            height={50}
          />
        </div>
        <p className="text-center text-black mb-6 px-10 font-sans">
          Please log in by following the button below
        </p>
        <div
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 hover:cursor-pointer flex items-center"
          onClick={handleSubmit}
        >
          <Image
            src={"/images/microsoft-logo.svg"}
            alt="Microsoft Logo"
            width={32}
            height={32}
            className="ml-4"
          />
          <p className="ml-8">Sign in with Microsoft</p>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginComponent;