import React from 'react'

const Operation = () => {
    return (
        <div>
            <section className="container mx-auto py-16 px-4 md:px-8">
                <h2 className="text-2xl font-bold mb-12">
                    Operation Mode
                    <div className="h-1 w-36 bg-red-400 mt-1"></div>
                </h2>

                <div className="relative">
                    <div className="hidden md:block border-l-2 border-dashed border-gray-300 absolute h-full left-1/2 transform -translate-x-1/2"></div>

                    <div className="md:flex items-center mb-16 relative">
                        <div className="md:w-1/2 pr-8 md:text-right mb-4 md:mb-0">
                            <div className="flex md:justify-end items-center mb-2">
                                <div className="bg-indigo-900 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 md:order-2 md:ml-2">1</div>
                                <h3 className="text-xl font-semibold text-red-400">Connect</h3>
                            </div>
                            <p className="text-gray-600">
                                We're currently syncing your store (e.g. Shopify, WooCommerce, Magento, etc.) so we can help you to move your store with just one platform.
                            </p>
                        </div>

                        <div className="md:w-1/2 md:pl-8 hidden md:block">
                            <img src="/Connect.png" alt="Connect illustration" className="max-w-full h-auto" />
                        </div>
                    </div>

                    <div className="md:flex items-center mb-16 relative">
                        <div className="md:w-1/2 pr-8 hidden md:block">
                            <img src="/Store.png" alt="Store illustration" className="max-w-full h-auto" />
                        </div>

                        <div className="md:w-1/2 md:pl-8">
                            <div className="flex items-center mb-2">
                                <div className="bg-indigo-900 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2">2</div>
                                <h3 className="text-xl font-semibold text-red-400">Store</h3>
                            </div>
                            <p className="text-gray-600">
                                Once you are well set up our inventory and the warehouses are ready to receive your products, just send a shipment in any volume.
                            </p>
                        </div>
                    </div>

                    <div className="md:flex items-center relative">
                        <div className="md:w-1/2 pr-8 md:text-right mb-4 md:mb-0">
                            <div className="flex md:justify-end items-center mb-2">
                                <div className="bg-indigo-900 text-white w-8 h-8 rounded-full flex items-center justify-center mr-2 md:order-2 md:ml-2">3</div>
                                <h3 className="text-xl font-semibold text-red-400">Ship</h3>
                            </div>
                            <p className="text-gray-600">
                                We pick, pack and ship all incoming orders, automatically. And your customers can track the entire trip.
                            </p>
                        </div>

                        <div className="md:w-1/2 md:pl-8 hidden md:block">
                            <img src="/woman.png" alt="Ship illustration" className="max-w-full h-auto" />
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Operation
