import SearchBar from '@/components/PatientHome/SearchBar';
import UpcomingAppointment from '@/components/PatientHome/UpcomingAppointment';
import SuggestedDoctors from '@/components/PatientHome/SuggestedDoctors';
import ServicesGrid from '@/components/PatientHome/ServicesGrid';
import QuickActionsGrid from '@/components/PatientHome/QuickActionsGrid';

export default function PatientHomePage() {
  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto w-full">
      <SearchBar />
      <UpcomingAppointment />
      <SuggestedDoctors />
      <ServicesGrid />
      <QuickActionsGrid />
    </div>
  );
}
