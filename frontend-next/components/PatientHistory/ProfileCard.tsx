'use client';

const avatar = "/assets/img/photos/Dentist.png";

interface PatientHistoryProfile {
  name: string;
  id: string;
  dob: string;
  gender: string;
  phone: string;
  registrationDate: string;
}

interface ProfileCardProps {
  profile: PatientHistoryProfile;
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <div className="bg-linear-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-[2rem] p-6 md:p-8 flex flex-col md:flex-row gap-8 relative shadow-[0_18px_50px_rgba(37,99,235,0.22)] text-white overflow-hidden">
      <div className="absolute inset-y-0 right-0 w-40 bg-white/10 blur-3xl pointer-events-none" />

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-1">
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70">Patient ID</p>
          <p className="text-lg md:text-2xl font-black">{profile.id}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70">Tug'ilgan sana</p>
          <p className="text-lg md:text-2xl font-black">{profile.dob}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70">Jinsi</p>
          <p className="text-lg md:text-2xl font-black">{profile.gender}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70">Telefon</p>
          <p className="text-lg md:text-2xl font-black">{profile.phone}</p>
        </div>
        <div className="space-y-0.5 sm:col-span-2">
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-70">Davolanish boshlangan sana</p>
          <p className="text-lg md:text-2xl font-black">{profile.registrationDate}</p>
        </div>
      </div>

      <div className="relative z-1 flex items-center justify-center md:justify-end">
        <div className="rounded-[2rem] bg-white/10 p-3 backdrop-blur-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt={profile.name} className="w-28 h-28 md:w-40 md:h-40 object-cover rounded-[1.5rem]" />
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
