export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'text-blue-400';
      case 'confirmed':
        return 'text-green-500';
      case 'processing':
        return 'text-purple-500';
      case 'out for delivery':
        return 'text-orange-400';
      case 'completed':
        return 'text-green-400';
      case 'canceled':
        return 'text-red-400';
      case 'returned':
        return 'text-yellow-500';
      case 'failed':
        return 'text-red-500';
      default:
        return '';
    }
  };
  
  export const getPaymentStatusColor = (method: string) => {
    return method === 'cash' ? 'text-pink-500' : 'text-green-500';
  };
  
  export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  export const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };