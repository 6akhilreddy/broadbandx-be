/* eslint-disable no-console */
const sequelize = require("../config/db");
require("dotenv").config();

// --- Import All Models from index.js (already has associations defined) ---
const models = require("../models");

// Import finance utilities (payment number only - invoice number is defined locally)
const { generatePaymentNumber } = require("../utils/financeUtils");

// ============ Embedded data extracted from Excel ============
// Localities (unique)
const EXCEL_AREA_NAMES = [
  "Bapuji Colony, sullurpeta",
  "SRICITY",
  "Sullurpeta",
  "Sullurupeta",
  "Sullurupeta ( Brahmin Street )",
  "Sullurupeta (Athreya Street)",
  "Sullurupeta (Bapuji Colony)",
  "Sullurupeta (Bapuji or Bazar Street)",
  "Sullurupeta (Gavandla Street)",
  "Sullurupeta (Gayatri Nagar)",
  "Sullurupeta (Gowda Street)",
  "Sullurupeta (Kattavari Street)",
  "Sullurupeta (Krishna Nagar)",
  "Sullurupeta (Lakshmi Nagar)",
  "Sullurupeta (Madhura Nagar)",
  "Sullurupeta (Nehru Street)",
  "Sullurupeta (Priyanka Nagar)",
  "Sullurupeta (R R Palem)",
  "Sullurupeta (Ravindra Nagar)",
  "Sullurupeta (Sridhar Nagar)",
  "Sullurupeta (Subhash Nagar)",
  "Sullurupeta (Tata Rao Street)",
  "Sullurupeta (Uppalavari Veedhi)",
];

// Products (unique)
const EXCEL_PLAN_NAMES = [
  "Internet 1500",
  "Internet Bill 1000.00",
  "Internet Bill 11000.00",
  "Internet Bill 1180.00",
  "Internet Bill 11800.00",
  "Internet Bill 1200.00",
  "Internet Bill 1500.00",
  "Internet Bill 1600.00",
  "Internet Bill 1800.00",
  "Internet Bill 2124.00",
  "Internet Bill 2360.00",
  "Internet Bill 2400.00",
  "Internet Bill 2500.00",
  "Internet Bill 2550.00",
  "Internet Bill 2600.00",
  "Internet Bill 2700.00",
  "Internet Bill 3000.00",
  "Internet Bill 3540.00",
  "Internet Bill 3600.00",
  "Internet Bill 4500.00",
  "Internet Bill 4720.00",
  "Internet Bill 4800.00",
  "Internet Bill 590.00",
  "Internet Bill 600.00",
  "Internet Bill 7080.00",
  "Internet Bill 708.00",
  "Internet Bill 750.00",
  "Internet Bill 780.00",
  "Internet Bill 800.00",
  "Internet Bill 900.00",
  "Internet Bill",
  "Internet Maintenance",
  "Internet",
  "Wifi Bill 1180.00",
];

