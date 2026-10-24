export type UserType = 'Admin' | 'Manager' | 'BA Staff';
export type UserStatus = 'Active' | 'Pending' | 'Inactive';

export interface User {
  id: string;
  name: string;
  password?: string;
  location: string; // "latitude,longitude"
  startDate: string;
  status: UserStatus;
  type: UserType;
  managerId?: string;
  avatar?: string; // base64 or image url
}

export type LeaveType = 'TI' | 'CS' | 'AL' | 'UL' | 'SL' | 'SPL' | 'C-O' | 'PH' | 'Off';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  userName: string;
  managerId?: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt?: string;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName?: string;
  userType?: string;
  action: 'IN' | 'OUT';
  timestamp: string; // ISO string or formatted
  location?: string;
  details?: string;
  checkIn?: string;
  checkOut?: string;
  distanceMeters?: number;
}

export interface LeaveTypeMeta {
  code: LeaveType;
  labelKh: string;
  labelEn: string;
  color: string;
  bgColor: string;
  description: string;
}

export const LEAVE_TYPES: LeaveTypeMeta[] = [
  { code: 'TI', labelKh: 'TI (បញ្ហាបច្ចេកទេស)', labelEn: 'Technical issue', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200', description: 'ការបណ្តុះបណ្តាល ឬបេសកកម្មផ្ទៃក្នុង' },
  { code: 'CS', labelKh: 'CS (ហាងបិទ)', labelEn: 'Change Shift', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200', description: 'ស្នើសុំដូរវេនការងារ ឬម៉ោងធ្វើការ' },
  { code: 'AL', labelKh: 'AL (ច្បាប់ប្រចាំឆ្នាំ)', labelEn: 'Annual Leave', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200', description: 'ច្បាប់ឈប់សម្រាកប្រចាំឆ្នាំមានប្រាក់ខែ' },
  { code: 'UL', labelKh: 'UL (ច្បាប់អត់ប្រាក់ខែ)', labelEn: 'Unpaid Leave', color: 'text-slate-700', bgColor: 'bg-slate-100 border-slate-200', description: 'ច្បាប់ឈប់សម្រាកឥតប្រាក់បៀវត្ស' },
  { code: 'SL', labelKh: 'SL (ច្បាប់ឈឺ)', labelEn: 'Sick Leave', color: 'text-rose-700', bgColor: 'bg-rose-50 border-rose-200', description: 'ច្បាប់ឈប់សម្រាកព្យាបាលជំងឺ' },
  { code: 'SPL', labelKh: 'SPL (ច្បាប់ពិសេស)', labelEn: 'Special Leave', color: 'text-purple-700', bgColor: 'bg-purple-50 border-purple-200', description: 'ច្បាប់ពិសេស (រៀបការ សម្រាលកូន ឬធុរៈគ្រួសារ)' },
  { code: 'C-O', labelKh: 'C-O (ប្ដូរវេន)', labelEn: 'Compensatory Off', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200', description: 'សម្រាកប៉ះប៉ូវម៉ោងធ្វើការបន្ថែម/ថ្ងៃបុណ្យ' },
  { code: 'PH', labelKh: 'PH (បុណ្យជាតិ)', labelEn: 'Public Holiday', color: 'text-teal-700', bgColor: 'bg-teal-50 border-teal-200', description: 'ឈប់សម្រាកថ្ងៃបុណ្យជាតិផ្លូវការ' },
  { code: 'Off', labelKh: 'Off (ថ្ងៃសម្រាកប្រចាំសប្តាហ៍)', labelEn: 'Day Off', color: 'text-cyan-700', bgColor: 'bg-cyan-50 border-cyan-200', description: 'ថ្ងៃឈប់សម្រាកវេនប្រចាំសប្តាហ៍' },
];

export const MANAGER_IDS = [
  'DTBM',
  'DTBT',
  'DTKC',
  'DTKCH',
  'DTKD',
  'DTKPS',
  'DTKS',
  'DTKT',
  'DTPP1',
  'DTPP2',
  'DTPP3',
  'DTPV',
  'DTSR',
  'DTTK',
];

export interface Product {
  id: string;
  productCode: string;
  name: string;
  category?: string;
  price: number;
  imageUrl?: string;
  stockQty: number; // Current on-hand balance
  initialStock?: number; // Starting stock
  stockIn?: number; // Total added
  totalSold: number; // Total sold
  minAlertQty?: number; // Low stock alert threshold
  isHot?: boolean;
}

export type StockAdjustmentStatus = 'Pending' | 'Approved' | 'Rejected';
export type StockAdjustmentType = 'Stock In' | 'Adjustment' | 'Damage' | 'Return';

export interface StockInRecord {
  id: string;
  date: string;
  timestamp: string;
  productCode: string;
  productName: string;
  addedQty: number;
  previousStock: number;
  newStock: number;
  updatedBy: string; // Set to BA ID (e.g. BA00001, BA00002) per user request
  baId?: string; // Explicit ID BA
  requestedById?: string; // ID BA of requester
  requestedBy?: string; // Name of requester
  status: StockAdjustmentStatus; // 'Pending' | 'Approved' | 'Rejected'
  type?: StockAdjustmentType;
  approvedBy?: string; // Admin or Manager name who approved
  approvedById?: string; // Admin or Manager ID
  approvedAt?: string;
  rejectedReason?: string;
  note?: string;
}

export interface SalesOrderItem {
  productCode: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  imageUrl?: string;
}

export interface SalesOrder {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO string
  baId: string;
  baName: string;
  province: string;
  isNoSales: boolean;
  items: SalesOrderItem[];
  totalItems: number;
  totalQty: number;
  totalAmount: number;
  status?: 'Submitted' | 'Synced' | 'Pending';
}

export const CAMBODIAN_PROVINCES = [
  'ភ្នំពេញ (Phnom Penh)',
  'កណ្ដាល (Kandal)',
  'សៀមរាប (Siem Reap)',
  'បាត់ដំបង (Battambang)',
  'កំពង់ចាម (Kampong Cham)',
  'កំពង់ធំ (Kampong Thom)',
  'កំពង់ឆ្នាំង (Kampong Chhnang)',
  'កំពង់ស្ពឺ (Kampong Speu)',
  'តាកែវ (Takeo)',
  'ព្រៃវែង (Prey Veng)',
  'ស្វាយរៀង (Svay Rieng)',
  'កំពត (Kampot)',
  'កែប (Kep)',
  'ព្រះសីហនុ (Preah Sihanouk)',
  'កោះកុង (Koh Kong)',
  'បន្ទាយមានជ័យ (Banteay Meanchey)',
  'ពោធិ៍សាត់ (Pursat)',
  'ប៉ៃលិន (Pailin)',
  'ឧត្តរមានជ័យ (Oddar Meanchey)',
  'ព្រះវិហារ (Preah Vihear)',
  'ស្ទឹងត្រែង (Stung Treng)',
  'ក្រចេះ (Kratie)',
  'រតនគិរី (Ratanakiri)',
  'មណ្ឌលគិរី (Mondulkiri)',
  'ត្បូងឃ្មុំ (Tboung Khmum)',
];

