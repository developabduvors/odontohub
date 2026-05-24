'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from '@/i18n/navigation';
import { ChevronDown, Check, SlidersHorizontal, X } from 'lucide-react';

const goBackIcon = '/assets/img/icons/GoBack.svg';

interface DoctorFiltersProps {
    searchTerm: string;
    onSearchChange: (term: string) => void;
    region: string;
    onRegionChange: (r: string) => void;
    district: string;
    onDistrictChange: (d: string) => void;
    specialty: string;
    onSpecialtyChange: (s: string) => void;
    rating: string;
    onRatingChange: (rate: string) => void;
}

interface DropdownOption { value: string; label: string; }

interface CustomDropdownProps {
    value: string;
    onChange: (val: string) => void;
    options: DropdownOption[];
    active?: boolean;
    placeholder?: string;
}

// ─── O'zbekiston viloyatlari va tumanlar ma'lumotlari ───
const REGIONS: DropdownOption[] = [
    { value: 'all', label: 'Barcha hududlar' },
    { value: 'toshkent_shahar', label: "Toshkent shahri" },
    { value: 'toshkent_vil', label: "Toshkent viloyati" },
    { value: 'samarqand', label: "Samarqand viloyati" },
    { value: 'fargona', label: "Farg'ona viloyati" },
    { value: 'andijon', label: "Andijon viloyati" },
    { value: 'namangan', label: "Namangan viloyati" },
    { value: 'buxoro', label: "Buxoro viloyati" },
    { value: 'qashqadaryo', label: "Qashqadaryo viloyati" },
    { value: 'surhondaryo', label: "Surxondaryo viloyati" },
    { value: 'jizzax', label: "Jizzax viloyati" },
    { value: 'sirdaryo', label: "Sirdaryo viloyati" },
    { value: 'xorazm', label: "Xorazm viloyati" },
    { value: 'qoraqalpog', label: "Qoraqalpog'iston" },
    { value: 'navoiy', label: "Navoiy viloyati" },
];

const DISTRICTS_BY_REGION: Record<string, DropdownOption[]> = {
    toshkent_shahar: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'yunusabad', label: "Yunusobod" },
        { value: 'chilonzor', label: "Chilonzor" },
        { value: 'mirabad', label: "Mirobod" },
        { value: 'sergeli', label: "Sergeli" },
        { value: 'shayxontohur', label: "Shayxontohur" },
        { value: 'uchtepa', label: "Uchtepa" },
        { value: 'yakkasaroy', label: "Yakkasaroy" },
        { value: 'olmazor', label: "Olmazor" },
        { value: 'bektemir', label: "Bektemir" },
        { value: 'hamza', label: "Hamza" },
        { value: 'yangihayot', label: "Yangihayot" },
    ],
    toshkent_vil: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'angren', label: "Angren" },
        { value: 'bekabad', label: "Bekobod" },
        { value: 'chirchiq', label: "Chirchiq" },
        { value: 'olmaliq', label: "Olmaliq" },
        { value: 'nurafshon', label: "Nurafshon" },
    ],
    samarqand: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'samarqand_shahar', label: "Samarqand shahri" },
        { value: 'kattaqo`rg`on', label: "Kattaqo'rg'on" },
        { value: 'jomboy', label: "Jomboy" },
    ],
    fargona: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'fargona_shahar', label: "Farg'ona shahri" },
        { value: 'qo`qon', label: "Qo'qon" },
        { value: 'marg`ilon', label: "Marg'ilon" },
    ],
    namangan: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'namangan_shahar', label: "Namangan shahri" },
        { value: 'chortoq', label: "Chortoq" },
    ],
    buxoro: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'buxoro_shahar', label: "Buxoro shahri" },
        { value: 'gijduvon', label: "G'ijduvon" },
        { value: 'kogon', label: "Kogon" },
    ],
    andijon: [
        { value: 'all', label: "Barcha tumanlar" },
        { value: 'andijon_shahar', label: "Andijon shahri" },
        { value: 'asaka', label: "Asaka" },
        { value: 'shahrixon', label: "Shahrixon" },
    ],
};