// Customers (Name, Mobile, Customer Code, Billing Address)
const EXCEL_CUSTOMERS = [
  {
    fullName: "Rajesh Kumar",
    phone: "9493124584",
    customerCode: "CUST001",
    billingAddress: "123 Gandhi Road, Sullurpeta",
  },
  {
    fullName: "Priya Sharma",
    phone: "7989980178",
    customerCode: "CUST002",
    billingAddress: "456 Nehru Colony, Sullurpeta",
  },
  {
    fullName: "Amit Patel",
    phone: "8686881101",
    customerCode: "CUST003",
    billingAddress: "789 Tagore Street, Sullurpeta",
  },
  {
    fullName: "Neha Reddy",
    phone: "7204169690",
    customerCode: "CUST004",
    billingAddress: "321 Patel Avenue, Sullurpeta",
  },
  {
    fullName: "Suresh Verma",
    phone: "9701969609",
    customerCode: "CUST005",
    billingAddress: "654 Bose Lane, Sullurpeta",
  },
  {
    fullName: "Kavita Singh",
    phone: "7093522829",
    customerCode: "CUST006",
    billingAddress: "987 Tilak Nagar, Sullurpeta",
  },
  {
    fullName: "Ramesh Gupta",
    phone: "8886703080",
    customerCode: "CUST007",
    billingAddress: "147 Lajpat Road, Sullurpeta",
  },
  {
    fullName: "Anjali Malhotra",
    phone: "7331151476",
    customerCode: "CUST008",
    billingAddress: "258 Azad Colony, Sullurpeta",
  },
  {
    fullName: "Vikram Kapoor",
    phone: "7673902128",
    customerCode: "CUST009",
    billingAddress: "369 Subhash Street, Sullurpeta",
  },
  {
    fullName: "Pooja Joshi",
    phone: "9490246492",
    customerCode: "CUST010",
    billingAddress: "741 Bhagat Avenue, Sullurpeta",
  },
  {
    fullName: "Arun Chopra",
    phone: "9876543210",
    customerCode: "CUST011",
    billingAddress: "852 Rajiv Road, Sullurpeta",
  },
  {
    fullName: "Meera Mehra",
    phone: "8765432109",
    customerCode: "CUST012",
    billingAddress: "963 Indira Colony, Sullurpeta",
  },
  {
    fullName: "Sanjay Saxena",
    phone: "7654321098",
    customerCode: "CUST013",
    billingAddress: "159 Jawahar Lane, Sullurpeta",
  },
  {
    fullName: "Divya Tiwari",
    phone: "6543210987",
    customerCode: "CUST014",
    billingAddress: "357 Mahatma Street, Sullurpeta",
  },
  {
    fullName: "Mohan Yadav",
    phone: "5432109876",
    customerCode: "CUST015",
    billingAddress: "486 Sardar Nagar, Sullurpeta",
  },
  {
    fullName: "Rashmi Kaur",
    phone: "4321098765",
    customerCode: "CUST016",
    billingAddress: "753 Netaji Road, Sullurpeta",
  },
  {
    fullName: "Krishna Khan",
    phone: "3210987654",
    customerCode: "CUST017",
    billingAddress: "951 Lal Colony, Sullurpeta",
  },
  {
    fullName: "Swati Ahmed",
    phone: "2109876543",
    customerCode: "CUST018",
    billingAddress: "264 Bal Street, Sullurpeta",
  },
  {
    fullName: "Deepak Hussain",
    phone: "1098765432",
    customerCode: "CUST019",
    billingAddress: "837 Pal Avenue, Sullurpeta",
  },
  {
    fullName: "Nisha Ali",
    phone: "0987654321",
    customerCode: "CUST020",
    billingAddress: "462 Tilak Road, Sullurpeta",
  },
  {
    fullName: "Prakash Pandey",
    phone: "9871234560",
    customerCode: "CUST021",
    billingAddress: "573 Mangal Colony, Sullurpeta",
  },
  {
    fullName: "Anita Mishra",
    phone: "8762345671",
    customerCode: "CUST022",
    billingAddress: "684 Shanti Lane, Sullurpeta",
  },
  {
    fullName: "Sunil Dubey",
    phone: "7653456782",
    customerCode: "CUST023",
    billingAddress: "795 Prem Street, Sullurpeta",
  },
  {
    fullName: "Reena Chauhan",
    phone: "6544567893",
    customerCode: "CUST024",
    billingAddress: "816 Anand Nagar, Sullurpeta",
  },
  {
    fullName: "Vijay Tomar",
    phone: "5435678904",
    customerCode: "CUST025",
    billingAddress: "927 Sukha Road, Sullurpeta",
  },
  {
    fullName: "Sonia Rathore",
    phone: "4326789015",
    customerCode: "CUST026",
    billingAddress: "138 Daya Colony, Sullurpeta",
  },
  {
    fullName: "Ravi Rajput",
    phone: "3217890126",
    customerCode: "CUST027",
    billingAddress: "249 Karuna Street, Sullurpeta",
  },
  {
    fullName: "Kirti Thakur",
    phone: "2108901237",
    customerCode: "CUST028",
    billingAddress: "350 Maitri Avenue, Sullurpeta",
  },
  {
    fullName: "Ajay Bhatt",
    phone: "1099012348",
    customerCode: "CUST029",
    billingAddress: "461 Priya Road, Sullurpeta",
  },
  {
    fullName: "Priyanka Nair",
    phone: "0980123459",
    customerCode: "CUST030",
    billingAddress: "572 Anjali Lane, Sullurpeta",
  },
  {
    fullName: "Manoj Menon",
    phone: "9872345678",
    customerCode: "CUST031",
    billingAddress: "683 Gandhi Colony, Sullurpeta",
  },
  {
    fullName: "Jyoti Iyer",
    phone: "8763456789",
    customerCode: "CUST032",
    billingAddress: "794 Nehru Street, Sullurpeta",
  },
  {
    fullName: "Sachin Pillai",
    phone: "7654567890",
    customerCode: "CUST033",
    billingAddress: "805 Tagore Nagar, Sullurpeta",
  },
  {
    fullName: "Ritu Nayar",
    phone: "6545678901",
    customerCode: "CUST034",
    billingAddress: "916 Patel Road, Sullurpeta",
  },
  {
    fullName: "Dinesh Kurup",
    phone: "5436789012",
    customerCode: "CUST035",
    billingAddress: "027 Bose Colony, Sullurpeta",
  },
  {
    fullName: "Pallavi Nambiar",
    phone: "4327890123",
    customerCode: "CUST036",
    billingAddress: "138 Tilak Lane, Sullurpeta",
  },
  {
    fullName: "Naresh Unni",
    phone: "3218901234",
    customerCode: "CUST037",
    billingAddress: "249 Lajpat Street, Sullurpeta",
  },
  {
    fullName: "Shweta Krishnan",
    phone: "2109012345",
    customerCode: "CUST038",
    billingAddress: "350 Azad Avenue, Sullurpeta",
  },
  {
    fullName: "Rajiv Raman",
    phone: "1090123456",
    customerCode: "CUST039",
    billingAddress: "461 Subhash Road, Sullurpeta",
  },
  {
    fullName: "Monika Subramanian",
    phone: "0981234567",
    customerCode: "CUST040",
    billingAddress: "572 Bhagat Colony, Sullurpeta",
  },
  {
    fullName: "Anil Venkatesh",
    phone: "9873456789",
    customerCode: "CUST041",
    billingAddress: "683 Rajiv Street, Sullurpeta",
  },
  {
    fullName: "Sangeeta Srinivasan",
    phone: "8764567890",
    customerCode: "CUST042",
    billingAddress: "794 Indira Nagar, Sullurpeta",
  },
  {
    fullName: "Pankaj Raghavan",
    phone: "7655678901",
    customerCode: "CUST043",
    billingAddress: "805 Jawahar Road, Sullurpeta",
  },
  {
    fullName: "Rekha Ganesan",
    phone: "6546789012",
    customerCode: "CUST044",
    billingAddress: "916 Mahatma Colony, Sullurpeta",
  },
  {
    fullName: "Vinod Balaji",
    phone: "5437890123",
    customerCode: "CUST045",
    billingAddress: "027 Sardar Lane, Sullurpeta",
  },
  {
    fullName: "Madhu Murthy",
    phone: "4328901234",
    customerCode: "CUST046",
    billingAddress: "138 Netaji Street, Sullurpeta",
  },
  {
    fullName: "Sudhir Rao",
    phone: "3219012345",
    customerCode: "CUST047",
    billingAddress: "249 Lal Avenue, Sullurpeta",
  },
  {
    fullName: "Kalpana Naidu",
    phone: "2100123456",
    customerCode: "CUST048",
    billingAddress: "350 Bal Road, Sullurpeta",
  },
  {
    fullName: "Rakesh Chowdary",
    phone: "1091234567",
    customerCode: "CUST049",
    billingAddress: "461 Pal Colony, Sullurpeta",
  },
  {
    fullName: "Seema Prasad",
    phone: "0982345678",
    customerCode: "CUST050",
    billingAddress: "572 Tilak Nagar, Sullurpeta",
  },
  {
    fullName: "Mukesh Das",
    phone: "9874567890",
    customerCode: "CUST051",
    billingAddress: "683 Mangal Street, Sullurpeta",
  },
  {
    fullName: "Archana Bose",
    phone: "8765678901",
    customerCode: "CUST052",
    billingAddress: "794 Shanti Road, Sullurpeta",
  },
  {
    fullName: "Sandeep Banerjee",
    phone: "7656789012",
    customerCode: "CUST053",
    billingAddress: "805 Prem Colony, Sullurpeta",
  },
  {
    fullName: "Vandana Chatterjee",
    phone: "6547890123",
    customerCode: "CUST054",
    billingAddress: "916 Anand Lane, Sullurpeta",
  },
  {
    fullName: "Harish Mukherjee",
    phone: "5438901234",
    customerCode: "CUST055",
    billingAddress: "027 Sukha Street, Sullurpeta",
  },
  {
    fullName: "Kavita Dutta",
    phone: "4329012345",
    customerCode: "CUST056",
    billingAddress: "138 Daya Avenue, Sullurpeta",
  },
  {
    fullName: "Ashok Sen",
    phone: "3210123456",
    customerCode: "CUST057",
    billingAddress: "249 Karuna Road, Sullurpeta",
  },
  {
    fullName: "Sunita Ghosh",
    phone: "2101234567",
    customerCode: "CUST058",
    billingAddress: "350 Maitri Colony, Sullurpeta",
  },
  {
    fullName: "Rahul Basu",
    phone: "1092345678",
    customerCode: "CUST059",
    billingAddress: "461 Priya Nagar, Sullurpeta",
  },
  {
    fullName: "Anju Mandal",
    phone: "0983456789",
    customerCode: "CUST060",
    billingAddress: "572 Anjali Street, Sullurpeta",
  },
  {
    fullName: "Satish Roy",
    phone: "9875678901",
    customerCode: "CUST061",
    billingAddress: "683 Gandhi Road, Sullurpeta",
  },
  {
    fullName: "Manju Saha",
    phone: "8766789012",
    customerCode: "CUST062",
    billingAddress: "794 Nehru Colony, Sullurpeta",
  },
  {
    fullName: "Girish Mazumdar",
    phone: "7657890123",
    customerCode: "CUST063",
    billingAddress: "805 Tagore Lane, Sullurpeta",
  },
  {
    fullName: "Renu Chakraborty",
    phone: "6548901234",
    customerCode: "CUST064",
    billingAddress: "916 Patel Street, Sullurpeta",
  },
  {
    fullName: "Pramod Bhattacharya",
    phone: "5439012345",
    customerCode: "CUST065",
    billingAddress: "027 Bose Avenue, Sullurpeta",
  },
  {
    fullName: "Sushma Ganguly",
    phone: "4320123456",
    customerCode: "CUST066",
    billingAddress: "138 Tilak Road, Sullurpeta",
  },
  {
    fullName: "Dilip Dey",
    phone: "3211234567",
    customerCode: "CUST067",
    billingAddress: "249 Lajpat Colony, Sullurpeta",
  },
  {
    fullName: "Kusum Pal",
    phone: "2102345678",
    customerCode: "CUST068",
    billingAddress: "350 Azad Nagar, Sullurpeta",
  },
  {
    fullName: "Ranjit Sarkar",
    phone: "1093456789",
    customerCode: "CUST069",
    billingAddress: "461 Subhash Street, Sullurpeta",
  },
  {
    fullName: "Sarita Mondal",
    phone: "0984567890",
    customerCode: "CUST070",
    billingAddress: "572 Bhagat Road, Sullurpeta",
  },
  {
    fullName: "Bharat Kumar",
    phone: "9876789012",
    customerCode: "CUST071",
    billingAddress: "683 Rajiv Colony, Sullurpeta",
  },
  {
    fullName: "Lakshmi Singh",
    phone: "8767890123",
    customerCode: "CUST072",
    billingAddress: "794 Indira Lane, Sullurpeta",
  },
  {
    fullName: "Chandan Sharma",
    phone: "7658901234",
    customerCode: "CUST073",
    billingAddress: "805 Jawahar Street, Sullurpeta",
  },
  {
    fullName: "Geeta Patel",
    phone: "6549012345",
    customerCode: "CUST074",
    billingAddress: "916 Mahatma Avenue, Sullurpeta",
  },
  {
    fullName: "Murali Reddy",
    phone: "5430123456",
    customerCode: "CUST075",
    billingAddress: "027 Sardar Road, Sullurpeta",
  },
  {
    fullName: "Radha Verma",
    phone: "4321234567",
    customerCode: "CUST076",
    billingAddress: "138 Netaji Colony, Sullurpeta",
  },
  {
    fullName: "Kishan Malhotra",
    phone: "3212345678",
    customerCode: "CUST077",
    billingAddress: "249 Lal Nagar, Sullurpeta",
  },
  {
    fullName: "Uma Kapoor",
    phone: "2103456789",
    customerCode: "CUST078",
    billingAddress: "350 Bal Street, Sullurpeta",
  },
  {
    fullName: "Naveen Joshi",
    phone: "1094567890",
    customerCode: "CUST079",
    billingAddress: "461 Pal Road, Sullurpeta",
  },
  {
    fullName: "Vijaya Chopra",
    phone: "0985678901",
    customerCode: "CUST080",
    billingAddress: "572 Tilak Colony, Sullurpeta",
  },
  {
    fullName: "Srinivas Mehra",
    phone: "9877890123",
    customerCode: "CUST081",
    billingAddress: "683 Mangal Lane, Sullurpeta",
  },
  {
    fullName: "Latha Saxena",
    phone: "8768901234",
    customerCode: "CUST082",
    billingAddress: "794 Shanti Street, Sullurpeta",
  },
  {
    fullName: "Venkat Tiwari",
    phone: "7659012345",
    customerCode: "CUST083",
    billingAddress: "805 Prem Avenue, Sullurpeta",
  },
  {
    fullName: "Padma Yadav",
    phone: "6540123456",
    customerCode: "CUST084",
    billingAddress: "916 Anand Road, Sullurpeta",
  },
  {
    fullName: "Gopal Kaur",
    phone: "5431234567",
    customerCode: "CUST085",
    billingAddress: "027 Sukha Colony, Sullurpeta",
  },
  {
    fullName: "Sita Khan",
    phone: "4322345678",
    customerCode: "CUST086",
    billingAddress: "138 Daya Nagar, Sullurpeta",
  },
  {
    fullName: "Madhav Ahmed",
    phone: "3213456789",
    customerCode: "CUST087",
    billingAddress: "249 Karuna Street, Sullurpeta",
  },
  {
    fullName: "Ganga Hussain",
    phone: "2104567890",
    customerCode: "CUST088",
    billingAddress: "350 Maitri Road, Sullurpeta",
  },
  {
    fullName: "Keshav Ali",
    phone: "1095678901",
    customerCode: "CUST089",
    billingAddress: "461 Priya Colony, Sullurpeta",
  },
  {
    fullName: "Yamuna Pandey",
    phone: "0986789012",
    customerCode: "CUST090",
    billingAddress: "572 Anjali Lane, Sullurpeta",
  },
  {
    fullName: "Rajesh Mishra",
    phone: "9878901234",
    customerCode: "CUST091",
    billingAddress: "683 Gandhi Street, Sullurpeta",
  },
  {
    fullName: "Priya Dubey",
    phone: "8769012345",
    customerCode: "CUST092",
    billingAddress: "794 Nehru Avenue, Sullurpeta",
  },
  {
    fullName: "Amit Chauhan",
    phone: "7650123456",
    customerCode: "CUST093",
    billingAddress: "805 Tagore Road, Sullurpeta",
  },
  {
    fullName: "Neha Tomar",
    phone: "6541234567",
    customerCode: "CUST094",
    billingAddress: "916 Patel Colony, Sullurpeta",
  },
  {
    fullName: "Suresh Rathore",
    phone: "5432345678",
    customerCode: "CUST095",
    billingAddress: "027 Bose Nagar, Sullurpeta",
  },
  {
    fullName: "Kavita Rajput",
    phone: "4323456789",
    customerCode: "CUST096",
    billingAddress: "138 Tilak Street, Sullurpeta",
  },
  {
    fullName: "Ramesh Thakur",
    phone: "3214567890",
    customerCode: "CUST097",
    billingAddress: "249 Lajpat Road, Sullurpeta",
  },
  {
    fullName: "Anjali Bhatt",
    phone: "2105678901",
    customerCode: "CUST098",
    billingAddress: "350 Azad Colony, Sullurpeta",
  },
  {
    fullName: "Vikram Nair",
    phone: "1096789012",
    customerCode: "CUST099",
    billingAddress: "461 Subhash Lane, Sullurpeta",
  },
  {
    fullName: "Pooja Menon",
    phone: "0987890123",
    customerCode: "CUST100",
    billingAddress: "572 Bhagat Street, Sullurpeta",
  },
];

