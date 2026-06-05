/**
 * TypeScript definitions and constants for the Sheets Personal Vault Manager.
 */

export interface RecordBase {
  _rowNum?: number; // Represent the Spreadsheet Row index (2-indexed)
  [key: string]: any;
}

export interface PersonalDataRecord extends RecordBase {
  Name: string;
  DOB: string;
  AdharNumber: string;
  PanNumber: string;
  DrivingLicence: string;
  MobileNumber: string;
  AlternateMobileNumber: string;
  EmailID: string;
  EpicNumber?: string;
}

export interface FinancialDataRecord extends RecordBase {
  AccountHolderName: string;
  AccountType: string;
  BankName: string;
  AccountNumber: string;
  IFSC: string;
  UserID: string;
  Password: string;
  LinkedMobileNumber: string;
  LinkedEmail: string;
  SecurityAnswers: string;
  CustomerID?: string;
  ProfilePassword?: string;
}

export interface CardRecord extends RecordBase {
  "Debit/Credit"?: string;
  CardType: string;
  IssuedBank: string;
  CardNumber: string;
  Expiry: string;
  CVV: string;
  PIN: string;
  CardHolderName: string;
}

export interface MediaGmailRecord extends RecordBase {
  Particulars: string;
  Userid: string;
  Password: string;
  MobileNumber: string;
  RecoveryMail?: string;
}

export interface OthersRecord extends RecordBase {
  Particulars: string;
  Userid: string;
  Password: string;
  MobileNumber: string;
  Remarks: string;
}

export interface DocumentsRecord extends RecordBase {
  Title: string;
  DocType: string;
  DocNumber?: string;
  FileAttachment: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type: "text" | "date" | "password" | "tel" | "email" | "url" | "select" | "file";
  placeholder: string;
  options?: string[]; // for "select" type
  required: boolean;
}

export interface CategorySchema {
  id: string;
  title: string;
  sheetName: string;
  description: string;
  icon: string; // Lucide icon key name
  color: string; // Tailwind color name for highlights
  fields: FieldDefinition[];
}

