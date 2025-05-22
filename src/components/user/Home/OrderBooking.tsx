import React, { useState, useEffect, useRef } from "react";
import {
  Truck,
  MapPin,
  Clock,
  CreditCard,
  DollarSign,
  Map,
  Phone,
  Package,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "../../../Redux/store";
import { useNavigate } from "react-router-dom";
import AddressSelector from "./BookingComponents/AddressSelector";
import VehicleSelection from "./BookingComponents/VehicleSelection";
import DeliveryTypeSelection from "./BookingComponents/DeliveryTypeSelection";
import PaymentMethodSelection, {
  PaymentMethod,
} from "./BookingComponents/PaymentMethodSelection";
import OrderSummary from "./BookingComponents/OrderSummary";
import {
  orderService,
  OrderInput,
  PricingConfig,
} from "../../../services/order.service";
import { vehicleService } from "../../../services/vehicle.service";
import {
  activeOrderService,
  ActiveOrder,
} from "../../../services/active-order.service";
import NavBar from "../NavBar";
import Footer from "../Footer";
import axios from "axios";
import io from "socket.io-client";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { driverService } from "../../../services/driver.service";

interface OrderDetails {
  pickupAddress: {
    addressId: string;
    street: string;
    latitude?: number;
    longitude?: number;
  } | null;
  dropoffAddress: {
    addressId: string;
    street: string;
    latitude?: number;
    longitude?: number;
  } | null;
  vehicleId: string | null;
  vehicleName: string | null;
  vehiclePricePerKm: number | null;
  deliveryType: "normal" | "express" | null;
  paymentMethod: PaymentMethod | null;
  distance: number;
  price: number;
  basePrice: number;
  deliveryPrice: number;
  commission: number;
  gstAmount: number;
  estimatedTime: string;
  effectiveDistance: number;
}

interface DriverTracking {
  driverId: string;
  driverName: string;
  profileImage?: string;
  vehicle: string;
  location: { latitude: number; longitude: number };
  estimatedArrival: string;
  distance: number;
  phone?: string;
}

interface OtpStatus {
  pickupOtp: string | null;
  dropoffOtp: string | null;
  pickupVerified: boolean;
  dropoffVerified: boolean;
}

interface DriverResponseData {
  partnerId: string;
  orderId: string;
  accepted: boolean;
  timestamp: number;
}

interface OrderStatusUpdateData {
  orderElementId: string;
  status: string;
  partnerId?: string;
  timestamp: number;
}

const OrderBooking: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig | null>(
    null
  );
  const [vehicles, setVehicles] = useState<
    Array<{
      id: string;
      name: string;
      pricePerKm: number;
      maxWeight: number;
      imageUrl?: string;
      isAvailable: boolean;
    }>
  >([]);
  const [orderStatus, setOrderStatus] = useState<
    | "created"
    | "finding_driver"
    | "driver_assigned"
    | "driver_arrived"
    | "picked_up"
    | "completed"
    | null
  >(null);
  const [driverTracking, setDriverTracking] = useState<DriverTracking | null>(
    null
  );
  const driverLocationInterval = useRef<NodeJS.Timeout | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cardComplete, setCardComplete] = useState(false);

  const [otpStatus, setOtpStatus] = useState<OtpStatus>({
    pickupOtp: null,
    dropoffOtp: null,
    pickupVerified: false,
    dropoffVerified: false,
  });

  const [orderDetails, setOrderDetails] = useState<OrderDetails>({
    pickupAddress: null,
    dropoffAddress: null,
    vehicleId: null,
    vehicleName: null,
    vehiclePricePerKm: null,
    deliveryType: null,
    paymentMethod: null,
    distance: 0,
    price: 0,
    basePrice: 0,
    deliveryPrice: 0,
    commission: 0,
    gstAmount: 0,
    estimatedTime: "",
    effectiveDistance: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const config = await orderService.getPricingConfig();
        setPricingConfig(config);

        const vehicleResponse = await vehicleService.getVehicles();
        if (vehicleResponse.success && vehicleResponse.vehicles) {
          const vehicleData = vehicleResponse.vehicles.map((vehicle) => ({
            id: vehicle.id,
            name: vehicle.name,
            pricePerKm: vehicle.pricePerKm || 0,
            maxWeight:
              typeof vehicle.maxWeight === "string"
                ? parseFloat(vehicle.maxWeight)
                : vehicle.maxWeight || 0,
            imageUrl: vehicle.imageUrl,
            isAvailable: vehicle.isAvailable,
            isActive: vehicle.isActive,
          }));
          setVehicles(vehicleData);
        } else {
          toast.error("Could not load vehicle information");
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        toast.error("Could not load necessary information");
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (
      orderDetails.pickupAddress &&
      orderDetails.dropoffAddress &&
      orderDetails.pickupAddress.latitude &&
      orderDetails.pickupAddress.longitude &&
      orderDetails.dropoffAddress.latitude &&
      orderDetails.dropoffAddress.longitude
    ) {
      const distance = calculateDistance(
        orderDetails.pickupAddress.latitude,
        orderDetails.pickupAddress.longitude,
        orderDetails.dropoffAddress.latitude,
        orderDetails.dropoffAddress.longitude
      );

      setOrderDetails((prev) => ({
        ...prev,
        distance: parseFloat(distance.toFixed(2)),
      }));
    }
  }, [orderDetails.pickupAddress, orderDetails.dropoffAddress]);

  useEffect(() => {
    if (
      orderDetails.distance > 0 &&
      orderDetails.vehicleId &&
      orderDetails.vehiclePricePerKm &&
      orderDetails.deliveryType &&
      pricingConfig
    ) {
      const vehicleRate = orderDetails.vehiclePricePerKm;
      const deliveryMultiplier =
        pricingConfig.deliveryMultipliers[orderDetails.deliveryType];
      const gstRate = pricingConfig.taxRates.gst;
      const commissionRate = pricingConfig.taxRates.commission;
      const minimumDistance = pricingConfig.minimumDistance;

      const effectiveDistance = Math.max(
        orderDetails.distance,
        minimumDistance
      );
      const basePrice = effectiveDistance * vehicleRate;
      const deliveryPrice = basePrice * deliveryMultiplier;
      const commission = deliveryPrice * commissionRate;
      const gstAmount = (deliveryPrice + commission) * gstRate;
      const finalPrice = deliveryPrice + commission + gstAmount;

      let speedKmPerHour = 30;
      const vehicleName = orderDetails.vehicleName?.toLowerCase() || "";

      if (vehicleName.includes("bike") || vehicleName.includes("cycle")) {
        speedKmPerHour = 25;
      } else if (vehicleName.includes("van")) {
        speedKmPerHour = 40;
      } else if (vehicleName.includes("truck")) {
        speedKmPerHour = 30;
      }

      const timeMultiplier = orderDetails.deliveryType === "express" ? 0.8 : 1;
      const timeInHours = (effectiveDistance / speedKmPerHour) * timeMultiplier;
      const hours = Math.floor(timeInHours);
      const minutes = Math.round((timeInHours - hours) * 60);

      const estimatedTime =
        hours > 0
          ? `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min`
          : `${minutes} min`;

      setOrderDetails((prev) => ({
        ...prev,
        price: parseFloat(finalPrice.toFixed(2)),
        basePrice: parseFloat(basePrice.toFixed(2)),
        deliveryPrice: parseFloat(deliveryPrice.toFixed(2)),
        commission: parseFloat(commission.toFixed(2)),
        gstAmount: parseFloat(gstAmount.toFixed(2)),
        effectiveDistance,
        estimatedTime,
      }));
    }
  }, [
    orderDetails.distance,
    orderDetails.vehicleId,
    orderDetails.vehiclePricePerKm,
    orderDetails.deliveryType,
    pricingConfig,
  ]);

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  const updateOrderDetails = (key: keyof OrderDetails, value: any) => {
    setOrderDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleVehicleSelect = (vehicleId: string) => {
    const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
    if (selectedVehicle) {
      setOrderDetails((prev) => ({
        ...prev,
        vehicleId: selectedVehicle.id,
        vehicleName: selectedVehicle.name,
        vehiclePricePerKm: selectedVehicle.pricePerKm,
      }));
    }
  };

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setOrderDetails((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!orderDetails.pickupAddress || !orderDetails.dropoffAddress) {
        toast.error("Please select both pickup and dropoff locations");
        return;
      }
    } else if (currentStep === 2) {
      if (!orderDetails.vehicleId) {
        toast.error("Please select a vehicle");
        return;
      }
    } else if (currentStep === 3) {
      if (!orderDetails.deliveryType) {
        toast.error("Please select a delivery type");
        return;
      }
    } else if (currentStep === 4) {
      if (!orderDetails.paymentMethod) {
        toast.error("Please select a payment method");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  const handlePreviousStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  const generateOtp = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleDriverArrived = (orderId: string) => {
    const pickupOtp = generateOtp();

    setOtpStatus((prev) => ({
      ...prev,
      pickupOtp: pickupOtp,
    }));

    setOrderStatus("driver_arrived");
    driverService
      .sendDeliveryOtp(orderId, pickupOtp, "pickup")
      .then((data) => {
        console.log("OTP saved successfully:", data);
      })
      .catch((error) => {
        console.error("Error saving pickup OTP:", error);
      });

    toast.success("Driver has arrived at pickup location!");
  };

  const handlePickupVerified = (orderId: string) => {
    setOtpStatus((prev) => ({
      ...prev,
      pickupVerified: true,
    }));

    setOrderStatus("picked_up");

    const dropoffOtp = generateOtp();
    setOtpStatus((prev) => ({
      ...prev,
      dropoffOtp: dropoffOtp,
    }));

    driverService
      .sendDeliveryOtp(orderId, dropoffOtp, "dropoff")
      .then((data) => {
        console.log("OTP saved successfully:", data);
      })
      .catch((error) => {
        console.error("Error saving dropoff OTP:", error);
      });

    if (user?.userId) {
      activeOrderService
        .getActiveOrder(user.userId)
        .then((activeOrder) => {
          if (activeOrder) {
            const updatedOrder: ActiveOrder = {
              ...activeOrder,
              status: "picked_up",
              dropoffOtp: dropoffOtp,
            };

            return activeOrderService.storeActiveOrder(
              user.userId,
              updatedOrder
            );
          }
          return false;
        })
        .catch((error) => {
          console.error("Error updating active order after pickup:", error);
        });
    }

    toast.success("Package has been picked up!");
  };

  const handleDeliveryCompleted = (orderId: string) => {
    setOtpStatus((prev) => ({
      ...prev,
      dropoffVerified: true,
    }));

    setOrderStatus("completed");
    console.log("Order status set to completed");

    if (user?.userId) {
      activeOrderService
        .getActiveOrder(user.userId)
        .then((activeOrder) => {
          if (activeOrder) {
            const updatedOrder: ActiveOrder = {
              ...activeOrder,
              status: "completed",
            };

            return activeOrderService.storeActiveOrder(
              user.userId,
              updatedOrder,
              3600
            );
          }
          return false;
        })
        .then(() => {
          return activeOrderService.removeActiveOrder(user.userId);
        })
        .catch((error) => {
          console.error("Error handling active order after completion:", error);
        });
    }

    toast.success("Delivery has been completed!");
    setOrderStatus("completed");
    navigate("/orders");
  };

  const handleStripePayment = async (orderId: string, clientSecret: string) => {
    console.log("Handling Stripe payment for order:", orderId, {
      clientSecret,
      currentStep,
      cardComplete,
      elements: !!elements,
      stripe: !!stripe,
    });

    if (!stripe || !elements || !clientSecret) {
      console.error("Payment system initialization failed:", {
        stripe: !!stripe,
        elements: !!elements,
        clientSecret,
      });
      toast.error("Payment system not initialized. Please try again.");
      return false;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.error("CardElement not found in DOM");
      toast.error("Please enter your card details.");
      return false;
    }

    if (!cardComplete) {
      toast.error("Please complete the card details.");
      return false;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: user?.fullName || "Customer",
            },
          },
        }
      );

      if (error) {
        console.error("Stripe payment error:", error);
        toast.error(
          error.message || "Payment failed. Please try another card."
        );
        return false;
      }

      if (paymentIntent.status === "succeeded") {
        toast.success("Payment successful!");
        return true;
      } else {
        toast.error("Payment not completed. Please try again.");
        return false;
      }
    } catch (error) {
      console.error("Error processing Stripe payment:", error);
      toast.error("Payment processing failed. Please try again.");
      return false;
    }
  };

  const submitOrder = async () => {
    console.log("Submitting order with details:", orderDetails, {
      currentStep,
      cardComplete,
    });

    if (
      !orderDetails.pickupAddress ||
      !orderDetails.dropoffAddress ||
      !orderDetails.vehicleId ||
      !orderDetails.deliveryType ||
      !orderDetails.paymentMethod ||
      !user?.userId
    ) {
      toast.error("Please complete all required fields");
      return;
    }

    if (orderDetails.paymentMethod === "stripe" && !cardComplete) {
      toast.error("Please complete your card details");
      return;
    }

    setIsLoading(true);
    setOrderStatus("created");

    try {
      const orderInput: OrderInput = {
        pickupAddress: {
          street: orderDetails.pickupAddress.street,
          latitude: orderDetails.pickupAddress.latitude,
          longitude: orderDetails.pickupAddress.longitude,
        },
        dropoffAddress: {
          street: orderDetails.dropoffAddress.street,
          latitude: orderDetails.dropoffAddress.latitude,
          longitude: orderDetails.dropoffAddress.longitude,
        },
        pickupAddressId: orderDetails.pickupAddress.addressId,
        dropoffAddressId: orderDetails.dropoffAddress.addressId,
        vehicleId: orderDetails.vehicleId,
        vehicleName: orderDetails.vehicleName,
        deliveryType: orderDetails.deliveryType,
        distance: orderDetails.distance,
        price: orderDetails.price,
        basePrice: orderDetails.basePrice,
        deliveryPrice: orderDetails.deliveryPrice,
        commission: orderDetails.commission,
        gstAmount: orderDetails.gstAmount,
        estimatedTime: orderDetails.estimatedTime,
        paymentMethod: orderDetails.paymentMethod,
        paymentStatus: isPrePaymentMethod(orderDetails.paymentMethod)
          ? "pending"
          : "not_required",
      };

      const response = await orderService.createOrder(orderInput, user.userId);
      console.log("Order creation response:", response);

      if (response.success) {
        setOrderId(response.data.orderId);
        toast.success("Order placed successfully!");

        if (isPrePaymentMethod(orderDetails.paymentMethod)) {
          if (orderDetails.paymentMethod === "stripe") {
            try {
              const paymentResponse = await orderService.createPaymentIntent(
                response.data.orderId,
                Math.round(orderDetails.price * 100),
                "inr"
              );

              console.log("Payment response:", paymentResponse);

              if (paymentResponse.clientSecret) {
                setClientSecret(paymentResponse.clientSecret);

                // Process payment with the clientSecret directly
                const success = await handleStripePayment(
                  response.data.orderId,
                  paymentResponse.clientSecret
                );
                if (success) {
                  setOrderStatus("finding_driver");
                  findDriver(response.data.orderId, {
                    pickupLatitude: orderDetails.pickupAddress?.latitude || 0,
                    pickupLongitude: orderDetails.pickupAddress?.longitude || 0,
                    vehicleType: orderDetails.vehicleName || "standard",
                  });
                  subscribeToOrderUpdates(response.data.orderId);
                } else {
                  axios
                    .delete(
                      `http://localhost:3003/api/orders/${response.data.orderId}`
                    )
                    .catch((error) =>
                      console.error("Error cancelling order:", error)
                    );
                  toast.error("Order cancelled due to payment failure.");
                }
              } else {
                throw new Error("No clientSecret in response");
              }
            } catch (error) {
              console.error("Error creating Payment Intent:", error);
              toast.error("Failed to initialize payment. Please try again.");
              setIsLoading(false);
              return;
            }
          } else if (orderDetails.paymentMethod === "wallet") {
            toast.success("Processing wallet payment...");
            setOrderStatus("finding_driver");
            findDriver(response.data.orderId, {
              pickupLatitude: orderDetails.pickupAddress?.latitude || 0,
              pickupLongitude: orderDetails.pickupAddress?.longitude || 0,
              vehicleType: orderDetails.vehicleName || "standard",
            });
            subscribeToOrderUpdates(response.data.orderId);
          }
        } else {
          setOrderStatus("finding_driver");
          findDriver(response.data.orderId, {
            pickupLatitude: orderDetails.pickupAddress?.latitude || 0,
            pickupLongitude: orderDetails.pickupAddress?.longitude || 0,
            vehicleType: orderDetails.vehicleName || "standard",
          });
          subscribeToOrderUpdates(response.data.orderId);
        }
      } else {
        toast.error(response.message || "Failed to place order");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
      setIsLoading(false);
    }
  };

  const findDriver = async (
    orderId: string,
    orderLocation: {
      pickupLatitude: number;
      pickupLongitude: number;
      vehicleType: string;
    }
  ) => {
    try {
      console.log(
        "Finding driver for order:",
        orderId,
        "location:",
        orderLocation
      );

      const response = await orderService.findDriver(
        orderId,
        {
          latitude: orderLocation.pickupLatitude,
          longitude: orderLocation.pickupLongitude,
        },
        orderLocation.vehicleType,
        10,
        60
      );

      console.log("Driver request response:", response);

      const result = response;

      if (result.success) {
        console.log("Driver request sent successfully:", result);
        setOrderStatus("finding_driver");
        toast.success("Looking for nearby drivers...");

        const socket = io("http://localhost:3003", {
          path: "/socket",
          transports: ["websocket"],
          reconnection: true,
        });

        socket.on("connect", () => {
          console.log("WebSocket connected for driver assignment");

          socket.emit("join_order_room", {
            orderId,
            userId: user?.userId || user?._id,
          });
        });

        const driverAcceptanceTimeout = setTimeout(() => {
          toast.error(
            "No driver accepted your request. We'll try again with another driver."
          );
          setOrderStatus("created");
          socket.disconnect();
          navigate("/orders");
        }, 45000);

        socket.on("driver_response", (data: DriverResponseData) => {
          console.log("Driver response:", data);

          if (data.accepted) {
            clearTimeout(driverAcceptanceTimeout);
            setOrderStatus("driver_assigned");
            toast.success("Driver assigned to your order!");

            startDriverLocationUpdates(orderId, data.partnerId);
            fetchDriverDetails(data.partnerId, orderId);

            const pickupOtp = generateOtp();
            setOtpStatus((prev) => ({
              ...prev,
              pickupOtp: pickupOtp,
            }));
            driverService
              .sendDeliveryOtp(orderId, pickupOtp, "pickup")
              .then((response) => {
                console.log("Pickup OTP sent successfully:", response);
              })
              .catch((error) => {
                console.error("Error saving pickup OTP:", error);
              });

            orderService
              .orderUpdatedWithId(orderId, data.partnerId)
              .then((response) => {
                console.log("Order updated with driverId:", response.data);
              })
              .catch((error) => {
                console.error("Error updating order with driverId:", error);
                toast.error("Failed to update order with driver information.");
              });
           

            if (user?.userId) {
              const activeOrderData: ActiveOrder = {
                userId: user.userId,
                orderId,
                driverId: data.partnerId,
                pickupLocation: orderDetails.pickupAddress || {},
                dropLocation: orderDetails.dropoffAddress || {},
                status: "driver_assigned",
                timestamp: Date.now(),
                vehicle: orderDetails.vehicleName || null,
                pickupOtp: pickupOtp,
              };

              activeOrderService
                .storeActiveOrder(user.userId, activeOrderData)
                .then((success) => {
                  if (success) {
                    console.log("Active order data stored successfully");
                  } else {
                    console.warn("Failed to store active order data in Redis");
                  }
                })
                .catch((error) => {
                  console.error("Error storing active order data:", error);
                });
            }

            setTimeout(() => {
              navigate("/home");
            }, 2000);
          } else {
            toast.error(
              "Driver rejected the request. Looking for another driver..."
            );
          }
        });

        socket.on("order_status_updated", (data: OrderStatusUpdateData) => {
          console.log("Order status updated:", data);

          if (data.status === "driver_rejected") {
            toast.error(
              "Driver is not available. Trying the next available driver..."
            );
          } else if (data.status === "no_drivers_available") {
            toast.error(
              "No more drivers are available. Our team will assign a driver manually."
            );
            setOrderStatus("created");
            setTimeout(() => {
              navigate("/orders");
            }, 4000);
          }
        });

        return socket;
      } else {
        console.log("Driver assignment failed:", result);
        toast.error(
          "No drivers available. Our team will assign a driver manually."
        );
        setTimeout(() => {
          navigate("/orders");
        }, 4000);
      }
    } catch (error) {
      console.error("Error finding driver:", error);
      toast.error(
        "We could not find a driver automatically. Our team will handle your order."
      );
      setTimeout(() => {
        navigate("/orders");
      }, 4000);
    }
  };

  const fetchDriverDetails = async (driverId: string, orderId: string) => {
    try {
      const driverResponse = await driverService.getDriverById(driverId);
      const driverData = driverResponse.partner;
      console.log("Driver details:", driverData);

      if (driverData) {
        const distance = driverData.distance || 3;
        let estimatedMinutes = Math.round(distance * 3);
        if (estimatedMinutes < 1) estimatedMinutes = 1;
        const estimatedArrival = `${estimatedMinutes} min`;

        const pickupLat = orderDetails.pickupAddress?.latitude || 0;
        const pickupLng = orderDetails.pickupAddress?.longitude || 0;
        const driverLat = driverData.location?.coordinates?.[1] || pickupLat;
        const driverLng = driverData.location?.coordinates?.[0] || pickupLng;

        const initialDriverData: DriverTracking = {
          driverId: driverId,
          driverName: driverData?.fullName || "Your Driver",
          profileImage: driverData?.profilePicturePath,
          vehicle: driverData?.vehicleType || "Standard Vehicle",
          location: {
            latitude: driverLat,
            longitude: driverLng,
          },
          estimatedArrival: estimatedArrival,
          distance: distance,
          phone: driverData?.mobileNumber,
        };

        setDriverTracking(initialDriverData);
        console.log("Driver tracking initialized:", initialDriverData);
      } else {
        toast.error("Driver details not available. Please contact support.");
      }
    } catch (error) {
      console.error("Error fetching driver details:", error);
      toast.error("Could not fetch driver details. Please contact support.");
    }
  };

  const startDriverLocationUpdates = (orderId: string, driverId: string) => {
    if (driverLocationInterval.current) {
      clearInterval(driverLocationInterval.current);
    }

    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;

    console.log(
      `Starting location updates for driver ${driverId} on order ${orderId}`
    );

    driverLocationInterval.current = setInterval(async () => {
      try {
        const response = await driverService.getDriverById(driverId);
        const driverData = response?.partner;

        if (!driverData) {
          console.error("No driver data received in location update");
          failedAttempts++;

          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            clearInterval(driverLocationInterval.current!);
            driverLocationInterval.current = null;
          }
          return;
        }

        failedAttempts = 0;

        if (driverData.location && driverData.location.coordinates) {
          const driverLat = driverData.location.coordinates[1];
          const driverLng = driverData.location.coordinates[0];
          const pickupLat = orderDetails.pickupAddress?.latitude || 0;
          const pickupLng = orderDetails.pickupAddress?.longitude || 0;

          const distance = calculateDistance(
            driverLat,
            driverLng,
            pickupLat,
            pickupLng
          );

          let estimatedMinutes = Math.round(distance * 3);
          if (estimatedMinutes < 1) estimatedMinutes = 1;
          const estimatedArrival = `${estimatedMinutes} min`;

          const updatedDriverInfo: DriverTracking = {
            driverId: driverId,
            driverName: driverData?.fullName || "Your Driver",
            profileImage: driverData?.profilePicturePath,
            vehicle: driverData?.vehicleType || "Standard Vehicle",
            location: {
              latitude: driverLat,
              longitude: driverLng,
            },
            estimatedArrival: estimatedArrival,
            distance: parseFloat(distance.toFixed(2)),
            phone: driverData?.mobileNumber,
          };

          setDriverTracking(updatedDriverInfo);
          console.log("Driver tracking updated:", updatedDriverInfo);

          if (
            orderStatus !== "driver_assigned" &&
            orderStatus !== "driver_arrived" &&
            orderStatus !== "picked_up"
          ) {
            setOrderStatus("driver_assigned");
          }
        } else {
          console.log("Driver location coordinates not available in update");
          failedAttempts++;

          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            clearInterval(driverLocationInterval.current!);
            driverLocationInterval.current = null;
            toast.error("Live driver location updates are not available.");
          }
        }
      } catch (error) {
        console.error("Error getting driver location:", error);
        failedAttempts++;

        if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
          clearInterval(driverLocationInterval.current!);
          driverLocationInterval.current = null;
          toast.error("Unable to track driver location.");
        }
      }
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (driverLocationInterval.current) {
        clearInterval(driverLocationInterval.current);
      }
    };
  }, []);

  const isPrePaymentMethod = (method: PaymentMethod): boolean => {
    return ["stripe", "wallet"].includes(method);
  };

  const getProgress = () => {
    return (currentStep / 5) * 100;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <AddressSelector
            pickupAddress={orderDetails.pickupAddress}
            dropoffAddress={orderDetails.dropoffAddress}
            onPickupSelected={(address) =>
              updateOrderDetails("pickupAddress", address)
            }
            onDropoffSelected={(address) =>
              updateOrderDetails("dropoffAddress", address)
            }
          />
        );
      case 2:
        return (
          <VehicleSelection
            vehicles={vehicles}
            selectedVehicleId={orderDetails.vehicleId}
            onSelect={handleVehicleSelect}
          />
        );
      case 3:
        return (
          <DeliveryTypeSelection
            selectedType={orderDetails.deliveryType}
            onSelect={(type) => updateOrderDetails("deliveryType", type)}
          />
        );
      case 4:
        return (
          <PaymentMethodSelection
            selectedMethod={orderDetails.paymentMethod}
            onSelect={handlePaymentMethodSelect}
          />
        );
      case 5:
        return (
          <div>
            {orderDetails.paymentMethod === "stripe" && (
              <div className="mb-4 p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-2">Enter Card Details</h3>
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: "16px",
                        color: "#424770",
                        "::placeholder": {
                          color: "#aab7c4",
                        },
                      },
                      invalid: {
                        color: "#9e2146",
                      },
                    },
                  }}
                  onChange={(e) => setCardComplete(e.complete)}
                />
              </div>
            )}
            <OrderSummary
              orderDetails={orderDetails as any}
              onSubmit={submitOrder}
              isLoading={isLoading}
              onBack={handlePreviousStep}
              cardComplete={
                orderDetails.paymentMethod === "stripe" ? cardComplete : true
              }
            />
          </div>
        );
      default:
        return null;
    }
  };

  const subscribeToOrderUpdates = (orderId: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io("http://localhost:3003", {
      path: "/socket",
      transports: ["websocket"],
      reconnection: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected for order updates");

      socket.emit("join_order_room", {
        orderId,
        userId: user?.userId || user?._id,
      });
    });

    socket.on("driver_arrived_pickup", (data) => {
      console.log("Received driver_arrived_pickup event for order:", orderId);

      if (data.orderId === orderId) {
        handleDriverArrived(orderId);
      }
    });

    socket.on("pickup_verified", (data) => {
      console.log("Received pickup_verified event for order:", orderId);

      if (data.orderId === orderId) {
        handlePickupVerified(orderId);
      }
    });

    socket.on("delivery_completed", (data) => {
      console.log("Received delivery_completed event for order:", orderId);
      if (data.orderId === orderId) {
        handleDeliveryCompleted(orderId);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (driverLocationInterval.current) {
        clearInterval(driverLocationInterval.current);
      }
    };
  }, []);

  const renderOrderStatus = () => {
    console.log("Rendering order status:", { orderStatus, driverTracking });
    if (!orderStatus) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="mb-4">
              {orderStatus === "finding_driver" ? (
                <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg
                    className="animate-spin h-8 w-8 text-yellow-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : orderStatus === "driver_arrived" ? (
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                  <MapPin size={32} className="text-blue-500" />
                </div>
              ) : orderStatus === "picked_up" ? (
                <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                  <Package size={32} className="text-indigo-500" />
                </div>
              ) : orderStatus === "completed" ? (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-8 w-8 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                </div>
              )}
            </div>

            <h3 className="text-lg font-medium mb-2">
              {orderStatus === "finding_driver" && "Finding a driver..."}
              {orderStatus === "driver_assigned" && "Driver found!"}
              {orderStatus === "driver_arrived" && "Driver has arrived!"}
              {orderStatus === "picked_up" && "Package picked up!"}
              {orderStatus === "completed" && "Delivery completed!"}
            </h3>

            {orderStatus === "completed" && (
              <div>
                <p className="text-gray-600 mb-4">
                  Your delivery has been completed successfully! Thank you for
                  using our service.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="w-full h-2 bg-gray-200">
              <div
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${getProgress()}%` }}
              ></div>
            </div>
            <div className="flex justify-between px-8 pt-6">
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 1 ? "text-red-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 1
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <MapPin size={20} />
                </div>
                <span className="text-xs mt-1">Location</span>
              </div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 2 ? "text-red-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 2
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <Truck size={20} />
                </div>
                <span className="text-xs mt-1">Vehicle</span>
              </div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 3 ? "text-red-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 3
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <Clock size={20} />
                </div>
                <span className="text-xs mt-1">Delivery</span>
              </div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 4 ? "text-red-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 4
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <DollarSign size={20} />
                </div>
                <span className="text-xs mt-1">Payment</span>
              </div>
              <div
                className={`flex flex-col items-center ${
                  currentStep >= 5 ? "text-red-500" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= 5
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <CreditCard size={20} />
                </div>
                <span className="text-xs mt-1">Summary</span>
              </div>
            </div>
            <div className="p-6">{renderStep()}</div>
            {currentStep < 5 && (
              <div className="flex justify-between p-6 border-t">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 1}
                  className={`px-4 py-2 rounded-lg ${
                    currentStep === 1
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {renderOrderStatus()}
      <Footer />
    </div>
  );
};

export default OrderBooking;
