"use client"
import {useEffect, useRef, useState} from 'react'
import {Message} from '@/types/messages'
import SideBar from '@/components/llm/SideBar'
import MessageList from '@/components/llm/MessageList'
import InputArea from '@/components/llm/InputArea'
import {autoIndentCode} from '@/lib/utils/codeUtils'
import {useTheme} from "headed-ui";
import {useClickThrough} from "@/hooks/useClickThrough";

type CostInfo = {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    inputCost: number
    outputCost: number
    totalCost: number
    latencyMs?: number
    model?: string
}

type ChatTotals = {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    totalCost: number
}

const OPENAI_PRICING = {
    "gpt-5": {input: 1.25, output: 10.00},
    "gpt-5-mini": {input: 0.25, output: 2.00},
    "gpt-5-nano": {input: 0.05, output: 0.40},
    "gpt-5-chat-latest": {input: 1.25, output: 10.00},
    "gpt-4.1": {input: 2.00, output: 8.00},
    "gpt-4.1-mini": {input: 0.40, output: 1.60},
    "gpt-4.1-nano": {input: 0.10, output: 0.40},
    "gpt-4o": {input: 2.50, output: 10.00},
    "gpt-4o-2024-05-13": {input: 5.00, output: 15.00},
    "gpt-4o-mini": {input: 0.15, output: 0.60},
    "o3": {input: 2.00, output: 8.00},
    "o4-mini": {input: 1.10, output: 4.40},
    "o3-mini": {input: 1.10, output: 4.40},
    "o1-mini": {input: 1.10, output: 4.40},
    "gpt-4-turbo": {input: 10.00, output: 30.00},
    "gpt-3.5-turbo": {input: 0.50, output: 1.50},
} as const;

const GROK_PRICING = {
    "grok-code-fast-1": {input: 0.20, output: 1.50, context: 256000},
    "grok-4-fast-reasoning": {input: 0.20, output: 0.80, context: 2000000},
    "grok-4-fast-non-reasoning": {input: 0.20, output: 0.80, context: 2000000},
    "grok-4-0709": {input: 5.00, output: 15.00, context: 256000},
    "grok-3-mini": {input: 0.30, output: 0.50, context: 131072},
    "grok-3": {input: 3.00, output: 15.00, context: 131072},
} as const;

const PRICING = {...OPENAI_PRICING, ...GROK_PRICING} as const;

