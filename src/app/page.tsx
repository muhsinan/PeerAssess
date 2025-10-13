import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-800 to-purple-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block">Transform your</span>
                <span className="block text-indigo-300">assessment experience</span>
              </h1>
              <p className="mt-6 text-xl leading-8 text-gray-100">
                Peercept is an AI-powered platform that enables fair, efficient, and insightful peer assessment for students and educators.
              </p>
              <div className="mt-10 flex gap-4 items-center flex-col sm:flex-row sm:justify-center lg:justify-start">
                <Link href="/register" 
                  className="rounded-md bg-white px-6 py-3 text-lg font-medium text-indigo-800 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150">
                  Get Started
                </Link>
                <Link href="/features" 
                  className="rounded-md border border-white px-6 py-3 text-lg font-medium text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150">
                  Learn More
                </Link>
              </div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <div className="bg-white/10 backdrop-blur-sm sm:max-w-md sm:w-full sm:mx-auto sm:rounded-lg sm:overflow-hidden shadow-xl">
                <div className="px-6 py-8 sm:px-10">
                  <div className="relative h-72 w-full rounded-lg overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center bg-indigo-900/80 text-white text-center p-8">
                      <p className="text-xl font-semibold">
                        Interactive assessment interface with AI-powered feedback
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-lg font-semibold text-indigo-600">Advantages</h2>
            <p className="mt-2 text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              A better way to assess and learn
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Our platform combines the power of peer feedback with AI assistance to create a rich learning environment.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="rounded-lg px-6 pb-8">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 text-center">Fair Assessment</h3>
                    <p className="mt-2 text-base text-gray-500 text-center">
                      AI-assisted grading ensures consistency and reduces bias in peer reviews.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="rounded-lg px-6 pb-8">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 text-center">Personalized Feedback</h3>
                    <p className="mt-2 text-base text-gray-500 text-center">
                      Students receive detailed, constructive feedback from multiple perspectives.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="rounded-lg px-6 pb-8">
                  <div className="flex justify-center">
                    <div className="h-12 w-12 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 text-center">AI-Enhanced Learning</h3>
                    <p className="mt-2 text-base text-gray-500 text-center">
                      Our AI suggests improvements and identifies patterns in feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
