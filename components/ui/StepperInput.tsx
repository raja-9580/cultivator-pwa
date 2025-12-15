'use client';

import { useState, useRef, useEffect } from 'react';

interface StepperInputProps {
    value: string | number;
    onChange: (value: string) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    className?: string;
    readOnly?: boolean;
    autoFocus?: boolean;
    onBlur?: () => void;
    integerOnly?: boolean;
}

export default function StepperInput({
    value,
    onChange,
    min = 0,
    max = 9999,
    step = 1,
    placeholder = '0',
    className = '',
    readOnly = false,
    autoFocus = false,
    onBlur,
    integerOnly = false
}: StepperInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Internal state for typing
    const [localValue, setLocalValue] = useState(value?.toString() || '');

    useEffect(() => {
        setLocalValue(value?.toString() || '');
    }, [value]);

    const handleIncrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (readOnly) return;
        const current = parseFloat(localValue) || 0;
        const next = Math.min(current + step, max);
        // Use precision based on step (if step is 0.1, use 1 decimal)
        // If integerOnly, force 0 decimals
        const decimals = integerOnly ? 0 : (step.toString().split('.')[1]?.length || 0);
        const nextStr = next.toFixed(decimals);
        triggerChange(nextStr);
    };

    const handleDecrement = (e: React.MouseEvent) => {
        e.preventDefault();
        if (readOnly) return;
        const current = parseFloat(localValue) || 0;
        const next = Math.max(current - step, min);
        // If integerOnly, force 0 decimals
        const decimals = integerOnly ? 0 : (step.toString().split('.')[1]?.length || 0);
        const nextStr = next.toFixed(decimals);
        triggerChange(nextStr);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
    };

    // Key blocking removed to prevent "885" error when typing "88.5"
    // We handle integer enforcement on Blur instead.

    const handleBlur = () => {
        if (readOnly) return;

        let val = parseFloat(localValue);

        // If empty, leave it empty (let parent handle required check)
        if (localValue === '' || isNaN(val)) {
            if (onBlur) onBlur();
            return;
        }

        // Clamp value
        let clamped = val;
        if (val < min) clamped = min;
        if (val > max) clamped = max;

        if (clamped !== val) {
            // Apply clamping
            const decimals = integerOnly ? 0 : (step.toString().split('.')[1]?.length || 0);

            const nextStr = Number.isInteger(step) && Number.isInteger(clamped) && !integerOnly
                ? clamped.toString()
                : clamped.toFixed(decimals);

            setLocalValue(nextStr);
            onChange(nextStr);
        }

        if (onBlur) onBlur();
    };

    const triggerChange = (newValue: string) => {
        setLocalValue(newValue);
        onChange(newValue);
    };

    return (
        <div className={`flex items-center border border-white/10 rounded-md bg-[#0a0a0a] hover:border-white/20 transition-colors ${className}`}>
            {/* Minus Button */}
            <button
                type="button"
                onClick={handleDecrement}
                disabled={readOnly}
                className="w-8 h-8 flex items-center justify-center bg-transparent text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 border-r border-white/10 transition-colors rounded-l-md"
                tabIndex={-1}
            >
                <span className="text-sm font-bold leading-none select-none">&minus;</span>
            </button>

            {/* Input */}
            <input
                ref={inputRef}
                type="number"
                value={localValue}
                onChange={handleChange}
                onBlur={handleBlur}
                min={min}
                max={max}
                step={step}
                placeholder={placeholder}
                readOnly={readOnly}
                autoFocus={autoFocus}
                className={`w-full text-center font-mono bg-transparent py-1 text-sm focus:outline-none 
                ${readOnly ? 'text-gray-500 cursor-not-allowed' : 'text-gray-200 placeholder-gray-700'}`}
                style={{ appearance: 'textfield', MozAppearance: 'textfield' }} // Hide native spinner
            />
            {/* Hide native spinners with css roughly */}
            <style jsx>{`
                input::-webkit-outer-spin-button,
                input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>

            {/* Plus Button */}
            <button
                type="button"
                onClick={handleIncrement}
                disabled={readOnly}
                className="w-8 h-8 flex items-center justify-center bg-transparent text-gray-400 hover:text-white hover:bg-white/5 active:bg-white/10 border-l border-white/10 transition-colors rounded-r-md"
                tabIndex={-1}
            >
                <span className="text-sm font-bold leading-none select-none">+</span>
            </button>
        </div>
    );
}
