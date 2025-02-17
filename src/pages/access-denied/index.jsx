import React from 'react';
import Head from 'next/head';
import { ShieldX, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';

const AccessDenied = () => {
    const router = useRouter();

    return (
        <>
            <Head>
                <title>Access Denied | Admin Access Required</title>
                <link rel="icon" href="/images/logo_tugu.png" />
            </Head>
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
                    <div className="p-8">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-100 rounded-full animate-ping"></div>
                                <ShieldX className="h-20 w-20 text-red-500 relative" />
                            </div>
                        </div>
                        
                        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
                            Access Denied
                        </h1>
                        
                        <div className="text-center mb-8">
                            <p className="text-gray-600 mb-4">
                                You don&apos;t have the required admin role to access this page.
                                Please contact your system administrator for assistance.
                            </p>
                            
                            <div className="text-sm text-gray-500">
                                Error Code: <span className="font-mono">ERR_NO_ADMIN_ROLE</span>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.back()}
                                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Go Back
                            </button>
                            
                            <button
                                onClick={() => window.location.href = '/dashboard'}
                                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 border-t">
                        <p className="text-sm text-gray-500 text-center">
                            If you believe this is a mistake, please contact{' '}
                            <a href="mailto:ITF.shared.services@tugu.com" className="text-blue-600 hover:underline">
                                Shared Service Support
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AccessDenied;