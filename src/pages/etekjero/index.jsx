import Image from "next/image";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from "next/head";
import { useState } from "react";
import axios from "axios";
import { BackDoorSSR } from "../../utils/BackdoorSSR";

const EtekJero = ({ jwtPayload }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    console.log(jwtPayload, 'HEHEHHEHE');
    
    async function fetchUserInfo() {
        let partner = '';
        let cost_center = '';
        let listApplication;
        
        try {
            if (!email) {
                throw new Error('Email is required');
            }

            const data = { mail: email };
            
            const bpEmployeeResponse = await fetch(
                `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT || ''}/bp/email/${encodeURIComponent(email)}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            
            if (bpEmployeeResponse.ok) {
                const bpData = await bpEmployeeResponse.json();
                if (bpData?.data?.[0]) {
                    partner = bpData.data[0].BP;
                    cost_center = bpData.data[0].cost_center;
                }

                try {
                    listApplication = await axios({
                        method: 'GET',
                        url: `${process.env.NEXT_PUBLIC_BPMS_BE_END_POINT || ''}/list-application/${encodeURIComponent(email)}`,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });
                } catch (axiosError) {
                    console.error('Error fetching list application:', axiosError);
                    listApplication = { data: { listApplication: '' } };
                }

            } else if (bpEmployeeResponse.status === 404) {
                console.warn('User not found in BP system');
            } else {
                throw new Error(`Failed to fetch user data: ${bpEmployeeResponse.status}`);
            }

            return {
                email: data.mail || data.userPrincipalName || email,
                name: data.displayName || '',
                jobTitle: data.jobTitle || '',
                partner: partner || '',
                cost_center: cost_center || '',
                photoUrl: '',
                listApplication: listApplication?.data?.listApplication || ''
            };
        } catch (error) {
            console.error('Error in fetchUserInfo:', error);
            throw new Error(
                error && typeof error === 'object' && 'message' in error
                    ? error.message
                    : 'Failed to fetch user information'
            );
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            if (!email || !password) {
                throw new Error('Email and password are required');
            }
    
            const userInfo = await fetchUserInfo();
            
            if (!userInfo) {
                throw new Error('Failed to fetch user information');
            }
    
            const response = await fetch('/api/backdoor/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInfo }),
                credentials: 'include',
            });
    
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Login failed');
            }
    
            window.location.href = process.env.NEXT_PUBLIC_DOTS_URL || 'https://intraapps.tugu.com/dots/dashhboard';
    
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
            
            console.error('Login error:', err);
            toast.error(errorMessage, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };
  
    return (
        <>
            <Head>
                <title>TOA | Login</title>
                <link rel="icon" href="/images/logo_tugu.png" />
                <meta name="Tugu Office Application" content="TOA APP!" />
            </Head>
            <div className="relative min-h-screen flex items-center justify-center bg-[url('/images/background-login.png')] bg-cover bg-center">
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="light"
                />
                <div className="absolute inset-0 bg-black opacity-60"></div>
                <div className="relative bg-gray-100 p-8 rounded-lg shadow-md w-96 z-10">
                    <div className="flex justify-center mb-8">
                        <Image
                            src="/images/logo_tugu.png"
                            alt="Tugu Logo"
                            width={150}
                            height={50}
                        />
                    </div>
    
                    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="Enter your email"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <input
                                type="password"
                                id="password"
                                onChange={(e) => setPassword(e.target.value)}
                                name="password"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                placeholder="Enter your password"
                            />
                        </div>
    
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default EtekJero;

export const getServerSideProps = BackDoorSSR;