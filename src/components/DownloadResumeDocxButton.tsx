import { Download, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { generateResumeDocx } from '../lib/generateResumeDocx';
import { useToast } from '../contexts/ToastContext';

interface DownloadResumeDocxButtonProps {
  resumeText: string;
  candidateName: string;
  className?: string;
  showLabel?: boolean;
}

export function DownloadResumeDocxButton({
  resumeText,
  candidateName,
  className = 'btn-primary text-sm gap-2',
  showLabel = true,
}: DownloadResumeDocxButtonProps) {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleDownload = async () => {
    if (!resumeText || !candidateName) {
      toast('Missing resume data', 'error');
      return;
    }

    setLoading(true);
    try {
      await generateResumeDocx(resumeText, candidateName);
      toast('Resume downloaded successfully!', 'success');
    } catch (err) {
      console.error('Download error:', err);
      toast('Failed to download resume', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={`${className} disabled:opacity-60 disabled:cursor-not-allowed flex items-center transition-all`}
      title="Download as DOCX with black color scheme"
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {showLabel && 'Generating...'}
        </>
      ) : (
        <>
          <Download size={16} />
          {showLabel && 'Download Resume (.docx)'}
        </>
      )}
    </button>
  );
}
