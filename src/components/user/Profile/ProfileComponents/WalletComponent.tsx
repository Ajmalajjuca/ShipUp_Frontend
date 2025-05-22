import { useState, useEffect } from "react";
import {
  CreditCard,
  PlusCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Search,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { walletService } from "../../../../services/wallet.service";
import { useSelector } from "react-redux";
import { RootState } from "../../../../Redux/store";



interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

interface WalletProps {
  walletBalance: number;
  transactions?: Transaction[];
  setActiveSection: (section: "profile" | "wallet") => void;
}

const WalletComponent = ({
  walletBalance = 0,
  transactions = [],
  setActiveSection
}: WalletProps) => {
  const [activeTab, setActiveTab] = useState<"transactions" | "add-money">("transactions");
  const { user } = useSelector((state: RootState) => state.auth);
  const [amount, setAmount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cardComplete, setCardComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedTransactions, setFetchedTransactions] = useState<Transaction[]>(transactions);
  const stripe = useStripe();
  const elements = useElements();

  
  // Fetch transactions on component mount
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await walletService.fetchTransactions(user.userId);
        console.log("Transactions:", response);
        
        if (response.success && response.transactions) {
          setFetchedTransactions(response.transactions);
        } else {
          toast.error("Failed to load transactions");
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toast.error("Failed to load transactions");
      }
    };

    fetchTransactions();
  }, []);

  // Filter transactions based on search query
  const filteredTransactions = fetchedTransactions.filter((transaction) =>
    transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!stripe || !elements) {
      toast.error("Payment system not initialized");
      return;
    }

    if (!cardComplete) {
      toast.error("Please complete your card details");
      return;
    }

    setIsLoading(true);

    try {
      // Create payment intent
      const paymentResponse = await walletService.createPaymentIntent(parseFloat(amount));

      console.log("Payment intent response:", paymentResponse);

      if (!paymentResponse.clientSecret) {
        throw new Error("No clientSecret in response");
      }

      const clientSecret = paymentResponse.clientSecret.client_secret;
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "Wallet User", // Replace with actual user name if available
          },
        },
      });

      if (error) {
        console.error("Stripe payment error:", error);
        toast.error(error.message || "Payment failed. Please try again.");
        setIsLoading(false);
        return;
      }

      if (paymentIntent.status === "succeeded") {
        // Update wallet balance in backend
        const token = localStorage.getItem('authToken') || '';  
              
        const responce = await walletService.addMoney(parseFloat(amount), paymentIntent.id, user.userId, token);
        console.log("Add money response:", responce);
        

        // Add transaction to local state
        const newTransaction: Transaction = {
          id: paymentIntent.id,
          type: "credit",
          amount: parseFloat(amount),
          description: "Add money via Stripe",
          date: new Date().toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }),
        };

        setFetchedTransactions((prev) => [newTransaction, ...prev]);
        setAmount("");
        setCardComplete(false);
        toast.success(`₹${amount} added to wallet successfully!`);
      } else {
        toast.error("Payment not completed. Please try again.");
      }
    } catch (error) {
      console.error("Error adding money:", (error as any).response?.data?.message || error);
      toast.error((error as any).response?.data?.message || "Failed to add money. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [500, 1000, 2000, 5000];

  return (
    <div className="w-full md:w-2/3">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 px-6 py-8 text-white">
          <div className="absolute right-72 bottom-64 opacity-10">
            <CreditCard size={128} />
          </div>
          <div className="flex items-center mb-4">
            <ArrowLeft
              size={20}
              className="mr-2 cursor-pointer hover:pr-1"
              onClick={() => {
                setActiveSection("profile");
              }}
            />
            <CreditCard size={24} className="mr-3" />
            <h2 className="text-xl font-bold">My Wallet</h2>
          </div>
          <div className="flex items-end">
            <span className="text-3xl font-bold">₹{walletBalance.toFixed(2)}</span>
            <span className="ml-2 text-indigo-200">Available Balance</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "transactions"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
          <button
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === "add-money"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-500 hover:text-indigo-500"
            }`}
            onClick={() => setActiveTab("add-money")}
          >
            Add Money
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="p-6">
          {activeTab === "transactions" ? (
            <>
              {/* Search bar */}
              <div className="mb-6 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search transactions"
                  className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full mr-4 ${
                            transaction.type === "credit"
                              ? "bg-green-100 text-green-600"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {transaction.type === "credit" ? (
                            <ArrowDownCircle size={20} />
                          ) : (
                            <ArrowUpCircle size={20} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.date}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`font-semibold ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}₹
                        {transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText size={48} className="text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">
                    No transactions found
                  </h3>
                  <p className="text-gray-500 mt-2">
                    {searchQuery
                      ? "No transactions match your search"
                      : "Your transaction history will appear here"}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Enter Amount
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-8 pr-4 flex items-center pointer-events-none">
                    <span className="text-gray-500">₹</span>
                  </div>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Quick Amount
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setAmount(amt.toString())}
                      className="py-2 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>
                  <div className="pt-4 border-t border-gray-100">
                <h4 className="text-gray-700 font-medium mb-4">
                  Payment Methods
                </h4>
                <div className="space-y-3">
                  {["Credit/Debit Card"].map((method) => (
                    <button
                      key={method}
                      className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                      disabled
                    >
                      <span className="font-medium text-gray-800">{method}</span>
                      <ChevronRight size={20} className="text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Card Details
                </label>
                <div className="p-4 border border-gray-200 rounded-lg">
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
              </div>

              <button
                onClick={handleAddMoney}
                disabled={!amount || parseFloat(amount) <= 0 || !cardComplete || isLoading}
                className={`w-full py-3 px-4 flex items-center justify-center rounded-lg ${
                  !amount || parseFloat(amount) <= 0 || !cardComplete || isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                } transition-colors font-medium`}
              >
                <PlusCircle size={20} className="mr-2" />
                {isLoading ? "Processing..." : "Add Money to Wallet"}
              </button>

              
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default WalletComponent;