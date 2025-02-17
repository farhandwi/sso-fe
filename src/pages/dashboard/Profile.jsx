import React from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import Image from 'next/image';

const ProfileDropdown = ({ profileImage, jwtPayload, isDropdownOpen, setDropdownOpen, handleLogout }) => {
    const displayName = jwtPayload?.name || 'User';
  return (
    <>
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="relative w-8 h-8 overflow-hidden rounded-full ring-2 ring-blue-500 flex items-center justify-center bg-gray-100">
          <Image
            src={profileImage ? `data:image/png;base64,${profileImage}` : '/images/user-circle.png'}
            alt="Profile"
            layout="fill"
            objectFit="cover"
            className="rounded-full"
          />
        </div>
        <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[150px] truncate">
            {displayName}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg overflow-hidden border border-gray-100">
          <button
            onClick={() => {
              handleLogout();
              setDropdownOpen(false);
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 group"
          >
            <LogOut className="h-4 w-4 mr-2 text-gray-500 group-hover:text-gray-700" />
            <span className="group-hover:text-gray-900">Sign out</span>
          </button>
        </div>
      )}
    </div>
    </>
  );
};

export default ProfileDropdown;