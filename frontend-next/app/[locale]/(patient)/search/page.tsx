import { Suspense } from 'react';
import SearchResultsView from '@/components/PatientSearch/SearchResultsView';

export default function PatientSearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
      }
    >
      <SearchResultsView />
    </Suspense>
  );
}
