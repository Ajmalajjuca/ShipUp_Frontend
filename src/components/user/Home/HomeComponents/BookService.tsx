import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, ArrowRight } from 'lucide-react'

const BookService = () => {
  const navigate = useNavigate()

  const handleBookNow = () => {
    navigate('/book')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Book a Delivery</h2>
        <p className="text-gray-600">Ready to send a package? Use our new booking system for fast and reliable deliveries.</p>
      </div>

      <div className="flex justify-center">
        <div className="w-full  bg-red-50 border border-red-100 rounded-xl p-6 flex flex-col">
          <div className="flex-grow">
            <div className="p-3 rounded-full bg-red-100 inline-flex items-center justify-center mb-4">
              <Truck className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">New Booking Experience</h3>
            <p className="text-gray-600 mb-4">
              Our streamlined booking process makes it easy to:
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Select pickup and dropoff locations from your saved addresses</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Choose from different vehicle types based on your package size</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Get instant price calculation based on distance</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Select between standard and express delivery options</span>
              </li>
            </ul>
          </div>
          <button
            onClick={handleBookNow}
            className="bg-indigo-900 hover:bg-indigo-800 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
          >
            Book Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookService
