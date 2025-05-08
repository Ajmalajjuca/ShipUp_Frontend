import React from 'react';
import { Calendar, Search } from 'lucide-react';

interface FilterSectionProps {
  branch: string;
  setBranch: (value: string) => void;
  startDate: string;
  setStartDate: (value: string) => void;
  endDate: string;
  setEndDate: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  onShowData: () => void;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  branch,
  setBranch,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  searchQuery,
  setSearchQuery,
  onShowData,
}) => {
  const handleClear = () => {
    setBranch('All Branch');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="bg-gray-50 p-4 rounded-md mb-6">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Select date range</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm mb-1">Select Branch</label>
          <select
            className="w-full border border-gray-300 rounded p-2 bg-white"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          >
            <option>All Branch</option>
            <option>Main Branch</option>
            <option>Farmgate</option>
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className="w-full border border-gray-300 rounded p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1">End Date</label>
          <div className="relative">
            <input
              type="text"
              placeholder="mm/dd/yyyy"
              className="w-full border border-gray-300 rounded p-2"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Calendar className="absolute right-2 top-2.5 w-4 h-4 text-gray-500" />
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <button
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300"
            onClick={handleClear}
          >
            Clear
          </button>
          <button
            className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
            onClick={onShowData}
          >
            Show Data
          </button>
        </div>
      </div>
      <div className="relative flex-1 mt-4">
        <input
          type="text"
          placeholder="Search by Order ID, Customer Name, or Status"
          className="w-full border border-gray-300 rounded p-2 pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <button className="absolute right-0 top-0 bg-red-500 text-white h-full px-4 rounded-r">
          Search
        </button>
      </div>
    </div>
  );
};

export default FilterSection;