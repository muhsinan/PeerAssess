"use client";

import { Fragment, useState, useEffect } from 'react';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', current: false },
  { name: 'Submit Assignment', href: '/submit-assignment', current: false },
  { name: 'Peer Reviews', href: '/peer-reviews', current: false },
  { name: 'My Submissions', href: '/my-submissions', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Mock authentication state
  
  // Check localStorage for login state when component mounts
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const loginState = localStorage.getItem('isLoggedIn');
      if (loginState === 'true') {
        setIsLoggedIn(true);
      }
    }
  }, []);
  
  // Function to toggle login state for demonstration
  const toggleLogin = () => {
    const newState = !isLoggedIn;
    setIsLoggedIn(newState);
    
    // Update localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('isLoggedIn', newState ? 'true' : 'false');
    }
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
                {navigation.map((item) => (
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
                    <div className="h-8 w-8 rounded-full flex items-center justify-center bg-indigo-600 text-white">
                      US
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
                          className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                        >
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                        >
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(active ? 'bg-gray-100' : '', 'block px-4 py-2 text-sm text-gray-700')}
                          onClick={toggleLogin}
                        >
                          Sign out
                        </a>
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
                  onClick={(e) => {
                    // For demo: Allow login by clicking the login button directly with Ctrl key
                    if (e.ctrlKey) {
                      e.preventDefault();
                      toggleLogin();
                    }
                  }}
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
          {navigation.map((item) => (
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
        </div>
      </Disclosure.Panel>
    </Disclosure>
  );
} 