import {Message} from '@/types/messages';
import BaseMessageBubble from './BaseMessageBubble';

interface MessageBubbleProps {
    message: Message;
}

export default function MessageBubble({message}: MessageBubbleProps) {
    return (
        <BaseMessageBubble
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
        />
    );
}
