import React from 'react';

export type DateRangeOption = 'last3' | 'last6' | 'last12' | 'ytd';

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (value: DateRangeOption) => void;
  className?: string;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const options = [
    { value: 'last3' as DateRangeOption, label: 'Last 3 Months' },
    { value: 'last6' as DateRangeOption, label: 'Last 6 Months' },
    { value: 'last12' as DateRangeOption, label: 'Last 12 Months' },
    { value: 'ytd' as DateRangeOption, label: 'Year to Date' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as DateRangeOption)}
      className={`bg-dark-700 border border-dark-600 text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-primary-500 ${className}`}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};