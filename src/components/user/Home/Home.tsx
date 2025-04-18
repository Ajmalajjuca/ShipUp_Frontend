import NavBar from '../NavBar';
import ActiveOrders from './HomeComponents/ActiveOrders';
import BookService from './HomeComponents/BookService';
import VehicleSelection from './HomeComponents/VehicleSelection';
import DeliveryMode from './HomeComponents/DeliveryMode';
import Global_map from '../Landing/Global_map';
import Footer from '../Footer';



const ShipUpApp: React.FC = () => {

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <NavBar />

            {/* Active Orders component with map*/}
            <ActiveOrders />

            {/* Book Service component*/}
            <BookService />

            {/* Vehicle selection component*/}
            <VehicleSelection />

            {/* Delivery mode selection component*/}
            <DeliveryMode />

            {/* Global Map Section */}
            <Global_map />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ShipUpApp;