'use client';

import { useState, useEffect } from 'react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
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
                    Terms and Conditions
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
                      <h4 className="font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h4>
                      <p>
                        By creating an account and using Peercept, you agree to be bound by these Terms and Conditions. 
                        If you do not agree to these terms, please do not use our service.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">2. Description of Service</h4>
                      <p>
                        Peercept is an educational platform that facilitates peer review assignments and feedback among students. 
                        The service allows instructors to create assignments, manage courses, and students to submit work and 
                        provide peer reviews.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">3. User Accounts and Responsibilities</h4>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>You must provide accurate and complete information when creating an account</li>
                        <li>You are responsible for maintaining the security of your account credentials</li>
                        <li>You must not share your account with others</li>
                        <li>You must notify us immediately of any unauthorized use of your account</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">4. Academic Integrity</h4>
                      <p>
                        Users must maintain academic integrity when using Peercept. This includes:
                      </p>
                      <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                        <li>Submitting original work only</li>
                        <li>Providing honest and constructive peer reviews</li>
                        <li>Not plagiarizing or copying others' work</li>
                        <li>Following your institution's academic policies</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">5. Content and Intellectual Property</h4>
                      <p>
                        You retain ownership of content you submit to Peercept. However, by using the service, you grant us 
                        a license to store, process, and display your content as necessary to provide the service.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">6. Privacy and Data Protection</h4>
                      <p>
                        We take your privacy seriously. Your personal information and academic work are protected according to 
                        our Privacy Policy. We will not share your data with third parties without your consent, except as 
                        required by law.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">7. Prohibited Uses</h4>
                      <p>You may not use Peercept to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4 mt-2">
                        <li>Violate any laws or regulations</li>
                        <li>Harass, threaten, or abuse other users</li>
                        <li>Upload malicious content or viruses</li>
                        <li>Attempt to gain unauthorized access to the system</li>
                        <li>Use the service for commercial purposes without permission</li>
                      </ul>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">8. Service Availability</h4>
                      <p>
                        We strive to keep Peercept available at all times, but we cannot guarantee uninterrupted service. 
                        We may need to perform maintenance or updates that temporarily affect availability.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">9. Limitation of Liability</h4>
                      <p>
                        Peercept is provided "as is" without warranties. We are not liable for any damages arising from 
                        your use of the service, including but not limited to academic consequences or data loss.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">10. Termination</h4>
                      <p>
                        We may suspend or terminate your account if you violate these terms. You may delete your account 
                        at any time by contacting us. Upon termination, your access to the service will cease.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">11. Changes to Terms</h4>
                      <p>
                        We may update these Terms and Conditions from time to time. We will notify users of significant 
                        changes. Continued use of the service after changes constitutes acceptance of the new terms.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">12. Governing Law</h4>
                      <p>
                        These terms are governed by the laws of the jurisdiction where Peercept operates. Any disputes 
                        will be resolved in the appropriate courts of that jurisdiction.
                      </p>
                    </section>

                    <section>
                      <h4 className="font-semibold text-gray-900 mb-2">13. Contact Information</h4>
                      <p>
                        If you have questions about these Terms and Conditions, please contact us through the platform 
                        or at our support email address.
                      </p>
                    </section>

                    <div className="border-t pt-4 mt-6">
                      <p className="text-xs text-gray-500">
                        These terms constitute the entire agreement between you and Peercept regarding the use of our service.
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