export const CATEGORIES: CategorySchema[] = [
  {
    id: "personal",
    title: "Personal Data",
    sheetName: "PersonalData",
    description: "National ID details, key documents, basic info, and contact numbers.",
    icon: "User",
    color: "indigo",
    fields: [
      { key: "Name", label: "Full Name", type: "text", placeholder: "e.g. John Doe", required: true },
      { key: "DOB", label: "Date of Birth", type: "date", placeholder: "", required: false },
      { key: "AdharNumber", label: "Aadhaar Card Number", type: "text", placeholder: "e.g. 1234 5678 9012", required: false },
      { key: "PanNumber", label: "PAN Card Number", type: "text", placeholder: "e.g. ABCDE1234F", required: false },
      { key: "DrivingLicence", label: "Driving Licence ID", type: "text", placeholder: "e.g. DL-1234567890123", required: false },
      { key: "MobileNumber", label: "Primary Mobile Number", type: "tel", placeholder: "e.g. +91 98765 43210", required: true },
      { key: "AlternateMobileNumber", label: "Alternate Mobile Number", type: "tel", placeholder: "e.g. +91 98765 01234", required: false },
      { key: "EmailID", label: "Personal Email ID", type: "email", placeholder: "e.g. john.doe@gmail.com", required: false },
      { key: "EpicNumber", label: "EPIC Number", type: "text", placeholder: "e.g. ABC1234567", required: false },
    ]
  },
  {
    id: "financial",
    title: "Financial Data",
    sheetName: "FinancialData",
    description: "Bank account numbers, IFSC codes, net banking login IDs, and secrets.",
    icon: "Briefcase",
    color: "emerald",
    fields: [
      { key: "AccountHolderName", label: "Account Holder Name", type: "text", placeholder: "e.g. John Doe", required: true },
      { key: "AccountType", label: "Account Type", type: "select", placeholder: "Select Account Type", options: ["Savings", "Current", "Salary", "Fixed Deposit", "Demat"], required: true },
      { key: "BankName", label: "Bank Name", type: "text", placeholder: "e.g. State Bank of India", required: true },
      { key: "AccountNumber", label: "Account Number", type: "text", placeholder: "e.g. 30912345678", required: true },
      { key: "IFSC", label: "IFSC Code", type: "text", placeholder: "e.g. SBIN0001234", required: true },
      { key: "UserID", label: "NetBanking User ID", type: "text", placeholder: "e.g. john_doe_net", required: false },
      { key: "Password", label: "NetBanking Password", type: "password", placeholder: "••••••••", required: false },
      { key: "LinkedMobileNumber", label: "Linked Mobile Number", type: "tel", placeholder: "e.g. +91 98765 43210", required: false },
      { key: "LinkedEmail", label: "Linked Email Address", type: "email", placeholder: "e.g. registered@email.com", required: false },
      { key: "SecurityAnswers", label: "Security Questions & Answers", type: "text", placeholder: "e.g. Pet: Rex, Highschool: Central High", required: false },
      { key: "CustomerID", label: "Customer ID", type: "text", placeholder: "e.g. 98124578", required: false },
      { key: "ProfilePassword", label: "PROFILE PASSWORD", type: "password", placeholder: "••••••••", required: false },
    ]
  },
  {
    id: "card",
    title: "Cards Ledger",
    sheetName: "Card",
    description: "Credit and debit card details, expiry check, CVV code, and cardholder lists.",
    icon: "CreditCard",
    color: "cyan",
    fields: [
      { key: "Debit/Credit", label: "Debit/Credit", type: "select", placeholder: "Select Debit/Credit", options: ["Debit", "Credit"], required: true },
      { key: "CardType", label: "Card Type / Association", type: "select", placeholder: "Select Card Type", options: ["Visa", "Mastercard", "Rupay", "Amex", "Maestro", "Other"], required: true },
      { key: "IssuedBank", label: "Issued Bank Name", type: "text", placeholder: "e.g. HDFC Bank", required: true },
      { key: "CardNumber", label: "16-digit Card Number", type: "text", placeholder: "e.g. 1234-3456-6789-1234", required: true },
      { key: "Expiry", label: "Expiry Date (MM/YY)", type: "text", placeholder: "MM/YY (e.g. 12/29)", required: true },
      { key: "CVV", label: "CVV Number (3-digit)", type: "password", placeholder: "e.g. 123", required: true },
      { key: "PIN", label: "ATM / Transaction PIN", type: "password", placeholder: "e.g. 9912", required: false },
      { key: "CardHolderName", label: "Cardholder Printed Name", type: "text", placeholder: "e.g. JOHN DOE", required: true },
    ]
  },
  {
    id: "media",
    title: "Media / Gmail",
    sheetName: "Media/Gmail",
    description: "Credentials and login identifiers for social media, Gmail portals, and stream services.",
    icon: "Mail",
    color: "amber",
    fields: [
      { key: "Particulars", label: "Service / Particulars Name", type: "text", placeholder: "e.g. Gmail - Office, Netflix, Twitter", required: true },
      { key: "Userid", label: "Username / Login Email", type: "text", placeholder: "e.g. john.office@gmail.com", required: true },
      { key: "Password", label: "Service Password", type: "password", placeholder: "••••••••", required: true },
      { key: "MobileNumber", label: "Recovery Mobile Number", type: "tel", placeholder: "e.g. +91 98765 43210", required: false },
      { key: "RecoveryMail", label: "Recovery Email Address", type: "email", placeholder: "e.g. recovery@gmail.com", required: false },
    ]
  },
  {
    id: "others",
    title: "Others Log",
    sheetName: "Others",
    description: "Miscellaneous server logins, locker passwords, WiFi keys, and customized fields.",
    icon: "Lock",
    color: "rose",
    fields: [
      { key: "Particulars", label: "Particulars Name", type: "text", placeholder: "e.g. Home Wi-Fi, Office Locker", required: true },
      { key: "Userid", label: "User ID / Code", type: "text", placeholder: "e.g. Admin / locker-b4", required: false },
      { key: "Password", label: "Locker Pin / Password", type: "password", placeholder: "e.g. 14789 / wifi_pass_99", required: true },
      { key: "MobileNumber", label: "Registered Mobile", type: "tel", placeholder: "e.g. +91 98765 43210", required: false },
      { key: "Remarks", label: "Additional Remarks / Notes", type: "text", placeholder: "e.g. Key kept in the upper bedside drawer", required: false },
    ]
  },
  {
    id: "documents",
    title: "Document Vault",
    sheetName: "Documents",
    description: "Secure digital locker for passport-sized photos, Aadhaar cards, Voter cards, PAN cards, and other PDFs/scans.",
    icon: "FileText",
    color: "purple",
    fields: [
      { key: "Title", label: "Document Name / Title", type: "text", placeholder: "e.g. Passport Photo 2026, My Aadhaar Card", required: true },
      { key: "DocType", label: "Document Category", type: "select", placeholder: "Select category", options: ["Passport Photo", "Aadhaar Card", "Driving Licence", "Voter ID Card", "PAN Card", "Other Document / Card"], required: true },
      { key: "DocNumber", label: "Document ID / Reference No.", type: "text", placeholder: "e.g. Aadhaar No, Voter Card No, PAN No", required: false },
      { key: "FileAttachment", label: "Upload Photo or PDF", type: "file", placeholder: "Select or drag & drop a PDF, JPG or PNG file", required: true }
    ]
  }
];

