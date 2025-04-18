import { User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/store";

const NavBar = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  return (
    <nav className="bg-white p-4 shadow-sm">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <h1 className="text-xl">
          Ship<span className="text-red-400 font-bold">Up</span>
        </h1>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6">
          <span onClick={() => navigate("/home")} className="cursor-pointer text-gray-800 hover:text-red-400">Home</span>
          <span onClick={() => navigate("/order")} className="cursor-pointer text-gray-800 hover:text-red-400">Order</span>
          <span onClick={() => navigate("/support")} className="cursor-pointer text-gray-800 hover:text-red-400">Support</span>
          <span onClick={() => navigate("/payments")} className="cursor-pointer text-gray-800 hover:text-red-400">Payments</span>
          <span onClick={() => navigate("/about")} className="cursor-pointer text-gray-800 hover:text-red-400">About</span>
        </div>


        {/* Profile and Authentication */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button
                title="Profile"
                className="p-2 rounded-full hover:bg-gray-200"
                onClick={() => navigate("/profile")}
              >

              </button>
              <button
                className="bg-indigo-900 text-white py-2 px-4 rounded-md hover:bg-indigo-800 flex items-center gap-2"
                onClick={() => navigate("/profile")}
              >
                <User className="w-6 h-6 text-white" />
                {user.fullName}
              </button>
            </>
          ) : (
            <>
              <button
                title="Login"
                className="p-2 rounded-full hover:bg-gray-200"
                onClick={() => navigate("/login")}
              >
                <User className="w-6 h-6 text-gray-800" />
              </button>
              <button className="bg-indigo-900 text-white py-2 px-4 rounded-md hover:bg-indigo-800"
              onClick={() => navigate("/partner")}
              >
                Delivery Partner
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
