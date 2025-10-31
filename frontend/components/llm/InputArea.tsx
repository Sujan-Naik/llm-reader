import React, {useEffect, useRef} from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import {HeadedButton, VariantEnum} from 'headed-ui';

interface InputAreaProps {
    query: string;
    setQuery: (query: string) => void;
    onSend: () => void;
    loading: boolean;
}

export default function InputArea({query, setQuery, onSend, loading}: InputAreaProps) {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
    };

    useEffect(() => {
        if (!loading && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [loading]);

    return (
        <div
            className="no-print"
            style={{
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--background-secondary)',
                boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
                width: '100%',
                padding: '10px 0', // Added padding to avoid content touching edges
                overflow: 'hidden',

            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start', // Align items to the start
                    overflow: 'hidden',
                }}
            >
                <TextareaAutosize
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    minRows={2}
                    maxRows={6}
                    disabled={loading}
                    placeholder="Type your message here... (Shift+Enter for new line)"
                    style={{
                        flex: 1,
                        padding: '15px 20px',
                        border: '2px solid var(--border-color)',
                        borderRadius: '25px',
                        outline: 'none',
                        fontSize: '15px',
                        fontFamily: 'inherit',
                        resize: 'none', // Disable manual resizing
                        overflow: 'hidden', // Prevent scrollbars
                        backgroundColor: loading ? 'var(--disabled)' : 'var(--background-primary)',
                        color: loading ? 'var(--foreground-tertiary)' : 'var(--foreground-primary)',
                        boxSizing: 'border-box', // Ensure padding is included in width/height calculations
                    }}
                />
                <HeadedButton
                    variant={VariantEnum.Secondary}
                    onClick={() => {
                        onSend();
                        if (textareaRef.current) {
                            textareaRef.current.focus();
                        }
                    }}
                    disabled={loading || !query.trim()}
                >
                    {loading ? '●●●' : 'Send'}
                </HeadedButton>
            </div>
        </div>
    );
}