// Rich Initial Simulated Data
export const INITIAL_SIMULATED_DATA: Record<string, any[]> = {
  "PersonalData": [
    {
      _rowNum: 2,
      Name: "Aarav Sharma",
      DOB: "1994-08-14",
      AdharNumber: "5123 4567 8901",
      PanNumber: "BPLPS1234H",
      DrivingLicence: "DL-1420160089234",
      MobileNumber: "+91 98123 45678",
      AlternateMobileNumber: "+91 98123 99999",
      EmailID: "aarav.sharma@gmail.com",
      EpicNumber: "XYZ1234567"
    },
    {
      _rowNum: 3,
      Name: "Diya Patel",
      DOB: "2000-11-23",
      AdharNumber: "9876 5432 1098",
      PanNumber: "CLYPP9988G",
      DrivingLicence: "GJ-0120190014321",
      MobileNumber: "+91 98765 43210",
      AlternateMobileNumber: "",
      EmailID: "diya.patel@hotmail.com",
      EpicNumber: "ABC9876543"
    }
  ],
  "FinancialData": [
    {
      _rowNum: 2,
      AccountHolderName: "Aarav Sharma",
      AccountType: "Savings",
      BankName: "HDFC Bank",
      AccountNumber: "50100234567891",
      IFSC: "HDFC0000012",
      UserID: "aarav_hdfc_net",
      Password: "SecurePassword123!",
      LinkedMobileNumber: "+91 98123 45678",
      LinkedEmail: "aarav.sharma@gmail.com",
      SecurityAnswers: "First pet: Sparky. Place of birth: New Delhi.",
      CustomerID: "88127394",
      ProfilePassword: "ProfilePass1!"
    },
    {
      _rowNum: 3,
      AccountHolderName: "Sharma Business Solutions",
      AccountType: "Current",
      BankName: "ICICI Bank",
      AccountNumber: "000405123456",
      IFSC: "ICIC0000004",
      UserID: "sharma_biz_icici",
      Password: "BusinessBizPass987#",
      LinkedMobileNumber: "+91 98123 45678",
      LinkedEmail: "billing@sharmasolutions.com",
      SecurityAnswers: "Maternal grandmother: Preeti.",
      CustomerID: "7219034",
      ProfilePassword: "BizProfilePass99"
    }
  ],
  "Card": [
    {
      _rowNum: 2,
      "Debit/Credit": "Credit",
      CardType: "Visa",
      IssuedBank: "SBI Card",
      CardNumber: "4321-8899-7711-0022",
      Expiry: "09/28",
      CVV: "452",
      PIN: "4102",
      CardHolderName: "AARAV SHARMA"
    },
    {
      _rowNum: 3,
      "Debit/Credit": "Debit",
      CardType: "Mastercard",
      IssuedBank: "Axis Bank",
      CardNumber: "5243-0012-3456-7890",
      Expiry: "04/30",
      CVV: "089",
      PIN: "3591",
      CardHolderName: "DIYA PATEL"
    }
  ],
  "Media/Gmail": [
    {
      _rowNum: 2,
      Particulars: "Google Account (Primary)",
      Userid: "as.sharma.1994@gmail.com",
      Password: "MySuperSecretGmailPass2026",
      MobileNumber: "+91 98123 45678",
      RecoveryMail: "recovery.sharma@outlook.com"
    },
    {
      _rowNum: 3,
      Particulars: "Netflix Premium",
      Userid: "sharmas.family@gmail.com",
      Password: "NetflixAndChills99!",
      MobileNumber: "+91 98123 99999",
      RecoveryMail: "nas.backup@gmail.com"
    }
  ],
  "Others": [
    {
      _rowNum: 2,
      Particulars: "Apt B4 Wi-Fi",
      Userid: "Sharma_Home_5G",
      Password: "sharmasignalkey9988",
      MobileNumber: "",
      Remarks: "Router sits behind the main smart TV in the living room."
    },
    {
      _rowNum: 3,
      Particulars: "Main Locker Code",
      Userid: "Wardrobe Safe Guard",
      Password: "92-41-07-A",
      MobileNumber: "+91 98123 45678",
      Remarks: "Turn clockwise twice to 92, then counter-clockwise to 41."
    }
  ],
  "Documents": [
    {
      _rowNum: 2,
      Title: "Adhar Scan Copy",
      DocType: "Aadhaar Card",
      DocNumber: "5123 4567 8901",
      FileAttachment: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='250' viewBox='0 0 400 250'><rect width='100%' height='100%' fill='%230f172a' rx='16'/><rect x='20' y='20' width='360' height='210' fill='none' stroke='%2338bdf8' stroke-width='2' stroke-dasharray='4' rx='12'/><text x='40' y='60' fill='%23f1f5f9' font-family='sans-serif' font-size='20' font-weight='bold'>AADHAAR CARD</text><text x='40' y='90' fill='%2394a3b8' font-family='sans-serif' font-size='12'>Government of India</text><rect x='40' y='120' width='60' height='60' fill='%2338bdf8' opacity='0.2'/><path d='M50 130 h40 v40 h-40 z' fill='none' stroke='%2338bdf8' stroke-width='2'/><text x='120' y='140' fill='%23f1f5f9' font-family='sans-serif' font-size='14' font-weight='bold'>Aarav Sharma</text><text x='120' y='160' fill='%2394a3b8' font-family='sans-serif' font-size='12'>DOB: 14/08/1994</text><text x='40' y='210' fill='%2338bdf8' font-family='monospace' font-size='18' font-weight='bold'>5123  4567  8901</text></svg>"
    },
    {
      _rowNum: 3,
      Title: "Passport Size Photograph",
      DocType: "Passport Photo",
      DocNumber: "Photo-Aarav",
      FileAttachment: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'><rect width='100%' height='100%' fill='%233b82f6'/><circle cx='75' cy='60' r='30' fill='%231e293b'/><path d='M25 140 c10-35 90-35 100 0 z' fill='%231e293b'/></svg>"
    }
  ]
};

