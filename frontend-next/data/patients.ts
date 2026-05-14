export interface Patient {
    id: number;
    name: string;
    age: number;
    phone: string;
    diagnosis: string;
    status: string;
    statusColor: string;
    img: string;
    gender?: string;
    birthDate?: string;
    doctor?: string;
}
