const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Configure public DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore fallback if platform restricts dns.setServers
}

const User = require('../models/User');
const Bus = require('../models/Bus');
const Booking = require('../models/Booking');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/routelk';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas (routelk database)...');

    // Clear existing collections
    await User.deleteMany();
    await Bus.deleteMany();
    await Booking.deleteMany();
    console.log('Cleared existing collections (Users, Buses, Bookings).');

    // 1. Create System Users
    const admin = await User.create({
      name: 'RouteLK Admin',
      email: 'admin@routelk.lk',
      password: 'admin123',
      phone: '0771122334',
      role: 'admin',
    });

    const ownerSLTB = await User.create({
      name: 'Sri Lanka Transport Board (SLTB)',
      email: 'sltb@routelk.lk',
      password: 'owner123',
      phone: '0112581120',
      role: 'owner',
    });

    const ownerSouthern = await User.create({
      name: 'Southern Express Lines',
      email: 'southern@routelk.lk',
      password: 'owner123',
      phone: '0773344556',
      role: 'owner',
    });

    const ownerKandy = await User.create({
      name: 'Kandy Royal Express',
      email: 'kandyroyal@routelk.lk',
      password: 'owner123',
      phone: '0812233445',
      role: 'owner',
    });

    const ownerYarl = await User.create({
      name: 'Yarl Superline Travels',
      email: 'yarlsuperline@routelk.lk',
      password: 'owner123',
      phone: '0212223344',
      role: 'owner',
    });

    const passenger1 = await User.create({
      name: 'Kasun Perera',
      email: 'kasun@routelk.lk',
      password: 'pass123',
      phone: '0774455667',
      role: 'passenger',
    });

    const passenger2 = await User.create({
      name: 'Dilshan Silva',
      email: 'dilshan@routelk.lk',
      password: 'pass123',
      phone: '0715566778',
      role: 'passenger',
    });

    const passenger3 = await User.create({
      name: 'Anushka Fernando',
      email: 'anushka@routelk.lk',
      password: 'pass123',
      phone: '0766677889',
      role: 'passenger',
    });

    console.log('Created realistic accounts: 1 Admin, 4 Fleet Operators, 3 Passengers.');

    // 2. Real Sri Lankan Intercity & Highway Buses
    const buses = await Bus.create([
      {
        busNumber: 'WP NA-4512',
        busType: 'AC',
        operatorName: 'SLTB Highway Express',
        from: 'Colombo',
        to: 'Galle',
        routeStops: ['Colombo (Makumbura)', 'Gelanigama', 'Dodangoda', 'Kurundugahahetekma', 'Galle Central'],
        departureTime: '06:30',
        arrivalTime: '07:45',
        fare: 950,
        totalSeats: 44,
        isActive: true,
        ownerId: ownerSLTB._id,
      },
      {
        busNumber: 'SP ND-7890',
        busType: 'AC',
        operatorName: 'Southern Superline',
        from: 'Colombo',
        to: 'Matara',
        routeStops: ['Colombo (Makumbura)', 'Galle', 'Ahangama', 'Weligama', 'Matara Flyover'],
        departureTime: '07:00',
        arrivalTime: '08:45',
        fare: 1180,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerSouthern._id,
      },
      {
        busNumber: 'CP NB-6590',
        busType: 'AC',
        operatorName: 'Kandy Queen Intercity',
        from: 'Colombo',
        to: 'Kandy',
        routeStops: ['Colombo (Pettah)', 'Nittambuwa', 'Warakapola', 'Kegalle', 'Mawanella', 'Kadugannawa', 'Peradeniya', 'Kandy (Goods Shed)'],
        departureTime: '07:30',
        arrivalTime: '10:45',
        fare: 850,
        totalSeats: 42,
        isActive: true,
        ownerId: ownerKandy._id,
      },
      {
        busNumber: 'CP NC-3321',
        busType: 'NON_AC',
        operatorName: 'Kandy Royal Express',
        from: 'Colombo',
        to: 'Kandy',
        routeStops: ['Colombo (Fort)', 'Kadawatha', 'Yakkala', 'Ambepussa', 'Kegalle', 'Mawanella', 'Kandy'],
        departureTime: '08:15',
        arrivalTime: '11:45',
        fare: 580,
        totalSeats: 52,
        isActive: true,
        ownerId: ownerKandy._id,
      },
      {
        busNumber: 'NP ND-9844',
        busType: 'AC',
        operatorName: 'Yarl Superline (Luxury Sleeper)',
        from: 'Colombo',
        to: 'Jaffna',
        routeStops: ['Colombo (Bastian Mawatha)', 'Kurunegala', 'Dambulla', 'Anuradhapura', 'Medawachchiya', 'Vavuniya', 'Kilinochchi', 'Jaffna Central'],
        departureTime: '20:30',
        arrivalTime: '05:00',
        fare: 2650,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerYarl._id,
      },
      {
        busNumber: 'NP NA-7712',
        busType: 'NON_AC',
        operatorName: 'Northern Star Express',
        from: 'Colombo',
        to: 'Jaffna',
        routeStops: ['Colombo (Bastian Mawatha)', 'Kurunegala', 'Anuradhapura', 'Vavuniya', 'Mankulam', 'Kilinochchi', 'Jaffna'],
        departureTime: '21:00',
        arrivalTime: '06:30',
        fare: 1850,
        totalSeats: 54,
        isActive: true,
        ownerId: ownerYarl._id,
      },
      {
        busNumber: 'NCP ND-4105',
        busType: 'AC',
        operatorName: 'Rajarata Royal Express',
        from: 'Colombo',
        to: 'Anuradhapura',
        routeStops: ['Colombo', 'Kurunegala', 'Wariyapola', 'Thambuttegama', 'Anuradhapura (Old Stand)'],
        departureTime: '06:00',
        arrivalTime: '10:15',
        fare: 1450,
        totalSeats: 42,
        isActive: true,
        ownerId: ownerSLTB._id,
      },
      {
        busNumber: 'UP ND-5201',
        busType: 'AC',
        operatorName: 'Uva Heritage Express',
        from: 'Colombo',
        to: 'Badulla',
        routeStops: ['Colombo', 'Avissawella', 'Ratnapura', 'Pelmadulla', 'Balangoda', 'Beragala', 'Haputale', 'Bandarawela', 'Badulla Central'],
        departureTime: '06:15',
        arrivalTime: '12:45',
        fare: 1950,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerSLTB._id,
      },
      {
        busNumber: 'CP ND-7814',
        busType: 'AC',
        operatorName: 'Hill Country Superline',
        from: 'Colombo',
        to: 'Nuwara Eliya',
        routeStops: ['Colombo', 'Avissawella', 'Karawanella', 'Ginigathena', 'Hatton', 'Nanu Oya', 'Nuwara Eliya Stand'],
        departureTime: '07:00',
        arrivalTime: '12:30',
        fare: 1750,
        totalSeats: 38,
        isActive: true,
        ownerId: ownerKandy._id,
      },
      {
        busNumber: 'EP ND-4402',
        busType: 'AC',
        operatorName: 'Eastern Wave Express',
        from: 'Colombo',
        to: 'Trincomalee',
        routeStops: ['Colombo', 'Kurunegala', 'Dambulla', 'Habarana', 'Kantale', 'Trincomalee Bus Stand'],
        departureTime: '22:00',
        arrivalTime: '04:30',
        fare: 2100,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerSLTB._id,
      },
      {
        busNumber: 'NW ND-6219',
        busType: 'AC',
        operatorName: 'Wayamba Intercity',
        from: 'Colombo',
        to: 'Kurunegala',
        routeStops: ['Colombo', 'Mirigama', 'Giriulla', 'Narammala', 'Kurunegala Stand'],
        departureTime: '08:00',
        arrivalTime: '10:15',
        fare: 620,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerKandy._id,
      },
      {
        busNumber: 'WP ND-3204',
        busType: 'AC',
        operatorName: 'Coastal & Airport Express',
        from: 'Colombo',
        to: 'Negombo',
        routeStops: ['Colombo (Pettah)', 'Peliyagoda', 'Ja-Ela', 'Katunayake Airport', 'Negombo Stand'],
        departureTime: '07:15',
        arrivalTime: '08:05',
        fare: 380,
        totalSeats: 36,
        isActive: true,
        ownerId: ownerSouthern._id,
      },
      {
        busNumber: 'SP NC-8815',
        busType: 'NON_AC',
        operatorName: 'Ruhunu Royal Express',
        from: 'Colombo',
        to: 'Galle',
        routeStops: ['Colombo', 'Moratuwa', 'Panadura', 'Kalutara', 'Aluthgama', 'Ambalangoda', 'Hikkaduwa', 'Galle'],
        departureTime: '06:00',
        arrivalTime: '09:30',
        fare: 480,
        totalSeats: 54,
        isActive: true,
        ownerId: ownerSouthern._id,
      },
      {
        busNumber: 'SP ND-9941',
        busType: 'AC',
        operatorName: 'Nilwala Highway Star',
        from: 'Galle',
        to: 'Colombo',
        routeStops: ['Galle Central', 'Kurundugahahetekma', 'Dodangoda', 'Gelanigama', 'Colombo (Makumbura)'],
        departureTime: '16:00',
        arrivalTime: '17:15',
        fare: 950,
        totalSeats: 44,
        isActive: true,
        ownerId: ownerSouthern._id,
      },
      {
        busNumber: 'CP ND-5520',
        busType: 'AC',
        operatorName: 'Kandy Queen Return',
        from: 'Kandy',
        to: 'Colombo',
        routeStops: ['Kandy (Goods Shed)', 'Peradeniya', 'Kadugannawa', 'Mawanella', 'Kegalle', 'Kadawatha', 'Colombo (Pettah)'],
        departureTime: '15:30',
        arrivalTime: '18:45',
        fare: 850,
        totalSeats: 42,
        isActive: true,
        ownerId: ownerKandy._id,
      },
      {
        busNumber: 'SP ND-2218',
        busType: 'AC',
        operatorName: 'Southern Royal Express',
        from: 'Colombo',
        to: 'Matara',
        routeStops: ['Colombo (Makumbura)', 'Galle', 'Weligama', 'Matara Stand'],
        departureTime: '14:00',
        arrivalTime: '15:45',
        fare: 1180,
        totalSeats: 40,
        isActive: true,
        ownerId: ownerSouthern._id,
      },
      {
        busNumber: 'NCP NA-9043',
        busType: 'NON_AC',
        operatorName: 'Shanthi Travels Intercity',
        from: 'Colombo',
        to: 'Anuradhapura',
        routeStops: ['Colombo', 'Ambepussa', 'Kurunegala', 'Dambulla', 'Kekirawa', 'Anuradhapura'],
        departureTime: '07:30',
        arrivalTime: '12:45',
        fare: 950,
        totalSeats: 54,
        isActive: true,
        ownerId: ownerSLTB._id,
      },
      {
        busNumber: 'SP NA-1123',
        busType: 'NON_AC',
        operatorName: 'Galle Coastal Line',
        from: 'Galle',
        to: 'Colombo',
        routeStops: ['Galle', 'Hikkaduwa', 'Ambalangoda', 'Bentota', 'Kalutara', 'Colombo'],
        departureTime: '13:00',
        arrivalTime: '16:30',
        fare: 480,
        totalSeats: 54,
        isActive: false, // Paused for maintenance (demonstrates the Active/Paused filter in Admin)
        ownerId: ownerSouthern._id,
      },
    ]);

    console.log(`Successfully registered ${buses.length} real Sri Lankan buses across major highway & intercity routes.`);

    // 3. Create Sample Bookings for realistic date reservations
    const date1 = '2026-09-10';
    const date2 = '2026-09-12';
    const date3 = '2026-09-15';

    await Booking.create([
      {
        bookingId: 'RLK-2026-001',
        userId: passenger1._id,
        busId: buses[0]._id, // WP NA-4512 Colombo -> Galle
        travelDate: date1,
        seats: [1, 2, 3, 4],
        passengerCount: 4,
        farePerSeat: buses[0].fare,
        totalFare: buses[0].fare * 4,
        status: 'CONFIRMED',
      },
      {
        bookingId: 'RLK-2026-002',
        userId: passenger2._id,
        busId: buses[1]._id, // SP ND-7890 Colombo -> Matara
        travelDate: date1,
        seats: [5, 6],
        passengerCount: 2,
        farePerSeat: buses[1].fare,
        totalFare: buses[1].fare * 2,
        status: 'CONFIRMED',
      },
      {
        bookingId: 'RLK-2026-003',
        userId: passenger3._id,
        busId: buses[2]._id, // CP NB-6590 Colombo -> Kandy
        travelDate: date2,
        seats: [11, 12],
        passengerCount: 2,
        farePerSeat: buses[2].fare,
        totalFare: buses[2].fare * 2,
        status: 'CONFIRMED',
      },
      {
        bookingId: 'RLK-2026-004',
        userId: passenger1._id,
        busId: buses[4]._id, // NP ND-9844 Colombo -> Jaffna
        travelDate: date3,
        seats: [7, 8, 9],
        passengerCount: 3,
        farePerSeat: buses[4].fare,
        totalFare: buses[4].fare * 3,
        status: 'CONFIRMED',
      },
      {
        bookingId: 'RLK-2026-005',
        userId: passenger2._id,
        busId: buses[7]._id, // UP ND-5201 Colombo -> Badulla
        travelDate: date2,
        seats: [14],
        passengerCount: 1,
        farePerSeat: buses[7].fare,
        totalFare: buses[7].fare * 1,
        status: 'CANCELLED',
      },
    ]);

    console.log('Created realistic verified bookings.');
    console.log('\n======================================================');
    console.log('✅ ROUTELK DATABASE SEEDED WITH REAL SRI LANKAN FLEET');
    console.log('======================================================');
    console.log('System Accounts:');
    console.log('  Admin:       admin@routelk.lk        / admin123');
    console.log('  SLTB:        sltb@routelk.lk         / owner123');
    console.log('  Southern:    southern@routelk.lk     / owner123');
    console.log('  Kandy Royal: kandyroyal@routelk.lk   / owner123');
    console.log('  Yarl Super:  yarlsuperline@routelk.lk/ owner123');
    console.log('  Passenger:   kasun@routelk.lk        / pass123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