export function formatExpiryToMMYY(val: any): string {
  if (!val) return "MM/YY";
  const str = String(val).trim();
  if (!str) return "MM/YY";

  // If it is already in MM/YY format (e.g. 12/29)
  if (/^(0[1-9]|1[0-2])\/\d{2}$/.test(str)) {
    return str;
  }

  // Check if it matches YYYY-MM-DD or YYYY-MM
  const yyyymmddMatch = str.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2];
    return `${month}/${year.slice(-2)}`;
  }

  // Try parsing with JavaScript Date
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = String(d.getFullYear()).slice(-2);
      return `${month}/${year}`;
    }
  } catch (e) {
    // Falls through to next options
  }

  // If we can't parse it but it has a slash, e.g. "03/2026"
  if (str.includes("/")) {
    const parts = str.split("/");
    if (parts.length === 2 && parts[0].length <= 2 && parts[1].length === 4) {
      return `${parts[0].padStart(2, "0")}/${parts[1].slice(-2)}`;
    }
  }

  return str;
}

export function formatCardNumber(val: any): string {
  if (!val) return "";
  const clean = String(val).replace(/\D/g, "");
  // Limit to 16 digits
  const limited = clean.slice(0, 16);
  const parts = [];
  for (let i = 0; i < limited.length; i += 4) {
    parts.push(limited.slice(i, i + 4));
  }
  return parts.join("-");
}

export interface BlueprintFeature {
  id: string;
  name: string;
  description: string;
  category: string;
  complexity: string;
}

export interface BlueprintAesthetic {
  theme: string;
  primaryColor: string;
  fontFamily: string;
}

export interface StarterBlueprint {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  aesthetic: BlueprintAesthetic;
  wireframeLayout: string[];
  features: BlueprintFeature[];
}

export interface PromptDraft {
  title: string;
  targetAudience: string;
  selectedFeatures: string[];
  themeChoice: string;
  customNotes: string;
}


