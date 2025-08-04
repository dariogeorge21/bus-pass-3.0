import { Bus, RouteStop } from './types';

export const buses: Bus[] = [
  { id: 1, name: "Bus 1", route: "bus-1" },
  { id: 2, name: "Bus 2", route: "bus-2" },
  { id: 3, name: "Bus 3", route: "bus-3" },
  { id: 4, name: "Bus 4", route: "bus-4" },
  { id: 5, name: "Bus 5", route: "bus-5" },
  { id: 6, name: "Bus 6", route: "bus-6" },
  { id: 7, name: "Bus 7", route: "bus-7" },
  { id: 8, name: "Bus 8", route: "bus-8" },
  { id: 9, name: "Bus 9", route: "bus-9" },
  { id: 10, name: "Bus 10", route: "bus-10" },
  { id: 11, name: "Bus 11", route: "bus-11" },
  { id: 12, name: "Bus 12", route: "bus-12" },
  { id: 13, name: "Bus 13", route: "bus-13" },
  { id: 14, name: "Bus 14", route: "bus-14" },
  { id: 15, name: "Bus 15", route: "bus-15" },
  { id: 16, name: "Bus 16", route: "bus-16" },
  { id: 17, name: "Bus 17", route: "bus-17" },
  { id: 18, name: "Bus 18", route: "bus-18" },
  { id: 19, name: "Bus 19", route: "bus-19" },
  { id: 20, name: "Bus 20", route: "bus-20" },
  { id: 21, name: "Bus 21", route: "bus-21" },
  { id: 22, name: "Bus 22", route: "bus-22" },
];

export const routeStops: { [key: string]: RouteStop[] } = {
  "bus-1": [
    { id: 1, name: "Kottayam", fare: 50 },
    { id: 2, name: "Changanassery", fare: 40 },
    { id: 3, name: "Thiruvalla", fare: 60 },
    { id: 4, name: "Chengannur", fare: 70 },
  ],
  "bus-2": [
    { id: 1, name: "Ernakulam", fare: 80 },
    { id: 2, name: "Aluva", fare: 70 },
    { id: 3, name: "Perumbavoor", fare: 60 },
    { id: 4, name: "Muvattupuzha", fare: 50 },
  ],
  "bus-3": [
    { id: 1, name: "Thodupuzha", fare: 45 },
    { id: 2, name: "Idukki", fare: 65 },
    { id: 3, name: "Kumily", fare: 85 },
    { id: 4, name: "Vandiperiyar", fare: 75 },
  ],
  // Add more routes as needed
};

// Generate default routes for remaining buses
for (let i = 4; i <= 22; i++) {
  const busRoute = `bus-${i}`;
  routeStops[busRoute] = [
    { id: 1, name: `Destination ${i}-1`, fare: 40 + (i * 2) },
    { id: 2, name: `Destination ${i}-2`, fare: 50 + (i * 2) },
    { id: 3, name: `Destination ${i}-3`, fare: 60 + (i * 2) },
    { id: 4, name: `Destination ${i}-4`, fare: 70 + (i * 2) },
  ];
}