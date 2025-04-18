import { useState } from "react";

const BookService: React.FC = () => {
    const [city, setCity] = useState<string>("Bangalore");

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold">
                    Book <span className="text-gray-900">A New Service</span>
                </h2>
                <div className="border-b-2 border-red-500 w-16 mt-2"></div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
                    <div className="w-full md:w-1/4 mb-4 md:mb-0">
                        <div className="mb-2 text-sm text-gray-600">City:</div>
                        <div className="relative inline-flex w-full">
                            <select
                                title='city'
                                className="w-full bg-white border rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline appearance-none"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                            >
                                <option value="Bangalore">Bangalore</option>
                                <option value="Mumbai">Mumbai</option>
                                <option value="Delhi">Delhi</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/4">
                        <div className="mb-2 text-sm text-gray-600">Origin</div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter Location"
                                className="w-full bg-white border rounded-md py-2 pl-9 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
                                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/4">
                        <div className="mb-2 text-sm text-gray-600">Destination</div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Enter Location"
                                className="w-full bg-white border rounded-md py-2 pl-9 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
                                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="w-full md:w-1/4">
                        <div className="mb-2 text-sm text-gray-600">Kilometers</div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Kilometers (KM)"
                                className="w-full bg-white border rounded-md py-2 pl-9 pr-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" className="text-gray-600">
                                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <button className="w-full md:w-auto bg-indigo-800 hover:bg-indigo-700 text-white font-medium py-2 px-8 rounded">
                        Check Price
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BookService