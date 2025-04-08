import React, { useState, useRef, forwardRef, useEffect } from 'react';
import './autocomplete.css'
import { 
    useRole,
    useDismiss,
    useListNavigation,
    flip,
    size,
    useFloating,
    autoUpdate,
    useInteractions,
    FloatingPortal,
    FloatingFocusManager,
    useId
 } from '@floating-ui/react';

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

interface ItemProps {
    children: React.ReactNode;
    active: boolean;
  }

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
        const [selectedValues, setSelectedValues] = useState<T[]>([]);
        const [inputValue, setInputValue] = useState('');
        const [filteredOptions, setFilteredOptions] = useState<T[]>(options);
        const [loadingState, setLoadingState] = useState(false);
        const debounceDelay = 1000; // milliseconds

        useEffect(() => {
          if (!loading) {
            // No debounce needed
            const result = filterOptions?.(options, { inputValue }) ?? options;
            setFilteredOptions(result);
            return;
          }
          
          setLoadingState(true);
          const handler = setTimeout(() => {
            const result = filterOptions?.(options, { inputValue }) ?? options;
            setFilteredOptions(result);
            setLoadingState(false);
          }, debounceDelay);
        
          return () => {
            clearTimeout(handler); // Clean up if user types again quickly
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
        });

        const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions(
            [role, dismiss, listNav]
          );

        const handleInputClick = () => {
            setIsOpen(true);
            setActiveIndex(0);
        }
        
    return (
        <div className="autocomplete-container">
            <div className='autocomplete-label-container'>
                {label && <label className="autocomplete-label">{label}</label>}
            </div>
            <div className='autocomplete-input-container'>
              <input className='autocomplete-input'
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
                      }
                  })}
              />
              {loadingState &&(
                <span className="autocomplete-loading-spinner" />
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
                                  ? prev.filter((_, i) => i !== index) // remove
                                  : [...prev, option]; // add
                          
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
            <div className="autocomplete-description-container">
                {description && <p className="autocomplete-description">{description}</p>}
            </div>
        </div>
    );
};

export default Autocomplete;