const AVAILABLE_MODELS = [
    {id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI'},
    {id: 'gpt-5-mini', name: 'GPT-5 Mini', provider: 'OpenAI'},
    {id: 'gpt-5-nano', name: 'GPT-5 Nano', provider: 'OpenAI'},
    {id: 'gpt-5-chat-latest', name: 'GPT-5 Chat Latest', provider: 'OpenAI'},
    {id: 'gpt-4.1', name: 'GPT-4.1', provider: 'OpenAI'},
    {id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI'},
    {id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI'},
    {id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI'},
    {id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI'},
    {id: 'gpt-4o-2024-05-13', name: 'GPT-4o (2024-05-13)', provider: 'OpenAI'},
    {id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI'},
    {id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI'},
    {id: 'o3', name: 'o3', provider: 'OpenAI'},
    {id: 'o4-mini', name: 'o4-mini (efficient reasoning)', provider: 'OpenAI'},
    {id: 'o3-mini', name: 'o3-mini', provider: 'OpenAI'},
    {id: 'o1-mini', name: 'o1-mini', provider: 'OpenAI'},
    {id: 'grok-code-fast-1', name: 'Grok-Code-Fast-1', provider: 'xAI'},
    {id: 'grok-4-fast-reasoning', name: 'Grok-4-Fast Reasoning', provider: 'xAI'},
    {id: 'grok-4-fast-non-reasoning', name: 'Grok-4-Fast Non-Reasoning', provider: 'xAI'},
    {id: 'grok-4-0709', name: 'Grok-4-0709', provider: 'xAI'},
    {id: 'grok-3-mini', name: 'Grok-3 Mini', provider: 'xAI'},
    {id: 'grok-3', name: 'Grok-3', provider: 'xAI'},
] as const;

type ModelId = typeof AVAILABLE_MODELS[number]['id'];

export default function Page() {
    const [messages, setMessages] = useState<Message[]>([])
    const [query, setQuery] = useState('')
    const [loading, setLoading] = useState(false)
    const [currentResponse, setCurrentResponse] = useState('')
    const [selectedModel, setSelectedModel] = useState<ModelId>('gpt-4o-mini')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [focusStreaming, setFocusStreaming] = useState(true)
    const [behavior, setBehavior] = useState<'auto' | 'smooth'>('auto')

    const [lastTurnCost, setLastTurnCost] = useState<CostInfo | null>(null)
    const [chatTotals, setChatTotals] = useState<ChatTotals>({
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
    })

    const STORAGE_KEYS = {
        messages: 'chat.messages.v1',
        totals: 'chat.totals.v1',
        model: 'chat.model.v1',
    }

    function reviveMessages(raw: unknown): Message[] {
        if (!Array.isArray(raw)) return []
        return raw.map((m: any) => ({
            ...m,
            timestamp: m?.timestamp ? new Date(m.timestamp) : new Date()
        }))
    }

    function safeParse<T>(str: string | null, fallback: T): T {
        if (!str) return fallback
        try {
            return JSON.parse(str) as T
        } catch {
            return fallback
        }
    }

    const hydrated = useRef(false)

    useEffect(() => {
        try {
            const msgRaw = localStorage.getItem(STORAGE_KEYS.messages)
            const loadedMessages = reviveMessages(safeParse(msgRaw, []))
            if (loadedMessages.length) setMessages(loadedMessages)

            const totalsRaw = localStorage.getItem(STORAGE_KEYS.totals)
            const loadedTotals = safeParse<ChatTotals | null>(totalsRaw, null)
            if (loadedTotals) setChatTotals(loadedTotals)

            const modelRaw = localStorage.getItem(STORAGE_KEYS.model)
            if (modelRaw) setSelectedModel(modelRaw as ModelId)
        } catch {
        } finally {
            hydrated.current = true
        }
    }, [])

    useEffect(() => {
        if (!hydrated.current) return
        try {
            localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages))
        } catch {}
    }, [messages])

    useEffect(() => {
        if (!hydrated.current) return
        try {
            localStorage.setItem(STORAGE_KEYS.totals, JSON.stringify(chatTotals))
        } catch {}
    }, [chatTotals])

    useEffect(() => {
        if (!hydrated.current) return
        try {
            localStorage.setItem(STORAGE_KEYS.model, selectedModel)
        } catch {}
    }, [selectedModel])

    async function handleSend() {
        if (!query.trim() || loading) return

        const processedQuery = autoIndentCode(query.trim())
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: processedQuery,
            timestamp: new Date()
        }

        setMessages(prev => [...prev, userMessage])
        const currentQuery = processedQuery
        setQuery('')
        setLoading(true)
        setCurrentResponse('')
        setLastTurnCost(null)

        try {
            const conversationMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Call Electron IPC instead of fetch
            const result = await window.llm.query({
                query: currentQuery,
                model: selectedModel,
                messages: conversationMessages,
                temperature: 0.7,
            });

            // Simulate streaming by displaying chunks
            let fullResponse = '';
            for (const chunk of result.chunks) {
                fullResponse += chunk;
                setCurrentResponse(fullResponse);
                // Small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Set usage info
            setLastTurnCost(result.usage);
            setChatTotals(prev => ({
                inputTokens: prev.inputTokens + result.usage.inputTokens,
                outputTokens: prev.outputTokens + result.usage.outputTokens,
                totalTokens: prev.totalTokens + result.usage.totalTokens,
                totalCost: prev.totalCost + result.usage.totalCost,
            }));

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: result.content,
                timestamp: new Date()
            }

            setMessages(prev => [...prev, assistantMessage])
            setCurrentResponse('')

        } catch (error) {
            console.error('Error:', error)
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, there was an error processing your request. Please try again.',
                timestamp: new Date()
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setLoading(false)
            textareaRef.current?.focus()
        }
    }

    function clearChat() {
        setMessages([])
        setCurrentResponse('')
        setQuery('')
        setLastTurnCost(null)
        setChatTotals({inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCost: 0})

        try {
            localStorage.removeItem(STORAGE_KEYS.messages)
            localStorage.removeItem(STORAGE_KEYS.totals)
        } catch {}

        textareaRef.current?.focus()
    }


    const { theme, setTheme, themes } = useTheme();
    setTheme('ocean');

        useClickThrough();



    return (
        <div style={{
            display: "flex",
            flexDirection: "row",
            height: "100vh",
            marginRight: '20px',
            scrollbarWidth: 'auto',
            borderRight: 'var(--border-radius) solid var(--border-color)'
        }}>
            <SideBar messageCount={messages.length} onClearChat={clearChat}/>

            <div className="chat-container" style={{flex: 1, display: "flex", flexDirection: "column", height: "100%"}}>
                <div style={{
                    padding: "8px 16px",
                    borderBottom: "1px solid var(--border-color)",
                    backgroundColor: "transparent",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    overflowY: 'hidden'
                }}>
                    <label style={{fontSize: 14, color: "var(--foreground-secondary)"}}>
                        Model:
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                        style={{
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            backgroundColor: "var(--background-primary)",
                            color: "var(--foreground-primary)",
                            fontSize: 14
                        }}
                    >
                        {AVAILABLE_MODELS.map(model => {
                            const price = PRICING[model.id as keyof typeof PRICING];
                            if (!price) return null;
                            const contextStr = 'context' in price ? `, Context: ${price.context / 1000}k` : '';
                            return (
                                <option key={model.id} value={model.id}>
                                    {model.name} ({model.provider}) - In: ${price.input.toFixed(2)} / Out:
                                    ${price.output.toFixed(2)} per MTok{contextStr}
                                </option>
                            );
                        })}
                    </select>


                    <label
                        style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: 13}}>
                        <input
                            type="checkbox"
                            checked={focusStreaming}
                            onChange={(e) => setFocusStreaming(e.target.checked)}
                        />
                        Focus Streaming
                    </label>
                    <label style={{fontSize: 13}}>
                        Behavior:
                        <select
                            value={behavior}
                            onChange={(e) => setBehavior(e.target.value as 'auto' | 'smooth')}
                        >
                            <option value="auto">Instant (auto)</option>
                            <option value="smooth">Smooth</option>
                        </select>
                    </label>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 12,
                        color: 'var(--disabled)',
                        padding: '4px 8px',
                        borderBottom: '1px solid var(--border-color)',
                        overflowY: 'hidden'
                    }}
                >
                    {lastTurnCost ? (
                        <>
                            <span>Last: ${lastTurnCost.totalCost.toFixed(6)}</span>
                            <span>tokens: {lastTurnCost.inputTokens}/{lastTurnCost.outputTokens}/{lastTurnCost.totalTokens}</span>
                            {typeof lastTurnCost.latencyMs === 'number' && (
                                <span>latency: {lastTurnCost.latencyMs}ms</span>
                            )}
                            <span>Total: ${chatTotals.totalCost.toFixed(6)}</span>
                            <span>tokens: {chatTotals.totalTokens}</span>
                        </>
                    ) : (
                        <>
                            <span>{loading ? 'Generating…' : 'Ready'}</span>
                            <span>Total: ${chatTotals.totalCost.toFixed(6)}</span>
                            <span>tokens: {chatTotals.totalTokens}</span>
                        </>
                    )}
                </div>

                <MessageList
                    messages={messages}
                    currentResponse={currentResponse}
                    focusStreaming={focusStreaming}
                    behavior={behavior}
                />
                <InputArea
                    query={query}
                    setQuery={setQuery}
                    onSend={handleSend}
                    loading={loading}
                />
            </div>
        </div>
    )
}