const SPECIALTIES: DropdownOption[] = [
    { value: '', label: 'Barcha yo`nalishlar' },
    { value: 'therapist', label: 'Terapevt' },
    { value: 'surgeon', label: 'Xirurg' },
    { value: 'orthopedist', label: 'Ortoped' },
    { value: 'orthodontist', label: 'Ortodont' },
    { value: 'periodontist', label: 'Parodontolog' },
    { value: 'pediatric', label: 'Bolalar stomatologi' },
    { value: 'hygienist', label: 'Gigiyenist' },
];

const getDistrictKeywords = (district: string): string[] => {
    const map: Record<string, string[]> = {
        yunusabad: ['yunusobod', 'yunusabad', 'юнусабад'],
        chilonzor: ['chilonzor', 'чиланзар', 'chilandzar'],
        mirabad: ['mirobod', 'mirabad', 'мирабад'],
        sergeli: ['sergeli', 'сергели'],
        shayxontohur: ['shayxontohur', 'шайхантахур'],
        uchtepa: ['uchtepa', 'учтепа'],
        yakkasaroy: ['yakkasaroy', 'яккасарай'],
        olmazor: ['olmazor', 'олмазор'],
        bektemir: ['bektemir', 'бектемир'],
        yangihayot: ['yangihayot', 'янгихаёт'],
        angren: ['angren', 'ангрен'],
        bekabad: ['bekobod', 'bekabad', 'bekobod'],
        chirchiq: ['chirchiq', 'чирчик'],
        olmaliq: ['olmaliq', 'алмалык'],
        nurafshon: ['nurafshon', 'нурафшон'],
    };
    return map[district] || [district];
};

const getRegionKeywords = (region: string): string[] => {
    const map: Record<string, string[]> = {
        toshkent_shahar: ['toshkent', 'ташкент', 'tashkent'],
        toshkent_vil: ['toshkent viloyat', 'ташкентская область'],
        samarqand: ['samarqand', 'самарканд'],
        fargona: ["farg'ona", 'фергана', 'fergana'],
        andijon: ['andijon', 'андижан'],
        namangan: ['namangan', 'наманган'],
        buxoro: ['buxoro', 'бухара', 'bukhara'],
        qashqadaryo: ['qashqadaryo', 'кашкадарья', 'qarshi', 'qарши'],
        surhondaryo: ['surxondaryo', 'сурхандарья', 'termiz'],
        jizzax: ['jizzax', 'джизак'],
        sirdaryo: ['sirdaryo', 'сырдарья', 'guliston'],
        xorazm: ['xorazm', 'хорезм', 'urganch'],
        qoraqalpog: ["qoraqalpog'iston", 'каракалпакстан', 'nukus'],
        navoiy: ['navoiy', 'навои'],
    };
    return map[region] || [region];
};

