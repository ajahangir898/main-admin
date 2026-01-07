import React from 'react';

interface AdminNoticeTickerProps {
  noticeText?: string | null;
}

export const AdminNoticeTicker: React.FC<AdminNoticeTickerProps> = ({ noticeText }) => {
  if (!noticeText) return null;

  return (
    <div className="w-full bg-white border-b border-gray-100 py-1.5 overflow-hidden">
      <div className="relative overflow-hidden">
        <div className="admin-notice-ticker">
          <span className="text-sm">{noticeText}</span>
        </div>
      </div>
    </div>
  );
};

// RR