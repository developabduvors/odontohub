'use client';

import { useParams } from 'next/navigation';
import ChatsView from '@/components/Chat/ChatsView';

export default function ChatDetailPage() {
    const params = useParams<{ id: string }>();
    const appointmentId = parseInt(params?.id || '0', 10);
    return <ChatsView appointmentId={appointmentId} />;
}