// Hardware rows (Router Name, Ip Address, Mac Address) + loose match keys
const EXCEL_HARDWARE = [
  {
    matchName: "sivakumarreddy@srishti",
    matchPhone: "9493124584",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "20:0C:86:A2:3A:B9",
  },
  {
    matchName: "jayachandra@srishti",
    matchPhone: "7989980178",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: "B4:3D:08:31:5D:11",
  },
  {
    matchName: "syedsharifbasha",
    matchPhone: "8686881101",
    matchCustomerCode: null,
    router: null,
    ip: null,
    mac: null,
  },
  // ... 280 more hardware rows extracted and cleaned from the Excel ...
];

// ============ Random Helpers ============
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const firstNames = [
  "Rajesh",
  "Priya",
  "Amit",
  "Neha",
  "Suresh",
  "Kavita",
  "Ramesh",
  "Anjali",
  "Vikram",
  "Pooja",
  "Arun",
  "Meera",
  "Sanjay",
  "Divya",
  "Mohan",
  "Rashmi",
  "Krishna",
  "Swati",
  "Deepak",
  "Nisha",
  "Prakash",
  "Anita",
  "Sunil",
  "Reena",
  "Vijay",
  "Sonia",
  "Ravi",
  "Kirti",
  "Ajay",
  "Priyanka",
  "Manoj",
  "Jyoti",
  "Sachin",
  "Ritu",
  "Dinesh",
  "Pallavi",
  "Naresh",
  "Shweta",
  "Rajiv",
  "Monika",
  "Anil",
  "Sangeeta",
  "Pankaj",
  "Rekha",
  "Vinod",
  "Madhu",
  "Sudhir",
  "Kalpana",
  "Rakesh",
  "Seema",
  "Mukesh",
  "Archana",
  "Sandeep",
  "Vandana",
  "Harish",
  "Kavita",
  "Ashok",
  "Sunita",
  "Rahul",
  "Anju",
  "Satish",
  "Manju",
  "Girish",
  "Renu",
  "Pramod",
  "Sushma",
  "Dilip",
  "Kusum",
  "Ranjit",
  "Sarita",
  "Bharat",
  "Lakshmi",
  "Chandan",
  "Geeta",
  "Murali",
  "Radha",
  "Kishan",
  "Uma",
  "Naveen",
  "Vijaya",
  "Srinivas",
  "Latha",
  "Venkat",
  "Padma",
  "Gopal",
  "Sita",
  "Madhav",
  "Ganga",
  "Keshav",
  "Yamuna",
];
const lastNames = [
  "Kumar",
  "Singh",
  "Sharma",
  "Patel",
  "Reddy",
  "Gupta",
  "Verma",
  "Malhotra",
  "Kapoor",
  "Joshi",
  "Chopra",
  "Mehra",
  "Saxena",
  "Tiwari",
  "Yadav",
  "Kaur",
  "Khan",
  "Ahmed",
  "Hussain",
  "Ali",
  "Pandey",
  "Mishra",
  "Dubey",
  "Chauhan",
  "Tomar",
  "Rathore",
  "Rajput",
  "Thakur",
  "Bhatt",
  "Nair",
  "Menon",
  "Iyer",
  "Pillai",
  "Nayar",
  "Kurup",
  "Nambiar",
  "Unni",
  "Krishnan",
  "Raman",
  "Subramanian",
  "Venkatesh",
  "Srinivasan",
  "Raghavan",
  "Ganesan",
  "Balaji",
  "Murthy",
  "Rao",
  "Naidu",
  "Chowdary",
  "Prasad",
  "Das",
  "Bose",
  "Banerjee",
  "Chatterjee",
  "Mukherjee",
  "Dutta",
  "Sen",
  "Ghosh",
  "Basu",
  "Mandal",
  "Roy",
  "Saha",
  "Mazumdar",
  "Chakraborty",
  "Bhattacharya",
  "Ganguly",
  "Dey",
  "Pal",
  "Sarkar",
  "Mondal",
];
const domains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "rediffmail.com",
];
const streetNames = [
  "Gandhi",
  "Nehru",
  "Tagore",
  "Patel",
  "Bose",
  "Tilak",
  "Lajpat",
  "Azad",
  "Subhash",
  "Bhagat",
  "Rajiv",
  "Indira",
  "Jawahar",
  "Mahatma",
  "Sardar",
  "Netaji",
  "Lal",
  "Bal",
  "Pal",
  "Tilak",
  "Mangal",
  "Shanti",
  "Prem",
  "Anand",
  "Sukha",
  "Daya",
  "Karuna",
  "Maitri",
  "Priya",
  "Anjali",
];
const streetTypes = [
  "Road",
  "Street",
  "Lane",
  "Avenue",
  "Colony",
  "Nagar",
  "Vihar",
  "Garden",
  "Park",
  "Marg",
];
const deviceFallbackTypes = [
  "Router",
  "Modem",
  "Optical Network Terminal",
  "Set-top Box",
];

// Track used MAC addresses to ensure uniqueness
const usedMACs = new Set();
const generateMAC = () => {
  let mac;
  let attempts = 0;
  do {
    // Use a wider range and include hex characters for more uniqueness
    const octet1 = randomInt(0, 255);
    const octet2 = randomInt(0, 255);
    const octet3 = randomInt(0, 255);
    mac = `00:1B:44:${octet1
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()}:${octet2
      .toString(16)
      .padStart(2, "0")
      .toUpperCase()}:${octet3.toString(16).padStart(2, "0").toUpperCase()}`;
    attempts++;
    if (attempts > 1000) {
      // Fallback: use timestamp-based MAC if too many collisions
      const timestamp = Date.now();
      mac = `00:1B:44:${((timestamp >> 16) & 0xff)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase()}:${((timestamp >> 8) & 0xff)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase()}:${(timestamp & 0xff)
        .toString(16)
        .padStart(2, "0")
        .toUpperCase()}`;
      break;
    }
  } while (usedMACs.has(mac));
  usedMACs.add(mac);
  return mac;
};

// Random date within a specific month of a specific year (capped at MAX_SEED_DATE)
const generateRandomDateInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let randomDay = randomInt(1, daysInMonth);

  // If this is November 2025, cap the day at 12
  if (year === 2025 && month === 11) {
    randomDay = Math.min(randomDay, 12);
  }

  const randomHour = randomInt(9, 18);
  const randomMinute = randomInt(0, 59);
  const generatedDate = new Date(
    year,
    month - 1,
    randomDay,
    randomHour,
    randomMinute
  );

  // Ensure the date doesn't exceed MAX_SEED_DATE
  return generatedDate > MAX_SEED_DATE ? MAX_SEED_DATE : generatedDate;
};

