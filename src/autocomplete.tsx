import React, { forwardRef, useEffect, useRef, useState } from 'react';
import tailwindcss from '@tailwindcss/vite';
import "./autocomplete.css"
import {
    autoUpdate,
    flip,
    size,
    useDismiss,
    useFloating,
    useId,
    useInteractions,
    useListNavigation,
    useRole,
    FloatingPortal,
    FloatingFocusManager,
 } from '@floating-ui/react';

 /**
 * Props for the Autocomplete component.
 * @template T Type of the options, can be string or object.
 */
interface AutocompleteProps <T extends string | object> {
    description?: string;
    disabled?: boolean;
    filterOptions?: (options: T[], state: { inputValue: string }) => T[];
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

/**
 * Props for individual list item components.
 */
interface ItemProps {
    children: React.ReactNode;
    active: boolean;
  }

/**
 * A single option item within the autocomplete dropdown.
 */
const Item = forwardRef<
  HTMLDivElement,
  ItemProps & React.HTMLProps<HTMLDivElement>
>(({ children, active, ...rest }, ref) => {
  const id = useId();
  return (
    <div
      ref={ref}
      role="option"
      id={id}
      aria-selected={active}
      {...rest}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        background: active ? "lightblue" : "none",
        cursor: "default",
        ...rest.style,
      }}
    >
      {children}
    </div>
  );
});

/**
 * Autocomplete component allowing single or multiple item selection with optional filtering.
 * @template T Type of the options.
 */
function Autocomplete<T extends string | object>({
    description,
    disabled = false,
    filterOptions,
    label,
    loading = false,
    multiple = false,
    onChange,
    onInputChange,
    options,
    placeholder,
    renderOption,
    value,
    } : AutocompleteProps<T>) {
        const [isOpen, setIsOpen] = useState(false);
        const [activeIndex, setActiveIndex] = useState<number | null>(null);
        const [selectedValues, setSelectedValues] = useState<T[]>(
          multiple && value ? (Array.isArray(value) ? value : [value]) : []
        );
        const [inputValue, setInputValue] = useState('');
        const [filteredOptions, setFilteredOptions] = useState<T[]>(options);
        const [loadingState, setLoadingState] = useState(false);
        const debounceDelay = 1000; // milliseconds

        // useEffect to handle input changes and debounce filtering logic
        useEffect(() => {
          // If not loading, filter options immediately
          if (!loading) {
            const result = filterOptions?.(options, { inputValue }) ?? options;
            setFilteredOptions(result);
            return;
          }

          // If loading, debounce the filtering logic
          setLoadingState(true);
          const handler = setTimeout(() => {
            const result = filterOptions?.(options, { inputValue }) ?? options;
            setFilteredOptions(result);
            setLoadingState(false);
          }, debounceDelay);
        
          return () => {
            clearTimeout(handler);
          };
        }, [inputValue, options, filterOptions, loading]);

        const listRef = useRef<Array<HTMLElement | null>>([]);

        const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
            whileElementsMounted: autoUpdate,
            open: isOpen,
            onOpenChange: setIsOpen,
            middleware: [
              flip({ padding: 10 }),
              size({
                apply({ rects, availableHeight, elements }) {
                  Object.assign(elements.floating.style, {
                    width: `${rects.reference.width}px`,
                    maxHeight: `${availableHeight}px`,
                  });
                },
                padding: 10,
              }),
            ],
          });
        const role = useRole(context, { role: "listbox" });
        const dismiss = useDismiss(context);
        const listNav = useListNavigation(context, {
            listRef,
            activeIndex,
            onNavigate: setActiveIndex,
            virtual: true,
            loop: true,
            allowEscape: true,
        });

        const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
            [role, dismiss, listNav]
          );

        const handleInputClick = () => {
            setIsOpen(true);
            setActiveIndex(0);
        }
        
    return (
        <div className="max-w-[3600px] mx-auto p-8 bg-white rounded shadow-md">
            <div className='flex justify-start'>
                {label && <label className="text-base mb-4">{label}</label>}
            </div>
            <div className='relative flex items-center '>
              <input className='w-full p-2 border border-gray-300 rounded text-base focus:outline-none focus:border-blue-500'
                  {...getReferenceProps({
                      ref: refs.setReference,
                      onClick: handleInputClick,
                      disabled,
                      placeholder,
                      onChange: (e) => {
                        const value = (e.target as HTMLInputElement).value;
                        setInputValue(value);
                        onInputChange?.(value);
                        setIsOpen(true);
                        setActiveIndex(0);
                      },
                      onKeyDown: (e) => {
                        if (e.key === 'Enter' && isOpen && activeIndex !== null) {
                          e.preventDefault();
                          const option = filteredOptions[activeIndex];
                  
                          if (option) {
                            if (multiple) {
                              setSelectedValues((prev) => {
                                const index = prev.findIndex(
                                  (v) => JSON.stringify(v) === JSON.stringify(option)
                                );
                                const newValues =
                                  index >= 0
                                    ? prev.filter((_, i) => i !== index)
                                    : [...prev, option];
                                onChange?.(newValues);
                                return newValues;
                              });
                            } else {
                              onChange?.(option);
                              setIsOpen(false);
                            }
                            
                            refs.domReference.current?.focus();
                          }
                        }
                      },
                  })}
              />
              {loadingState &&(
                <span className="absolute right-2 w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
                )}
            </div>
            {isOpen && (
            <FloatingPortal>
            <FloatingFocusManager
                context={context}
                initialFocus={-1}
                visuallyHiddenDismiss
            >
                <div
                {...getFloatingProps({
                    ref: refs.setFloating,
                    style: {
                    ...floatingStyles,
                    background: "#eee",
                    color: "black",
                    overflowY: "auto",
                    },
                })}
                >
                {filteredOptions.map((option, index) => (
                    <Item
                    {...getItemProps({
                        key: typeof option === 'object' ? JSON.stringify(option) : option,
                        ref(node) {
                        listRef.current[index] = node;
                        },
                        onClick() {
                            if (multiple) {
                              setSelectedValues((prev) => {
                                const index = prev.findIndex(v => JSON.stringify(v) === JSON.stringify(option));
                                const newValues = index >= 0
                                  ? prev.filter((_, i) => i !== index) // deselect
                                  : [...prev, option]; // select
                          
                                onChange?.(newValues);
                                return newValues;
                              });
                            } else {
                              onChange?.(option);
                              setIsOpen(false);
                            }
                            refs.domReference.current?.focus();
                          },
                          
                    })}
                    active={activeIndex === index}
                    >
                    <input
                        type="checkbox"
                        checked={multiple
                        ? selectedValues.some(v => JSON.stringify(v) === JSON.stringify(option))
                        : value === option}
                        readOnly
                        style={{ marginRight: 8 }}
                    />
                    {renderOption
                        ? renderOption(typeof option === 'string' ? option : JSON.stringify(option), { inputValue: '' })
                        : typeof option === 'string' ? option : JSON.stringify(option)}
                    </Item>
                ))}
                </div>
            </FloatingFocusManager>
            </FloatingPortal>
        )}
            <div className="flex justify-start mt-4">
                {description && <p className="autocomplete-description">{description}</p>}
            </div>
        </div>
    );
};

export default Autocomplete;