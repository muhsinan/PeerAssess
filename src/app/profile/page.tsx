"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCircleIcon, EnvelopeIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import Navbar from '@/components/layout/Navbar';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        if (!isLoggedIn || isLoggedIn !== 'true') {
          router.push('/login');
          return;
        }

        const userId = localStorage.getItem('userId');
        
        if (!userId) {
          setError("User ID not found. Please login again.");
          setLoading(false);
          return;
        }
        
        // Get basic data from localStorage as a fallback
        const userName = localStorage.getItem('userName') || '';
        const userRole = localStorage.getItem('userRole') || '';
        let userEmail = localStorage.getItem('userEmail') || '';
        
        // Try to fetch the latest user data from the API
        try {
          const response = await fetch(`/api/auth/user?userId=${userId}`);
          
          if (response.ok) {
            const data = await response.json();
            
            // Update the user state with data from the API
            setUser({
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
            });
            
            // Also update localStorage for future reference
            localStorage.setItem('userName', data.user.name);
            localStorage.setItem('userEmail', data.user.email);
            localStorage.setItem('userRole', data.user.role);
          } else {
            // If API request fails, fall back to local storage data
            setUser({
              name: userName,
              email: userEmail,
              role: userRole,
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Fall back to local storage data
          setUser({
            name: userName,
            email: userEmail,
            role: userRole,
          });
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Profile error:", error);
        setError("Failed to load profile. Please try again.");
        setLoading(false);
      }
    }

    fetchUserData();
  }, [router]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-center text-gray-900 mb-4">
              {error}
            </h3>
            <div className="mt-6">
              <button 
                onClick={() => router.push('/login')}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Return to Login
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
              <div className="flex flex-col items-center sm:flex-row sm:items-center">
                <div className="h-24 w-24 rounded-full bg-white p-1 shadow-lg mb-4 sm:mb-0 sm:mr-6 flex items-center justify-center">
                  <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{user.name || 'User'}</h1>
                  <p className="text-indigo-100 mt-1">{user.email}</p>
                  <span className="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-medium bg-indigo-800 text-white">
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Profile details */}
            <div className="px-6 py-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
              
              <div className="space-y-6">
                <div className="flex items-start border-b border-gray-200 pb-4">
                  <UserCircleIcon className="h-6 w-6 text-indigo-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Full name</h3>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{user.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start border-b border-gray-200 pb-4">
                  <EnvelopeIcon className="h-6 w-6 text-indigo-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Email address</h3>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <AcademicCapIcon className="h-6 w-6 text-indigo-500 mt-1 flex-shrink-0" />
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    <p className="mt-1 text-sm text-gray-900 font-medium">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4">
              <button className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 