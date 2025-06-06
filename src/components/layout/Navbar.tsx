"use client";

import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon, UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const navigation = {
  common: [
    { name: 'Dashboard', href: '/dashboard', current: false },
  ],
  student: [
    { name: 'My Courses', href: '/my-courses', current: false },
    { name: 'My Assignments', href: '/my-assignments', current: false },
    { name: 'My Submissions', href: '/my-submissions', current: false },
    { name: 'Peer Reviews', href: '/peer-reviews', current: false },
  ],
  instructor: [
    { name: 'Courses', href: '/courses', current: false },
    { name: 'Assignments', href: '/assignments', current: false },
    { name: 'Peer Reviews', href: '/peer-reviews', current: false },
    { name: 'Rubrics', href: '/rubrics', current: false },
  ]
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Check localStorage for login state when component mounts
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const loginState = localStorage.getItem('isLoggedIn');
      const name = localStorage.getItem('userName');
      const role = localStorage.getItem('userRole');
      
      if (loginState === 'true') {
        setIsLoggedIn(true);
        setUserName(name || 'User');
        setUserRole(role);
      }
    }
  }, []);
  
  // Function to handle sign out
  const handleSignOut = () => {
    // Clear cookies
    document.cookie = 'isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'userName=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'userId=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
    }
    
    // Update state
    setIsLoggedIn(false);
    setUserName('');
    
    // Redirect to home page
    router.push('/');
  };
  
  // Get the appropriate navigation items based on user role
  const getNavItems = () => {
    if (!isLoggedIn) return [];
    
    const items = [...navigation.common];
    
    if (userRole === 'instructor') {
      items.push(...navigation.instructor);
    } else if (userRole === 'student') {
      items.push(...navigation.student);
    }
    
    return items;
  };
  
  return (
    <Disclosure as="nav" className="bg-indigo-800">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
            {/* Mobile menu button*/}
            <Disclosure.Button 
              className="relative inline-flex items-center justify-center rounded-md p-2 text-indigo-200 hover:bg-indigo-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setIsOpen(!isOpen)}
            >
              <span className="absolute -inset-0.5" />
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </Disclosure.Button>
          </div>
          <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
            <div className="flex flex-shrink-0 items-center">
              <Link href="/" className="text-white text-xl font-bold">PeerAssess</Link>
            </div>
            <div className="hidden sm:ml-6 sm:block">
              <div className="flex space-x-4">
                {getNavItems().map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={classNames(
                      item.current ? 'bg-indigo-900 text-white' : 'text-indigo-100 hover:bg-indigo-700 hover:text-white',
                      'rounded-md px-3 py-2 text-sm font-medium'
                    )}
                    aria-current={item.current ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
            {/* Login/Register or Profile dropdown */}
            {isLoggedIn ? (
              <Menu as="div" className="relative ml-3">
                <div>
                  <Menu.Button className="relative flex rounded-full bg-indigo-900 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-800">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-500 transition-colors">
                      {userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                  </Menu.Button>
                </div>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 flex items-center')}
                        >
                          <UserCircleIcon className="h-5 w-5 mr-2 text-gray-500" aria-hidden="true" />
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700 flex items-center')}
                        >
                          <Cog6ToothIcon className="h-5 w-5 mr-2 text-gray-500" aria-hidden="true" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={classNames(active ? 'bg-gray-100' : '', 'block w-full text-left px-4 py-2 text-sm text-gray-700 flex items-center')}
                          onClick={handleSignOut}
                        >
                          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2 text-gray-500" aria-hidden="true" />
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex space-x-2">
                <Link 
                  href="/login" 
                  className="text-indigo-100 hover:bg-indigo-700 hover:text-white rounded-md px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link href="/register" className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-md px-3 py-2 text-sm font-medium">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Disclosure.Panel className="sm:hidden">
        <div className="space-y-1 px-2 pb-3 pt-2">
          {getNavItems().map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={classNames(
                item.current ? 'bg-indigo-900 text-white' : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                'block rounded-md px-3 py-2 text-base font-medium'
              )}
              aria-current={item.current ? 'page' : undefined}
            >
              {item.name}
            </Link>
          ))}
          {!isLoggedIn && (
            <>
              <Link
                href="/login"
                className="text-indigo-200 hover:bg-indigo-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-indigo-200 hover:bg-indigo-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium"
              >
                Register
              </Link>
            </>
          )}
          {isLoggedIn && (
            <>
              <Link
                href="/profile"
                className="text-indigo-200 hover:bg-indigo-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium flex items-center"
              >
                <UserCircleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Your Profile
              </Link>
              <Link
                href="/settings"
                className="text-indigo-200 hover:bg-indigo-700 hover:text-white block rounded-md px-3 py-2 text-base font-medium flex items-center"
              >
                <Cog6ToothIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="text-indigo-200 hover:bg-indigo-700 hover:text-white block w-full text-left rounded-md px-3 py-2 text-base font-medium flex items-center"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" aria-hidden="true" />
                Sign out
              </button>
            </>
          )}
        </div>
      </Disclosure.Panel>
    </Disclosure>
  );
} 