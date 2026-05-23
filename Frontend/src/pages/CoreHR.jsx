import { useSearchParams } from 'react-router-dom';
import { Briefcase, TrendingUp } from 'lucide-react';

import CandidateMaster from './coreHr/CandidateMaster';
import OfferLetterMaster from './coreHr/OfferLetterMaster';
import RelievingLetterMaster from './coreHr/RelievingLetterMaster';
import ExperienceLetterMaster from './coreHr/ExperienceLetterMaster';
import NoticeLetterMaster from './coreHr/NoticeLetterMaster';
import ConfirmationLetterMaster from './coreHr/ConfirmationLetterMaster';

const CoreHR = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'Candidates';

  return (
    <div className="space-y-6 p-0">
      {/* 1. Styled Premium Glassmorphism Page Banner Header (Compact) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 py-5 px-6 md:py-6 md:px-8 shadow-lg border border-blue-100/50">
        {/* Animated ambient backdrop blobs */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-56 h-56 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-25 animate-pulse" />
        
        <div className="relative z-10 flex flex-col items-start gap-2 text-left">
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight flex items-center gap-2 m-0">
            <TrendingUp className="w-6 h-6 text-emerald-300 animate-pulse" /> Core HR Suite: {activeTab}
          </h1>
          <p className="text-indigo-100 text-xs md:text-sm font-medium max-w-3xl m-0">
            Manage candidates recruitment, dynamic variable replacement, and instant document generation for offer letters, relieving parameters, notice schedules, experience certifications, and probation reviews.
          </p>
        </div>
      </div>

      {/* 2. Content Switching Body */}
      <div className="w-full space-y-6">
        {activeTab === 'Candidates' ? (
          <CandidateMaster />
        ) : activeTab === 'Offer Letters' ? (
          <OfferLetterMaster />
        ) : activeTab === 'Relieving Letters' ? (
          <RelievingLetterMaster />
        ) : activeTab === 'Experience Letters' ? (
          <ExperienceLetterMaster />
        ) : activeTab === 'Notice Letters' ? (
          <NoticeLetterMaster />
        ) : activeTab === 'Confirmation Letters' ? (
          <ConfirmationLetterMaster />
        ) : (
          <div className="bg-white p-12 rounded-3xl text-center text-gray-500 font-bold">
            Sub-module tab "{activeTab}" is loading...
          </div>
        )}
      </div>
    </div>
  );
};

export default CoreHR;
