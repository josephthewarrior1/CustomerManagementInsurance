import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import ApiConfig from '../src/utils/ApiConfig.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBg72_imTZRZ9RaZs9_9X3eRdDLVrHmuag',
  authDomain: 'pt-kuda-jaya-abadi.firebaseapp.com',
  databaseURL: 'https://pt-kuda-jaya-abadi-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'pt-kuda-jaya-abadi',
  storageBucket: 'pt-kuda-jaya-abadi.firebasestorage.app',
  messagingSenderId: '546945993573',
  appId: '1:546945993573:web:9f63bc454edfda7b73ef8c',
  measurementId: 'G-KVZ09E40P7',
};

const seedEmail = process.env.SEED_EMAIL || 'josep@gmail.com';
const seedPassword = process.env.SEED_PASSWORD;
const baseUrl = process.env.SEED_API_URL || ApiConfig.base_url;
const dryRun = process.argv.includes('--dry-run');

const customers = [
  {
    key: 'josep-pratama',
    data: {
      name: 'Josep Pratama',
      email: 'josep.customer1@gmail.com',
      phone: '081215797878',
      address: 'Jl. Pademangan III Raya No. 14, Jakarta',
      notes: 'Customer Josep - kendaraan expired dan perlu follow up perpanjangan.',
    },
    cars: [
      {
        carOwnerName: 'Josep Pratama',
        carBrand: 'Toyota',
        carModel: 'Avanza',
        plateNumber: 'B 3321 BFR',
        chassisNumber: 'M12HJOPIK',
        engineNumber: 'ENG-AVZ-7788',
        startDate: '2025-02-01',
        dueDate: '2026-02-06',
        carPrice: 200000000,
        year: '2021',
        color: 'Hitam',
        status: 'Active',
      },
    ],
    properties: [
      {
        propertyData: {
          propertyType: 'Office',
          address: 'Jl. Senopati 8',
          city: 'Jakarta',
          province: 'DKI Jakarta',
          postalCode: '14410',
          buildingArea: '250',
          landArea: '2000',
          numberOfFloors: '5',
          yearBuilt: '2006',
          propertyValue: '4000000000',
          buildingStructure: 'Beton',
        },
        insuranceData: {
          policyNumber: 'PROP-JSP-001',
          insuranceCompany: 'ACA',
          coverageType: 'All Risk',
          insuranceValue: '5000000000',
          premium: '50000000',
          startDate: 1767225600000,
          endDate: 1769040000000,
          deductible: '3123123131',
        },
        notes: 'Properti expired, data dokumen/foto dikosongkan dulu.',
        status: 'Expired',
      },
    ],
  },
  {
    key: 'josep-imanuel',
    data: {
      name: 'Josep Imanuel',
      email: '',
      phone: '0812929181',
      address: 'Jl. Kecamatan Adriano, Jakarta',
      notes: '',
    },
    cars: [
      {
        carOwnerName: 'Josep Imanuel',
        carBrand: 'Honda',
        carModel: 'HR-V',
        plateNumber: 'D 5678 XYZ',
        chassisNumber: 'HNDHRV202345678',
        engineNumber: 'ENGHRV998877',
        startDate: '2026-03-15',
        dueDate: '2027-03-15',
        carPrice: 275000000,
        year: '2022',
        color: 'Putih',
        status: 'Active',
      },
      {
        carOwnerName: 'Josep Imanuel',
        carBrand: 'BMW',
        carModel: '320i',
        plateNumber: 'B 911 VFR',
        chassisNumber: '',
        engineNumber: '',
        startDate: '2025-04-04',
        dueDate: '2026-04-04',
        carPrice: 0,
        year: '',
        color: '',
        status: 'Active',
      },
    ],
    properties: [],
  },
  {
    key: 'josep-setiawan',
    data: {
      name: 'Josep Setiawan',
      email: 'josepsetiawan.customer@gmail.com',
      phone: '085133123652',
      address: '',
      notes: 'Data sengaja sebagian kosong, nanti dilengkapi manual.',
    },
    cars: [
      {
        carOwnerName: 'Josep Setiawan',
        carBrand: 'Lexus',
        carModel: 'RX',
        plateNumber: 'B 700 JSP',
        chassisNumber: '',
        engineNumber: '',
        startDate: '2026-04-20',
        dueDate: '2026-05-20',
        carPrice: 850000000,
        year: '2023',
        color: 'Silver',
        status: 'Active',
      },
    ],
    properties: [
      {
        propertyData: {
          propertyType: 'House',
          address: 'Jl. Raya Bogor Km 30',
          city: 'Bogor',
          province: 'Jawa Barat',
          postalCode: '',
          buildingArea: '',
          landArea: '',
          numberOfFloors: '',
          yearBuilt: '',
          propertyValue: '',
          buildingStructure: '',
        },
        insuranceData: {
          policyNumber: 'PROP-JSP-002',
          insuranceCompany: 'Sinarmas',
          coverageType: 'Fire',
          insuranceValue: '1500000000',
          premium: '',
          startDate: 1772409600000,
          endDate: 1803945600000,
          deductible: '',
        },
        notes: '',
        status: 'Active',
      },
    ],
  },
];

function requirePassword() {
  if (!dryRun && !seedPassword) {
    throw new Error('Isi dulu SEED_PASSWORD buat login user josep@gmail.com.');
  }
}

async function request(endpoint, method, token, body) {
  if (dryRun) {
    console.log(`[dry-run] ${method} ${endpoint}`, body ? JSON.stringify(body) : '');
    return { success: true, dryRun: true };
  }

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(`${method} ${endpoint} gagal: ${payload.error || payload.message || response.statusText}`);
  }
  return payload;
}

function getCreatedCustomerId(response, fallbackKey) {
  return response.customer?.id || response.data?.id || response.id || response.customerId || fallbackKey;
}

async function main() {
  requirePassword();

  let token = 'dry-run-token';
  if (!dryRun) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const credential = await signInWithEmailAndPassword(auth, seedEmail, seedPassword);
    token = await credential.user.getIdToken();
  }

  console.log(`Seeding customer data for ${seedEmail} -> ${baseUrl}`);

  for (const item of customers) {
    const customerResponse = await request('/api/customers', 'POST', token, item.data);
    const customerId = getCreatedCustomerId(customerResponse, item.key);
    console.log(`Created customer: ${item.data.name} (${customerId})`);

    for (const car of item.cars) {
      const response = await request('/api/cars', 'POST', token, { customerId, ...car });
      console.log(`  Created car: ${car.plateNumber} (${response.car?.id || response.id || 'ok'})`);
    }

    for (const property of item.properties) {
      const response = await request('/api/properties', 'POST', token, {
        customerId,
        ownerName: item.data.name,
        ownerPhone: item.data.phone,
        ownerEmail: item.data.email,
        ...property,
      });
      console.log(`  Created property: ${property.propertyData.propertyType} (${response.property?.id || response.id || 'ok'})`);
    }
  }

  console.log('Done.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
