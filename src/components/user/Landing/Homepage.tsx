import Footer from "../Footer";
import Global_map from "./Global_map";
import Calculator from "./LandingComponents/Calculator";
import Hero from "./LandingComponents/Hero";
import Operation from "./LandingComponents/Operation";
import Services from "./LandingComponents/Services";
import NavBar from "../NavBar";

const Homepage = () => {


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Navbar */}
      <NavBar />

      {/* Hero Section */}
      <Hero />

      {/* Calculator Section */}
      <Calculator />

      {/* Services Section */}
      <Services />

      {/* Operation Mode Section */}
      <Operation />

      {/* Global Map Section */}
      <Global_map />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Homepage;