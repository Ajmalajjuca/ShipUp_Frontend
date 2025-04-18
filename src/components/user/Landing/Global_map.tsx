import React from 'react'

const Global_map = () => {
  return (
    <div>
      <section className="container mx-auto py-16 px-4 md:px-8">
        <h2 className="text-2xl font-bold mb-8">
          Warehouse Onsite
          <div className="h-1 w-36 bg-red-400 mt-1"></div>
        </h2>

        <div className="bg-white p-4 rounded-lg shadow-sm">
          <img src="/map.png" alt="Global warehouse map" className="w-full h-auto" />
        </div>
      </section>
    </div>
  )
}

export default Global_map