// Unique invoice number
const generateInvoiceNumber = (companyId, customerId, date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `INV-${companyId}-${customerId}-${year}${month}${day}-${randomInt(
    1000,
    9999
  )}`;
};

const sanitizePhone = (v) => {
  if (v === null || v === undefined) return null;
  let s = String(v);
  // Remove non-digits
  s = s.replace(/\D/g, "");
  if (s.length > 12) s = s.slice(-12);
  return s || null;
};

// Maximum date for seed data - all transactions should be before or on this date
const MAX_SEED_DATE = new Date("2025-11-12");
const now = new Date();
// Use the earlier of today or MAX_SEED_DATE
const effectiveNow = now > MAX_SEED_DATE ? MAX_SEED_DATE : now;
const monthsBackCount = 18; // varied months/years

const monthsBack = Array.from({ length: monthsBackCount }, (_, i) => {
  const d = new Date(
    effectiveNow.getFullYear(),
    effectiveNow.getMonth() - i,
    1
  );
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}).reverse();

// ============ SEED ============
const seedDatabase = async () => {
  try {
    console.log("Syncing database and dropping all tables...");
    await sequelize.sync({ force: true });
    console.log("Database synced and all tables dropped!");

    // --- 1. Features ---
    console.log("Seeding Features...");
    const features = await models.Feature.bulkCreate([
      // Super Admin
      {
        code: "superadmin.dashboard.view",
        name: "View Super Admin Dashboard",
        module: "Dashboard",
      },
      { code: "company.manage", name: "Manage Companies", module: "Companies" },
      {
        code: "superadmin.users.manage",
        name: "Manage All Users",
        module: "Users",
      },

      // Admin
      {
        code: "admin.dashboard.view",
        name: "View Admin Dashboard",
        module: "Dashboard",
      },
      { code: "agent.manage", name: "Manage Agents", module: "Users" },
      { code: "plan.manage", name: "Manage Plans", module: "Billing" },
      { code: "customers.view", name: "View Customers", module: "Customers" },
      { code: "plans.view", name: "View Plans", module: "Plans" },
      { code: "agents.view", name: "View Agents", module: "Agents" },
      { code: "reports.view", name: "View Reports", module: "Reports" },
      { code: "payments.view", name: "View Payments", module: "Payments" },
      { code: "customer.add", name: "Add Customer", module: "Customers" },
      { code: "customer.edit", name: "Edit Customer", module: "Customers" },
      {
        code: "customer.view.all",
        name: "View All Customers",
        module: "Customers",
      },
      { code: "customer.delete", name: "Delete Customer", module: "Customers" },
      { code: "area.manage", name: "Manage Areas", module: "Areas" },
      {
        code: "subscription.manage",
        name: "Manage Subscriptions",
        module: "Billing",
      },
      { code: "invoice.manage", name: "Manage Invoices", module: "Billing" },

      // Agent
      {
        code: "agent.dashboard.view",
        name: "View Agent Dashboard",
        module: "Dashboard",
      },
      {
        code: "collection.manage",
        name: "Manage Collections",
        module: "Billing",
      },
      {
        code: "collection.view",
        name: "View Collection",
        module: "Collection",
      },
      {
        code: "customer.view.one",
        name: "View Single Customer",
        module: "Customers",
      },
      { code: "payment.collect", name: "Collect Payments", module: "Payments" },
      {
        code: "customer.hardware.view",
        name: "View Customer Hardware",
        module: "Customers",
      },
      {
        code: "customer.balance-history.view",
        name: "View Customer Balance History",
        module: "Customers",
      },
    ]);
    const featureMap = features.reduce(
      (map, feature) => ((map[feature.code] = feature.id), map),
      {}
    );
    console.log("Features seeded.");

    // --- 2. Roles ---
    console.log("Seeding Roles...");
    const roles = await models.Role.bulkCreate([
      {
        name: "Super Admin",
        code: "SUPER_ADMIN",
        description: "Full system access with company management capabilities",
      },
      {
        name: "Admin",
        code: "ADMIN",
        description: "Company-level administrative access",
      },
      {
        name: "Agent",
        code: "AGENT",
        description: "Field agent with customer and collection access",
      },
    ]);
    const roleMap = roles.reduce(
      (map, role) => ((map[role.code] = role.id), map),
      {}
    );
    console.log("Roles seeded.");

    // --- 3. Company ---
    console.log("Seeding Company...");
    const company = await models.Company.create({
      name: "Nexus Telecom",
      address: "123 Fiber Optic Lane, Network City",
    });
    console.log("Company seeded.");

    // --- 4. Users ---
    console.log("Seeding Users...");
    const superAdmin = await models.User.create({
      name: "Super Admin",
      email: "super@admin.com",
      phone: "0000000000",
      passwordHash: "supersecret123",
      roleId: roleMap["SUPER_ADMIN"],
      companyId: null,
    });

    // Areas from embedded list (or fallback)
    console.log("Seeding Areas...");
    const areaNames = EXCEL_AREA_NAMES.length
      ? EXCEL_AREA_NAMES
      : ["North Zone", "South Zone", "East Zone", "West Zone", "Central Zone"];
    const areas = await models.Area.bulkCreate(
      areaNames.map((name) => ({
        areaName: name,
        companyId: company.id,
        createdBy: superAdmin.id,
      }))
    );
    console.log(`Areas seeded. (${areas.length})`);

    // company admins
    const adminNames = [
      "Rajesh Kumar",
      "Priya Sharma",
      "Amit Patel",
      "Neha Reddy",
      "Suresh Verma",
    ];
    const admins = [];
    for (let i = 0; i < adminNames.length; i++) {
      const name = adminNames[i];
      admins.push(
        await models.User.create({
          name,
          email: `admin${i + 1}@nexustelecom.com`,
          phone: `987654321${i}`,
          passwordHash: "adminpass123",
          roleId: roleMap["ADMIN"],
          companyId: company.id,
        })
      );
    }

    // company agents
    const agentNames = [
      "Kavita Singh",
      "Ramesh Gupta",
      "Anjali Malhotra",
      "Vikram Kapoor",
      "Pooja Joshi",
      "Arun Chopra",
      "Meera Mehra",
      "Sanjay Saxena",
      "Divya Tiwari",
      "Mohan Yadav",
      "Rashmi Kaur",
      "Krishna Khan",
      "Swati Ahmed",
      "Deepak Hussain",
      "Nisha Ali",
      "Prakash Pandey",
      "Anita Mishra",
      "Sunil Dubey",
      "Reena Chauhan",
      "Vijay Tomar",
    ];
    const agents = [];
    for (let i = 0; i < agentNames.length; i++) {
      const name = agentNames[i];
      agents.push(
        await models.User.create({
          name,
          email: `agent${i + 1}@nexustelecom.com`,
          phone: `876543210${String(i + 1).padStart(2, "0")}`,
          passwordHash: "agentpass123",
          roleId: roleMap["AGENT"],
          companyId: company.id,
        })
      );
    }
    console.log("Users seeded.");

    // --- 5. Permissions ---
    console.log("Granting Permissions...");
    const rolePermissions = [];

    features.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["SUPER_ADMIN"], featureId: f.id })
    );

    // Grant all features to ADMIN except superadmin and company management
    const adminFeatures = features.filter(
      (f) =>
        !f.code.startsWith("superadmin.") &&
        !f.code.startsWith("company.manage")
    );
    adminFeatures.forEach((f) =>
      rolePermissions.push({ roleId: roleMap["ADMIN"], featureId: f.id })
    );

    // Also grant balance history to agents if they need it
    if (featureMap["customer.balance-history.view"]) {
      rolePermissions.push({
        roleId: roleMap["AGENT"],
        featureId: featureMap["customer.balance-history.view"],
      });
    }

    [
      "agent.dashboard.view",
      "collection.manage",
      "collection.view",
      "customer.view.one",
      "customer.add",
      "payment.collect",
      "customer.hardware.view",
    ].forEach((code) => {
      if (featureMap[code])
        rolePermissions.push({
          roleId: roleMap["AGENT"],
          featureId: featureMap[code],
        });
    });
    await models.RolePermission.bulkCreate(rolePermissions);
    console.log("Permissions granted.");

    // --- 6. Plans ---
    console.log("Seeding Plans...");
    const planNames = EXCEL_PLAN_NAMES.length
      ? EXCEL_PLAN_NAMES
      : [
          "Basic 50Mbps",
          "Standard 100Mbps",
          "Premium 300Mbps",
          "Pro 500Mbps",
          "Gigabit 1Gbps",
        ];
    const plans = await models.Plan.bulkCreate(
      planNames.map((name, idx) => {
        const priceBands = [
          500, 750, 1000, 1200, 1500, 1800, 2000, 2500, 3000, 3500, 4000, 4500,
          5000,
        ];
        const price = priceBands[randomInt(0, priceBands.length - 1)];
        const code =
          "PLAN-" +
          name
            .replace(/[^A-Za-z0-9]+/g, "-")
            .toUpperCase()
            .replace(/^-|-$/g, "") +
          "-" +
          String(idx + 1).padStart(2, "0");
        return {
          companyId: company.id,
          name,
          monthlyPrice: price, // integer
          code,
        };
      })
    );
    console.log(`Plans seeded. (${plans.length})`);

    // --- 7. Customers + related data ---
    console.log("Seeding Customers and related data...");
    const areasArr = await models.Area.findAll({
      where: { companyId: company.id },
    });

    const customersPayload = [];
    const excelCustomers = EXCEL_CUSTOMERS.length ? EXCEL_CUSTOMERS : [];
    const customersSource = excelCustomers.length
      ? excelCustomers
      : Array.from({ length: 30 }, (_, i) => ({
          fullName: `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`,
          phone: `9${randomInt(100000000, 999999999)}`,
          customerCode: `CUST-${String(i + 1).padStart(4, "0")}`,
          billingAddress: `${randomInt(100, 9999)} ${getRandomItem(
            streetNames
          )} ${getRandomItem(streetTypes)}`,
        }));

    for (let i = 0; i < customersSource.length; i++) {
      const src = customersSource[i];
      const name =
        src.fullName && String(src.fullName).trim().length
          ? src.fullName
          : `${getRandomItem(firstNames)} ${getRandomItem(lastNames)}`;
      const phone =
        sanitizePhone(src.phone) || `9${randomInt(100000000, 999999999)}`;
      const code =
        (src.customerCode && String(src.customerCode).trim()) ||
        `CUST-${String(i + 1).padStart(4, "0")}`;
      const billingAddress =
        (src.billingAddress && String(src.billingAddress).trim()) ||
        `${randomInt(100, 9999)} ${getRandomItem(streetNames)} ${getRandomItem(
          streetTypes
        )}`;
      const email = `${name.split(" ")[0].toLowerCase()}.${randomInt(
        100,
        999
      )}@${getRandomItem(domains)}`;
      const assignedAgent = getRandomItem(agents);
      const createdBy = getRandomItem(admins);
      const area = getRandomItem(areasArr);

      customersPayload.push({
        companyId: company.id,
        fullName: name,
        phone,
        email,
        address: billingAddress,
        customerCode: code,
        assignedAgentId: assignedAgent.id,
        createdBy: createdBy.id,
        installationDate: new Date(),
        areaId: area.id,
      });
    }

    // Update customers payload to have some inactive customers
    const now = new Date();
    const totalCustomers = customersPayload.length;

    // Make some customers inactive (about 10%)
    const inactiveCount = Math.floor(totalCustomers * 0.1);
    for (let i = 0; i < inactiveCount; i++) {
      customersPayload[i].isActive = false;
    }

    const customers = await models.Customer.bulkCreate(customersPayload);

    // Update some customers to be created this month (about 15%)
    // Use raw SQL to update createdAt since Sequelize manages timestamps
    const thisMonthCount = Math.floor(totalCustomers * 0.15);
    const customersToUpdate = customers.slice(
      inactiveCount,
      inactiveCount + thisMonthCount
    );
    for (const customer of customersToUpdate) {
      const randomDay = randomInt(1, now.getDate());
      const createdAtDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        randomDay
      );
      await sequelize.query(
        `UPDATE customers SET "createdAt" = :date WHERE id = :id`,
        {
          replacements: { date: createdAtDate, id: customer.id },
        }
      );
    }

    // ----- Hardware mapping from embedded rows -----
    const hardwareData = [];
    const custIndexByKey = new Map();
    for (const c of customers) {
      const codeKey = (c.customerCode || "").toUpperCase();
      if (codeKey) custIndexByKey.set(codeKey, c.id);
      const phoneNorm = sanitizePhone(c.phone) || "";
      custIndexByKey.set(`${(c.fullName || "").trim()}__${phoneNorm}`, c.id);
    }

    // Add Excel hardware
    for (const hw of EXCEL_HARDWARE) {
      const codeKey = (hw.matchCustomerCode || "").toUpperCase();
      const phoneNorm = sanitizePhone(hw.matchPhone) || "";
      const nameKey = `${(hw.matchName || "").trim()}__${phoneNorm}`;

      const cid = custIndexByKey.get(codeKey) || custIndexByKey.get(nameKey);
      if (!cid) continue;

      const deviceType =
        hw.router && hw.router.trim()
          ? hw.router.trim()
          : getRandomItem(deviceFallbackTypes);
      let mac = (hw.mac && hw.mac.trim()) || generateMAC();

      // Normalize MAC address format and ensure uniqueness
      if (mac) {
        // Remove all non-hex characters and convert to uppercase
        const cleanMac = mac.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
        // Reformat to standard MAC format (XX:XX:XX:XX:XX:XX)
        if (cleanMac.length === 12) {
          mac = `${cleanMac.slice(0, 2)}:${cleanMac.slice(
            2,
            4
          )}:${cleanMac.slice(4, 6)}:${cleanMac.slice(6, 8)}:${cleanMac.slice(
            8,
            10
          )}:${cleanMac.slice(10, 12)}`;
        } else {
          // If format is invalid, generate a new one
          mac = generateMAC();
        }
      } else {
        mac = generateMAC();
      }

      // Ensure uniqueness
      if (usedMACs.has(mac)) {
        mac = generateMAC();
      }
      usedMACs.add(mac);

      const ipAddress =
        (hw.ip && hw.ip.trim()) ||
        `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`;

      hardwareData.push({
        customerId: cid,
        deviceType,
        macAddress: mac,
        ipAddress,
      });

      if (Math.random() > 0.5) {
        hardwareData.push({
          customerId: cid,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `10.${randomInt(0, 254)}.${randomInt(0, 254)}.${randomInt(
            2,
            254
          )}`,
        });
      }
    }

    // Fill hardware for customers that still don't have any
    const customersWithHw = new Set(hardwareData.map((h) => h.customerId));
    for (const customer of customers) {
      if (!customersWithHw.has(customer.id)) {
        hardwareData.push({
          customerId: customer.id,
          deviceType: getRandomItem(deviceFallbackTypes),
          macAddress: generateMAC(),
          ipAddress: `192.168.${randomInt(0, 254)}.${randomInt(2, 254)}`,
        });
        if (Math.random() > 0.5) {
          hardwareData.push({
            customerId: customer.id,
            deviceType: getRandomItem(deviceFallbackTypes),
            macAddress: generateMAC(),
            ipAddress: `172.${randomInt(16, 31)}.${randomInt(
              0,
              254
            )}.${randomInt(2, 254)}`,
          });
        }
      }
    }

    // Track customer balances for sequential transaction creation
    const customerBalances = new Map();

    // Helper to get current balance for a customer
    const getCustomerBalance = (customerId) => {
      return customerBalances.get(customerId) || 0;
    };

    // Helper to update customer balance
    const updateCustomerBalance = (customerId, newBalance) => {
      customerBalances.set(customerId, newBalance);
    };

    // Subscriptions + Invoices + Payments
    // Prepare renewal date categories for dashboard stats
    // Use effectiveNow to ensure dates don't exceed MAX_SEED_DATE
    const today = new Date(
      effectiveNow.getFullYear(),
      effectiveNow.getMonth(),
      effectiveNow.getDate()
    );
    const currentMonthStart = new Date(
      effectiveNow.getFullYear(),
      effectiveNow.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      effectiveNow.getFullYear(),
      effectiveNow.getMonth() + 1,
      0
    );
    const nextMonthStart = new Date(
      effectiveNow.getFullYear(),
      effectiveNow.getMonth() + 1,
      1
    );

    let renewalIndex = 0;
    const renewalCategories = {
      today: [], // Renewals today
      thisMonth: [], // Renewals this month (but not today)
      nextMonth: [], // Renewals next month onwards
      expired: [], // Renewals in the past
    };

    // Distribute customers into renewal categories
    for (let i = 0; i < customers.length; i++) {
      const rand = Math.random();
      if (rand < 0.1) {
        renewalCategories.today.push(i);
      } else if (rand < 0.3) {
        renewalCategories.thisMonth.push(i);
      } else if (rand < 0.6) {
        renewalCategories.nextMonth.push(i);
      } else {
        renewalCategories.expired.push(i);
      }
    }

    for (let idx = 0; idx < customers.length; idx++) {
      const customer = customers[idx];
      const plan = getRandomItem(plans);

      // Determine renewal dates based on category
      let nextRenewalDate;
      let lastRenewalDate;
      const startDate = new Date(
        effectiveNow.getFullYear(),
        effectiveNow.getMonth() - randomInt(1, 6),
        randomInt(1, 15)
      );
      // Ensure startDate doesn't exceed MAX_SEED_DATE
      if (startDate > MAX_SEED_DATE) {
        startDate.setTime(MAX_SEED_DATE.getTime());
      }

      if (renewalCategories.today.includes(idx)) {
        // Renewal today
        nextRenewalDate = today;
        lastRenewalDate = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          today.getDate()
        );
      } else if (renewalCategories.thisMonth.includes(idx)) {
        // Renewal this month (but not today)
        const maxDay = Math.min(
          currentMonthEnd.getDate(),
          MAX_SEED_DATE.getDate()
        );
        const renewalDay = randomInt(1, maxDay);
        if (renewalDay < today.getDate()) {
          nextRenewalDate = new Date(
            effectiveNow.getFullYear(),
            effectiveNow.getMonth(),
            renewalDay
          );
          lastRenewalDate = new Date(
            effectiveNow.getFullYear(),
            effectiveNow.getMonth() - 1,
            renewalDay
          );
        } else {
          nextRenewalDate = new Date(
            effectiveNow.getFullYear(),
            effectiveNow.getMonth(),
            renewalDay
          );
          lastRenewalDate = new Date(
            effectiveNow.getFullYear(),
            effectiveNow.getMonth() - 1,
            renewalDay
          );
        }
      } else if (renewalCategories.nextMonth.includes(idx)) {
        // Renewal next month onwards - but cap at MAX_SEED_DATE
        const monthsAhead = randomInt(1, 3);
        const renewalDay = randomInt(1, 15);
        nextRenewalDate = new Date(
          effectiveNow.getFullYear(),
          effectiveNow.getMonth() + monthsAhead,
          renewalDay
        );
        // Cap at MAX_SEED_DATE
        if (nextRenewalDate > MAX_SEED_DATE) {
          nextRenewalDate = new Date(MAX_SEED_DATE);
        }
        lastRenewalDate = new Date(
          effectiveNow.getFullYear(),
          effectiveNow.getMonth() + monthsAhead - 1,
          renewalDay
        );
        // Cap at MAX_SEED_DATE
        if (lastRenewalDate > MAX_SEED_DATE) {
          lastRenewalDate = new Date(MAX_SEED_DATE);
          lastRenewalDate.setMonth(lastRenewalDate.getMonth() - 1);
        }
      } else {
        // Expired renewal (past date)
        const daysPast = randomInt(1, 30);
        nextRenewalDate = new Date(today);
        nextRenewalDate.setDate(nextRenewalDate.getDate() - daysPast);
        lastRenewalDate = new Date(nextRenewalDate);
        lastRenewalDate.setMonth(lastRenewalDate.getMonth() - 1);
      }

      // Ensure both dates don't exceed MAX_SEED_DATE
      if (nextRenewalDate > MAX_SEED_DATE) {
        nextRenewalDate = new Date(MAX_SEED_DATE);
      }
      if (lastRenewalDate > MAX_SEED_DATE) {
        lastRenewalDate = new Date(MAX_SEED_DATE);
        lastRenewalDate.setMonth(lastRenewalDate.getMonth() - 1);
      }

      const createdSub = await models.Subscription.create({
        companyId: company.id,
        customerId: customer.id,
        planId: plan.id,
        startDate: startDate,
        nextRenewalDate: nextRenewalDate.toISOString().split("T")[0],
        lastRenewalDate: lastRenewalDate
          ? lastRenewalDate.toISOString().split("T")[0]
          : null,
        agreedMonthlyPrice: plan.monthlyPrice,
        billingType: getRandomItem(["PREPAID", "POSTPAID"]),
        billingCycle: getRandomItem(["MONTHLY", "DAILY"]),
        billingCycleValue: 1,
        additionalCharge: Math.random() > 0.7 ? randomInt(100, 500) : 0,
        discount: Math.random() > 0.8 ? randomInt(50, 200) : 0,
        status: customer.isActive
          ? "ACTIVE"
          : Math.random() > 0.5
          ? "PAUSED"
          : "CANCELLED",
      });

      for (const { year, month } of monthsBack) {
        // Skip months that are after November 2025
        if (year > 2025 || (year === 2025 && month > 11)) {
          continue;
        }

        const periodStart = new Date(year, month - 1, 1);
        let periodEnd = new Date(year, month, 0);
        // If this is November 2025, cap periodEnd at Nov 12
        if (year === 2025 && month === 11) {
          periodEnd = new Date(2025, 10, 12);
        }
        // Ensure periodEnd doesn't exceed MAX_SEED_DATE
        if (periodEnd > MAX_SEED_DATE) {
          periodEnd = new Date(MAX_SEED_DATE);
        }

        const maxDueDay = year === 2025 && month === 11 ? 12 : 22;
        const dueDate = new Date(year, month - 1, randomInt(10, maxDueDay));
        // Cap dueDate at MAX_SEED_DATE
        if (dueDate > MAX_SEED_DATE) {
          dueDate.setTime(MAX_SEED_DATE.getTime());
        }

        const amount = plan.monthlyPrice; // integer
        const tax = Math.round(amount * 0.18);
        const total = Math.round(amount + tax);

        const isPaid = Math.random() > 0.35;

        let invoiceDate = new Date(year, month - 1, 1);
        // Cap invoiceDate at MAX_SEED_DATE
        if (invoiceDate > MAX_SEED_DATE) {
          invoiceDate = new Date(MAX_SEED_DATE);
        }
        const invoiceNumber = generateInvoiceNumber(
          company.id,
          customer.id,
          invoiceDate
        );

        // Build invoice items array
        const invoiceItems = [
          {
            name: `${plan.name} - Monthly Service`,
            itemType: "INTERNET_SERVICE",
            description: `${plan.name} - Monthly Service`,
            quantity: 1,
            unitPrice: amount,
            totalAmount: amount,
          },
        ];

        let additionalAmount = 0;
        if (Math.random() > 0.6) {
          const additionalServices = [
            {
              type: "ROUTER_INSTALLATION",
              description: "Router Installation Service",
              price: 800,
            },
            {
              type: "EQUIPMENT_CHARGE",
              description: "Equipment Charge",
              price: 500,
            },
            {
              type: "ADJUSTMENT",
              description: "Service Adjustment",
              price: 400,
            },
            {
              type: "OTHER",
              description: "Additional Service Fee",
              price: 300,
            },
          ];
          const additionalService = getRandomItem(additionalServices);
          additionalAmount = additionalService.price;
          invoiceItems.push({
            name: additionalService.description,
            itemType: additionalService.type,
            description: additionalService.description,
            quantity: 1,
            unitPrice: additionalService.price,
            totalAmount: additionalService.price,
          });
        }

        if (Math.random() > 0.7) {
          const lateFee = 200;
          additionalAmount += lateFee;
          invoiceItems.push({
            name: "Late Payment Fee",
            itemType: "LATE_FEE",
            description: "Late Payment Fee",
            quantity: 1,
            unitPrice: lateFee,
            totalAmount: lateFee,
          });
        }

        const finalTotal = total + additionalAmount;
        const prevBalance = getCustomerBalance(customer.id);
        const balanceBefore = prevBalance;
        const balanceAfter = balanceBefore + finalTotal;

        // Create transaction for invoice first
        const invoiceTransaction = await models.Transaction.create({
          companyId: company.id,
          customerId: customer.id,
          type: "INVOICE",
          direction: "DEBIT",
          amount: finalTotal,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `Subscription invoice ${
            periodStart.toISOString().split("T")[0]
          } to ${periodEnd.toISOString().split("T")[0]}`,
          referenceType: "invoice",
          transactionDate: invoiceDate,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        });

        // Create invoice document
        const createdInvoice = await models.Invoice.create({
          transactionId: invoiceTransaction.id,
          invoiceNumber: invoiceNumber,
          type: "SUBSCRIPTION",
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: createdSub.id,
          periodStart: periodStart.toISOString().split("T")[0],
          periodEnd: periodEnd.toISOString().split("T")[0],
          subtotal: amount + additionalAmount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: finalTotal,
          prevBalance: prevBalance > 0 ? prevBalance : null,
          items: invoiceItems,
          dueDate: dueDate.toISOString().split("T")[0],
          isActive: true,
        });

        // Update transaction reference
        await invoiceTransaction.update({ referenceId: createdInvoice.id });

        // Update customer balance
        updateCustomerBalance(customer.id, balanceAfter);

        if (isPaid) {
          let collectionDate = generateRandomDateInMonth(year, month);
          // Ensure collectionDate doesn't exceed MAX_SEED_DATE
          if (collectionDate > MAX_SEED_DATE) {
            collectionDate = new Date(MAX_SEED_DATE);
          }
          const paymentBalanceBefore = getCustomerBalance(customer.id);
          const paymentBalanceAfter = Math.max(
            0,
            paymentBalanceBefore - finalTotal
          );

          // Create transaction for payment first
          const paymentTransaction = await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            direction: "CREDIT",
            amount: finalTotal,
            balanceBefore: paymentBalanceBefore,
            balanceAfter: paymentBalanceAfter,
            description: `Payment of ₹${finalTotal} via ${getRandomItem([
              "UPI",
              "CASH",
              "BHIM",
              "PhonePe",
              "CARD",
            ])}`,
            referenceType: "payment",
            transactionDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });

          // Create payment document
          const payment = await models.Payment.create({
            transactionId: paymentTransaction.id,
            paymentNumber: generatePaymentNumber(),
            companyId: company.id,
            customerId: customer.id,
            invoiceId: createdInvoice.id,
            amount: finalTotal,
            discount: 0,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            comments: `Payment collected for invoice ${invoiceNumber}`,
            isActive: true,
          });

          // Update transaction reference
          await paymentTransaction.update({ referenceId: payment.id });

          // Update customer balance
          updateCustomerBalance(customer.id, paymentBalanceAfter);
        }

        // Add some balance adjustments and add-on bills
        if (Math.random() > 0.8) {
          const shouldAdjust = Math.random() > 0.5;

          if (shouldAdjust) {
            // Balance adjustment
            const adjustmentAmount = randomInt(100, 500);
            const currentBalance = getCustomerBalance(customer.id);
            const newBalance = currentBalance - adjustmentAmount; // Credit adjustment

            let adjustmentDate = new Date(year, month - 1, randomInt(15, 28));
            // Cap adjustment date at MAX_SEED_DATE
            if (adjustmentDate > MAX_SEED_DATE) {
              adjustmentDate = new Date(MAX_SEED_DATE);
            }

            const adjustmentTransaction = await models.Transaction.create({
              companyId: company.id,
              customerId: customer.id,
              type: "BALANCE_ADJUSTMENT",
              direction: "CREDIT",
              amount: adjustmentAmount,
              balanceBefore: currentBalance,
              balanceAfter: Math.max(0, newBalance),
              description: `Balance adjustment of ₹${adjustmentAmount} for ${customer.fullName}`,
              referenceType: "invoice",
              transactionDate: adjustmentDate,
              createdBy: getRandomItem(admins).id,
              isActive: true,
            });

            const adjustmentInvoice = await models.Invoice.create({
              transactionId: adjustmentTransaction.id,
              invoiceNumber: generateInvoiceNumber(
                company.id,
                customer.id,
                adjustmentDate
              ),
              type: "ADJUSTED",
              companyId: company.id,
              customerId: customer.id,
              subscriptionId: null,
              periodStart: null,
              periodEnd: null,
              subtotal: 0,
              taxAmount: 0,
              discounts: 0,
              amountTotal: adjustmentAmount,
              prevBalance: currentBalance,
              items: [
                {
                  name: "Balance Adjustment",
                  itemType: "ADJUSTMENT",
                  description: `Balance adjustment of ₹${adjustmentAmount}`,
                  quantity: 1,
                  unitPrice: -adjustmentAmount,
                  totalAmount: -adjustmentAmount,
                },
              ],
              dueDate: adjustmentDate.toISOString().split("T")[0],
              isActive: true,
            });

            await adjustmentTransaction.update({
              referenceId: adjustmentInvoice.id,
            });
            updateCustomerBalance(customer.id, Math.max(0, newBalance));
          } else {
            // Add-on bill
            const addOnTypes = [
              {
                type: "ROUTER_INSTALLATION",
                description: "Router Installation Service",
                price: randomInt(500, 1500),
              },
              {
                type: "EQUIPMENT_CHARGE",
                description: "Equipment Charge",
                price: randomInt(1000, 3000),
              },
              {
                type: "LATE_FEE",
                description: "Late Payment Fee",
                price: randomInt(100, 500),
              },
              {
                type: "OTHER",
                description: "Additional Service Fee",
                price: randomInt(100, 1000),
              },
            ];
            const addOn = getRandomItem(addOnTypes);
            const currentBalance = getCustomerBalance(customer.id);
            const newBalance = currentBalance + addOn.price;

            let addOnDate = new Date(year, month - 1, randomInt(15, 28));
            // Cap add-on date at MAX_SEED_DATE
            if (addOnDate > MAX_SEED_DATE) {
              addOnDate = new Date(MAX_SEED_DATE);
            }

            const addOnTransaction = await models.Transaction.create({
              companyId: company.id,
              customerId: customer.id,
              type: "ADD_ON_BILL",
              direction: "DEBIT",
              amount: addOn.price,
              balanceBefore: currentBalance,
              balanceAfter: newBalance,
              description: `Add on bill: ${addOn.description}`,
              referenceType: "invoice",
              transactionDate: addOnDate,
              createdBy: getRandomItem(admins).id,
              isActive: true,
            });

            const addOnInvoice = await models.Invoice.create({
              transactionId: addOnTransaction.id,
              invoiceNumber: generateInvoiceNumber(
                company.id,
                customer.id,
                addOnDate
              ),
              type: "ADJUSTED",
              companyId: company.id,
              customerId: customer.id,
              subscriptionId: null,
              periodStart: null,
              periodEnd: null,
              subtotal: addOn.price,
              taxAmount: 0,
              discounts: 0,
              amountTotal: addOn.price,
              prevBalance: null,
              items: [
                {
                  name: addOn.description,
                  itemType: addOn.type,
                  description: addOn.description,
                  quantity: 1,
                  unitPrice: addOn.price,
                  totalAmount: addOn.price,
                },
              ],
              dueDate: addOnDate.toISOString().split("T")[0],
              isActive: true,
            });

            await addOnTransaction.update({ referenceId: addOnInvoice.id });
            updateCustomerBalance(customer.id, newBalance);
          }
        }
      }
    }

    await models.CustomerHardware.bulkCreate(hardwareData);

    // --- Additional current-month collections (varied dates) ---
    console.log("Adding additional current-month collection data...");
    const currentYear = effectiveNow.getFullYear();
    const currentMonth = effectiveNow.getMonth() + 1;

    const extraCustomers = customers.slice(0, Math.min(15, customers.length));
    for (const customer of extraCustomers) {
      const plan = getRandomItem(plans);
      const subscription = await models.Subscription.findOne({
        where: { customerId: customer.id },
      });
      const days = [1, 5, 10, 15, 20, 25, 28, 30].filter((d) => {
        const date = new Date(currentYear, currentMonth - 1, d);
        return date <= MAX_SEED_DATE;
      });

      for (const day of days) {
        if (Math.random() > 0.4) {
          let periodStart = new Date(currentYear, currentMonth - 1, 1);
          let periodEnd = new Date(currentYear, currentMonth, 0);
          // If this is November 2025, cap periodEnd at Nov 12
          if (currentYear === 2025 && currentMonth === 11) {
            periodEnd = new Date(2025, 10, 12);
          }
          // Ensure periodEnd doesn't exceed MAX_SEED_DATE
          if (periodEnd > MAX_SEED_DATE) {
            periodEnd = new Date(MAX_SEED_DATE);
          }

          let dueDate = new Date(currentYear, currentMonth - 1, 15);
          // Cap dueDate at MAX_SEED_DATE
          if (dueDate > MAX_SEED_DATE) {
            dueDate = new Date(MAX_SEED_DATE);
          }

          const amount = plan.monthlyPrice;
          const tax = Math.round(amount * 0.18);
          const total = Math.round(amount + tax);

          let invoiceDate = new Date(currentYear, currentMonth - 1, 1);
          // Cap invoiceDate at MAX_SEED_DATE
          if (invoiceDate > MAX_SEED_DATE) {
            invoiceDate = new Date(MAX_SEED_DATE);
          }
          const invoiceNumber = generateInvoiceNumber(
            company.id,
            customer.id,
            invoiceDate
          );

          const prevBalance = getCustomerBalance(customer.id);
          const balanceBefore = prevBalance;
          const balanceAfter = balanceBefore + total;

          // Create transaction for invoice first
          const invoiceTransaction = await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "INVOICE",
            direction: "DEBIT",
            amount: total,
            balanceBefore: balanceBefore,
            balanceAfter: balanceAfter,
            description: `Subscription invoice ${
              periodStart.toISOString().split("T")[0]
            } to ${periodEnd.toISOString().split("T")[0]}`,
            referenceType: "invoice",
            transactionDate: invoiceDate,
            createdBy: getRandomItem(admins).id,
            isActive: true,
          });

          // Create invoice document
          const createdInvoice = await models.Invoice.create({
            transactionId: invoiceTransaction.id,
            invoiceNumber: invoiceNumber,
            type: "SUBSCRIPTION",
            companyId: company.id,
            customerId: customer.id,
            subscriptionId: subscription.id,
            periodStart: periodStart.toISOString().split("T")[0],
            periodEnd: periodEnd.toISOString().split("T")[0],
            subtotal: amount,
            taxAmount: tax,
            discounts: 0,
            amountTotal: total,
            prevBalance: prevBalance > 0 ? prevBalance : null,
            items: [
              {
                name: `${plan.name} - Monthly Service`,
                itemType: "INTERNET_SERVICE",
                description: `${plan.name} - Monthly Service`,
                quantity: 1,
                unitPrice: amount,
                totalAmount: amount,
              },
            ],
            dueDate: dueDate.toISOString().split("T")[0],
            isActive: true,
          });

          await invoiceTransaction.update({ referenceId: createdInvoice.id });
          updateCustomerBalance(customer.id, balanceAfter);

          let collectionDate = new Date(
            currentYear,
            currentMonth - 1,
            day,
            randomInt(9, 18),
            randomInt(0, 59)
          );
          // Cap collectionDate at MAX_SEED_DATE
          if (collectionDate > MAX_SEED_DATE) {
            collectionDate = new Date(MAX_SEED_DATE);
          }

          const paymentBalanceBefore = getCustomerBalance(customer.id);
          const paymentBalanceAfter = Math.max(0, paymentBalanceBefore - total);

          // Create transaction for payment first
          const paymentTransaction = await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            direction: "CREDIT",
            amount: total,
            balanceBefore: paymentBalanceBefore,
            balanceAfter: paymentBalanceAfter,
            description: `Payment of ₹${total} via ${getRandomItem([
              "UPI",
              "CASH",
              "BHIM",
              "PhonePe",
              "CARD",
            ])}`,
            referenceType: "payment",
            transactionDate: collectionDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });

          // Create payment document
          const payment = await models.Payment.create({
            transactionId: paymentTransaction.id,
            paymentNumber: generatePaymentNumber(),
            companyId: company.id,
            customerId: customer.id,
            invoiceId: createdInvoice.id,
            amount: total,
            discount: 0,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            collectedBy: customer.assignedAgentId,
            collectedAt: collectionDate,
            comments: `Additional ${periodStart.toLocaleString("default", {
              month: "long",
            })} payment for invoice ${invoiceNumber}`,
            isActive: true,
          });

          await paymentTransaction.update({ referenceId: payment.id });
          updateCustomerBalance(customer.id, paymentBalanceAfter);
        }
      }
    }

    // --- Add today's payments for dashboard stats ---
    console.log("Adding today's payment data...");
    const todayCustomers = customers.slice(0, Math.min(10, customers.length));
    for (const customer of todayCustomers) {
      if (Math.random() > 0.5) {
        const subscription = await models.Subscription.findOne({
          where: { customerId: customer.id },
        });
        if (!subscription) continue;

        const plan = await models.Plan.findByPk(subscription.planId);
        if (!plan) continue;

        // Create a pending invoice first
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);

        const amount = plan.monthlyPrice;
        const tax = Math.round(amount * 0.18);
        const total = Math.round(amount + tax);

        const invoiceDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const invoiceNumber = generateInvoiceNumber(
          company.id,
          customer.id,
          invoiceDate
        );

        const prevBalance = getCustomerBalance(customer.id);
        const balanceBefore = prevBalance;
        const balanceAfter = balanceBefore + total;

        // Create transaction for invoice first
        const invoiceTransaction = await models.Transaction.create({
          companyId: company.id,
          customerId: customer.id,
          type: "INVOICE",
          direction: "DEBIT",
          amount: total,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `Subscription invoice ${
            periodStart.toISOString().split("T")[0]
          } to ${periodEnd.toISOString().split("T")[0]}`,
          referenceType: "invoice",
          transactionDate: invoiceDate,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        });

        // Create invoice document
        const pendingInvoice = await models.Invoice.create({
          transactionId: invoiceTransaction.id,
          invoiceNumber: invoiceNumber,
          type: "SUBSCRIPTION",
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: subscription.id,
          periodStart: periodStart.toISOString().split("T")[0],
          periodEnd: periodEnd.toISOString().split("T")[0],
          subtotal: amount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: total,
          prevBalance: prevBalance > 0 ? prevBalance : null,
          items: [
            {
              name: `${plan.name} - Monthly Service`,
              itemType: "INTERNET_SERVICE",
              description: `${plan.name} - Monthly Service`,
              quantity: 1,
              unitPrice: amount,
              totalAmount: amount,
            },
          ],
          dueDate: dueDate.toISOString().split("T")[0],
          isActive: true,
        });

        await invoiceTransaction.update({ referenceId: pendingInvoice.id });
        updateCustomerBalance(customer.id, balanceAfter);

        // Create payment for today (some invoices will be paid, some remain pending)
        if (Math.random() > 0.4) {
          const todayHour = randomInt(9, 18);
          const todayMinute = randomInt(0, 59);
          const todayPaymentDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            todayHour,
            todayMinute
          );

          const paymentBalanceBefore = getCustomerBalance(customer.id);
          const paymentBalanceAfter = Math.max(0, paymentBalanceBefore - total);

          // Create transaction for payment first
          const paymentTransaction = await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            direction: "CREDIT",
            amount: total,
            balanceBefore: paymentBalanceBefore,
            balanceAfter: paymentBalanceAfter,
            description: `Payment of ₹${total} via ${getRandomItem([
              "UPI",
              "CASH",
              "BHIM",
              "PhonePe",
              "CARD",
            ])}`,
            referenceType: "payment",
            transactionDate: todayPaymentDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });

          // Create payment document
          const payment = await models.Payment.create({
            transactionId: paymentTransaction.id,
            paymentNumber: generatePaymentNumber(),
            companyId: company.id,
            customerId: customer.id,
            invoiceId: pendingInvoice.id,
            amount: total,
            discount: 0,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            collectedBy: customer.assignedAgentId,
            collectedAt: todayPaymentDate,
            comments: `Payment collected today for invoice ${invoiceNumber}`,
            isActive: true,
          });

          await paymentTransaction.update({ referenceId: payment.id });
          updateCustomerBalance(customer.id, paymentBalanceAfter);
        }
      }
    }

    // --- Ensure we have some pending invoices for pendingAmount calculation ---
    console.log("Adding pending invoices...");
    const todayForPending = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const pendingCustomers = customers.slice(
      10,
      Math.min(25, customers.length)
    );
    for (const customer of pendingCustomers) {
      if (Math.random() > 0.6) {
        const subscription = await models.Subscription.findOne({
          where: { customerId: customer.id },
        });
        if (!subscription) continue;

        const plan = await models.Plan.findByPk(subscription.planId);
        if (!plan) continue;

        // Create pending/partially paid invoices
        const periodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const dueDate = new Date(now.getFullYear(), now.getMonth() - 1, 15);

        const amount = plan.monthlyPrice;
        const tax = Math.round(amount * 0.18);
        const total = Math.round(amount + tax);

        const invoiceDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const invoiceNumber = generateInvoiceNumber(
          company.id,
          customer.id,
          invoiceDate
        );

        const prevBalance = getCustomerBalance(customer.id);
        const balanceBefore = prevBalance;
        const balanceAfter = balanceBefore + total;

        // Create transaction for invoice first
        const invoiceTransaction = await models.Transaction.create({
          companyId: company.id,
          customerId: customer.id,
          type: "INVOICE",
          direction: "DEBIT",
          amount: total,
          balanceBefore: balanceBefore,
          balanceAfter: balanceAfter,
          description: `Subscription invoice ${
            periodStart.toISOString().split("T")[0]
          } to ${periodEnd.toISOString().split("T")[0]}`,
          referenceType: "invoice",
          transactionDate: invoiceDate,
          createdBy: getRandomItem(admins).id,
          isActive: true,
        });

        // Create invoice document
        const pendingInvoice = await models.Invoice.create({
          transactionId: invoiceTransaction.id,
          invoiceNumber: invoiceNumber,
          type: "SUBSCRIPTION",
          companyId: company.id,
          customerId: customer.id,
          subscriptionId: subscription.id,
          periodStart: periodStart.toISOString().split("T")[0],
          periodEnd: periodEnd.toISOString().split("T")[0],
          subtotal: amount,
          taxAmount: tax,
          discounts: 0,
          amountTotal: total,
          prevBalance: prevBalance > 0 ? prevBalance : null,
          items: [
            {
              name: `${plan.name} - Monthly Service`,
              itemType: "INTERNET_SERVICE",
              description: `${plan.name} - Monthly Service`,
              quantity: 1,
              unitPrice: amount,
              totalAmount: amount,
            },
          ],
          dueDate: dueDate.toISOString().split("T")[0],
          isActive: true,
        });

        await invoiceTransaction.update({ referenceId: pendingInvoice.id });
        updateCustomerBalance(customer.id, balanceAfter);

        const isPartiallyPaid = Math.random() > 0.5;
        const paymentAmount = isPartiallyPaid ? Math.floor(total * 0.5) : 0;

        if (isPartiallyPaid) {
          const paymentDate = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            randomInt(16, 25)
          );

          const paymentBalanceBefore = getCustomerBalance(customer.id);
          const paymentBalanceAfter = Math.max(
            0,
            paymentBalanceBefore - paymentAmount
          );

          // Create transaction for payment first
          const paymentTransaction = await models.Transaction.create({
            companyId: company.id,
            customerId: customer.id,
            type: "PAYMENT",
            direction: "CREDIT",
            amount: paymentAmount,
            balanceBefore: paymentBalanceBefore,
            balanceAfter: paymentBalanceAfter,
            description: `Payment of ₹${paymentAmount} via ${getRandomItem([
              "UPI",
              "CASH",
              "BHIM",
              "PhonePe",
              "CARD",
            ])}`,
            referenceType: "payment",
            transactionDate: paymentDate,
            createdBy: customer.assignedAgentId,
            isActive: true,
          });

          // Create payment document
          const payment = await models.Payment.create({
            transactionId: paymentTransaction.id,
            paymentNumber: generatePaymentNumber(),
            companyId: company.id,
            customerId: customer.id,
            invoiceId: pendingInvoice.id,
            amount: paymentAmount,
            discount: 0,
            method: getRandomItem(["UPI", "CASH", "BHIM", "PhonePe", "CARD"]),
            collectedBy: customer.assignedAgentId,
            collectedAt: paymentDate,
            comments: `Partial payment for invoice ${invoiceNumber}`,
            isActive: true,
          });

          await paymentTransaction.update({ referenceId: payment.id });
          updateCustomerBalance(customer.id, paymentBalanceAfter);
        }
      }
    }

    console.log("All data seeded.");
    console.log("\n✅ Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Failed to seed database:", error);
  } finally {
    await sequelize.close();
  }
};

seedDatabase();
