import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* About Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="lg:text-center">
            <h1 className="text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              About Peercept
            </h1>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Learn more about our AI-powered peer assessment platform
            </p>
          </div>

          <div className="mt-16">
            <div className="max-w-4xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-8">
                <div className="prose prose-lg text-gray-700">
                  <p className="mb-4">
                    This project is created by <strong>Erkan Er</strong> and <strong>Muhammed Sinan</strong> and developed within the scope of <strong>TÜBITAK 323K213</strong>.
                  </p>
                  <p className="mb-4">
                    Peercept is an innovative AI-powered peer assessment platform designed to revolutionize the way students learn and educators teach. Our platform combines the power of artificial intelligence with peer feedback to create a comprehensive learning environment that promotes fairness, consistency, and educational growth.
                  </p>
                  <p className="mb-4">
                    Through AI algorithms, we ensure that peer assessments are conducted with minimal bias while providing students with detailed, constructive feedback. This approach not only enhances learning outcomes but also develops critical thinking and evaluation skills among students.
                  </p>
                  <p>
                    Our mission is to make peer assessment more effective, fair, and accessible to educational institutions worldwide, supporting both students and educators in their academic journey.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Development Team Section */}
          <div className="mt-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Development Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center">
                    <div className="h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">EE</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Erkan Er</h3>
                    <p className="text-sm text-gray-500 mt-2">TUBITAK 323K213 Project</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <div className="text-center">
                    <div className="h-20 w-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-2xl font-bold">MS</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Muhammed Sinan</h3>
                    <p className="text-sm text-gray-500 mt-2">TUBITAK 323K213 Project</p>
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
