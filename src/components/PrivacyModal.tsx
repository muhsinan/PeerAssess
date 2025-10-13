'use client';

import { useState, useEffect } from 'react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacyModal({ isOpen, onClose }: PrivacyModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Delay hiding to allow fade out animation
      const timer = setTimeout(() => setIsVisible(false), 150);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }

    // Cleanup function to restore scroll
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className={`fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full ${
          isOpen ? 'opacity-100 translate-y-0 sm:scale-100' : 'opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95'
        }`}>
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Privacy Policy
                  </h3>
                  <button
                    onClick={onClose}
                    className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mt-2 max-h-96 overflow-y-auto pr-2">
                  <div className="text-sm text-gray-700 space-y-4">
                    <p className="text-gray-500 text-xs">
                      Last updated: {new Date().toLocaleDateString()}
                    </p>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">1. Information We Collect</h4>
                      <p className="mb-2">We collect the following types of information:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Account Information:</strong> Name, email address, role (student/instructor)</li>
                        <li><strong>Academic Content:</strong> Assignments, submissions, peer reviews, and feedback</li>
                        <li><strong>Usage Data:</strong> How you interact with our platform, including login times and features used</li>
                        <li><strong>Technical Data:</strong> IP address, browser type, device information for security and performance</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">2. How We Use Your Information</h4>
                      <p className="mb-2">We use your information to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Provide and maintain the Peercept service</li>
                        <li>Facilitate peer review assignments and feedback</li>
                        <li>Enable communication between instructors and students</li>
                        <li>Improve our platform and user experience</li>
                        <li>Ensure security and prevent fraud</li>
                        <li>Comply with legal obligations</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">3. Information Sharing</h4>
                      <p className="mb-2">We may share your information in the following circumstances:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li><strong>Within Courses:</strong> Your academic work may be shared with instructors and peer reviewers as part of the educational process</li>
                        <li><strong>Educational Institution:</strong> We may share data with your school or university as required</li>
                        <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
                        <li><strong>Service Providers:</strong> With trusted third parties who help us operate our platform (under strict confidentiality agreements)</li>
                      </ul>
                      <p className="mt-2">
                        <strong>We do not sell your personal information to third parties.</strong>
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">4. Data Security</h4>
                      <p>
                        We implement appropriate security measures to protect your personal information, including:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                        <li>Encryption of data in transit and at rest</li>
                        <li>Regular security assessments and updates</li>
                        <li>Access controls and authentication measures</li>
                        <li>Secure hosting infrastructure</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">5. Data Retention</h4>
                      <p>
                        We retain your information for as long as necessary to provide our services and comply with legal obligations. 
                        Academic records may be retained longer for educational purposes. You may request deletion of your account 
                        and personal data, subject to legal and educational requirements.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">6. Your Rights</h4>
                      <p className="mb-2">You have the right to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Access and review your personal information</li>
                        <li>Request corrections to inaccurate data</li>
                        <li>Request deletion of your account and data (subject to educational requirements)</li>
                        <li>Opt out of non-essential communications</li>
                        <li>Export your data in a portable format</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">7. Cookies and Tracking</h4>
                      <p>
                        We use cookies and similar technologies to maintain your session, remember your preferences, and analyze 
                        platform usage. You can control cookie settings in your browser, though some features may not work 
                        properly without them.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">8. Third-Party Services</h4>
                      <p>
                        Our platform may integrate with third-party educational tools and services. These services have their 
                        own privacy policies, and we encourage you to review them. We are not responsible for the privacy 
                        practices of third-party services.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">9. International Data Transfers</h4>
                      <p>
                        Your information may be processed and stored in countries other than your own. We ensure appropriate 
                        safeguards are in place to protect your data during international transfers.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">10. Children's Privacy</h4>
                      <p>
                        Peercept is designed for educational use. If you are under 18, please ensure you have parental 
                        consent before using our service. We take additional measures to protect the privacy of minor users.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">11. Changes to This Policy</h4>
                      <p>
                        We may update this Privacy Policy from time to time. We will notify users of significant changes 
                        through the platform or email. Your continued use of Peercept after changes constitutes acceptance 
                        of the updated policy.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">12. Contact Us</h4>
                      <p>
                        If you have questions about this Privacy Policy or your personal data, please contact us through 
                        the platform or at our designated privacy contact email.
                      </p>
                    </section>

                    <div className="border-t pt-4 mt-6">
                      <p className="text-xs text-gray-500">
                        This Privacy Policy works in conjunction with our Terms and Conditions to govern your use of Peercept.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
