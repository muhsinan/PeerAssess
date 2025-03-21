import Layout from "../../components/layout/Layout";
import Link from "next/link";

export default function Dashboard() {
  // Mock data - would be fetched from API in real app
  const pendingReviews = [
    { id: 1, title: "Essay on Climate Change", dueDate: "2024-04-15", author: "Batuhan Sariaslan", progress: 0 },
    { id: 2, title: "Research Paper: Artificial Intelligence Ethics", dueDate: "2024-04-20", author: "Muhammed Sinan", progress: 25 },
  ];

  const mySubmissions = [
    { id: 1, title: "Literature Review: Modernism", submitDate: "2024-03-10", reviewsReceived: 3, reviewsTotal: 5 },
    { id: 2, title: "Project Proposal: Renewable Energy", submitDate: "2024-03-15", reviewsReceived: 2, reviewsTotal: 5 },
  ];

  const recentFeedback = [
    { id: 1, title: "Programming Assignment: Data Structures", receivedDate: "2024-03-18", score: 85, reviewer: "Anonymous" },
  ];

  return (
    <Layout>
      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-black">Dashboard</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            {/* Welcome Card */}
            <div className="px-4 py-6 sm:px-0 mb-8">
              <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-lg shadow-md p-6 text-white">
                <h2 className="text-xl font-semibold mb-2">Welcome back, Muhammed</h2>
                <p className="text-indigo-100">You have {pendingReviews.length} pending reviews and {recentFeedback.length} recent feedback.</p>
              </div>
            </div>

            <div className="px-4 sm:px-0">
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* Pending Reviews */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                    <h3 className="text-lg font-medium leading-6 text-indigo-800">Pending Reviews</h3>
                    <p className="mt-1 text-sm text-gray-500">Assignments that need your assessment</p>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    {pendingReviews.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {pendingReviews.map((review) => (
                          <li key={review.id} className="py-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-md font-medium text-black">{review.title}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Due: {review.dueDate}
                                </span>
                              </div>
                              <p className="text-sm text-black">By: {review.author}</p>
                              
                              {/* Progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-indigo-600 h-2.5 rounded-full" 
                                  style={{ width: `${review.progress}%` }}
                                ></div>
                              </div>
                              
                              <div className="mt-2">
                                <Link 
                                  href={`/peer-reviews/${review.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  {review.progress > 0 ? 'Continue Review' : 'Start Review'}
                                </Link>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No pending reviews</p>
                    )}
                  </div>
                </div>
                
                {/* Recent Feedback */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                    <h3 className="text-lg font-medium leading-6 text-indigo-800">Recent Feedback</h3>
                    <p className="mt-1 text-sm text-gray-500">Feedback on your submissions</p>
                  </div>
                  <div className="px-4 py-5 sm:p-6">
                    {recentFeedback.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {recentFeedback.map((feedback) => (
                          <li key={feedback.id} className="py-4">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-md font-medium text-black">{feedback.title}</h4>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Score: {feedback.score}/100
                                </span>
                              </div>
                              <p className="text-sm text-black">Received: {feedback.receivedDate}</p>
                              <div className="mt-2">
                                <Link 
                                  href={`/feedback/${feedback.id}`}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                  View Feedback
                                </Link>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No recent feedback</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* My Submissions */}
              <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium leading-6 text-indigo-800">My Submissions</h3>
                      <p className="mt-1 text-sm text-gray-500">Your submitted assignments</p>
                    </div>
                    <Link 
                      href="/submit-assignment"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      New Submission
                    </Link>
                  </div>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Review Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {mySubmissions.map((submission) => (
                          <tr key={submission.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                              {submission.title}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {submission.submitDate}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              <div className="flex items-center">
                                <span className="mr-2">
                                  {submission.reviewsReceived}/{submission.reviewsTotal} reviews
                                </span>
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-indigo-600 h-2 rounded-full" 
                                    style={{ width: `${(submission.reviewsReceived / submission.reviewsTotal) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Link 
                                href={`/my-submissions/${submission.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
} 