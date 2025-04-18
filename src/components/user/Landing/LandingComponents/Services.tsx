import React from 'react'

const Services = () => {
  return (
    <div>
            <section className="container mx-auto py-16 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-6">
          Services We Offer
          <div className="h-1 w-40 bg-red-400 mt-1"></div>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M19.15 8a2 2 0 0 0-1.72-1H15V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a2 2 0 0 0 2 2h.93a2 2 0 0 0 3.14 0h5.86a2 2 0 0 0 3.14 0h.93a2 2 0 0 0 2-2v-5a1.7 1.7 0 0 0-.15-.7zM15 9h2.43l1.8 3H15z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Warehousing Services</h3>
            <p className="text-gray-600">
              A pay-as-you-go solution for pallet storage, inventory management, fulfillment (e.g. pick and pack), in/out-bound solutions, and more.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M3,4A2,2 0 0,0 1,6V17H3A3,3 0 0,0 6,20A3,3 0 0,0 9,17H15A3,3 0 0,0 18,20A3,3 0 0,0 21,17H23V12L20,8H17V4M10,6L14,10L10,14V11H4V9H10M17,9.5H19.5L21.47,12H17M6,15.5A1.5,1.5 0 0,1 7.5,17A1.5,1.5 0 0,1 6,18.5A1.5,1.5 0 0,1 4.5,17A1.5,1.5 0 0,1 6,15.5M18,15.5A1.5,1.5 0 0,1 19.5,17A1.5,1.5 0 0,1 18,18.5A1.5,1.5 0 0,1 16.5,17A1.5,1.5 0 0,1 18,15.5Z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Global Freight</h3>
            <p className="text-gray-600">
              Search and compare the best shipping rates among dozens of trusted logistic partners for the last mile delivery and freight.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-gray-700" fill="currentColor">
                <path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5M12,4.15L6.04,7.5L12,10.85L17.96,7.5L12,4.15Z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">Packaging Solutions</h3>
            <p className="text-gray-600">
              Our packaging solutions are optimized for each individual customer and are selected based on the customer's specific needs and requirements.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
