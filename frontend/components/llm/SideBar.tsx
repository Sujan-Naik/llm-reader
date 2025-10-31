import React, {useEffect, useState} from 'react';
import {HeadedButton, HeadedCard, VariantEnum} from 'headed-ui';

interface HeaderProps {
    messageCount: number;
    onClearChat: () => void;
}

export default function SideBar({messageCount, onClearChat}: HeaderProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const handleWindowBlur = () => {
            setIsExpanded(false); // Collapse the sidebar when the window loses focus
        };

        window.addEventListener('blur', handleWindowBlur);
        return () => {
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, []);

    return (
        <>
            {/* Sidebar */}
            <div
                style={{
                    position: 'fixed',
                    left: isExpanded ? 0 : -250, // Adjust based on sidebar width
                    top: 0,
                    height: '100vh',
                    width: '250px',
                    transition: 'left 0.3s',
                    zIndex: 1000,
                }}
            >
                <HeadedCard
                    variant={VariantEnum.Secondary}
                    style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <HeadedButton
                        variant={VariantEnum.Tertiary}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '←' : '→'}
                    </HeadedButton>

                    {isExpanded && (
                        <>
                            <HeadedCard variant={VariantEnum.Tertiary}>
                                <h2>AI Assistant</h2>
                            </HeadedCard>

                            <HeadedCard variant={VariantEnum.Tertiary}>
                                <p>{messageCount} messages</p>
                            </HeadedCard>

                            <HeadedButton variant={VariantEnum.Tertiary} onClick={onClearChat}>
                                Clear Chat
                            </HeadedButton>
                        </>
                    )}
                </HeadedCard>
            </div>

            {/* Clickable Icon */}
            {!isExpanded && (
                <div
                    style={{
                        position: 'fixed',
                        left: -30, // Position it slightly outside of the sidebar
                        top: '50%', // Center vertically
                        transform: 'translateY(-50%)',
                        zIndex: 999,
                        cursor: 'pointer',
                        transition: 'left 0.3s',
                    }}
                    onClick={() => setIsExpanded(true)}
                >
                    <HeadedButton variant={VariantEnum.Tertiary}>→</HeadedButton> {/* Icon or button */}
                </div>
            )}
        </>
    );
}