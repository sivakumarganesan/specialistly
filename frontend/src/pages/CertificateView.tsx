import React, { useState, useEffect } from 'react';
import { Download, Share2, Copy, Award } from 'lucide-react';
import * as coursesAPI from '../api/coursesAPI';

interface CertificateData {
  _id: string;
  certificateId: string;
  courseName: string;
  courseType: string;
  customerName: string;
  specialistName: string;
  issueDate: string;
  pdfUrl: string;
  verifyUrl: string;
}

interface CertificateViewProps {
  certificateId: string;
}

const CertificateView: React.FC<CertificateViewProps> = ({ certificateId }) => {
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const response = await coursesAPI.getCertificate(certificateId);
        setCertificate(response.data.data);
      } catch (error) {
        console.error('Error fetching certificate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificate();
  }, [certificateId]);

  const handleCopyLink = () => {
    if (certificate?.verifyUrl) {
      navigator.clipboard.writeText(certificate.verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await coursesAPI.downloadCertificate(certificateId);
      // In production, this would generate and download a PDF
      window.open(response.data.data.pdfUrl, '_blank');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading certificate...</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="bg-red-50 text-red-700 p-6 rounded-lg text-center">
          <p className="text-lg font-semibold">Certificate not found</p>
          <p className="text-sm mt-2">The certificate you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const issueDate = new Date(certificate.issueDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-100 rounded-full">
              <Award className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Certificate of Completion</h1>
          <p className="text-gray-600">Congratulations on completing the course!</p>
        </div>

        {/* Certificate Card */}
        <div className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8">
          {/* Certificate Background */}
          <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-12 text-white">
            <div className="border-4 border-white rounded-lg p-12 text-center">
              <p className="text-sm tracking-widest uppercase mb-4 opacity-90">Certificate of Achievement</p>
              <h2 className="text-4xl font-bold mb-8">{certificate.customerName}</h2>
              <p className="text-lg mb-2">has successfully completed the course</p>
              <p className="text-3xl font-bold mb-8">{certificate.courseName}</p>
              <div className="flex justify-between text-sm opacity-90">
                <div>
                  <p className="text-xs uppercase tracking-wider">Instructor</p>
                  <p className="text-lg font-semibold">{certificate.specialistName}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider">Date Issued</p>
                  <p className="text-lg font-semibold">
                    {issueDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider">Certificate ID</p>
                  <p className="text-lg font-semibold">{certificate.certificateId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-8">
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">Course Type</p>
                <p className="text-lg font-semibold text-gray-900">
                  {certificate.courseType === 'self-paced' ? '🎯 Self-Paced' : '👥 Cohort-Based'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 uppercase tracking-wider mb-2">Issued Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {issueDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Verification Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-900 mb-2 font-semibold">Certificate Verification</p>
              <p className="text-xs text-blue-800 mb-3">
                This certificate can be verified using the link below:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={certificate.verifyUrl}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded text-xs font-mono text-blue-900"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded font-semibold text-sm transition"
                >
                  {copied ? <span className="flex items-center gap-1"><Copy className="w-4 h-4" /> Copied</span> : 'Copy'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-semibold transition flex-1 sm:flex-none"
              >
                <Download className="w-5 h-5" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => {
                  const text = `I just completed "${certificate.courseName}" and earned a certificate! Check it out: ${certificate.verifyUrl}`;
                  navigator.share?.({
                    title: 'Certificate of Achievement',
                    text,
                    url: certificate.verifyUrl,
                  });
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold transition flex-1 sm:flex-none"
              >
                <Share2 className="w-5 h-5" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Certificate Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Certificate ID</p>
              <p className="text-sm font-mono text-gray-900 break-all">{certificate.certificateId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Recipient</p>
              <p className="text-sm text-gray-900">{certificate.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Instructor</p>
              <p className="text-sm text-gray-900">{certificate.specialistName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase tracking-wider mb-2">Course</p>
              <p className="text-sm text-gray-900">{certificate.courseName}</p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <a
            href="/my-courses"
            className="inline-block text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            ← Back to My Courses
          </a>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
