import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useVehicles } from '../../contexts/VehicleContext';
import { VehicleType } from '../../types/vehicle.types';
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Avatar,
  Card,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  DirectionsCar,
  LocalShipping,
  Speed,
  SettingsEthernet,
  EventSeat,
  AttachMoney,
  CalendarToday,
  LocationOn,
} from '@mui/icons-material';

const VehicleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getVehicleById, loading, error } = useVehicles();
  const [vehicle, setVehicle] = useState<VehicleType | null>(null);

  useEffect(() => {
    if (id) {
      const fetchVehicle = async () => {
        const vehicleData = await getVehicleById(id);
        if (vehicleData) {
          setVehicle(vehicleData);
        }
      };

      fetchVehicle();
    }
  }, [id, getVehicleById]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" p={3}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/vehicles')} 
          sx={{ mt: 2 }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  if (!vehicle) {
    return (
      <Box textAlign="center" p={3}>
        <Typography variant="h6">Vehicle not found</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => navigate('/vehicles')} 
          sx={{ mt: 2 }}
        >
          Back to Vehicles
        </Button>
      </Box>
    );
  }

  const getVehicleIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'truck':
        return <LocalShipping />;
      case 'car':
      default:
        return <DirectionsCar />;
    }
  };

  return (
    <Box p={3} maxWidth="1200px" mx="auto">
      <Button 
        variant="outlined" 
        onClick={() => navigate('/vehicles')} 
        sx={{ mb: 3 }}
      >
        Back to Vehicles
      </Button>

      <Grid container spacing={4}>
        {/* Vehicle Image */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardMedia
              component="img"
              height="400"
              image={vehicle.imageUrl || '/placeholder-vehicle.jpg'}
              alt={`${vehicle.make} ${vehicle.model}`}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        {/* Vehicle Details */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" mb={2}>
              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                {getVehicleIcon(vehicle.type)}
              </Avatar>
              <Typography variant="h4">
                {vehicle.make} {vehicle.model}
              </Typography>
            </Box>

            <Chip 
              label={vehicle.type} 
              color="primary" 
              size="medium" 
              sx={{ mb: 2 }} 
            />

            <Typography variant="h6" color="primary" gutterBottom>
              ${vehicle.pricePerKm} per kilometer
            </Typography>

            <Divider sx={{ my: 2 }} />

            <List disablePadding>
              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <SettingsEthernet />
                </ListItemIcon>
                <ListItemText 
                  primary="Registration" 
                  secondary={vehicle.registrationNumber} 
                />
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Speed />
                </ListItemIcon>
                <ListItemText 
                  primary="Maximum Speed" 
                  secondary={`${vehicle.maxSpeed} km/h`} 
                />
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <EventSeat />
                </ListItemIcon>
                <ListItemText 
                  primary="Capacity" 
                  secondary={`${vehicle.capacity} kg`} 
                />
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AttachMoney />
                </ListItemIcon>
                <ListItemText 
                  primary="Price per Kilometer" 
                  secondary={`$${vehicle.pricePerKm}`} 
                />
              </ListItem>

              <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CalendarToday />
                </ListItemIcon>
                <ListItemText 
                  primary="Manufactured Year" 
                  secondary={vehicle.manufactureYear || 'N/A'} 
                />
              </ListItem>

              {vehicle.currentLocation && (
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LocationOn />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Current Location" 
                    secondary={vehicle.currentLocation} 
                  />
                </ListItem>
              )}
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body1" paragraph>
              {vehicle.description || 'No description provided for this vehicle.'}
            </Typography>

            <Button 
              variant="contained" 
              color="primary" 
              size="large" 
              fullWidth
              sx={{ mt: 2 }}
            >
              Book This Vehicle
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VehicleDetail; 