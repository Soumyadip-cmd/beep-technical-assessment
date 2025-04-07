import React, { useState } from 'react';
import './autocomplete.css'

interface AutocompleteProps <T extends string | object> {
    description?: string;
    disabled?: boolean;
    filterOptions?: (options: T[], state: { inputValue: string }) => string[];
    label?: string;
    loading?: boolean;
    multiple?: boolean;
    onChange?: (value: T | T[]) => void;
    onInputChange?: (value: string) => void;
    options: T[];
    placeholder?: string;
    renderOption?: (option: string, state: { inputValue: string }) => React.ReactNode;
    value?: T | T[];
}

