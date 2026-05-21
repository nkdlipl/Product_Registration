import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

const MultiSelectDropdown = ({ options, selectedOptions, onChange, placeholder = "Select options..." }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (opt) => {
        if (selectedOptions.includes(opt)) {
            onChange(selectedOptions.filter(o => o !== opt));
        } else {
            onChange([...selectedOptions, opt]);
        }
    };

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[var(--bg-workspace)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-[13px] text-[var(--text-main)] outline-none focus:border-[var(--accent)] transition-all font-bold flex items-center justify-between"
            >
                <span className="truncate">
                    {selectedOptions.length > 0 
                        ? `${selectedOptions.length} Selected` 
                        : placeholder}
                </span>
                <ChevronDown size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-xl max-h-[250px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 space-y-1">
                        {options.map(opt => (
                            <label key={opt} className="flex items-center gap-3 cursor-pointer group p-2 hover:bg-[var(--bg-workspace)] rounded-lg transition-colors">
                                <input 
                                    type="checkbox" 
                                    className="hidden" 
                                    checked={selectedOptions.includes(opt)}
                                    onChange={() => toggleOption(opt)} 
                                />
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all flex-shrink-0 ${selectedOptions.includes(opt) ? 'bg-[var(--accent)] border-[var(--accent)]' : 'border-[var(--border-color)] bg-[var(--bg-workspace)] group-hover:border-[var(--accent)]'}`}>
                                    {selectedOptions.includes(opt) && <CheckCircle2 size={12} className="text-white" />}
                                </div>
                                <span className="text-[12px] font-semibold text-[var(--text-main)] group-hover:text-[var(--accent)] transition-colors truncate">
                                    {opt}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
