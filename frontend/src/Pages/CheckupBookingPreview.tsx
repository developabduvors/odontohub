import React, { useState } from 'react';
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import DentistImg from "../assets/img/photos/Dentist.png";
import DoctorInfoCard from "../components/PatientAppointmentDetail/DoctorInfoCard";
import AppointmentDetailsCard from "../components/PatientAppointmentDetail/AppointmentDetailsCard";
import PriceCard from "../components/PatientAppointmentDetail/PriceCard";
import ReviewModal from "../components/PatientAppointmentDetail/ReviewModal";

const CheckupBookingPreview = () => {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const appointment = {
        title: "Осмотр",
        date: "25 сентябрь",
        time: "16:00",
        doctor: {
            name: "Махмуд Пулатов",
            direction: "Ортодонтия",
            experience: "3 года",
            rating: "4.7",
            image: DentistImg
        },
        details: {
            status: "завершён",
            date: "25.10.2025",
            duration: "20 минут",
            tip: "Пусто",
            notes: ""
        },
        price: "20.000сум"
    };

    const handleReviewSubmit = (rating: number, comment: string) => {
        console.log("Review Submitted:", { rating, comment });
        // Here you would typically send data to API
        setIsModalOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] p-4 md:p-8 flex flex-col font-sans max-w-5xl mx-auto w-full relative">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-[#1D1D2B] rounded-full flex items-center justify-center text-white shrink-0"
                >
                    <FaArrowLeft />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-[#1D1D2B] text-2xl font-black leading-tight">
                        {appointment.title}
                    </h1>
                    <p className="text-[#1D1D2B] text-lg font-bold">
                        {appointment.date} | {appointment.time}
                    </p>
                </div>
            </div>

            <div className="space-y-6 pb-12">
                <DoctorInfoCard doctor={appointment.doctor} />
                <AppointmentDetailsCard details={appointment.details} />
                <PriceCard price={appointment.price} />

                {/* Re-implementing the yellow Review button locally since the shared component changed */}
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-[#FBBC05] text-white text-lg md:text-xl font-bold py-4 rounded-2xl shadow-md hover:bg-[#e0a800] transition-colors"
                >
                    Оценить и оставить отзыв
                </button>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleReviewSubmit}
            />
        </div>
    );
};

export default CheckupBookingPreview;
