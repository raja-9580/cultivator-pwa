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
        const nextValue = e.target.value;

        // Allow empty string
        if (nextValue === '') {
            setLocalValue('');
            onChange('');
            return;
        }

        // Determine Allowed Decimals
        const decimals = integerOnly ? 0 : (Number.isInteger(step) ? 0 : (step.toString().split('.')[1]?.length || 0));

        // Validation Regex
        // 1. Matches optional minus sign
        // 2. Matches digits
        // 3. Matches optional decimal group (dot followed by 0 to N digits)
        // If decimals == 0, the decimal group is not matched (effectively integer only)

        let isValid = true;
        if (decimals === 0) {
            // Exact integer check (allow intermediate empty like "-")
            // Actually, type="number" returns empty string for invalid input in some browsers, 
            // but we want to catch "23.5" which is valid number but invalid for us.
            // If we rely on regex:
            isValid = /^-?\d*$/.test(nextValue);
        } else {
            // Valid simple float check
            const regex = new RegExp(`^-?\\d*(\\.\\d{0,${decimals}})?$`);
            isValid = regex.test(nextValue);
        }

        if (isValid) {
            setLocalValue(nextValue);
            onChange(nextValue);
        }
        // If invalid, we ignore the input event (the value doesn't change in React state)
        // Note: For native inputs, the UI might flicker if we don't force update, 
        // but typically controlled inputs handle this by re-rendering with old value.
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

        // Simplify formatting logic: ALWAYS format based on precision
        const decimals = integerOnly ? 0 : (step.toString().split('.')[1]?.length || 0);

        // If step is integer (e.g. 1, 10), we usually want 0 decimals UNLESS user typed them? 
        // But the requirement is "allow only one decimal point".
        // If we use step=0.1, we get 1 decimal. 
        // So we strictly enforce toFixed(decimals).

        let nextStr: string;

        // Special case: If step is integer and value is integer, show as integer.
        // But if step implies decimals (0.1), always show decimals? 
        // Standard stepper behavior usually adheres to step precision.

        if (integerOnly) {
            nextStr = clamped.toFixed(0);
        } else {
            // If step has decimals (e.g. 0.1), strictly enforce that precision
            if (!Number.isInteger(step)) {
                nextStr = clamped.toFixed(decimals);
            } else {
                // If step is integer (e.g. 1), we typically allow integers. 
                // But wait, what if I want 1 decimal but step 1?
                // The component derives precision from step. 
                // We will stick to that logic. 
                // If step is 1, decimals is 0 -> toFixed(0). 
                nextStr = Number.isInteger(clamped)
                    ? clamped.toString()
                    : clamped.toFixed(decimals);
            }
        }

        if (nextStr !== localValue) {
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
