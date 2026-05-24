'use client';

import React, { useState, useRef, useEffect } from 'react';
import { FaChevronDown, FaSearch } from "react-icons/fa";

interface CustomDropdownProps {
    value: string;
    options: { value: string; label: string; subLabel?: string }[];
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'doctor' | 'service' | 'default';
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
    value,
    options,
    onChange,
    placeholder = "Select...",
    type = 'default'
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (val: string) => {
        onChange(val);
        setIsOpen(false);
        setSearchTerm("");
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white border-2 ${isOpen ? 'border-[#5B7FFF]' : 'border-[#5B7FFF]'} rounded-2xl px-5 py-4 text-[#5B7FFF] font-semibold cursor-pointer flex items-center justify-between transition-all`}
            >
                <span className={!selectedOption ? "opacity-70" : ""}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <FaChevronDown className={`transform transition-transform text-[#5B7FFF] ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 z-50">
                    {type === 'doctor' ? (
                        // Doctor Style Dropdown
                        <div className="bg-[#EBEBEB] p-5 rounded-3xl shadow-lg">
                            {/* Search Input */}
                            <div className="bg-white rounded-xl px-4 py-3 mb-4 flex items-center">
                                <FaSearch className="text-gray-400 mr-3" />
                                <input
                                    type="text"
                                    className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                                    placeholder="Поиск"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            {/* Options */}
                            <div className="space-y-3 max-h-60 overflow-y-auto">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map(option => (
                                        <div
                                            key={option.value}
                                            onClick={() => handleSelect(option.value)}
                                            className={`
                                                flex justify-between items-center px-5 py-4 rounded-2xl cursor-pointer transition-all
                                                ${value === option.value
                                                    ? 'bg-[#5B7FFF] text-white shadow-md'
                                                    : 'bg-white text-gray-900 hover:bg-gray-50'}
                                            `}
                                        >
                                            <span className="font-semibold text-base">{option.label}</span>
                                            {value === option.value && (
                                                <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-lg">
                                                    Мой врач
                                                </span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-gray-500 py-4">Нет результатов</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Service Style Dropdown
                        <div className="bg-white rounded-3xl shadow-lg border-2 border-[#5B7FFF] overflow-hidden py-2">
                            <div className="max-h-64 overflow-y-auto">
                                {options.map((option, idx) => (
                                    <div
                                        key={option.value}
                                        onClick={() => handleSelect(option.value)}
                                        className="px-6 py-4 cursor-pointer hover:bg-blue-50 transition-colors border-b border-gray-200 last:border-b-0"
                                    >
                                        <div className="font-bold text-lg text-black">
                                            {option.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CustomDropdown;
