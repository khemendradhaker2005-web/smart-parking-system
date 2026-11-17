import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ParkingCard from '../../components/customer/ParkingCard';
import ParkingDetailsModal from '../../components/customer/ParkingDetailsModal';
import BookingModal from '../../components/customer/BookingModal';
import ParkingMap from '../../components/map/ParkingMap';
import {
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  List,
  Map as MapIcon,
  Crosshair,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

export default function ParkingDiscoveryPage({ onBookingComplete }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters and controls
  const [search, setSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [viewMode, setViewMode] = useState('split'); // 'split', 'grid', 'map'

  // User coordinates for real distance
  const [userCoords, setUserCoords] = useState(null);
  const [locating, setLocating] = useState(false);

  // Modals
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [bookingLocation, setBookingLocation] = useState(null);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        maxDistance: maxDistance || undefined,
        onlyAvailable: onlyAvailable ? 'true' : undefined,
        sortBy,
      };

      if (userCoords) {
        params.userLat = userCoords.lat;
        params.userLng = userCoords.lng;
      }

      const res = await api.getLocations(params);
      if (res.success) {
        setLocations(res.locations || []);
      }
    } catch (err) {
      console.error('Failed to load locations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [search, maxDistance, onlyAvailable, sortBy, userCoords]);

  // Real Geolocation
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied, using Bangalore reference:', err.message);
        // Default to Bangalore central reference
        setUserCoords({ lat: 12.9716, lng: 77.5946 });
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Discover Smart Parking Hubs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse real-time open slots across 4 active parking locations with live navigation
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'split' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map & List</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Cards Only</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Search parking by name, area, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          {/* Detect Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={locating}
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              userCoords
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-300'
            }`}
          >
            <Crosshair className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
            <span>{locating ? 'Detecting GPS...' : userCoords ? 'GPS Active' : 'Use My GPS Location'}</span>
          </button>

          {/* Distance Filter */}
          <select
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto"
          >
            <option value="">All Distances</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="20">Within 20 km</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 w-full sm:w-auto"
          >
            <option value="rating">Highest Rated</option>
            <option value="distance">Nearest Distance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
              className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>Show Only Locations with Open Available Slots</span>
          </label>

          <span className="text-slate-400 font-mono">
            {locations.length} {locations.length === 1 ? 'Location' : 'Locations'} Found
          </span>
        </div>
      </div>

      {/* Main Content Layout */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Cards List (5 Cols) */}
          <div className="lg:col-span-5 space-y-4 max-h-[750px] overflow-y-auto pr-1">
            {locations.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
                No parking locations matched your search filters.
              </div>
            ) : (
              locations.map((loc) => (
                <ParkingCard
                  key={loc.id}
                  location={loc}
                  onSelect={(item) => setSelectedDetails(item)}
                  onBook={(item) => setBookingLocation(item)}
                />
              ))
            )}
          </div>

          {/* Right Leaflet Map (7 Cols) */}
          <div className="lg:col-span-7 sticky top-24">
            <ParkingMap
              locations={locations}
              userCoords={userCoords}
              height="750px"
              onSelectLocation={(loc) => setSelectedDetails(loc)}
            />
          </div>
        </div>
      ) : (
        /* Grid Only View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((loc) => (
            <ParkingCard
              key={loc.id}
              location={loc}
              onSelect={(item) => setSelectedDetails(item)}
              onBook={(item) => setBookingLocation(item)}
            />
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedDetails && (
        <ParkingDetailsModal
          location={selectedDetails}
          onClose={() => setSelectedDetails(null)}
          onBookNow={(loc) => {
            setSelectedDetails(null);
            setBookingLocation(loc);
          }}
        />
      )}

      {/* Booking Modal */}
      {bookingLocation && (
        <BookingModal
          location={bookingLocation}
          onClose={() => setBookingLocation(null)}
          onBookingSuccess={() => {
            fetchLocations();
            if (onBookingComplete) onBookingComplete();
          }}
        />
      )}
    </div>
  );
}