const CustomDropdown = ({ value, onChange, options, active, placeholder }: CustomDropdownProps) => {
    const [open, setOpen] = useState(false);
    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const ref = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const selected = options.find(o => o.value === value);
    const displayLabel = selected ? selected.label : (placeholder || options[0]?.label || '');

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleOpen = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            setMenuStyle({
                position: 'fixed',
                top: rect.bottom + 6,
                left: Math.min(rect.left, window.innerWidth - 200),
                zIndex: 9999,
                minWidth: 180,
                maxHeight: 280,
                overflowY: 'auto',
            });
        }
        setOpen(o => !o);
    };

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                ref={btnRef}
                onClick={handleOpen}
                className={`flex items-center gap-1 font-bold py-2 px-3 sm:px-4 rounded-full text-xs sm:text-sm transition-all active:scale-95 whitespace-nowrap ${
                    active
                        ? 'bg-[#4D71F8] text-white shadow-md shadow-blue-400/30'
                        : 'bg-gray-100 text-[#1D1D2B] hover:bg-gray-200'
                }`}
            >
                {displayLabel}
                <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div style={menuStyle} className="rounded-2xl shadow-2xl border border-gray-100 overflow-hidden bg-white">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-blue-50 ${
                                value === opt.value ? 'text-[#4D71F8] bg-blue-50/50' : 'text-[#1D1D2B]'
                            }`}
                        >
                            {opt.label}
                            {value === opt.value && <Check size={13} className="text-[#4D71F8] ml-2" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const DoctorFilters = ({
    searchTerm, onSearchChange,
    region, onRegionChange,
    district, onDistrictChange,
    specialty, onSpecialtyChange,
    rating, onRatingChange,
}: DoctorFiltersProps) => {
    const router = useRouter();
    const [showFilters, setShowFilters] = useState(false);

    const districtOptions = region && region !== 'all' && DISTRICTS_BY_REGION[region]
        ? DISTRICTS_BY_REGION[region]
        : [{ value: 'all', label: "Barcha tumanlar" }];

    const activeFilterCount = [
        region && region !== 'all',
        district && district !== 'all',
        specialty && specialty !== '',
        rating && rating !== '',
    ].filter(Boolean).length;

    const handleRegionChange = (r: string) => {
        onRegionChange(r);
        onDistrictChange('all'); // Reset district on region change
    };

    const clearAll = () => {
        onRegionChange('all');
        onDistrictChange('all');
        onSpecialtyChange('');
        onRatingChange('');
    };

    return (
        <div className="flex flex-col gap-2 mb-3">
            {/* Search row */}
            <div className="flex items-center gap-2">
                <button onClick={() => router.back()} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={goBackIcon} alt="Go back" className="w-10 h-10 sm:w-12 sm:h-12" />
                </button>
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="Stomatologlarni qidiring..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-[#E8E8E8] rounded-2xl py-2.5 sm:py-3 px-4 sm:px-5 pr-11 text-sm text-gray-600 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black rounded-full w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-800 transition-colors active:scale-95">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>

                {/* Filter toggle */}
                <button
                    onClick={() => setShowFilters(v => !v)}
                    className={`shrink-0 relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${
                        showFilters || activeFilterCount > 0
                            ? 'bg-[#4D71F8] text-white shadow-md shadow-blue-400/30'
                            : 'bg-gray-100 text-[#1D1D2B] hover:bg-gray-200'
                    }`}
                >
                    <SlidersHorizontal size={18} />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                            {activeFilterCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Filter pills — always visible main filters */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {/* Region */}
                <CustomDropdown
                    value={region}
                    onChange={handleRegionChange}
                    options={REGIONS}
                    active={region !== 'all'}
                />

                {/* District — only show if region has districts */}
                {region !== 'all' && districtOptions.length > 1 && (
                    <CustomDropdown
                        value={district}
                        onChange={onDistrictChange}
                        options={districtOptions}
                        active={district !== 'all'}
                    />
                )}

                {/* Specialties */}
                <CustomDropdown
                    value={specialty}
                    onChange={onSpecialtyChange}
                    active={specialty !== ''}
                    options={SPECIALTIES}
                    placeholder="Yo'nalish"
                />

                {/* Rating */}
                <CustomDropdown
                    value={rating}
                    onChange={onRatingChange}
                    active={rating !== ''}
                    options={[
                        { value: '', label: 'Reyting' },
                        { value: 'high', label: '⭐ Yuqori' },
                        { value: 'low', label: '🔽 Past' },
                    ]}
                />

                {/* Clear all if any active */}
                {activeFilterCount > 0 && (
                    <button
                        onClick={clearAll}
                        className="flex items-center gap-1 bg-red-50 text-red-500 border border-red-100 font-bold py-2 px-3 rounded-full text-xs whitespace-nowrap hover:bg-red-100 transition-colors active:scale-95"
                    >
                        <X size={12} />
                        Tozalash
                    </button>
                )}
            </div>
        </div>
    );
};

export { getDistrictKeywords, getRegionKeywords };
export default DoctorFilters;
